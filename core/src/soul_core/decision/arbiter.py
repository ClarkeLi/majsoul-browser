"""算法改判（移植自旧原型 bridge/arbiter.py 与 bridge.py 的 _arb_values / _arbitrate / _hora_veto）。

Mortal 出手后、执行之前，算法有权在 Mortal 自己给出的合法候选里改判：
  · 软改判：模型犹豫（第一候选 < 60%），算法看好的候选模型也给了 ≥ 15%，且算法价值高出 600 点
  · 硬否决：不管模型多有把握，放铳损失少 ≥ 2500 点、总价值也更高（候选概率 ≥ 3%）
  · 终局见逃：最后一局和了后仍是末位且对局就此结束 → 不和，等更大的牌
价值单位是「点数」：进攻价值 − 放铳损失；终盘把名次变化按 RANK_BONUS 折成点数加进去。
"""
from __future__ import annotations

from soul_core.analysis import attack as A
from soul_core.analysis import efficiency as E
from soul_core.analysis.defense import idx, NAMES34
from .actions import TILE_IDS

SOFT_TOP_MAX = 60.0
SOFT_ALT_MIN = 15.0
SOFT_MARGIN = 600
HARD_MARGIN = 2500
HARD_ALT_MIN = 3.0
RANK_BONUS = [15000, 5000, -5000, -20000]
HORA_VETO_MIN_LEFT = 4

ATTACK_BASE = {1: 2400, 2: 1000}   # 一 / 两向听时的进攻价值（点），再按进张、剩余巡目、对手威胁打折
ATTACK_FAR = 350                    # 三向听以上
THREAT_CUT = 0.6                    # 未听牌时：最大对手威胁 1.0 → 进攻价值只剩 40%
RIICHI_LOCK = 0.12                  # 立直后不能弃和：按对手威胁 × 打点估的后续放铳成本


def rank_value(scores: list[int], me: int) -> int:
    return RANK_BONUS[A.ranks(scores)[me]]


def decide(cands: list[dict], model_key: str, soft: bool = True) -> dict | None:
    """cands: [{"key","p"(%),"value","loss"}]。返回 None 表示不改判；否则 {"key","kind":soft|hard,"gain"}。"""
    model = next((c for c in cands if c["key"] == model_key), None)
    if model is None:
        return None
    top_p = max((c["p"] for c in cands), default=0.0)
    ml = model.get("loss", 0.0)
    pool = [c for c in cands if c["key"] != model_key and c["p"] >= HARD_ALT_MIN
            and ml - c.get("loss", 0.0) >= HARD_MARGIN and c["value"] > model["value"]]
    b = max(pool, key=lambda c: (c["value"], c["p"]), default=None)
    if b:
        return {"key": b["key"], "kind": "hard", "gain": int(b["value"] - model["value"])}
    if soft and top_p < SOFT_TOP_MAX:
        pool = [c for c in cands if c["key"] != model_key and c["p"] >= SOFT_ALT_MIN]
        b = max(pool, key=lambda c: (c["value"], c["p"]), default=None)
        if b and b["value"] - model["value"] >= SOFT_MARGIN:
            return {"key": b["key"], "kind": "soft", "gain": int(b["value"] - model["value"])}
    return None


def hora_scores(scores: list[int], winner: int, target: int | None, tsumo: bool, oya: int,
                pay: list[int], points: int, pot: int, honba: int) -> list[int]:
    """和了后的分数。pay 来自 mahjong 库（不含本场），本场在这里加：荣和 300 / 自摸每家 100。"""
    out = list(scores)
    if not tsumo:
        gain = points + 300 * honba
        out[winner] += gain + pot
        if target is not None and 0 <= target < 4:
            out[target] -= gain
        return out
    got = 0
    for s in range(4):
        if s == winner:
            continue
        x = (pay[0] if (winner == oya or s == oya) else pay[1]) + 100 * honba
        out[s] -= x
        got += x
    out[winner] += got + pot
    return out


def game_ends_after_win(state, after: list[int], winner: int) -> bool:
    """这次和了后对局是否结束（雀魂：最后一局子家和了 / 亲家和了止め；延长战有人过返点即止）。"""
    if min(after) < 0:
        return True
    if A.end_weight(state) < 1.0:
        return False
    rounds = getattr(state, "rounds", "半庄")
    if rounds == "一局":
        return True
    chang, ju = A.chang_ju(state)
    last = 0 if rounds == "东风" else 1
    if chang >= last + 2 or (chang == last + 1 and ju >= 3):
        return True
    reached = max(after) >= getattr(state, "fandian", 30000)
    if winner == state.oya:
        return reached and A.ranks(after)[winner] == 0
    return reached


# ---------------------------------------------------------------- 候选价值

