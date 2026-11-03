"""intent -> 抽象点击计划（不含坐标；坐标由 Electron 的 ui-map 按 16×9 映射）。

步骤类型：
  {"t": "hand", "index": i, "gap": bool}   点手牌第 i 张（排序后，不含刚摸的牌）；gap=True 表示刚摸的那张
  {"t": "button", "slot": k}               点按钮槽位 k（0 = 右下“跳过”，优先级越高越靠上/靠左）
  {"t": "candidate", "index": i, "count": n, "kan": bool}   在 n 个候选组合里点第 i 个
槽位规则与 MahjongCopilot 的 Positions/ACTION_PIORITY 一致（GPL-3.0）。
"""
from soul_core.game.tiles import to_mjai
from soul_core.protocol.optype import (
    ADD_GANG, AN_GANG, CHI, DAPAI, JIUZHONG, LIQI, MING_GANG, PENG, RONG, ZIMO,
)

# 以服务端 operation type 为下标；0 = 跳过（永远在槽位 0）
PRIORITY = {0: 0, DAPAI: 99, CHI: 4, PENG: 3, AN_GANG: 3, MING_GANG: 2, ADD_GANG: 3,
            LIQI: 2, ZIMO: 1, RONG: 1, JIUZHONG: 5}


def button_types(operation_list: list[dict], op_type: int) -> tuple[list[int], list[str]]:
    """返回 (按槽位顺序排列的 type 列表, 所选 type 的候选组合串)。

    暗杠/加杠共用一个“杠”按钮，候选合并为 [加杠…, 暗杠…]，只保留被选中的那种。
    """
    ops = [dict(o) for o in operation_list if isinstance(o, dict) and o.get("type") in PRIORITY]
    ops.append({"type": 0, "combination": []})
    ops.sort(key=lambda o: PRIORITY[o["type"]])        # 稳定排序，同优先级保持服务端顺序
    combos_of = {o["type"]: list(o.get("combination") or []) for o in ops}
    if op_type in (AN_GANG, ADD_GANG):
        merged = combos_of.get(ADD_GANG, []) + combos_of.get(AN_GANG, [])
        keep = op_type
        drop = AN_GANG if keep == ADD_GANG else ADD_GANG
        ops = [o for o in ops if o["type"] != drop]
        combos_of[keep] = merged
    return [o["type"] for o in ops], combos_of.get(op_type, [])


def _norm(tiles: list[str]) -> list[str]:
    return sorted(to_mjai(t) for t in tiles)


def hand_step(hand: list[str], drawn: str | None, tile: str, tsumogiri: bool) -> dict | None:
    """点哪张手牌；找不到返回 None（失败关闭）。"""
    if tsumogiri and drawn is not None and to_mjai(tile) == drawn:
        return {"t": "hand", "index": len(hand), "gap": True}
    for i, t in enumerate(hand):
        if t == tile:
            return {"t": "hand", "index": i, "gap": False}
    # 庄家第一巡等“没有单独摸牌”的情形：刚摸的牌已并入手牌，按排序位置点
    return None


def button_plan(operation_list: list[dict], op_type: int, consumed: list[str] | None = None,
                pai: str | None = None) -> list[dict] | None:
    types, combos = button_types(operation_list, op_type)
    if op_type not in types:
        return None
    steps: list[dict] = [{"t": "button", "slot": types.index(op_type)}]
    if op_type in (CHI, PENG, MING_GANG, AN_GANG, ADD_GANG) and len(combos) != 1:
        if not combos:
            return None
        want = _norm(consumed or [])
        idx = None
        for i, c in enumerate(combos):
            toks = [x for x in str(c).replace(",", "|").split("|") if x]
            if op_type == ADD_GANG:
                if pai is not None and _norm(toks[:1]) == _norm([pai]):
                    idx = i
                    break
            elif _norm(toks) == want:
                idx = i
                break
        if idx is None:
            return None
        steps.append({"t": "candidate", "index": idx, "count": len(combos),
                      "kan": op_type in (AN_GANG, ADD_GANG)})
    return steps
