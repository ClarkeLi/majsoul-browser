"""打牌风格：掷骰 + 爱赌 + 算法改判（移植自旧原型 bridge/style.py 与 bridge.py 的 _dice / _gamble / _arbitrate）。

· 掷骰（near 模式）：看各选项与第一名的 q 值差。有差 ≤ NEAR_GAP 的备选时，就在这些备选里
  按 exp(-差/NEAR_TEMP) 掷一个（第一名不参与）；没有就选第一名。只在「几乎一样好」的局面偏离，
  按 Mortal 自己的估值损失最小（旧原型自对战 13.8 万个决策标定：与模型一致率约 80%）。
· 爱赌：每条役满路线给出 13 张手牌「离完成还差几张」（need），阈值随巡目收紧。打牌时选让 need
  最小的牌；模型要打的牌让 need 变大就改判。别人打牌时：门清路线不鸣牌，字牌路线碰关键字牌。

只改 Mortal 的 reaction（换成另一个合法候选），之后照常走校验与点击规划；任何异常都回退为模型原样。
关掉风格后完全按模型第一名出牌。
"""
from __future__ import annotations

import math
import random

from soul_core.analysis import efficiency as E
from soul_core.analysis.defense import idx, visible_counts
from .actions import TILE_IDS
from .arbiter import arbitrate

NEAR_GAP = 0.61
NEAR_TEMP = 0.3

ROUTES = ("kokushi", "suuankou", "daisangen", "suushi", "tsuuiisou", "chuuren")
# (巡目上限, need 上限)：巡目 = 自家已打出的张数；超过最后一档就不再赌
THRESHOLDS = {
    "kokushi": [(6, 3), (11, 2), (99, 1)],
    "chuuren": [(6, 4), (11, 3), (99, 2)],
    "suuankou": [(8, 3), (99, 2)],
    "daisangen": [(8, 4), (12, 3), (99, 2)],
    "suushi": [(8, 4), (12, 3), (99, 2)],
    "tsuuiisou": [(8, 4), (99, 3)],
}
CLOSED_ONLY = {"kokushi", "suuankou", "chuuren"}
HONOR_ROUTES = {"daisangen": range(31, 34), "suushi": range(27, 31), "tsuuiisou": range(27, 34)}
_CALL_IDS = ("pass", "pon", "chi_low", "chi_mid", "chi_high")


# ---------------------------------------------------------------- 掷骰

def sample_near(cands: list[tuple[str, float]], gap: float, temp: float, rng: random.Random) -> str | None:
    """cands: [(动作 id, q 值)]。返回选中的动作 id；没有接近的备选时返回第一名。"""
    if not cands:
        return None
    best = max(cands, key=lambda x: x[1])
    near = [(n, best[1] - q) for n, q in cands if n != best[0] and best[1] - q <= gap]
    if not near:
        return best[0]
    t = max(0.01, float(temp))
    w = [math.exp(-d / t) for _, d in near]
    x = rng.random() * sum(w)
    for (n, _), wi in zip(near, w):
        x -= wi
        if x <= 0:
            return n
    return near[-1][0]


# ---------------------------------------------------------------- 路线：还差几张

def _left(visible, i: int, c: list[int]) -> int:
    return max(0, 4 - visible[i]) if visible is not None else 4 - c[i]


def kokushi_need(c, melds, visible=None):
    if melds:
        return None
    if any(c[i] == 0 and _left(visible, i, c) == 0 for i in E.YAOCHU):
        return None                                  # 缺的那种已经绝张
    kinds = sum(1 for i in E.YAOCHU if c[i])
    pair = any(c[i] >= 2 for i in E.YAOCHU)
    return 13 - kinds - (1 if pair else 0) + 1


def chuuren_need(c, melds, visible=None):
    if melds:
        return None
    req = [3, 1, 1, 1, 1, 1, 1, 1, 3]
    best = None
    for s in range(3):
        miss = 0
        for k in range(9):
            i = s * 9 + k
            m = max(0, req[k] - c[i])
            if m > _left(visible, i, c):
                miss = None
                break
            miss += m
        if miss is not None and (best is None or miss + 1 < best):
            best = miss + 1
    return best


