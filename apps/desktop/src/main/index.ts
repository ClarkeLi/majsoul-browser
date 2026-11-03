import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { BrowserWindow, Menu, WebContentsView, app, dialog, globalShortcut, ipcMain, session, shell } from 'electron'
import { PROTOCOL_VERSION, type CoreMessage, type IntentMsg, type Mode } from '@shared/protocol'
import { AutoMatch, roomOfModeId, type AutoMatchStatus } from './auto-match'
import { ClickExecutor, windowCanClick } from './click-executor'
import { mt, systemLang } from './i18n'
import { CoreClient } from './core-client'
import { FrameTap } from './frame-tap'
import { Overlay } from './overlay'
import { clampSidebar, computeLayout, type Rect } from './layout'
import { toView } from '@shared/ui-map'
import { denyAllPermissions, isAllowedNavigation } from './navigation-policy'
import { DataRootError, ensureDataRoot, resolveDataRoot } from './paths'
import { FrameRecorder } from './recorder'
import { SettingsStore } from './settings'
import { coreLaunch } from './core-launch'
import { runModelCli } from './models'

const GAME_URL = 'https://game.maj-soul.com/1/'
const GAME_PARTITION = 'persist:majsoul'
const repoRoot = resolve(__dirname, '../../../..')

// ------------------------------------------------------------------ 数据根（必须在 ready 之前）
let dataRoot: string
try {
  dataRoot = resolveDataRoot({ env: process.env, isPackaged: app.isPackaged, platform: process.platform, exePath: process.execPath, repoRoot })
  ensureDataRoot(dataRoot)
} catch (e) {
  const err = e as DataRootError
  const m = mt(systemLang())
  const appName = 'Majsoul-Browser.app'
  const [msg, hint] = err.code === 'translocated' ? [m.translocated, m.translocatedHint(appName)] : [m.notWritable(err.detail?.root ?? '', err.detail?.cause ?? ''), m.notWritableHint]
  dialog.showErrorBox(m.cannotStart, `${msg}\n\n${hint}`)
  app.exit(1)
  throw e
}
// 切到别的软件、窗口被遮挡时也不要降级渲染/节流：否则游戏画面停住，模拟点击会失效
app.commandLine.appendSwitch('disable-renderer-backgrounding')
app.commandLine.appendSwitch('disable-background-timer-throttling')
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows')
app.setName('Majsoul-Browser')
app.setPath('userData', join(dataRoot, 'profile'))
app.setPath('sessionData', join(dataRoot, 'profile'))
app.setPath('temp', join(dataRoot, 'tmp'))
app.setPath('logs', join(dataRoot, 'logs'))
app.setPath('crashDumps', join(dataRoot, 'crash'))

if (!app.requestSingleInstanceLock()) {
  app.exit(0)
}

// ------------------------------------------------------------------ 状态
const settings = new SettingsStore(dataRoot, systemLang())
const recorder = new FrameRecorder(join(dataRoot, 'records'), settings.get().recordsEnabled)
let win: BrowserWindow
let gameView: WebContentsView
let tap: FrameTap
let overlay: Overlay
let hudPhase = 'lobby'
const hudCache = new Map<string, CoreMessage>()
let frameCount = 0
let mode: Mode = 'off'
let pausedReason: string | null = null
let currentIntent: IntentMsg | null = null
const running = new Set<string>()
const gameConns = new Set<string>()

const launchInput = { isPackaged: app.isPackaged, resourcesPath: process.resourcesPath, repoRoot, platform: process.platform }
const core = new CoreClient(() => {
  const l = coreLaunch(launchInput)
  const tmp = join(dataRoot, 'tmp')
  return {
    command: l.command, args: l.args, cwd: l.cwd,
    env: {
      ...process.env,
      TMPDIR: tmp, TEMP: tmp, TMP: tmp,
      TORCH_HOME: join(dataRoot, 'cache', 'torch'),
      XDG_CACHE_HOME: join(dataRoot, 'cache'),
      PYTHONPYCACHEPREFIX: join(tmp, 'pycache'),
      PYTHONUNBUFFERED: '1'
    }
  }
})

