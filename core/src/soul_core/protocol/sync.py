"""Core 关心的消息集合与 syncGame 展开。"""
import base64
import logging

from . import pb
from .jsonfmt import to_dict

log = logging.getLogger(__name__)

# 只有这些消息对牌局状态/Mortal 有用
METHODS = frozenset({
    ".lq.ActionPrototype",
    ".lq.FastTest.authGame",
    ".lq.FastTest.syncGame",
    ".lq.Lobby.login",
    ".lq.Lobby.oauth2Login",
    ".lq.NotifyGameEndResult",
    ".lq.NotifyGameTerminate",
})


def expand_sync_game(data) -> list[dict]:
    """把 ResSyncGame 展开成 ``[{'name':..., 'data': {...}}]``。

    ``game_restore.actions[].data`` 是明文 protobuf（不做 XOR）；空 data 给 ``{}``，
    未知动作名或解析失败则跳过并记录。
    """
    out = []
    actions = ((data or {}).get("game_restore") or {}).get("actions") or []
    for item in actions:
        name = item.get("name")
        raw = item.get("data") or b""
        cls = pb.get(name) if isinstance(name, str) and name else None
        if cls is None:
            log.warning("syncGame: 未知动作 %r，已跳过", name)
            continue
        if not raw:
            out.append({"name": name, "data": {}})
            continue
        try:
            if isinstance(raw, str):
                raw = base64.b64decode(raw)
            d = to_dict(cls.FromString(raw))
        except Exception as e:  # noqa: BLE001 - 单个动作坏了不应拖垮整局
            log.warning("syncGame: 动作 %s 解析失败：%r，已跳过", name, e)
            continue
        out.append({"name": name, "data": d})
    return out
