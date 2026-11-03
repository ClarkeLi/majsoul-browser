"""用 S1 FrameTap 抓到的真实帧（雀魂路由网关）验证 Core 解码。"""
import base64
import json
from pathlib import Path

from soul_core.protocol import LiqiProto, MsgType

FIX = Path(__file__).parent / "fixtures/real/s1-route-gateway.jsonl"


def test_decode_real_gateway_capture():
    protos, seq = {}, []
    for line in FIX.read_text().splitlines():
        o = json.loads(line)
        if o["ev"] != "frame" or o["opcode"] != 2:
            continue
        p = protos.setdefault(o["conn"], LiqiProto())
        r = p.parse(base64.b64decode(o["b64"]), o["dir"] == "out")
        seq.append((o["dir"], r["type"], r["method"]))
    assert seq[0] == ("out", MsgType.Req, ".lq.Route.requestConnection")
    assert seq[1] == ("in", MsgType.Res, ".lq.Route.requestConnection")
    # 之后是成对的心跳
    assert all(m == ".lq.Route.heartbeat" for _, _, m in seq[2:])
    assert all(p.res_type == {} for p in protos.values()) or len(seq) % 2 == 1
