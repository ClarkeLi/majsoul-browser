"""牌名转换与客户端手牌排序。

三套写法：服务端（赤五 0m，字牌 1z–7z）、MJAI（赤五 5mr，字牌 E S W N P F C）、
展示用中文。客户端手牌按 万→筒→索→字 排序，同数字时**赤五在普通五之前**
（与 MahjongCopilot 的 MJAI_TILES_SORTED 一致）；点击槽位依赖这个顺序。
"""

_HONOR_TO_MJAI = {"1z": "E", "2z": "S", "3z": "W", "4z": "N", "5z": "P", "6z": "F", "7z": "C"}
SORTED_TILES = [
    "1m", "2m", "3m", "4m", "5mr", "5m", "6m", "7m", "8m", "9m",
    "1p", "2p", "3p", "4p", "5pr", "5p", "6p", "7p", "8p", "9p",
    "1s", "2s", "3s", "4s", "5sr", "5s", "6s", "7s", "8s", "9s",
    "E", "S", "W", "N", "P", "F", "C", "?",
]
_ORDER = {t: i for i, t in enumerate(SORTED_TILES)}
_ZH_SUIT = {"m": "万", "p": "筒", "s": "索"}
_ZH_HONOR = {"E": "东", "S": "南", "W": "西", "N": "北", "P": "白", "F": "发", "C": "中"}
_ZH_NUM = "零一二三四五六七八九"


def to_mjai(tile: str) -> str:
    """服务端牌名 -> MJAI；空串给 '?'。已是 MJAI 写法的原样返回。"""
    if not tile:
        return "?"
    if tile in _HONOR_TO_MJAI:
        return _HONOR_TO_MJAI[tile]
    if len(tile) == 2 and tile[0] == "0" and tile[1] in "mps":
        return "5" + tile[1] + "r"
    return tile


def sort_tiles(tiles: list[str]) -> list[str]:
    return sorted(tiles, key=lambda t: _ORDER.get(t, 99))


def base_tile(tile: str) -> str:
    """去掉赤五标记：5mr -> 5m。"""
    return tile[:2] if len(tile) == 3 and tile.endswith("r") else tile


def tile_zh(tile: str) -> str:
    if tile in ("", "?"):
        return "?"
    if tile in _ZH_HONOR:
        return _ZH_HONOR[tile]
    if len(tile) == 3 and tile.endswith("r"):
        return "赤五" + _ZH_SUIT[tile[1]]
    if len(tile) == 2 and tile[1] in _ZH_SUIT:
        return _ZH_NUM[int(tile[0])] + _ZH_SUIT[tile[1]]
    return tile
