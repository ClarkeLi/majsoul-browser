import type { TFunction } from 'i18next'
import { relSeat, tileName } from '@renderer/lib/tiles'
import type { Tip } from '@shared/protocol'

type Brief = { shanten: number; total: number }
const state = (t: TFunction, b: Brief): string => (b.shanten === 0 ? t('shanten.tenpai') : t('shanten.n', { n: b.shanten }))

/** 把 Core 给的结构化教学提示渲染成一句话（按当前语言）。 */
export function renderTip(t: TFunction, tip: Tip, self: number): string {
  const join = (xs: string[]): string => xs.join(t('tips.and'))
  const safeList = (list: Array<{ tile: string; why: string }>): string =>
    join(list.map((x) => `${tileName(t, x.tile)}（${t(`tips.why.${x.why}`, { defaultValue: x.why })}）`))
  const opp = (seat: number): string => t(`seat.${relSeat(seat, self)}`)
  switch (tip.code) {
    case 'why_closer':
    case 'why_more':
    case 'close_call': {
      const a = tip.a as Brief, b = tip.b as Brief
      return t(`tips.${tip.code}`, { tile: tileName(t, String(tip.tile)), alt: tileName(t, String(tip.alt)), a: state(t, a), an: a.total, b: state(t, b), bn: b.total })
    }
    case 'tenpai':
      return t('tips.tenpai', { waits: join((tip.waits as string[]).map((w) => tileName(t, w))), total: tip.total })
    case 'safe_tiles':
    case 'fold':
      return t(`tips.${tip.code}`, { opp: opp(Number(tip.seat)), list: safeList(tip.safe as Array<{ tile: string; why: string }>) })
    case 'call_rule':
      return t(`tips.call_rule_${String(tip.kind)}`)
    default:
      return t(`tips.${tip.code}`, { defaultValue: '' })
  }
}
