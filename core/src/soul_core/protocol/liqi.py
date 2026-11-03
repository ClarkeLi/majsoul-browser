"""雀魂 liqi 协议解码（只读）。

输入是一帧 WebSocket 二进制负载 ``(bytes, from_client)``，输出
``{'id', 'type', 'method', 'data'}``。每个连接各自持有一个 :class:`LiqiProto`，
用 ``out`` 方向请求的 index 与 ``in`` 方向的响应配对。
源自 MajsoulMax（GPL-3.0）的 liqi_new.py，改为不依赖 mitmproxy。
"""
import base64
import json
from enum import Enum
from importlib import resources
from struct import unpack

from . import basic_pb2, pb
from .jsonfmt import to_dict

_RPC_MAP: dict | None = None


def load_rpc_map() -> dict:
    global _RPC_MAP
    if _RPC_MAP is None:
        _RPC_MAP = json.loads(resources.files(__package__).joinpath("data/liqi.json").read_text("utf-8"))
    return _RPC_MAP


class MsgType(Enum):
    Notify = 1
    Req = 2
    Res = 3


def _msg_name(type_ref: str) -> str:
    """'.lq.ReqLogin' -> 'ReqLogin'"""
    return type_ref.removeprefix(".lq.")


def decode(data: bytes) -> bytes:
    """Notify 内层 data 的 XOR 混淆。"""
    keys = [0x84, 0x5E, 0x4E, 0x42, 0x39, 0xA2, 0x1F, 0x60, 0x1C]
    buf = bytearray(data)
    k, d = len(keys), len(buf)
    for i, j in enumerate(buf):
        u = (23 ^ d) + 5 * i + keys[i % k] & 255
        buf[i] = j ^ u
    return bytes(buf)


class LiqiProto:
    def __init__(self, rpc_map: dict | None = None):
        self.tot = 0  # 已解析的包数
        self.res_type: dict[int, tuple[str, type]] = {}  # index -> (method, 响应类型)，等待配对
        self.rpc_map = rpc_map if rpc_map is not None else load_rpc_map()

    def parse(self, buf: bytes, from_client: bool = False) -> dict:
        """解析一帧；同一连接内必须按顺序调用。"""
        msg_block = basic_pb2.BaseMessage()
        msg_type = MsgType(buf[0])
        if msg_type == MsgType.Notify:
            msg_block.ParseFromString(buf[1:])
            method_name = msg_block.method_name
            _, _, message_name = method_name.split(".")
            dict_obj = to_dict(getattr(pb, message_name).FromString(msg_block.data))
            if "data" in dict_obj:
                inner = base64.b64decode(dict_obj["data"])
                action = getattr(pb, dict_obj["name"]).FromString(decode(inner))
                dict_obj["data"] = to_dict(action)
            msg_id = self.tot
        else:
            msg_id = unpack("<H", buf[1:3])[0]
            msg_block.ParseFromString(buf[3:])
            if msg_type == MsgType.Req:
                if msg_id in self.res_type:
                    raise ValueError(f"重复的请求 index {msg_id}")
                method_name = msg_block.method_name
                spec = self.rpc_map[method_name]
                dict_obj = to_dict(getattr(pb, _msg_name(spec["req"])).FromString(msg_block.data))
                self.res_type[msg_id] = (method_name, getattr(pb, _msg_name(spec["resp"])))
            else:
                if msg_block.method_name:
                    raise ValueError("响应帧不应带 method_name")
                if msg_id not in self.res_type:
                    raise KeyError(f"没有对应请求的响应 index {msg_id}")
                method_name, res_cls = self.res_type.pop(msg_id)
                dict_obj = to_dict(res_cls.FromString(msg_block.data))
        self.tot += 1
        return {"id": msg_id, "type": msg_type, "method": method_name, "data": dict_obj}
