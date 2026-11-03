"""syncGame 展开（迁移自旧 test_sync_game 中与 Bridge 无关的部分）。"""
from soul_core.protocol import expand_sync_game, pb
from soul_core.protocol.jsonfmt import to_dict

HAND = ["1m", "2m", "3m", "4m", "5m", "6m", "7p", "8p", "9p", "1s", "2s", "3s", "4z"]
ROUND14 = dict(tiles=HAND + ["5p"], ju=0, ben=0, liqibang=0, dora="3p", scores=[25000] * 4)

ACTIONS = [
    ("ActionNewRound", ROUND14),
    ("ActionDiscardTile", {"seat": 0, "tile": "5p", "moqie": True}),
    ("ActionDealTile", {"seat": 1, "tile": ""}),
    ("ActionDiscardTile", {"seat": 1, "tile": "3m"}),
    ("ActionChiPengGang", {"seat": 0, "type": 0, "tiles": ["2m", "4m", "3m"], "froms": [0, 0, 1]}),
    ("ActionDiscardTile", {"seat": 0, "tile": "9m"}),
]


def build_resp(actions, extra_items=()):
    items = []
    for step, (name, d) in enumerate(actions):
        raw = getattr(pb, name)(**d).SerializeToString() if d is not None else b""
        items.append(pb.ActionPrototype(step=step, name=name, data=raw))
    for name, raw in extra_items:
        items.append(pb.ActionPrototype(step=len(items), name=name, data=raw))
    resp = pb.ResSyncGame(is_end=False, step=len(items),
                          game_restore=pb.GameRestore(actions=items))
    return to_dict(resp)


def test_expand():
    out = expand_sync_game(build_resp(ACTIONS))
    assert [a["name"] for a in out] == [n for n, _ in ACTIONS]
    assert out[0]["data"]["tiles"] == ROUND14["tiles"]
    assert out[4]["data"]["froms"] == [0, 0, 1]


def test_empty_and_unknown():
    resp = build_resp([("ActionNoTile", None)],
                     extra_items=[("ActionDoesNotExist", b"\x01\x02")])
    assert expand_sync_game(resp) == [{"name": "ActionNoTile", "data": {}}]
    assert expand_sync_game({}) == []
    assert expand_sync_game(None) == []
