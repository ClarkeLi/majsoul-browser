"""新状态机必须与旧 Bridge 对同一输入产生完全相同的 MJAI 事件流。"""
import json
from pathlib import Path

import pytest

from soul_core.game.state import GameState

FIX = Path(__file__).parent / "fixtures/synthetic"


def replay(name: str):
    gs, events = GameState(), []
    for line in (FIX / f"{name}.bridge.jsonl").read_text().splitlines():
        if not line.strip():
            continue
        m = json.loads(line)
        out = gs.handle(m["method"], m.get("name"), m.get("data") or {})
        assert gs.phase != "desynced", (gs.desync_reason, m)
        if out.restart_seat is not None:
            events.append({"type": "start_game", "names": ["P0", "P1", "P2", "P3"], "id": out.restart_seat})
        events.extend(out.events)
    return gs, events


@pytest.mark.parametrize("name", ["full_game", "happy_round"])
def test_events_match_legacy(name):
    gs, events = replay(name)
    want = [json.loads(l) for l in (FIX / f"{name}.mjai.jsonl").read_text().splitlines()]
    assert events == want
