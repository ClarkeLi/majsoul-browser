import { describe, expect, it } from 'vitest'
import { SlotOutOfRange, planToPoints, stepToPoint, toView } from './ui-map'

const rect = { x: 0, y: 0, w: 1600, h: 900 }

describe('ui-map', () => {
  it('16×9 -> view：scale = w/16', () => {
    expect(toView(16, 9, rect)).toEqual({ x: 1600, y: 900 })
    expect(toView(8, 4.5, { x: 100, y: 50, w: 800, h: 450 })).toEqual({ x: 500, y: 275 })
  })
  it('手牌：摸到的牌多一个 TRUMO_SPACE', () => {
    const a = stepToPoint({ t: 'hand', index: 13, gap: false }, rect)
    const b = stepToPoint({ t: 'hand', index: 13, gap: true }, rect)
    expect(b.x - a.x).toBe(Math.round(((12.509375 + 0.246875) / 16) * 1600) - Math.round((12.509375 / 16) * 1600))
    expect(a.y).toBe(Math.round((8.3625 / 9) * 900))
  })
  it('按钮槽位 0 在右下，槽位 1 在其左侧', () => {
    const s0 = stepToPoint({ t: 'button', slot: 0 }, rect)
    const s1 = stepToPoint({ t: 'button', slot: 1 }, rect)
    expect(s1.x).toBeLessThan(s0.x)
    expect(s1.y).toBe(s0.y)
  })
  it('候选：3 个吃组合落在 CANDIDATES[3],[5],[7]；杠候选 2 个落在 [2],[4]', () => {
    const xs = [0, 1, 2].map((i) => stepToPoint({ t: 'candidate', index: i, count: 3, kan: false }, rect).x)
    expect(xs).toEqual([6.16375, 7.83125, 9.49875].map((g) => Math.round((g / 16) * 1600)))
    const ks = [0, 1].map((i) => stepToPoint({ t: 'candidate', index: i, count: 2, kan: true }, rect).x)
    expect(ks).toEqual([6.6583, 8.9917].map((g) => Math.round((g / 16) * 1600)))
  })
  it('letterbox / 侧栏开合：随 rect 缩放', () => {
    const small = { x: 0, y: 0, w: 800, h: 450 }
    const p = planToPoints([{ t: 'hand', index: 0, gap: false }], small)[0]!
    expect(p.x).toBe(Math.round((2.23125 / 16) * 800))
  })
  it('槽位越界抛错（失败关闭）', () => {
    expect(() => stepToPoint({ t: 'hand', index: 14, gap: false }, rect)).toThrow(SlotOutOfRange)
    expect(() => stepToPoint({ t: 'button', slot: 9 }, rect)).toThrow(SlotOutOfRange)
  })
})