const toRenderer = (channel: string, payload: unknown): void => {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload)
}

// ------------------------------------------------------------------ 布局
function applyLayout(): void {
  const [w, h] = win.getContentSize() as [number, number]
  const st = settings.get()
  const { game, area } = computeLayout(w, h, st.sidebar, { reserve: st.hudReserve, dock: st.hudDock })
  gameView.setBounds({ x: game.x, y: game.y, width: game.w, height: game.h })
  overlay?.place(win, area)       // 信息层覆盖整个游戏区，在里面按同一算法找到游戏画面
}

function gameRect(): Rect | null {
  const b = gameView.getBounds()
  return b.width > 0 && b.height > 0 ? { x: 0, y: 0, w: b.width, h: b.height } : null
}

/** 信息层只在：已开启 + 辅助/自动模式 + 局内 + 窗口未最小化 时显示。 */
function updateHud(): void {
  overlay?.setVisible(settings.get().overlayEnabled && mode !== 'off' && hudPhase === 'in_game' && !win.isMinimized())
}

function toggleHud(): void {
  const next = settings.patch({ overlayEnabled: !settings.get().overlayEnabled })
  overlay?.send('settings:changed', next)
  toRenderer('app:event', { t: 'settings', settings: next })
  updateHud()
}

// ------------------------------------------------------------------ 自动模式
// 点击后端由设置选择：默认 webContents.sendInputEvent；S3 若发现 Unity 收不到，改为 'cdp'（Input.dispatchMouseEvent）
const executorSink = {
  move: (x: number, y: number) => (settings.get().clickBackend === 'cdp' ? tap.dispatchMouse('mouseMoved', x, y) : gameView.webContents.sendInputEvent({ type: 'mouseMove', x, y })),
  down: (x: number, y: number) => (settings.get().clickBackend === 'cdp' ? tap.dispatchMouse('mousePressed', x, y) : gameView.webContents.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 })),
  up: (x: number, y: number) => (settings.get().clickBackend === 'cdp' ? tap.dispatchMouse('mouseReleased', x, y) : gameView.webContents.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 }))
}
const executor = new ClickExecutor({
  sink: executorSink,
  getRect: gameRect,
  canRun: () => windowCanClick(win),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms))
})

/** 点击本身每一步要花的时间（移动 60 + 按下 80 + 步间隔 250，取整）与留给网络/渲染的余量，和 Core 的 think.py 一致 */
const STEP_MS = 420
const SAFETY_MS = 1000

function runIntent(intent: IntentMsg): void {
  if (running.has(intent.actionId)) return
  running.add(intent.actionId)
  // 思考时间由 Core 按把握度算好（旧原型 think_seconds），这里照做；没有时才用设置里的固定延迟。
  // 无论如何，“等 + 点”都不能超过这一手剩下的时间（ttl），否则游戏会替你摸切
  const want = intent.delay_ms ?? settings.get().autoDelayMs
  const latest = intent.ttl_ms - STEP_MS * intent.steps.length - SAFETY_MS
  executor.setOptions({ preDelayMs: Math.max(0, Math.min(want, latest)) })
  void executor
    .run(intent, () => mode === 'auto' && !pausedReason && currentIntent?.actionId === intent.actionId, () => core.send({ t: 'action.begin', actionId: intent.actionId }))
    .then((res) => {
      if (res.ok) core.send({ t: 'action.result', actionId: intent.actionId, ok: true })
      else if (!res.aborted) core.send({ t: 'action.result', actionId: intent.actionId, ok: false, error: res.error })
    })
    .finally(() => running.delete(intent.actionId))
}

// ------------------------------------------------------------------ 自动匹配
async function clickGame(gx: number, gy: number): Promise<void> {
  const rect = gameRect()
  if (!rect || win.isMinimized()) return
  const p = toView(gx, gy, rect)
  const sink = executorSink
  sink.move(p.x, p.y)
  await new Promise((r) => setTimeout(r, 70))
  sink.down(p.x, p.y)
  await new Promise((r) => setTimeout(r, 80))
  sink.up(p.x, p.y)
}

