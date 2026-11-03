import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { coreSubcommand, type LaunchInput } from './core-launch'

/** 调用 Core 的模型 CLI（开发：python -m soul_core.models；打包：soul-core models），逐行回调 JSON 进度。 */
export function runModelCli(input: LaunchInput, dataRoot: string, args: string[], onLine?: (l: unknown) => void): Promise<{ ok: boolean; lines: unknown[] }> {
  const l = coreSubcommand(input, 'soul_core.models', 'models')
  const tmp = join(dataRoot, 'tmp')
  const full = [...l.args, ...args, '--root', dataRoot]
  return new Promise((resolve) => {
    const p = spawn(l.command, full, {
      cwd: l.cwd,
      env: { ...process.env, TMPDIR: tmp, TEMP: tmp, TMP: tmp, TORCH_HOME: join(dataRoot, 'cache', 'torch'), PYTHONPYCACHEPREFIX: join(tmp, 'pycache') }
    })
    const lines: unknown[] = []
    createInterface({ input: p.stdout }).on('line', (line) => {
      try { const o = JSON.parse(line); lines.push(o); onLine?.(o) } catch { /* 忽略非 JSON */ }
    })
    p.on('error', (e) => { const o = { error: e.message, code: 'spawn_failed' }; lines.push(o); onLine?.(o); resolve({ ok: false, lines }) })
    p.on('exit', (code) => resolve({ ok: code === 0, lines }))
  })
}
