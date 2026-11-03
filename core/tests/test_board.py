from soul_core.analysis import board, efficiency as E
from soul_core.game.state import GameState


def gs_with(hand, melds=None):
    gs = GameState()
    gs.self_seat, gs.phase, gs.round_active = 0, "in_game", True
    gs.my_hand = list(hand)
    if melds:
        gs.melds[0] = melds
    return gs


def test_shanten_basics():
    c = [0] * 34
    for i in (0, 1, 2, 9, 10, 11, 18, 19, 20, 27, 27, 27, 5):   # 123m 123p 123s 东东东 6m：听 6m 单骑（缺雀头）
        c[i] += 1
    assert E.shanten(c) == 0
    assert E.waits(c) == [5]


def test_wait_state_tenpai_lists_waits_with_remaining():
    hand = ["1m", "2m", "3m", "1p", "2p", "3p", "1s", "2s", "3s", "E", "E", "E", "6m"]
    st = board.wait_state(gs_with(hand))
    assert st["shanten"] == 0 and st["waits"] == [{"tile": "6m", "left": 3}]       # 手里一张 6m


def test_wait_state_none_when_fourteen_tiles():
    assert board.wait_state(gs_with(["1m"] * 14)) is None


def test_discard_insight_after_discard_shanten():
    hand = ["1m", "2m", "3m", "1p", "2p", "3p", "1s", "2s", "3s", "E", "E", "E", "6m", "9p"]
    ins = board.discard_insight(gs_with(hand), ["9p", "6m"])
    assert ins["9p"]["shanten"] == 0 and ins["9p"]["total"] == 3 and ins["9p"]["ukeire"][0]["tile"] == "6m"
    assert ins["6m"]["shanten"] == 0                                              # 打 6m 留 9p 单骑，同样听牌


def test_verdict_rules():
    assert board.verdict(0, 1.0, 0.2)["advice"] == "push"
    assert board.verdict(0, 12.0, 1.0)["advice"] == "fold"
    assert board.verdict(2, 5.0, 0.9)["advice"] == "fold"
    assert board.verdict(1, 5.0, 0.9)["advice"] == "balance"
    assert board.verdict(1, 2.0, 0.2)["advice"] == "push"


def test_group_view_before_and_after_discard():
    hand = ["1m", "2m", "3m", "1p", "2p", "3p", "1s", "2s", "3s", "E", "E", "E", "6m", "9p"]
    gs = gs_with(hand)
    assert board.group_view(gs) is None                         # 14 张且没指定要打哪张：不分组
    v = board.group_view(gs, "9p")
    assert v["discard"] == "9p" and v["shanten"] == 0 and v["total"] == 3
    assert all("9p" not in g["tiles"] for g in v["groups"])


def test_snapshot_and_recommendation_carry_groups():
    gs = gs_with(["1m", "2m", "3m", "1p", "2p", "3p", "1s", "2s", "3s", "E", "E", "E", "6m"])
    gs.self_seat = 0
    snap = gs.snapshot()
    assert snap["analysis"]["groups"]["shanten"] == 0
