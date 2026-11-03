import { describe, expect, it } from 'vitest'
import { BAR_MIN, RESERVE_BOTTOM, RESERVE_TOP, fitGame } from './layout-fit'

describe('fitGame', () => {
  it('不预留时与旧行为一致：严格 16:9 居中', () => {
    const f = fitGame(1200, 832)
    expect(f.game.w).toBe(1200); expect(f.game.h).toBe(675)
    expect(f.top.h + f.bottom.h + f.game.h).toBe(832)
    expect(Math.abs(f.top.h - f.bottom.h)).toBeLessThanOrEqual(1)
  })
  it('预留：上下信息栏至少有预留高度，画面仍是 16:9', () => {
    for (const [w, h] of [[1200, 832], [1544, 832], [880, 692], [1280, 900]] as const) {
      const f = fitGame(w, h, { reserve: true, dock: 'split' })
      expect(f.top.h).toBeGreaterThanOrEqual(RESERVE_TOP)
      expect(f.bottom.h).toBeGreaterThanOrEqual(RESERVE_BOTTOM - 1)
      expect(Math.abs(f.game.w * 9 - f.game.h * 16)).toBeLessThanOrEqual(16)
      expect(f.game.x).toBeGreaterThanOrEqual(0)
      expect(f.game.y + f.game.h + f.bottom.h).toBe(h)
    }
    expect(BAR_MIN).toBeLessThan(RESERVE_TOP)
  })
  it('dock=bottom：画面贴着预留的上栏，多出来的全给下栏', () => {
    const f = fitGame(1200, 900, { reserve: true, dock: 'bottom' })
    expect(f.game.y).toBe(RESERVE_TOP)
    expect(f.bottom.h).toBeGreaterThan(RESERVE_BOTTOM)
  })
  it('窗口极小时不出现负数', () => {
    const f = fitGame(300, 100, { reserve: true, dock: 'split' })
    expect(f.game.w).toBeGreaterThanOrEqual(0); expect(f.game.h).toBeGreaterThanOrEqual(0); expect(f.bottom.h).toBeGreaterThanOrEqual(0)
  })
})
