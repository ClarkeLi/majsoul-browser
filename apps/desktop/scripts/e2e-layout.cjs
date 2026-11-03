// 布局 E2E：在最小窗口（1280×760）里加载 mock 对局，核对侧栏卡片区确实可以滚动、没有被截断。
const { app, BrowserWindow } = require('electron')
const { join, resolve } = require('node:path')
const assert = require('node:assert/strict')
app.setPath('userData', resolve(__dirname, '../../../.data/e2e-layout'))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

app.whenReady().then(async () => {
  let failed = 0
  const check = async (name, fn) => { try { await fn(); console.log('ok  ', name) } catch (e) { failed++; console.log('FAIL', name, e.message) } }
  const win = new BrowserWindow({ width: 1280, height: 760, show: false, webPreferences: { offscreen: true } })
  for (const [scn, sb] of [['discard', 400], ['opponent-riichi', 340], ['tenpai', 520]]) {
    await check(`${scn} @ 侧栏 ${sb}`, async () => {
      await win.loadURL('about:blank')
      await win.loadFile(join(__dirname, '../out/renderer/index.html'), { hash: `/mock/${scn}?theme=dark&sidebar=${sb}` })
      await sleep(500)
      const r = await win.webContents.executeJavaScript(`(() => {
        const el = document.querySelector('[data-testid="match-scroll"]')
        const doc = document.documentElement
        const before = el.scrollTop
        el.scrollTop = 120
        return { client: el.clientHeight, scrollH: el.scrollHeight, top: el.scrollTop, before,
                 bottom: el.getBoundingClientRect().bottom, win: window.innerHeight, docScroll: doc.scrollHeight }
      })()`)
      assert.ok(r.scrollH > r.client, `卡片内容应超过可视高度（${r.scrollH} > ${r.client}）`)
      assert.ok(r.top > r.before, `scrollTop 应该能变化：${r.before} -> ${r.top}`)
      assert.ok(r.bottom <= r.win - 24 + 1, `滚动区底部 ${r.bottom} 不应越过状态栏（窗口 ${r.win}）`)
      assert.ok(r.client > 150, `滚动区应有足够高度：${r.client}`)
    })
  }
  console.log(failed ? `${failed} FAILED` : 'ALL OK')
  app.exit(failed ? 1 : 0)
})
