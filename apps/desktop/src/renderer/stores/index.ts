import type { Lang } from '@shared/lang'
import { create } from 'zustand'
import type { CoreMessage, Mode, ModelEntry, ReviewDetail, ReviewGame, StatsData } from '@shared/protocol'
import { addJudgement, EMPTY_PRACTICE, judgeDiscard } from '@renderer/hud/coach'
import type { ExecStatus, MatchData, SessionData, TimelineEntry, ViewState } from './types'

export interface Settings {
  theme: 'dark' | 'light' | 'system'
  autoDelayMs: number
  /** 掷骰 + 爱赌；关闭 = 完全按模型第一名 */
  playStyle: boolean
  styleParts: { dice: boolean; gamble: boolean; arb: boolean }
  showRisk: boolean
  candidateCount: 1 | 2 | 3
  tileMax: number
  recordsEnabled: boolean
  language: Lang
  firstRunDone: boolean
  overlayEnabled: boolean
  collapsedCards: string[]
  hudScale: number
  hudSide: 'both' | 'left' | 'right'
  hudTeach: boolean
  hudReserve: boolean
  hudDock: 'split' | 'bottom'
  hudBars: boolean
  hudPractice: boolean
  autoMatch: boolean
  sidebar: { width: number; collapsed: boolean }
}

export const useSettings = create<Settings & { patch: (p: Partial<Settings>) => void }>((set) => ({
  theme: 'dark', autoDelayMs: 800, playStyle: true, styleParts: { dice: true, gamble: true, arb: true }, showRisk: true, candidateCount: 3, tileMax: 32, recordsEnabled: true, language: 'zh-CN', firstRunDone: true, overlayEnabled: true, collapsedCards: ['map'], hudScale: 1, hudSide: 'both', hudTeach: true, hudReserve: true, hudDock: 'split', hudBars: true, hudPractice: false, autoMatch: false,
  sidebar: { width: 400, collapsed: false },
  patch: (p) => set(p)
}))

/** 修改设置：本地立即生效，并（在真实应用里）持久化到数据根的 settings.json。 */
export function updateSettings(p: Partial<Settings>): void {
  useSettings.getState().patch(p)
  void window.soul?.patchSettings(p)
}

export interface ModelsData {
  list: ModelEntry[]
  active: string | null
  steps: Record<string, 'pending' | 'running' | 'ok'>
  importing: boolean
  error: string
  pending: boolean
}
export const useModels = create<ModelsData & { set: (p: Partial<ModelsData>) => void }>((set) => ({
  list: [], active: null, steps: {}, importing: false, error: '', pending: false, set: (p) => set(p)
}))

export const useStats = create<{ data: StatsData | null; set: (p: { data: StatsData | null }) => void }>((set) => ({ data: null, set: (p) => set(p) }))

export const useReview = create<{ games: ReviewGame[]; detail: ReviewDetail | null; set: (p: { games?: ReviewGame[]; detail?: ReviewDetail | null }) => void }>((set) => ({
  games: [], detail: null, set: (p) => set(p as never)
}))

const initialSession: SessionData = {
  coreState: 'starting', phase: 'lobby', reason: '', mode: 'off', paused: null, model: 'none',
  modelName: '', modelError: '', connected: false, frames: 0, decisions: 0
}
export const useSession = create<SessionData & { set: (p: Partial<SessionData>) => void }>((set) => ({ ...initialSession, set: (p) => set(p) }))

export const useMatch = create<MatchData & { set: (p: Partial<MatchData>) => void }>((set) => ({
  state: null, rec: null, timeline: [], exec: { s: 'idle' }, judge: null, practice: EMPTY_PRACTICE, set: (p) => set(p)
}))

export interface ToastItem { id: number; text: string }
let toastId = 1
export const useToasts = create<{ items: ToastItem[]; push: (text: string) => void; dismiss: (id: number) => void }>((set, get) => ({
  items: [],
  push: (text) => {
    const id = toastId++
    set({ items: [...get().items, { id, text }].slice(-2) })   // 最多同时 2 条
    setTimeout(() => get().dismiss(id), 4000)
  },
  dismiss: (id) => set({ items: get().items.filter((t) => t.id !== id) })
}))

let timelineSeq = 1

