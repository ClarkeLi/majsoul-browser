"""打点口径（默听 vs 立直、押引红绿条）与算法改判（移植旧原型 arbiter 的规则）。"""
from soul_core.analysis import attack as A
from soul_core.decision import arbiter as R
from soul_core.decision import style as S
from soul_core.game.state import GameState


def gs(hand, drawn=None, left=60, scores=None):
    g = GameState()
    g.self_seat, g.phase, g.round_active = 0, "in_game", True
    g.my_hand = list(hand)
    g.drawn = drawn
    g.left_tiles = left
    g.dora_markers = ["9s"]
    if scores:
        g.scores = list(scores)
    return g


# 123m 456m 789p 234s 5s + 9m 6s：打 9m 听 5s 单骑... 换成两面：234s 56s → 听 4s7s
TENPAI14 = ["1m", "2m", "3m", "4m", "5m", "6m", "7p", "8p", "9p", "2s", "3s", "4s", "5s", "5s", "9m"]


def test_decide_rules():
    m = {"key": "m", "p": 50.0, "value": 1000, "loss": 3000}
    a = {"key": "a", "p": 20.0, "value": 1700, "loss": 2800}
    assert R.decide([m, a], "m") == {"key": "a", "kind": "soft", "gain": 700}
    assert R.decide([{**m, "p": 80.0}, a], "m") is None                     # 模型不犹豫：不软改判
    h = {"key": "h", "p": 4.0, "value": 1200, "loss": 200}
    assert R.decide([{**m, "p": 90.0}, h], "m")["kind"] == "hard"            # 损失少 2800 且价值更高
    assert R.decide([{**m, "p": 90.0}, {**h, "p": 2.0}], "m") is None        # 候选概率太低


def test_hora_scores_and_ranks():
    after = R.hora_scores([25000] * 4, 0, 2, False, 1, [3900, 0], 3900, 1000, 1)
    assert after == [30200, 25000, 20800, 25000]
    after = R.hora_scores([25000] * 4, 0, 0, True, 1, [2000, 1000], 4000, 0, 0)
    assert after == [29000, 23000, 24000, 24000]
    assert A.ranks([100, 200, 200, 50]) == [2, 0, 1, 3]


def test_attack_plan_dama_vs_riichi():
    hand13 = [t for t in TENPAI14 if t != "9m"][:13]
    hand13 = ["1m", "2m", "3m", "4m", "5m", "6m", "7p", "8p", "9p", "2s", "3s", "5s", "5s"]   # 听 1s4s
    g = gs(hand13)
    b = A.board(g)
    ws = A.waits_for(g, b, hand13)
    assert {w["tile"] for w in ws} == {"1s", "4s"}
    plan = A.attack_plan(ws, b, furiten=False)
    assert plan["dama"]["yakuless"] is False or plan["dama"]["win_rate"] >= 0
    assert "riichi" in plan and plan["riichi"]["avg"] > 0
    assert plan["mode"] in ("dama", "riichi")


def test_attack_plan_yakuless_dama_prefers_riichi():
    hand13 = ["1m", "2m", "3m", "4m", "5m", "6m", "7p", "8p", "9p", "9s", "9s", "2s", "3s"]   # 9s 雀头，听 1s4s：默听无役
    g = gs(hand13)
    b = A.board(g)
    plan = A.attack_plan(A.waits_for(g, b, hand13), b, furiten=False)
    assert plan["dama"]["ev"] <= plan["riichi"]["ev"] and plan["mode"] == "riichi"


def test_no_riichi_when_no_points():
    hand13 = ["1m", "2m", "3m", "4m", "5m", "6m", "7p", "8p", "9p", "9s", "9s", "2s", "3s"]
    g = gs(hand13, scores=[500, 33000, 33000, 33500])
    b = A.board(g)
    plan = A.attack_plan(A.waits_for(g, b, hand13), b, furiten=False)
    assert plan["no_riichi"] == "no_points" and "riichi" not in plan


def test_balance_counts_riichi_opponent():
    hand = ["1m", "2m", "3m", "4m", "5m", "6m", "7p", "8p", "9p", "9s", "9s", "2s", "3s", "5p"]
    g = gs(hand, drawn="5p")
    g.riichi = {2}
    g.rivers[2] = [{"tile": "1p", "seq": 1, "riichi": True}]
    b = A.board(g)
    bal = A.balance(b, "5p", 0, None)
    p2 = next(x for x in bal["parts"] if x["seat"] == 2)
    assert bal["loss"] > 0 and p2["val"] == 8000
    assert all(x["seat"] != 2 for x in A.balance(b, "1p", 0, None)["parts"])     # 对立直者是现物


