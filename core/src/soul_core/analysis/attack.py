"""进攻 / 防守的点数口径（移植自旧原型 bridge.py 的 _board / _attack_plan / _verdict / insight.opp_value）。

· board：一次算好的局面公共数据（未见牌、剩余自摸次数、对手逐张放铳率与估计打点、立直条件……）
· waits_for：打出某张后听牌时，每张待牌 默听 / 立直 × 荣和 / 自摸 的打点（mahjong 库算役与符）
· attack_plan：默听 vs 立直——和牌率、平均打点、期望值（和牌率 × (平均打点 + 供托) − 立直棒成本）
· balance：押引的红绿条——和牌收益（期望值） vs 放铳损失（Σ 对手放铳率 × 对手估计打点）

全部是教学用的粗略估计。面板展示与“算法改判”（decision/arbiter.py）共用这一份口径。
"""
from __future__ import annotations

from . import efficiency as E
from .defense import idx, NAMES34, dora_ids, opponents, visible_counts

STICK = 1000


# ---------------------------------------------------------------- 名次与终盘

def ranks(scores: list[int]) -> list[int]:
    """每家名次（0 = 一位）。同分按座次：座位号小（离起家近）的在前。"""
    order = sorted(range(len(scores)), key=lambda s: (-scores[s], s))
    out = [0] * len(scores)
    for r, s in enumerate(order):
        out[s] = r
    return out


def chang_ju(state) -> tuple[int, int]:
    return "ESWN".find(state.bakaze) if state.bakaze in "ESWN" else 0, max(0, state.kyoku - 1)


def end_weight(state) -> float:
    """名次权重：最后一局 1.0，倒数第二局 0.5，延长战 1.0，其余 0。"""
    rounds = getattr(state, "rounds", "半庄")
    if rounds == "一局":
        return 1.0
    chang, ju = chang_ju(state)
    last = 0 if rounds == "东风" else 1
    if chang > last:
        return 1.0
    if chang < last:
        return 0.0
    return 1.0 if ju >= 3 else 0.5 if ju == 2 else 0.0


def live_scores(state) -> tuple[list[int], int]:
    """局中实时分数（扣掉本局已成立的立直棒）和场供点数。"""
    sc = list(state.scores)
    for s in state.riichi:
        if 0 <= s < len(sc):
            sc[s] -= STICK
    return sc, (state.kyotaku + len(state.riichi)) * STICK


# ---------------------------------------------------------------- 对手打点

def opp_value(riichi: bool, melds: list[dict], doras: set[int], oya: bool) -> dict:
    """对手打点推测（经验值）：立直 ≈ 子 5200 / 亲 7700；副露看可见宝牌。why 为结构化代码。"""
    vis_dora = sum(1 for m in melds for t in m.get("tiles", []) if idx(t) in doras or t.endswith("r"))
    if riichi:
        base, why = 5200 + 1300 * vis_dora, "riichi"
    elif melds:
        base, why = 2600 + 1300 * min(vis_dora, 3), "open"
    else:
        base, why = 3900, "dama"
    if oya:
        base = int(base * 1.5)
    return {"value": base, "why": why, "dora": vis_dora, "oya": oya}


# ---------------------------------------------------------------- 局面

