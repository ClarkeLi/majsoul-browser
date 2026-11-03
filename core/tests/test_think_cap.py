import itertools

from soul_core.decision.think import SAFETY_MS, STEP_MS, decision_delay, hard_cap_ms, think_seconds

PROBS = [[99, 1], [60, 40], [35, 33, 32], [51, 49], [90, 10], []]


def test_bank_used_up_never_exceeds_base_time():
    # 5+20 的局，20 秒备用时间已经用完：想 + 点 必须在 5 秒内
    for probs, steps, r in itertools.product(PROBS, (1, 2, 3), (0.0, 1.0)):
        rng = (lambda a, b, r=r: a + (b - a) * r)
        t = think_seconds(probs, 5000, 0, rng=rng, n_steps=steps) * 1000
        assert t + steps * STEP_MS + SAFETY_MS <= 5000 + 1e-6, (probs, steps, t)


def test_bank_used_at_most_quarter_and_leaves_reserve():
    assert hard_cap_ms(5000, 20000) == 5000 - SAFETY_MS - STEP_MS + 5000
    assert hard_cap_ms(5000, 7000) == 5000 - SAFETY_MS - STEP_MS      # 不足 8 秒不动用
    assert hard_cap_ms(5000, 9000) == 5000 - SAFETY_MS - STEP_MS + 2250


def test_fresh_round_settle_does_not_break_cap():
    # 时间极短时，“新局第一打等 2 秒”也不能超过上限
    target, wait = decision_delay([{"p": 0.99}], {"time_fixed": 3000, "time_add": 0}, 0.5, fresh_round=True, rng=lambda a, b: b)
    assert target * 1000 <= hard_cap_ms(3000, 0)
    assert wait == max(0.0, target - 0.5)


def test_hard_choice_uses_bank_when_available():
    slow = think_seconds([34, 33, 33], 5000, 20000, rng=lambda a, b: b) * 1000
    assert slow > hard_cap_ms(5000, 0)
    assert slow <= hard_cap_ms(5000, 20000)
