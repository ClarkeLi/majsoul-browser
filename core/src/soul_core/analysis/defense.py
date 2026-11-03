"""防守分析（四麻）：现物 / 筋 / 壁（No Chance、One Chance）/ 威胁度 / 每张牌的放铳率估计。

移植自旧原型 bridge/defense.py（去掉三麻、中文说明字符串）。放铳率是对「立直者」的经验近似值（%），
对没立直的对手再乘「威胁度」（≈ 已听牌的概率）。数值用于展示与排序，**不影响任何动作**，也不是精确统计。
"""
from __future__ import annotations

NAMES34 = ([f"{n}m" for n in range(1, 10)] + [f"{n}p" for n in range(1, 10)] +
           [f"{n}s" for n in range(1, 10)] + ["E", "S", "W", "N", "P", "F", "C"])
_INDEX = {n: i for i, n in enumerate(NAMES34)}
WINDS = "ESWN"

_NOSUJI = {1: 6.5, 2: 8.0, 3: 10.0, 4: 12.0, 5: 13.0, 6: 12.0, 7: 10.0, 8: 8.0, 9: 6.5}
_SUJI = {1: 1.8, 2: 3.0, 3: 4.5, 4: 3.5, 5: 3.5, 6: 3.5, 7: 4.5, 8: 3.0, 9: 1.8}
_HALF_SUJI = 7.0
_HONOR_BY_VISIBLE = {0: 4.5, 1: 2.5, 2: 1.0, 3: 0.2}


def idx(t: str) -> int:
    """MJAI 牌名 -> 0..33；未知牌返回 -1。赤五与普通五编号相同。"""
    return _INDEX.get(t[:-1] if t.endswith("r") else t, -1)


def num(i: int) -> int:
    return i % 9 + 1 if i < 27 else 0


def suit(i: int) -> int:
    return i // 9 if i < 27 else 3


def suji_class(i: int, safe: set[int]) -> str:
    """数牌 i 对某对手的筋关系：suji / half / none。"""
    if i >= 27:
        return "none"
    n, b = num(i), i - num(i) + 1
    sides = ([b + n - 4] if n > 3 else []) + ([b + n + 2] if n < 7 else [])
    hit = sum(1 for s in sides if s in safe)
    return "suji" if hit == len(sides) else "half" if hit else "none"


def chance(i: int, visible: list[int]) -> str:
    """壁：两面听 i 所需的搭子是否被看光。no / one / ''。"""
    if i >= 27:
        return ""
    n = num(i)
    shapes = ([(i + 1, i + 2)] if n <= 7 else []) + ([(i - 2, i - 1)] if n >= 3 else [])
    worst = [max(visible[a], visible[b]) for a, b in shapes]
    return "no" if all(v >= 4 for v in worst) else "one" if all(v >= 3 for v in worst) else ""


def threat(discards: list[dict], melds: list[dict], riichi: bool, dora_ids: set[int], yakuhai: set[int]) -> tuple[float, str]:
    """对手已听牌（或很快听牌）的程度 (0..1, 标签)。标签：riichi / melds3 / melds2 / melds1 / closed。"""
    turn = len(discards)
    if riichi:
        return 1.0, "riichi"
    open_melds = [m for m in melds if m.get("type") != "ankan"]
    k = len(open_melds)
    if k >= 3:
        v, label = 0.75, "melds3"
    elif k == 2:
        v, label = 0.45, "melds2"
    elif k == 1:
        v, label = 0.2, "melds1"
    else:
        v, label = min(0.3, 0.05 + 0.02 * turn), "closed"
    hot = any(
        (m.get("type") in ("pon", "daiminkan", "kakan", "ankan") and {idx(t) for t in m["tiles"]} & yakuhai)
        or ({idx(t) for t in m["tiles"]} & dora_ids)
        for m in melds
    )
    if hot and k:
        v += 0.15
    tail = discards[-3:]
    if turn >= 9 and len(tail) == 3 and not any(d.get("tsumogiri") for d in tail):
        v += 0.1
    return min(v, 0.95), label


def deal_in(i: int, *, safe: set[int], visible: list[int], riichi_tile: int | None, yakuhai: set[int], dora_ids: set[int]) -> float:
    """对一个「已听牌」的对手打出 i 的放铳率（%）。"""
    if i in safe or visible[i] >= 4:
        return 0.0
    if i >= 27:
        p = _HONOR_BY_VISIBLE.get(min(visible[i], 3), 5.0)
        return round(p * 1.3 if visible[i] == 0 and i in yakuhai else p, 1)
    n = num(i)
    cls = suji_class(i, safe)
    p = _SUJI[n] if cls == "suji" else _HALF_SUJI if cls == "half" else _NOSUJI[n]
    ch = chance(i, visible)
    if ch == "no":
        p = min(p, 2.5)
    elif ch == "one":
        p *= 0.6
    if riichi_tile is not None and riichi_tile < 27 and suit(riichi_tile) == suit(i) and 1 <= abs(riichi_tile - i) <= 2 and cls != "suji":
        p *= 1.25
    if i in dora_ids:
        p *= 1.15
    return round(p, 1)


