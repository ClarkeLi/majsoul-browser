"""服务端可选操作解析 + Mortal reaction -> ActionIntent 映射（仅四麻）。

源自旧原型 operation_map.py；已去掉三麻/北抜，且不再包含任何 RPC 编码字段。
"""
import re
from dataclasses import dataclass, field

from soul_core.game.hand_tracker import to_server_tile
from soul_core.protocol.optype import (
    DAPAI, CHI, PENG, AN_GANG, MING_GANG, ADD_GANG, LIQI, ZIMO, RONG,
    JIUZHONG,
)

_TILE_RE = re.compile(r'^[0-9][mpsz]$')
_PASS_TYPES = {CHI, PENG, MING_GANG, RONG}


@dataclass
class LegalActions:
    seat: int
    can_dapai: bool = False
    can_liqi: bool = False
    # (op_index, 牌名列表或下标数字串列表)；口径见 parse_operations 上方注释
    can_chi: list[tuple[int, list[str]]] = field(default_factory=list)
    can_peng: list[tuple[int, list[str]]] = field(default_factory=list)
    can_ming_gang: list[tuple[int, list[str]]] = field(default_factory=list)
    can_an_gang: list[tuple[int, list[str]]] = field(default_factory=list)
    can_add_gang: list[tuple[int, list[str]]] = field(default_factory=list)
    can_zimo: bool = False
    can_rong: bool = False
    can_jiuzhong: bool = False
    can_pass: bool = False
    # type=7（立直）combination 里列出的、立直时允许打出的牌（服务端写法，赤五 0m）
    liqi_tiles: list[str] = field(default_factory=list)
    received_at: float = 0.0
    raw: dict | None = None
    handled: bool = False  # 该决策点是否已产生过 intent（防重复）


_COMBO_FIELDS = {
    CHI: 'can_chi', PENG: 'can_peng', MING_GANG: 'can_ming_gang',
    AN_GANG: 'can_an_gang', ADD_GANG: 'can_add_gang',
}
_FLAG_FIELDS = {
    DAPAI: 'can_dapai', LIQI: 'can_liqi', ZIMO: 'can_zimo', RONG: 'can_rong',
    JIUZHONG: 'can_jiuzhong',
}


# combination 口径：repeated string，每个元素是一个选项，用 `|` 分隔（兼容 `,`）的
#   牌名（服务端写法，赤五为 0m），如吃 "4m|6m"、碰 "5p|5p"、加杠 "3m"；
#   这些是「要从手里拿出来的牌」（consumed），不含被叫的那张。
#   兼容旧假设：token 全为整数时视为手牌下标，原样以数字字符串保存，
#   在 map_reaction 里结合 hand 解析成牌名（见 _resolve）。
# LegalActions 里每项为 (op_index, tiles: list[str])：op_index 是该元素在
#   combination 数组里的序号（即该选项的服务端 index），解析失败的元素也占序号。
def parse_operations(action_data: dict, self_seat: int,
                     received_at: float) -> LegalActions | None:
    if not isinstance(action_data, dict):
        return None
    op = action_data.get('operation')
    if not isinstance(op, dict) or op.get('seat') != self_seat:
        return None
    legal = LegalActions(seat=self_seat, received_at=received_at, raw=action_data)
    types = set()
    for item in op.get('operation_list') or []:
        if not isinstance(item, dict):
            continue
        t = item.get('type')
        types.add(t)
        if t in _FLAG_FIELDS:
            setattr(legal, _FLAG_FIELDS[t], True)
        if t == LIQI:
            combos = item.get('combination') or []
            if isinstance(combos, str):
                combos = [combos]
            for c in combos:
                for x in str(c).replace(',', '|').split('|'):
                    x = x.strip()
                    if _TILE_RE.match(x) and to_server_tile(x) not in legal.liqi_tiles:
                        legal.liqi_tiles.append(to_server_tile(x))
        if t in _COMBO_FIELDS:
            combos = item.get('combination') or []
            if isinstance(combos, str):
                combos = [combos]
            target = getattr(legal, _COMBO_FIELDS[t])
            for i, c in enumerate(combos):
                toks = [x.strip() for x in str(c).replace(',', '|').split('|')]
                toks = [x for x in toks if x]
                if toks and all(_TILE_RE.match(x) or x.isdigit() for x in toks):
                    target.append((i, toks))
    legal.can_pass = bool(types & _PASS_TYPES)
    return legal


