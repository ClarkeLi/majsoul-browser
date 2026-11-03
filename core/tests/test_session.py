"""Session：推荐、intent 生命周期（确认 / 手动接管 / 过期 / 失败关闭）。"""
import json
import os
from pathlib import Path

import pytest

from soul_core.decision.actions import ACTION_IDS
from soul_core.protocol import MsgType
from soul_core.session import Session

FIX = Path(__file__).parent / "fixtures/synthetic"


def mask_of(*ids):
    return sum(1 << ACTION_IDS.index(i) for i in ids)


class FakeWorker:
    """对自己的每次摸牌回 dahai（摸切），其余不回。"""

    def __init__(self, seat=0):
        self.seat, self.sent, self.alive_ = seat, [], True

    def start(self, seat):
        self.seat = seat

    def stop(self):
        pass

    def send(self, ev, timeout=5):
        self.sent.append(ev)
        if ev.get("type") == "tsumo" and ev.get("actor") == self.seat:
            pai = ev["pai"]
            other = "1m" if pai != "1m" else "2m"
            return {"type": "dahai", "actor": self.seat, "pai": pai, "tsumogiri": True,
                    "meta": {"q_values": [0.5, -1.0], "mask_bits": mask_of(*sorted([pai, other], key=ACTION_IDS.index)),
                             "shanten": 1}}, 3.0
        return None, 1.0


def feed(session, name):
    for line in (FIX / f"{name}.bridge.jsonl").read_text().splitlines():
        if line.strip():
            m = json.loads(line)
            session._dispatch(m["method"], m.get("name"), m.get("data") or {})
            session.drain()
            yield m


def make(mode="assist"):
    out = []
    s = Session(out.append)
    s.worker = FakeWorker()
    s.mode = mode
    return s, out


def types(out, t):
    return [m for m in out if m["t"] == t]


def test_recommendations_emitted_in_assist_mode_without_intent():
    s, out = make("assist")
    for _ in feed(s, "full_game"):
        pass
    recs = [r for r in types(out, "recommendation") if not r.get("clear")]
    assert recs and all(r["kind"] == "discard" for r in recs)
    assert not types(out, "intent")
    s.shutdown()


def test_auto_mode_emits_intent_with_plan_and_confirms():
    s, out = make("auto")
    for m in feed(s, "full_game"):
        its = types(out, "intent")
        if its:
            break
    it = its[0]
    assert it["kind"] == "discard" and it["steps"][0]["t"] == "hand"
    assert s.intent["actionId"] == it["actionId"]
    s.on_action_begin(it["actionId"])
    s._observe_out({"type": MsgType.Req, "method": ".lq.FastTest.inputOperation", "data": {"type": 1}})
    st = types(out, "intent.status")
    assert st[-1]["status"] == "confirmed"
    s.shutdown()


def test_manual_operation_cancels_intent():
    s, out = make("auto")
    for m in feed(s, "full_game"):
        if types(out, "intent"):
            break
    s._observe_out({"type": MsgType.Req, "method": ".lq.FastTest.inputOperation", "data": {"type": 1}})
    assert types(out, "intent.status")[-1]["status"] == "manual"
    assert s.intent is None
    s.shutdown()


def test_new_action_makes_intent_stale():
    s, out = make("auto")
    gen = feed(s, "full_game")
    for m in gen:
        if types(out, "intent"):
            break
    aid = types(out, "intent")[-1]["actionId"]
    next(gen)
    assert {"t": "intent.status", "actionId": aid, "status": "stale"} in out
    s.shutdown()


def test_unconfirmed_click_pauses_auto():
    s, out = make("auto")
    for m in feed(s, "full_game"):
        if types(out, "intent"):
            break
    it = s.intent
    s.on_action_begin(it["actionId"])
    s.on_action_result(it["actionId"], True, None)
    s._on_confirm_timeout(it["actionId"])           # 不是幂等动作（点手牌）：不重试，直接暂停
    assert s.paused_reason == "unconfirmed"
    assert types(out, "intent.status")[-1]["status"] == "unconfirmed"
    s.shutdown()


def test_click_failure_pauses_auto():
    s, out = make("auto")
    for m in feed(s, "full_game"):
        if types(out, "intent"):
            break
    it = s.intent
    s.on_action_result(it["actionId"], False, "boom")
    assert s.paused_reason == "click_failed"
    s.shutdown()


def test_click_failure_recovers_on_next_action():
    s, out = make("auto")
    for m in feed(s, "full_game"):
        if types(out, "intent"):
            break
    it = s.intent
    s.on_action_result(it["actionId"], False, "boom")
    assert s.paused_reason == "click_failed"
    s._dispatch(".lq.ActionPrototype", "ActionDiscardTile", {"seat": 1, "tile": "1m"})   # 牌局往前走了一步
    assert s.paused_reason is None
    assert [m for m in out if m["t"] == "log" and m.get("code") == "auto_recovered"]
    assert types(out, "session.status")[-1]["paused"] is None
    s.shutdown()