def _cost(c, visible, i, target):
    m = max(0, target - c[i])
    return m if m <= _left(visible, i, c) else None


def suuankou_need(c, melds, visible=None):
    if any(m.get("type") != "ankan" for m in melds):
        return None
    trips_needed = 4 - len(melds)
    best = None
    for p in range(34):
        pc = _cost(c, visible, p, 2)
        if pc is None:
            continue
        costs = sorted(x for x in (_cost(c, visible, i, 3) for i in range(34) if i != p) if x is not None)
        if len(costs) < trips_needed:
            continue
        tot = pc + sum(costs[:trips_needed])
        if best is None or tot < best:
            best = tot
    return best


def _meld_kinds(melds) -> dict[int, int]:
    """副露里的刻子 / 杠：{牌种: 3}（顺子不算）。"""
    return {idx(m["tiles"][0]): 3 for m in melds
            if m.get("type") in ("pon", "daiminkan", "ankan", "kakan") and m.get("tiles")}


def daisangen_need(c, melds, visible=None):
    mk = _meld_kinds(melds)
    tot = 0
    for i in range(31, 34):
        if i in mk:
            continue
        x = _cost(c, visible, i, 3)
        if x is None:
            return None
        tot += x
    return tot


def suushi_need(c, melds, visible=None):
    """小四喜：三种风刻子 + 一种风雀头（大四喜是它的延伸）。"""
    mk = _meld_kinds(melds)
    trip = []
    for i in range(27, 31):
        if i in mk:
            trip.append((0, 0, i))
            continue
        t3, t2 = _cost(c, visible, i, 3), _cost(c, visible, i, 2)
        trip.append((t3 if t3 is not None else 99, t2 if t2 is not None else 99, i))
    best = None
    for pair in trip:
        if pair[2] in mk:
            continue
        tot = pair[1] + sum(x[0] for x in trip if x is not pair)
        if best is None or tot < best:
            best = tot
    return best if best is not None and best < 99 else None


def tsuuiisou_need(c, melds, visible=None):
    if any(0 <= idx(t) < 27 for m in melds for t in m.get("tiles", [])):
        return None
    return sum(c[i] for i in range(27))


NEED = {"kokushi": kokushi_need, "chuuren": chuuren_need, "suuankou": suuankou_need,
        "daisangen": daisangen_need, "suushi": suushi_need, "tsuuiisou": tsuuiisou_need}


def threshold(route: str, turn: int) -> int:
    for t, n in THRESHOLDS[route]:
        if turn <= t:
            return n
    return -1


def active_routes(c13, melds, visible, turn: int) -> list[tuple[str, int]]:
    """13 张时满足阈值的路线 [(route, need)]，近的在前。"""
    out = []
    for r in ROUTES:
        n = NEED[r](c13, melds, visible)
        if n is not None and n <= threshold(r, turn):
            out.append((r, n))
    return sorted(out, key=lambda x: x[1])


def gamble_discard(c14, melds, visible, turn: int, legal: list[int]):
    """14 张时：返回 (route, need, good:set[牌种])——打 good 里的牌能保持最近的路线；没有路线返回 None。"""
    best = None
    for r in ROUTES:
        lim = threshold(r, turn + 1)
        res = {}
        for i in set(legal):
            if c14[i] <= 0:
                continue
            c14[i] -= 1
            res[i] = NEED[r](c14, melds, visible)
            c14[i] += 1
        vals = [v for v in res.values() if v is not None]
        if not vals:
            continue
        m = min(vals)
        if m > lim:
            continue
        good = {i for i, v in res.items() if v == m}
        if len(good) == len(res):
            continue                                 # 打什么都一样，不用干预
        if best is None or m < best[1]:
            best = (r, m, good)
    return best


# ---------------------------------------------------------------- 接到决策上

def _counts(tiles) -> list[int]:
    c = [0] * 34
    for t in tiles:
        i = idx(t)
        if i >= 0:
            c[i] += 1
    return c


