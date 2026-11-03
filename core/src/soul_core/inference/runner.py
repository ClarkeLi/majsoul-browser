"""Mortal worker：stdin 每行一个 MJAI 事件，stdout 严格一问一答。

沿用旧 runner.py 的 ``__none__`` 哨兵：无需行动时也回一行，调用方不必靠超时判断。
模型路径、设备、座位全部来自命令行，不读 config.toml / 环境变量里的绝对路径。

    python -m soul_core.inference.runner --model X.pth --device cpu --player-id 0
"""
import argparse
import logging
import sys

SENTINEL = '{"type":"__none__"}'


def load_engine(model_path: str, device: str = "cpu"):
    """加载模型并返回 MortalEngine。weights_only=True，拒绝任意 pickle。"""
    import torch

    from .engine import MortalEngine
    from .model import Brain, DQN

    dev = torch.device(device)
    state = torch.load(model_path, weights_only=True, map_location=dev)
    cfg = state["config"]
    version = cfg["control"].get("version", 1)
    mortal = Brain(version=version, num_blocks=cfg["resnet"]["num_blocks"],
                   conv_channels=cfg["resnet"]["conv_channels"]).eval()
    dqn = DQN(version=version).eval()
    mortal.load_state_dict(state["mortal"])
    dqn.load_state_dict(state["current_dqn"])
    return MortalEngine(
        mortal, dqn, version=version, is_oracle=False, device=dev,
        enable_amp=False, enable_quick_eval=True,
        enable_rule_based_agari_guard=True, name="mortal",
    )


def serve(engine, player_id: int, lines, out) -> None:
    from libriichi.mjai import Bot

    bot = Bot(engine, player_id)
    for line in lines:
        line = line.strip()
        if not line:
            continue
        reaction = bot.react(line)
        print(reaction if reaction else SENTINEL, file=out, flush=True)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--device", default="cpu", choices=["cpu", "mps", "cuda"])
    ap.add_argument("--player-id", type=int, required=True, choices=range(4))
    a = ap.parse_args(argv)
    logging.basicConfig(stream=sys.stderr, level=logging.INFO)
    sys.stdin.reconfigure(encoding="utf-8")
    serve(load_engine(a.model, a.device), a.player_id, sys.stdin, sys.stdout)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        pass
