"""打牌风格：掷骰 + 爱赌（移植旧原型 tests/test_style.py 的纯函数部分，加上接到决策后的行为）。"""
import json
import random
from collections import Counter

from soul_core import review
from soul_core.analysis.defense import idx
from soul_core.decision import style as S
from soul_core.game.state import GameState

_Z = "ESWNPFC"


def H(s: str) -> list[str]:
    """'19m19p12z' -> MJAI 牌名列表。"""
    out, nums = [], []
    for ch in s:
        if ch.isdigit():
            nums.append(ch)
        else:
            out += [_Z[int(n) - 1] if ch == "z" else f"{n}{ch}" for n in nums]
            nums = []
    return out


def C(s: str) -> list[int]:
    c = [0] * 34
    for t in H(s):
        c[idx(t)] += 1
    return c


class FixedRng:
    def __init__(self, x):
        self.x = x

    def random(self):
        return self.x


ON = {"dice": True, "gamble": True}


def gs(hand, drawn=None, turn=0):
    g = GameState()
    g.self_seat, g.phase, g.round_active = 0, "in_game", True
    g.my_hand = list(hand)
    g.drawn = drawn
    g.rivers[0] = [{"tile": "1m", "seq": i} for i in range(turn)]
    return g


def alt(aid, q, p=0.1):
    return {"id": aid, "kind": "x", "p": p, "q": q, **({"tile": aid} if aid in S.TILE_IDS else {})}


# ---------------------------------------------------------------- 纯函数

def test_sample_near():
    c = [("a", 2.0), ("b", 1.9), ("c", 1.5), ("d", 0.0)]
    rng = random.Random(3)
    got = Counter(S.sample_near(c, 0.61, 0.3, rng) for _ in range(3000))
    assert got["a"] + got["d"] == 0                 # 有接近备选时第一名不参与；d 太远
    assert got["b"] > got["c"]                      # 越接近越容易选中
    assert S.sample_near([("a", 2.0), ("b", 1.0)], 0.61, 0.3, rng) == "a"
    assert S.sample_near([], 0.61, 0.3, rng) is None


def test_need_kokushi_and_suuankou():
    assert S.kokushi_need(C("19m19p19s12345z58m"), []) == 3
    assert S.kokushi_need(C("19m19p19s1234567z"), []) == 1
    assert S.kokushi_need(C("19m19p19s12345z58m"), [{"type": "pon", "tiles": ["2m"] * 3}]) is None
    vis = C("19m19p19s12345z58m")
    vis[idx("C")] = 4                               # 中 绝张
    assert S.kokushi_need(C("19m19p19s12345z58m"), [], vis) is None
    assert S.suuankou_need(C("111m333p555s777s9s"), []) == 1
    assert S.suuankou_need(C("111m333p55s7s"), [{"type": "pon", "tiles": ["E"] * 3}]) is None
    assert S.suuankou_need(C("111m333p55s77s"), [{"type": "ankan", "tiles": ["E"] * 4}]) == 1


def test_need_honor_routes():
    assert S.daisangen_need(C("55z66z77z123m45p"), []) == 3
    assert S.daisangen_need(C("55z7z123m456p11s"), [{"type": "pon", "tiles": ["F"] * 3}]) == 3
    assert S.suushi_need(C("111z22z3z4z123m456p"), []) == 4


def test_threshold_tightens_with_turn():
    assert S.threshold("kokushi", 3) == 3 and S.threshold("kokushi", 9) == 2 and S.threshold("kokushi", 20) == 1


# ---------------------------------------------------------------- 接到决策

def test_off_keeps_model_choice():
    g = gs(H("123m456p789s1155z") + ["9m"], drawn="9m")
    r = {"type": "dahai", "actor": 0, "pai": "9m", "tsumogiri": True}
    alts = [alt("9m", 1.0, 0.5), alt("1m", 0.99, 0.4)]
    assert S.apply_style(g, r, {}, alts, None, random.Random(1)) == (r, None)
    assert S.apply_style(g, r, {}, alts, {"dice": False, "gamble": False}, random.Random(1)) == (r, None)


def test_dice_picks_near_alternative_and_builds_discard():
    g = gs(H("123m456p789s1155z") + ["9m"], drawn="9m")
    r = {"type": "dahai", "actor": 0, "pai": "9m", "tsumogiri": True, "meta": {"x": 1}}
    alts = [alt("9m", 1.0, 0.5), alt("1m", 0.9, 0.4), alt("P", -3.0, 0.1)]
    nr, info = S.apply_style(g, r, {"type": "tsumo"}, alts, {"dice": True}, FixedRng(0.0))
    assert nr["type"] == "dahai" and nr["pai"] == "1m" and nr["tsumogiri"] is False and nr["meta"] == {"x": 1}
    assert info == {"kind": "dice", "model": "9m", "pick": "1m", "rank": 2}


