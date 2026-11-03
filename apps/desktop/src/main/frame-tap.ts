/**
 * FrameTap：通过 webContents.debugger（进程内 CDP，不开端口）只读取 WebSocket 帧。
 * 只允许 ALLOWED_CDP 里的方法；其它方法一律抛错（scripts/verify-readonly.sh 另有静态检查）。
 */
import type { WebContents } from 'electron'

export const ALLOWED_CDP = new Set(['Network.enable', 'Target.setAutoAttach'])
/** 点击备选后端（S3 失败时启用）：只允许鼠标事件，且只能经 dispatchMouse() 发出。 */
export const ALLOWED_INPUT = new Set(['Input.dispatchMouseEvent', 'Emulation.setFocusEmulationEnabled'])

export interface TapHandlers {
  onOpen(conn: string, url: string): void
  onClose(conn: string): void
  /** 只转发二进制帧（opcode=2）；b64 为 CDP 给的 base64 */
  onFrame(conn: string, dir: 'in' | 'out', b64: string): void
}

interface CdpMessage { requestId: string; url?: string; response?: { opcode: number; payloadData: string }; targetInfo?: unknown; sessionId?: string }

export class FrameTap {
  private attached = false
  frames = 0
  constructor(private wc: WebContents, private h: TapHandlers) {}

  private cdp(method: string, params: object = {}, sessionId?: string): Promise<unknown> {
    if (!ALLOWED_CDP.has(method) && !ALLOWED_INPUT.has(method)) throw new Error(`FrameTap 只读：禁止调用 CDP 方法 ${method}`)
    return this.wc.debugger.sendCommand(method, params, sessionId)
  }

  /**
   * 注意启动顺序（S1 结论）：渲染进程创建前 Network.enable 会一直挂起，
   * 所以调用方必须先 loadURL('about:blank')，再 attach，最后才导航到游戏。
   */
  async attach(): Promise<void> {
    if (this.attached) return
    const dbg = this.wc.debugger
    dbg.attach('1.3')
    this.attached = true
    dbg.on('message', (_e, method: string, p: CdpMessage, sessionId?: string) => this.onMessage(method, p, sessionId))
    dbg.on('detach', () => { this.attached = false })
    await this.cdp('Network.enable')
    this.emulateFocus(true)
    // 若 WS 在 Worker/iframe 里，需要自动附加子目标；不 await：它不影响主流程
    this.cdp('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }).catch(() => {})
  }

  /**
   * 焦点模拟：让页面始终认为自己有焦点（document.hasFocus()=true）。
   * 否则切到别的软件后 Unity 不处理输入，模拟点击会“点不动”。只影响焦点状态，不改网络和页面内容。
   */
  emulateFocus(enabled = true): void {
    void this.cdp('Emulation.setFocusEmulationEnabled', { enabled }).catch(() => {})
  }

  /** 备选点击后端：mouseMoved / mousePressed / mouseReleased（view 内 DIP 坐标）。 */
  dispatchMouse(type: 'mouseMoved' | 'mousePressed' | 'mouseReleased', x: number, y: number): void {
    const button = type === 'mouseMoved' ? 'none' : 'left'
    void this.cdp('Input.dispatchMouseEvent', { type, x, y, button, clickCount: type === 'mouseMoved' ? 0 : 1 }).catch(() => {})
  }

  /** 滚轮（自动匹配选玉之间 / 王座之间时用）：同样只走 Input.dispatchMouseEvent。 */
  dispatchWheel(x: number, y: number, deltaY: number): void {
    void this.cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY }).catch(() => {})
  }

  detach(): void {
    if (this.attached) {
      try { this.wc.debugger.detach() } catch { /* ignore */ }
      this.attached = false
    }
  }

  private onMessage(method: string, p: CdpMessage, sessionId?: string): void {
    const conn = `${sessionId ?? 'main'}:${p.requestId}`
    switch (method) {
      case 'Network.webSocketCreated':
        this.h.onOpen(conn, p.url ?? '')
        break
      case 'Network.webSocketClosed':
        this.h.onClose(conn)
        break
      case 'Network.webSocketFrameSent':
      case 'Network.webSocketFrameReceived': {
        const r = p.response
        if (!r || r.opcode !== 2) return
        this.frames++
        this.h.onFrame(conn, method.endsWith('Sent') ? 'out' : 'in', r.payloadData)
        break
      }
      case 'Target.attachedToTarget':
        // 子目标也要开 Network.enable 才有事件
        this.cdp('Network.enable', {}, p.sessionId).catch(() => {})
        break
    }
  }
}
