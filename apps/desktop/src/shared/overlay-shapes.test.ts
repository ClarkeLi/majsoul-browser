import { describe, expect, it } from 'vitest'
import { overlayShapes } from './overlay-shapes'

const rect = { x: 0, y: 0, w: 1600, h: 900 }
describe('overlayShapes', () => {
  it('单步不编号；多步按顺序编号', () => {
    expect(overlayShapes([{ t: 'hand', index: 3, gap: false }], rect)[0]!.label).toBeNull()
    const two = overlayShapes([{ t: 'button', slot: 2 }, { t: 'hand', index: 5, gap: false }], rect)
    expect(two.map((s) => s.label)).toEqual(['1', '2'])
    expect(two.map((s) => s.kind)).toEqual(['button', 'tile'])
  })
  it('槽位越界的步骤不画', () => {
    expect(overlayShapes([{ t: 'hand', index: 30, gap: false }], rect)).toEqual([])
  })
})
