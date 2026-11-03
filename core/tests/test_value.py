from types import SimpleNamespace

from soul_core.analysis.value import wait_values

# 234m 678m 34p 55p(赤) 567p? 用一个简单的两面听：234m 678m 345p 22s + 67p 听 58p
HAND = ["2m", "3m", "4m", "6m", "7m", "8m", "3p", "4p", "5pr", "2s", "2s", "6p", "7p"]
WAITS = [{"tile": "5p", "left": 3}, {"tile": "8p", "left": 4}]


def st(**kw):
    base = dict(self_seat=1, oya=0, bakaze="E", melds=[[], [], [], []], riichi=set(), ippatsu=set(),
                left_tiles=40, dora_markers=["1s"], last_discarder=0)
    base.update(kw)
    return SimpleNamespace(**base)


def by_tile(vals):
    return {v["tile"]: v for v in vals}


def yaku_ids(x):
    return {y for y, _ in x["yaku"]}


def test_dama_vs_riichi():
    v = by_tile(wait_values(st(), HAND, WAITS, 3))
    # 默听：平和 断幺 赤1（+ 宝牌 2s×2）
    ron = v["8p"]["ron"]
    assert ron is not None and 12 in yaku_ids(ron) and 13 in yaku_ids(ron)
    assert ron["han"] == 5            # 平和1 断幺1 赤1 宝牌2
    assert v["8p"]["riichi_ron"]["han"] == ron["han"] + 1
    # 自摸多一个门前清自摸和
    assert v["8p"]["tsumo"]["han"] == ron["han"] + 1


def test_ippatsu_and_houtei_haitei():
    v = by_tile(wait_values(st(riichi={1}, ippatsu={1}, left_tiles=0), HAND, WAITS, 3))
    ids = yaku_ids(v["5p"]["ron"])
    assert {1, 3, 7} <= ids           # 立直 一发 河底捞鱼
    assert v["5p"]["riichi_ron"] is None      # 已经立直了，不再比较
    # 海底：下一次自己摸的是最后一张（别家还要摸 3 张 → 牌山剩 4）
    v2 = by_tile(wait_values(st(left_tiles=4), HAND, WAITS, 3))
    assert 6 in yaku_ids(v2["5p"]["tsumo"])
    v3 = by_tile(wait_values(st(left_tiles=5), HAND, WAITS, 3))
    assert 6 not in yaku_ids(v3["5p"]["tsumo"])


def test_open_hand_without_yaku():
    # 吃了 234m 之后：678m 345p 22s 67p，有断幺 → 有役
    hand = ["6m", "7m", "8m", "3p", "4p", "5p", "2s", "2s", "6p", "7p"]
    melds = [[], [{"type": "chi", "tiles": ["2m", "4m", "3m"], "from": 0}], [], []]
    v = by_tile(wait_values(st(melds=melds), hand, WAITS, 3))
    assert v["5p"]["ron"] is not None and 13 in yaku_ids(v["5p"]["ron"])
    # 换成 1s 雀头：没有断幺、没有役 → None
    hand2 = ["6m", "7m", "8m", "3p", "4p", "5p", "1s", "1s", "6p", "7p"]
    v = by_tile(wait_values(st(melds=melds), hand2, WAITS, 3))
    assert v["5p"]["ron"] is None and v["5p"]["riichi_ron"] is None


def test_dealer_points_higher():
    ko = by_tile(wait_values(st(), HAND, WAITS, 3))["8p"]["ron"]["points"]
    oya = by_tile(wait_values(st(oya=1), HAND, WAITS, 3))["8p"]["ron"]["points"]
    assert oya > ko
