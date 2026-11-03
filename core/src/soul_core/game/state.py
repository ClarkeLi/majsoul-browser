"""四麻牌局状态机（纯函数式：输入服务端消息，输出 MJAI 事件；不做任何 I/O）。

源自旧原型 bridge.py 的 Bridge，已去掉：HTTP、面板统计、三麻、仲裁/掷骰、复盘。
唯一事实来源是 WebSocket 帧；任何不一致都进入 ``desynced``：不再喂事件、不出推荐，
直到下一局 ``ActionNewRound``（或重新 authGame/syncGame）恢复。
"""
from __future__ import annotations

from dataclasses import dataclass, field

from .tiles import base_tile, sort_tiles, to_mjai

BAKAZE = "ESW"

# 已知无害、与牌局状态无关的通知：忽略即可（真实抓包里每局开头都会先来一个 ActionMJStart）
IGNORED_ACTIONS = frozenset({"ActionMJStart", "ActionLiqi"})

UNSUPPORTED_ACTIONS = {
    "ActionChangeTile": "换牌", "ActionSelectGap": "定缺", "ActionUnveilTile": "揭牌",
    "ActionRevealTile": "亮牌", "ActionLockTile": "锁牌", "ActionFillAwaitingTiles": "补牌",
    "ActionBaBei": "拔北（三麻）",
}


@dataclass
class Output:
    """一次 handle 的结果。

    events       要依次喂给 Mortal 的 MJAI 事件。
    decide_from  只有 events[decide_from:] 产生的 reaction 才是有效决策点
                 （syncGame 重放时前面的都不算）。
    restart_seat 非 None 表示 worker 必须先以该座位重建并发送 start_game。
    stop_worker  对局结束，释放 worker。
    """
    events: list[dict] = field(default_factory=list)
    decide_from: int = 0
    restart_seat: int | None = None
    stop_worker: bool = False
    fresh_round: bool = False   # 由 ActionNewRound 触发：新局第一打要多等一会儿


