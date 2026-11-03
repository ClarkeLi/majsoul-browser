/**
 * 自动匹配：对局结束后自动点掉结算页、回到大厅再开下一局。全程只用鼠标点击（与自动打牌同一条点击通道），
 * 不往游戏页面注入脚本，也不伪造网络消息。
 *
 * 真实结算流程（2026-11 在客户端里逐页点过确认）：
 *   终局排名「確認」→ 段位分「確認」→（可能有其它奖励页「確認」）→ 知名度页：蓝色「再來一場」+ 黄色「確認」
 *   → 弹窗「要再進行一場 段位場・銅之間・四人東 的匹配對局嗎？」黄色「確認」+ 蓝色「取消」
 *   弹窗「確認」后在同一个场次重新匹配（客户端随即发出 fetchCurrentMatchInfo + startUnifiedMatch）。
 *
 * 流程（坐标为 16×9 画面坐标）：
 *  0. 开着、不在牌局里 → scanning（无论现在停在哪一页都能接着走）
 *  1. scanning：每隔 ~2.5 秒截一次游戏画面：
 *     弹窗 → 点弹窗里的「確認」，进入 waiting；看到蓝色「再來一場」→ 点它（下一次截图应当出现弹窗）；
 *     只看到黄色「確認」→ 点它翻到下一页
 *  2. waiting：等客户端发出匹配请求（startUnifiedMatch）；8 秒内没看到 → 按画面上还在的按钮重来（最多 3 次）
 *  3. 兜底（没有出现「再來一場」，按钮都消失且牌局连接已关闭）：回大厅后依次点 段位场 → 场 → 东/南
 *     （坐标取自 MahjongCopilot 的 Positions，GPL-3.0），需要知道你上次打的场
 *  4. 发出匹配请求 → queued；进入下一局 → playing（交给自动打牌）；这一局结束 → 回到 scanning
 * 任何一步卡住超过上限都会停下（status = stuck），绝不无限乱点。
 */

export type AutoMatchStatus = 'off' | 'playing' | 'scanning' | 'joining' | 'waiting' | 'queued' | 'stuck'

/** 段位场里的房间：0 铜 1 银 2 金 3 玉 4 王座；east = 四人东，south = 四人南 */
export interface MatchRoom { level: number; mode: 'east' | 'south' }

/** 雀魂四麻段位场 match_mode_id → 房间 */
export function roomOfModeId(id: number | null | undefined): MatchRoom | null {
  const t: Record<number, MatchRoom> = {
    2: { level: 0, mode: 'east' }, 3: { level: 0, mode: 'south' },
    5: { level: 1, mode: 'east' }, 6: { level: 1, mode: 'south' },
    8: { level: 2, mode: 'east' }, 9: { level: 2, mode: 'south' },
    11: { level: 3, mode: 'east' }, 12: { level: 3, mode: 'south' },
    15: { level: 4, mode: 'east' }, 16: { level: 4, mode: 'south' }
  }
  return id === null || id === undefined ? null : t[id] ?? null
}

export const POS = {
  ok: [14.35, 8.12] as const,
  /** 知名度页左边的蓝色「再來一場」（实测按钮 x 11.1–13.2，y 7.85–8.45） */
  again: [12.16, 8.15] as const,
  /** 「再來一場」弹窗里的黄色「確認」（实测按钮 x 5.25–7.78，y 6.29–6.90；右边蓝色「取消」x 8.2–10.73） */
  popupOk: [6.51, 6.59] as const,
  ranked: [11.5, 2.75] as const,
  levels: [[11.5, 3.375], [11.5, 4.825], [11.5, 6.15], [11.5, 5.425], [11.5, 6.825]] as const,
  /** 玉之间、王座之间要先在这个位置滚动滚轮 */
  wheelAt: [11.5, 4.825] as const,
  modes: { east: [11.6, 3.325], south: [11.6, 4.675] } as const
}

export interface Frame { width: number; height: number; /** BGRA */ data: Uint8Array | Buffer }

