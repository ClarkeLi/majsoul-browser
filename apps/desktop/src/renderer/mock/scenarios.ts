import type { Alt, Analysis, Meld, ModelEntry, StatsData, RecommendationMsg, ReviewDetail, ReviewGame, ReviewItem, RiverTile, StateMsg } from '@shared/protocol'
import type { ExecStatus, MatchData, SessionData, TimelineEntry } from '@renderer/stores/types'
import { POINTS_REC } from './points-rec'

export const SCENARIOS = [
  'discard', 'riichi', 'call-chi', 'auto-executing', 'auto-paused', 'opponent-riichi',
  'empty-disconnected', 'unsupported-3p', 'desynced', 'no-model',
  'models', 'models-importing', 'review', 'review-detail', 'settings', 'stats', 'wizard', 'tenpai', 'all-last', 'melds', 'points'
] as const
export type Scenario = (typeof SCENARIOS)[number]

const r = (tile: string, extra: Partial<RiverTile> = {}): RiverTile => ({ tile, tsumogiri: false, riichi: false, called: false, ...extra })

const NAMES34 = [...Array.from({ length: 9 }, (_, i) => `${i + 1}m`), ...Array.from({ length: 9 }, (_, i) => `${i + 1}p`), ...Array.from({ length: 9 }, (_, i) => `${i + 1}s`), 'E', 'S', 'W', 'N', 'P', 'F', 'C']
const tierOf = (r: number): 0 | 1 | 2 | 3 | 4 => (r === 0 ? 0 : r < 2 ? 1 : r < 5 ? 2 : r < 9 ? 3 : 4)
function mockHeat(scale = 1): NonNullable<Analysis['heat']> {
  return NAMES34.map((tile, i) => {
    const n = i < 27 ? (i % 9) + 1 : 0
    const base = i >= 27 ? 2 : [6, 8, 10, 12, 13, 12, 10, 8, 6][n - 1]!
    const risk = Math.round(base * scale * 10) / 10
    return { tile, risk, tier: tierOf(risk), left: i % 7 === 0 ? 0 : 4 - (i % 3) }
  })
}
function mockAnalysis(over: Partial<Analysis> = {}): Analysis {
  return {
    groups: null,
    threat: [{ seat: 2, threat: 0.12, label: 'closed' }, { seat: 3, threat: 0.2, label: 'melds1' }, { seat: 0, threat: 0.15, label: 'closed' }],
    risk: { '2m': { risk: 0.6, tier: 1 }, '3m': { risk: 0.8, tier: 1 }, '4m': { risk: 1.1, tier: 1 }, '6m': { risk: 0.9, tier: 1 }, '7m': { risk: 0.7, tier: 1 }, '8m': { risk: 0.5, tier: 1 }, '3p': { risk: 0.9, tier: 1 }, '4p': { risk: 1.2, tier: 1 }, '5pr': { risk: 1.4, tier: 1 }, '6p': { risk: 1.1, tier: 1 }, '7p': { risk: 0.9, tier: 1 }, '2s': { risk: 0.7, tier: 1 }, '9s': { risk: 0.2, tier: 1 } },
    heat: mockHeat(0.2), wait: null, furiten: false, turn: 9, ...over
  }
}

function baseState(over: Partial<StateMsg> = {}): StateMsg {
  return {
    t: 'state', revision: 120, phase: 'in_game', desync_reason: '', self_seat: 1, game_uuid: 'mock',
    round: { bakaze: 'E', kyoku: 1, honba: 0, kyotaku: 0, oya: 2, left: 52, dora_markers: ['3p'], active: true },
    scores: [24000, 32000, 27000, 17000],
    hand: ['2m', '3m', '4m', '6m', '7m', '8m', '3p', '4p', '5pr', '6p', '7p', '2s', '2s'],
    drawn: '9s',
    melds: [[], [], [], []],
    rivers: [
      [r('N'), r('9m'), r('4s', { tsumogiri: true }), r('C'), r('1p'), r('7s', { called: true }), r('S')],
      [r('W'), r('1s'), r('9p', { tsumogiri: true }), r('F'), r('1m')],
      [r('E'), r('P'), r('8s'), r('3s', { tsumogiri: true }), r('9m'), r('2p'), r('6s'), r('1p')],
      [r('S'), r('9s'), r('5m'), r('N', { tsumogiri: true }), r('8p'), r('4m')]
    ],
    riichi: [],
    analysis: mockAnalysis(),
    ...over
  }
}