def board(state) -> dict | None:
    me = state.self_seat
    if me is None or state.phase != "in_game" or not state.round_active:
        return None
    visible = visible_counts(state.rivers, state.melds, state.my_hand, state.dora_markers)
    unseen = max(1, 136 - sum(visible))
    left = state.left_tiles
    draws = max(0, (left or 0) // 4) if left is not None else 0
    melds = state.melds[me]
    closed = all(m["type"] == "ankan" for m in melds)
    riichi_me = me in state.riichi
    doras = dora_ids(state.dora_markers)
    opps = opponents(me=me, oya=state.oya, bakaze=state.bakaze, rivers=state.rivers, melds=state.melds,
                     riichi=state.riichi, hand=state.my_hand, dora_markers=state.dora_markers)
    for o in opps:
        o["value"] = opp_value(o["riichi"], state.melds[o["seat"]], doras, o["seat"] == state.oya)
    # 立直条件：持点 ≥ 立直棒，牌山至少还剩一巡，不会触发四家立直
    my_pts = state.scores[me] if me < len(state.scores) else None
    others = [s for s in state.riichi if s != me]
    why = None
    if my_pts is not None and my_pts < STICK:
        why = "no_points"
    elif left is not None and left < 4:
        why = "no_draw"
    elif len(others) >= 3:
        why = "four_riichi"
    warn: list[dict] = []
    if not why:
        if my_pts is not None and my_pts == STICK:
            warn.append({"code": "zero_points"})
        elif my_pts is not None and my_pts - STICK < 1000 * (1 + len(others)):
            warn.append({"code": "low_points", "left": my_pts - STICK})
        if left is not None and left < 8:
            warn.append({"code": "last_draws", "n": max(1, left // 4)})
        if others:
            warn.append({"code": "chase", "n": len(others)})
    return {"me": me, "oya": state.oya, "visible": visible, "unseen": unseen, "left": left, "draws": draws,
            "melds": melds, "n_melds": len(melds), "closed": closed, "riichi_me": riichi_me, "opps": opps,
            "threats": [o["threat"] for o in opps], "no_riichi": why, "riichi_warn": warn,
            "kyotaku": state.kyotaku, "my_river": {idx(d["tile"]) for d in state.rivers[me]}}


def counts(tiles) -> list[int]:
    c = [0] * 34
    for t in tiles:
        i = idx(t)
        if i >= 0:
            c[i] += 1
    return c


def remove_one(hand: list[str], tile: str) -> list[str] | None:
    h = list(hand)
    for cand in (tile, tile[:2] if tile.endswith("r") else tile + "r"):
        if cand in h:
            h.remove(cand)
            return h
    return None


def waits_for(state, b: dict, hand13: list[str], draws_before_me: int = 3) -> list[dict]:
    """13-3m 张听牌时：每张待牌 {"tile","left","ron","tsumo","riichi_ron","riichi_tsumo"}（None = 无役 / 不适用）。"""
    c13 = counts(hand13)
    ws = [{"tile": NAMES34[w], "left": max(0, 4 - b["visible"][w])} for w in E.waits(c13, b["n_melds"])]
    if not ws:
        return []
    from .value import wait_values
    return wait_values(state, hand13, ws, draws_before_me)


# ---------------------------------------------------------------- 默听 vs 立直

def _pts(r: dict | None) -> int:
    return int(r["points"]) if r else 0


def attack_plan(waits: list[dict], b: dict, furiten: bool) -> dict:
    """{"dama": plan, "riichi": plan?, "no_riichi": code?, "riichi_warn": [...], "mode": dama|riichi|open}。

    plan = {"win_rate","avg","ev","yakuless","left","tsumo_share","pot","stick_cost"}
    """
    unseen, draws, threats = b["unseen"], b["draws"], b["threats"]
    riichi_me = b["riichi_me"]

    def plan(prefix: str, riichi: bool) -> dict:
        ok = [w for w in waits if w.get(prefix + "ron")]
        tsumo_only = [w for w in waits if not w.get(prefix + "ron") and w.get(prefix + "tsumo")]
        left_ok = sum(w["left"] for w in ok)
        left_all = sum(w["left"] for w in waits)
        wr = E.win_rate(left_ok, unseen, draws, 4, riichi=riichi, furiten=furiten, opp_threats=threats)
        if tsumo_only:
            lt = sum(w["left"] for w in tsumo_only)
            wr = max(wr, E.win_rate(lt + left_ok, unseen, draws, 4, riichi=riichi, furiten=True, opp_threats=threats))
        yakuless = not ok and not tsumo_only
        if left_all == 0 or yakuless:
            return {"win_rate": 0.0, "avg": 0, "ev": 0, "yakuless": yakuless, "left": left_all,
                    "tsumo_share": 0.0, "pot": 0, "stick_cost": 0}
        p = left_all / max(unseen, 1)
        k = 0 if furiten else (0.25 if riichi else 0.45)
        t_share = 1 - (1 - p) ** draws
        r_share = 1 - (1 - p * k) ** (draws * 3)
        ts = t_share / (t_share + r_share) if (t_share + r_share) > 0 else 1
        tot = sum(w["left"] * (ts * _pts(w.get(prefix + "tsumo")) + (1 - ts) * _pts(w.get(prefix + "ron"))) for w in waits)
        avg = int(tot / left_all)
        pot = b["kyotaku"] * STICK
        cost = STICK if riichi and not riichi_me else 0
        ev = wr * (avg + pot) - (1 - wr) * cost
        return {"win_rate": round(wr, 3), "avg": avg, "ev": int(ev), "yakuless": False, "left": left_all,
                "tsumo_share": round(ts, 2), "pot": pot, "stick_cost": int((1 - wr) * cost)}

    res: dict = {"dama": plan("", riichi_me), "riichi_warn": []}
    if b["closed"] and not riichi_me:
        if b["no_riichi"]:
            res["no_riichi"] = b["no_riichi"]
        else:
            res["riichi"] = plan("riichi_", True)
            res["riichi_warn"] = b["riichi_warn"]
    if riichi_me:
        res["mode"] = "riichi"
    elif not b["closed"]:
        res["mode"] = "open"
    else:
        d, r = res["dama"], res.get("riichi")
        res["mode"] = "riichi" if r and (d["yakuless"] or r["ev"] > d["ev"] * 1.1) else "dama"
    return res


# ---------------------------------------------------------------- 押引：收益 vs 损失

def balance(b: dict, tile: str, shanten: int, attack: dict | None) -> dict:
    """押引红绿条：gain = 期望值（听牌时），loss = Σ 对手放铳率 × 对手估计打点（立直按 8000，亲家 ×1.5）。"""
    i = idx(tile)
    loss, parts = 0.0, []
    for o in b["opps"]:
        if o["riichi"]:
            val = 8000
        elif o["threat"] >= 0.4:
            val = 5200 if o["value"]["dora"] else 3900      # 副露里看得见宝牌 / 赤宝牌：按更贵算
        else:
            val = 3900
        if o["value"]["oya"]:
            val = int(val * 1.5)
        p = (o["d34"][i] if i >= 0 else 0.0) * o["threat"] / 100.0
        loss += p * val
        if p > 0:
            parts.append({"seat": o["seat"], "p": round(p * 100, 1), "val": val})
    gain = 0
    if shanten == 0 and attack:
        mode = attack.get("mode")
        pl = attack.get(mode if mode in ("dama", "riichi") else "dama") or {}
        gain = int(pl.get("ev", 0))
    return {"gain": gain, "loss": int(loss), "parts": parts, "tile": tile, "shanten": shanten}
