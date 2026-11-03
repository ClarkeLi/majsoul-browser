import json

from soul_core import review
from soul_core.session import Session
from tests.test_session import FakeWorker, feed, types


def rows_sample():
    alts = [{"id": "9s", "kind": "discard", "p": 0.8, "q": 1.0, "tile": "9s"},
            {"id": "2m", "kind": "discard", "p": 0.2, "q": -0.5, "tile": "2m"}]
    mk = lambda tile: {"k": "rec", "rev": 1, "rec": {"kind": "discard", "tile": tile, "confidence": 0.8, "latency_ms": 10}, "alts_all": alts}
    return [
        {"k": "start", "seat": 0, "uuid": "u", "t": 0},
        mk("9s"), {"k": "event", "rev": 2, "ev": {"type": "dahai", "actor": 0, "pai": "9s", "tsumogiri": True}},
        mk("9s"), {"k": "event", "rev": 3, "ev": {"type": "dahai", "actor": 0, "pai": "2m", "tsumogiri": False}},
        mk("9s"), {"k": "event", "rev": 4, "ev": {"type": "dahai", "actor": 1, "pai": "1m", "tsumogiri": False}},
    ]


def test_decisions_agree_and_q_loss(tmp_path):
    ds = review.decisions(rows_sample())
    assert [d["agree"] for d in ds] == [True, False, False][:len(ds)]
    assert ds[1]["q_loss"] == 1.5 and ds[0]["q_loss"] == 0.0


def test_summarize_and_top_mistakes(tmp_path):
    p = tmp_path / "g.jsonl"
    p.write_text("\n".join(json.dumps(r) for r in rows_sample()))
    s = review.summarize(p)
    assert s["decisions"] == len(s["items"]) and s["top_mistakes"][0]["q_loss"] == 1.5
    assert review.list_games(tmp_path)[0]["file"] == "g.jsonl"


def test_session_records_a_full_game(tmp_path):
    out = []
    s = Session(out.append)
    s.worker = FakeWorker()
    s.mode = "assist"
    s.handle_command({"t": "config", "records_dir": str(tmp_path), "records_enabled": True})
    for _ in feed(s, "full_game"):
        pass
    s.shutdown()
    files = list(tmp_path.glob("*.jsonl"))
    assert len(files) == 1
    kinds = {json.loads(l)["k"] for l in files[0].read_text().splitlines()}
    assert {"start", "event", "rec", "end"} <= kinds
    summary = review.summarize(files[0])
    assert summary["decisions"] > 0


def test_records_disabled_writes_nothing(tmp_path):
    out = []
    s = Session(out.append)
    s.worker = FakeWorker()
    s.handle_command({"t": "config", "records_dir": str(tmp_path), "records_enabled": False})
    for _ in feed(s, "full_game"):
        pass
    s.shutdown()
    assert list(tmp_path.glob("*.jsonl")) == []


def test_review_commands_emit(tmp_path):
    out = []
    s = Session(out.append)
    s.handle_command({"t": "config", "records_dir": str(tmp_path), "records_enabled": True})
    (tmp_path / "x.jsonl").write_text("\n".join(json.dumps(r) for r in rows_sample()))
    s.handle_command({"t": "review.list"})
    assert types(out, "review.list")[0]["games"][0]["file"] == "x.jsonl"
    s.handle_command({"t": "review.get", "file": "x.jsonl"})
    assert types(out, "review.game")[0]["decisions"] >= 1
    s.shutdown()
