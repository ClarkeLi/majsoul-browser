import { describe, expect, it } from 'vitest'
import { doraFromMarker, seatWind } from './dora'

describe('dora', () => {
  it('指示牌 -> 宝牌', () => {
    expect(doraFromMarker('3p')).toBe('4p')
    expect(doraFromMarker('9m')).toBe('1m')
    expect(doraFromMarker('5sr')).toBe('6s')
    expect(doraFromMarker('N')).toBe('E')
    expect(doraFromMarker('C')).toBe('P')
    expect(doraFromMarker('?')).toBe('?')
  })
  it('座位风', () => {
    expect(seatWind(2, 2)).toBe('E')
    expect(seatWind(1, 2)).toBe('N')
    expect(seatWind(3, 2)).toBe('S')
  })
})
