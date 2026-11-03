"""牌效计算：向听数、待牌、进张、打牌候选、和牌率估算（移植自旧原型 bridge/efficiency.py，四麻）。

全部是纯函数，输入 34 维计数（见 mjtiles），不依赖 Mortal。
约定：
    shanten =  -1 和了形，0 听牌，1 一向听 ……
    n_melds  副露（含暗杠）的组数，手里的暗牌应为 13 - 3*n_melds（或 +1 张摸牌）
    visible  自己能看到的每种牌张数（自家手牌 + 全部牌河 + 全部副露 + 宝牌指示牌）
"""
from __future__ import annotations

from functools import lru_cache

YAOCHU = (0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33)


# ---------------------------------------------------------------- 向听数

@lru_cache(maxsize=1 << 16)
def _suit_opts(key: tuple) -> tuple:
    """一种数牌（9 维计数）能拆出的 (面子数, 搭子数) 的帕累托最优集合。"""
    c = list(key)
    i = next((k for k in range(9) if c[k]), -1)
    if i < 0:
        return ((0, 0),)
    res: set = set()

    def sub(m, t, *pos):
        for p in pos:
            c[p] -= 1
        for a, b in _suit_opts(tuple(c)):
            res.add((a + m, b + t))
        for p in pos:
            c[p] += 1

    if c[i] >= 3:
        sub(1, 0, i, i, i)
    if i <= 6 and c[i + 1] and c[i + 2]:
        sub(1, 0, i, i + 1, i + 2)
    if c[i] >= 2:
        sub(0, 1, i, i)
    if i <= 7 and c[i + 1]:
        sub(0, 1, i, i + 1)
    if i <= 6 and c[i + 2]:
        sub(0, 1, i, i + 2)
    sub(0, 0, i)                                    # 孤张
    # 只保留不被支配的方案
    pareto = [x for x in res
              if not any(y != x and y[0] >= x[0] and y[1] >= x[1] for y in res)]
    return tuple(pareto)


def _regular_no_head(c: list[int], m0: int) -> int:
    """不取雀头时的最少「8 - 2m - t」（m 含副露）。"""
    hm = ht = 0
    for i in range(27, 34):
        if c[i] >= 3:
            hm += 1
        elif c[i] == 2:
            ht += 1
    best = 99
    for a1, b1 in _suit_opts(tuple(c[0:9])):
        for a2, b2 in _suit_opts(tuple(c[9:18])):
            for a3, b3 in _suit_opts(tuple(c[18:27])):
                m = m0 + hm + a1 + a2 + a3
                t = ht + b1 + b2 + b3
                if m > 4:
                    m = 4
                t = min(t, 4 - m)
                v = 8 - 2 * m - t
                if v < best:
                    best = v
    return best


def shanten_regular(c: list[int], n_melds: int = 0) -> int:
    c = list(c)
    best = _regular_no_head(c, n_melds)
    for i in range(34):
        if c[i] >= 2:
            c[i] -= 2
            v = _regular_no_head(c, n_melds) - 1
            c[i] += 2
            if v < best:
                best = v
    return best


def shanten_chiitoi(c: list[int]) -> int:
    pairs = sum(1 for x in c if x >= 2)
    kinds = sum(1 for x in c if x >= 1)
    return 6 - pairs + max(0, 7 - kinds)


def shanten_kokushi(c: list[int]) -> int:
    kinds = sum(1 for i in YAOCHU if c[i])
    pair = any(c[i] >= 2 for i in YAOCHU)
    return 13 - kinds - (1 if pair else 0)


def shanten(c: list[int], n_melds: int = 0) -> int:
    s = shanten_regular(c, n_melds)
    if n_melds == 0:
        s = min(s, shanten_chiitoi(c), shanten_kokushi(c))
    return s


# ---------------------------------------------------------------- 待牌 / 进张

def waits(c13: list[int], n_melds: int = 0) -> list[int]:
    """听牌形的待牌（34 编号）。手里已有 4 张的牌不算。"""
    out = []
    c = list(c13)
    for i in range(34):
        if c[i] >= 4:
            continue
        c[i] += 1
        if shanten(c, n_melds) == -1:
            out.append(i)
        c[i] -= 1
    return out


def ukeire(c13: list[int], n_melds: int, visible: list[int]) -> tuple[int, list[tuple[int, int]]]:
    """13 张时的进张：返回 (当前向听, [(牌, 剩余张数)])，只列能让向听前进的牌。"""
    c = list(c13)
    s = shanten(c, n_melds)
    out = []
    for i in range(34):
        if c[i] >= 4:
            continue
        c[i] += 1
        if shanten(c, n_melds) < s:
            out.append((i, max(0, 4 - visible[i])))
        c[i] -= 1
    return s, out


def discard_options(c14: list[int], n_melds: int, visible: list[int]) -> list[dict]:
    """14 张时每种可打的牌：打后向听、进张。按（向听升序, 进张降序）排序。

    返回 [{"tile": i, "shanten": s, "ukeire": [(j, left)], "total": 剩余进张总数}]
    """
    c = list(c14)
    out = []
    for i in range(34):
        if not c[i]:
            continue
        c[i] -= 1
        s, uk = ukeire(c, n_melds, visible)
        c[i] += 1
        out.append({"tile": i, "shanten": s, "ukeire": uk, "total": sum(x[1] for x in uk)})
    out.sort(key=lambda o: (o["shanten"], -o["total"], o["tile"]))
    return out


# ---------------------------------------------------------------- 和牌率

def win_rate(wait_left: int, unseen: int, draws_left: int, num_players: int = 4,
             riichi: bool = False, furiten: bool = False, opp_threats=()) -> float:
    """听牌后到流局为止的粗略和牌率（0..1）。

    模型（教学用，便于心算）：
      · 每摸一张命中待牌的概率 p = 剩余待牌 / 未见牌总数
      · 自己还能摸 draws_left 次 → 自摸
      · 别人每摸一次，按 p×k 的概率打出你的待牌被荣和：
        默听 k=0.45（别人不设防），立直 k=0.25（别人会防守），振听 k=0
      · 最后乘 0.85 × Π(1 − 0.25×对手威胁度)：别人可能抢先和牌，立直/重副露的对手抢得更凶
    """
    if wait_left <= 0 or unseen <= 0 or draws_left <= 0:
        return 0.0
    p = min(1.0, wait_left / unseen)
    k = 0.0 if furiten else (0.25 if riichi else 0.45)
    others = draws_left * (num_players - 1)
    miss = (1 - p) ** draws_left * (1 - p * k) ** others
    rival = 0.85
    for t in opp_threats:
        rival *= 1 - 0.25 * max(0.0, min(1.0, t))
    return round(max(0.0, min(1.0, (1 - miss) * rival)), 3)