def _resolve(hand: list[str], toks: list[str]) -> list[str] | None:
    """tokens -> 服务端牌名；数字 token 当作手牌下标。"""
    out = []
    for x in toks:
        if x.isdigit():
            i = int(x)
            if i >= len(hand):
                return None
            out.append(to_server_tile(hand[i]))
        else:
            out.append(to_server_tile(x))
    return out


def _find_combo(combos, hand, consumed) -> int | None:
    want = sorted(to_server_tile(t) for t in consumed)
    for op_index, toks in combos:
        tiles = _resolve(hand, toks)
        if tiles is not None and sorted(tiles) == want:
            return op_index
    return None


def _discard(kind, typ, reaction, hand, tile_mjai):
    tile = to_server_tile(tile_mjai)
    server_hand = [to_server_tile(t) for t in hand]
    if tile not in server_hand:
        return None
    moqie = bool(reaction.get('tsumogiri'))
    # 摸切指向刚摸的牌（手牌末尾）；手里有同名牌时 index() 会取到第一张
    index = len(server_hand) - 1 if moqie and server_hand[-1] == tile else server_hand.index(tile)
    return {'kind': kind, 'type': typ,
            'index': index, 'tile': tile, 'moqie': moqie}


def reaction_to_intent(legal: LegalActions, reaction: dict, hand: list[str],
                       last_discard: str | None,
                       discard_tile: str | None = None) -> dict | None:
    """把 Mortal reaction 映射成 intent 参数；任何非法输入返回 None，不抛异常。"""
    try:
        return _map_reaction(legal, reaction, hand, last_discard, discard_tile)
    except Exception:
        return None


_CALLS = {
    'chi': ('chi', CHI, 'can_chi'),
    'pon': ('peng', PENG, 'can_peng'),
    'daiminkan': ('kan', MING_GANG, 'can_ming_gang'),
}


def _map_reaction(legal, reaction, hand, last_discard, discard_tile):
    if legal is None or not isinstance(reaction, dict):
        return None
    t = reaction.get('type')
    if t in (None, 'none'):
        if legal.can_pass:
            return {'kind': 'pass', 'type': 0, 'index': 0}
        return None
    if t == 'dahai':
        if not legal.can_dapai or not reaction.get('pai'):
            return None
        return _discard('dapai', DAPAI, reaction, hand, reaction['pai'])
    if t == 'reach':
        if not legal.can_liqi:
            return None
        if not discard_tile:
            return {'kind': 'liqi', 'type': LIQI,
                    'index': 0, 'tile': '', 'needs_discard': True}
        return _discard('liqi', LIQI, reaction, hand, discard_tile)
    if t in _CALLS:
        kind, typ, attr = _CALLS[t]
        consumed, pai = reaction.get('consumed'), reaction.get('pai')
        if not consumed or not pai or not last_discard:
            return None
        if to_server_tile(pai) != to_server_tile(last_discard):
            return None
        idx = _find_combo(getattr(legal, attr), hand, consumed)
        if idx is None:
            return None
        return {'kind': kind, 'type': typ, 'index': idx}
    if t == 'ankan':
        consumed = reaction.get('consumed')
        if not consumed:
            return None
        idx = _find_combo(legal.can_an_gang, hand, consumed)
        if idx is None:
            return None
        return {'kind': 'kan', 'type': AN_GANG, 'index': idx}
    if t == 'kakan':
        pai = reaction.get('pai')
        if not pai:
            return None
        want = to_server_tile(pai)
        for op_index, toks in legal.can_add_gang:
            tiles = _resolve(hand, toks[:1])
            if tiles and tiles[0] == want:
                return {'kind': 'kan',
                        'type': ADD_GANG, 'index': op_index}
        return None
    if t == 'hora':
        actor, target = reaction.get('actor'), reaction.get('target')
        if legal.can_zimo and actor is not None and actor == target:
            return {'kind': 'hora', 'type': ZIMO, 'index': 0}
        if legal.can_rong:
            return {'kind': 'hora', 'type': RONG, 'index': 0}
        return None
    if t == 'ryukyoku':
        if legal.can_jiuzhong:
            return {'kind': 'jiuzhong',
                    'type': JIUZHONG, 'index': 0}
        return None
    return None
