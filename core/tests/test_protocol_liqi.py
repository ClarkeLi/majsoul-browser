"""liqi 帧解码：Notify（XOR 内层）、Req/Res 配对。"""
import base64
import struct

import pytest

from soul_core.protocol import LiqiProto, MsgType, decode, pb
from soul_core.protocol.basic_pb2 import BaseMessage


def encode(data: bytes) -> bytes:  # decode 是对合：同一个 XOR 再做一次
    return decode(data)


def req_frame(index: int, method: str, body: bytes) -> bytes:
    return bytes([2]) + struct.pack("<H", index) + BaseMessage(method_name=method, data=body).SerializeToString()


def res_frame(index: int, body: bytes) -> bytes:
    return bytes([3]) + struct.pack("<H", index) + BaseMessage(method_name="", data=body).SerializeToString()


def test_xor_is_involution():
    raw = bytes(range(40))
    assert encode(encode(raw)) == raw


def test_notify_action_prototype():
    inner = pb.ActionDiscardTile(seat=2, tile="5p", moqie=True).SerializeToString()
    outer = pb.ActionPrototype(step=3, name="ActionDiscardTile", data=encode(inner)).SerializeToString()
    frame = bytes([1]) + BaseMessage(method_name=".lq.ActionPrototype", data=outer).SerializeToString()
    r = LiqiProto().parse(frame, from_client=False)
    assert r["type"] == MsgType.Notify and r["method"] == ".lq.ActionPrototype"
    assert r["data"]["name"] == "ActionDiscardTile"
    assert r["data"]["data"]["tile"] == "5p" and r["data"]["data"]["seat"] == 2


def test_req_res_pairing():
    p = LiqiProto()
    method = ".lq.FastTest.syncGame"
    r1 = p.parse(req_frame(7, method, pb.ReqSyncGame(round_id="abc").SerializeToString()), True)
    assert r1["type"] == MsgType.Req and r1["data"]["round_id"] == "abc"
    r2 = p.parse(res_frame(7, pb.ResSyncGame(step=5).SerializeToString()), False)
    assert r2["type"] == MsgType.Res and r2["method"] == method and r2["data"]["step"] == 5
    assert 7 not in p.res_type


def test_res_without_req_raises():
    with pytest.raises(KeyError):
        LiqiProto().parse(res_frame(9, b""), False)


def test_duplicate_req_index_raises():
    p = LiqiProto()
    f = req_frame(1, ".lq.FastTest.syncGame", pb.ReqSyncGame().SerializeToString())
    p.parse(f, True)
    with pytest.raises(ValueError):
        p.parse(f, True)