const autoMatch = new AutoMatch({
  click: clickGame,
  wheel: async (gx, gy, dy) => {
    const rect = gameRect()
    if (!rect) return
    const p = toView(gx, gy, rect)
    if (settings.get().clickBackend === 'cdp') tap.dispatchWheel(p.x, p.y, dy)
    else gameView.webContents.sendInputEvent({ type: 'mouseWheel', x: p.x, y: p.y, deltaX: 0, deltaY: -dy })
  },
  capture: async () => {
    if (!gameView || win.isMinimized()) return null
    const img = await gameView.webContents.capturePage()
    const { width, height } = img.getSize()
    return width > 0 ? { width, height, data: img.toBitmap() } : null
  },
  now: () => Date.now(),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  onStatus: (status: AutoMatchStatus, detail?: string) => toRenderer('app:event', { t: 'automatch', status, detail })
})
autoMatch.setRoom(settings.get().autoMatchRoom)

/** 自动匹配只在“自动模式 + 设置里开启”时工作 */
function syncAutoMatch(): void {
  autoMatch.setEnabled(mode === 'auto' && settings.get().autoMatch)
}

function stopAuto(reason: string): void {
  const wasAuto = mode === 'auto'
  currentIntent = null
  if (wasAuto) {
    mode = 'assist'
    core.send({ t: 'mode.set', mode: 'assist' })
    toRenderer('app:event', { t: 'auto-stopped', reason })
  }
  syncAutoMatch()
}

function pauseAuto(reason: string): void {
  if (mode !== 'auto') return
  currentIntent = null
  core.send({ t: 'auto.pause', reason })
}

core.on('status', (state: string, detail?: string) => toRenderer('core:status', { state, detail }))
const coreLog: string[] = []
core.on('log', (s: string) => { process.stderr.write(`[core] ${s}`); coreLog.push(s); if (coreLog.length > 400) coreLog.shift() })
core.on('fatal', (m: string) => dialog.showErrorBox(mt(settings.get().language).coreMismatch, m))
const smoke = { model: 'none', phase: 'lobby', states: 0, recs: 0, hud: false, errors: [] as string[] }
core.on('message', (msg: CoreMessage) => {
  toRenderer('core:message', msg)
  // 信息层：转发所有 Core 消息，并缓存最近状态，信息层（重新）加载时回放
  overlay?.send('core:message', msg)
  if (msg.t === 'state' || msg.t === 'recommendation' || msg.t === 'session.status' || msg.t === 'model.status') hudCache.set(msg.t, msg)
  if (msg.t === 'session.status') { hudPhase = msg.phase; updateHud() }
  if (msg.t === 'model.status') smoke.model = msg.state
  else if (msg.t === 'state') { smoke.states++; smoke.phase = msg.phase }
  else if (msg.t === 'recommendation' && !msg.clear) smoke.recs++
  else if (msg.t === 'error') smoke.errors.push(`${msg.code}:${msg.message}`)
  if (msg.t === 'intent') {
    if (mode === 'auto' && !pausedReason) {
      currentIntent = msg
      runIntent(msg)
    }
  } else if (msg.t === 'intent.status') {
    if (currentIntent?.actionId === msg.actionId && msg.status !== 'retry') currentIntent = null
  } else if (msg.t === 'session.status') {
    pausedReason = msg.paused
    autoMatch.setInGame(msg.phase === 'in_game')
  } else if (msg.t === 'game.end') {
    autoMatch.onGameEnd()
  } else if (msg.t === 'lobby.match') {
    autoMatch.onMatchRequested()
  } else if (msg.t === 'lobby.matched') {
    // 记住你打的是哪个场，自动匹配下次就进这个场
    const room = roomOfModeId(msg.mode_id)
    if (room) { autoMatch.setRoom(room); const next = settings.patch({ autoMatchRoom: room }); toRenderer('app:event', { t: 'settings', settings: next }) }
  }
})

// ------------------------------------------------------------------ 窗口
/** 开发时的应用图标（由 scripts/make-icon.cjs 生成）；out/main → apps/desktop/resources */
const DEV_ICON = join(__dirname, '../../resources/icon.png')