def test_dice_keeps_model_when_no_near_alternative_or_riichi_or_hora():
    g = gs(H("123m456p789s1155z") + ["9m"], drawn="9m")
    r = {"type": "dahai", "actor": 0, "pai": "9m", "tsumogiri": True}
    far = [alt("9m", 1.0, 0.9), alt("1m", 0.0, 0.1)]
    assert S.apply_style(g, r, {}, far, {"dice": True}, FixedRng(0.0))[1] is None
    near = [alt("9m", 1.0, 0.5), alt("1m", 0.9, 0.4)]
    g.riichi = {0}
    assert S.apply_style(g, r, {}, near, {"dice": True}, FixedRng(0.0))[1] is None
    g.riichi = set()
    assert S.apply_style(g, r, {}, near + [alt("hora", 0.5)], {"dice": True}, FixedRng(0.0))[1] is None


def test_dice_on_calls_builds_chi():
    g = gs(H("23m456p789s11z55z9p"))                # 13 张，别人打 1m
    ev = {"type": "dahai", "actor": 3, "pai": "1m"}
    alts = [alt("pass", 1.0, 0.5), alt("chi_low", 0.95, 0.45)]
    nr, info = S.apply_style(g, {"type": "none"}, ev, alts, {"dice": True}, FixedRng(0.0))
    assert nr["type"] == "chi" and sorted(nr["consumed"]) == ["2m", "3m"] and nr["target"] == 3
    assert info["model"] == "pass" and info["pick"] == "chi_low"


def test_gamble_keeps_kokushi_route():
    hand = H("19m19p19s12345z58m") + ["E"]          # 11 种幺九 + 58m + 东：该打 5m/8m
    g = gs(hand, drawn="E")
    r = {"type": "dahai", "actor": 0, "pai": "1m", "tsumogiri": False}
    alts = [alt("1m", 1.0, 0.5), alt("8m", 0.0, 0.2), alt("5m", -0.5, 0.1)]
    nr, info = S.apply_style(g, r, {"type": "tsumo"}, alts, {"gamble": True}, random.Random(0))
    assert nr["pai"] == "8m" and info["kind"] == "gamble" and info["route"] == "kokushi"
    assert info["model"] == "1m" and info["pick"] == "8m"


def test_gamble_skipped_in_all_last_when_leading():
    hand = H("19m19p19s12345z58m") + ["E"]
    g = gs(hand, drawn="E")
    g.bakaze, g.kyoku, g.scores = "S", 4, [40000, 20000, 20000, 20000]
    r = {"type": "dahai", "actor": 0, "pai": "1m", "tsumogiri": False}
    alts = [alt("1m", 1.0, 0.5), alt("8m", 0.0, 0.2)]
    assert S.apply_style(g, r, {}, alts, {"gamble": True}, random.Random(0))[1] is None


def test_gamble_refuses_call_on_closed_route():
    g = gs(H("19m19p19s12345z45m"))                 # 国士路线 13 张
    ev = {"type": "dahai", "actor": 3, "pai": "6m"}
    r = {"type": "chi", "actor": 0, "target": 3, "pai": "6m", "consumed": ["4m", "5m"]}
    alts = [alt("chi_high", 1.0, 0.6), alt("pass", 0.0, 0.4)]
    nr, info = S.apply_style(g, r, ev, alts, {"gamble": True}, random.Random(0))
    assert nr == {"type": "none"} and info["pick"] == "pass" and info["model"] == "chi_high"


def test_review_agreement_compares_against_model_choice(tmp_path):
    rows = [
        {"k": "start", "seat": 0, "uuid": "u", "t": 0},
        {"k": "rec", "rev": 1, "alts_all": [alt("9m", 1.0), alt("1m", 0.9)],
         "rec": {"kind": "discard", "tile": "1m",
                 "style": {"kind": "dice", "model": "9m", "pick": "1m", "model_kind": "discard", "model_tile": "9m"}}},
        {"k": "event", "ev": {"type": "dahai", "actor": 0, "pai": "1m"}},
        {"k": "rec", "rev": 2, "alts_all": [alt("2p", 1.0)], "rec": {"kind": "discard", "tile": "2p"}},
        {"k": "event", "ev": {"type": "dahai", "actor": 0, "pai": "2p"}},
    ]
    p = tmp_path / "g.jsonl"
    p.write_text("\n".join(json.dumps(r) for r in rows), encoding="utf-8")
    ds = review.decisions(review.load(p))
    assert [d["agree"] for d in ds] == [False, True]          # 风格改判的那一手不算与模型一致
    assert ds[0]["style"] == "dice" and ds[0]["q_loss"] == 0.1


def test_session_config_toggles_style():
    from soul_core.session import Session
    s = Session(emit=lambda m: None)
    try:
        assert s.style == {"dice": False, "gamble": False, "arb": False}   # Core 自己默认关闭；Desktop 启动时下发
        s.handle_command({"t": "config", "records_dir": None, "records_enabled": False, "style": True})
        assert s.style == {"dice": True, "gamble": True, "arb": True}
        s.handle_command({"t": "config", "records_dir": None, "records_enabled": False,
                          "style": {"dice": True, "gamble": False, "arb": True}})
        assert s.style == {"dice": True, "gamble": False, "arb": True}
        s.handle_command({"t": "config", "records_dir": None, "records_enabled": False, "style": False})
        assert s.style == {"dice": False, "gamble": False, "arb": False}
    finally:
        s.shutdown()
