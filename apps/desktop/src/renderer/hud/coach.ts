/**
 * 教练面板的纯计算（无 React、无 i18n），全部只用 Core 已经给出的 state / recommendation：
 *  - judgeDiscard：练习模式里“你打的 vs AI 推荐”的判定与 q 损失
 *  - placement：顺位、与上下家的点差、升位需要多少点（魂天的核心是顺位意识）
 *  - oppSafety：对某一家来说，你手里哪些牌是现物 / 筋 / 字牌见过几张
 *  - optionRows：教练卡里的候选对比表
 */
import type { Alt, RecommendationMsg, StateMsg } from '@shared/protocol'

/** 去掉赤五标记：5mr -> 5m */
export const plain = (t: string): string => (t.length === 3 && t.endsWith('r') ? t.slice(0, 2) : t)
export const sameTile = (a: string, b: string): boolean => plain(a) === plain(b)

// ------------------------------------------------------------------ 练习模式判定
export interface Judgement {
  /** 推荐所在的 revision */
  revision: number
  /** AI 推荐打的牌（立直时为宣言牌） */
  want: string
  wantRiichi: boolean
  /** 你实际打的牌 */
  actual: string
  actualRiichi: boolean
  agree: boolean
  /** AI 给你这一手的概率（0..1）；找不到对应候选时为 null */
  pActual: number | null
  /** q(推荐) − q(你的选择)，≥ 0；找不到对应候选时为 null */
  qLoss: number | null
}

/** 推荐是打牌 / 立直时，用你实际打出的牌（及是否立直）判定一致与 q 损失；其他动作返回 null。 */
export function judgeDiscard(rec: RecommendationMsg | null, actual: string, actualRiichi: boolean): Judgement | null {
  if (!rec || (rec.kind !== 'discard' && rec.kind !== 'riichi')) return null
  const wantRiichi = rec.kind === 'riichi'
  const want = (wantRiichi ? rec.riichi_tile : rec.tile) ?? null
  if (!want) return null
  const alts = rec.alts ?? []
  const find = (pred: (a: Alt) => boolean): Alt | undefined => alts.find(pred)
  // 先精确匹配（赤五与普通五在模型里是两个动作），找不到再忽略赤
  const discardAlt = find((a) => a.kind === 'discard' && a.tile === actual) ?? find((a) => a.kind === 'discard' && !!a.tile && sameTile(a.tile, actual))
  const mine = actualRiichi ? find((a) => a.kind === 'riichi') ?? discardAlt : discardAlt
  const top = alts[0]
  const agree = sameTile(want, actual) && wantRiichi === actualRiichi
  const qLoss = agree ? 0 : top && mine ? Math.max(0, Math.round((top.q - mine.q) * 1000) / 1000) : null
  return { revision: rec.revision, want, wantRiichi, actual, actualRiichi, agree, pActual: mine ? mine.p : null, qLoss }
}

export interface PracticeStats {
  judged: number; agree: number; lossSum: number; mistakes: Judgement[]
  /** 当前连续与 AI 一致的手数（不一致清零）、本局最高连击 */
  streak?: number; bestStreak?: number
}
export const EMPTY_PRACTICE: PracticeStats = { judged: 0, agree: 0, lossSum: 0, mistakes: [], streak: 0, bestStreak: 0 }

/** 把一次判定累计进本局统计；失误按 q 损失从大到小只留前 5 个。 */
export function addJudgement(s: PracticeStats, j: Judgement): PracticeStats {
  const mistakes = j.agree ? s.mistakes : [...s.mistakes, j].sort((a, b) => (b.qLoss ?? 0) - (a.qLoss ?? 0)).slice(0, 5)
  const streak = j.agree ? (s.streak ?? 0) + 1 : 0
  return {
    judged: s.judged + 1, agree: s.agree + (j.agree ? 1 : 0), lossSum: Math.round((s.lossSum + (j.qLoss ?? 0)) * 1000) / 1000, mistakes,
    streak, bestStreak: Math.max(s.bestStreak ?? 0, streak)
  }
}

// ------------------------------------------------------------------ 顺位
/** 普通家 / 庄家荣和的典型打点阶梯（点），用来把“差多少点”翻译成“需要多大的牌” */
const NON_DEALER = [1000, 2000, 3900, 8000, 12000, 16000, 24000, 32000]
const DEALER = [1500, 2900, 5800, 12000, 18000, 24000, 36000, 48000]
export const HAND_TIERS = ['1han', '2han', '3han', 'mangan', 'haneman', 'baiman', 'sanbaiman', 'yakuman'] as const
export type HandTier = (typeof HAND_TIERS)[number] | 'impossible'

