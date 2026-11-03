"""Mortal worker 子进程客户端：严格一问一答，带超时。"""
from __future__ import annotations

import json
import queue
import subprocess
import sys
import threading
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
        self._lines: queue.Queue = queue.Queue()

    def start(self, seat: int) -> None:
        self.stop()
        self.seat = seat
        self.proc = subprocess.Popen(
            [*self_command("soul_core.inference.runner", "runner"), "--model", self.model_path,
             "--device", self.device, "--player-id", str(seat)],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=sys.stderr, text=True, bufsize=1,
            env=self.env)
        # 用读线程 + 队列等回答：select() 在 Windows 上只支持 socket，不能用来等管道
        self._lines = queue.Queue()
        threading.Thread(target=self._pump, args=(self.proc, self._lines), daemon=True).start()

    @staticmethod
    def _pump(proc: subprocess.Popen, q: queue.Queue) -> None:
        try:
            for line in proc.stdout:
                q.put(line)
        except Exception:  # noqa: BLE001
            pass
        finally:
            q.put(None)                      # 管道关闭 = 进程退出

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
        try:
            line = self._lines.get(timeout=timeout)
        except queue.Empty:
            self.stop()
            raise WorkerError(f"推理超时（{timeout:g}s）") from None
        if not line:
            raise WorkerError("推理进程已退出")
        ms = (time.perf_counter() - t0) * 1000
        try:
            r = json.loads(line)
        except Exception as e:  # noqa: BLE001
            raise WorkerError(f"无法解析输出：{line[:80]}") from e
        return (None if r.get("type") == "__none__" else r), ms