function alts(list: Array<[string, number, number]>): Alt[] {
  return list.map(([tile, p, q]) => ({ id: tile, kind: 'discard', tile, p, q }))
}

function rec(over: Partial<RecommendationMsg> = {}): RecommendationMsg {
  return {
    t: 'recommendation', revision: 120, kind: 'discard', tile: '9s', consumed: [], confidence: 0.87, latency_ms: 142,
    shanten: 0, ctx: 'tsumo', alts: alts([['9s', 0.87, 1.4], ['2s', 0.09, -0.62], ['2m', 0.04, -1.5]]),
    mjai: { type: 'dahai', tsumogiri: true, pai: '9s' }, think_ms: 1850,
    steps: [{ t: 'hand', index: 13, gap: true }],
    tips: [
      { code: 'why_closer', tile: '9s', alt: '2s', a: { shanten: 0, total: 8 }, b: { shanten: 1, total: 34 } },
      { code: 'tenpai', waits: ['2s', '5m', '5p'], total: 8 },
      { code: 'k_pushfold' }
    ],
    insight: {
      options: {
        '9s': { shanten: 0, total: 8, ukeire: [{ tile: '2s', left: 2 }, { tile: '5m', left: 3 }, { tile: '5p', left: 3 }] },
        '2s': { shanten: 1, total: 34, ukeire: [{ tile: '1m', left: 4 }, { tile: '5m', left: 3 }, { tile: '9s', left: 3 }, { tile: '2s', left: 1 }] },
        '2m': { shanten: 1, total: 30, ukeire: [{ tile: '5m', left: 3 }, { tile: '1m', left: 4 }] }
      },
      verdict: { advice: 'push', risk: 0.2, max_threat: 0.2 }, focus_risk: 0.2,
      balance: { gain: 3120, loss: 40, tile: '9s', shanten: 0, parts: [{ seat: 1, p: 0.2, val: 3900 }] },
      values: [
        { kind: 'dahai', tile: '9s', p: 87, value: 3080, attack: 3120, loss: 40, shanten: 0, total: 8, win_rate: 0.41, avg: 6400 },
        { kind: 'dahai', tile: '2s', p: 9, value: 720, attack: 980, loss: 260, shanten: 1, total: 34 },
        { kind: 'dahai', tile: '2m', p: 4, value: 340, attack: 860, loss: 520, shanten: 1, total: 30 }
      ],
      groups: {
        shanten: 0, form: 'regular', total: 7, discard: '9s',
        groups: [
          { kind: 'run', tiles: ['2m', '3m', '4m'], waits: [] }, { kind: 'run', tiles: ['6m', '7m', '8m'], waits: [] },
          { kind: 'run', tiles: ['3p', '4p', '5pr'], waits: [] }, { kind: 'head', tiles: ['2s', '2s'], waits: [] },
          { kind: 'ryanmen', tiles: ['6p', '7p'], waits: [{ tile: '5p', left: 3 }, { tile: '8p', left: 4 }] }
        ],
        ukeire: [{ tile: '8p', left: 4 }, { tile: '5p', left: 3 }]
      }
    },
    ...over
  }
}

const timeline: TimelineEntry[] = [
  { id: 7, revision: 118, kind: 'discard', tile: '5m', confidence: 0.93, latencyMs: 142, actual: '5m', agree: true },
  { id: 6, revision: 112, kind: 'pon', tile: 'E', confidence: 0.81, latencyMs: 118, executed: true },
  { id: 5, revision: 104, kind: 'discard', tile: '1p', confidence: 0.55, latencyMs: 131, actual: '9m', agree: false },
  { id: 4, revision: 98, kind: 'discard', tile: 'N', confidence: 0.99, latencyMs: 96, actual: 'N', agree: true }
]

const session = (over: Partial<SessionData> = {}): SessionData => ({
  coreState: 'running', phase: 'in_game', reason: '', mode: 'assist', paused: null, model: 'ready',
  modelName: 'mortal_s42', modelError: '', connected: true, frames: 1284, decisions: 37, ...over
})

