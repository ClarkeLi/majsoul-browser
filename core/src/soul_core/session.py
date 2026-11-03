"""Core 会话：帧 -> 状态机 -> 推理队列 -> 推荐/intent，以及 intent 生命周期。

线程模型：调用方线程（stdin 读取）只做解码与状态更新，推理放在独立线程，
两者用队列连接，帧处理路径上不会同步等待 Mortal。
所有对外消息通过 ``emit(dict)`` 发出（由 ipc 层序列化为 NDJSON）。
"""
from __future__ import annotations

import base64
import queue
import random
import threading
import time
from dataclasses import dataclass

from .decision.decide import build_decision
from .game.state import GameState, Output
from .inference.client import WorkerClient, WorkerError
from .protocol import METHODS, LiqiProto, MsgType, expand_sync_game
from .protocol.outgoing import OPERATION_METHODS
from .records import GameRecorder
from . import review as review_mod

CONFIRM_WAIT_S = 1.5
MAX_CONSECUTIVE_FAILURES = 2
# 只是“这一下没点上”的暂停：下一局开始时自动恢复（模型反复失败、用户急停等不会自动恢复）
TRANSIENT_PAUSES = frozenset({"unconfirmed", "mismatch", "click_failed", "manual", "stale"})
# 这类暂停在下一次轮到操作（下一个 ActionPrototype）时就自动恢复，不必等下一局、也不用手动点“继续”；
# 但连续失败这么多次（中间没有一次被游戏确认的点击）就说明点击位置/环境有问题，停住等下一局或手动恢复，避免一直乱点
MAX_AUTO_RECOVER = 3
# 切到自动时接手当前决策：至少留这么多时间给点击
TAKEOVER_MIN_LEFT_MS = 1800


@dataclass
class _Job:
    out: Output
    revision: int
    seat: int | None
    received_at: float = 0.0


