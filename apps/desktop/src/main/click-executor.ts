import type { IntentMsg } from '@shared/protocol'
import type { Rect } from './layout'
import { SlotOutOfRange, stepToPoint } from '@shared/ui-map'

export interface MouseSink {
  move(x: number, y: number): void
  down(x: number, y: number): void
  up(x: number, y: number): void
}

export interface ExecutorDeps {
  sink: MouseSink
  /** 游戏区显示矩形；不可见时返回 null */
  getRect(): Rect | null
  /** 窗口此刻能不能点（见 windowCanClick：未最小化、未销毁） */
  canRun(): boolean
  sleep(ms: number): Promise<void>
}

/**
 * 窗口此刻能不能点。只看“最小化 / 已销毁”——不能用 BrowserWindow.isVisible()：
 * macOS 上它在窗口被遮挡时也返回 false，而窗口在另一个桌面（Space）里就算被遮挡，
 * 结果切到 Desktop 2 之后每一步都被判成“不可用”，自动点击被静默丢弃。
 * 游戏页已关掉遮挡降频（disable-backgrounding-occluded-windows + backgroundThrottling: false），在别的桌面也照样能点。
 */
export function windowCanClick(w: { isDestroyed(): boolean; isMinimized(): boolean }): boolean {
  return !w.isDestroyed() && !w.isMinimized()
}

export interface ExecutorOptions { preDelayMs: number; stepDelayMs: number; pressMs: number }
export const DEFAULT_OPTIONS: ExecutorOptions = { preDelayMs: 800, stepDelayMs: 250, pressMs: 80 }

export type RunResult = { ok: true } | { ok: false; aborted: true } | { ok: false; aborted: false; error: string }

/**
 * 把 intent 的抽象步骤变成 mouseMove → mouseDown → mouseUp。
 * 每一步之前都检查 isCurrent()（intent 是否仍有效）和 canRun()；任何一项不满足就中止，绝不继续点。
 */
export class ClickExecutor {
  constructor(private deps: ExecutorDeps, private opts: ExecutorOptions = DEFAULT_OPTIONS) {}

  setOptions(o: Partial<ExecutorOptions>): void {
    this.opts = { ...this.opts, ...o }
  }

  async run(intent: Pick<IntentMsg, 'steps'>, isCurrent: () => boolean, onBegin?: () => void): Promise<RunResult> {
    const { deps, opts } = this
    await deps.sleep(opts.preDelayMs)
    for (let i = 0; i < intent.steps.length; i++) {
      if (!isCurrent() || !deps.canRun()) return { ok: false, aborted: true }
      const rect = deps.getRect()
      if (!rect) return { ok: false, aborted: true }
      let p
      try {
        p = stepToPoint(intent.steps[i]!, rect)
      } catch (e) {
        if (e instanceof SlotOutOfRange) return { ok: false, aborted: false, error: e.message }
        throw e
      }
      if (i === 0) {
        onBegin?.()
        if (!isCurrent()) return { ok: false, aborted: true }
      }
      deps.sink.move(p.x, p.y)
      await deps.sleep(60)
      if (!isCurrent() || !deps.canRun()) return { ok: false, aborted: true }
      deps.sink.down(p.x, p.y)
      await deps.sleep(opts.pressMs)
      deps.sink.up(p.x, p.y)
      if (i < intent.steps.length - 1) await deps.sleep(opts.stepDelayMs)
    }
    return { ok: true }
  }
}
