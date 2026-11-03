import { describe, expect, it } from 'vitest'
import { computeLayout } from './layout'

describe('computeLayout', () => {
  it('游戏区严格 16:9 并居中', () => {
    const { game } = computeLayout(1600, 900, { width: 400, collapsed: false })
    expect(game.w * 9).toBeCloseTo(game.h * 16, -1)
    expect(game.x + game.w).toBeLessThanOrEqual(1200)
  })
  it('折叠后侧栏 56px', () => {
    const { sidebar } = computeLayout(1600, 900, { width: 400, collapsed: true })
    expect(sidebar.w).toBe(56)
  })
  it('窗口很高时左右铺满、上下 letterbox', () => {
    const { game } = computeLayout(1280, 1200, { width: 340, collapsed: false })
    expect(game.w).toBe(940)
    expect(game.y).toBeGreaterThan(44)
  })
})

describe('computeLayout 与信息栏预留', () => {
  it('预留后游戏画面仍在游戏区内，且上下信息栏有空间', () => {
    const { game, area } = computeLayout(1600, 900, { width: 400, collapsed: false }, { reserve: true, dock: 'split' })
    expect(game.y - area.y).toBeGreaterThanOrEqual(34)
    expect(area.y + area.h - (game.y + game.h)).toBeGreaterThanOrEqual(91)
    expect(game.x + game.w).toBeLessThanOrEqual(area.w)
  })
})
