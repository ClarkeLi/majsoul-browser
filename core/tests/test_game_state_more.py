from soul_core.game.state import GameState


def new_round(tiles, ju=0):
    return {"chang": 0, "ju": ju, "ben": 0, "liqibang": 0, "doras": ["5s"], "tiles": tiles,
            "scores": [25000] * 4, "left_tile_count": 70}


def start(gs, seat=1):
    gs.handle(".lq.Lobby.login", None, {"account_id": 7})
    return gs.handle(".lq.FastTest.authGame", None, {"seat_list": [1, 2, 7, 3][:4] if seat == 2 else [7, 2, 3, 4]})


def test_auth_sets_seat_and_restart():
    gs = GameState()
    out = start(gs, 0)
    assert gs.self_seat == 0 and out.restart_seat == 0 and gs.phase == "in_game"


def test_three_player_unsupported():
    gs = GameState()
    out = gs.handle(".lq.FastTest.authGame", None, {"seat_list": [1, 2, 3]})
    assert gs.phase == "unsupported_mode" and out.stop_worker


def test_hand_view_sorted_with_drawn_separate():
    gs = GameState()
    start(gs, 0)
    tiles = ["9s", "0m", "5m", "1m", "3p", "2p", "1p", "7z", "6z", "4z", "3z", "2z", "1z"]
    gs.handle(".lq.ActionPrototype", "ActionNewRound", new_round(tiles + ["4m"]))
    # 庄家 14 张：全部排序显示，没有单独的摸牌
    hand, drawn = gs.hand_view()
    assert drawn is None and len(hand) == 14 and hand[:3] == ["1m", "4m", "5mr"]
    gs.handle(".lq.ActionPrototype", "ActionDiscardTile", {"seat": 0, "tile": "4m", "moqie": False})
    gs.handle(".lq.ActionPrototype", "ActionDealTile", {"seat": 1, "tile": ""})
    gs.handle(".lq.ActionPrototype", "ActionDealTile", {"seat": 0, "tile": "0p"})
    hand, drawn = gs.hand_view()
    assert drawn == "5pr" and len(hand) == 13 and "5pr" not in hand


def test_unknown_action_desyncs_and_recovers_next_round():
    gs = GameState()
    start(gs, 0)
    tiles = ["1m"] * 13
    gs.handle(".lq.ActionPrototype", "ActionNewRound", new_round(tiles))
    gs.handle(".lq.ActionPrototype", "ActionChangeTile", {})
    assert gs.phase == "desynced"
    out = gs.handle(".lq.ActionPrototype", "ActionDealTile", {"seat": 1, "tile": ""})
    assert out.events == []
    out = gs.handle(".lq.ActionPrototype", "ActionNewRound", new_round(tiles, 1))
    assert gs.phase == "in_game" and out.restart_seat == 0 and out.events[0]["type"] == "start_kyoku"


def test_discarding_missing_tile_desyncs():
    gs = GameState()
    start(gs, 0)
    gs.handle(".lq.ActionPrototype", "ActionNewRound", new_round(["1m"] * 13))
    gs.handle(".lq.ActionPrototype", "ActionDiscardTile", {"seat": 0, "tile": "9p"})
    assert gs.phase == "desynced"


def test_sync_game_decides_only_on_last_action():
    gs = GameState()
    start(gs, 0)
    acts = [{"name": "ActionNewRound", "data": new_round(["1m"] * 13 + ["2m"])},
            {"name": "ActionDiscardTile", "data": {"seat": 0, "tile": "2m", "moqie": True}},
            {"name": "ActionDealTile", "data": {"seat": 1, "tile": ""}}]
    out = gs.handle(".lq.FastTest.syncGame", None, {"sync_game_actions": acts})
    assert out.restart_seat == 0 and out.decide_from > 0 and out.events[out.decide_from]["type"] == "tsumo"


def test_mj_start_is_ignored_not_desync():
    """回归：真实对局每局开头先来一个 ActionMJStart，不能触发“牌局状态不同步”。"""
    gs = GameState()
    start(gs, 0)
    gs.handle(".lq.ActionPrototype", "ActionMJStart", {})
    assert gs.phase == "in_game"
    out = gs.handle(".lq.ActionPrototype", "ActionNewRound", new_round(["1m"] * 13))
    assert gs.phase == "in_game" and out.events[0]["type"] == "start_kyoku"


def test_unknown_action_still_fails_closed():
    gs = GameState()
    start(gs, 0)
    gs.handle(".lq.ActionPrototype", "ActionSomethingNew", {})
    assert gs.phase == "desynced"
