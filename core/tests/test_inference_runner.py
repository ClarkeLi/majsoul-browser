"""新 runner 必须与旧原型 runner 逐行一致（golden 由旧 runner 在同一事件流上生成）。"""
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
MODEL = Path(os.environ.get("SOUL_TEST_MODEL", ROOT / "AI/models/mortal_s42.pth"))
FIX = Path(__file__).parent / "fixtures/synthetic"

pytestmark = pytest.mark.skipif(not MODEL.exists(), reason=f"开发模型不存在：{MODEL}")


def _run(events: list[str]) -> list[str]:
    p = subprocess.Popen(
        [sys.executable, "-m", "soul_core.inference.runner", "--model", str(MODEL),
         "--device", "cpu", "--player-id", "0"],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, bufsize=1)
    out = []
    for e in events:
        p.stdin.write(e + "\n"); p.stdin.flush()
        out.append(p.stdout.readline().rstrip("\n"))
    p.stdin.close()
    assert p.wait(timeout=30) == 0
    return out


def test_matches_legacy_golden():
    events = (FIX / "full_game.mjai.jsonl").read_text().splitlines()
    golden = (FIX / "full_game.reactions.golden.jsonl").read_text().splitlines()
    got = _run(events)
    assert len(got) == len(golden)
    for i, (g, w) in enumerate(zip(got, golden)):
        gj, wj = json.loads(g), json.loads(w)
        assert gj["type"] == wj["type"], f"event {i}: {g} != {w}"
        assert {k: v for k, v in gj.items() if k != "meta"} == {k: v for k, v in wj.items() if k != "meta"}, f"event {i}"


def test_strict_one_reply_per_event():
    got = _run(['{"type":"start_game","id":0}', '{"type":"start_game","id":0}'][:1])
    assert len(got) == 1 and json.loads(got[0])["type"] == "__none__"
