/** Electron <-> Python Core 的 NDJSON 消息类型（手写；与 core/tests/fixtures/ipc 的 JSON 共用契约测试）。 */

export const PROTOCOL_VERSION = 1

export type Mode = 'off' | 'assist' | 'auto'
export type Phase = 'lobby' | 'in_game' | 'unsupported_mode' | 'desynced'

// ---------------------------------------------------------------- Electron -> Core
export type CoreCommand =
  | { t: 'hello'; protocolVersion: number }
  | { t: 'ws.open'; conn: string; url: string }
  | { t: 'ws.close'; conn: string }
  | { t: 'frame'; conn: string; dir: 'in' | 'out'; time?: number; b64: string }
  | { t: 'mode.set'; mode: Mode }
  | { t: 'auto.pause'; reason: string }
  | { t: 'auto.resume' }
  | { t: 'model.activate'; path: string; device?: 'cpu' | 'mps' | 'cuda' }
  | { t: 'action.begin'; actionId: string }
  | { t: 'action.result'; actionId: string; ok: boolean; error?: string }
  | { t: 'config'; records_dir: string; records_enabled: boolean; style?: boolean | { dice: boolean; gamble: boolean; arb: boolean } }
  | { t: 'review.list' }
  | { t: 'stats.get' }
  | { t: 'review.get'; file: string }
  | { t: 'shutdown' }

// ---------------------------------------------------------------- Core -> Electron
export interface Meld { type: 'chi' | 'pon' | 'daiminkan' | 'ankan' | 'kakan'; tiles: string[]; from: number | null }
export interface RiverTile { tile: string; tsumogiri: boolean; riichi: boolean; called: boolean; seq?: number }

/** 防守分析（只做展示）：risk 为综合放铳率 %，tier 0..4 对应 --risk-0…4 */
export interface Analysis {
  threat: Array<{ seat: number; threat: number; label: string }>
  risk: Record<string, { risk: number; tier: 0 | 1 | 2 | 3 | 4; why?: string; vs?: number }>
  /** 全部 34 种牌的综合放铳率与场上余张 */
  heat?: Array<{ tile: string; risk: number; tier: 0 | 1 | 2 | 3 | 4; left: number }>
  /** 没有摸牌时的向听与待牌（听牌才有 waits） */
  wait?: { shanten: number; waits: Array<{ tile: string; left: number }> } | null
  furiten?: boolean
  turn?: number
  /** 没有摸牌时的当前手牌分组 */
  groups?: GroupView | null
}

export interface StateMsg {
  t: 'state'
  revision: number
  phase: Phase
  desync_reason: string
  self_seat: number | null
  game_uuid: string
  round: { bakaze: string; kyoku: number; honba: number; kyotaku: number; oya: number; left: number | null; dora_markers: string[]; active: boolean }
  scores: number[]
  hand: string[]
  drawn: string | null
  melds: Meld[][]
  rivers: RiverTile[][]
  riichi: number[]
  analysis?: Analysis | null
}

export type RecKind = 'discard' | 'riichi' | 'chi' | 'pon' | 'daiminkan' | 'ankan' | 'kakan' | 'tsumo' | 'ron' | 'kyuushu' | 'pass'

export interface Alt { id: string; kind: string; p: number; q: number; tile?: string }

export interface RecommendationMsg {
  t: 'recommendation'
  revision: number
  clear?: boolean
  kind?: RecKind | null
  tile?: string | null
  consumed?: string[]
  confidence?: number | null
  alts?: Alt[]
  latency_ms?: number
  shanten?: number | null
  ctx?: string
  riichi_tile?: string | null
  reject?: string | null
  steps?: ClickStep[]
  /** 按把握度算出的总思考时间（旧原型 think_seconds） */
  think_ms?: number
  insight?: RecInsight
  /** 教学提示：结构化的“为什么”，由界面按语言渲染 */
  tips?: Tip[]
  /** 打牌风格改过这一手：掷骰（估值接近的备选）或爱赌（役满路线）。model / pick 是候选 id */
  style?: StyleInfo
  /** 知识点：这一手相关的规则 / 常识（结构化代码，界面按语言渲染） */
  knowledge?: Tip[]
  /** Mortal 原始动作（不含 meta） */
  mjai?: { type?: string; tsumogiri?: boolean; pai?: string }
}

export interface Tip { code: string; [k: string]: unknown }

/** 打牌风格改过这一手：掷骰 / 爱赌（役满路线）/ 算法改判（软改判、硬否决、终局见逃）。model / pick 是候选 id */
export interface StyleInfo {
  kind: 'dice' | 'gamble' | 'arb'
  model: string | null
  pick: string
  rank?: number
  route?: string
  need?: number
  arb?: 'soft' | 'hard' | 'veto'
  gain?: number
  points?: number
  via?: 'dice' | 'gamble'
  model_opt?: CandValue
  pick_opt?: CandValue
}

/** 手牌分组：顺子/刻子 = 已成；雀头；搭子（两面/嵌张/边张/对子）带待牌与余张；孤张 */
export type GroupKind = 'run' | 'triplet' | 'head' | 'ryanmen' | 'kanchan' | 'penchan' | 'pair' | 'isolated'
export interface HandGroup { kind: GroupKind; tiles: string[]; waits: Array<{ tile: string; left: number }> }
export interface GroupView {
  shanten: number
  form: 'regular' | 'chiitoi' | 'kokushi'
  groups: HandGroup[]
  total: number
  ukeire: Array<{ tile: string; left: number }>
  /** 如果这是“打出某张之后”的分组，这里是那张牌 */
  discard?: string
  /** 听牌时每张待牌的打点（荣和 / 自摸 / 立直后荣和；null = 无役） */
  values?: WaitValue[]
}