def _values(state, b: dict, cands: list[dict]) -> None:
    """给每个候选（kind=dahai/reach, pai）填 value / loss / why（点数口径）。不可行的 value=None。"""
    me, hand = b["me"], list(state.my_hand)
    opts = {o["tile"]: o for o in E.discard_options(A.counts(hand), b["n_melds"], b["visible"])}
    best_total: dict[int, int] = {}
    for o in opts.values():
        best_total[o["shanten"]] = max(best_total.get(o["shanten"], 0), o["total"])
    w = A.end_weight(state)
    scores, pot = A.live_scores(state)
    cur_rv = rank_value(scores, me) if w else 0
    opp = []
    for o in b["opps"]:
        val = o["value"]["value"]
        pen = 0.0
        if w:
            after = list(scores)
            after[me] -= val
            after[o["seat"]] += val + pot
            pen = w * max(0, cur_rv - rank_value(after, me))
        opp.append((o, val, pen))
    lock = RIICHI_LOCK * sum(o["threat"] * val for o, val, _ in opp)
    far_cut = 1 - THREAT_CUT * max(b["threats"], default=0.0)
    for c in cands:
        i = idx(c["pai"])
        o_ = opts.get(i)
        if o_ is None:
            c["value"] = None
            continue
        loss = sum(o["d34"][i] * o["threat"] / 100.0 * (val + pen) for o, val, pen in opp)
        sh = o_["shanten"]
        why: dict = {"shanten": sh, "total": o_["total"]}
        if sh == 0:
            hand13 = A.remove_one(hand, c["pai"]) or []
            ws = A.waits_for(state, b, hand13)
            furiten = any(idx(x["tile"]) in (b["my_river"] | {i}) for x in ws)
            plan = A.attack_plan(ws, b, furiten)
            pick = plan.get("riichi") if c["kind"] == "reach" else plan.get("dama")
            if not pick or (c["kind"] == "reach" and plan.get("no_riichi")):
                c["value"] = None
                continue
            atk = float(pick["ev"])
            if w and pick.get("avg"):
                after = list(scores)
                after[me] += pick["avg"] + pot
                atk += pick["win_rate"] * w * (rank_value(after, me) - cur_rv)
            if c["kind"] == "reach":
                loss += lock
            why.update(win_rate=pick["win_rate"], avg=pick["avg"])
        elif c["kind"] == "reach":
            c["value"] = None
            continue
        else:
            base = ATTACK_BASE.get(sh, ATTACK_FAR)
            p_ok = 1 - (1 - min(1.0, o_["total"] / b["unseen"])) ** max(1, b["draws"])
            atk = base * min(1.0, o_["total"] / (best_total.get(sh) or 1)) * p_ok * far_cut
        c["value"] = atk - loss
        c["attack"] = int(atk)
        c["loss"] = loss
        c["why"] = why


def attack_estimate(state, b: dict, tile: str) -> int | None:
    """打出 tile 之后的进攻价值（点）：听牌时为期望值，否则按向听、进张、剩余巡目与对手威胁估。不可行时 None。"""
    c = {"kind": "dahai", "pai": tile}
    _values(state, b, [c])
    return None if c.get("value") is None else int(c["attack"])


def candidate_values(state, alts_all: list[dict], top: int = 5) -> list[dict]:
    """面板用：前几个打牌候选（以及立直）的 进攻价值 / 放铳损失 / 总价值（与改判同一口径）。"""
    b = A.board(state)
    hand = list(state.my_hand)
    if b is None or len(hand) % 3 != 2:
        return []
    cands = [{"key": "dahai:" + a["id"], "kind": "dahai", "pai": a["id"], "p": a["p"] * 100}
             for a in alts_all if a["id"] in TILE_IDS and a["id"] in hand][:top]
    r = next((a for a in alts_all if a["id"] == "reach"), None)
    if r and not b["riichi_me"]:
        opts = {o["tile"]: o["shanten"] for o in E.discard_options(A.counts(hand), b["n_melds"], b["visible"])}
        rp = next((a["id"] for a in alts_all if a["id"] in TILE_IDS and a["id"] in hand and opts.get(idx(a["id"])) == 0), None)
        if rp:
            cands.insert(0, {"key": "reach:" + rp, "kind": "reach", "pai": rp, "p": r["p"] * 100})
    if b["riichi_me"]:
        return []
    _values(state, b, cands)
    return [{"kind": c["kind"], "tile": c["pai"], "p": round(c["p"], 1), "value": int(c["value"]),
             "attack": c.get("attack", 0), "loss": int(c.get("loss", 0)), **(c.get("why") or {})}
            for c in cands if c.get("value") is not None]


# ---------------------------------------------------------------- 见逃