def explain(i: int, safe: set[int], visible: list[int]) -> str:
    """这张牌对某个对手“为什么安全 / 不安全”的原因码：
    genbutsu 现物 · seen4 四张全见 · honor_seen 字牌已见≥2 · honor 字牌 · suji 筋 · half_suji 单筋
    · nochance 壁(No Chance) · onechance 壁(One Chance) · none 无筋。"""
    if i in safe:
        return "genbutsu"
    if visible[i] >= 4:
        return "seen4"
    if i >= 27:
        return "honor_seen" if visible[i] >= 2 else "honor"
    cls = suji_class(i, safe)
    if cls == "suji":
        return "suji"
    ch = chance(i, visible)
    if ch == "no":
        return "nochance"
    if ch == "one":
        return "onechance"
    return "half_suji" if cls == "half" else "none"


def tier_of(risk: float) -> int:
    """综合放铳率 -> 0..4 级（对应 --risk-0 … --risk-4）。"""
    return 0 if risk == 0 else 1 if risk < 2 else 2 if risk < 5 else 3 if risk < 9 else 4


def visible_counts(rivers, melds, hand: list[str], dora_markers: list[str]) -> list[int]:
    v = [0] * 34
    for seat_river in rivers:
        for d in seat_river:
            if not d.get("called") and idx(d["tile"]) >= 0:   # 被鸣走的牌已计入副露，避免重复
                v[idx(d["tile"])] += 1
    for seat_melds in melds:
        for m in seat_melds:
            for t in m["tiles"]:
                if idx(t) >= 0:
                    v[idx(t)] += 1
    for t in [*hand, *dora_markers]:
        if idx(t) >= 0:
            v[idx(t)] += 1
    return v


def dora_ids(dora_markers: list[str]) -> set[int]:
    doras = set()
    for m in dora_markers:
        i = idx(m)
        if i < 0:
            continue
        doras.add(i - i % 9 + (i % 9 + 1) % 9 if i < 27 else (27 + (i - 27 + 1) % 4 if i < 31 else 31 + (i - 31 + 1) % 3))
    return doras


def opponents(*, me: int, oya: int, bakaze: str, rivers: list[list[dict]], melds: list[list[dict]], riichi: set[int],
              hand: list[str], dora_markers: list[str]) -> list[dict]:
    """每个对手：{seat, threat, label, d34（对他的逐张放铳率 %）, safe（现物牌种）, riichi}。"""
    visible = visible_counts(rivers, melds, hand, dora_markers)
    doras = dora_ids(dora_markers)
    rw = idx(bakaze)
    riichi_seq = {s: d["seq"] for s in range(4) for d in rivers[s] if d.get("riichi")}
    opps = []
    for s in range(4):
        if s == me:
            continue
        yakuhai = {31, 32, 33, rw, idx(WINDS[(s - oya) % 4])}
        safe = {idx(d["tile"]) for d in rivers[s]}
        if s in riichi_seq:
            for o in range(4):
                if o != s:
                    safe |= {idx(d["tile"]) for d in rivers[o] if d["seq"] > riichi_seq[s]}
        safe.discard(-1)
        th, label = threat(rivers[s], melds[s], s in riichi, doras, yakuhai)
        rtile = next((idx(d["tile"]) for d in rivers[s] if d.get("riichi")), None)
        d34 = [deal_in(i, safe=safe, visible=visible, riichi_tile=rtile, yakuhai=yakuhai, dora_ids=doras) for i in range(34)]
        opps.append({"seat": s, "threat": round(th, 2), "label": label, "d34": d34, "safe": safe, "riichi": s in riichi})
    return opps


def analyze(*, me: int, oya: int, bakaze: str, rivers: list[list[dict]], melds: list[list[dict]], riichi: set[int],
            hand: list[str], dora_markers: list[str]) -> dict:
    """返回 ``{"threat": [{seat, threat, label}], "risk": {tile_code: {"risk": %, "tier": 0..4}}}``。

    rivers[seat] 里每张牌需带全局 ``seq``（用来计算立直后的现物）。
    """
    visible = visible_counts(rivers, melds, hand, dora_markers)
    opps = opponents(me=me, oya=oya, bakaze=bakaze, rivers=rivers, melds=melds, riichi=riichi, hand=hand,
                     dora_markers=dora_markers)
    risk = {}
    top = max(opps, key=lambda o: o["threat"]) if opps else None       # 对谁最需要防守
    for t in {*hand}:
        i = idx(t)
        if i < 0:
            continue
        miss = 1.0
        for o in opps:
            miss *= 1 - o["d34"][i] * o["threat"] / 100.0
        r = round((1 - miss) * 100, 1)
        risk[t] = {"risk": r, "tier": tier_of(r)}
        if top is not None and top["threat"] >= 0.3:
            risk[t]["why"] = explain(i, top["safe"], visible)
            risk[t]["vs"] = top["seat"]
    heat = []
    for i in range(34):
        miss = 1.0
        for o in opps:
            miss *= 1 - o["d34"][i] * o["threat"] / 100.0
        r = round((1 - miss) * 100, 1)
        heat.append({"tile": NAMES34[i], "risk": r, "tier": tier_of(r), "left": max(0, 4 - visible[i])})
    return {"threat": [{"seat": o["seat"], "threat": o["threat"], "label": o["label"]} for o in opps], "risk": risk, "heat": heat}
