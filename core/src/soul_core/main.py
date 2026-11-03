"""Core 入口：``python -m soul_core.main``。"""
import json
import sys

from . import __version__
from .ipc import PROTOCOL_VERSION, Emitter
from .session import Session


def main() -> int:
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    emit = Emitter()
    emit({"t": "ready", "protocolVersion": PROTOCOL_VERSION, "coreVersion": __version__})
    session = Session(emit)
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            emit({"t": "error", "code": "bad_json", "message": line[:80], "hint": ""})
            continue
        if msg.get("t") == "hello" and msg.get("protocolVersion") != PROTOCOL_VERSION:
            emit({"t": "error", "code": "protocol_mismatch",
                  "message": f"期望 {PROTOCOL_VERSION}，收到 {msg.get('protocolVersion')}", "hint": "请更新应用"})
            return 2
        try:
            if not session.handle_command(msg):
                break
        except Exception as e:  # noqa: BLE001
            emit({"t": "error", "code": "command_failed", "message": repr(e), "hint": ""})
    session.shutdown()
    return 0


def entry() -> int:
    """冻结后的统一入口：无参数 = Core；``runner`` / ``models`` 子命令供子进程使用。"""
    if len(sys.argv) > 1 and sys.argv[1] == "runner":
        from .inference.runner import main as runner_main
        return runner_main(sys.argv[2:])
    if len(sys.argv) > 1 and sys.argv[1] == "models":
        from .models import main as models_main
        return models_main(sys.argv[2:])
    return main()


if __name__ == "__main__":
    sys.exit(entry())
