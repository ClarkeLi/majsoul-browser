import { describe, expect, it } from 'vitest'
import type { RecommendationMsg, StateMsg } from '@shared/protocol'
import { addJudgement, EMPTY_PRACTICE, judgeDiscard, oppSafety, optionRows, placeAdvice, placement, riichiTurn, tierFor } from './coach'

const rec = (over: Partial<RecommendationMsg> = {}): RecommendationMsg => ({
  t: 'recommendation', revision: 10, kind: 'discard', tile: '9s',
  alts: [
    { id: '9s', kind: 'discard', tile: '9s', p: 0.8, q: 1.4 },
    { id: '2s', kind: 'discard', tile: '2s', p: 0.15, q: 0.9 },
    { id: '5mr', kind: 'discard', tile: '5mr', p: 0.05, q: 0.2 }
  ],
  ...over
})

const r = (tile: string, extra = {}) => ({ tile, tsumogiri: false, riichi: false, called: false, ...extra })
const state = (over: Partial<StateMsg> = {}): StateMsg => ({
  t: 'state', revision: 1, phase: 'in_game', desync_reason: '', self_seat: 1, game_uuid: 'g',
  round: { bakaze: 'E', kyoku: 1, honba: 0, kyotaku: 0, oya: 0, left: 50, dora_markers: ['3p'], active: true },
  scores: [25000, 25000, 25000, 25000], hand: ['2m', '5m', '6p', 'E', 'P'], drawn: '9s',
  melds: [[], [], [], []], rivers: [[], [], [], []], riichi: [], analysis: null, ...over
})

describe('judgeDiscard', () => {
  it('打了推荐牌 → 一致、损失 0', () => {
    const j = judgeDiscard(rec(), '9s', false)!
    expect(j.agree).toBe(true)
    expect(j.qLoss).toBe(0)
    expect(j.pActual).toBe(0.8)
  })
  it('打了别的牌 → 不一致，损失 = q(推荐) − q(你的)', () => {
    const j = judgeDiscard(rec(), '2s', false)!
    expect(j.agree).toBe(false)
    expect(j.qLoss).toBe(0.5)
    expect(j.pActual).toBe(0.15)
  })
  it('赤五与普通五：候选里是 5mr，你打的 5m 也能找到', () => {
    expect(judgeDiscard(rec(), '5m', false)!.qLoss).toBe(1.2)
  })
  it('推荐立直但你只打牌不立直 → 不一致', () => {
    const j = judgeDiscard(rec({ kind: 'riichi', tile: null, riichi_tile: '9s', alts: [{ id: 'riichi', kind: 'riichi', p: 0.7, q: 2 }, { id: '9s', kind: 'discard', tile: '9s', p: 0.3, q: 1.5 }] }), '9s', false)!
    expect(j.agree).toBe(false)
    expect(j.qLoss).toBe(0.5)
  })
  it('鸣牌推荐不判定', () => {
    expect(judgeDiscard(rec({ kind: 'pon' }), '9s', false)).toBeNull()
    expect(judgeDiscard(null, '9s', false)).toBeNull()
  })
  it('找不到候选 → 损失未知', () => {
    expect(judgeDiscard(rec(), 'N', false)!.qLoss).toBeNull()
  })
  it('累计：一致率与按损失排序的失误', () => {
    let s = addJudgement(EMPTY_PRACTICE, judgeDiscard(rec(), '9s', false)!)
    s = addJudgement(s, judgeDiscard(rec(), '2s', false)!)
    s = addJudgement(s, judgeDiscard(rec(), '5m', false)!)
    expect(s).toMatchObject({ judged: 3, agree: 1, lossSum: 1.7 })
    expect(s.mistakes.map((m) => m.actual)).toEqual(['5m', '2s'])
  })
})

