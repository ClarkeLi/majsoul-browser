/**
 * 开发用的“拍素材”遥控（只在开发模式 + 设置了 MB_DRIVE_DIR 时启用，打包版永远不会启用）。
 * 用来给 README / 文档拍截图和录视频：外部往 <dir>/cmd.jsonl 追加一行 JSON 命令，结果写到 <dir>/out.jsonl。
 *
 * 命令：
 *   {"op":"click","gx":8,"gy":4.5}          在游戏画面 16×9 坐标处点一下（与自动打牌同一条点击通道）
 *   {"op":"shot","name":"x"}                拍一张：主界面 / 游戏 / 信息层三层 PNG + 布局信息（之后用 ffmpeg 合成）
 *   {"op":"rec","name":"x","fps":6,"sec":30} 连续拍 sec 秒
 *   {"op":"mode","m":"auto"}                切换 关 / 辅助 / 自动
 *   {"op":"shortcut","name":"settings"}     触发界面快捷键（settings / tab-1… / toggle-sidebar）
 *   {"op":"settings","patch":{...}}         修改设置（主题、语言…）
 *   {"op":"state"}                          报告模式、阶段、暂停原因、布局
 * 它只发鼠标事件和截图，不往游戏页面注入脚本，也不碰网络。
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { BrowserWindow, NativeImage, WebContentsView } from 'electron'
import type { Rect } from '@shared/ui-map'

export interface DriveCtx {
  win: () => BrowserWindow
  game: () => WebContentsView
  hud: () => (() => Promise<NativeImage>) | null
  layout: () => { game: Rect; area: Rect }
  click: (gx: number, gy: number) => Promise<void>
  setMode: (m: 'off' | 'assist' | 'auto') => void
  shortcut: (name: string) => void
  patchSettings: (p: Record<string, unknown>) => void
  state: () => Record<string, unknown>
}

export function startDevDrive(dir: string, ctx: DriveCtx): void {
  mkdirSync(dir, { recursive: true })
  const cmdFile = join(dir, 'cmd.jsonl'), outFile = join(dir, 'out.jsonl')
  if (!existsSync(cmdFile)) writeFileSync(cmdFile, '')
  let done = readFileSync(cmdFile, 'utf8').split('\n').filter(Boolean).length
  let busy = false
  const out = (o: object): void => appendFileSync(outFile, JSON.stringify({ t: Date.now(), ...o }) + '\n')

  /** jpeg=true（录视频）：主界面与游戏层存 JPEG 省空间；信息层要透明通道，始终是 PNG */
  const shot = async (base: string, jpeg = false): Promise<void> => {
    const w = ctx.win(), g = ctx.game(), snap = ctx.hud()
    const [main, game, hud] = await Promise.all([w.webContents.capturePage(), g.webContents.capturePage(), snap ? snap() : Promise.resolve(null)])
    if (jpeg) {
      writeFileSync(`${base}-main.jpg`, main.toJPEG(88))
      writeFileSync(`${base}-game.jpg`, game.toJPEG(88))
    } else {
      writeFileSync(`${base}-main.png`, main.toPNG())
      writeFileSync(`${base}-game.png`, game.toPNG())
    }
    if (hud) writeFileSync(`${base}-hud.png`, hud.toPNG())
  }

  const run = async (c: Record<string, unknown>): Promise<void> => {
    switch (c.op) {
      case 'click': await ctx.click(Number(c.gx), Number(c.gy)); break
      case 'mode': ctx.setMode(c.m as 'off'); break
      case 'shortcut': ctx.shortcut(String(c.name)); break
      case 'settings': ctx.patchSettings((c.patch ?? {}) as Record<string, unknown>); break
      case 'state': break
      case 'shot': {
        const d = join(dir, 'shots'); mkdirSync(d, { recursive: true })
        await shot(join(d, String(c.name)))
        writeFileSync(join(d, `${c.name}.json`), JSON.stringify({ ...ctx.layout(), size: ctx.win().getContentSize() }))
        break
      }
      case 'rec': {
        const d = join(dir, 'rec', String(c.name)); mkdirSync(d, { recursive: true })
        const fps = Number(c.fps ?? 6), sec = Number(c.sec ?? 20)
        writeFileSync(join(d, 'layout.json'), JSON.stringify({ ...ctx.layout(), size: ctx.win().getContentSize(), fps }))
        const t0 = Date.now(); let i = 0
        const times: number[] = []
        while (Date.now() - t0 < sec * 1000) {
          const ts = Date.now()
          await shot(join(d, String(i).padStart(6, '0')), true)
          times.push(ts - t0); i++
          const wait = 1000 / fps - (Date.now() - ts)
          if (wait > 0) await new Promise((r) => setTimeout(r, wait))
        }
        writeFileSync(join(d, 'times.json'), JSON.stringify(times))
        out({ op: 'rec', frames: i })
        break
      }
    }
    out({ ok: true, op: c.op, name: c.name, state: ctx.state() })
  }

  setInterval(() => {
    if (busy) return
    const lines = readFileSync(cmdFile, 'utf8').split('\n').filter(Boolean)
    if (lines.length <= done) return
    const line = lines[done++]!
    busy = true
    let c: Record<string, unknown>
    try { c = JSON.parse(line) } catch { out({ ok: false, err: 'bad json', line }); busy = false; return }
    run(c).catch((e) => out({ ok: false, op: c.op, err: String(e) })).finally(() => { busy = false })
  }, 150)
  out({ ok: true, op: 'ready', state: ctx.state() })
}
