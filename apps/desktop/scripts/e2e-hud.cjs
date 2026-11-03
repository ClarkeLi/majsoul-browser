// 信息层 E2E：在 1280×720 的画面里渲染各个 mock 场景，逐像素断言
//  1) 所有“必须保持透明”的区域（牌桌、按钮、候选行、读秒、手牌行、头像、侧栏按钮…）alpha 全为 0
//  2) 左/右/下沿教学条/危险度条确实画出来了（有不透明像素）
//  3) 开启高亮框时，推荐牌位置有金色边框
const { spawnSync } = require('node:child_process')
const { resolve, join } = require('node:path')
const root = resolve(__dirname, '..')
if (!process.versions.electron) {
  ;(async () => {
    const { rolldown } = require('rolldown')
    const b = await rolldown({ input: join(root, 'scripts/e2e-entry.ts'), platform: 'node', external: ['electron'], resolve: { alias: { '@shared': join(root, 'src/shared') } } })
    await b.write({ file: join(root, 'out/e2e/entry.cjs'), format: 'cjs' })
    process.exit(spawnSync(join(root, 'node_modules/.bin/electron'), [__filename], { stdio: 'inherit' }).status ?? 1)
  })()
  return
}
const { app, BrowserWindow } = require('electron')
const assert = require('node:assert/strict')
app.setPath('userData', resolve(root, '../../.data/e2e-hud'))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const W = 1280, H = 846   // 上栏 34 + 画面 720 + 下栏 92（预留）