/** 一种和法的打点：yaku 为 [役 id, 番]（id 见 mahjong 库，界面按 i18n yaku.<id> 显示） */
export interface HandValue { han: number; fu: number; points: number; level: string; yaku: Array<[number, number]>; pay?: number[] }
export interface WaitValue { tile: string; left: number; ron: HandValue | null; tsumo: HandValue | null; riichi_ron: HandValue | null; riichi_tsumo?: HandValue | null }

/** 默听 / 立直的一种打法：和牌率、平均打点、期望值（点） */
export interface AttackPlan { win_rate: number; avg: number; ev: number; yakuless: boolean; left: number; tsumo_share: number; pot: number; stick_cost: number }
export type RiichiWarn = { code: 'zero_points' } | { code: 'low_points'; left: number } | { code: 'last_draws'; n: number } | { code: 'chase'; n: number }
export interface Attack {
  dama: AttackPlan
  riichi?: AttackPlan
  no_riichi?: 'no_points' | 'no_draw' | 'four_riichi'
  riichi_warn: RiichiWarn[]
  mode: 'dama' | 'riichi' | 'open'
  furiten: boolean
  unseen: number
  draws: number
}
/** 押引红绿条：和牌收益（期望值） vs 放铳损失（Σ 对手放铳率 × 估计打点） */
/** 押引：gain 和牌收益（听牌 = 期望值；未听牌 = 按向听与进张估，est=true），loss 放铳损失 */
export interface Balance { gain: number; loss: number; tile: string; shanten: number; est?: boolean; parts: Array<{ seat: number; p: number; val: number }> }
/** 候选的 进攻价值 / 放铳损失 / 总价值（与算法改判同一口径） */
export interface CandValue { kind: 'dahai' | 'reach'; tile: string; p: number; value: number; attack: number; loss: number; shanten: number; total: number; win_rate?: number; avg?: number }

export interface UkeireTile { tile: string; left: number }
export interface DiscardOption { shanten: number; total: number; ukeire: UkeireTile[] }
export type Advice = 'push' | 'balance' | 'fold'
export interface RecInsight {
  options: Record<string, DiscardOption>
  verdict: { advice: Advice; risk: number; max_threat: number } | null
  focus_risk: number | null
  groups?: GroupView | null
  attack?: Attack
  balance?: Balance
  values?: CandValue[]
}

export type ClickStep =
  | { t: 'hand'; index: number; gap: boolean }
  | { t: 'button'; slot: number }
  | { t: 'candidate'; index: number; count: number; kan: boolean }

export interface IntentMsg {
  t: 'intent'
  actionId: string
  revision: number
  kind: RecKind
  op_type: number
  tile: string | null
  consumed: string[]
  steps: ClickStep[]
  idempotent: boolean
  ttl_ms: number
  operation_list: number[]
  /** 还要等多久才点击（思考时间 − 已经过去的时间） */
  delay_ms?: number
}

export type IntentStatus = 'confirmed' | 'manual' | 'stale' | 'desync' | 'mode' | 'retry' | 'unconfirmed' | 'click_failed' | 'mismatch'

export type CoreMessage =
  | { t: 'ready'; protocolVersion: number; coreVersion: string }
  | StateMsg
  | RecommendationMsg
  | IntentMsg
  | { t: 'intent.status'; actionId: string; status: IntentStatus }
  | { t: 'session.status'; phase: Phase; reason: string; mode: Mode; paused: string | null; model: 'ready' | 'none' }
  | { t: 'model.status'; state: 'ready' | 'none' | 'error'; path?: string; device?: string; pending?: boolean }
  | { t: 'review.list'; games: ReviewGame[] }
  | ({ t: 'stats' } & StatsData)
  | ({ t: 'review.game' } & ReviewDetail)
  | { t: 'game.end'; rank: number | null }
  | { t: 'lobby.match'; match_sid: string }
  | { t: 'lobby.matched'; mode_id: number | null }
  | { t: 'error'; code: string; message: string; hint: string }
  | { t: 'log'; code: string; [k: string]: unknown }

// ---------------------------------------------------------------- 复盘 / 模型
export interface ReviewGame { file: string; uuid: string | null; started: number | null; decisions: number; agree: number; agree_rate: number | null; total_q_loss: number }
export interface ReviewItem { rev: number; kind: string; tile: string | null; confidence: number | null; actual: string | null; agree: boolean; q_loss: number | null; latency_ms: number | null }
export interface ReviewDetail extends ReviewGame { top_mistakes: ReviewItem[]; items: ReviewItem[] }

export interface ModelEntry { sha256: string; name: string; size: number; tag: string; version: number; imported_at: number }
export type ModelProgress = { step: 'copy' | 'verify' | 'load'; ok: boolean } | { error: string; code: string } | { done: ModelEntry }

export interface StatsData {
  games: number
  avg_rank: number | null
  win_rate: number | null
  deal_in_rate: number | null
  agree_rate: number | null
  trend: { agree: Array<number | null>; rank: Array<number | null> }
  dist: { riichi: number | null; call: number | null; win: number | null }
}
