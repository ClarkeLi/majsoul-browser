"""与 mortal.py 等价，但保证每个事件都回一行输出。

mortal.py 只在「能行动」时打印，调用方没法预知何时该读，只能靠超时。
这里对「无需行动」的情况回一个哨兵，使 stdin/stdout 变成严格的一问一答。
"""
import prelude  # noqa: F401  (配置日志、编码)

import os
import sys
import json

import torch

from model import Brain, DQN
from engine import MortalEngine
from common import filtered_trimmed_lines
from libriichi.mjai import Bot
from config import config

SENTINEL = '{"type":"__none__"}'


def main() -> None:
    player_id = int(sys.argv[-1])
    assert player_id in range(4)

    device = torch.device(os.environ.get('MORTAL_DEVICE', 'cpu'))   # 模拟时可设 mps；实战默认 CPU
    state = torch.load(config['control']['state_file'],
                       weights_only=True, map_location=device)
    cfg = state['config']
    version = cfg['control'].get('version', 1)
    num_blocks = cfg['resnet']['num_blocks']
    conv_channels = cfg['resnet']['conv_channels']

    mortal = Brain(version=version, num_blocks=num_blocks,
                   conv_channels=conv_channels).eval()
    dqn = DQN(version=version).eval()
    mortal.load_state_dict(state['mortal'])
    dqn.load_state_dict(state['current_dqn'])

    engine = MortalEngine(
        mortal, dqn,
        version=version,
        is_oracle=False,
        device=device,
        enable_amp=False,
        enable_quick_eval=True,
        enable_rule_based_agari_guard=True,
        name='mortal',
    )
    bot = Bot(engine, player_id)

    for line in filtered_trimmed_lines(sys.stdin):
        reaction = bot.react(line)
        print(reaction if reaction else SENTINEL, flush=True)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        pass
