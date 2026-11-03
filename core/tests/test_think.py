"""移植自旧原型 tests/test_think.py；参数改为旧版 settings.yaml 实际生效的那一组。"""
from soul_core.decision.think import NEW_ROUND_SETTLE_S, decision_delay, think_seconds

mid = lambda a, b: (a + b) / 2
top = lambda a, b: b


def test_sure_and_empty_use_fast_range():
    assert think_seconds([99.9, 0.1], 5000, 20000, rng=mid) == 1.85      # (1.2+2.5)/2
    assert think_seconds([], 5000, 20000, rng=mid) == 1.85
    assert think_seconds([99.9, 0.1], 5000, 20000, rng=lambda a, b: a) == 1.2


def test_mid_confidence_between_fast_and_slow():
    v = think_seconds([60, 40], 5000, 20000, rng=mid)
    assert 2.5 < v <= 4.4, v


def test_bank_used_only_when_time_add_is_large_enough():
    v = think_seconds([30, 23, 20, 17, 10], 5000, 20000, rng=mid)
    assert 4.4 < v <= 9.4, v
    assert think_seconds([30, 23, 20, 17, 10], 5000, 5000, rng=mid) <= 4.4      # 备用时间 < 8s：不动用


def test_monotonic_in_uncertainty():
    a = think_seconds([80, 20], 5000, 20000, rng=mid)
    b = think_seconds([50, 50], 5000, 20000, rng=mid)
    c = think_seconds([30, 23, 20, 17, 10], 5000, 20000, rng=mid)
    assert a < b < c


def test_never_exceeds_time_fixed_minus_margin_plus_bank():
    assert think_seconds([25] * 4, 5000, 20000, rng=top) <= 9.4
    assert think_seconds([25] * 4, 3000, 0, rng=top) <= 2.4           # 3000 - 600
    assert think_seconds([25] * 4, 300000, 0, rng=top) <= 4.4 * 1.15  # 友人房时间很多：只受 slow_ms 约束


def test_decision_delay_subtracts_elapsed_and_settles_new_round():
    alts = [{"p": 0.999}, {"p": 0.001}]
    target, wait = decision_delay(alts, {"time_fixed": 5000, "time_add": 0}, elapsed_s=0.5, rng=mid)
    assert target == 1.85 and abs(wait - 1.35) < 1e-9
    _, wait = decision_delay(alts, None, elapsed_s=3.0, rng=mid)
    assert wait == 0.0                                                # 推理已经花得比思考时间还久
    target, _ = decision_delay(alts, None, elapsed_s=0.0, fresh_round=True, rng=lambda a, b: a)
    assert target == NEW_ROUND_SETTLE_S                               # 新局第一打至少 2 秒
