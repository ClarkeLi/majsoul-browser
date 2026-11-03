"""手牌分组（只做展示）：把手牌拆成 顺子/刻子/雀头/搭子/孤张，并给每个搭子标出待牌与余张。

用来回答“我的牌哪些组好了、哪些部分在等什么、离听牌还差几步”。拆法取使向听数最小的那一种
（与 efficiency.shanten_regular 同一口径）；七对子/国士比普通型更近时只给出提示，不强拆。
"""
from __future__ import annotations

from functools import lru_cache

from . import efficiency as E
from .defense import NAMES34, idx


@lru_cache(maxsize=1 << 14)
def _suit_options(counts: tuple, base: int) -> tuple:
    """一种数牌的所有“有代表性”的拆法：{(面子数, 搭子数): groups}，每个 (m,t) 只留一种。"""
    c = list(counts)
    out: dict[tuple[int, int], tuple] = {}

    def rec(groups: tuple, m: int, t: int) -> None:
        i = next((k for k in range(9) if c[k]), -1)
        if i < 0:
            out.setdefault((m, t), groups)
            return
        g = base + i
        if c[i] >= 3:
            c[i] -= 3; rec(groups + (("triplet", (g, g, g)),), m + 1, t); c[i] += 3
        if i <= 6 and c[i + 1] and c[i + 2]:
            c[i] -= 1; c[i + 1] -= 1; c[i + 2] -= 1
            rec(groups + (("run", (g, g + 1, g + 2)),), m + 1, t)
            c[i] += 1; c[i + 1] += 1; c[i + 2] += 1
        if c[i] >= 2:
            c[i] -= 2; rec(groups + (("pair", (g, g)),), m, t + 1); c[i] += 2
        if i <= 7 and c[i + 1]:
            kind = "penchan" if i == 0 or i + 1 == 8 else "ryanmen"
            c[i] -= 1; c[i + 1] -= 1; rec(groups + ((kind, (g, g + 1)),), m, t + 1); c[i] += 1; c[i + 1] += 1
        if i <= 6 and c[i + 2]:
            c[i] -= 1; c[i + 2] -= 1; rec(groups + (("kanchan", (g, g + 2)),), m, t + 1); c[i] += 1; c[i + 2] += 1
        c[i] -= 1; rec(groups + (("isolated", (g,)),), m, t); c[i] += 1

    rec((), 0, 0)
    return tuple((k, v) for k, v in out.items())


def _honor_groups(c: list[int]) -> tuple[int, int, list]:
    m = t = 0
    groups = []
    for i in range(27, 34):
        n = c[i]
        if n >= 3:
            m += 1; groups.append(("triplet", (i, i, i)))
            n -= 3
        if n == 2:
            t += 1; groups.append(("pair", (i, i)))
        elif n == 1:
            groups.append(("isolated", (i,)))
    return m, t, groups


@lru_cache(maxsize=4096)
def _best(counts: tuple, fixed: int) -> tuple:
    c = list(counts)
    heads = [None] + [i for i in range(34) if c[i] >= 2]
    best_key, best = None, None
    suits = [_suit_options(tuple(c[b:b + 9]), b) for b in (0, 9, 18)]
    for head in heads:
        cc = list(c)
        if head is not None:
            cc[head] -= 2
        hm, ht, hg = _honor_groups(cc)
        opts = [_suit_options(tuple(cc[b:b + 9]), b) for b in (0, 9, 18)] if head is not None else suits
        for (m1, t1), g1 in opts[0]:
            for (m2, t2), g2 in opts[1]:
                for (m3, t3), g3 in opts[2]:
                    m = fixed + hm + m1 + m2 + m3
                    t = ht + t1 + t2 + t3
                    m_eff = min(m, 4)
                    t_eff = min(t, 4 - m_eff)
                    value = 8 - 2 * m_eff - t_eff - (1 if head is not None else 0)
                    groups = g1 + g2 + g3 + tuple(hg)
                    iso = sum(1 for k, _ in groups if k == "isolated")
                    key = (value, -m_eff, iso)
                    if best_key is None or key < best_key:
                        best_key = key
                        best = (value, head, groups)
    return best


def _waits_of(kind: str, tiles: tuple[int, ...]) -> list[int]:
    a = tiles[0]
    n = a % 9 + 1 if a < 27 else 0
    if kind == "ryanmen":
        return [a - 1, a + 2]
    if kind == "penchan":
        return [a + 2] if n == 1 else [a - 1]
    if kind == "kanchan":
        return [a + 1]
    if kind == "pair":
        return [a]
    return []


def group_view(hand: list[str], n_melds: int, visible: list[int]) -> dict | None:
    """hand 必须是 13-3m 张。返回 {"shanten","form","groups","total","ukeire"}；张数不对返回 None。"""
    if len(hand) != 13 - 3 * n_melds:
        return None
    counts = [0] * 34
    codes: dict[int, list[str]] = {}
    for t in hand:
        i = idx(t)
        if i >= 0:
            counts[i] += 1
            codes.setdefault(i, []).append(t)
    for v in codes.values():
        v.sort(key=lambda t: (0 if t.endswith("r") else 1))     # 赤五排在前

    shanten = E.shanten(counts, n_melds)
    form = "regular"
    if n_melds == 0:
        if E.shanten_chiitoi(counts) == shanten and shanten < E.shanten_regular(counts, 0):
            form = "chiitoi"
        elif E.shanten_kokushi(counts) == shanten and shanten < E.shanten_regular(counts, 0):
            form = "kokushi"
    _, head, groups = _best(tuple(counts), n_melds)

    pool = {i: list(v) for i, v in codes.items()}
    out = list(groups)
    if head is not None:
        out.append(("head", (head, head)))
    order = {"triplet": 0, "run": 0, "head": 1, "ryanmen": 2, "penchan": 2, "kanchan": 2, "pair": 2, "isolated": 3}
    out.sort(key=lambda g: (order[g[0]], g[1][0]))
    result = []
    for kind, tiles in out:
        shown = []
        for i in tiles:
            lst = pool.get(i) or [NAMES34[i]]
            shown.append(lst.pop(0) if lst else NAMES34[i])
        waits = [{"tile": NAMES34[j], "left": max(0, 4 - visible[j])} for j in _waits_of(kind, tiles) if 0 <= j < 34 and (j < 27) == (tiles[0] < 27) and (j < 27 and j // 9 == tiles[0] // 9 or j >= 27)]
        result.append({"kind": kind, "tiles": shown, "waits": waits})
    s, uk = E.ukeire(counts, n_melds, visible)
    return {"shanten": shanten, "form": form, "groups": result, "total": sum(left for _, left in uk),
            "ukeire": [{"tile": NAMES34[i], "left": left} for i, left in sorted(uk, key=lambda x: -x[1])]}
