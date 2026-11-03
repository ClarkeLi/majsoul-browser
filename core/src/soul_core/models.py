"""模型导入与清单（PLAN §6.4）。

流程：复制到 tmp → 计算 SHA-256 → **子进程**里以 weights_only=True 校验并做加载测试
→ 原子移动到 models/<sha>.pth → 写入 manifest.json。任何一步失败都不会留下半成品。
CLI：python -m soul_core.models import PATH --root DATA_DIR | list --root DATA_DIR
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

from .selfcmd import self_command

MAX_MODEL_BYTES = 2 * 1024**3


class ModelError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code, self.message = code, message


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def verify_checkpoint(path: str) -> dict:
    """在当前进程里校验（只应在子进程中调用）。返回模型信息；不合法抛 ModelError。"""
    import torch

    try:
        state = torch.load(path, weights_only=True, map_location="cpu")
    except Exception as e:  # noqa: BLE001
        raise ModelError("unsafe_or_corrupt", f"无法以 weights_only 安全加载：{e}") from e
    for k in ("mortal", "current_dqn", "config"):
        if k not in state:
            raise ModelError("bad_structure", f"缺少字段 {k}")
    cfg = state["config"]
    version = cfg.get("control", {}).get("version", 1)
    res = cfg.get("resnet", {})
    if "num_blocks" not in res or "conv_channels" not in res:
        raise ModelError("bad_structure", "缺少 resnet 配置")
    from libriichi.consts import ACTION_SPACE, obs_shape

    from .inference.model import DQN, Brain

    try:
        brain = Brain(version=version, num_blocks=res["num_blocks"], conv_channels=res["conv_channels"]).eval()
        dqn = DQN(version=version).eval()
        brain.load_state_dict(state["mortal"])
        dqn.load_state_dict(state["current_dqn"])
        import torch as _t

        with _t.no_grad():
            obs = _t.zeros((1, *obs_shape(version)))
            mask = _t.ones((1, ACTION_SPACE), dtype=_t.bool)
            out = dqn(brain(obs), mask)
    except Exception as e:  # noqa: BLE001
        raise ModelError("load_failed", f"加载测试失败：{e}") from e
    n = out.shape[-1] if hasattr(out, "shape") else None
    if n not in (ACTION_SPACE, ACTION_SPACE + 1):
        raise ModelError("not_4p", f"动作空间 {n} 与四麻 {ACTION_SPACE} 不符")
    return {"version": version, "num_blocks": res["num_blocks"], "conv_channels": res["conv_channels"],
            "tag": state.get("tag") or "", "action_space": int(n)}


def _verify_subprocess(path: Path) -> dict:
    p = subprocess.run([*self_command("soul_core.models", "models"), "_verify", str(path)],
                       capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
    last = (p.stdout.strip().splitlines() or ["{}"])[-1]
    try:
        r = json.loads(last)
    except json.JSONDecodeError:
        raise ModelError("verify_crashed", (p.stderr or "校验进程异常退出")[-300:]) from None
    if p.returncode != 0 or "error" in r:
        raise ModelError(r.get("code", "verify_failed"), r.get("error", "校验失败"))
    return r


def manifest_path(root: Path) -> Path:
    return root / "models" / "manifest.json"


def read_manifest(root: Path) -> list[dict]:
    try:
        return json.loads(manifest_path(root).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []


def import_model(src: str | Path, root: str | Path, progress=lambda step, ok=True, **kw: None) -> dict:
    src, root = Path(src), Path(root)
    models, tmp = root / "models", root / "tmp"
    models.mkdir(parents=True, exist_ok=True)
    tmp.mkdir(parents=True, exist_ok=True)
    if not src.is_file():
        raise ModelError("missing", f"文件不存在：{src}")
    if src.stat().st_size > MAX_MODEL_BYTES:
        raise ModelError("too_large", "文件超过 2 GB")
    staged = tmp / f"import-{os.getpid()}-{int(time.time())}.pth"
    try:
        shutil.copyfile(src, staged)
        progress("copy")
        sha = sha256_of(staged)
        dest = models / f"{sha}.pth"
        info = _verify_subprocess(staged)
        progress("verify")
        progress("load")
        entry_exists = any(e["sha256"] == sha for e in read_manifest(root))
        if not dest.exists():
            os.replace(staged, dest)                 # 原子移动
        entry = {"sha256": sha, "name": src.stem, "size": dest.stat().st_size, "tag": info["tag"],
                 "version": info["version"], "imported_at": int(time.time())}
        if not entry_exists:
            items = read_manifest(root) + [entry]
            tmpm = manifest_path(root).with_suffix(".tmp")
            tmpm.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
            os.replace(tmpm, manifest_path(root))
        return entry
    finally:
        staged.unlink(missing_ok=True)


def main(argv=None) -> int:
    # Windows 控制台默认 cp1252/gbk，输出中文错误信息会 UnicodeEncodeError；统一 UTF-8
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("import"); a.add_argument("path"); a.add_argument("--root", required=True)
    l = sub.add_parser("list"); l.add_argument("--root", required=True)
    v = sub.add_parser("_verify"); v.add_argument("path")
    ns = ap.parse_args(argv)
    if ns.cmd == "_verify":
        try:
            print(json.dumps(verify_checkpoint(ns.path)))
            return 0
        except ModelError as e:
            print(json.dumps({"error": e.message, "code": e.code}))
            return 1
    if ns.cmd == "list":
        print(json.dumps(read_manifest(Path(ns.root)), ensure_ascii=False))
        return 0
    try:
        entry = import_model(ns.path, ns.root, lambda step, ok=True, **kw: print(json.dumps({"step": step, "ok": ok}), flush=True))
        print(json.dumps({"done": entry}, ensure_ascii=False))
        return 0
    except ModelError as e:
        print(json.dumps({"error": e.message, "code": e.code}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    sys.exit(main())