async function createWindow(): Promise<void> {
  const s = settings.get()
  const isMac = process.platform === 'darwin'
  if (isMac && !app.isPackaged && existsSync(DEV_ICON)) app.dock?.setIcon(DEV_ICON)
  win = new BrowserWindow({
    width: s.window.width, height: s.window.height, x: s.window.x, y: s.window.y,
    minWidth: 1280, minHeight: 760,
    backgroundColor: '#0E1116',
    title: 'Majsoul-Browser',
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    trafficLightPosition: isMac ? { x: 16, y: 14 } : undefined,
    titleBarOverlay: isMac ? undefined : { color: '#151A21', symbolColor: '#A9A397', height: 44 },
    // 打包后图标来自安装包（build/icon.png）；开发时没有安装包，直接用 resources/icon.png，否则显示 Electron 默认图标
    icon: !app.isPackaged && !isMac ? DEV_ICON : undefined,
    webPreferences: { preload: join(__dirname, '../preload/index.js'), contextIsolation: true, sandbox: true, nodeIntegration: false }
  })
  // 渲染层不允许导航到任何外部页面
  win.webContents.on('will-navigate', (e) => e.preventDefault())
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  gameView = new WebContentsView({
    webPreferences: { partition: GAME_PARTITION, contextIsolation: true, sandbox: true, nodeIntegration: false, backgroundThrottling: false }
  })
  win.contentView.addChildView(gameView)
  const gwc = gameView.webContents
  gwc.setWindowOpenHandler(() => ({ action: 'deny' }))
  gwc.on('will-navigate', (e, url) => { if (!isAllowedNavigation(url)) e.preventDefault() })
  gwc.on('did-finish-load', () => tap?.emulateFocus(true))
  const ses = session.fromPartition(GAME_PARTITION)
  ses.setPermissionRequestHandler((_wc, _perm, cb) => cb(denyAllPermissions()))
  ses.setPermissionCheckHandler(() => denyAllPermissions())

  applyLayout()
  overlay = new Overlay(win, join(__dirname, '../preload/index.js'), async (w) => {
    const url = process.env.ELECTRON_RENDERER_URL
    if (url) await w.loadURL(`${url}#/hud`)
    else await w.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/hud' })
  })
  overlay.onReady(() => {
    smoke.hud = true
    overlay.send('settings:changed', settings.get())
    for (const m of hudCache.values()) overlay.send('core:message', m)
    applyLayout()
    updateHud()
  })
  applyLayout()
  win.on('resize', () => { applyLayout(); persistWindow() })
  win.on('move', () => applyLayout())
  win.on('move', persistWindow)
  win.on('minimize', () => { pauseAuto('minimized'); updateHud() })
  // 最小化时暂停的自动模式：窗口恢复后自动继续，不用再手动点“继续自动”
  win.on('restore', () => { updateHud(); if (pausedReason === 'minimized') core.send({ t: 'auto.resume' }) })
  win.on('closed', () => { recorder.close(); overlay?.destroy() })

  const url = process.env.ELECTRON_RENDERER_URL
  if (url) await win.loadURL(url)
  else await win.loadFile(join(__dirname, '../renderer/index.html'))

  // S1 结论：先加载 about:blank，再 attach，最后才导航到游戏
  await gwc.loadURL('about:blank')
  tap = new FrameTap(gwc, {
    onOpen: (conn, u) => {
      recorder.write({ ev: 'open', conn, url: u }); core.send({ t: 'ws.open', conn, url: u })
      if (u.includes('game-gateway')) { gameConns.add(conn); autoMatch.setGameConn(true) }
    },
    onClose: (conn) => {
      recorder.write({ ev: 'close', conn }); core.send({ t: 'ws.close', conn })
      if (gameConns.delete(conn)) autoMatch.setGameConn(gameConns.size > 0)
    },
    onFrame: (conn, dir, b64) => {
      frameCount++
      recorder.write({ ev: 'frame', conn, dir, b64 })
      core.send({ t: 'frame', conn, dir, b64 })
      if (frameCount % 20 === 0) toRenderer('app:stats', { frames: frameCount })
    }
  })
  await tap.attach()
  void gwc.loadURL(GAME_URL)
}

