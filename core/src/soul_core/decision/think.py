"""思考时间：按候选把握度决定等多久再执行。移植自旧原型 plugin/autoplay.py 的 think_seconds，
参数取旧版 settings.yaml 里实际生效的那一组（fast 1.2–2.5s、最纠结 4.4s、bank 25%/8s）。

· 第一候选把握度 ≥ sure → 快出（fast 区间内随机）
· 越接近越久：在 fast 上限与 slow_ms 之间线性插值，前两名差距 < 10% 再加一点
· 最纠结（u ≥ bank_from）时，若备用时间 time_add 够多，再动用一部分
· 硬上限 hard_cap_ms：想 + 点 一定在 time_fixed（加上愿意动用的备用时间）内完成，
  例如 5+20 的局备用时间用完后，每手最多想 5 − 1.5 − 0.42×步数 秒
所有时间单位毫秒（返回秒）。
"""
from __future__ import annotations

import random

THINK_DEFAULTS = {
    "fast_ms": (1200.0, 2500.0), "slow_ms": 4400.0, "sure": 0.95, "bank_from": 0.6,
    "bank_ratio": 0.25, "bank_min_ms": 8000.0, "margin_ms": 600.0,
}
# 新局第一打：服务端要等所有人确认就绪，过早点击会被忽略
NEW_ROUND_SETTLE_S = 2.0
DEFAULT_TIME_FIXED_MS = 5000


# 点击本身要花的时间（移动 + 按下 + 步间隔，见 Electron ClickExecutor）与网络/渲染余量
STEP_MS = 420.0
SAFETY_MS = 1500.0


def hard_cap_ms(time_fixed_ms: float, time_add_ms: float, n_steps: int = 1) -> float:
    """这一手最多能“想”多久（毫秒）：保证 想 + 点 一定在基础时间（加上愿意动用的备用时间）之内。

    备用时间只在 ≥ bank_min_ms 时才动用，而且最多用 bank_ratio，并且至少留 4 秒给后面的手。
    """
    cfg = THINK_DEFAULTS
    base = max(0.0, time_fixed_ms - SAFETY_MS - STEP_MS * max(1, n_steps))
    bank = 0.0
    if time_add_ms >= cfg["bank_min_ms"]:
        bank = min(time_add_ms * cfg["bank_ratio"], time_add_ms - 4000.0)
    return base + max(0.0, bank)


def think_seconds(probs, time_fixed_ms, time_add_ms, cfg=THINK_DEFAULTS, rng=random.uniform, n_steps: int = 1) -> float:
    """probs 为百分比（或任意非负权重）列表，任意顺序。结果永远不超过 hard_cap_ms。"""
    fast = cfg["fast_ms"]
    cap_all = hard_cap_ms(time_fixed_ms, time_add_ms, n_steps)
    base_cap = hard_cap_ms(time_fixed_ms, 0, n_steps)
    vals = [float(x) for x in probs or [] if isinstance(x, (int, float)) and not isinstance(x, bool) and x >= 0]
    total = sum(vals)
    if not vals or total <= 0:
        return max(0.2, min(rng(*fast), base_cap)) / 1000
    p = sorted((v / total for v in vals), reverse=True)
    top, second = p[0], (p[1] if len(p) > 1 else 0.0)
    if top >= cfg["sure"]:
        return max(0.2, min(rng(*fast), base_cap)) / 1000
    u = max(0.0, min(1.0, (cfg["sure"] - top) / (cfg["sure"] - 0.3)))
    if top - second < 0.1:
        u = min(1.0, u + 0.15)
    target = fast[1] + u * (cfg["slow_ms"] - fast[1])
    target *= rng(0.85, 1.15)
    cap = base_cap
    if u >= cfg["bank_from"]:
        # 最纠结时才动用备用时间（上限见 hard_cap_ms）
        target += (u - cfg["bank_from"]) / (1 - cfg["bank_from"]) * (cap_all - base_cap)
        cap = cap_all
    return max(0.2, min(target, cap)) / 1000


def decision_delay(alts_all: list[dict], operation: dict | None, elapsed_s: float, fresh_round: bool = False,
                   rng=random.uniform, n_steps: int = 1) -> tuple[float, float]:
    """返回 (总思考秒数 target, 还需要再等的秒数 wait)。elapsed_s = 决策点出现后已经过去的时间（含推理耗时）。

    target 永远 ≤ hard_cap_ms：新局第一打的“等就绪”也不会把它推过上限。
    """
    op = operation or {}
    tf = op.get("time_fixed") or DEFAULT_TIME_FIXED_MS
    ta = op.get("time_add") or 0
    probs = [a["p"] * 100 for a in alts_all]
    target = think_seconds(probs, tf, ta, rng=rng, n_steps=n_steps)
    if fresh_round:
        target = min(max(target, NEW_ROUND_SETTLE_S), hard_cap_ms(tf, ta, n_steps) / 1000)
    return target, max(0.0, target - elapsed_s)
