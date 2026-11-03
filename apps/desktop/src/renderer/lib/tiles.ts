import type { TFunction } from 'i18next'

/** MJAI 牌名 -> 展示用中文，例如 5mr -> 赤五万、E -> 东。 */
export function tileName(t: TFunction, code: string): string {
  if (!code || code === '?') return '?'
  if ('ESWNPFC'.includes(code) && code.length === 1) return t(`tile.honor.${code}`)
  const red = code.endsWith('r')
  const num = Number(code[0])
  const suit = code[1] as 'm' | 'p' | 's'
  const nums = t('tile.num', { returnObjects: true }) as unknown as string[]
  return (red ? t('tile.red') : '') + (nums[num] ?? code[0]) + t(`tile.suit.${suit}`)
}

const HONOR_FILE: Record<string, string> = { E: 'Ton', S: 'Nan', W: 'Shaa', N: 'Pei', P: 'Haku', F: 'Hatsu', C: 'Chun' }
const SUIT_FILE: Record<string, string> = { m: 'Man', p: 'Pin', s: 'Sou' }

/** MJAI 牌名 -> 牌面 SVG 文件名（不含扩展名）；牌背用 'Back'。 */
export function tileFace(code: string): string | null {
  if (!code || code === '?') return null
  if (HONOR_FILE[code]) return HONOR_FILE[code]!
  const red = code.endsWith('r')
  const n = code[0]!
  const s = SUIT_FILE[code[1]!]
  if (!s) return null
  return `${s}${n}${red ? '-Dora' : ''}`
}

export const SEAT_KEYS = ['self', 'next', 'across', 'prev'] as const
/** 相对自家的座位名 key：1=下家 2=对家 3=上家 */
export function relSeat(seat: number, self: number): (typeof SEAT_KEYS)[number] {
  return SEAT_KEYS[(seat - self + 4) % 4]!
}
export const WINDS = ['E', 'S', 'W', 'N'] as const

/** 方块徽章里的风位：只取一个字（中日韩不变，英 / 德取首字母，如 East → E、Ost → O）。完整名称用 t(`wind.X`)。 */
export function windChar(t: (k: string) => string, w: string): string {
  return t(`wind.${w}`).trim().charAt(0)
}
