// 生成应用图标（「和・卓上」风格）：藍色圆角底 + 青海波纹 + 一张斜放的麻将牌，牌面是朱色宋体“魂”。
// 输出 build/icon.png（1024×1024，electron-builder 打包用）与 resources/icon.png（512×512，开发时 Dock / 窗口图标）。
// 用法：pnpm exec electron scripts/make-icon.cjs     依赖系统字体 Songti SC（macOS 自带）。
const { app, BrowserWindow, nativeImage } = require('electron')
const { writeFileSync, mkdirSync } = require('node:fs')
const { resolve } = require('node:path')

// 青海波：每个“鳞”是实底圆 + 三道同心线，逐行叠放（后画的盖住前面的上半）
const wave = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="92" fill="#1a2b45"/>` + [84, 62, 40].map((r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#2c4874" stroke-width="7"/>`).join('')
let waves = ''
for (let row = 0; row < 13; row++) for (let col = -1; col < 7; col++) waves += wave(col * 184 + (row % 2 ? 92 : 0) + 40, 500 + row * 46)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <clipPath id="sq"><rect x="100" y="100" width="824" height="824" rx="186"/></clipPath>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.40" stop-color="#1a2b45" stop-opacity="1"/><stop offset="0.66" stop-color="#1a2b45" stop-opacity="0"/></linearGradient>
  </defs>
  <!-- 落在桌面上的影子（macOS 图标网格：824 主体 + 外圈留白） -->
  <rect x="100" y="118" width="824" height="824" rx="186" fill="#000" opacity="0.28"/>
  <g clip-path="url(#sq)">
    <rect x="100" y="100" width="824" height="824" fill="#1a2b45"/>
    ${waves}
    <rect x="100" y="100" width="824" height="824" fill="url(#fade)"/>
  </g>
  <rect x="104" y="104" width="816" height="816" rx="182" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="8"/>
  <!-- 千点棒：斜插在牌后面，中间一个朱点 -->
  <g transform="rotate(-28 540 690)">
    <rect x="200" y="672" width="680" height="38" rx="19" fill="#f6f1e4"/>
    <circle cx="822" cy="691" r="12" fill="#d93f28"/>
  </g>
  <!-- 麻将牌：青竹色牌背 + 生成り牌面，略向左倾 -->
  <g transform="rotate(-7 512 520)">
    <rect x="300" y="236" width="424" height="566" rx="58" fill="#0b0c0f" opacity="0.35" transform="translate(10 30)"/>
    <rect x="300" y="236" width="424" height="566" rx="58" fill="#2f9a68"/>
    <rect x="300" y="236" width="424" height="530" rx="58" fill="#f6f1e4"/>
    <rect x="300" y="236" width="424" height="530" rx="58" fill="none" stroke="#d9cfb8" stroke-width="6"/>
    <text x="512" y="618" text-anchor="middle" font-family="Songti SC" font-weight="900" font-size="330" fill="#d93f28">魂</text>
  </g>
</svg>`

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1024, height: 1024, show: false, transparent: true, frame: false, webPreferences: { offscreen: true } })
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<meta charset=utf-8><style>html,body{margin:0;background:transparent}</style>${svg}`))
  await new Promise((r) => setTimeout(r, 600))
  const img = await win.webContents.capturePage()
  const root = resolve(__dirname, '..')
  mkdirSync(resolve(root, 'build'), { recursive: true })
  writeFileSync(resolve(root, 'build/icon.png'), img.toPNG())
  writeFileSync(resolve(root, 'resources/icon.png'), nativeImage.createFromBuffer(img.toPNG()).resize({ width: 512, height: 512, quality: 'best' }).toPNG())
  writeFileSync(resolve(root, 'resources/icon.svg'), svg)
  console.log('icon written')
  app.quit()
})
