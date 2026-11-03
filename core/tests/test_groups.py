from soul_core.analysis import efficiency as E
from soul_core.analysis.defense import idx
from soul_core.analysis.groups import group_view

VIS0 = [0] * 34


def kinds(v):
    return [g["kind"] for g in v["groups"]]


def test_sets_taatsu_head_and_isolated_with_waits():
    hand = ["1m", "2m", "3m", "4p", "5p", "6p", "7s", "8s", "E", "E", "5m", "7m", "9p"]
    v = group_view(hand, 0, VIS0)
    assert v["shanten"] == 1 and v["form"] == "regular"
    assert kinds(v).count("run") == 2
    ryan = next(g for g in v["groups"] if g["kind"] == "ryanmen")
    assert ryan["tiles"] == ["7s", "8s"] and [w["tile"] for w in ryan["waits"]] == ["6s", "9s"]
    kan = next(g for g in v["groups"] if g["kind"] == "kanchan")
    assert kan["tiles"] == ["5m", "7m"] and kan["waits"] == [{"tile": "6m", "left": 4}]
    assert any(g["kind"] == "head" and g["tiles"] == ["E", "E"] for g in v["groups"])
    assert any(g["kind"] == "isolated" and g["tiles"] == ["9p"] for g in v["groups"])


def test_tenpai_has_total_ukeire_matching_efficiency():
    hand = ["1m", "2m", "3m", "1p", "2p", "3p", "1s", "2s", "3s", "E", "E", "E", "6m"]
    v = group_view(hand, 0, VIS0)
    assert v["shanten"] == 0 and v["total"] == 4 and v["ukeire"][0]["tile"] == "6m"
    c = [0] * 34
    for t in hand:
        c[idx(t)] += 1
    assert v["shanten"] == E.shanten(c)


def test_remaining_counts_use_visible_tiles():
    vis = [0] * 34
    vis[idx("6s")] = 3
    hand = ["1m", "2m", "3m", "4p", "5p", "6p", "7s", "8s", "E", "E", "5m", "7m", "9p"]
    ryan = next(g for g in group_view(hand, 0, vis)["groups"] if g["kind"] == "ryanmen")
    assert ryan["waits"][0] == {"tile": "6s", "left": 1}


def test_penchan_waits_one_tile_and_red_five_is_kept():
    hand = ["1p", "2p", "5m", "5mr", "6m", "7m", "2s", "3s", "4s", "N", "N", "9s", "9s"]
    v = group_view(hand, 0, VIS0)
    pen = next(g for g in v["groups"] if g["kind"] == "penchan")
    assert [w["tile"] for w in pen["waits"]] == ["3p"]
    shown = [t for g in v["groups"] for t in g["tiles"]]
    assert "5mr" in shown and shown.count("5m") == 1


def test_chiitoi_form_flagged_when_closer():
    hand = ["1m", "1m", "3p", "3p", "5s", "5s", "7s", "7s", "E", "E", "N", "N", "9m"]
    v = group_view(hand, 0, VIS0)
    assert v["shanten"] == 0 and v["form"] == "chiitoi"


def test_wrong_tile_count_returns_none():
    assert group_view(["1m"] * 14, 0, VIS0) is None
    assert group_view(["1m"] * 10, 1, VIS0) is not None


def test_fast_enough():
    import time
    hand = ["1m", "3m", "4m", "6m", "7p", "8p", "9p", "2s", "4s", "5s", "E", "S", "9m"]
    t0 = time.perf_counter(); group_view(hand, 0, VIS0); assert time.perf_counter() - t0 < 0.5
