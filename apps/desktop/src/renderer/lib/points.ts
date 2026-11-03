import type { TFunction } from 'i18next'
import type { Balance, CandValue, HandValue, StyleInfo, Tip } from '@shared/protocol'
import { relSeat, tileName } from './tiles'

export const fmt = (n: number): string => Math.round(n).toLocaleString('en-US')
export const pct = (x: number): string => `${Math.round(x * 100)}%`
/** 带符号的点数：+1,200 / −800 / ±0 */
export const signed = (n: number): string => (Math.round(n) === 0 ? '±0' : `${n > 0 ? '+' : '−'}${fmt(Math.abs(n))}`)

/**
 * 押引的收益 / 损失 / 净值。未听牌时 Core 会按向听与进张估收益（est）；旧版 Core 没给时，
 * 用候选价值里同一张牌的进攻价值补上（同一口径），这样不听牌也有绿条、能看净值。
 */
export function balanceView(b: Balance, values?: CandValue[]): { gain: number; loss: number; net: number; est: boolean } {
  let gain = b.gain
  let est = !!b.est
  if (b.shanten > 0 && !est && gain === 0) {
    const v = values?.find((x) => x.kind === 'dahai' && x.tile === b.tile)
    if (v) { gain = Math.max(0, v.attack); est = true }
  }
  return { gain, loss: b.loss, net: gain - b.loss, est }
}

/** 一种和法：满贯以上显示等级，否则 “N 番 M 符”，后面跟点数 */
export function handText(t: TFunction, v: HandValue): string {
  const lv = v.level ? t(`coach.level2.${v.level}`, { defaultValue: '' }) : ''
  return lv ? `${lv} ${fmt(v.points)}` : `${v.han}${t('coach.han')}${v.fu}${t('coach.fu')} ${fmt(v.points)}`
}

/** 役种列表：[{ name, han }]，宝牌类放最后 */
export function yakuList(t: TFunction, v: HandValue | null | undefined): Array<{ id: number; name: string; han: number; dora: boolean }> {
  if (!v) return []
  return v.yaku
    .filter(([, han]) => han > 0)
    .map(([id, han]) => ({ id, name: t(`yaku.${id}`, { defaultValue: String(id) }), han, dora: id >= 120 }))
    .sort((a, b) => Number(a.dora) - Number(b.dora))
}

/** 候选 id 的展示名：牌名 / 立直 / 过 / 碰 / 吃 / 和 */
export function actionName(t: TFunction, id: string | null | undefined): string {
  if (!id) return '?'
  if (/^(\d[mps]r?|[ESWNPFC])$/.test(id)) return tileName(t, id)
  return t(`hero.act.${id.startsWith('chi') ? 'chi' : id}`, { defaultValue: id })
}

/** 风格改过这一手时的一行说明 */
export function styleNote(t: TFunction, st: StyleInfo): string {
  const m = actionName(t, st.model)
  if (st.kind === 'gamble') return t('hero.styleGamble', { route: t(`hero.route.${st.route}`), n: st.need, m })
  if (st.kind === 'arb') {
    if (st.arb === 'veto') return t('hero.arbVeto', { p: fmt(st.points ?? 0) })
    return t(st.arb === 'hard' ? 'hero.arbHard' : 'hero.arbSoft', { m, g: fmt(st.gain ?? 0) })
  }
  return t('hero.styleDice', { m })
}

/** 知识点（Core 的结构化代码）→ 一句话 */
export function renderKnowledge(t: TFunction, k: Tip, self: number): string {
  const tiles = (xs: unknown): string => ((xs as string[]) ?? []).map((x) => tileName(t, x)).join(t('tips.and'))
  const opp = (seat: number): string => t(`seat.${relSeat(seat, self)}`)
  switch (k.code) {
    case 'k_furiten': return t('know.k_furiten', { waits: tiles(k.waits) })
    case 'k_fold': return t('know.k_fold', { opp: ((k.seats as number[]) ?? []).map(opp).join(t('tips.and')), n: k.shanten })
    case 'k_suji': {
      const ends = (k.tiles as string[]) ?? []
      return t('know.k_suji', { opp: opp(Number(k.seat)), ends: ends.length ? t('know.k_suji_ends', { tiles: tiles(ends) }) : '' })
    }
    case 'k_no_chance':
    case 'k_one_chance': return t(`know.${k.code}`, { tiles: tiles(k.tiles) })
    case 'k_multi_wait': return t('know.k_multi_wait', { waits: tiles(k.waits), n: k.left })
    case 'k_riichi_ev':
    case 'k_ev_close':
    case 'k_dama_ev': return t(`know.${k.code}`, { d: fmt(Number(k.diff)), a: fmt(Number(k.dama)), b: fmt(Number(k.riichi)) })
    case 'k_not_max': return t('know.k_not_max', { best: tileName(t, String(k.best)), bn: k.best_total, tile: tileName(t, String(k.tile)), n: k.total })
    default: return t(`know.${k.code}`, { defaultValue: '' })
  }
}
