"""libriichi 四麻动作空间（46 项）与候选还原。"""
import math

_TILES = (
    [f"{n}m" for n in range(1, 10)] + [f"{n}p" for n in range(1, 10)] + [f"{n}s" for n in range(1, 10)]
    + ["E", "S", "W", "N", "P", "F", "C", "5mr", "5pr", "5sr"]
)
ACTION_IDS = tuple(_TILES + ["reach", "chi_low", "chi_mid", "chi_high", "pon", "kan", "hora", "ryukyoku", "pass"])
assert len(ACTION_IDS) == 46
TILE_IDS = frozenset(ACTION_IDS[:37])


def kind_of(action_id: str) -> str:
    """动作 id -> 展示/intent 用的 kind。"""
    if action_id in TILE_IDS:
        return "discard"
    return {"reach": "riichi", "chi_low": "chi", "chi_mid": "chi", "chi_high": "chi", "pon": "pon",
            "kan": "kan", "hora": "hora", "ryukyoku": "kyuushu", "pass": "pass"}[action_id]


def alternatives(meta: dict | None, top: int | None = None) -> list[dict]:
    """由 q_values + mask_bits 还原候选及相对概率（softmax），按概率降序。

    返回 ``[{"id", "kind", "tile"?, "p", "q"}]``，p 为 0–1。任何不一致返回空列表。
    """
    if not meta:
        return []
    q, mask = meta.get("q_values"), meta.get("mask_bits")
    if not q or mask is None:
        return []
    ids = [i for i in range(len(ACTION_IDS)) if (mask >> i) & 1]
    if len(ids) != len(q):
        return []
    m = max(q)
    exps = [math.exp(v - m) for v in q]
    z = sum(exps)
    ranked = sorted(zip(ids, q, exps), key=lambda x: -x[2])
    if top is not None:
        ranked = ranked[:top]
    out = []
    for i, qv, e in ranked:
        aid = ACTION_IDS[i]
        item = {"id": aid, "kind": kind_of(aid), "p": round(e / z, 4), "q": round(qv, 4)}
        if aid in TILE_IDS:
            item["tile"] = aid
        out.append(item)
    return out