class Session:
    def __init__(self, emit, clock=time.monotonic, rng=random.uniform):
        self.emit = emit
        self.clock = clock
        self.rng = rng
        self.state = GameState()
        self.protos: dict[str, LiqiProto] = {}
        self.mode = "off"                     # off | assist | auto
        self.paused_reason: str | None = None  # 自动模式被系统暂停（失败关闭）
        self.model_path: str | None = None
        self.device = "cpu"
        self.worker: WorkerClient | None = None
        self.failures = 0
        self.click_fail_streak = 0             # 连续“没点上”的次数；有一次被确认就清零
        self.intent: dict | None = None        # 当前有效 intent
        self._last: dict | None = None         # 最近一次可执行的决策（切到自动 / 恢复时接手）
        self.intent_status = "none"            # pending | executing | clicked | confirmed
        self.retried = False
        self.frames = 0
        self.decisions = 0
        self.recorder = GameRecorder(None, False)
        self._pending_model: tuple[str, str] | None = None
        self.records_dir: str | None = None
        # 打牌风格（掷骰 + 爱赌）。Desktop 启动时用 config 下发；Core 自己默认关闭（完全按模型）
        self.style: dict = {"dice": False, "gamble": False, "arb": False}
        self.style_rng = random.Random()
        self._q: queue.Queue[_Job | None] = queue.Queue()
        self._lock = threading.RLock()
        self._timer: threading.Timer | None = None
        self._thread = threading.Thread(target=self._infer_loop, name="infer", daemon=True)
        self._thread.start()

    # ------------------------------------------------------------ 命令入口

    def handle_command(self, msg: dict) -> bool:
        """处理一条 Electron -> Core 命令。返回 False 表示应退出。"""
        t = msg.get("t")
        if t == "frame":
            self.on_frame(msg["conn"], msg["dir"], msg["b64"])
        elif t == "ws.open":
            self.protos[msg["conn"]] = LiqiProto()
        elif t == "ws.close":
            self.protos.pop(msg["conn"], None)
        elif t == "mode.set":
            self.set_mode(msg["mode"])
        elif t == "auto.pause":
            with self._lock:
                self.paused_reason = msg.get("reason") or "paused"
                self._cancel_intent(self.paused_reason)
            self._status()
        elif t == "auto.resume":
            with self._lock:
                self.paused_reason = None
                self.click_fail_streak = 0
                self._takeover()
            self._status()
        elif t == "config":
            self.records_dir = msg.get("records_dir")
            self.recorder.configure(self.records_dir, bool(msg.get("records_enabled", True)))
            if "style" in msg:
                st = msg["style"]
                if isinstance(st, dict):              # {"dice","gamble","arb"} 分别开关
                    self.style = {k: bool(st.get(k, False)) for k in ("dice", "gamble", "arb")}
                else:
                    on = bool(st)
                    self.style = {"dice": on, "gamble": on, "arb": on}
        elif t == "review.list":
            self.emit({"t": "review.list", "games": review_mod.list_games(self.records_dir) if self.records_dir else []})
        elif t == "stats.get":
            self.emit({"t": "stats", **(review_mod.stats(self.records_dir) if self.records_dir else review_mod.stats(None))})
        elif t == "review.get":
            from pathlib import Path
            p = Path(self.records_dir or "") / Path(msg["file"]).name
            self.emit({"t": "review.game", **review_mod.summarize(p)} if p.exists() else {"t": "error", "code": "review_missing", "message": msg["file"], "hint": ""})
        elif t == "model.activate":
            self.activate_model(msg["path"], msg.get("device", "cpu"))
        elif t == "action.begin":
            self.on_action_begin(msg["actionId"])
        elif t == "action.result":
            self.on_action_result(msg["actionId"], bool(msg.get("ok")), msg.get("error"))
        elif t == "shutdown":
            self.shutdown()
            return False
        return True

    # ------------------------------------------------------------ 模式 / 模型

    def set_mode(self, mode: str) -> None:
        if mode not in ("off", "assist", "auto"):
            return
        with self._lock:
            self.mode = mode
            if mode != "auto" or self.paused_reason:
                self._cancel_intent("mode")
            if mode == "auto":
                self.paused_reason = None if self.failures < MAX_CONSECUTIVE_FAILURES else self.paused_reason
                self._takeover()
        self._status()

    def activate_model(self, path: str, device: str = "cpu") -> None:
        """切换模型。对局进行中只登记，在下一次重建 worker（下一局 authGame/syncGame/失步恢复）时生效。"""
        self.failures = 0
        in_game = self.state.phase == "in_game" and self.worker is not None
        if in_game:
            self._pending_model = (path, device)
            self.emit({"t": "model.status", "state": "ready", "path": path, "device": device, "pending": True})
            return
        self._swap_model(path, device)
        self.emit({"t": "model.status", "state": "ready", "path": path, "device": device})

    def _swap_model(self, path: str, device: str) -> None:
        self.model_path, self.device = path, device
        self._pending_model = None
        if self.worker:
            self.worker.stop()
        self.worker = WorkerClient(path, device)

    def _status(self) -> None:
        s = self.state
        self.emit({"t": "session.status", "phase": s.phase, "reason": s.desync_reason,
                   "mode": self.mode, "paused": self.paused_reason,
                   "model": "ready" if self.worker else "none"})

    # ------------------------------------------------------------ 帧

    def on_frame(self, conn: str, direction: str, b64: str) -> None:
        self.frames += 1
        proto = self.protos.setdefault(conn, LiqiProto())
        try:
            r = proto.parse(base64.b64decode(b64), direction == "out")
        except Exception as e:  # noqa: BLE001
            if self.state.phase == "in_game":
                self.state.mark_desynced(f"帧解析失败：{e!r}")
                self._cancel_intent("desync")
                self.emit({"t": "state", **self.state.snapshot()})
                self._status()
            return
        if direction == "out":
            if r.get("method") == ".lq.Lobby.startUnifiedMatch" and r["type"] == MsgType.Req:
                self.emit({"t": "lobby.match", "match_sid": (r.get("data") or {}).get("match_sid", "")})
            self._observe_out(r)
            return
        if r.get("method") == ".lq.NotifyMatchGameStart":
            self.emit({"t": "lobby.matched", "mode_id": (r.get("data") or {}).get("match_mode_id")})
        method, data = r["method"], r["data"]
        if method not in METHODS:
            return
        name = None
        if method == ".lq.ActionPrototype":
            if r["type"] != MsgType.Notify:
                return
            name, data = data.get("name"), data.get("data") or {}
        elif method == ".lq.FastTest.syncGame":
            data = {"sync_game_actions": expand_sync_game(data)}
        elif r["type"] == MsgType.Req:
            return
        self._dispatch(method, name, data)

    def _dispatch(self, method: str, name: str | None, data: dict) -> None:
        with self._lock:
            if method == ".lq.ActionPrototype":
                self._cancel_intent("stale")       # 任何新的 ActionPrototype 使旧 intent 作废
            prev_phase = self.state.phase
            out = self.state.handle(method, name, data)
            rev = self.state.revision
            if (method == ".lq.FastTest.authGame" or name == "ActionNewRound") and self.paused_reason in TRANSIENT_PAUSES:
                self.paused_reason = None             # 新的一局：上一局“没点上”的暂停不再适用
                self.click_fail_streak = 0
                self._status()
            elif (method == ".lq.ActionPrototype" and self.paused_reason in TRANSIENT_PAUSES
                  and self.click_fail_streak < MAX_AUTO_RECOVER):
                # 牌局往前走了一步（这一手已过去）：自动恢复，接下来的决策照常执行
                self.emit({"t": "log", "code": "auto_recovered", "reason": self.paused_reason, "streak": self.click_fail_streak})
                self.paused_reason = None
                self._status()
            if out.stop_worker:
                self._cancel_intent("stale")          # 终局：还没点出去的操作作废，绝不点到结算页上
                self._last = None
            if method == ".lq.NotifyGameEndResult":
                self.emit({"t": "game.end", "rank": self.state.final_rank})
            if method == ".lq.FastTest.authGame" and self.state.phase == "in_game":
                self.recorder.start(self.state.game_uuid, self.state.self_seat)
            elif out.stop_worker:
                if method == ".lq.NotifyGameEndResult":
                    self.recorder.result(self.state.final_rank)
                self.recorder.close()
            for ev in out.events:
                self.recorder.event(rev, ev)
            if self.state.phase == "desynced":
                self._cancel_intent("desync")
            self.emit({"t": "state", **self.state.snapshot()})
            if self.state.phase != prev_phase or method in (".lq.FastTest.authGame",):
                self._status()
            if out.events or out.restart_seat is not None or out.stop_worker:
                self._q.put(_Job(out, rev, self.state.self_seat, self.clock()))

    # ------------------------------------------------------------ 推理线程

    def _infer_loop(self) -> None:
        while True:
            job = self._q.get()
            if job is None:
                return
            try:
                self._run_job(job)
            except Exception as e:  # noqa: BLE001
                self.emit({"t": "error", "code": "infer_crash", "message": repr(e), "hint": ""})

    def _fail(self, job: _Job, msg: str) -> None:
        self.failures += 1
        with self._lock:
            self.state.mark_desynced(msg)
            if self.failures >= MAX_CONSECUTIVE_FAILURES and self.mode == "auto":
                self.paused_reason = "model_failed"
        self.emit({"t": "error", "code": "worker_failed", "message": msg, "hint": "下一局将自动重建推理进程"})
        self.emit({"t": "state", **self.state.snapshot()})
        self._status()

    def _run_job(self, job: _Job) -> None:
        out = job.out
        if out.stop_worker:
            if self.worker:
                self.worker.stop()
            self.emit({"t": "recommendation", "revision": job.revision, "clear": True})
            return
        if self.worker is None:
            if out.events:
                self.emit({"t": "model.status", "state": "none"})
            return
        try:
            if out.restart_seat is not None:
                if self._pending_model:
                    self._swap_model(*self._pending_model)
                    self.emit({"t": "model.status", "state": "ready", "path": self.model_path, "device": self.device})
                self.worker.start(out.restart_seat)
                self.worker.send({"type": "start_game", "names": ["P0", "P1", "P2", "P3"],
                                  "id": out.restart_seat})
            last = None
            for i, ev in enumerate(out.events):
                reaction, ms = self.worker.send(ev)
                if reaction and i >= out.decide_from:
                    last = (reaction, ev, ms)
            self.failures = 0
        except WorkerError as e:
            self._fail(job, str(e))
            return
        if last is None:
            return
        self._publish(job, *last)

    def _publish(self, job: _Job, reaction: dict, event: dict, ms: float) -> None:
        with self._lock:
            if self.state.revision != job.revision or self.state.phase != "in_game":
                self.emit({"t": "log", "code": "stale_or_illegal", "revision": job.revision})
                return
            d = build_decision(self.state, reaction, event, ms, job.revision, self.clock(),
                               elapsed_s=self.clock() - job.received_at, fresh_round=job.out.fresh_round, rng=self.rng,
                               style=self.style, style_rng=self.style_rng)
            self.decisions += 1
            self.emit({"t": "recommendation", **d["recommendation"], "reject": d["reject"]})
            self.recorder.rec(job.revision, d["recommendation"], d["alts_all"])
            intent = d["intent"]
            self._last = None if intent is None else {"intent": intent, "published_at": self.clock()}
            if intent is None:
                if d["reject"]:
                    self.emit({"t": "log", "code": "stale_or_illegal", "reason": d["reject"],
                               "revision": job.revision})
                return
            if self.mode == "auto" and not self.paused_reason:
                self.intent, self.intent_status, self.retried = intent, "pending", False
                self.emit({"t": "intent", **intent})

    # ------------------------------------------------------------ intent 生命周期

    def _takeover(self) -> None:
        """刚切到自动（或恢复）时：如果当前正有一个还没执行的决策，立刻接手，不必等到下一巡。"""
        last = self._last
        if (self.mode != "auto" or self.paused_reason or self.intent is not None or last is None
                or self.state.phase != "in_game" or last["intent"]["revision"] != self.state.revision):
            return
        it = last["intent"]
        since_ms = (self.clock() - last["published_at"]) * 1000     # 发布推荐之后又过了多久
        left = it["ttl_ms"] - since_ms                                # 这一手还剩多少时间
        if left < TAKEOVER_MIN_LEFT_MS:
            return
        # 原定的思考时间还没到就按原计划等；已经过了就稍等一下立刻点（人刚点了“自动”）
        delay = max(250.0, min(float(it.get("delay_ms") or 0) - since_ms, left - TAKEOVER_MIN_LEFT_MS))
        from .decision.decide import new_action_id
        fresh = {**it, "actionId": new_action_id(), "delay_ms": round(delay), "ttl_ms": int(left)}
        self.intent, self.intent_status, self.retried = fresh, "pending", False
        self.emit({"t": "intent", **fresh})

    def _cancel_intent(self, why: str) -> None:
        it, self.intent = self.intent, None
        if it is not None:
            self.recorder.exec(it["actionId"], why)
        self.intent_status = "none"
        self._clear_timer()
        if it is not None:
            self.emit({"t": "intent.status", "actionId": it["actionId"], "status": why})

    def _clear_timer(self) -> None:
        if self._timer:
            self._timer.cancel()
            self._timer = None

    def on_action_begin(self, action_id: str) -> None:
        with self._lock:
            if self.intent and self.intent["actionId"] == action_id and self.state.revision == self.intent["revision"]:
                self.intent_status = "executing"
            else:
                self.emit({"t": "intent.status", "actionId": action_id, "status": "stale"})

    def on_action_result(self, action_id: str, ok: bool, error: str | None) -> None:
        with self._lock:
            if not self.intent or self.intent["actionId"] != action_id:
                return
            if not ok:
                self._pause("click_failed", action_id)
                return
            if self.intent_status == "confirmed":
                return
            self.intent_status = "clicked"
            self._clear_timer()
            self._timer = threading.Timer(CONFIRM_WAIT_S, self._on_confirm_timeout, args=(action_id,))
            self._timer.daemon = True
            self._timer.start()

    def _on_confirm_timeout(self, action_id: str) -> None:
        with self._lock:
            it = self.intent
            if not it or it["actionId"] != action_id or self.intent_status == "confirmed":
                return
            if it["idempotent"] and not self.retried:
                self.retried = True
                self.intent_status = "pending"
                self.emit({"t": "intent.status", "actionId": action_id, "status": "retry"})
                self.emit({"t": "intent", **it})
                return
            self._pause("unconfirmed", action_id)

    def _pause(self, reason: str, action_id: str) -> None:
        if reason in TRANSIENT_PAUSES:
            self.click_fail_streak += 1
        self.paused_reason = reason
        self._cancel_intent(reason)
        self._status()

    def _observe_out(self, r: dict) -> None:
        """客户端发出的操作请求：用于确认点击，或识别用户手动操作。"""
        if r["type"] != MsgType.Req or r["method"] not in OPERATION_METHODS:
            return
        with self._lock:
            self._last = None                        # 这一手已经有人操作了（我们或你），不再接手
            it = self.intent
            if it is None or self.intent_status not in ("executing", "clicked"):
                if it is not None:
                    self._cancel_intent("manual")        # 不是我们的点击触发的操作
                return
            if self._matches(it, r["method"], r["data"]):
                self.intent_status = "confirmed"
                self.click_fail_streak = 0
                self.recorder.exec(it["actionId"], "confirmed")
                self._clear_timer()
                self.emit({"t": "intent.status", "actionId": it["actionId"], "status": "confirmed"})
            else:
                self._pause("mismatch", it["actionId"])

    @staticmethod
    def _matches(it: dict, method: str, data: dict) -> bool:
        kind = it["kind"]
        if kind == "pass":
            return bool(data.get("cancel_operation"))
        return data.get("type") == it["op_type"]

    # ------------------------------------------------------------ 关闭

    def drain(self, timeout: float = 10.0) -> None:
        """测试用：等待推理队列清空。"""
        end = time.time() + timeout
        while not self._q.empty() and time.time() < end:
            time.sleep(0.01)
        time.sleep(0.05)

    def shutdown(self) -> None:
        self.recorder.close()
        self._clear_timer()
        self._q.put(None)
        if self.worker:
            self.worker.stop()
