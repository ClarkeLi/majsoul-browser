import json

from soul_core import review
from soul_core.game.state import GameState
from soul_core.session import Session
from tests.test_review import rows_sample
from tests.test_session import FakeWorker, FIX, feed, types


def write(p, rows):
    p.write_text("\n".join(json.dumps(r) for r in rows))


def test_final_rank_from_game_end_result():
    gs = GameState()
    gs.self_seat, gs.phase = 2, "in_game"
    gs.handle(".lq.NotifyGameEndResult", None, {"result": {"players": [
        {"seat": 0, "total_point": 30000}, {"seat": 1, "total_point": 20000},
        {"seat": 2, "total_point": 25000}, {"seat": 3, "total_point": -5000}]}})
    assert gs.final_rank == 2


def test_stats_aggregate(tmp_path):
    rows = rows_sample() + [
        {"k": "event", "rev": 9, "ev": {"type": "start_kyoku", "bakaze": "E", "kyoku": 1, "honba": 0}},
        {"k": "event", "rev": 10, "ev": {"type": "reach", "actor": 0}},
        {"k": "event", "rev": 11, "ev": {"type": "hora", "actor": 0, "target": 0}},
        {"k": "event", "rev": 12, "ev": {"type": "start_kyoku", "bakaze": "E", "kyoku": 2, "honba": 0}},
        {"k": "event", "rev": 13, "ev": {"type": "hora", "actor": 2, "target": 0}},
        {"k": "result", "rank": 2}]
    write(tmp_path / "1.jsonl", rows)
    s = review.stats(tmp_path)
    assert s["games"] == 1 and s["avg_rank"] == 2.0
    assert s["win_rate"] == 0.5 and s["deal_in_rate"] == 0.5 and s["dist"]["riichi"] == 0.5
    assert review.stats(None)["games"] == 0 and review.stats(tmp_path / "missing")["avg_rank"] is None


def test_session_stats_command(tmp_path):
    out = []
    s = Session(out.append)
    s.handle_command({"t": "config", "records_dir": str(tmp_path), "records_enabled": True})
    write(tmp_path / "1.jsonl", rows_sample())
    s.handle_command({"t": "stats.get"})
    assert types(out, "stats")[0]["games"] == 1
    s.shutdown()
