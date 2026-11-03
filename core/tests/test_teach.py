from soul_core.analysis import defense as D
from soul_core.analysis.teach import MAX_TIPS, build_tips


def opt(sh, total, uk=()):
    return {"shanten": sh, "total": total, "ukeire": [{"tile": t, "left": l} for t, l in uk]}


def test_why_closer_when_shanten_is_better_even_with_fewer_tiles():
    rec = {"kind": "discard", "tile": "9s", "insight": {"verdict": None}}
    alts = [{"tile": "9s"}, {"tile": "2s"}]
    tips = build_tips(rec, {}, {"9s": opt(0, 8, [("5m", 3)]), "2s": opt(1, 34)}, alts)
    t0 = tips[0]
    assert t0["code"] == "why_closer" and t0["a"] == {"shanten": 0, "total": 8} and t0["b"] == {"shanten": 1, "total": 34}
    assert any(t["code"] == "tenpai" and t["waits"] == ["5m"] for t in tips)


def test_why_more_when_same_shanten_and_more_tiles():
    rec = {"kind": "discard", "tile": "2m", "insight": {"verdict": None}}
    tips = build_tips(rec, {}, {"2m": opt(1, 40), "9s": opt(1, 30)}, [{"tile": "2m"}, {"tile": "9s"}])
    assert tips[0]["code"] == "why_more"


def test_close_call_when_candidate_is_not_better():
    rec = {"kind": "discard", "tile": "2s", "insight": {"verdict": None}}
    tips = build_tips(rec, {}, {"2s": opt(1, 30), "9s": opt(1, 34)}, [{"tile": "2s"}, {"tile": "9s"}])
    assert tips[0]["code"] == "close_call"


def test_defense_tips_name_safest_tiles_with_reason():
    a = {"threat": [{"seat": 3, "threat": 1.0, "label": "riichi"}],
         "risk": {"3m": {"risk": 0.8, "tier": 1, "why": "genbutsu", "vs": 3}, "7p": {"risk": 9.0, "tier": 4, "why": "none", "vs": 3},
                  "4m": {"risk": 1.5, "tier": 1, "why": "suji", "vs": 3}}}
    tips = build_tips({"kind": "discard", "tile": "7p", "insight": {"verdict": {"advice": "balance"}}}, a, {}, [])
    safe = next(t for t in tips if t["code"] == "safe_tiles")
    assert [x["tile"] for x in safe["safe"]] == ["3m", "4m"] and safe["safe"][0]["why"] == "genbutsu" and safe["seat"] == 3
    fold = build_tips({"kind": "discard", "tile": "7p", "insight": {"verdict": {"advice": "fold"}}}, a, {}, [])
    assert any(t["code"] == "fold" for t in fold)


def test_rule_tips_for_actions_and_cap():
    assert build_tips({"kind": "riichi", "riichi_tile": "9s", "insight": {}}, {}, {}, [])[0]["code"] == "riichi_rule"
    assert build_tips({"kind": "pon", "tile": "E", "insight": {}}, {}, {}, [])[0] == {"code": "call_rule", "kind": "pon"}
    assert build_tips({"kind": "pass", "insight": {}}, {}, {}, [])[0]["code"] == "pass_rule"
    many = build_tips({"kind": "riichi", "riichi_tile": "9s", "insight": {"verdict": {"advice": "push"}}},
                      {"furiten": True, "wait": {"shanten": 0, "waits": [{"tile": "1m", "left": 2}]}}, {"9s": opt(0, 4, [("1m", 2)])}, [])
    assert len(many) <= MAX_TIPS


def test_explain_reasons():
    vis = [0] * 34
    safe = {D.idx("3m"), D.idx("1m"), D.idx("7m")}
    assert D.explain(D.idx("3m"), safe, vis) == "genbutsu"
    assert D.explain(D.idx("4m"), safe, vis) == "suji"
    assert D.explain(D.idx("E"), set(), vis) == "honor"
    vis[D.idx("E")] = 2
    assert D.explain(D.idx("E"), set(), vis) == "honor_seen"
    assert D.explain(D.idx("5p"), set(), vis) == "none"