let persistTimer: NodeJS.Timeout | null = null
function persistWindow(): void {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    if (win.isDestroyed() || win.isMinimized()) return
    const b = win.getBounds()
    settings.patch({ window: { width: b.width, height: b.height, x: b.x, y: b.y } })
  }, 400)
}

/** 记录目录、是否记录、打牌风格（掷骰 + 爱赌）；Core 重启后也要重发（见 core 的 session 命令重放） */
function sendCoreConfig(): void {
  const st = settings.get()
  const on = st.playStyle
  const parts = st.styleParts
  core.send({ t: 'config', records_dir: join(dataRoot, 'records', 'games'), records_enabled: st.recordsEnabled,
    style: { dice: on && parts.dice, gamble: on && parts.gamble, arb: on && parts.arb } })
}

// ------------------------------------------------------------------ IPC
function setupIpc(): void {
  ipcMain.handle('app:info', () => ({ dataRoot, version: app.getVersion(), platform: process.platform, protocolVersion: PROTOCOL_VERSION, packaged: app.isPackaged }))
  ipcMain.handle('settings:get', () => settings.get())
  ipcMain.handle('settings:patch', (e, p: object) => {
    const next = settings.patch(p)
    recorder.enabled = next.recordsEnabled
    overlay?.send('settings:changed', next)
    // 信息层里也能改设置（例如练习模式开关）：同步给主界面
    if (overlay?.isSender(e.sender)) toRenderer('app:event', { t: 'settings', settings: next })
    updateHud()
    if ('recordsEnabled' in p || 'playStyle' in p || 'styleParts' in p) sendCoreConfig()
    if ('sidebar' in p || 'hudReserve' in p || 'hudDock' in p) applyLayout()
    if ('autoMatch' in p || 'autoMatchRoom' in p) { autoMatch.setRoom(next.autoMatchRoom); syncAutoMatch() }
    if ('language' in p) setupMenu()                     // 菜单跟着界面语言走
    return next
  })
  ipcMain.on('mode:set', (_e, m: Mode) => {
    if (!['off', 'assist', 'auto'].includes(m)) return
    mode = m
    syncAutoMatch()
    updateHud()
    if (m !== 'auto') currentIntent = null
    core.send({ t: 'mode.set', mode: m })
  })
  ipcMain.on('auto:stop', () => stopAuto('user'))
  // 信息层：鼠标移到面板上时接收点击，离开后恢复点击穿透（只接受信息层自己发来的）
  ipcMain.on('hud:interactive', (e, v: unknown) => { if (overlay?.isSender(e.sender)) overlay.setInteractive(v === true) })
  ipcMain.on('auto:resume', () => core.send({ t: 'auto.resume' }))
  ipcMain.on('layout:sidebar', (_e, v: { width: number; collapsed: boolean }) => {
    settings.patch({ sidebar: { width: clampSidebar(v.width), collapsed: !!v.collapsed } })
    applyLayout()
  })
  ipcMain.handle('models:list', () => runModelCli(launchInput, dataRoot, ['list']).then((r) => r.lines.find((l) => Array.isArray(l)) ?? []))
  ipcMain.handle('models:import', async () => {
    const pick = await dialog.showOpenDialog(win, { title: mt(settings.get().language).importModel, properties: ['openFile'], filters: [{ name: 'PyTorch', extensions: ['pth'] }] })
    if (pick.canceled || !pick.filePaths[0]) return { canceled: true }
    const r = await runModelCli(launchInput, dataRoot, ['import', pick.filePaths[0]], (l) => toRenderer('models:progress', l))
    return { canceled: false, ok: r.ok }
  })
  ipcMain.handle('models:activate', (_e, sha: string) => {
    if (!/^[0-9a-f]{64}$/.test(sha)) return false
    const path = join(dataRoot, 'models', `${sha}.pth`)
    if (!existsSync(path)) return false
    settings.patch({ activeModel: path })
    core.send({ t: 'model.activate', path, device: settings.get().device })
    return true
  })
  ipcMain.on('stats:get', () => core.send({ t: 'stats.get' }))
  ipcMain.on('review:list', () => core.send({ t: 'review.list' }))
  ipcMain.on('review:get', (_e, file: string) => { if (typeof file === 'string') core.send({ t: 'review.get', file }) })
  ipcMain.handle('data:clearLogin', async () => { await session.fromPartition(GAME_PARTITION).clearStorageData(); gameView.webContents.reload(); return true })
  ipcMain.handle('data:clearRecords', () => {
    for (const dir of [join(dataRoot, 'records'), join(dataRoot, 'records', 'games')]) {
      try { for (const f of readdirSync(dir)) if (f.endsWith('.jsonl')) rmSync(join(dir, f)) } catch { /* 目录不存在 */ }
    }
    return true
  })
  ipcMain.handle('diag:export', () => {
    // 诊断包：版本信息 + 设置 + Core 日志尾部；不含 Cookie、账号数据或牌局记录
    const out = join(dataRoot, 'tmp', `diagnostics-${Date.now()}`)
    mkdirSync(out, { recursive: true })
    writeFileSync(join(out, 'info.json'), JSON.stringify({ app: app.getVersion(), electron: process.versions.electron, chrome: process.versions.chrome, platform: process.platform, arch: process.arch, packaged: app.isPackaged, core: core.status, protocolVersion: PROTOCOL_VERSION, frames: frameCount }, null, 2))
    writeFileSync(join(out, 'core.log'), coreLog.join(''))
    try { copyFileSync(join(dataRoot, 'settings.json'), join(out, 'settings.json')) } catch { /* 还没有设置文件 */ }
    shell.showItemInFolder(out)
    return out
  })
  ipcMain.on('game:reload', () => gameView.webContents.reload())
  ipcMain.on('data:open', () => void shell.openPath(dataRoot))
}