/** 荣和至少要多少点（不含本场/供托）才能拿到 need 点：返回对应的牌型档次 */
export function tierFor(need: number, dealer: boolean): HandTier {
  const ladder = dealer ? DEALER : NON_DEALER
  const i = ladder.findIndex((v) => v >= need)
  return i < 0 ? 'impossible' : HAND_TIERS[i]!
}

export interface Placement {
  /** 1..4 */
  rank: number
  /** 每个座位的名次（下标 = seat） */
  ranks: number[]
  /** 与上一名的差（正数，追上需要的点数）；第一名为 null */
  toAbove: number | null
  aboveSeat: number | null
  /** 领先下一名多少；最后一名为 null */
  overBelow: number | null
  belowSeat: number | null
  /** 超过上一名所需：别家放铳 / 自摸时的和牌打点、直击上一名时的打点（已扣除本场与供托） */
  needOther: number | null
  needDirect: number | null
  tierOther: HandTier | null
  tierDirect: HandTier | null
  /** 是否已到最后一局（南4 及以后） */
  allLast: boolean
}

/** 顺位：同分时按起家顺序（座位号小的在前，雀魂规则）。 */
export function placement(state: StateMsg): Placement {
  const self = state.self_seat ?? 0
  const order = [0, 1, 2, 3].sort((a, b) => (state.scores[b] ?? 0) - (state.scores[a] ?? 0) || a - b)
  const ranks = [0, 0, 0, 0]
  order.forEach((seat, i) => { ranks[seat] = i + 1 })
  const rank = ranks[self]!
  const my = state.scores[self] ?? 0
  const aboveSeat = rank > 1 ? order[rank - 2]! : null
  const belowSeat = rank < 4 ? order[rank]! : null
  const toAbove = aboveSeat === null ? null : (state.scores[aboveSeat] ?? 0) - my
  const overBelow = belowSeat === null ? null : my - (state.scores[belowSeat] ?? 0)
  const bonus = state.round.honba * 300 + state.round.kyotaku * 1000
  const dealer = state.round.oya === self
  let needOther: number | null = null
  let needDirect: number | null = null
  if (toAbove !== null && aboveSeat !== null) {
    // 同分时座位号小的在前：自己座位号更大时需要严格超过
    const gap = toAbove + (self > aboveSeat ? 1 : 0)
    needOther = Math.max(0, gap - bonus)
    // 直击：对方付出的点同时让差距缩小两次；本场费同样计两次，供托只算一次
    needDirect = Math.max(0, Math.ceil((gap - state.round.kyotaku * 1000) / 2) - state.round.honba * 300)
  }
  const r = state.round
  const allLast = (r.bakaze === 'S' && r.kyoku === 4) || r.bakaze === 'W' || r.bakaze === 'N'
  return {
    rank, ranks, toAbove, aboveSeat, overBelow, belowSeat, needOther, needDirect,
    tierOther: needOther === null ? null : needOther === 0 ? '1han' : tierFor(needOther, dealer),
    tierDirect: needDirect === null ? null : needDirect === 0 ? '1han' : tierFor(needDirect, dealer),
    allLast
  }
}

/** 顺位策略提示的代码：由界面翻译 */
export type PlaceAdvice = 'lead_safe' | 'last_must_win' | 'avoid_fourth' | 'chase' | null
export function placeAdvice(p: Placement): PlaceAdvice {
  if (!p.allLast) return p.rank === 4 && p.toAbove !== null && p.toAbove > 8000 ? 'avoid_fourth' : null
  if (p.rank === 1) return 'lead_safe'
  if (p.rank === 4) return 'last_must_win'
  if (p.overBelow !== null && p.overBelow < 4000) return 'avoid_fourth'
  return 'chase'
}

// ------------------------------------------------------------------ 对某一家的安全牌
export type SafeWhy = 'genbutsu' | 'suji' | 'half_suji' | 'honor_seen'
export interface SafeTile { tile: string; why: SafeWhy; /** 筋的依据：他打过的那张；字牌：已见张数 */ basis?: string; seen?: number }

const SUITS = 'mps'
function visibleCounts(state: StateMsg): Map<string, number> {
  const m = new Map<string, number>()
  const add = (t: string): void => { m.set(plain(t), (m.get(plain(t)) ?? 0) + 1) }
  state.rivers.forEach((rv) => rv.forEach((x) => { if (!x.called) add(x.tile) }))
  state.melds.forEach((ms) => ms.forEach((md) => md.tiles.forEach(add)))
  state.round.dora_markers.forEach(add)
  return m
}

