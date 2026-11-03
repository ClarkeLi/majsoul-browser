"""本地对局记录（可关闭）：MJAI 事件 + 推荐（含全部候选 q 值）+ 执行结果，一局一个 JSONL。

行格式：
  {"k":"start","uuid":..,"seat":..,"t":..}
  {"k":"event","rev":N,"ev":{mjai}}
  {"k":"rec","rev":N,"rec":{...},"alts_all":[...]}
  {"k":"exec","actionId":..,"status":..}
  {"k":"end","t":..}
"""
from __future__ import annotations

import json
import re
import time
from pathlib import Path


class GameRecorder:
    def __init__(self, directory: str | Path | None, enabled: bool = True):
        self.dir = Path(directory) if directory else None
        self.enabled = enabled and self.dir is not None
        self._f = None
        self.path: Path | None = None

    def configure(self, directory: str | Path | None, enabled: bool) -> None:
        self.close()
        self.dir = Path(directory) if directory else None
        self.enabled = enabled and self.dir is not None

    def start(self, uuid: str, seat: int | None) -> None:
        if not self.enabled:
            return
        self.close()
        self.dir.mkdir(parents=True, exist_ok=True)
        safe = re.sub(r"[^A-Za-z0-9_-]", "_", uuid or "unknown")[:48]
        self.path = self.dir / f"{time.strftime('%Y%m%d-%H%M%S')}-{safe}.jsonl"
        self._f = open(self.path, "a", encoding="utf-8")
        self._w({"k": "start", "uuid": uuid, "seat": seat, "t": time.time()})

    def _w(self, o: dict) -> None:
        if self._f:
            self._f.write(json.dumps(o, ensure_ascii=False, separators=(",", ":")) + "\n")
            self._f.flush()

    def event(self, rev: int, ev: dict) -> None:
        self._w({"k": "event", "rev": rev, "ev": ev})

    def rec(self, rev: int, rec: dict, alts_all: list[dict]) -> None:
        self._w({"k": "rec", "rev": rev, "rec": rec, "alts_all": alts_all})

    def result(self, rank: int | None) -> None:
        self._w({"k": "result", "rank": rank})

    def exec(self, action_id: str, status: str) -> None:
        self._w({"k": "exec", "actionId": action_id, "status": status})

    def close(self) -> None:
        if self._f:
            self._w({"k": "end", "t": time.time()})
            self._f.close()
            self._f = None
