/**
 * 信息层的“爽点”事件：比较前后两个快照，找出值得庆祝 / 警告的瞬间。纯函数，便于测试。
 * 第一次拿到快照（刚打开、刚进局）不产生事件，只有“变化”才算。
 */
import type { RecommendationMsg, StateMsg } from '@shared/protocol'
import type { Judgement, PracticeStats } from '../coach'
import { oppSafety, placement } from '../coach'

export type FxEvent =
  | { k: 'tenpai'; waits: Array<{ tile: string; left: number }> }
  | { k: 'agree'; tile: string; streak: number }
  | { k: 'miss'; want: string; actual: string; qLoss: number | null }
  | { k: 'riichi'; seat: number; safe: string | null; why: string | null }
  | { k: 'rank'; from: number; to: number }

export interface FxSnap {
  game: string
  round: string
  tenpai: boolean
  waits: Array<{ tile: string; left: number }>
  judgeKey: string | null
  judge: Judgement | null
  streak: number
  riichi: number[]
  rank: number
  self: number
}

export function snapOf(state: StateMsg, rec: RecommendationMsg | null, judge: Judgement | null, stats: PracticeStats): FxSnap {
  const r = state.round
  const fresh = !!rec && rec.revision === state.revision
  const g = fresh ? rec?.insight?.groups : state.analysis?.groups ?? rec?.insight?.groups
  // 听牌：手里 13 张时看当前待牌；14 张时看推荐那一手打完之后
  const wait = state.analysis?.wait
  const tenpai = wait ? wait.shanten === 0 : g?.shanten === 0
  const waits = wait && wait.shanten === 0 ? wait.waits : g?.shanten === 0 ? g.ukeire : []
  return {
    game: state.game_uuid ?? '',
    round: `${r.bakaze}${r.kyoku}-${r.honba}`,
    tenpai: !!tenpai,
    waits,
    judgeKey: judge ? `${judge.revision}:${judge.actual}:${judge.actualRiichi}` : null,
    judge,
    streak: stats.streak ?? 0,
    riichi: [...state.riichi],
    rank: placement(state).rank,
    self: state.self_seat ?? 0
  }
}

/** state 用于给立直事件算“对他最安全的牌”。 */
export function detectFx(prev: FxSnap | null, next: FxSnap, state: StateMsg): FxEvent[] {
  if (!prev || prev.game !== next.game) return []
  const out: FxEvent[] = []
  const sameRound = prev.round === next.round
  if (next.judgeKey && next.judgeKey !== prev.judgeKey && next.judge) {
    const j = next.judge
    out.push(j.agree ? { k: 'agree', tile: j.actual, streak: next.streak } : { k: 'miss', want: j.want, actual: j.actual, qLoss: j.qLoss })
  }
  if (sameRound) {
    for (const seat of next.riichi) {
      if (seat === next.self || prev.riichi.includes(seat)) continue
      const safe = oppSafety(state, seat)[0]
      out.push({ k: 'riichi', seat, safe: safe?.tile ?? null, why: safe?.why ?? null })
    }
    if (next.tenpai && !prev.tenpai && next.waits.length > 0) out.push({ k: 'tenpai', waits: next.waits })
  }
  if (next.rank !== prev.rank && !sameRound) out.push({ k: 'rank', from: prev.rank, to: next.rank })
  return out
}