/**
 * 对 seat 这一家：你手里（含摸到的牌）哪些牌安全、为什么。按安全程度排序：现物 > 筋 > 见过 ≥2 张的字牌 > 单筋。
 * 只是教学用的简化规则（不考虑立直后他家打出的同巡现物、壁等）。
 */
export function oppSafety(state: StateMsg, seat: number): SafeTile[] {
  const river = new Set((state.rivers[seat] ?? []).map((x) => plain(x.tile)))
  const seen = visibleCounts(state)
  const hand = [...state.hand, ...(state.drawn ? [state.drawn] : [])]
  const out: SafeTile[] = []
  const done = new Set<string>()
  for (const raw of hand) {
    const t = plain(raw)
    if (done.has(t)) continue
    done.add(t)
    if (river.has(t)) { out.push({ tile: raw, why: 'genbutsu' }); continue }
    if (t.length === 1) {
      const n = seen.get(t) ?? 0
      if (n >= 2) out.push({ tile: raw, why: 'honor_seen', seen: n })
      continue
    }
    const n = Number(t[0]); const s = t[1]!
    if (!SUITS.includes(s)) continue
    const lo = n > 3 ? `${n - 3}${s}` : null
    const hi = n < 7 ? `${n + 3}${s}` : null
    const sides = [lo, hi].filter((x): x is string => !!x)
    const hit = sides.filter((x) => river.has(x))
    if (hit.length === sides.length) out.push({ tile: raw, why: 'suji', basis: hit[0] })
    else if (hit.length > 0) out.push({ tile: raw, why: 'half_suji', basis: hit[0] })
  }
  const order: Record<SafeWhy, number> = { genbutsu: 0, suji: 1, honor_seen: 2, half_suji: 3 }
  return out.sort((a, b) => order[a.why] - order[b.why])
}

/** 立直宣言在第几巡（牌河里第几张，1 起）；没立直返回 null */
export function riichiTurn(state: StateMsg, seat: number): number | null {
  const i = (state.rivers[seat] ?? []).findIndex((x) => x.riichi)
  return i < 0 ? null : i + 1
}

export type ThreatLevel = 'high' | 'mid' | 'low'
export const threatLevel = (v: number): ThreatLevel => (v >= 0.75 ? 'high' : v >= 0.4 ? 'mid' : 'low')

// ------------------------------------------------------------------ 候选对比
export interface OptionRow {
  id: string
  kind: string
  tile: string | null
  /** 模型概率 0..1 */
  p: number
  shanten: number | null
  total: number | null
  /** 打这张的放铳率（%） */
  risk: number | null
  /** 这一列里最好的值（用于高亮） */
  best: { shanten: boolean; total: boolean; risk: boolean }
}

/** 教练卡里的候选对比表：前 max 个候选，附向听 / 进张 / 放铳，并标出每列最佳。 */
export function optionRows(rec: RecommendationMsg | null, state: StateMsg, max: number): OptionRow[] {
  const opts = rec?.insight?.options ?? {}
  const risk = state.analysis?.risk ?? {}
  const rows = (rec?.alts ?? []).slice(0, max).map((a): OptionRow => {
    const o = a.tile ? opts[a.tile] : undefined
    const r = a.tile ? risk[a.tile] ?? risk[plain(a.tile)] : undefined
    return { id: a.id, kind: a.kind, tile: a.tile ?? null, p: a.p, shanten: o?.shanten ?? null, total: o?.total ?? null, risk: r?.risk ?? null, best: { shanten: false, total: false, risk: false } }
  })
  const pick = <K extends 'shanten' | 'total' | 'risk'>(k: K, better: (a: number, b: number) => boolean): void => {
    const vals = rows.map((r) => r[k]).filter((v): v is number => v !== null)
    if (vals.length < 2) return
    const best = vals.reduce((a, b) => (better(b, a) ? b : a))
    if (vals.every((v) => v === best)) return
    rows.forEach((r) => { if (r[k] === best) r.best[k] = true })
  }
  // 进张只在同向听里比较才有意义：只比最低向听的那几行
  pick('shanten', (a, b) => a < b)
  const minSh = Math.min(...rows.map((r) => r.shanten ?? 99))
  const same = rows.filter((r) => r.shanten === minSh && r.total !== null)
  if (same.length >= 2) {
    const mx = Math.max(...same.map((r) => r.total!))
    if (!same.every((r) => r.total === mx)) same.forEach((r) => { if (r.total === mx) r.best.total = true })
  }
  pick('risk', (a, b) => a < b)
  return rows
}
