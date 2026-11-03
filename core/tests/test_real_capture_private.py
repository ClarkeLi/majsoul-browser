"""用真实对局抓包（含账号信息，不进 Git）端到端回放。文件不存在时自动跳过。

把数据目录里的 records/frames-*.jsonl 复制成 tests/fixtures/real/private-*.jsonl 即可。
"""
import base64
import json
from pathlib import Path

import pytest

from soul_core.session import Session
from tests.test_session import FakeWorker

FILES = sorted((Path(__file__).parent / "fixtures/real").glob("private-*.jsonl"))
pytestmark = pytest.mark.skipif(not FILES, reason="没有私有真实抓包")


@pytest.mark.parametrize("path", FILES, ids=lambda p: p.name)
def test_real_capture_never_desyncs_and_recommends(path):
    out = []
    s = Session(out.append)
    s.worker = FakeWorker()
    s.mode = "assist"
    desync_reasons = []
    for line in path.read_text().splitlines():
        o = json.loads(line)
        if o["ev"] != "frame":
            continue
        s.on_frame(o["conn"], o["dir"], o["b64"])
        if s.state.phase == "desynced":
            desync_reasons.append(s.state.desync_reason)
            s.state.phase = "in_game"
        s.drain(5)
    s.shutdown()
    assert desync_reasons == []
    assert not [m for m in out if m["t"] == "error"]