def test_repeated_click_failures_stay_paused_until_new_round():
    from soul_core.session import MAX_AUTO_RECOVER
    s, out = make("auto")
    s.click_fail_streak = MAX_AUTO_RECOVER
    s.paused_reason = "click_failed"
    s._dispatch(".lq.ActionPrototype", "ActionDiscardTile", {"seat": 1, "tile": "1m"})
    assert s.paused_reason == "click_failed"                 # 连续失败太多：不再自动恢复
    s._dispatch(".lq.ActionPrototype", "ActionNewRound", {})
    assert s.paused_reason is None and s.click_fail_streak == 0
    s.shutdown()


def test_non_transient_pause_is_not_auto_recovered():
    s, out = make("auto")
    s.handle_command({"t": "auto.pause", "reason": "minimized"})
    s._dispatch(".lq.ActionPrototype", "ActionDiscardTile", {"seat": 1, "tile": "1m"})
    assert s.paused_reason == "minimized"
    s.shutdown()


def test_three_player_disables_everything():
    s, out = make("auto")
    s._dispatch(".lq.FastTest.authGame", None, {"seat_list": [1, 2, 3], "game_uuid": "x"})
    s.drain()
    assert s.state.phase == "unsupported_mode"
    assert not types(out, "intent")
    s.shutdown()


@pytest.mark.skipif(not (Path(__file__).resolve().parents[2] / "AI/models/mortal_s42.pth").exists(), reason="no model")
def test_real_model_full_game_produces_recommendations():
    root = Path(__file__).resolve().parents[2]
    out = []
    s = Session(out.append)
    s.activate_model(str(root / "AI/models/mortal_s42.pth"))
    s.mode = "assist"
    for _ in feed(s, "full_game"):
        pass
    s.drain(30)
    recs = [r for r in types(out, "recommendation") if not r.get("clear") and r.get("kind")]
    assert recs, out[-5:]
    assert all(0 < r["confidence"] <= 1 for r in recs if r["confidence"] is not None)
    assert not [m for m in out if m["t"] == "error"], [m for m in out if m["t"] == "error"]
    s.shutdown()


def test_auto_pause_command_blocks_new_intents():
    s, out = make("auto")
    s.handle_command({"t": "auto.pause", "reason": "minimized"})
    for _ in feed(s, "full_game"):
        pass
    assert not types(out, "intent")
    assert types(out, "session.status")[-1]["paused"] == "minimized"
    s.handle_command({"t": "auto.resume"})
    assert s.paused_reason is None
    s.shutdown()


def test_model_switch_during_game_applies_on_next_restart():
    s, out = make("assist")
    s._dispatch(".lq.FastTest.authGame", None, {"seat_list": [10001, 2, 3, 4], "game_uuid": "g"})
    s.state.my_account_id = 10001
    s.state.phase = "in_game"
    old = s.worker
    s.activate_model("/tmp/new.pth", "cpu")
    assert s.worker is old and s._pending_model == ("/tmp/new.pth", "cpu")
    assert types(out, "model.status")[-1].get("pending") is True
    s.shutdown()


def test_recommendation_carries_click_steps_in_assist_mode():
    s, out = make("assist")
    for _ in feed(s, "full_game"):
        pass
    recs = [r for r in types(out, "recommendation") if r.get("kind")]
    assert recs and all(r.get("steps") for r in recs)
    assert recs[0]["steps"][0]["t"] == "hand"
    s.shutdown()


def test_switching_to_auto_takes_over_pending_decision():
    """辅助模式里已经给出推荐，这时点“自动”：立刻接手这一手，不用等到下一巡。"""
    s, out = make("assist")
    for m in feed(s, "full_game"):
        if [r for r in types(out, "recommendation") if r.get("kind") == "discard"]:
            break
    assert not types(out, "intent")
    s.handle_command({"t": "mode.set", "mode": "auto"})
    its = types(out, "intent")
    assert len(its) == 1 and its[0]["revision"] == s.state.revision
    assert 250 <= its[0]["delay_ms"] and its[0]["ttl_ms"] > 1800
    # 再切一次也不会重复下发
    s.handle_command({"t": "mode.set", "mode": "auto"})
    assert len(types(out, "intent")) == 1
    s.shutdown()


def test_takeover_skipped_after_someone_already_acted():
    s, out = make("assist")
    for m in feed(s, "full_game"):
        if [r for r in types(out, "recommendation") if r.get("kind") == "discard"]:
            break
    s._last = None                     # 等同于已经观察到一次出牌请求
    s.handle_command({"t": "mode.set", "mode": "auto"})
    assert not types(out, "intent")
    s.shutdown()


def test_transient_pause_clears_on_new_round_but_model_failure_does_not():
    s, out = make("auto")
    s.paused_reason = "unconfirmed"
    gen = feed(s, "full_game")
    for m in gen:
        if m.get("name") == "ActionNewRound":
            break
    assert s.paused_reason is None
    s.paused_reason = "model_failed"
    s._dispatch(".lq.ActionPrototype", "ActionNewRound", {})
    assert s.paused_reason == "model_failed"
    s.shutdown()


def test_game_end_cancels_pending_intent():
    s, out = make("auto")
    for m in feed(s, "full_game"):
        if types(out, "intent"):
            break
    aid = s.intent["actionId"]
    s._dispatch(".lq.NotifyGameEndResult", None, {"result": {"players": []}})
    assert s.intent is None
    assert {"t": "intent.status", "actionId": aid, "status": "stale"} in out
    assert types(out, "game.end")
    s.shutdown()
