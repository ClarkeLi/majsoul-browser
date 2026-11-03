// E2E：真实 webContents.sendInputEvent -> 假 Canvas 页面，核对点击坐标与“零重复点”。
// 用法：node scripts/e2e-click.cjs（内部会先用 rolldown 打包 click-executor/ui-map）
const { spawnSync } = require('node:child_process')
const { resolve, join } = require('node:path')
const root = resolve(__dirname, '..')

if (!process.versions.electron) {
  const { rolldown } = require('rolldown')
  ;(async () => {
    const b = await rolldown({ input: join(root, 'scripts/e2e-entry.ts'), platform: 'node', external: ['electron'], resolve: { alias: { '@shared': join(root, 'src/shared') } } })
    await b.write({ file: join(root, 'out/e2e/entry.cjs'), format: 'cjs' })
    const r = spawnSync(join(root, 'node_modules/.bin/electron'), [__filename], { stdio: 'inherit', env: process.env })
    process.exit(r.status ?? 1)
  })()
  return
}

const { app, BrowserWindow, WebContentsView } = require('electron')
const assert = require('node:assert/strict')
app.setPath('userData', resolve(root, '../../.data/e2e'))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

app.whenReady().then(async () => {
  const { ClickExecutor, stepToPoint, FrameTap } = require(join(root, 'out/e2e/entry.cjs'))
  const win = new BrowserWindow({ width: 1280, height: 760, show: false, webPreferences: { offscreen: true } })
  const view = new WebContentsView({ webPreferences: { sandbox: true } })
  win.contentView.addChildView(view)
  await view.webContents.loadFile(resolve(root, '../../test/fake-canvas/index.html'))
  const wc = view.webContents
  const tap = new FrameTap(wc, { onOpen() {}, onClose() {}, onFrame() {} })
  await tap.attach()                 // 页面已渲染，Network.enable 不会挂起；同时开启焦点模拟
  await sleep(200)
  const backends = {
    sendInputEvent: {
      move: (x, y) => wc.sendInputEvent({ type: 'mouseMove', x, y }),
      down: (x, y) => wc.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 }),
      up: (x, y) => wc.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 })
    },
    cdp: { move: (x, y) => tap.dispatchMouse('mouseMoved', x, y), down: (x, y) => tap.dispatchMouse('mousePressed', x, y), up: (x, y) => tap.dispatchMouse('mouseReleased', x, y) }
  }
  let failed = 0
  const check = (name, fn) => fn().then(() => console.log('ok  ', name), (e) => { failed++; console.log('FAIL', name, e.message) })

  const run = async (bounds, steps, backend = 'sendInputEvent') => {
    view.setBounds(bounds)
    await sleep(120)
    await wc.executeJavaScript('window.__reset()')
    const ex = new ClickExecutor({
      sink: backends[backend],
      getRect: () => ({ x: 0, y: 0, w: bounds.width, h: bounds.height }),
      canRun: () => true,
      sleep
    }, { preDelayMs: 0, stepDelayMs: 20, pressMs: 20 })
    const res = await ex.run({ steps }, () => true)
    await sleep(120)
    const events = await wc.executeJavaScript('window.__events')
    return { res, events, rect: { x: 0, y: 0, w: bounds.width, h: bounds.height } }
  }

  const intents = {
    discardDrawn: [{ t: 'hand', index: 13, gap: true }],
    riichi: [{ t: 'button', slot: 2 }, { t: 'hand', index: 5, gap: false }],
    chi3: [{ t: 'button', slot: 3 }, { t: 'candidate', index: 2, count: 3, kan: false }],
    pass: [{ t: 'button', slot: 0 }]
  }
  const layouts = { '宽侧栏收起': { x: 0, y: 44, width: 1200, height: 675 }, '侧栏展开': { x: 0, y: 44, width: 880, height: 495 }, 'letterbox 居中': { x: 40, y: 100, width: 800, height: 450 } }

  for (const backend of ['sendInputEvent', 'cdp'])
  for (const [lname, bounds] of Object.entries(layouts)) {
    for (const [iname, steps] of Object.entries(intents)) {
      await check(`[${backend}] ${iname} @ ${lname}`, async () => {
        const { res, events, rect } = await run(bounds, steps, backend)
        assert.ok(events.filter((e) => e.type === 'mousedown').every((e) => e.focus === true), '点击时页面应认为自己有焦点（窗口实际未聚焦）')
        assert.equal(res.ok, true)
        const downs = events.filter((e) => e.type === 'mousedown')
        const ups = events.filter((e) => e.type === 'mouseup')
        assert.equal(downs.length, steps.length, '每步恰好一次 mousedown（零重复点）')
        assert.equal(ups.length, steps.length)
        steps.forEach((s, i) => {
          const p = stepToPoint(s, rect)
          assert.ok(Math.abs(downs[i].x - p.x) <= 1 && Math.abs(downs[i].y - p.y) <= 1, `第 ${i} 步坐标 ${downs[i].x},${downs[i].y} != ${p.x},${p.y}`)
        })
      })
    }
  }
  await check('intent 中途失效：不再继续点', async () => {
    view.setBounds(layouts['侧栏展开']); await sleep(100); await wc.executeJavaScript('window.__reset()')
    let valid = true
    const ex = new ClickExecutor({ sink: { move: (x, y) => wc.sendInputEvent({ type: 'mouseMove', x, y }), down: (x, y) => { wc.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 }); valid = false }, up: (x, y) => wc.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 }) }, getRect: () => ({ x: 0, y: 0, w: 880, h: 495 }), canRun: () => true, sleep }, { preDelayMs: 0, stepDelayMs: 10, pressMs: 10 })
    const res = await ex.run({ steps: intents.chi3 }, () => valid)
    await sleep(100)
    const downs = (await wc.executeJavaScript('window.__events')).filter((e) => e.type === 'mousedown')
    assert.equal(downs.length, 1)
    assert.equal(res.ok, false)
  })
  console.log(failed ? `${failed} FAILED` : 'ALL OK')
  app.exit(failed ? 1 : 0)
})
