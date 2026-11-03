import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { CoreMessage } from '@shared/protocol'
import { CoreClient } from './core-client'

const repo = resolve(__dirname, '../../../..')
const py = join(repo, 'core/.venv/bin/python')
const have = existsSync(py)

function client() {
  return new CoreClient(() => ({ command: py, args: ['-m', 'soul_core.main'], cwd: join(repo, 'core'), env: { ...process.env, PYTHONUNBUFFERED: '1' } }))
}
const until = async (cond: () => boolean, ms = 15000): Promise<void> => {
  const t0 = Date.now()
  while (!cond()) {
    if (Date.now() - t0 > ms) throw new Error('timeout')
    await new Promise((r) => setTimeout(r, 50))
  }
}

describe.skipIf(!have)('CoreClient 监督', () => {
  it('启动握手 → kill -9 后自动重启并重发会话级命令', async () => {
    const c = client()
    const msgs: CoreMessage[] = []
    const states: string[] = []
    c.on('message', (m: CoreMessage) => msgs.push(m))
    c.on('status', (s: string) => states.push(s))
    c.start()
    await until(() => c.status === 'running')
    c.send({ t: 'mode.set', mode: 'assist' })
    await until(() => msgs.some((m) => m.t === 'session.status' && m.mode === 'assist'))

    const readyBefore = msgs.filter((m) => m.t === 'ready').length
    // @ts-expect-error 测试里直接取子进程
    const pid: number = c.proc.pid
    process.kill(pid, 'SIGKILL')
    await until(() => msgs.filter((m) => m.t === 'ready').length > readyBefore, 20000)
    expect(states).toContain('restarting')
    // 重启后 mode.set 被重发：新的 Core 应报告 assist
    await until(() => msgs.slice(-5).some((m) => m.t === 'session.status' && m.mode === 'assist'))
    await c.stop()
    expect(c.status).toBe('stopped')
  }, 60000)

  it('stop() 之后不会再重启', async () => {
    const c = client()
    c.start()
    await until(() => c.status === 'running')
    await c.stop()
    await new Promise((r) => setTimeout(r, 1500))
    expect(c.status).toBe('stopped')
  }, 30000)
})
