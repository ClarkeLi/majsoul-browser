"""Mortal reaction -> 推荐 + ActionIntent。

风格（掷骰 + 爱赌，见 style.py）打开时可能换成另一个合法候选；关闭时完全按模型第一名。
"""
from __future__ import annotations

import itertools
import random

from soul_core.game.state import GameState
from soul_core.game.hand_tracker import to_server_tile
from soul_core.game.tiles import to_mjai
from soul_core.protocol.optype import ADD_GANG, AN_GANG, DAPAI, LIQI, MING_GANG, RONG, ZIMO
from soul_core.analysis import board
from soul_core.analysis.teach import build_tips
from . import plan as planmod
from .think import decision_delay
from .style import apply_style
from .actions import TILE_IDS, alternatives
from .validate import LegalActions, parse_operations, reaction_to_intent

_ids = itertools.count(1)


def new_action_id() -> str:
    return f"a{next(_ids)}"
DEFAULT_BUDGET_MS = 20000


def legal_actions(state: GameState, now: float = 0.0) -> LegalActions | None:
    if state.operation is None or state.self_seat is None:
        return None
    return parse_operations({"operation": state.operation}, state.self_seat, now)


def _budget_ms(state: GameState) -> int:
    op = state.operation or {}
    # 真实抓包：time_fixed / time_add 的单位是毫秒（友人房 time_fixed=300000）
    total = (op.get("time_fixed") or 0) + (op.get("time_add") or 0)
    return int(total) if total else DEFAULT_BUDGET_MS


def _pick_riichi_tile(legal: LegalActions, alts: list[dict]) -> str | None:
    """立直宣言牌：概率最高、且服务端允许的打牌候选。"""
    allowed = set(legal.liqi_tiles)
    for a in alts:
        if a["id"] in TILE_IDS and to_server_tile(a["id"]) in allowed:
            return a["id"]
    return None


def build_decision(state: GameState, reaction: dict, event: dict, latency_ms: float,
                   revision: int, now: float = 0.0, top: int = 3, elapsed_s: float | None = None,
                   fresh_round: bool = False, rng=random.uniform, style: dict | None = None,
                   style_rng: random.Random | None = None) -> dict:
    """返回 ``{"recommendation": {...}, "intent": {...}|None, "reject": str|None}``。

    intent 不通过校验（非法动作 / 无法规划点击）时为 None，reject 给出原因，
    此时仍然给出推荐（辅助模式可用），但自动模式不会执行。
    """
    meta = reaction.get("meta") or {}
    alts_all = alternatives(meta)
    alts = alts_all[:top]
    model_reaction = reaction
    reaction, style_info = apply_style(state, reaction, event, alts_all, style, style_rng or random.Random())
    rtype = reaction.get("type", "none")
    rec = {
        "revision": revision, "mjai": {k: v for k, v in reaction.items() if k != "meta" and not k.startswith("_")},
        "kind": None, "tile": reaction.get("pai"), "consumed": reaction.get("consumed") or [],
        "confidence": alts_all[0]["p"] if alts_all else None, "alts": alts,
        "latency_ms": round(latency_ms, 1), "shanten": meta.get("shanten"),
        "ctx": event.get("type"),
    }
    legal = legal_actions(state, now)
    if style_info:
        # 复盘的“一致率”对照的是模型第一名，所以把它原本的选择也记下来
        mt = model_reaction.get("type", "none")
        style_info["model_kind"] = _display_kind(mt, model_reaction, None)
        style_info["model_tile"] = model_reaction.get("pai")
        pick = next((a for a in alts_all if a["id"] == style_info["pick"]), None)
        if pick:
            rec["confidence"] = pick["p"]
        rec["style"] = style_info
    _attach_insight(rec, state, alts_all)
    hand_sorted, drawn = state.hand_view()
    hand_all = list(state.my_hand)
    discard_tile = None
    if rtype == "reach" and legal is not None:
        forced = reaction.get("_reach_pai")          # 算法改判选定的立直宣言牌
        discard_tile = forced if forced and to_server_tile(forced) in set(legal.liqi_tiles) else _pick_riichi_tile(legal, alts_all)
        rec["riichi_tile"] = discard_tile
    base = reaction_to_intent(legal, reaction, hand_all, state.last_discard,
                              to_server_tile(discard_tile) if discard_tile else None) if legal else None
    rec["kind"] = _display_kind(rtype, reaction, base)
    if base is None:
        return {"recommendation": rec, "intent": None, "reject": "illegal", "alts_all": alts_all}
    if rtype == "reach" and base.get("needs_discard"):
        return {"recommendation": rec, "intent": None, "reject": "no_riichi_tile", "alts_all": alts_all}

    steps = _plan(base, legal, state, hand_sorted, drawn, reaction, discard_tile)
    if steps is None:
        return {"recommendation": rec, "intent": None, "reject": "no_plan", "alts_all": alts_all}
    rec["steps"] = steps            # 辅助模式也用它在游戏画面上高亮“该点哪里”
    # 思考时间：按把握度决定等多久再点（旧原型的 think_seconds）；elapsed 含推理耗时
    elapsed = latency_ms / 1000 if elapsed_s is None else elapsed_s
    target_s, wait_s = decision_delay(alts_all, state.operation, elapsed, fresh_round, rng, n_steps=len(steps))
    rec["think_ms"] = round(target_s * 1000)
    budget = _budget_ms(state)
    if elapsed * 1000 + 500 >= budget:
        return {"recommendation": rec, "intent": None, "reject": "no_time", "alts_all": alts_all}
    only_buttons = all(s["t"] == "button" for s in steps)
    intent = {
        "actionId": new_action_id(), "revision": revision, "kind": rec["kind"],
        "op_type": base["type"], "tile": rec["tile"] or discard_tile, "consumed": rec["consumed"],
        "steps": steps, "idempotent": only_buttons, "ttl_ms": int(max(0.0, budget - elapsed * 1000)),
        "operation_list": [o.get("type") for o in (state.operation or {}).get("operation_list", [])],
        "delay_ms": round(wait_s * 1000),
    }
    return {"recommendation": rec, "intent": intent, "reject": None, "alts_all": alts_all}


