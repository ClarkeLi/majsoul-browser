import json
import subprocess
import sys
from pathlib import Path

import pytest

from soul_core import models

ROOT = Path(__file__).resolve().parents[2]
DEV = ROOT / "AI/models/mortal_s42.pth"


def cli(*args):
    p = subprocess.run([sys.executable, "-m", "soul_core.models", *args], capture_output=True, text=True, encoding="utf-8", timeout=180)
    return p.returncode, [json.loads(l) for l in p.stdout.splitlines() if l.strip()]


@pytest.mark.skipif(not DEV.exists(), reason="no dev model")
def test_import_valid_model_atomic_and_idempotent(tmp_path):
    rc, out = cli("import", str(DEV), "--root", str(tmp_path))
    assert rc == 0 and [m.get("step") for m in out[:3]] == ["copy", "verify", "load"]
    entry = out[-1]["done"]
    assert (tmp_path / "models" / f"{entry['sha256']}.pth").exists()
    assert entry["tag"].startswith("mortal-v4") and entry["version"] == 4
    assert not list((tmp_path / "tmp").glob("import-*"))              # 不留半成品
    rc, out = cli("import", str(DEV), "--root", str(tmp_path))         # 重复导入：清单里仍只有一条
    assert rc == 0 and len(models.read_manifest(tmp_path)) == 1


def test_import_rejects_garbage_without_side_effects(tmp_path):
    bad = tmp_path / "bad.pth"
    bad.write_bytes(b"not a checkpoint")
    root = tmp_path / "data"
    rc, out = cli("import", str(bad), "--root", str(root))
    assert rc == 1 and out[-1]["code"] in ("unsafe_or_corrupt", "verify_failed", "verify_crashed")
    assert models.read_manifest(root) == [] and not list((root / "models").glob("*.pth"))


def test_import_rejects_malicious_pickle(tmp_path):
    import pickle

    class Evil:
        def __reduce__(self):
            import os
            return (os.system, ("touch " + str(tmp_path / "pwned"),))

    bad = tmp_path / "evil.pth"
    bad.write_bytes(pickle.dumps(Evil()))
    rc, out = cli("import", str(bad), "--root", str(tmp_path / "data"))
    assert rc == 1 and not (tmp_path / "pwned").exists()               # weights_only 阻止了代码执行


def test_missing_file(tmp_path):
    rc, out = cli("import", str(tmp_path / "nope.pth"), "--root", str(tmp_path))
    assert rc == 1 and out[-1]["code"] == "missing"