export interface AutoMatchDeps {
  click(gx: number, gy: number): Promise<void>
  wheel(gx: number, gy: number, deltaY: number): Promise<void>
  capture(): Promise<Frame | null>
  now(): number
  sleep(ms: number): Promise<void>
  onStatus(s: AutoMatchStatus, detail?: string): void
}

/** 在画面两块区域（避开按钮中间的字）采样，返回满足条件的比例 */
function ratio(f: Frame, xs: ReadonlyArray<readonly [number, number]>, y0: number, y1: number, ok: (r: number, g: number, b: number) => boolean): number {
  const u = f.width / 16
  let hit = 0, total = 0
  for (const [x0, x1] of xs) {
    for (let gx = x0; gx <= x1; gx += 0.04) {
      for (let gy = y0; gy <= y1; gy += 0.05) {
        const x = Math.min(f.width - 1, Math.round(gx * u)), y = Math.min(f.height - 1, Math.round(gy * u))
        const i = (y * f.width + x) * 4
        total++
        if (ok(f.data[i + 2]!, f.data[i + 1]!, f.data[i]!)) hit++
      }
    }
  }
  return total ? hit / total : 0
}

/** 黄色「確認」按钮（实测 RGB ≈ 236–252, 178–229, 74–124） */
export function okButtonVisible(f: Frame): boolean {
  return ratio(f, [[13.72, 13.98], [14.72, 14.98]], 7.95, 8.3, (r, g, b) => r > 200 && g > 150 && b < 150 && r - b > 95) >= 0.55
}

/** 「再來一場」确认弹窗：中间偏下一黄（確認）一蓝（取消）两个按钮 */
export function againPopupVisible(f: Frame): boolean {
  const yellow = ratio(f, [[5.4, 5.65], [7.4, 7.65]], 6.4, 6.8, (r, g, b) => r > 200 && g > 150 && b < 150 && r - b > 95)
  const blue = ratio(f, [[8.35, 8.6], [10.35, 10.6]], 6.4, 6.8, (r, g, b) => b > 110 && b - r > 60 && r < 95 && g < 120)
  return yellow >= 0.55 && blue >= 0.55
}

/** 蓝色「再來一場」按钮（实测 RGB ≈ 46–62, 66–92, 123–166），只有和「確認」同时出现才算 */
export function againButtonVisible(f: Frame): boolean {
  return okButtonVisible(f) && ratio(f, [[11.2, 11.5], [12.8, 13.1]], 7.95, 8.3, (r, g, b) => b > 110 && b - r > 60 && r < 95 && g < 120) >= 0.55
}

const TICK_MS = 2500
/** 画面上没有任何认识的按钮这么久、而且不在牌局里 → 认为在大厅，按场次去匹配 */
const LOBBY_IDLE_MS = 6000
/** 点了弹窗「確認」/ 选完场后，这么久还没有匹配请求就重新看画面 */
const MATCH_REQ_WAIT_MS = 8000
/** 排队超过这么久还没进对局：回到看画面（可能被取消了） */
const QUEUE_LIMIT_MS = 5 * 60_000
/** 连续这么多次尝试（弹窗確認 / 大厅选场）都没能发出匹配请求 → 停下 */
const MAX_TRIES = 3

/**
 * 不依赖“从哪一步开始”：只要开着、又不在牌局里，就每 2.5 秒看一次画面，认出是哪一页就点哪一步，
 * 所以在结算页任何一页、弹窗上、或者大厅里打开都能接着走；进了对局交给自动打牌，结束后自动接着来。
 */
export class AutoMatch {
  private status: AutoMatchStatus = 'off'
  private enabled = false
  private inGame = false
  private room: MatchRoom | null = null
  private gameConnOpen = false
  private lastButtonAt = 0
  private tries = 0
  private waitedAt = 0
  private queuedAt = 0
  private busy = false
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(private d: AutoMatchDeps) {}

  get state(): AutoMatchStatus { return this.status }

  private set(s: AutoMatchStatus, detail?: string): void {
    if (s === this.status && !detail) return
    this.status = s
    this.d.onStatus(s, detail)
  }

