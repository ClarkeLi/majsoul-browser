import { type ChildProcess, spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { createInterface } from 'node:readline'
import { PROTOCOL_VERSION, type CoreCommand, type CoreMessage } from '@shared/protocol'

export interface CoreLaunch { command: string; args: string[]; cwd: string; env: NodeJS.ProcessEnv }
export type CoreState = 'starting' | 'running' | 'restarting' | 'failed' | 'stopped'

/** 拉起并监督 Python Core（NDJSON over stdio）。崩溃后指数退避重启，并回放“会话级命令”。 */
export class CoreClient extends EventEmitter {
  private proc: ChildProcess | null = null
  private state: CoreState = 'stopped'
  private restarts = 0
  private stopping = false
  private sticky = new Map<string, CoreCommand>()   // config / mode.set / model.activate，重启后重发
  private timer: NodeJS.Timeout | null = null

  constructor(private launch: () => CoreLaunch) { super() }

  get status(): CoreState { return this.state }

  private setState(s: CoreState, detail?: string): void {
    this.state = s
    this.emit('status', s, detail)
  }

  start(): void {
    this.stopping = false
    this.spawnProc()
  }

  private spawnProc(): void {
    const l = this.launch()
    this.setState(this.restarts ? 'restarting' : 'starting')
    const p = spawn(l.command, l.args, { cwd: l.cwd, env: l.env, stdio: ['pipe', 'pipe', 'pipe'] })
    this.proc = p
    let ready = false
    p.stderr?.on('data', (b: Buffer) => this.emit('log', b.toString()))
    createInterface({ input: p.stdout! }).on('line', (line) => {
      let msg: CoreMessage
      try { msg = JSON.parse(line) as CoreMessage } catch { return }
      if (msg.t === 'ready') {
        if (msg.protocolVersion !== PROTOCOL_VERSION) {
          this.emit('fatal', `Core 协议版本 ${msg.protocolVersion} 与应用 ${PROTOCOL_VERSION} 不一致`)
          this.stopping = true
          p.kill()
          this.setState('failed', '协议版本不一致')
          return
        }
        ready = true
        this.restarts = 0
        this.setState('running')
        this.rawSend({ t: 'hello', protocolVersion: PROTOCOL_VERSION })
        for (const c of this.sticky.values()) this.rawSend(c)
      }
      this.emit('message', msg)
    })
    p.on('error', (e) => this.emit('log', `Core 启动失败：${e.message}\n`))
    p.on('exit', (code) => {
      if (this.proc === p) this.proc = null
      if (this.stopping) { this.setState('stopped'); return }
      this.emit('log', `Core 退出（code=${code}）${ready ? '' : '，尚未就绪'}\n`)
      this.restarts++
      if (this.restarts > 5) { this.setState('failed', 'Core 反复崩溃'); return }
      this.setState('restarting')
      const delay = Math.min(5000, 500 * 2 ** (this.restarts - 1))
      this.timer = setTimeout(() => this.spawnProc(), delay)
    })
  }

  private rawSend(cmd: CoreCommand): void {
    const p = this.proc
    if (!p || !p.stdin || p.stdin.destroyed) return
    p.stdin.write(JSON.stringify(cmd) + '\n')
  }

  send(cmd: CoreCommand): void {
    if (cmd.t === 'config' || cmd.t === 'mode.set' || cmd.t === 'model.activate') this.sticky.set(cmd.t, cmd)
    if (this.state === 'running') this.rawSend(cmd)
  }

  async stop(): Promise<void> {
    this.stopping = true
    if (this.timer) clearTimeout(this.timer)
    const p = this.proc
    if (!p) return
    this.rawSend({ t: 'shutdown' })
    await new Promise<void>((resolve) => {
      const k = setTimeout(() => { p.kill('SIGKILL'); resolve() }, 3000)
      p.once('exit', () => { clearTimeout(k); resolve() })
    })
  }
}