def build_reaction(aid: str, state, event: dict) -> dict | None:
    """候选动作 id → MJAI reaction；凑不出来返回 None。"""
    me, hand = state.self_seat, list(state.my_hand)
    if aid in TILE_IDS:
        if aid not in hand:
            return None
        return {"type": "dahai", "actor": me, "pai": aid,
                "tsumogiri": state.drawn is not None and aid == state.drawn}
    if aid == "reach":
        return {"type": "reach", "actor": me}
    if aid == "pass":
        return {"type": "none"}
    pai = event.get("pai") or ""
    i = idx(pai)
    if event.get("type") != "dahai" or i < 0:
        return None

    def take(k: int, n: int, used: list) -> list | None:
        pool = list(hand)
        for u in used:
            pool.remove(u)
        got = [t for t in sorted(pool, key=lambda t: t.endswith("r")) if idx(t) == k][:n]
        return got if len(got) == n else None

    if aid == "pon":
        cons, kind = take(i, 2, []), "pon"
    elif aid.startswith("chi_"):
        if i >= 27:
            return None
        ks = [i + d for d in {"chi_low": (1, 2), "chi_mid": (-1, 1), "chi_high": (-2, -1)}[aid]]
        if any(k < 0 or k >= 27 or k // 9 != i // 9 for k in ks):
            return None
        a = take(ks[0], 1, [])
        b = take(ks[1], 1, a or []) if a else None
        cons, kind = ((a + b) if a and b else None), "chi"
    else:
        return None
    if not cons:
        return None
    return {"type": kind, "actor": me, "target": event.get("actor"), "pai": pai, "consumed": cons}


def _model_id(reaction: dict) -> str | None:
    t = reaction.get("type")
    if t == "dahai":
        return reaction.get("pai")
    if t in ("reach", "pon"):
        return t
    if t == "none":
        return "pass"
    if t == "chi":
        pai, cons = idx(reaction.get("pai") or ""), sorted(idx(x) for x in reaction.get("consumed") or [])
        if pai < 0 or len(cons) != 2:
            return None
        return "chi_low" if cons[0] > pai else "chi_high" if cons[1] < pai else "chi_mid"
    return None


def _dice(state, reaction: dict, event: dict, alts_all: list[dict], rng) -> tuple[dict, dict | None]:
    ids = {a["id"] for a in alts_all}
    t = reaction.get("type")
    if "hora" in ids or len(alts_all) < 2 or state.self_seat in state.riichi:
        return reaction, None
    if t in ("dahai", "reach"):
        allowed = {n for n in ids if n in TILE_IDS or n == "reach"}
    elif t in ("none", "chi", "pon") and event.get("type") == "dahai":
        allowed = ids & set(_CALL_IDS)
    else:
        return reaction, None
    model = _model_id(reaction)
    pick = sample_near([(a["id"], a["q"]) for a in alts_all if a["id"] in allowed], NEAR_GAP, NEAR_TEMP, rng)
    if not pick or pick == model:
        return reaction, None
    nr = build_reaction(pick, state, event)
    if nr is None:
        return reaction, None
    rank = next(i for i, a in enumerate(alts_all) if a["id"] == pick)
    return {**nr, "meta": reaction.get("meta")}, {"kind": "dice", "model": model, "pick": pick, "rank": rank + 1}


def _end_phase(state) -> bool:
    """南 3 / 南 4 及以后（西入 / 北入）。"""
    return state.bakaze in ("W", "N") or (state.bakaze == "S" and state.kyoku >= 3)


def _rank(state, me: int) -> int:
    """0 起的名次：点数高的在前，同分按座次（起家优先）。"""
    sc = state.scores
    return sum(1 for s in range(4) if s != me and (sc[s] > sc[me] or (sc[s] == sc[me] and s < me)))


def _gamble(state, reaction: dict, event: dict, alts_all: list[dict]) -> tuple[dict, dict | None]:
    t = reaction.get("type")
    me = state.self_seat
    if t not in ("dahai", "reach", "none", "chi", "pon") or me is None:
        return reaction, None
    if me in state.riichi or (_end_phase(state) and _rank(state, me) <= 1):
        return reaction, None                        # 立直后不赌；南 3 / 南 4 自己 1、2 位不赌
    hand, melds = list(state.my_hand), state.melds[me]
    visible = visible_counts(state.rivers, state.melds, state.my_hand, state.dora_markers)
    turn = len(state.rivers[me])
    threat = bool(set(state.riichi) - {me})
    c = _counts(hand)
    if t in ("dahai", "reach"):
        if len(hand) % 3 != 2:
            return reaction, None
        tiles = [a for a in alts_all if a["id"] in TILE_IDS and a["id"] in hand]
        res = gamble_discard(list(c), melds, visible, turn, [idx(a["id"]) for a in tiles])
        if not res:
            return reaction, None
        route, need, good = res
        if threat and need >= 3:
            return reaction, None
        cur = reaction.get("pai", "") if t == "dahai" else next((a["id"] for a in tiles), "")
        if not cur or idx(cur) in good:
            return reaction, None
        c13 = list(c)
        c13[idx(cur)] -= 1
        if E.shanten(c13, len(melds)) == 0 and need >= 3:
            return reaction, None                    # 正常手已经听牌，路线还远：不拆听
        cands = [a for a in tiles if idx(a["id"]) in good]
        if not cands:
            return reaction, None
        nr = build_reaction(cands[0]["id"], state, event)
        if nr is None:
            return reaction, None
        return {**nr, "meta": reaction.get("meta")}, {
            "kind": "gamble", "route": route, "need": need,
            "model": "reach" if t == "reach" else cur, "pick": cands[0]["id"]}
    # 别人打牌时：门清路线不鸣牌；字牌路线碰关键字牌
    if event.get("type") != "dahai" or len(hand) % 3 != 1:
        return reaction, None
    act = active_routes(c, melds, visible, turn)
    if not act or (threat and act[0][1] >= 3):
        return reaction, None
    pai = event.get("pai", "")
    i = idx(pai)
    ids = {a["id"] for a in alts_all}
    model = _model_id(reaction)
    for route, need in act:
        if t in ("chi", "pon") and (route in CLOSED_ONLY or (route == "tsuuiisou" and i < 27)) and "pass" in ids:
            return {"type": "none"}, {"kind": "gamble", "route": route, "need": need, "model": model, "pick": "pass"}
        if t == "none" and route in HONOR_ROUTES and i in HONOR_ROUTES[route] and c[i] >= 2 and "pon" in ids:
            nr = build_reaction("pon", state, event)
            if nr:
                return {**nr, "meta": reaction.get("meta")}, {"kind": "gamble", "route": route, "need": need,
                                                             "model": "pass", "pick": "pon"}
    return reaction, None


def apply_style(state, reaction: dict, event: dict, alts_all: list[dict], cfg: dict | None,
                rng: random.Random) -> tuple[dict, dict | None]:
    """先掷骰、再看役满路线、最后算法改判（与旧原型顺序一致）。返回 (要执行的 reaction, 风格说明 | None)；None 表示与模型第一名一致。"""
    if not cfg or not alts_all:
        return reaction, None
    info = None
    if cfg.get("dice"):
        try:
            reaction, info = _dice(state, reaction, event, alts_all, rng)
        except Exception:  # noqa: BLE001 - 风格出错就按模型出牌
            info = None
    gambled = False
    if cfg.get("gamble"):
        try:
            nr, g = _gamble(state, reaction, event, alts_all)
            if g:
                gambled = True
                if info:                             # 掷骰之后又被路线改判：说明里保留模型原本的选择
                    g["model"] = info["model"]
                reaction, info = nr, (None if g["pick"] == g["model"] else g)
        except Exception:  # noqa: BLE001
            pass
    if cfg.get("arb"):
        try:
            # 算法改判（在掷骰与爱赌之后）；爱赌改过的那一手只允许硬否决，不做软改判
            nr, a = arbitrate(state, reaction, event, alts_all, soft=not gambled)
            if a:
                if info:
                    a["model"] = info["model"]
                    a["via"] = info["kind"]
                reaction, info = nr, (None if a["pick"] == a["model"] else a)
        except Exception:  # noqa: BLE001
            pass
    return reaction, info
