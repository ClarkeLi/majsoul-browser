from soul_core.decision import plan
from soul_core.game.tiles import sort_tiles, tile_zh, to_mjai


def op(t, *combo):
    return {"type": t, "combination": list(combo)}


def test_tile_sort_red_five_first():
    assert sort_tiles(["5m", "5mr", "1z" and "E", "9s", "1m"]) == ["1m", "5mr", "5m", "9s", "E"]
    assert to_mjai("0p") == "5pr" and to_mjai("3z") == "W" and tile_zh("5sr") == "赤五索"


def test_button_slots_follow_priority():
    # 吃(4) 碰(3) 荣(1) -> 荣 最靠近 0 槽位之后：[跳过, 荣, 碰, 吃]
    types, _ = plan.button_types([op(2, "4m|6m"), op(3, "5p|5p"), op(9)], 9)
    assert types == [0, 9, 3, 2]
    assert plan.button_plan([op(2, "4m|6m"), op(3, "5p|5p"), op(9)], 3, ["5p", "5p"])[0] == {"t": "button", "slot": 2}


def test_chi_candidates_click_matching_combo():
    ops = [op(2, "4m|6m", "0m|6m", "3m|4m")]
    steps = plan.button_plan(ops, 2, ["5mr", "6m"])
    assert steps == [{"t": "button", "slot": 1}, {"t": "candidate", "index": 1, "count": 3, "kan": False}]
    assert plan.button_plan(ops, 2, ["1m", "2m"]) is None            # 组合不存在：失败关闭


def test_single_combo_needs_no_candidate_click():
    assert plan.button_plan([op(3, "5p|5p")], 3, ["5p", "5p"]) == [{"t": "button", "slot": 1}]


def test_kan_merges_kakan_then_ankan():
    ops = [op(6, "3m"), op(4, "7p|7p|7p|7p")]
    steps = plan.button_plan(ops, 4, ["7p"] * 4)
    assert steps[0]["t"] == "button" and steps[1] == {"t": "candidate", "index": 1, "count": 2, "kan": True}
    steps = plan.button_plan(ops, 6, [], pai="3m")
    assert steps[1]["index"] == 0


def test_hand_step():
    hand = ["1m", "2m", "5mr", "9p"]
    assert plan.hand_step(hand, "E", "E", True) == {"t": "hand", "index": 4, "gap": True}
    assert plan.hand_step(hand, "E", "5mr", False) == {"t": "hand", "index": 2, "gap": False}
    assert plan.hand_step(hand, None, "3s", False) is None


def test_time_budget_is_milliseconds():
    from soul_core.decision.decide import _budget_ms
    from soul_core.game.state import GameState
    gs = GameState()
    gs.operation = {"time_fixed": 5000, "time_add": 20000}
    assert _budget_ms(gs) == 25000
    gs.operation = {}
    assert _budget_ms(gs) == 20000
    gs.operation = {"time_fixed": 300000, "time_add": 0}
    assert _budget_ms(gs) == 300000
