import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Mode } from '@shared/protocol'
import { isLang, type Lang } from '@shared/lang'
import { SIDEBAR_DEFAULT } from './layout'
import type { MatchRoom } from './auto-match'

export interface Settings {
  window: { width: number; height: number; x?: number; y?: number }
  sidebar: { width: number; collapsed: boolean }
  theme: 'dark' | 'light' | 'system'
  language: Lang
  firstRunDone: boolean
  clickBackend: 'sendInputEvent' | 'cdp'
  schema: number
  overlayEnabled: boolean
  collapsedCards: string[]
  hudScale: number
  hudSide: 'both' | 'left' | 'right'
  hudTeach: boolean
  hudReserve: boolean
  hudDock: 'split' | 'bottom'
  hudBars: boolean
  /** 练习模式：先隐藏答案，你出牌后再对比 */
  hudPractice: boolean
  /** 自动匹配：自动模式下，一局结束后自动点掉结算页并开始下一局 */
  autoMatch: boolean
  /** 自动匹配要进的房间；从你上一次匹配自动学到 */
  autoMatchRoom: MatchRoom | null
  autoDelayMs: number
  /** 打牌风格：掷骰（估值接近时随机选一个备选）+ 爱赌（看到役满路线就保留）。关闭 = 完全按模型第一名 */
  playStyle: boolean
  /** 风格分项（总开关打开时才生效） */
  styleParts: { dice: boolean; gamble: boolean; arb: boolean }
  showRisk: boolean
  candidateCount: 1 | 2 | 3
  recordsEnabled: boolean
  device: 'cpu' | 'mps' | 'cuda'
  activeModel: string | null
}

export const DEFAULT_SETTINGS: Settings = {
  window: { width: 1600, height: 900 },
  sidebar: { width: SIDEBAR_DEFAULT, collapsed: false },
  theme: 'dark',
  language: 'zh-CN',
  firstRunDone: false,
  clickBackend: 'cdp',
  schema: 2,
  overlayEnabled: true,
  collapsedCards: ['map'],
  hudScale: 1,
  hudSide: 'both',
  hudTeach: true,
  hudReserve: true,
  hudDock: 'split',
  hudBars: true,
  hudPractice: false,
  autoMatch: false,
  autoMatchRoom: null,
  autoDelayMs: 800,
  playStyle: true,
  styleParts: { dice: true, gamble: true, arb: true },
  showRisk: true,
  candidateCount: 3,
  recordsEnabled: true,
  device: 'cpu',
  activeModel: null
}

export type { Mode }

export class SettingsStore {
  private data: Settings
  private path: string
  /** defaultLang：没有设置文件（首次运行）或语言无效时用的语言，一般是系统语言 */
  constructor(root: string, private defaultLang: Lang = DEFAULT_SETTINGS.language) {
    this.path = join(root, 'settings.json')
    this.data = this.load()
  }
  private load(): Settings {
    try {
      const raw = JSON.parse(readFileSync(this.path, 'utf8')) as Partial<Settings>
      // 迁移 v2：窗口失焦时 sendInputEvent 点不动 → 默认改走 CDP 鼠标事件
      if ((raw.schema ?? 1) < 2) { raw.clickBackend = 'cdp'; raw.schema = 2 }
      if (!isLang(raw.language)) raw.language = this.defaultLang
      return { ...DEFAULT_SETTINGS, ...raw, window: { ...DEFAULT_SETTINGS.window, ...raw.window }, sidebar: { ...DEFAULT_SETTINGS.sidebar, ...raw.sidebar }, styleParts: { ...DEFAULT_SETTINGS.styleParts, ...raw.styleParts } }
    } catch {
      return { ...structuredClone(DEFAULT_SETTINGS), language: this.defaultLang }
    }
  }
  get(): Settings { return this.data }
  patch(p: Partial<Settings>): Settings {
    this.data = { ...this.data, ...p }
    const tmp = this.path + '.tmp'
    writeFileSync(tmp, JSON.stringify(this.data, null, 2))
    renameSync(tmp, this.path)
    return this.data
  }
}
