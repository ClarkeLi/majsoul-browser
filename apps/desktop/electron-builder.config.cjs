// 打包配置。先用 scripts/build-core.sh 冻结 Core（默认输出到仓库根目录 dist/soul-core），再在本目录运行：
//   pnpm package:mac-arm64 | package:mac-x64 | package:win | package:linux
// 环境变量：SOUL_CORE_DIST 覆盖 Core 目录，SOUL_DIST_OUT 覆盖输出目录（默认仓库根目录 release/）。
const { resolve } = require('node:path')
const coreDist = process.env.SOUL_CORE_DIST || resolve(__dirname, '../../dist/soul-core')

module.exports = {
  appId: 'io.github.clarkeli.majsoul-browser',
  productName: 'Majsoul-Browser',
  directories: { output: process.env.SOUL_DIST_OUT || resolve(__dirname, '../../release') },
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  files: ['out/**', 'package.json'],
  extraResources: [{ from: coreDist, to: 'core', filter: ['**/*'] }],
  asar: true,
  icon: 'build/icon.png',
  // 架构由命令行 --arm64 / --x64 指定
  mac: { target: ['zip'], identity: null, category: 'public.app-category.games' },
  win: { target: ['zip'], signAndEditExecutable: false },
  linux: { target: ['AppImage', 'tar.gz'], category: 'Game', maintainer: 'Clarke Li', synopsis: 'Mahjong Soul browser with a local Mortal AI assistant' },
  // 数据放在 .app / exe / AppImage 同级的 MajsoulBrowserData，不写用户目录；不做自动更新
  publish: null
}
