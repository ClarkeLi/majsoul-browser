// 设计自检截图（PLAN §8.12）：每个 mock 场景 × {dark, light} × 侧栏 {340, 480}。
// 用法：pnpm design:shots [scenario ...]；输出到 <repo>/test/design-shots/
const { app, BrowserWindow } = require('electron')
const { mkdirSync, writeFileSync } = require('node:fs')
const { join, resolve } = require('node:path')

const SCENARIOS = ['discard', 'riichi', 'call-chi', 'auto-executing', 'auto-paused', 'opponent-riichi',
  'empty-disconnected', 'unsupported-3p', 'desynced', 'no-model',
  'models', 'models-importing', 'review', 'review-detail', 'settings', 'stats', 'wizard', 'tenpai', 'points']
const only = process.argv.slice(2).filter((a) => SCENARIOS.includes(a))
const list = only.length ? only : SCENARIOS
const outDir = resolve(__dirname, '../../../test/design-shots')
mkdirSync(outDir, { recursive: true })
app.setPath('userData', resolve(__dirname, '../../../.data/shots'))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

app.whenReady().then(async () => {
  const W = 1600, H = Number(process.env.SHOTS_H || 1400)   // SHOTS_H=3200 可以看到侧栏下方的卡片
  const win = new BrowserWindow({ width: W, height: H, show: false, webPreferences: { sandbox: true, offscreen: true } })
  // 只改 hash 不会重新挂载页面：每次都先 about:blank 再加载
  const load = async (hash) => {
    await win.loadURL('about:blank')
    await win.loadFile(join(__dirname, '../out/renderer/index.html'), { hash })
    await sleep(400)
  }
  for (const name of list) for (const theme of ['dark', 'light']) for (const sb of [340, 480]) {
    await load(`/mock/${name}?theme=${theme}&sidebar=${sb}`)
    const img = await win.webContents.capturePage({ x: W - sb, y: 44, width: sb, height: H - 44 - 24 })
    writeFileSync(join(outDir, `${name}-${theme}-${sb}.png`), img.toPNG())
  }
  // 整窗口（含顶栏/状态栏）各抓一张：深色 400
  for (const name of ['discard', 'auto-executing']) {
    await load(`/mock/${name}?theme=dark&sidebar=400`)
    writeFileSync(join(outDir, `window-${name}.png`), (await win.webContents.capturePage()).toPNG())
  }
  console.log(`saved ${list.length * 4} shots to ${outDir}`)
  app.quit()
})