export interface MockBundle {
  session: SessionData
  match: MatchData
  tab?: 'match' | 'review' | 'stats' | 'models' | 'settings'
  models?: Partial<import('@renderer/stores').ModelsData>
  reviews?: { games?: ReviewGame[]; detail?: ReviewDetail | null }
  stats?: StatsData
  firstRun?: boolean
  showRisk?: boolean
}

const mockGames: ReviewGame[] = [
  { file: 'a.jsonl', uuid: 'abc123xyz', started: 1793640000, decisions: 87, agree: 74, agree_rate: 0.85, total_q_loss: 6.2 },
  { file: 'b.jsonl', uuid: 'def456uvw', started: 1793550000, decisions: 79, agree: 61, agree_rate: 0.77, total_q_loss: 11.8 },
  { file: 'c.jsonl', uuid: 'ghi789rst', started: 1793460000, decisions: 92, agree: 80, agree_rate: 0.87, total_q_loss: 5.1 }
]
const mockItem = (rev: number, tile: string, actual: string, agree: boolean, loss: number | null): ReviewItem =>
  ({ rev, kind: 'discard', tile, confidence: 0.8, actual, agree, q_loss: loss, latency_ms: 120 })
const mockDetail: ReviewDetail = {
  ...mockGames[0]!,
  top_mistakes: [mockItem(40, '9s', '2m', false, 1.52), mockItem(72, 'N', '5p', false, 0.91), mockItem(11, '1p', '9m', false, 0.44)],
  items: [mockItem(10, '5m', '5m', true, 0), mockItem(11, '1p', '9m', false, 0.44), mockItem(20, 'E', 'E', true, 0), mockItem(40, '9s', '2m', false, 1.52), mockItem(72, 'N', '5p', false, 0.91)]
}
const mockModels: ModelEntry[] = [
  { sha256: 'a1b2c3d4'.padEnd(64, '0'), name: 'mortal_s42', size: 45_000_000, tag: 'mortal-v4-b40c192-S42', version: 4, imported_at: 1793600000 },
  { sha256: 'e5f6a7b8'.padEnd(64, '1'), name: 'mortal_alt', size: 43_500_000, tag: 'mortal-v4-b24c128', version: 4, imported_at: 1793300000 }
]

/** 本局练习统计与上一手的判定（教练卡反馈用） */
const practiceStats: NonNullable<MatchData['practice']> = {
  judged: 9, agree: 7, lossSum: 0.94, streak: 4, bestStreak: 5,
  mistakes: [
    { revision: 104, want: '1p', wantRiichi: false, actual: '9m', actualRiichi: false, agree: false, pActual: 0.21, qLoss: 0.62 },
    { revision: 80, want: 'N', wantRiichi: false, actual: '3s', actualRiichi: false, agree: false, pActual: 0.12, qLoss: 0.32 }
  ]
}
const lastMiss: NonNullable<MatchData['judge']> = { revision: 118, want: '1p', wantRiichi: false, actual: '9m', actualRiichi: false, agree: false, pActual: 0.21, qLoss: 0.62 }
const lastHit: NonNullable<MatchData['judge']> = { revision: 118, want: '5m', wantRiichi: false, actual: '5m', actualRiichi: false, agree: true, pActual: 0.93, qLoss: 0 }