def _hora_veto(state, reaction: dict, event: dict, b: dict, ids: set[str]) -> tuple[dict, dict] | None:
    if A.end_weight(state) < 1.0 or b["left"] is None or b["left"] < HORA_VETO_MIN_LEFT:
        return None
    scores, pot = A.live_scores(state)
    me = b["me"]
    target = reaction.get("target", me)
    tsumo = target == me
    hand = list(state.my_hand)
    if tsumo:
        if len(hand) % 3 != 2 or not state.drawn:
            return None
        pai = state.drawn
        hand13 = A.remove_one(hand, pai) or []
    else:
        pai = event.get("pai") or ""
        hand13 = hand
    ws = A.waits_for(state, b, hand13)
    row = next((x for x in ws if idx(x["tile"]) == idx(pai)), None)
    res = row and row.get("tsumo" if tsumo else "ron")
    if not res:
        return None
    after = hora_scores(scores, me, target, tsumo, state.oya, res["pay"], res["points"], pot, state.honba)
    hi = after
    if b["riichi_me"] and res.get("level") != "yakuman":
        # 里宝牌：多算 1 番仍是末位才见逃（粗略：打点按 ×2 估，满贯以上 ×1.5）
        k = 2.0 if res["han"] < 5 else 1.5
        hi = hora_scores(scores, me, target, tsumo, state.oya, [int(x * k) for x in res["pay"]],
                         int(res["points"] * k), pot, state.honba)
    if not (A.ranks(after)[me] == 3 and A.ranks(hi)[me] == 3
            and game_ends_after_win(state, after, me) and game_ends_after_win(state, hi, me)):
        return None
    info = {"kind": "arb", "arb": "veto", "points": res["points"], "model": "hora"}
    if tsumo:
        if pai not in ids:
            return None
        return {"type": "dahai", "actor": me, "pai": pai, "tsumogiri": True}, {**info, "pick": pai}
    if "pass" not in ids:
        return None
    return {"type": "none"}, {**info, "pick": "pass"}


# ---------------------------------------------------------------- 入口

def arbitrate(state, reaction: dict, event: dict, alts_all: list[dict], soft: bool = True) -> tuple[dict, dict | None]:
    """模型 reaction → (最终 reaction, 改判信息 | None)。"""
    t = reaction.get("type")
    me = state.self_seat
    if t not in ("dahai", "reach", "hora") or me is None:
        return reaction, None
    if t == "hora" and reaction.get("actor", me) != me:
        return reaction, None
    b = A.board(state)
    if b is None:
        return reaction, None
    ids = {a["id"] for a in alts_all}
    if t == "hora":
        got = _hora_veto(state, reaction, event, b, ids)
        if not got:
            return reaction, None
        nr, info = got
        return {**nr, "meta": reaction.get("meta")}, info
    hand = list(state.my_hand)
    if b["riichi_me"] or len(hand) % 3 != 2:
        return reaction, None
    pmap = {a["id"]: a["p"] * 100 for a in alts_all}
    cands = [{"key": "dahai:" + a["id"], "kind": "dahai", "pai": a["id"], "p": a["p"] * 100}
             for a in alts_all if a["id"] in TILE_IDS and a["id"] in hand and a["p"] * 100 >= HARD_ALT_MIN]
    model_pai = reaction.get("pai") if t == "dahai" else None
    if model_pai and model_pai in hand and not any(c["pai"] == model_pai for c in cands):
        cands.append({"key": "dahai:" + model_pai, "kind": "dahai", "pai": model_pai, "p": pmap.get(model_pai, 0.0)})
    reach_pai = None
    if "reach" in pmap:
        opts = {o["tile"]: o["shanten"] for o in E.discard_options(A.counts(hand), b["n_melds"], b["visible"])}
        reach_pai = next((a["id"] for a in alts_all if a["id"] in TILE_IDS and a["id"] in hand
                          and opts.get(idx(a["id"])) == 0), None)
        if reach_pai:
            cands.append({"key": "reach:" + reach_pai, "kind": "reach", "pai": reach_pai, "p": pmap["reach"]})
    model_key = ("dahai:" + model_pai) if model_pai else ("reach:" + reach_pai if reach_pai else "")
    if not model_key:
        return reaction, None
    _values(state, b, cands)
    model = next((c for c in cands if c["key"] == model_key), None)
    if model is None or model["value"] is None:
        return reaction, None
    ok = [c for c in cands if c["value"] is not None]
    d = decide(ok, model_key, soft)
    if not d:
        return reaction, None
    pick = next(c for c in ok if c["key"] == d["key"])

    def brief(c: dict) -> dict:
        return {"kind": c["kind"], "tile": c["pai"], "p": round(c["p"], 1), "value": int(c["value"]),
                "attack": c.get("attack", 0), "loss": int(c.get("loss", 0)), **(c.get("why") or {})}

    info = {"kind": "arb", "arb": d["kind"], "gain": d["gain"],
            "model": "reach" if model["kind"] == "reach" else model["pai"],
            "pick": "reach" if pick["kind"] == "reach" else pick["pai"],
            "model_opt": brief(model), "pick_opt": brief(pick)}
    if pick["kind"] == "reach":
        return {"type": "reach", "actor": me, "meta": reaction.get("meta"), "_reach_pai": pick["pai"]}, info
    return {"type": "dahai", "actor": me, "pai": pick["pai"], "tsumogiri": pick["pai"] == state.drawn,
            "meta": reaction.get("meta")}, info


__all__ = ["arbitrate", "candidate_values", "decide", "hora_scores", "game_ends_after_win", "NAMES34"]
