"""知识点：这一手相关的 1–3 条规则 / 常识（移植自旧原型 panel.html 的 renderTips）。

只读已经算好的数据，返回结构化代码 ``[{"code", ...params}]``，由界面按语言渲染。
"""
from __future__ import annotations

from .defense import NAMES34, chance, idx, suji_class

MAX_KNOWLEDGE = 3


def build(rec: dict, b: dict | None, state) -> list[dict]:
    ins = rec.get("insight") or {}
    atk = ins.get("attack")
    opts = ins.get("options") or {}
    kind = rec.get("kind")
    focus = rec.get("riichi_tile") if kind == "riichi" else rec.get("tile")
    f_opt = opts.get(focus) if focus else None
    sh = f_opt["shanten"] if f_opt else (rec.get("shanten") if rec.get("shanten") is not None else 8)
    out: list[dict] = []
    me = state.self_seat
    closed = bool(b and b["closed"])
    riichi_me = me in state.riichi
    waits = [u["tile"] for u in (f_opt or {}).get("ukeire", [])] if f_opt and f_opt["shanten"] == 0 else []

    if atk and atk.get("furiten"):
        out.append({"code": "k_furiten", "waits": waits})
    if atk and atk["dama"].get("yakuless") and closed and not riichi_me:
        out.append({"code": "k_yakuless"})
    ri = sorted(s for s in state.riichi if s != me)
    if ri and sh >= 2:
        out.append({"code": "k_fold", "seats": ri, "shanten": sh})
    if ri and b:
        o = next((x for x in b["opps"] if x["seat"] == ri[0]), None)
        if o:
            hand = {idx(t) for t in state.my_hand} - {-1}
            ends = [NAMES34[i] for i in sorted(hand) if i < 27 and i % 9 in (0, 8) and suji_class(i, o["safe"]) == "suji"
                    and i not in o["safe"]]
            out.append({"code": "k_suji", "seat": ri[0], "tiles": ends[:2]})
    if b:
        hand = sorted({idx(t) for t in state.my_hand} - {-1})
        no = [NAMES34[i] for i in hand if chance(i, b["visible"]) == "no"]
        one = [NAMES34[i] for i in hand if chance(i, b["visible"]) == "one"]
        if no:
            out.append({"code": "k_no_chance", "tiles": no[:4]})
        elif one and ri:
            out.append({"code": "k_one_chance", "tiles": one[:4]})
    if len(waits) >= 3:
        out.append({"code": "k_multi_wait", "waits": waits, "left": f_opt["total"]})
    if atk and atk.get("riichi") and not atk["dama"].get("yakuless"):
        d = atk["riichi"]["ev"] - atk["dama"]["ev"]
        # 与推荐打法一致：立直要比默听高出 10% 以上才推荐立直，差距更小时默听更稳
        code = "k_riichi_ev" if atk.get("mode") == "riichi" else ("k_ev_close" if d > 0 else "k_dama_ev")
        out.append({"code": code, "diff": abs(int(d)), "dama": atk["dama"]["avg"], "riichi": atk["riichi"]["avg"]})
    if kind in ("discard", "riichi") and focus and opts:
        best = min(opts.items(), key=lambda kv: (kv[1]["shanten"], -kv[1]["total"]))
        if best[0] != focus and f_opt and best[1]["shanten"] == f_opt["shanten"] and best[1]["total"] > f_opt["total"]:
            out.append({"code": "k_not_max", "best": best[0], "best_total": best[1]["total"],
                        "tile": focus, "total": f_opt["total"]})
    if not out and sh > 0:
        out.append({"code": "k_ukeire"})
    return out[:MAX_KNOWLEDGE]