export function scenario(name: Scenario): MockBundle {
  const base: MatchData = { state: baseState(), rec: rec(), timeline, exec: { s: 'idle' }, judge: lastHit, practice: practiceStats }
  switch (name) {
    case 'discard':
      return { session: session(), match: base }
    case 'riichi':
      return { session: session(), match: { ...base, rec: rec({ kind: 'riichi', tile: null, riichi_tile: '9s', confidence: 0.74, steps: [{ t: 'button', slot: 2 }, { t: 'hand', index: 13, gap: true }], tips: [{ code: 'riichi_rule' }, { code: 'tenpai', waits: ['2s', '5m', '5p'], total: 8 }] }) } }
    case 'call-chi': {
      const st = baseState({ drawn: null, hand: ['2m', '3m', '4m', '5m', '6m', '7m', '3p', '4p', '6p', '7p', '2s', '2s', '8s'] })
      const rc = rec({ kind: 'chi', tile: '5p', consumed: ['4p', '6p'], confidence: 0.62, steps: [{ t: 'button', slot: 3 }, { t: 'candidate', index: 1, count: 3, kan: false }], tips: [{ code: 'call_rule', kind: 'chi' }], insight: undefined, alts: [
        { id: 'chi_mid', kind: 'chi', p: 0.62, q: 0.9 }, { id: 'pass', kind: 'pass', p: 0.33, q: 0.3 }, { id: 'chi_low', kind: 'chi', p: 0.05, q: -1.1 }
      ] })
      return { session: session(), match: { ...base, state: st, rec: rc } }
    }
    case 'auto-executing': {
      const exec: ExecStatus = { s: 'scheduled', delayMs: 800 }
      return { session: session({ mode: 'auto' }), match: { ...base, exec } }
    }
    case 'auto-paused': {
      const exec: ExecStatus = { s: 'paused', reason: 'unconfirmed' }
      return { session: session({ mode: 'auto', paused: 'unconfirmed' }), match: { ...base, exec } }
    }
    case 'opponent-riichi': {
      const melds: Meld[][] = [[], [], [{ type: 'pon', tiles: ['E', 'E', 'E'], from: 3 }], []]
      const st = baseState({ analysis: { heat: mockHeat(1), turn: 11, furiten: false, wait: null, threat: [{ seat: 2, threat: 0.45, label: 'melds2' }, { seat: 3, threat: 1, label: 'riichi' }, { seat: 0, threat: 0.12, label: 'closed' }], risk: { '2m': { risk: 1.2, tier: 1, why: 'suji', vs: 3 }, '3m': { risk: 6.1, tier: 3 }, '4m': { risk: 11.4, tier: 4 }, '6m': { risk: 0, tier: 0, why: 'genbutsu', vs: 3 }, '7m': { risk: 3.2, tier: 2 }, '8m': { risk: 4.4, tier: 2 }, '3p': { risk: 8.1, tier: 3 }, '4p': { risk: 9.5, tier: 4 }, '5pr': { risk: 12.6, tier: 4 }, '6p': { risk: 7.7, tier: 3 }, '7p': { risk: 5.2, tier: 3 }, '2s': { risk: 2.1, tier: 2 }, '9s': { risk: 0.4, tier: 1, why: 'genbutsu', vs: 3 } } }, riichi: [3], melds, rivers: baseState().rivers.map((rv, i) => (i === 3 ? [...rv, r('7p', { riichi: true })] : rv)) })
      return { showRisk: true, session: session(), match: { ...base, judge: lastMiss, state: st, rec: rec({ tile: '2s', mjai: { type: 'dahai', pai: '2s', tsumogiri: false }, confidence: 0.58, alts: alts([['2s', 0.58, 0.8], ['9s', 0.3, 0.1], ['2m', 0.12, -0.4]]), insight: { options: { '2s': { shanten: 1, total: 34, ukeire: [{ tile: '1m', left: 4 }, { tile: '5m', left: 3 }] }, '9s': { shanten: 0, total: 8, ukeire: [{ tile: '5m', left: 3 }, { tile: '5p', left: 3 }] }, '2m': { shanten: 1, total: 30, ukeire: [{ tile: '5m', left: 3 }] } }, verdict: { advice: 'balance', risk: 2.1, max_threat: 1 }, focus_risk: 2.1, balance: { gain: 640, loss: 180, tile: '2s', shanten: 1, est: true, parts: [{ seat: 3, p: 2.1, val: 8000 }] }, values: [{ kind: 'dahai', tile: '2s', p: 58, value: 460, attack: 640, loss: 180, shanten: 1, total: 34 }, { kind: 'dahai', tile: '9s', p: 30, value: -800, attack: 2100, loss: 2900, shanten: 0, total: 8, win_rate: 0.28, avg: 5200 }, { kind: 'dahai', tile: '2m', p: 12, value: 495, attack: 590, loss: 95, shanten: 1, total: 30 }], groups: { shanten: 1, form: 'regular', total: 34, discard: '2s', ukeire: [{ tile: '1m', left: 4 }, { tile: '5m', left: 3 }, { tile: '9s', left: 3 }], groups: [{ kind: 'run', tiles: ['2m', '3m', '4m'], waits: [] }, { kind: 'run', tiles: ['6m', '7m', '8m'], waits: [] }, { kind: 'run', tiles: ['3p', '4p', '5pr'], waits: [] }, { kind: 'ryanmen', tiles: ['6p', '7p'], waits: [{ tile: '5p', left: 3 }, { tile: '8p', left: 4 }] }, { kind: 'isolated', tiles: ['2s'], waits: [] }, { kind: 'isolated', tiles: ['9s'], waits: [] }] } }, steps: [{ t: 'hand', index: 11, gap: false }], tips: [{ code: 'safe_tiles', seat: 3, safe: [{ tile: '9s', why: 'genbutsu', risk: 0.4 }, { tile: '2m', why: 'suji', risk: 1.2 }] }, { code: 'close_call', tile: '2s', alt: '9s', a: { shanten: 1, total: 34 }, b: { shanten: 0, total: 8 } }] }) } }
    }
    case 'points': {
      // 推荐来自真实 Core 输出；这里额外挂一个“算法修正”的说明，便于截图检查风格提示
      const st = baseState({ riichi: [2], round: { bakaze: 'E', kyoku: 1, honba: 0, kyotaku: 1, oya: 0, left: 48, dora_markers: ['4p'], active: true },
        rivers: baseState().rivers.map((rv, i) => (i === 2 ? [...rv, r('6s', { riichi: true })] : rv)) })
      const pr: RecommendationMsg = { ...POINTS_REC, style: { kind: 'arb', arb: 'soft', model: 'reach', pick: '9s', gain: 399 } }
      return { session: session(), match: { ...base, state: st, rec: pr } }
    }
    case 'empty-disconnected':
      return { session: session({ phase: 'lobby', connected: false, frames: 0, decisions: 0, model: 'ready' }), match: { state: null, rec: null, timeline: [], exec: { s: 'idle' } } }
    case 'unsupported-3p':
      return { session: session({ phase: 'unsupported_mode' }), match: { state: null, rec: null, timeline: [], exec: { s: 'idle' } } }
    case 'desynced':
      return { session: session({ phase: 'desynced', reason: '手牌中找不到要打的牌 9p' }), match: { state: baseState({ phase: 'desynced' }), rec: null, timeline, exec: { s: 'idle' } } }
    case 'no-model':
      return { session: session({ model: 'none', modelName: '' }), match: { ...base, rec: null } }
    case 'models':
      return { session: session(), match: base, tab: 'models', models: { list: mockModels, active: mockModels[0]!.sha256 } }
    case 'models-importing':
      return { session: session(), match: base, tab: 'models', models: { list: mockModels, active: mockModels[0]!.sha256, importing: true, steps: { copy: 'ok', verify: 'running' }, pending: true } }
    case 'review':
      return { session: session(), match: base, tab: 'review', reviews: { games: mockGames, detail: null } }
    case 'review-detail':
      return { session: session(), match: base, tab: 'review', reviews: { games: mockGames, detail: mockDetail } }
    case 'settings':
      return { session: session(), match: base, tab: 'settings' }
    case 'tenpai': {
      const st = baseState({
        drawn: null, hand: ['2m', '3m', '4m', '6m', '7m', '8m', '3p', '4p', '5pr', '6p', '7p', '2s', '2s'],
        analysis: mockAnalysis({
          wait: { shanten: 0, waits: [{ tile: '5p', left: 3 }, { tile: '8p', left: 4 }] }, turn: 12, furiten: false,
          groups: { shanten: 0, form: 'regular', total: 7, ukeire: [{ tile: '8p', left: 4 }, { tile: '5p', left: 3 }], values: [
            { tile: '8p', left: 4, ron: { han: 3, fu: 30, points: 3900, level: '', yaku: [[12, 1], [13, 1], [121, 1]] }, tsumo: { han: 4, fu: 20, points: 5200, level: '', yaku: [[0, 1], [12, 1], [13, 1], [121, 1]] }, riichi_ron: { han: 4, fu: 30, points: 7700, level: '', yaku: [[1, 1], [12, 1], [13, 1], [121, 1]] } },
            { tile: '5p', left: 3, ron: { han: 4, fu: 30, points: 7700, level: '', yaku: [[12, 1], [13, 1], [121, 1], [120, 1]] }, tsumo: { han: 5, fu: 20, points: 8000, level: 'mangan', yaku: [[0, 1], [12, 1], [13, 1], [121, 1], [120, 1]] }, riichi_ron: { han: 5, fu: 30, points: 8000, level: 'mangan', yaku: [[1, 1], [12, 1], [13, 1], [121, 1], [120, 1]] } }
          ], groups: [
            { kind: 'run', tiles: ['2m', '3m', '4m'], waits: [] }, { kind: 'run', tiles: ['6m', '7m', '8m'], waits: [] },
            { kind: 'run', tiles: ['3p', '4p', '5pr'], waits: [] }, { kind: 'head', tiles: ['2s', '2s'], waits: [] },
            { kind: 'ryanmen', tiles: ['6p', '7p'], waits: [{ tile: '5p', left: 3 }, { tile: '8p', left: 4 }] }
          ] }
        })
      })
      return { session: session(), match: { state: st, rec: null, timeline, exec: { s: 'idle' } } }
    }
    case 'all-last': {
      // 南 4 局，你第 3 位，离第 4 位只差 2,600：顺位意识
      const st = baseState({ round: { bakaze: 'S', kyoku: 4, honba: 1, kyotaku: 1, oya: 0, left: 38, dora_markers: ['3p'], active: true }, scores: [34100, 22400, 23700, 19800] })
      return { session: session(), match: { ...base, state: st } }
    }
    case 'melds': {
      // 吃上家 2m、碰对家 白、加杠下家 东；手里 67p 22s 听 58p（有役：役牌白）
      const melds: Meld[][] = [[], [
        { type: 'chi', tiles: ['3m', '4m', '2m'], from: 0 },
        { type: 'pon', tiles: ['P', 'P', 'P'], from: 3 },
        { type: 'kakan', tiles: ['E', 'E', 'E', 'E'], from: 2 }
      ], [], []]
      const st = baseState({
        drawn: null, hand: ['6p', '7p', '2s', '2s'], melds,
        analysis: mockAnalysis({
          wait: { shanten: 0, waits: [{ tile: '5p', left: 3 }, { tile: '8p', left: 4 }] }, turn: 10,
          groups: { shanten: 0, form: 'regular', total: 7, ukeire: [{ tile: '8p', left: 4 }, { tile: '5p', left: 3 }], values: [
            { tile: '8p', left: 4, ron: { han: 1, fu: 40, points: 1300, level: '', yaku: [[15, 1]] }, tsumo: { han: 1, fu: 40, points: 1500, level: '', yaku: [[15, 1]] }, riichi_ron: null },
            { tile: '5p', left: 3, ron: { han: 2, fu: 40, points: 2600, level: '', yaku: [[15, 1], [120, 1]] }, tsumo: { han: 2, fu: 40, points: 2700, level: '', yaku: [[15, 1], [120, 1]] }, riichi_ron: null }
          ], groups: [
            { kind: 'head', tiles: ['2s', '2s'], waits: [] },
            { kind: 'ryanmen', tiles: ['6p', '7p'], waits: [{ tile: '5p', left: 3 }, { tile: '8p', left: 4 }] }
          ] }
        })
      })
      return { session: session(), match: { state: st, rec: null, timeline, exec: { s: 'idle' } } }
    }
    case 'wizard':
      return { session: session({ phase: 'lobby', connected: false }), match: { state: null, rec: null, timeline: [], exec: { s: 'idle' } }, firstRun: true }
    case 'stats':
      return { session: session(), match: base, tab: 'stats', stats: mockStats }
  }
}

const mockStats: StatsData = {
  games: 24, avg_rank: 2.38, win_rate: 0.226, deal_in_rate: 0.118, agree_rate: 0.82,
  trend: { agree: [0.74, 0.79, 0.81, 0.77, 0.85, 0.83, 0.88, 0.8, 0.86, 0.84, 0.82, 0.9], rank: [3, 2, 2, 1, 4, 2, 3, 1, 2, 2, 3, 1] },
  dist: { riichi: 0.41, call: 0.27, win: 0.22 }
}
