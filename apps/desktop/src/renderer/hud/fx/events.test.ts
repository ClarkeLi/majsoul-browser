import { describe, expect, it } from 'vitest'
import { detectFx, type FxSnap } from './events'
import type { StateMsg } from '@shared/protocol'

const base: FxSnap = { game: 'g', round: 'E1-0', tenpai: false, waits: [], judgeKey: null, judge: null, streak: 0, riichi: [], rank: 2, self: 0 }
const st = { hand: ['1m', '9p'], drawn: null, rivers: [[], [], [{ tile: '9p', tsumogiri: false, riichi: true, called: false }], []], melds: [[], [], [], []], round: { dora_markers: [] } } as unknown as StateMsg

describe('detectFx', () => {
  it('fires nothing on the first snapshot or a new game', () => {
    expect(detectFx(null, base, st)).toEqual([])
    expect(detectFx({ ...base, game: 'other' }, { ...base, tenpai: true, waits: [{ tile: '5m', left: 3 }] }, st)).toEqual([])
  })
  it('celebrates reaching tenpai within the same round only', () => {
    const next = { ...base, tenpai: true, waits: [{ tile: '5m', left: 3 }] }
    expect(detectFx(base, next, st)).toEqual([{ k: 'tenpai', waits: [{ tile: '5m', left: 3 }] }])
    expect(detectFx(base, { ...next, round: 'E2-0' }, st).some((e) => e.k === 'tenpai')).toBe(false)
  })
  it('reports agree with the combo count, and misses with the AI pick', () => {
    const hit = { revision: 3, want: '9s', wantRiichi: false, actual: '9s', actualRiichi: false, agree: true, pActual: 0.9, qLoss: 0 }
    expect(detectFx(base, { ...base, judge: hit, judgeKey: '3:9s:false', streak: 4 }, st)).toEqual([{ k: 'agree', tile: '9s', streak: 4 }])
    const miss = { ...hit, actual: '2s', agree: false, qLoss: 0.4 }
    expect(detectFx(base, { ...base, judge: miss, judgeKey: '3:2s:false' }, st)).toEqual([{ k: 'miss', want: '9s', actual: '2s', qLoss: 0.4 }])
  })
  it('warns about a new opponent riichi with the safest tile', () => {
    const ev = detectFx(base, { ...base, riichi: [2] }, st)
    expect(ev).toEqual([{ k: 'riichi', seat: 2, safe: '9p', why: 'genbutsu' }])
    expect(detectFx({ ...base, riichi: [2] }, { ...base, riichi: [2] }, st)).toEqual([])
    expect(detectFx(base, { ...base, riichi: [0] }, st)).toEqual([])
  })
  it('announces rank changes between rounds', () => {
    expect(detectFx(base, { ...base, round: 'E2-0', rank: 1 }, st)).toEqual([{ k: 'rank', from: 2, to: 1 }])
  })
})