def _display_kind(rtype: str, r: dict, base: dict | None) -> str:
    if rtype == "dahai":
        return "discard"
    if rtype == "reach":
        return "riichi"
    if rtype == "hora":
        return "tsumo" if r.get("target") == r.get("actor") else "ron"
    return {"chi": "chi", "pon": "pon", "daiminkan": "daiminkan", "ankan": "ankan", "kakan": "kakan",
            "ryukyoku": "kyuushu", "none": "pass"}.get(rtype, rtype)


def _plan(base, legal, state, hand_sorted, drawn, reaction, discard_tile):
    op_list = (state.operation or {}).get("operation_list", [])
    t = base["type"]
    if base["kind"] == "dapai":
        s = planmod.hand_step(hand_sorted, drawn, to_mjai(base["tile"]), bool(reaction.get("tsumogiri")))
        return [s] if s else None
    if base["kind"] == "liqi":
        btn = planmod.button_plan(op_list, LIQI)
        tsumogiri = discard_tile is not None and discard_tile == drawn
        s = planmod.hand_step(hand_sorted, drawn, discard_tile, tsumogiri) if discard_tile else None
        return None if btn is None or s is None else btn + [s]
    if base["kind"] == "pass":
        return [{"t": "button", "slot": 0}]
    consumed = reaction.get("consumed") or []
    return planmod.button_plan(op_list, t, consumed, reaction.get("pai"))


def _attach_insight(rec: dict, state: GameState, alts_all: list[dict]) -> None:
    """候选打牌的牌效（打后向听/进张/待牌）与对推荐牌的押引判断。只用于展示，出错就不附带。"""
    try:
        tiles = [a["tile"] for a in alts_all if a.get("tile")][:8]
        focus = rec.get("tile") if rec["mjai"].get("type") == "dahai" else None
        if rec["mjai"].get("type") == "reach":
            focus = rec.get("riichi_tile")
        if focus and focus not in tiles:
            tiles.append(focus)
        opts = board.discard_insight(state, tiles)
        if not opts:
            rec["tips"] = build_tips(rec, state.snapshot()["analysis"], {}, alts_all)
            rec["insight"] = {"options": {}, "verdict": None, "focus_risk": None, "groups": board.group_view(state)}
            return
        a = state.snapshot()["analysis"] or {}
        maxt = max((t["threat"] for t in a.get("threat", [])), default=0.0)
        f_opt = opts.get(focus) if focus else None
        risk = (a.get("risk") or {}).get(focus, {}).get("risk") if focus else None
        rec["insight"] = {
            "options": opts,
            "verdict": board.verdict(f_opt["shanten"] if f_opt else None, risk, maxt) if f_opt else None,
            "focus_risk": risk,
            "groups": board.group_view(state, focus) if focus else board.group_view(state),
        }
        _attach_points(rec, state, focus, f_opt, alts_all)
        rec["tips"] = build_tips(rec, a, opts, alts_all)
    except Exception:  # noqa: BLE001 - 展示用，不能影响决策
        return


def _attach_points(rec: dict, state: GameState, focus: str | None, f_opt: dict | None, alts_all: list[dict]) -> None:
    """点数口径的展示数据：默听 vs 立直期望值、押引红绿条（收益 vs 损失）、候选价值对比。出错就不附带。"""
    from soul_core.analysis import attack as A
    from .arbiter import attack_estimate, candidate_values
    try:
        b = A.board(state)
        if b is None or not focus or not f_opt:
            return
        ins = rec["insight"]
        atk = None
        if f_opt["shanten"] == 0:
            hand13 = A.remove_one(list(state.my_hand), focus) or []
            ws = A.waits_for(state, b, hand13)
            furiten = any(idx_ in b["my_river"] | {A.idx(focus)} for idx_ in (A.idx(w["tile"]) for w in ws))
            atk = A.attack_plan(ws, b, furiten)
            atk["furiten"] = furiten
            atk["unseen"], atk["draws"] = b["unseen"], b["draws"]
            ins["attack"] = atk
        bal = A.balance(b, focus, f_opt["shanten"], atk)
        if f_opt["shanten"] > 0:
            # 未听牌：和牌收益按向听与进张估（与候选价值、算法改判同一口径），红绿条显示的是净值
            est = attack_estimate(state, b, focus)
            if est is not None:
                bal["gain"], bal["est"] = est, True
        ins["balance"] = bal
        ins["values"] = candidate_values(state, alts_all)
    except Exception:  # noqa: BLE001 - 展示用
        return
    finally:
        try:
            from soul_core.analysis.knowledge import build as build_knowledge
            rec["knowledge"] = build_knowledge(rec, A.board(state), state)
        except Exception:  # noqa: BLE001
            pass
