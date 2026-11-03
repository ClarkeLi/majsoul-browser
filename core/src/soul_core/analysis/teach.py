"""教学提示：把“为什么这样打”拆成 1–3 条结构化的小理由，由界面按语言渲染。

只用已经算出的数据（牌效、押引、放铳率、待牌），不做新的判断，也不影响任何动作。
返回 ``[{"code": ..., ...params}]``，按重要性排序，最多 MAX_TIPS 条。
"""
from __future__ import annotations

MAX_TIPS = 3


def _opt_brief(o: dict | None) -> dict | None:
    return None if o is None else {"shanten": o["shanten"], "total": o["total"]}


def build_tips(rec: dict, analysis: dict | None, options: dict[str, dict], alts_all: list[dict]) -> list[dict]:
    tips: list[dict] = []
    kind = rec.get("kind")
    a = analysis or {}
    focus = rec.get("riichi_tile") if kind == "riichi" else rec.get("tile")
    f_opt = options.get(focus) if focus else None
    verdict = (rec.get("insight") or {}).get("verdict")
    threats = a.get("threat") or []
    top = max(threats, key=lambda t: t["threat"], default=None)

    # 1) 为什么选这张：和第二候选的牌效对比
    if kind in ("discard", "riichi") and f_opt:
        second = next((x for x in alts_all if x.get("tile") and x["tile"] != focus and x["tile"] in options), None)
        if second:
            b_opt = options[second["tile"]]
            # 先比向听（离和牌更近），向听相同再比进张数；否则说明两者接近
            if f_opt["shanten"] < b_opt["shanten"]:
                code = "why_closer"
            elif f_opt["shanten"] == b_opt["shanten"] and f_opt["total"] > b_opt["total"]:
                code = "why_more"
            else:
                code = "close_call"
            tips.append({"code": code, "tile": focus, "alt": second["tile"], "a": _opt_brief(f_opt), "b": _opt_brief(b_opt)})

    # 2) 听牌 / 待牌 / 振听
    if f_opt and f_opt["shanten"] == 0 and f_opt["ukeire"]:
        tips.append({"code": "tenpai", "waits": [u["tile"] for u in f_opt["ukeire"][:6]], "total": f_opt["total"]})
    elif a.get("wait") and a["wait"]["shanten"] == 0 and a["wait"]["waits"]:
        tips.append({"code": "tenpai", "waits": [w["tile"] for w in a["wait"]["waits"][:6]], "total": sum(w["left"] for w in a["wait"]["waits"])})
    if a.get("furiten"):
        tips.append({"code": "furiten"})

    # 3) 防守：对谁最危险、手里哪两张最安全以及为什么
    if top and top["threat"] >= 0.45:
        risks = [(t, r) for t, r in (a.get("risk") or {}).items() if r.get("why")]
        risks.sort(key=lambda x: x[1]["risk"])
        safest = [{"tile": t, "why": r["why"], "risk": r["risk"]} for t, r in risks[:2]]
        if verdict and verdict["advice"] == "fold":
            tips.append({"code": "fold", "seat": top["seat"], "safe": safest})
        elif safest:
            tips.append({"code": "safe_tiles", "seat": top["seat"], "safe": safest})

    # 4) 动作自带的规则小知识
    if kind == "riichi":
        tips.append({"code": "riichi_rule"})
    elif kind in ("chi", "pon", "daiminkan"):
        tips.append({"code": "call_rule", "kind": kind})
    elif kind == "kyuushu":
        tips.append({"code": "kyuushu_rule"})
    elif kind == "pass":
        tips.append({"code": "pass_rule"})
    elif kind in ("tsumo", "ron"):
        tips.append({"code": "win_rule"})

    # 5) 术语解释：还没听牌时解释“向听 / 进张”，有押引时解释押引
    if f_opt and f_opt["shanten"] > 0:
        tips.append({"code": "k_ukeire"})
    if verdict and not any(t["code"] in ("fold", "safe_tiles") for t in tips):
        tips.append({"code": "k_pushfold"})

    seen, out = set(), []
    for t in tips:
        if t["code"] not in seen:
            seen.add(t["code"])
            out.append(t)
    return out[:MAX_TIPS]
