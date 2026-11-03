"""牌面洞察（只做展示）：向听、进张、待牌，以及“押 / 引”判断。

· wait_state：手牌是 13-3m 张（没有摸牌）时的向听与待牌（听牌时给出待牌与余张）
· discard_insight：对若干候选打牌，算打后的向听、进张（听牌时进张 = 待牌）与总余张
· verdict：用候选牌的放铳率与对手威胁度给出 进攻 / 平衡 / 弃和（旧原型规则去掉了依赖算点的那一部分）
"""
from __future__ import annotations

from . import efficiency as E
from .groups import group_view as _group_view
from .defense import idx, NAMES34, visible_counts


def _counts(tiles: list[str]) -> list[int]:
    c = [0] * 34
    for t in tiles:
        i = idx(t)
        if i >= 0:
            c[i] += 1
    return c


def _visible(state) -> list[int]:
    return visible_counts(state.rivers, state.melds, state.my_hand, state.dora_markers)


def _n_melds(state) -> int:
    return len(state.melds[state.self_seat]) if state.self_seat is not None else 0


def wait_state(state) -> dict | None:
    """没有摸牌、手里 13-3m 张时：{"shanten", "waits": [{"tile","left"}]}；其它情形返回 None。"""
    if state.self_seat is None:
        return None
    nm = _n_melds(state)
    if len(state.my_hand) != 13 - 3 * nm:
        return None
    c = _counts(state.my_hand)
    vis = _visible(state)
    s, uk = E.ukeire(c, nm, vis)
    return {"shanten": s, "waits": [{"tile": NAMES34[i], "left": left} for i, left in uk] if s == 0 else []}


def discard_insight(state, tiles: list[str]) -> dict[str, dict]:
    """手里 14-3m 张时，对每个候选打牌 → {"shanten", "total", "ukeire": [{"tile","left"}]}。键为候选牌的 MJAI 写法。"""
    nm = _n_melds(state)
    if state.self_seat is None or len(state.my_hand) != 14 - 3 * nm:
        return {}
    c = _counts(state.my_hand)
    vis = _visible(state)
    out: dict[str, dict] = {}
    for t in dict.fromkeys(tiles):
        i = idx(t)
        if i < 0 or not c[i]:
            continue
        c[i] -= 1
        s, uk = E.ukeire(c, nm, vis)
        c[i] += 1
        out[t] = {"shanten": s, "total": sum(left for _, left in uk),
                  "ukeire": [{"tile": NAMES34[j], "left": left} for j, left in sorted(uk, key=lambda x: -x[1])]}
    return out


def verdict(shanten_after: int | None, focus_risk: float | None, max_threat: float) -> dict:
    """押引：advice ∈ push / balance / fold。

    规则取自旧原型 _verdict 中不依赖“打点估值”的部分：
      听牌：对手几乎没威胁、或这张牌放铳风险低 → 押；威胁很高而风险也高 → 弃和；其余平衡
      一向听以上：对手威胁≥0.8 且离听牌远 → 弃和 / 一向听平衡；威胁不大 → 押
    """
    sh = 8 if shanten_after is None else shanten_after
    risk = focus_risk or 0.0
    if sh == 0:
        advice = "push" if (max_threat < 0.5 or risk < 3.0) else ("fold" if (max_threat >= 0.8 and risk >= 8.0) else "balance")
    elif max_threat >= 0.8 and sh >= 2:
        advice = "fold"
    elif max_threat >= 0.8 and sh == 1:
        advice = "balance"
    else:
        advice = "push" if max_threat < 0.5 else "balance"
    return {"advice": advice, "risk": round(risk, 1), "max_threat": round(max_threat, 2)}


def group_view(state, discard: str | None = None) -> dict | None:
    """手牌分组：手里 13-3m 张时看当前手牌；14-3m 张时先去掉 discard（将要打出的牌）再看。"""
    if state.self_seat is None:
        return None
    nm = _n_melds(state)
    hand = list(state.my_hand)
    if discard is not None and len(hand) == 14 - 3 * nm:
        pool = [discard, discard[:2] if discard.endswith("r") else discard + "r"]
        for c in pool:
            if c in hand:
                hand.remove(c)
                break
    view = _group_view(hand, nm, _visible(state))
    if view is not None and discard is not None:
        view["discard"] = discard
    if view is not None and view["shanten"] == 0 and view["ukeire"]:
        # 听牌：每张待牌的打点。打牌后要等其余三家各摸一张；没摸牌时按上一个打牌的人算还差几家
        me, last = state.self_seat, state.last_discarder
        draws = 3 if discard is not None or last is None or last == me else (me - last - 1) % 4
        try:
            from .value import wait_values
            view["values"] = wait_values(state, hand, view["ukeire"], draws)
        except Exception:  # noqa: BLE001 - 展示用，算点出错不影响其它信息
            view["values"] = []
    return view
