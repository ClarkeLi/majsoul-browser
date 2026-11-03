"""失败关闭（PLAN §9 M4）：模型挂掉、帧异常、revision 过期、窗口暂停时，绝不产生未经确认的点击意图。"""
import base64
import json
import random

from soul_core.inference.client import WorkerError
from soul_core.session import Session
from tests.test_session import FIX, FakeWorker, feed, make, types


class DyingWorker(FakeWorker):
    def __init__(self, die_after=2):
        super().__init__()
        self.n, self.die_after = 0, die_after

    def send(self, ev, timeout=5):
        self.n += 1
        if self.n > self.die_after:
            raise WorkerError("推理进程已退出")
        return super().send(ev, timeout)


def test_worker_death_desyncs_and_blocks_intents():
    s, out = make("auto")
    s.worker = DyingWorker(die_after=1)
    for _ in feed(s, "full_game"):
        pass
    assert s.state.phase == "desynced"
    assert any(m["t"] == "error" and m["code"] == "worker_failed" for m in out)
    assert not types(out, "intent") or s.intent is None


def test_two_consecutive_failures_disable_auto():
    s, out = make("auto")
    s.worker = DyingWorker(die_after=0)
    for _ in feed(s, "full_game"):
        pass
    assert s.failures >= 2 and s.paused_reason == "model_failed"
    assert not types(out, "intent")


def test_garbage_frame_in_game_desyncs():
    s, out = make("auto")
    s._dispatch(".lq.FastTest.authGame", None, {"seat_list": [10001, 2, 3, 4], "game_uuid": "g"})
    s.state.my_account_id = 10001
    s.state.phase = "in_game"
    s.on_frame("c1", "in", base64.b64encode(b"\x03\xff\xff garbage").decode())
    assert s.state.phase == "desynced"
    s.shutdown()


def test_no_model_never_intends():
    out = []
    s = Session(out.append)
    s.mode = "auto"
    for _ in feed(s, "full_game"):
        pass
    assert not types(out, "intent")
    s.shutdown()


def test_paused_blocks_new_intents_until_resume():
    s, out = make("auto")
    s.paused_reason = "minimized"
    for _ in feed(s, "full_game"):
        pass
    assert not types(out, "intent")
    s.shutdown()


def test_chaos_never_emits_unsafe_intent():
    """随机：丢消息 / 重复消息 / 杀 worker / 切模式 / 暂停恢复。任何 intent 都必须满足：自动模式、未暂停、局内、revision 最新。"""
    violations = []
    for seed in range(8):
        rnd = random.Random(seed)
        out = []
        s = Session(lambda m: (out.append(m), m["t"] == "intent" and (
            s.mode != "auto" or s.paused_reason or s.state.phase != "in_game" or m["revision"] != s.state.revision)
            and violations.append((seed, m["actionId"]))))
        s.worker = FakeWorker()
        s.mode = "auto"
        lines = [json.loads(l) for l in (FIX / "full_game.bridge.jsonl").read_text().splitlines() if l.strip()]
        for m in lines:
            r = rnd.random()
            if r < 0.08:
                continue                                    # 丢消息
            if r < 0.14:
                s._dispatch(m["method"], m.get("name"), m.get("data") or {})   # 重复消息
            if r < 0.22:
                s.worker = DyingWorker(die_after=0)         # 杀 worker
            elif r < 0.30:
                s.worker = FakeWorker()
            if r > 0.9:
                s.set_mode(rnd.choice(["off", "assist", "auto"]))
            if 0.5 < r < 0.55:
                s.handle_command({"t": "auto.pause", "reason": "chaos"})
            if 0.55 < r < 0.6:
                s.handle_command({"t": "auto.resume"})
            s._dispatch(m["method"], m.get("name"), m.get("data") or {})
            s.drain(5)
        s.shutdown()
    assert violations == []
