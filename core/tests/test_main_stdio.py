import json
import subprocess
import sys


def run(lines):
    p = subprocess.run([sys.executable, "-m", "soul_core.main"], input="\n".join(lines) + "\n",
                       capture_output=True, text=True, timeout=30)
    return p, [json.loads(l) for l in p.stdout.splitlines()]


def test_ready_and_shutdown():
    p, out = run(['{"t":"hello","protocolVersion":1}', '{"t":"mode.set","mode":"assist"}', '{"t":"shutdown"}'])
    assert p.returncode == 0
    assert out[0] == {"t": "ready", "protocolVersion": 1, "coreVersion": "0.1.0"}
    assert out[1]["t"] == "session.status" and out[1]["mode"] == "assist"


def test_protocol_mismatch_refuses():
    p, out = run(['{"t":"hello","protocolVersion":99}'])
    assert p.returncode == 2 and out[-1]["code"] == "protocol_mismatch"


def test_bad_json_reports_error_and_continues():
    p, out = run(["not json", '{"t":"shutdown"}'])
    assert any(m.get("code") == "bad_json" for m in out) and p.returncode == 0
