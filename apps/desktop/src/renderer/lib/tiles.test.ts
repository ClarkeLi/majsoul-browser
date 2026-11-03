import { describe, expect, it } from 'vitest'
import { relSeat, tileFace } from './tiles'

describe('tiles', () => {
  it('牌面文件映射', () => {
    expect(tileFace('5mr')).toBe('Man5-Dora')
    expect(tileFace('9p')).toBe('Pin9')
    expect(tileFace('E')).toBe('Ton')
    expect(tileFace('C')).toBe('Chun')
    expect(tileFace('?')).toBeNull()
  })
  it('相对座位', () => {
    expect(relSeat(2, 1)).toBe('next')
    expect(relSeat(3, 1)).toBe('across')
    expect(relSeat(0, 1)).toBe('prev')
  })
})
