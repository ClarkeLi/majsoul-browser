/** 宝牌指示牌 -> 宝牌（MJAI 写法）。赤五当作普通五处理。 */
export function doraFromMarker(marker: string): string {
  if (!marker || marker === '?') return '?'
  const m = marker.endsWith('r') ? marker.slice(0, 2) : marker
  if (m.length === 1) {
    const winds = 'ESWN', dragons = 'PFC'
    if (winds.includes(m)) return winds[(winds.indexOf(m) + 1) % 4]!
    if (dragons.includes(m)) return dragons[(dragons.indexOf(m) + 1) % 3]!
    return '?'
  }
  const n = Number(m[0])
  return `${(n % 9) + 1}${m[1]}`
}

export const WIND_ORDER = ['E', 'S', 'W', 'N'] as const
/** 座位风：庄家为东，依次南西北。 */
export function seatWind(seat: number, oya: number): (typeof WIND_ORDER)[number] {
  return WIND_ORDER[(seat - oya + 4) % 4]!
}
