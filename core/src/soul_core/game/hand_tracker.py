"""维护与服务端一致的手牌数组。

ReqSelfOperation.index 是服务端手牌数组下标，所以这里不排序，
完全按服务端给出的顺序保存；牌名用服务端写法（赤五为 0m/0p/0s）。
"""

_RED_TO_SERVER = {'5mr': '0m', '5pr': '0p', '5sr': '0s'}
_SERVER_TO_RED = {v: k for k, v in _RED_TO_SERVER.items()}
_HONOR_TO_SERVER = {'E': '1z', 'S': '2z', 'W': '3z', 'N': '4z', 'P': '5z', 'F': '6z', 'C': '7z'}


def to_server_tile(tile: str) -> str:
    """mjai 牌名 -> 服务端牌名（5mr -> 0m，E -> 1z），其余原样。"""
    return _RED_TO_SERVER.get(tile) or _HONOR_TO_SERVER.get(tile, tile)


def to_mjai_tile(tile: str) -> str:
    """服务端牌名 -> mjai 牌名（0m -> 5mr），其余原样。"""
    return _SERVER_TO_RED.get(tile, tile)


class HandTracker:
    def __init__(self):
        self._tiles: list[str] = []
        self._last_drawn: str | None = None

    @property
    def tiles(self) -> tuple[str, ...]:
        return tuple(self._tiles)

    @property
    def last_drawn(self) -> str | None:
        return self._last_drawn

    def reset(self, tiles: list[str]):
        self._tiles = [to_server_tile(t) for t in tiles]
        self._last_drawn = None

    def draw(self, tile: str):
        tile = to_server_tile(tile)
        self._tiles.append(tile)
        self._last_drawn = tile

    def discard(self, tile: str) -> bool:
        try:
            self._tiles.remove(to_server_tile(tile))
        except ValueError:
            return False
        return True

    def call(self, consumed: list[str]) -> bool:
        ok = True
        for t in consumed:
            if not self.discard(t):
                ok = False
        return ok

    def kan(self, tiles: list[str]) -> bool:
        return self.call(tiles)

    def index_of(self, tile: str) -> int | None:
        try:
            return self._tiles.index(to_server_tile(tile))
        except ValueError:
            return None
