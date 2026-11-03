import { describe, expect, it } from 'vitest'
import { ClickExecutor, windowCanClick, type MouseSink } from './click-executor'

function setup(opts: { canRun?: () => boolean } = {}) {
  const log: string[] = []
  const sink: MouseSink = {
    move: (x, y) => log.push(`move ${x},${y}`),
    down: (x, y) => log.push(`down ${x},${y}`),
    up: (x, y) => log.push(`up ${x},${y}`)
  }
  const ex = new ClickExecutor({ sink, getRect: () => ({ x: 0, y: 0, w: 1600, h: 900 }), canRun: opts.canRun ?? (() => true), sleep: async () => {} })
  return { ex, log }
}

describe('ClickExecutor', () => {
  it('按顺序 move→down→up，每步一次（零重复点）', async () => {
    const { ex, log } = setup()
    const r = await ex.run({ steps: [{ t: 'button', slot: 1 }, { t: 'candidate', index: 1, count: 3, kan: false }] }, () => true)
    expect(r.ok).toBe(true)
    expect(log.map((l) => l.split(' ')[0])).toEqual(['move', 'down', 'up', 'move', 'down', 'up'])
  })
  it('intent 失效后立即中止，不再点任何东西', async () => {
    const { ex, log } = setup()
    let valid = true
    const r = await ex.run({ steps: [{ t: 'button', slot: 1 }, { t: 'button', slot: 0 }] }, () => valid, () => { valid = false })
    expect(r).toEqual({ ok: false, aborted: true })
    expect(log).toEqual([])
  })
  it('窗口不可用（最小化）时一步都不点', async () => {
    const { ex, log } = setup({ canRun: () => false })
    expect(await ex.run({ steps: [{ t: 'button', slot: 0 }] }, () => true)).toEqual({ ok: false, aborted: true })
    expect(log).toEqual([])
  })
  it('目标槽位越界：报错且不点', async () => {
    const { ex, log } = setup()
    const r = await ex.run({ steps: [{ t: 'hand', index: 20, gap: false }] }, () => true)
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.aborted === false).toBe(true)
    expect(log).toEqual([])
  })
  it('windowCanClick：只在最小化 / 已销毁时拒绝（在别的桌面、被遮挡都照样点）', () => {
    const w = (min: boolean, dead = false) => ({ isMinimized: () => min, isDestroyed: () => dead })
    expect(windowCanClick(w(false))).toBe(true)
    expect(windowCanClick(w(true))).toBe(false)
    expect(windowCanClick(w(false, true))).toBe(false)
  })
})
