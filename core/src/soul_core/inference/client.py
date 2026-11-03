"""Mortal worker 子进程客户端：严格一问一答，带超时。"""
from __future__ import annotations

import json
import select
import subprocess
import sys
import time

from soul_core.selfcmd import self_command

TIMEOUT_S = 5.0


class WorkerError(Exception):
    pass


class WorkerClient:
    def __init__(self, model_path: str, device: str = "cpu", env: dict | None = None):
        self.model_path, self.device, self.env = model_path, device, env
        self.proc: subprocess.Popen | None = None
        self.seat: int | None = None

    def start(self, seat: int) -> None:
        self.stop()
        self.seat = seat
        self.proc = subprocess.Popen(
            [*self_command("soul_core.inference.runner", "runner"), "--model", self.model_path,
             "--device", self.device, "--player-id", str(seat)],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=sys.stderr, text=True, bufsize=1,
            env=self.env)

    def alive(self) -> bool:
        return self.proc is not None and self.proc.poll() is None

    def stop(self) -> None:
        p, self.proc = self.proc, None
        if p is None:
            return
        try:
            p.stdin.close()
            p.wait(timeout=2)
        except Exception:  # noqa: BLE001
            p.kill()

    def send(self, event: dict, timeout: float = TIMEOUT_S) -> tuple[dict | None, float]:
        """喂一个事件，返回 (reaction 或 None, 耗时 ms)。出错抛 WorkerError。"""
        if not self.alive():
            raise WorkerError("推理进程已退出")
        t0 = time.perf_counter()
        try:
            self.proc.stdin.write(json.dumps(event, ensure_ascii=False) + "\n")
            self.proc.stdin.flush()
        except Exception as e:  # noqa: BLE001
            raise WorkerError(f"写入失败：{e}") from e
        ready, _, _ = select.select([self.proc.stdout], [], [], timeout)
        if not ready:
            self.stop()
            raise WorkerError(f"推理超时（{timeout:g}s）")
        line = self.proc.stdout.readline()
        if not line:
            raise WorkerError("推理进程已退出")
        ms = (time.perf_counter() - t0) * 1000
        try:
            r = json.loads(line)
        except Exception as e:  # noqa: BLE001
            raise WorkerError(f"无法解析输出：{line[:80]}") from e
        return (None if r.get("type") == "__none__" else r), ms
