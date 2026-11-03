import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const DATA_DIR_NAME = 'MajsoulBrowserData'
export const SUBDIRS = ['profile', 'models', 'records', 'logs', 'tmp', 'crash'] as const

export type DataRootErrorCode = 'translocated' | 'notWritable'

/** 数据目录不可用。message 只用于日志；给用户看的文字由主进程按语言生成（见 main/i18n.ts）。 */
export class DataRootError extends Error {
  constructor(public readonly code: DataRootErrorCode, public readonly detail: { root?: string; cause?: string } = {}) {
    super(`${code}${detail.root ? `: ${detail.root}` : ''}${detail.cause ? ` (${detail.cause})` : ''}`)
  }
}

export interface ResolveInput {
  env: Record<string, string | undefined>
  isPackaged: boolean
  platform: NodeJS.Platform
  /** 可执行文件路径（process.execPath） */
  exePath: string
  /** 开发模式下的仓库根目录 */
  repoRoot: string
}

/** 解析优先级：环境变量 → 开发模式 `.data/` → macOS `.app` 所在目录 → Linux AppImage 文件旁 → Windows/Linux 可执行文件同级。 */
export function resolveDataRoot(i: ResolveInput): string {
  if (i.env.MAJSOUL_BROWSER_DATA_DIR) return i.env.MAJSOUL_BROWSER_DATA_DIR
  if (!i.isPackaged) return join(i.repoRoot, '.data')
  if (i.platform === 'darwin') {
    if (i.exePath.includes('/AppTranslocation/')) {
      throw new DataRootError('translocated')
    }
    // <dir>/Majsoul-Browser.app/Contents/MacOS/Majsoul-Browser
    const appBundle = dirname(dirname(dirname(i.exePath)))
    return join(dirname(appBundle), DATA_DIR_NAME)
  }
  // Linux AppImage：程序被挂载在只读的临时目录里，数据放在 .AppImage 文件旁边
  if (i.platform === 'linux' && i.env.APPIMAGE) return join(dirname(i.env.APPIMAGE), DATA_DIR_NAME)
  return join(dirname(i.exePath), DATA_DIR_NAME)
}

/** 创建目录并探测可写；不可写时抛出带路径和办法的错误，**不静默回退**。 */
export function ensureDataRoot(root: string): void {
  try {
    for (const d of SUBDIRS) mkdirSync(join(root, d), { recursive: true })
    const probe = join(root, 'tmp', '.write-probe')
    writeFileSync(probe, 'ok')
    rmSync(probe)
  } catch (e) {
    throw new DataRootError('notWritable', { root, cause: (e as Error).message })
  }
}
