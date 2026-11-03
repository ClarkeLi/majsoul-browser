import { BrowserWindow } from 'electron'
import type { Rect } from '@shared/ui-map'

/**
 * 游戏画面上的信息层：透明、默认点击穿透、不抢焦点的子窗口，加载同一个渲染包的 #/hud 路由。
 * 鼠标移动会转发给信息层（forward），用于悬停提示；只有当鼠标停在信息层的面板上时，
 * 渲染层通过 hud:interactive 请求接收点击（展开、练习模式按钮等），离开面板立即恢复穿透。
 * 它不向游戏发送任何事件。
 */
export class Overlay {
  private win: BrowserWindow
  private ready = false
  private shown = false
  private readyCbs: Array<() => void> = []

  constructor(parent: BrowserWindow, preload: string, load: (w: BrowserWindow) => Promise<void>) {
    this.win = new BrowserWindow({
      parent, transparent: true, frame: false, hasShadow: false, focusable: false, skipTaskbar: true, show: false,
      resizable: false, movable: false, backgroundColor: '#00000000',
      webPreferences: { preload, sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
    })
    this.win.setIgnoreMouseEvents(true, { forward: true })
    this.win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    this.win.webContents.on('will-navigate', (e) => e.preventDefault())
    void load(this.win).then(() => {
      this.ready = true
      this.readyCbs.splice(0).forEach((f) => f())
    })
  }

  /** area 是整个游戏区在父窗口内容区内的位置（含上下信息栏）；信息层窗口覆盖它，并换算成屏幕坐标。 */
  place(parent: BrowserWindow, area: Rect): void {
    const c = parent.getContentBounds()
    this.win.setBounds({ x: c.x + area.x, y: c.y + area.y, width: area.w, height: area.h })
  }

  private interactive = false
  /** true：面板下的点击交给信息层；false：点击穿透到游戏（鼠标移动仍转发，用于悬停） */
  setInteractive(v: boolean): void {
    if (this.win.isDestroyed() || v === this.interactive) return
    this.interactive = v
    if (v) this.win.setIgnoreMouseEvents(false)
    else this.win.setIgnoreMouseEvents(true, { forward: true })
  }

  isSender(wc: Electron.WebContents): boolean { return !this.win.isDestroyed() && wc.id === this.win.webContents.id }

  onReady(cb: () => void): void {
    if (this.ready) cb()
    else this.readyCbs.push(cb)
  }

  setVisible(v: boolean): void {
    if (this.win.isDestroyed() || !this.ready) return
    if (v && !this.shown) { this.win.showInactive(); this.shown = true }
    else if (!v && this.shown) { this.win.hide(); this.shown = false; this.setInteractive(false) }
  }

  send(channel: string, payload: unknown): void {
    if (!this.win.isDestroyed()) this.win.webContents.send(channel, payload)
  }

  isVisible(): boolean { return !this.win.isDestroyed() && this.win.isVisible() }

  /** 测试用：截取信息层像素（带透明通道）。 */
  snapshot(): Promise<Electron.NativeImage> { return this.win.webContents.capturePage() }

  destroy(): void { if (!this.win.isDestroyed()) this.win.destroy() }
}
