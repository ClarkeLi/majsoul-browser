// 信息层检查：把 #/hud-mock/<场景> 渲染成透明 PNG，再合成到一张真实对局截图上，输出到 test/design-shots/hud-*.png
// 背景默认用参考仓库里的真实对局截图（_ref/MahjongCopilot/assets/shot3.png，画面区域从 y=43 开始，1281×720）。
const { app, BrowserWindow } = require('electron')
const { mkdirSync, writeFileSync, existsSync } = require('node:fs')
const { join, resolve } = require('node:path')
// [输出名, 场景, 额外查询]：practice=1 练习模式答案隐藏；expand=1 教练卡展开；hover=N 悬停第 N 张手牌
const SHOTS = [
  ['discard', 'discard', ''], ['riichi', 'riichi', ''], ['call-chi', 'call-chi', ''], ['opponent-riichi', 'opponent-riichi', ''], ['tenpai', 'tenpai', ''],
  ['all-last', 'all-last', ''], ['practice', 'discard', '&practice=1'], ['expanded', 'opponent-riichi', '&expand=1'], ['hover', 'opponent-riichi', '&hover=10'],
  ['light', 'opponent-riichi', '&theme=light'], ['melds', 'melds', ''], ['tenpai-values', 'tenpai', ''], ['points', 'points', ''],
  ['fx-tenpai', 'discard', '&fx=tenpai'], ['fx-combo', 'discard', '&fx=combo'], ['fx-miss', 'opponent-riichi', '&fx=miss'], ['fx-riichi', 'opponent-riichi', '&fx=riichi'], ['fx-rank', 'all-last', '&fx=rank']
]
const list = process.argv.slice(2); const names = SHOTS.filter(([n]) => !list.length || list.includes(n))
const repo = resolve(__dirname, '../../..'); const outDir = join(repo, 'test/design-shots'); mkdirSync(outDir, { recursive: true })
const bg = process.env.HUD_BG || join(repo, '_ref/MahjongCopilot/assets/shot3.png')
const tmp = join(repo, '.toolchain/tmp'); mkdirSync(tmp, { recursive: true })
app.setPath('userData', join(repo, '.data/hud-shots'))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const W = 1280, TOP = 34, BOT = 92, GH = 720, H = GH + TOP + BOT   // 信息层窗口 = 上栏 + 画面 + 下栏

app.whenReady().then(async () => {
  const hud = new BrowserWindow({ width: W, height: H, show: false, transparent: true, frame: false, webPreferences: { offscreen: true, sandbox: true } })
  const comp = new BrowserWindow({ width: W, height: H, show: false, webPreferences: { offscreen: true } })
  for (const [name, scn, q] of names) {
    await hud.loadURL('about:blank')
    await hud.loadFile(join(__dirname, '../out/renderer/index.html'), { hash: `/hud-mock/${scn}?${q.includes("theme=") ? q.slice(1) : "theme=dark" + q}` })
    await sleep(700)
    const png = (await hud.webContents.capturePage()).toPNG()
    const hudFile = join(tmp, `hud-${name}.png`); writeFileSync(hudFile, png)
    writeFileSync(join(outDir, `hud-only-${name}.png`), png)
    if (existsSync(bg)) {
      const html = `<body style="margin:0;width:${W}px;height:${H}px;overflow:hidden;position:relative;background:#0E1116"><div style="position:absolute;left:0;top:${TOP}px;width:${W}px;height:${GH}px;background:url('file://${bg}') 0 -43px / 1281px auto no-repeat"></div><img src="file://${hudFile}" style="position:absolute;inset:0;width:${W}px;height:${H}px"></body>`
      const f = join(tmp, 'comp.html'); writeFileSync(f, html)
      await comp.loadFile(f); await sleep(400)
      writeFileSync(join(outDir, `hud-${name}.png`), (await comp.webContents.capturePage()).toPNG())
    }
  }
  console.log(`saved ${names.length} hud shots (bg ${existsSync(bg) ? 'real screenshot' : 'none'})`)
  app.quit()
})