/** 把 Core 消息归并进各个 store（纯 reducer，便于测试）。 */
export function applyCoreMessage(msg: CoreMessage, autoDelayMs = 800): void {
  const session = useSession.getState()
  const match = useMatch.getState()
  switch (msg.t) {
    case 'state': {
      const prev = match.state
      let timeline = match.timeline
      // 换了一局（新的 game_uuid）：本局练习统计清零
      const newGame = !prev || prev.game_uuid !== msg.game_uuid
      let practice = newGame ? EMPTY_PRACTICE : match.practice ?? EMPTY_PRACTICE
      let judge = newGame ? null : match.judge ?? null
      // 根据自家牌河增长，回填“你实际打出的牌”与是否与推荐一致
      if (prev && !newGame && msg.self_seat !== null) {
        const before = prev.rivers[msg.self_seat]?.length ?? 0
        const riv = msg.rivers[msg.self_seat] ?? []
        if (riv.length === before + 1) {
          const last = riv[riv.length - 1]!
          const actual = last.tile
          const idx = timeline.findIndex((e) => e.kind === 'discard' && e.actual === undefined)
          if (idx >= 0) {
            timeline = timeline.map((e, i) => (i === idx ? { ...e, actual, agree: e.tile === actual } : e))
          }
          const j = judgeDiscard(match.rec, actual, last.riichi)
          if (j) { judge = j; practice = addJudgement(practice, j) }
        }
      }
      const exec: ExecStatus = match.exec.s === 'confirmed' ? { s: 'idle' } : match.exec
      useMatch.setState({ state: msg, timeline, exec, judge, practice })
      useSession.setState({ connected: true, phase: msg.phase, reason: msg.desync_reason })
      break
    }
    case 'recommendation': {
      if (msg.clear || !msg.kind) { useMatch.setState({ rec: null, exec: { s: 'idle' } }); break }
      const entry: TimelineEntry = {
        id: timelineSeq++, revision: msg.revision, kind: msg.kind, tile: msg.tile ?? msg.riichi_tile ?? null,
        confidence: msg.confidence ?? null, latencyMs: msg.latency_ms ?? 0
      }
      const timeline = [entry, ...match.timeline].slice(0, 12)
      // 自动模式被暂停时继续显示“已暂停”，不要被新推荐盖成“等待你操作”
      const exec: ExecStatus = session.mode === 'auto' && session.paused ? { s: 'paused', reason: session.paused } : { s: 'idle' }
      useMatch.setState({ rec: msg, timeline, exec })
      useSession.setState({ decisions: session.decisions + 1 })
      break
    }
    case 'intent':
      useMatch.setState({ exec: { s: 'scheduled', delayMs: msg.delay_ms ?? autoDelayMs } })
      break
    case 'intent.status': {
      const st = msg.status
      if (st === 'confirmed') {
        useMatch.setState({
          exec: { s: 'confirmed' },
          timeline: match.timeline.map((e, i) => (i === 0 ? { ...e, executed: true } : e))
        })
      } else if (st === 'retry') useMatch.setState({ exec: { s: 'scheduled', delayMs: autoDelayMs } })
      else if (st === 'unconfirmed' || st === 'mismatch') useMatch.setState({ exec: { s: 'paused', reason: st } })
      else if (st === 'click_failed') useMatch.setState({ exec: { s: 'failed', reason: st } })
      else useMatch.setState({ exec: { s: 'idle' } })
      break
    }
    case 'session.status':
      useSession.setState({
        phase: msg.phase, reason: msg.reason, mode: msg.mode, paused: msg.paused,
        model: msg.model === 'ready' ? 'ready' : session.model === 'error' ? 'error' : 'none'
      })
      if (msg.paused) useMatch.setState({ exec: { s: 'paused', reason: msg.paused } })
      else if (match.exec.s === 'paused') useMatch.setState({ exec: { s: 'idle' } })
      break
    case 'model.status':
      useSession.setState({
        model: msg.state,
        modelName: msg.path ? msg.path.split(/[\\/]/).pop()!.replace(/\.pth$/, '') : session.modelName
      })
      useModels.setState({ pending: !!msg.pending })
      break
    case 'review.list':
      useReview.setState({ games: msg.games })
      break
    case 'stats':
      useStats.setState({ data: msg })
      break
    case 'review.game':
      useReview.setState({ detail: msg })
      break
    case 'error':
      if (msg.code === 'model_load') useSession.setState({ model: 'error', modelError: msg.code })
      break
    default:
      break
  }
}

/** 侧栏该显示哪种视图（PLAN §8.7 空状态与异常状态表）。 */
export function deriveView(s: SessionData, hasState: boolean): ViewState {
  if (s.coreState === 'failed' || s.coreState === 'restarting') return 'core-down'
  if (s.phase === 'unsupported_mode') return 'sanma'
  if (s.phase === 'desynced') return 'desynced'
  if (s.model === 'error') return 'model-error'
  if (s.phase === 'in_game' && hasState) return s.model === 'none' ? 'no-model' : 'game'
  if (s.phase === 'in_game') return 'game'
  if (s.connected) return 'lobby'
  return 'disconnected'
}

export type { Mode }
