import type { Mode, Phase, RecommendationMsg, StateMsg } from '@shared/protocol'
import type { Judgement, PracticeStats } from '@renderer/hud/coach'

export type ExecStatus =
  | { s: 'idle' }
  | { s: 'thinking' }
  | { s: 'scheduled'; delayMs: number }
  | { s: 'executing' }
  | { s: 'confirmed' }
  | { s: 'paused'; reason: string }
  | { s: 'failed'; reason: string }

export interface TimelineEntry {
  id: number
  revision: number
  kind: string
  tile: string | null
  confidence: number | null
  latencyMs: number
  actual?: string | null   // 你实际打出的牌（仅打牌）
  agree?: boolean
  executed?: boolean
}

export type ViewState = 'disconnected' | 'lobby' | 'sanma' | 'desynced' | 'no-model' | 'model-error' | 'core-down' | 'game'

export interface MatchData {
  state: StateMsg | null
  rec: RecommendationMsg | null
  timeline: TimelineEntry[]
  exec: ExecStatus
  /** 你上一手打牌与 AI 推荐的对比（打牌/立直才有） */
  judge?: Judgement | null
  /** 本局累计：一致率、q 损失、最大的几个失误 */
  practice?: PracticeStats
}

export interface SessionData {
  coreState: string
  phase: Phase
  reason: string
  mode: Mode
  paused: string | null
  model: 'ready' | 'none' | 'error'
  modelName: string
  modelError: string
  connected: boolean
  frames: number
  decisions: number
  /** 自动匹配状态（主进程推送）：off / idle / ending / joining / waiting / stuck */
  automatch?: string
  automatchDetail?: string
}