function setupMenu(): void {
  const m = mt(settings.get().language)
  const send = (name: string) => () => toRenderer('app:event', { t: 'shortcut', name })
  const mod = 'CommandOrControl'
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' as const }] : []),
    { role: 'editMenu' },
    {
      label: m.menuView,
      submenu: [
        { label: m.toggleAssist, accelerator: `${mod}+Shift+A`, click: send('toggle-assist') },
        { label: m.toggleHud, accelerator: `${mod}+Shift+H`, click: () => toggleHud() },
        { label: m.toggleSidebar, accelerator: `${mod}+\\`, click: send('toggle-sidebar') },
        { label: m.settings, accelerator: `${mod}+,`, click: send('settings') },
        ...[1, 2, 3, 4].map((n) => ({ label: m.tab(n), accelerator: `${mod}+${n}`, click: send(`tab-${n}`) })),
        { type: 'separator' as const },
        { role: 'reload' as const }, { role: 'toggleDevTools' as const }
      ]
    },
    { role: 'windowMenu' }
  ]))
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus() } })
app.whenReady().then(async () => {
  setupIpc()
  setupMenu()
  core.start()
  sendCoreConfig()
  const dev = join(repoRoot, 'AI/models/mortal_s42.pth')
  const model = settings.get().activeModel ?? process.env.SOUL_MODEL ?? (existsSync(dev) && !app.isPackaged ? dev : null)
  if (model) core.send({ t: 'model.activate', path: model, device: settings.get().device })
  await createWindow()
  const smokeS = Number(process.env.SOUL_SMOKE_SECONDS || 0)
  if (smokeS > 0) {
    setTimeout(() => {
      process.stdout.write('SMOKE ' + JSON.stringify({ core: core.status, frames: frameCount, ...smoke, dataRoot, gameUrl: gameView.webContents.getURL() }) + '\n')
      app.quit()
    }, smokeS * 1000)
  }
  if (!globalShortcut.register('CommandOrControl+Shift+Space', () => stopAuto('hotkey'))) {
    process.stderr.write('急停快捷键注册失败\n')
  }
})
app.on('will-quit', () => globalShortcut.unregisterAll())
app.on('window-all-closed', async () => {
  tap?.detach()
  await core.stop()
  app.quit()
})