class GameState:
    def __init__(self) -> None:
        self.my_account_id: int | None = None
        self.self_seat: int | None = None
        self.phase = "lobby"          # lobby | in_game | unsupported_mode | desynced
        self.desync_reason = ""
        self.num_players = 4
        self.game_uuid = ""
        self.round_active = False
        self.messages = 0
        self.final_rank: int | None = None
        self.furiten = False
        self.revision = 0             # 每条消息 +1；intent 用它判断是否过期
        self._reset_round()
        self.scores: list[int] = [25000] * 4
        self.rounds = "半庄"          # 半庄 / 东风 / 一局（authGame 的 game_config.mode.mode）
        self.fandian = 30000          # 返点（终局判定用）
        self.errors: list[str] = []

    # ------------------------------------------------------------ 内部状态

    def _reset_round(self) -> None:
        self.my_hand: list[str] = []          # MJAI 写法，含刚摸的牌
        self.drawn: str | None = None         # 刚摸到、与手牌分开显示的那张
        self.rivers: list[list[dict]] = [[], [], [], []]
        self.melds: list[list[dict]] = [[], [], [], []]
        self.dora_markers: list[str] = []
        self.riichi: set[int] = set()
        self.ippatsu: set[int] = set()       # 立直后一巡内（自己下一次打牌前、且没人鸣牌）
        self.bakaze = "E"
        self.kyoku = 1
        self.honba = 0
        self.kyotaku = 0
        self.oya = 0
        self.left_tiles: int | None = None
        self.operation: dict | None = None    # 最近一条动作携带的 operation（服务端原样）
        self.last_discarder: int | None = None
        self.last_discard: str | None = None
        self.last_kan_seat: int | None = None
        self.pending_reach_acc: dict | None = None
        self.last_new_round: dict | None = None
        self.round_events: list[dict] = []
        self.recording = False
        self.dora_seen = 0
        self.seq = 0
        self.furiten = False

    def _err(self, msg: str) -> None:
        self.errors.append(msg)
        del self.errors[:-20]

    def mark_desynced(self, reason: str) -> None:
        self.phase = "desynced"
        self.desync_reason = reason
        self._err(reason)

    # ------------------------------------------------------------ 对外视图

    def hand_view(self) -> tuple[list[str], str | None]:
        """(客户端排序后的手牌（不含刚摸的牌）, 刚摸的牌)。"""
        tiles = list(self.my_hand)
        if self.drawn is not None:
            self._remove(tiles, self.drawn)
        return sort_tiles(tiles), self.drawn

    def _analysis(self) -> dict | None:
        if self.phase != "in_game" or self.self_seat is None or not self.round_active:
            return None
        from soul_core.analysis import board
        from soul_core.analysis.defense import analyze
        try:
            a = analyze(me=self.self_seat, oya=self.oya, bakaze=self.bakaze, rivers=self.rivers, melds=self.melds,
                        riichi=self.riichi, hand=self.my_hand, dora_markers=self.dora_markers)
            a["wait"] = board.wait_state(self)         # 没有摸牌时的向听与待牌；摸牌后为 None
            a["groups"] = board.group_view(self)       # 没有摸牌时的手牌分组；摸牌后看推荐里的“打后分组”
            a["furiten"] = self.furiten
            a["turn"] = len(self.rivers[self.self_seat]) + 1
            return a
        except Exception:  # noqa: BLE001 - 展示用分析出错不能影响牌局
            return None

    def snapshot(self) -> dict:
        hand, drawn = self.hand_view()
        return {
            "analysis": self._analysis(),
            "revision": self.revision,
            "phase": self.phase,
            "desync_reason": self.desync_reason,
            "self_seat": self.self_seat,
            "game_uuid": self.game_uuid,
            "round": {"bakaze": self.bakaze, "kyoku": self.kyoku, "honba": self.honba,
                      "kyotaku": self.kyotaku, "oya": self.oya, "left": self.left_tiles,
                      "dora_markers": list(self.dora_markers), "active": self.round_active},
            "scores": list(self.scores),
            "hand": hand,
            "drawn": drawn,
            "melds": [list(m) for m in self.melds],
            "rivers": [list(r) for r in self.rivers],
            "riichi": sorted(self.riichi),
        }

    # ------------------------------------------------------------ 入口

    def handle(self, method: str, name: str | None, data: dict) -> Output:
        self.messages += 1
        self.revision += 1
        out = Output()
        try:
            if method in (".lq.Lobby.login", ".lq.Lobby.oauth2Login"):
                self.my_account_id = data.get("account_id")
            elif method == ".lq.FastTest.authGame":
                self._on_auth_game(data, out)
            elif method == ".lq.ActionPrototype":
                self._on_action(name, data or {}, out)
            elif method == ".lq.FastTest.syncGame":
                self._on_sync_game(data.get("sync_game_actions") or [], out)
            elif method in (".lq.NotifyGameEndResult", ".lq.NotifyGameTerminate"):
                self._on_game_end(out, data if method.endswith("EndResult") else None)
        except Exception as e:  # noqa: BLE001 - 解析异常 = 失步，绝不崩溃
            self.mark_desynced(f"{method}/{name}: {e!r}")
        return out

    # ------------------------------------------------------------ 开局 / 结束

    def _on_auth_game(self, data: dict, out: Output) -> None:
        seat_list = data.get("seat_list") or []
        players = data.get("players") or []
        n = len(seat_list) if seat_list else (len(players) or 4)
        self.game_uuid = data.get("game_uuid", "")
        self.round_active = False
        self._reset_round()
        mode = (data.get("game_config") or {}).get("mode") or {}
        self.rounds = {1: "东风", 2: "半庄", 3: "一局", 4: "一局"}.get((mode.get("mode") or 0) % 10, "半庄")
        dr = mode.get("detail_rule") or {}
        self.fandian = int(dr.get("fandian") or 30000)
        if n != 4:
            self.num_players = n
            self.phase = "unsupported_mode"
            self.desync_reason = ""
            out.stop_worker = True
            return
        self.num_players = 4
        self.phase = "in_game"
        self.desync_reason = ""
        seat = None
        if self.my_account_id is not None and self.my_account_id in seat_list:
            seat = seat_list.index(self.my_account_id)
        if seat is None:
            for i, p in enumerate(players):
                if self.my_account_id is not None and p.get("account_id") == self.my_account_id:
                    seat = p.get("seat", i)
                    break
        self.self_seat = seat
        if seat is not None:
            out.restart_seat = seat       # 座位未知时先不建 worker，等带牌面的摸牌来纠正

    def _on_sync_game(self, actions: list, out: Output) -> None:
        """中途挂载/重连：重放本局全部动作，只有最后一个动作的决策点有意义。"""
        if not actions or self.self_seat is None or self.phase == "unsupported_mode":
            return
        self.phase = "in_game"
        self.desync_reason = ""
        self.round_active = False
        self._reset_round()
        out.restart_seat = self.self_seat
        last = len(actions) - 1
        for i, a in enumerate(actions):
            if i == last:
                out.decide_from = len(out.events)
            try:
                self._on_action(a.get("name"), a.get("data") or {}, out)
            except Exception as e:  # noqa: BLE001
                self.mark_desynced(f"syncGame 重放 {a.get('name')} 失败：{e!r}")
                break

    def _on_game_end(self, out: Output, data: dict | None = None) -> None:
        self.final_rank = None
        players = ((data or {}).get("result") or {}).get("players") or []
        mine = next((p for p in players if p.get("seat") == self.self_seat), None)
        if mine is not None:
            # 名次 = 1 + 总点数比自己高的人数（同点按座位顺序，客户端也是如此）
            self.final_rank = 1 + sum(1 for p in players if (p.get("total_point", 0), -p.get("seat", 0)) > (mine.get("total_point", 0), -mine.get("seat", 0)))
        self.pending_reach_acc = None
        if self.round_active:
            self._end_kyoku(out)
        if self.phase == "in_game":
            self._emit(out, {"type": "end_game"})
        out.stop_worker = True
        self.phase = "lobby"
        self.round_active = False
        self.game_uuid = ""

    # ------------------------------------------------------------ 事件输出

    def _emit(self, out: Output, event: dict) -> None:
        if self.recording:
            self.round_events.append(event)
        if self.phase != "in_game" or self.self_seat is None:
            return
        if not self.round_active and event.get("type") not in ("start_kyoku", "end_kyoku", "start_game", "end_game"):
            return                          # 中途挂载：没见过开局，喂了只会 "from void"
        out.events.append(event)

    def _emit_tsumo(self, out: Output, actor: int, pai: str) -> None:
        if actor == self.self_seat and pai == "?":
            self._err("自己的摸牌未知，跳过该巡 tsumo")
            return                           # libriichi 不允许自己的摸牌未知
        self._emit(out, {"type": "tsumo", "actor": actor, "pai": pai})

    def _emit_new_doras(self, out: Output, doras) -> None:
        doras = doras or []
        if len(doras) <= self.dora_seen:
            return
        for t in doras[self.dora_seen:]:
            self.dora_markers.append(to_mjai(t))
            self._emit(out, {"type": "dora", "dora_marker": to_mjai(t)})
        self.dora_seen = len(doras)

    # ------------------------------------------------------------ 动作分发

    def _on_action(self, name: str | None, d: dict, out: Output) -> None:
        if self.pending_reach_acc is not None:
            pending, self.pending_reach_acc = self.pending_reach_acc, None
            if name != "ActionHule":                 # 宣言牌被荣和则立直不成立
                self.riichi.add(pending["actor"])
                if name not in ("ActionChiPengGang", "ActionAnGangAddGang"):
                    self.ippatsu.add(pending["actor"])
                self._emit(out, pending)
        prev_kan = self.last_kan_seat
        if name != "ActionAnGangAddGang":
            self.last_kan_seat = None
        self.operation = d.get("operation") if isinstance(d.get("operation"), dict) else None
        if name == "ActionHule":
            self._hora(d, prev_kan, out)
        elif name == "ActionNewRound":
            self._new_round(d, out)
            out.fresh_round = True
        elif self.phase != "in_game":
            return
        elif name == "ActionDealTile":
            self._deal(d, out)
        elif name == "ActionDiscardTile":
            self._discard(d, out)
        elif name == "ActionChiPengGang":
            self._call(d, out)
        elif name == "ActionAnGangAddGang":
            self._kan(d, out)
        elif name in UNSUPPORTED_ACTIONS:
            self.mark_desynced(f"不支持的玩法动作 {name}（{UNSUPPORTED_ACTIONS[name]}）")
        elif name in ("ActionNoTile", "ActionLiuJu"):
            self._emit(out, {"type": "ryukyoku"})
            self._end_kyoku(out)
        elif name is not None and name not in IGNORED_ACTIONS:
            self.mark_desynced(f"未知动作 {name}")

    def _end_kyoku(self, out: Output) -> None:
        self._emit(out, {"type": "end_kyoku"})
        self.recording = False
        self.round_active = False
        self.operation = None

    # ------------------------------------------------------------ 各动作

    @staticmethod
    def _remove(tiles: list[str], pai: str) -> bool:
        """删一张；赤五与普通五互相兜底。"""
        cands = [pai]
        if len(pai) == 3 and pai.endswith("r"):
            cands.append(pai[:2])
        elif len(pai) == 2 and pai[0] == "5" and pai[1] in "mps":
            cands.append(pai + "r")
        for c in cands:
            if c in tiles:
                tiles.remove(c)
                return True
        return False

    def _build_start_kyoku(self, d: dict, seat: int | None) -> dict:
        tiles = [to_mjai(t) for t in d.get("tiles", [])][:13]
        tehais = [["?"] * 13 for _ in range(4)]
        if seat is not None:
            tehais[seat] = tiles + ["?"] * (13 - len(tiles))
        return {
            "type": "start_kyoku", "bakaze": BAKAZE[d["chang"]],
            "dora_marker": to_mjai((d.get("doras") or ["?"])[0]),
            "kyoku": d["ju"] + 1, "honba": d.get("ben", 0), "kyotaku": d.get("liqibang", 0),
            "oya": d["ju"], "scores": d.get("scores") or [25000] * 4, "tehais": tehais,
        }

    def _new_round(self, d: dict, out: Output) -> None:
        n = len(d.get("scores") or [])
        if n and n != 4:
            self.num_players = n
            self.phase = "unsupported_mode"
            out.stop_worker = True
            return
        if self.phase == "unsupported_mode":
            return
        if self.phase == "desynced" and self.self_seat is not None:
            out.restart_seat = self.self_seat        # 新的一局：重建 worker，恢复
            self.round_active = False
            self.phase = "in_game"
            self.desync_reason = ""
        if self.phase != "in_game":
            self.phase = "in_game"
        if self.round_active:
            self._emit(out, {"type": "end_kyoku"})
        self._reset_round()
        self.recording = True
        self.round_active = True
        self.last_new_round = d
        self.bakaze, self.kyoku = BAKAZE[d["chang"]], d["ju"] + 1
        self.honba, self.kyotaku, self.oya = d.get("ben", 0), d.get("liqibang", 0), d["ju"]
        self.left_tiles = d.get("left_tile_count")
        self.scores = list(d.get("scores") or [25000] * 4)
        self.dora_markers = [to_mjai(t) for t in (d.get("doras") or [])]
        self.dora_seen = len(d.get("doras") or [])
        self.operation = d.get("operation") if isinstance(d.get("operation"), dict) else None
        tiles = [to_mjai(t) for t in d.get("tiles", [])]
        self.my_hand = list(tiles[:13])
        self._emit(out, self._build_start_kyoku(d, self.self_seat))
        dealer_drawn = to_mjai(d["tiles"][13]) if len(d["tiles"]) >= 14 else "?"
        if len(d["tiles"]) >= 14 and self.self_seat == self.oya:
            self.my_hand.append(dealer_drawn)        # 庄家 14 张：全部排序显示，没有单独的摸牌
        self._emit_tsumo(out, self.oya, dealer_drawn)

    def _fix_seat(self, seat: int, out: Output) -> None:
        """只有自己那一格 ActionDealTile 带牌面：用它纠正座位，并按已记录的事件重放。"""
        self._err(f"座位修正：{self.self_seat} → {seat}")
        self.self_seat = seat
        out.restart_seat = seat
        out.events.clear()
        out.decide_from = 0
        if self.last_new_round is not None:
            start = self._build_start_kyoku(self.last_new_round, seat)
            self.my_hand = [t for t in start["tehais"][seat] if t != "?"]
            if len(self.last_new_round.get("tiles", [])) >= 14 and seat == start["oya"]:
                self.my_hand.append(to_mjai(self.last_new_round["tiles"][13]))
            out.events.append(start)
            for ev in self.round_events[1:]:
                if ev.get("type") == "tsumo" and ev.get("actor") == seat and ev.get("pai") == "?":
                    continue
                out.events.append(ev)

    def _deal(self, d: dict, out: Output) -> None:
        seat = d["seat"]
        pai = to_mjai(d.get("tile", ""))
        if pai != "?" and seat != self.self_seat:
            self._fix_seat(seat, out)
        if seat == self.self_seat and pai != "?":
            self.my_hand.append(pai)
            self.drawn = pai
            self.furiten = bool(d.get("zhenting"))
        if d.get("left_tile_count") is not None:
            self.left_tiles = d["left_tile_count"]
        self._emit_tsumo(out, seat, pai)
        self._emit_new_doras(out, d.get("doras"))

    def _discard(self, d: dict, out: Output) -> None:
        seat = d["seat"]
        pai = to_mjai(d.get("tile", ""))
        tsumogiri = bool(d.get("moqie"))
        riichi = bool(d.get("is_liqi"))
        if riichi:
            self._emit(out, {"type": "reach", "actor": seat})
        ok = True
        if not riichi:
            self.ippatsu.discard(seat)               # 立直后的下一次打牌：一发机会结束
        if seat == self.self_seat:
            ok = self._remove(self.my_hand, pai)
            self.drawn = None
            self.furiten = bool(d.get("zhenting"))
            if not ok:
                self.mark_desynced(f"手牌中找不到要打的牌 {pai}")
        self.rivers[seat].append({"tile": pai, "tsumogiri": tsumogiri, "riichi": riichi, "called": False, "seq": self.seq})
        self.seq += 1
        self.last_discarder, self.last_discard = seat, pai
        self._emit(out, {"type": "dahai", "actor": seat, "pai": pai, "tsumogiri": tsumogiri})
        self._emit_new_doras(out, d.get("doras"))
        if riichi:
            self.pending_reach_acc = {"type": "reach_accepted", "actor": seat}

    @staticmethod
    def _split_froms(seat: int, tiles: list[str], froms: list):
        if len(froms) != len(tiles):
            return None
        pai, target, consumed = None, None, []
        for t, fr in zip(tiles, froms):
            if fr != seat and pai is None:
                pai, target = t, fr
            else:
                consumed.append(t)
        return None if pai is None else (pai, target, consumed)

    def _record_call(self, seat: int, kind: str, pai: str, consumed: list[str], target) -> None:
        self.ippatsu.clear()                         # 任何人鸣牌：所有人的一发都没了
        self.melds[seat].append({"type": kind, "tiles": sorted(consumed) + [pai], "from": target})
        if isinstance(target, int) and 0 <= target < 4 and self.rivers[target]:
            self.rivers[target][-1]["called"] = True
        if seat == self.self_seat:
            for t in consumed:
                if not self._remove(self.my_hand, t):
                    self.mark_desynced(f"副露时手牌缺少 {t}")
            self.drawn = None

    def _call(self, d: dict, out: Output) -> None:
        seat, typ = d["seat"], d["type"]
        tiles = [to_mjai(t) for t in d.get("tiles", [])]
        froms = d.get("froms", [])
        split = self._split_froms(seat, tiles, froms)
        if typ == 2 and len(tiles) >= 4:           # 大明杠
            if split:
                pai, target, consumed = split
            else:
                target = froms[3] if len(froms) > 3 else froms[-1]
                pai, consumed = tiles[3], tiles[:3]
            kind = "daiminkan"
        elif len(tiles) >= 3:
            if split:
                pai, target, consumed = split
            else:
                target = froms[2] if len(froms) > 2 else froms[-1]
                pai, consumed = tiles[2], tiles[:2]
            kind = "chi" if typ == 0 else "pon"
        else:
            return
        self._record_call(seat, kind, pai, consumed, target)
        self._emit(out, {"type": kind, "actor": seat, "target": target, "pai": pai, "consumed": sorted(consumed)})

    def _kan(self, d: dict, out: Output) -> None:
        seat, typ = d["seat"], d["type"]
        self.last_kan_seat = seat
        self.ippatsu.clear()                         # 暗杠 / 加杠同样打断一发
        tiles = d.get("tiles", "")
        t = to_mjai(tiles[0]) if isinstance(tiles, list) and tiles else to_mjai(tiles if isinstance(tiles, str) else "")
        base = t[:2]
        is_five = base[0] == "5" and base[1] != "z"
        if typ == 3:                                # 暗杠
            consumed = [base] * 4
            if is_five:
                consumed[0] = base + "r"
            self.melds[seat].append({"type": "ankan", "tiles": list(consumed), "from": None})
            if seat == self.self_seat:
                for x in consumed:
                    self._remove(self.my_hand, x)
                self.drawn = None
            self._emit(out, {"type": "ankan", "actor": seat, "consumed": consumed})
        else:                                       # 加杠
            consumed = [base] * 3
            if is_five and not t.endswith("r"):
                consumed[0] = base + "r"
            for m in self.melds[seat]:
                if m["type"] == "pon" and base_tile(m["tiles"][0]) == base:
                    m["type"] = "kakan"
                    m["tiles"] = m["tiles"] + [t]
                    break
            if seat == self.self_seat:
                self._remove(self.my_hand, t)
                self.drawn = None
            self._emit(out, {"type": "kakan", "actor": seat, "pai": t, "consumed": consumed})
        self._emit_new_doras(out, d.get("doras"))

    def _hora(self, d: dict, kan_seat: int | None, out: Output) -> None:
        for h in d.get("hules") or []:
            actor = h.get("seat", 0)
            if h.get("zimo"):
                target = actor
            elif kan_seat is not None:
                target = kan_seat
            elif self.last_discarder is not None:
                target = self.last_discarder
            else:
                target = actor
            self._emit(out, {"type": "hora", "actor": actor, "target": target})
        self._end_kyoku(out)