app.whenReady().then(async () => {
  const { KEEP_CLEAR, ZONES, fitGame } = require(join(root, 'out/e2e/entry.cjs'))
  const fit = fitGame(W, H, { reserve: true, dock: 'split' })
  const GX = fit.game.x, GY = fit.game.y, U = fit.game.w / 16
  assert.equal(fit.game.w, 1280); assert.equal(fit.game.h, 720)
  let failed = 0
  const check = async (name, fn) => { try { await fn(); console.log('ok  ', name) } catch (e) { failed++; console.log('FAIL', name, e.message) } }
  const win = new BrowserWindow({ width: W, height: H, useContentSize: true, show: false, transparent: true, frame: false, webPreferences: { offscreen: true, sandbox: true } })
  const render = async (scn, query = '') => {
    await win.loadURL('about:blank')
    await win.loadFile(join(root, 'out/renderer/index.html'), { hash: `/hud-mock/${scn}?theme=dark${query}` })
    await sleep(900)
    const img = await win.webContents.capturePage()
    const { width, height } = img.getSize()
    const bmp = img.toBitmap()
    const alpha = (x, y) => bmp[(Math.min(height - 1, Math.round((y * height) / H)) * width + Math.min(width - 1, Math.round((x * width) / W))) * 4 + 3]
    const opaqueIn = (x0, y0, x1, y1) => { let n = 0; for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) if (alpha(x, y) > 40) n++; return n }
    return { alpha, opaqueIn, width, height }
  }
  const scenarios = ['discard', 'riichi', 'call-chi', 'opponent-riichi', 'tenpai', 'all-last']
  for (const scn of scenarios) {
    for (const scale of [1, 1.1]) {
      await check(`不遮挡 [${scn} ×${scale}]`, async () => {
        const r = await render(scn, `&rings=0&scale=${scale}`)
        for (const z of KEEP_CLEAR) {
          if (z.only && !z.only.includes(scn)) continue
          const n = r.opaqueIn(GX + Math.round(z.x * U), GY + Math.round(z.y * U), GX + Math.round((z.x + z.w) * U), GY + Math.round((z.y + z.h) * U))
          assert.equal(n, 0, `「${z.id}」被信息层遮挡了（${n} 个采样点不透明）`)
        }
      })
    }
  }
  await check('信息层确实画出了内容（教练卡/对手卡/危险度条/下栏押引面板）', async () => {
    const r = await render('opponent-riichi', '&rings=0')
    const area = (z) => r.opaqueIn(GX + Math.round(z.x * U), GY + Math.round(z.y * U), GX + Math.round((z.x + (z.w ?? 2)) * U), GY + Math.round((z.y + (z.h ?? 1)) * U))
    assert.ok(area({ x: ZONES.left.x, y: 6.0, w: ZONES.left.w, h: 1.3 }) > 200, '左下教练卡')
    assert.ok(area({ x: ZONES.right.x, y: ZONES.right.y, w: ZONES.right.w, h: 1.5 }) > 200, '右侧对手卡')
    assert.ok(area({ x: 2.0, y: ZONES.bars.y - 0.02, w: 11, h: 0.12 }) > 20, '手牌危险度条')
    assert.ok(r.opaqueIn(Math.round(W * 0.66), fit.bottom.y + 10, W - 20, H - 10) > 400, '下栏右侧的押引面板')
  })
  await check('练习模式：答案隐藏时不画推荐高亮框', async () => {
    const r = await render('discard', '&practice=1')
    const cx = GX + (12.509375 + 0.246875) * U, cy = GY + 8.3625 * U, halfW = (U * 0.74) / 2
    let gold = 0
    for (let dx = -3; dx <= 3; dx++) if (r.alpha(cx - halfW + dx, cy) > 100) gold++
    assert.equal(gold, 0, '练习模式下不应该提前显示答案')
  })
  for (const q of ['&practice=1', '&hover=3', '&scale=1.1']) {
    await check(`不遮挡（教练卡/对手卡最大尺寸） [${q}]`, async () => {
      const r = await render('opponent-riichi', `&rings=0${q}`)
      for (const z of KEEP_CLEAR) {
        if (z.only) continue
        // 悬停手牌时的说明气泡本来就画在手牌上方（只在鼠标停留时出现、点击穿透），跳过按钮区
        if (q === '&hover=3' && (z.id === '操作按钮区' || z.id === '自家头像')) continue
        const n = r.opaqueIn(GX + Math.round(z.x * U), GY + Math.round(z.y * U), GX + Math.round((z.x + z.w) * U), GY + Math.round((z.y + z.h) * U))
        assert.equal(n, 0, `「${z.id}」被信息层遮挡了（${n} 个采样点不透明）`)
      }
    })
  }
  for (const fx of ['tenpai', 'combo', 'miss', 'riichi', 'rank']) {
    await check(`不遮挡（事件横幅 ${fx}）`, async () => {
      const r = await render('discard', `&rings=0&fx=${fx}`)
      for (const z of KEEP_CLEAR) {
        if (z.only) continue
        const n = r.opaqueIn(GX + Math.round(z.x * U), GY + Math.round(z.y * U), GX + Math.round((z.x + z.w) * U), GY + Math.round((z.y + z.h) * U))
        assert.equal(n, 0, `「${z.id}」被横幅遮挡了（${n} 个采样点不透明）`)
      }
      assert.ok(r.opaqueIn(GX + Math.round(5.5 * U), GY + Math.round(5.25 * U), GX + Math.round(10 * U), GY + Math.round(5.7 * U)) > 100, '横幅应当画出来')
    })
  }
  await check('没有下栏时教学提示退回画面里的教学条', async () => {
    win.setSize(1280, 720); await sleep(200)
    const r = await render('opponent-riichi', '&rings=0')
    const f = fitGame(1280, 720, { reserve: true, dock: 'split' })
    if (f.bottom.h < 70) {
      const u = f.game.w / 16
      assert.ok(r.opaqueIn(f.game.x + Math.round(ZONES.strip.x * u), f.game.y + Math.round(ZONES.strip.y * u), f.game.x + Math.round((ZONES.strip.x + ZONES.strip.w) * u), f.game.y + Math.round((ZONES.strip.y + 0.5) * u)) > 100, '教学条')
    }
    win.setSize(W, H); await sleep(200)
  })
  await check('上下信息栏有内容，且只在画面之外', async () => {
    const r = await render('discard', '&rings=0')
    assert.ok(r.opaqueIn(0, 0, W, fit.top.h) > 300, '上信息栏应显示局况/点数')
    assert.ok(r.opaqueIn(0, fit.bottom.y, W, H) > 600, '下信息栏应显示手牌分组')
    const t = await render('tenpai', '&rings=0')
    assert.ok(t.opaqueIn(0, fit.bottom.y, W, H) > 600, '听牌场景的下信息栏')
  })
  await check('窗口比 16:9 更矮时信息栏自适应（画面缩小，栏仍然在）', async () => {
    win.setSize(1280, 700); await sleep(200)
    const r = await render('discard', '&rings=0')
    const f = fitGame(1280, 700, { reserve: true, dock: 'split' })
    assert.ok(f.game.h < 720 && f.bottom.h >= 91 && f.top.h >= 34, `fit: ${JSON.stringify(f.game)}`)
    assert.ok(r.opaqueIn(0, f.bottom.y, 1280, 700) > 300, '下栏仍有内容')
    win.setSize(W, H); await sleep(200)
  })
  await check('高亮框：推荐牌（摸到的牌）上有金色边框', async () => {
    const r = await render('discard', '')
    // 第 14 张（摸到的牌）中心 x = TEHAI_X[13] + TRUMO_SPACE
    const cx = GX + (12.509375 + 0.246875) * U, cy = GY + 8.3625 * U, halfW = (U * 0.74) / 2
    let gold = 0
    for (let dx = -3; dx <= 3; dx++) if (r.alpha(cx - halfW + dx, cy) > 100) gold++
    assert.ok(gold > 0, '没有找到高亮边框')
  })
  console.log(failed ? `${failed} FAILED` : 'ALL OK')
  app.exit(failed ? 1 : 0)
})