describe('placement', () => {
  it('名次、上下差', () => {
    const p = placement(state({ scores: [32000, 24000, 27000, 17000] }))
    expect(p.rank).toBe(3)
    expect(p.ranks).toEqual([1, 3, 2, 4])
    expect(p.toAbove).toBe(3000)
    expect(p.aboveSeat).toBe(2)
    expect(p.overBelow).toBe(7000)
  })
  it('同分按座位：座位号小的在前', () => {
    const p = placement(state({ scores: [25000, 25000, 30000, 20000] }))
    expect(p.ranks).toEqual([2, 3, 1, 4])
    expect(p.needOther).toBe(1)
  })
  it('升位需要：扣除本场与供托，直击减半', () => {
    const p = placement(state({ scores: [33000, 25000, 22000, 20000], round: { bakaze: 'S', kyoku: 4, honba: 1, kyotaku: 1, oya: 3, left: 30, dora_markers: [], active: true } }))
    // 差 8000 + 1（座位 1 > 0）= 8001；他家放铳：8001 − 300 − 1000 = 6701 → 满贯；直击：ceil(7001/2) − 300 = 3201 → 3 番
    expect(p.needOther).toBe(6701)
    expect(p.tierOther).toBe('mangan')
    expect(p.needDirect).toBe(3201)
    expect(p.tierDirect).toBe('3han')
    expect(p.allLast).toBe(true)
  })
  it('打点阶梯', () => {
    expect(tierFor(900, false)).toBe('1han')
    expect(tierFor(8000, false)).toBe('mangan')
    expect(tierFor(8000, true)).toBe('mangan')
    expect(tierFor(50000, false)).toBe('impossible')
  })
  it('顺位建议', () => {
    const al = { bakaze: 'S', kyoku: 4, honba: 0, kyotaku: 0, oya: 0, left: 30, dora_markers: [], active: true }
    expect(placeAdvice(placement(state({ round: al, scores: [20000, 40000, 25000, 15000] })))).toBe('lead_safe')
    expect(placeAdvice(placement(state({ round: al, scores: [30000, 10000, 25000, 35000] })))).toBe('last_must_win')
    expect(placeAdvice(placement(state({ round: al, scores: [40000, 24000, 15000, 22000] })))).toBe('avoid_fourth')
    expect(placeAdvice(placement(state({ scores: [40000, 24000, 15000, 22000] })))).toBeNull()
  })
})

describe('oppSafety', () => {
  it('现物 > 筋 > 字牌见过 2 张 > 单筋', () => {
    const st = state({
      hand: ['2m', '5m', '6p', '4s', 'E', 'P'], drawn: '9s',
      rivers: [[r('5m'), r('9p'), r('1s')], [r('E')], [r('E')], []]
    })
    const s = oppSafety(st, 0)
    // 6p：两侧 3p/9p 只有 9p 在河里 → 单筋；4s：1s 在河里 → 单筋；P 没人打过 → 不算；9s：6s 不在 → 不算
    expect(s.map((x) => [x.tile, x.why])).toEqual([['5m', 'genbutsu'], ['2m', 'suji'], ['E', 'honor_seen'], ['6p', 'half_suji'], ['4s', 'half_suji']])
    expect(s[1]!.basis).toBe('5m')
    expect(s[2]!.seen).toBe(2)
  })
  it('赤五按普通五算现物', () => {
    const st = state({ hand: ['5pr'], drawn: null, rivers: [[], [], [r('5p')], []] })
    expect(oppSafety(st, 2)).toEqual([{ tile: '5pr', why: 'genbutsu' }])
  })
  it('立直巡目', () => {
    expect(riichiTurn(state({ rivers: [[r('1m'), r('2m'), r('3m', { riichi: true })], [], [], []] }), 0)).toBe(3)
    expect(riichiTurn(state(), 0)).toBeNull()
  })
})

describe('optionRows', () => {
  it('标出每列最佳：向听最低、同向听里进张最多、放铳最低', () => {
    const rc = rec({ insight: { options: { '9s': { shanten: 0, total: 8, ukeire: [] }, '2s': { shanten: 1, total: 34, ukeire: [] }, '5mr': { shanten: 1, total: 30, ukeire: [] } }, verdict: null, focus_risk: null } })
    const st = state({ analysis: { threat: [], risk: { '9s': { risk: 0.4, tier: 1 }, '2s': { risk: 2.1, tier: 2 }, '5m': { risk: 6, tier: 3 } } } })
    const rows = optionRows(rc, st, 3)
    expect(rows.map((x) => x.best.shanten)).toEqual([true, false, false])
    // 只有 9s 是 0 向听，同向听里没有可比的 → 不标进张
    expect(rows.map((x) => x.best.total)).toEqual([false, false, false])
    expect(rows.map((x) => x.best.risk)).toEqual([true, false, false])
    expect(rows[2]!.risk).toBe(6)
  })
})

describe('combo streak', () => {
  it('counts consecutive agreements and keeps the best', () => {
    const hit = judgeDiscard(rec(), '9s', false)!
    const miss = judgeDiscard(rec(), '2s', false)!
    let s = EMPTY_PRACTICE
    s = addJudgement(s, hit); s = addJudgement(s, hit); s = addJudgement(s, hit)
    expect(s.streak).toBe(3)
    s = addJudgement(s, miss)
    expect(s.streak).toBe(0)
    expect(s.bestStreak).toBe(3)
    s = addJudgement(s, hit)
    expect([s.streak, s.bestStreak]).toEqual([1, 3])
  })
})
