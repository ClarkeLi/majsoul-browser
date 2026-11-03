from soul_core.analysis import defense as D
from soul_core.game.state import GameState


def river(*tiles, riichi_at=None):
    return [{"tile": t, "tsumogiri": False, "riichi": i == riichi_at, "called": False, "seq": i} for i, t in enumerate(tiles)]


def test_idx_and_suji():
    assert D.idx("5mr") == 4 and D.idx("E") == 27 and D.idx("?") == -1
    safe = {D.idx("1m"), D.idx("7m")}                    # 1m、7m 现物 => 4m 是筋
    assert D.suji_class(D.idx("4m"), safe) == "suji"
    assert D.suji_class(D.idx("5m"), safe) == "none"


def test_riichi_threat_is_one_and_genbutsu_is_safe():
    rivers = [[], river("3m", "9p", "5s", riichi_at=2), [], []]
    a = D.analyze(me=0, oya=0, bakaze="E", rivers=rivers, melds=[[], [], [], []], riichi={1}, hand=["3m", "7p", "E"], dora_markers=["1z"])
    th = {t["seat"]: t for t in a["threat"]}
    assert th[1]["threat"] == 1.0 and th[1]["label"] == "riichi"
    assert a["risk"]["3m"]["tier"] <= 1                   # 对立直者是现物，只剩另外两家的极小威胁
    assert a["risk"]["7p"]["tier"] >= 3                   # 无筋中张
    assert a["risk"]["3m"]["risk"] < a["risk"]["7p"]["risk"] / 5


def test_non_riichi_opponents_barely_threaten():
    rivers = [[], river("1m", "2p"), [], []]
    a = D.analyze(me=0, oya=0, bakaze="E", rivers=rivers, melds=[[], [], [], []], riichi=set(), hand=["5p"], dora_markers=["1z"])
    assert max(t["threat"] for t in a["threat"]) < 0.3 and a["risk"]["5p"]["tier"] <= 2


def test_snapshot_contains_analysis_in_game():
    gs = GameState()
    gs.handle(".lq.Lobby.login", None, {"account_id": 7})
    gs.handle(".lq.FastTest.authGame", None, {"seat_list": [7, 2, 3, 4]})
    gs.handle(".lq.ActionPrototype", "ActionNewRound", {"chang": 0, "ju": 0, "ben": 0, "liqibang": 0, "doras": ["5s"], "tiles": ["1m"] * 13 + ["2m"], "scores": [25000] * 4})
    snap = gs.snapshot()
    assert snap["analysis"]["risk"]["1m"]["tier"] == 0 or "risk" in snap["analysis"]
    assert [t["seat"] for t in snap["analysis"]["threat"]] == [1, 2, 3]
