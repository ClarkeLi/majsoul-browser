import { type WriteStream, createWriteStream } from 'node:fs'
import { join } from 'node:path'

/** 把原始帧录到 records/frames-<时间>.jsonl（可关闭）；同一格式也是回放测试的 fixture 来源。 */
export class FrameRecorder {
  private out: WriteStream | null = null
  constructor(private dir: string, public enabled: boolean) {}
  private stream(): WriteStream {
    if (!this.out) this.out = createWriteStream(join(this.dir, `frames-${Date.now()}.jsonl`), { flags: 'a' })
    return this.out
  }
  write(o: object): void {
    if (this.enabled) this.stream().write(JSON.stringify({ t: Date.now(), ...o }) + '\n')
  }
  close(): void { this.out?.end(); this.out = null }
}