  setEnabled(v: boolean): void {
    if (v === this.enabled && this.status !== 'stuck') return
    this.enabled = v
    if (!v) { this.stopTimer(); this.set('off'); return }
    this.resume()
  }

  setRoom(r: MatchRoom | null): void { if (r) this.room = r }
  getRoom(): MatchRoom | null { return this.room }

  /** 牌局 WebSocket 打开 / 关闭（url 含 game-gateway） */
  setGameConn(open: boolean): void { this.gameConnOpen = open }

  /** 是否在牌局里（Core 的 phase === in_game） */
  setInGame(v: boolean): void {
    if (v === this.inGame) return
    this.inGame = v
    if (this.enabled) this.resume()
  }

  onGameEnd(): void { this.setInGame(false) }
  onGameStart(): void { this.setInGame(true) }

  /** 看到客户端发出了匹配请求：排队中，等进入对局 */
  onMatchRequested(): void {
    if (!this.enabled || this.inGame) return
    this.tries = 0
    this.queuedAt = this.d.now()
    this.set('queued')
  }

  /** 按当前情况重新开始：对局中就等着，否则立刻开始看画面 */
  private resume(): void {
    this.tries = 0
    if (this.inGame) { this.stopTimer(); this.set('playing'); return }
    this.lastButtonAt = this.d.now()
    this.set('scanning')
    this.startTimer()
    void this.tick()
  }

  private startTimer(): void {
    this.stopTimer()
    this.timer = setInterval(() => { void this.tick() }, TICK_MS)
    ;(this.timer as { unref?: () => void }).unref?.()
  }

  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  private giveUp(why: string): void {
    this.stopTimer()
    this.set('stuck', why)
  }

  /** 每 ~2.5 秒一次；测试里直接调用 */
  async tick(): Promise<void> {
    if (this.busy || !this.enabled || this.inGame) return
    this.busy = true
    try {
      const now = this.d.now()
      if (this.status === 'queued') {
        if (now - this.queuedAt > QUEUE_LIMIT_MS) { this.lastButtonAt = now; this.set('scanning') }
        return
      }
      if (this.status === 'waiting') {
        if (now - this.waitedAt <= MATCH_REQ_WAIT_MS) return
        if (this.tries >= MAX_TRIES) { this.giveUp('no_match'); return }
        this.lastButtonAt = now
        this.set('scanning')            // 没等到匹配请求：重新看画面在哪一页
      }
      if (this.status !== 'scanning') return
      const f = await this.d.capture()
      if (f && againPopupVisible(f)) {
        await this.d.click(...POS.popupOk)
        this.tries++
        this.waitedAt = this.d.now()
        this.set('waiting', 'again')
        return
      }
      if (f && againButtonVisible(f)) {
        await this.d.click(...POS.again)          // 下一次截图应当看到确认弹窗
        this.lastButtonAt = this.d.now()
        return
      }
      if (f && okButtonVisible(f)) {
        await this.d.click(...POS.ok)
        this.lastButtonAt = this.d.now()
        return
      }
      // 认识的按钮都没有、牌局连接也关了，持续一会儿 → 在大厅：按场次去匹配
      if (!this.gameConnOpen && now - this.lastButtonAt >= LOBBY_IDLE_MS) {
        if (!this.room) { this.giveUp('room'); return }
        if (this.tries >= MAX_TRIES) { this.giveUp('join'); return }
        this.set('joining')
        await this.join()
        this.tries++
        this.waitedAt = this.d.now()
        this.set('waiting', 'lobby')
      }
    } finally {
      this.busy = false
    }
  }

  private async join(): Promise<void> {
    const room = this.room!
    await this.d.click(...POS.ranked)
    await this.d.sleep(1600)
    if (room.level >= 3) {
      await this.d.wheel(...POS.wheelAt, 1000)
      await this.d.sleep(900)
    }
    const lv = POS.levels[room.level]!
    await this.d.click(lv[0], lv[1])
    await this.d.sleep(1600)
    const m = POS.modes[room.mode]
    await this.d.click(m[0], m[1])
  }
}