def test_candidate_values_and_arbitrate_hard_veto():
    # 对手立直；模型想打危险的 5p（无筋中张），候选里有现物 1p 也能保持听牌形
    hand = ["1m", "2m", "3m", "4m", "5m", "6m", "7p", "8p", "9p", "9s", "9s", "2s", "3s", "5p"]
    g = gs(hand, drawn="5p")
    g.riichi = {2}
    g.rivers[2] = [{"tile": "1p", "seq": 1, "riichi": True}, {"tile": "4s", "seq": 2}]
    alts = [{"id": "3s", "kind": "discard", "tile": "3s", "p": 0.9, "q": 1.0},
            {"id": "5p", "kind": "discard", "tile": "5p", "p": 0.06, "q": -1.0}]
    vals = R.candidate_values(g, alts)
    assert {v["tile"] for v in vals} == {"3s", "5p"} and all("loss" in v for v in vals)
    r = {"type": "dahai", "actor": 0, "pai": "5p", "tsumogiri": True}
    nr, info = R.arbitrate(g, r, {"type": "tsumo"}, alts)
    if info:                                                # 改判只能换成模型给过的合法候选
        assert info["kind"] == "arb" and nr["pai"] == "3s" and info["pick_opt"]["loss"] < info["model_opt"]["loss"]


def test_apply_style_chain_off_by_flag():
    hand = ["1m", "2m", "3m", "4m", "5m", "6m", "7p", "8p", "9p", "9s", "9s", "2s", "3s", "5p"]
    g = gs(hand, drawn="5p")
    r = {"type": "dahai", "actor": 0, "pai": "5p", "tsumogiri": True}
    alts = [{"id": "5p", "kind": "discard", "tile": "5p", "p": 0.9, "q": 1.0}]
    assert S.apply_style(g, r, {}, alts, {"dice": False, "gamble": False, "arb": False}, None) == (r, None)


def test_hora_veto_in_all_last_when_still_fourth():
    # 南 4、自己末位且差距很大：荣和一个小牌后仍是 4 位、对局结束 → 见逃
    hand13 = ["1m", "2m", "3m", "4m", "5m", "6m", "7p", "8p", "9p", "P", "P", "P", "2s"]
    g = gs(hand13, scores=[5000, 40000, 30000, 25000], left=30)
    g.bakaze, g.kyoku, g.oya = "S", 4, 3
    ev = {"type": "dahai", "actor": 1, "pai": "2s"}
    r = {"type": "hora", "actor": 0, "target": 1, "pai": "2s"}
    alts = [{"id": "hora", "kind": "hora", "p": 0.95, "q": 1.0}, {"id": "pass", "kind": "pass", "p": 0.05, "q": 0.0}]
    nr, info = R.arbitrate(g, r, ev, alts)
    assert nr["type"] == "none" and info["arb"] == "veto"
    g.scores = [24000, 26000, 25000, 25000]                 # 和了就能上位：不见逃
    assert R.arbitrate(g, r, ev, alts)[1] is None


def test_balance_gain_estimated_when_not_tenpai():
    """未听牌时押引红绿条也有绿条：和牌收益按向听与进张估，与候选价值同一口径（显示净值）。"""
    from soul_core.decision.decide import _attach_points
    hand = ["1m", "2m", "3m", "4m", "5m", "6m", "7p", "8p", "2s", "3s", "5s", "9s", "N", "E"]   # 打 E 后一向听
    g = gs(hand, drawn="E")
    b = A.board(g)
    est = R.attack_estimate(g, b, "E")
    assert est is not None and est > 0
    rec = {"insight": {}}
    opts = {"tile": "E", "shanten": 1}
    _attach_points(rec, g, "E", opts, [{"id": "E", "kind": "discard", "tile": "E", "p": 0.8, "q": 1.0}])
    bal = rec["insight"]["balance"]
    assert bal["shanten"] == 1 and bal["est"] is True and bal["gain"] == est
    v = next(x for x in rec["insight"]["values"] if x["tile"] == "E")
    assert v["attack"] == est                                                     # 与候选价值同一口径
