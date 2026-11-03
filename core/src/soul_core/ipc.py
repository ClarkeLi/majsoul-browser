"""NDJSON over stdio：stdin 命令，stdout 事件，stderr 日志。"""
import json
import sys
import threading

PROTOCOL_VERSION = 1


class Emitter:
    def __init__(self, out=None):
        self.out = out or sys.stdout
        self._lock = threading.Lock()

    def __call__(self, msg: dict) -> None:
        line = json.dumps(msg, ensure_ascii=False, separators=(",", ":"))
        with self._lock:
            self.out.write(line + "\n")
            self.out.flush()
