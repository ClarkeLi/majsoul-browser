"""听牌时每张待牌的打点（只做展示）：荣和 / 自摸、默听 / 立直，按当前场况动态加减。

用 ``mahjong`` 库（MIT）算役与符：
· 场风 / 自风 / 宝牌指示牌 / 赤宝牌 / 副露
· 已立直：立直；一发巡内：一发（只在一巡内有效，由 GameState.ippatsu 跟踪）
· 海底摸月：下一次自己摸的就是最后一张；河底捞鱼：牌山已空，下一张打出的牌就是河底
· 门清未立直：额外给出“立直后荣和”的打点，用来比较默听和立直
里宝牌未知，不计入。本场与供托不计入（界面只展示牌本身的价值）。
"""
from __future__ import annotations

from mahjong.constants import EAST, NORTH, SOUTH, WEST
from mahjong.hand_calculating.hand import HandCalculator
from mahjong.hand_calculating.hand_config import HandConfig, OptionalRules
from mahjong.meld import Meld

from .defense import idx

_WINDS = [EAST, SOUTH, WEST, NORTH]
_BAKAZE = {"E": EAST, "S": SOUTH, "W": WEST, "N": NORTH}
_FIVES = {4, 13, 22}                      # 5m 5p 5s 的 34 编号；拷贝 0 是赤五（136 编号 16 / 52 / 88）
_RULES = OptionalRules(has_open_tanyao=True, has_aka_dora=True)   # 雀魂：食断、赤宝牌
_calc = HandCalculator()


class _Ids:
    """把 MJAI 牌名分配成互不重复的 136 编号；赤五用拷贝 0，普通五只用 1..3。"""

    def __init__(self) -> None:
        self.used: dict[int, set[int]] = {}

    def get(self, t: str) -> int:
        i = idx(t)
        if i < 0:
            raise ValueError(t)
        used = self.used.setdefault(i, set())
        red = t.endswith("r")
        pool = [0] if red else ([1, 2, 3] if i in _FIVES else [0, 1, 2, 3])
        for k in pool:
            if k not in used:
                used.add(k)
                return i * 4 + k
        raise ValueError(f"第 5 张 {t}")


def _meld(m: dict, ids: _Ids) -> Meld:
    tiles = [ids.get(t) for t in m["tiles"]]
    kind = m["type"]
    if kind == "chi":
        return Meld(Meld.CHI, tiles, opened=True, called_tile=tiles[-1])
    if kind == "pon":
        return Meld(Meld.PON, tiles, opened=True, called_tile=tiles[-1])
    if kind == "kakan":
        return Meld(Meld.SHOUMINKAN, tiles, opened=True, called_tile=tiles[-1])
    if kind == "ankan":
        return Meld(Meld.KAN, tiles, opened=False)
    return Meld(Meld.KAN, tiles, opened=True, called_tile=tiles[-1])     # 大明杠


def _one(hand: list[str], melds: list[dict], dora: list[str], win: str, cfg: HandConfig) -> dict | None:
    ids = _Ids()
    try:
        hand_ids = [ids.get(t) for t in hand]
        mobjs = [_meld(m, ids) for m in melds]
        win_id = ids.get(win)
        dora_ids = [_Ids().get(d) for d in dora]
    except ValueError:
        return None
    meld_ids = [t for m in mobjs for t in m.tiles]
    r = _calc.estimate_hand_value(hand_ids + meld_ids + [win_id], win_id, melds=mobjs or None, dora_indicators=dora_ids, config=cfg)
    if r.error or not r.han:
        return None
    closed = not any(m.opened for m in mobjs)
    yaku = [[y.yaku_id, (y.han_closed if closed else y.han_open) or 0] for y in (r.yaku or [])]
    level = (r.cost.get("yaku_level") or "").split(" ")[-1]          # "kazoe yakuman" / "2x yakuman" → yakuman
    c = r.cost
    # pay：荣和 = [放铳者付]；自摸 = [亲家付（子家自摸）或每家付（亲家自摸）, 子家每家付]（不含本场）
    pay = [int(c.get("main") or 0), int(c.get("additional") or 0)]
    return {"han": r.han, "fu": r.fu, "points": int(c["total"]), "level": level, "yaku": yaku, "pay": pay}


def wait_values(state, hand: list[str], waits: list[dict], draws_before_me: int) -> list[dict]:
    """hand：13-3m 张（不含副露）；waits：[{"tile","left"}]；draws_before_me：轮到自己摸之前别人还要摸几张。

    返回 [{"tile","left","ron","tsumo","riichi_ron","riichi_tsumo"}]，各项为 {"han","fu","points","level","yaku":[[id,han]]} 或 None（无役）。
    """
    me = state.self_seat
    if me is None:
        return []
    melds = state.melds[me]
    menzen = all(m["type"] == "ankan" for m in melds)
    riichi = me in state.riichi
    ippatsu = me in getattr(state, "ippatsu", set())
    left = state.left_tiles
    haitei = left is not None and left == draws_before_me + 1      # 下一次自己摸的就是最后一张
    houtei = left == 0                                              # 牌山已空：接下来打出的就是河底牌
    seat_wind = _WINDS[(me - state.oya) % 4]
    round_wind = _BAKAZE.get(state.bakaze, EAST)

    def cfg(**kw) -> HandConfig:
        return HandConfig(player_wind=seat_wind, round_wind=round_wind, options=_RULES, **kw)

    out = []
    for w in waits:
        t = w["tile"]
        ron = _one(hand, melds, state.dora_markers, t, cfg(is_riichi=riichi, is_ippatsu=ippatsu, is_houtei=houtei))
        tsumo = _one(hand, melds, state.dora_markers, t, cfg(is_tsumo=True, is_riichi=riichi, is_ippatsu=ippatsu, is_haitei=haitei))
        rr = _one(hand, melds, state.dora_markers, t, cfg(is_riichi=True)) if menzen and not riichi else None
        rt = _one(hand, melds, state.dora_markers, t, cfg(is_riichi=True, is_tsumo=True, is_haitei=haitei)) if menzen and not riichi else None
        out.append({"tile": t, "left": w["left"], "ron": ron, "tsumo": tsumo, "riichi_ron": rr, "riichi_tsumo": rt})
    return out
