import { posix, win32 } from 'node:path'

export interface LaunchInput { isPackaged: boolean; resourcesPath: string; repoRoot: string; platform: NodeJS.Platform }
export interface Launch { command: string; args: string[]; cwd: string }

const exe = (p: NodeJS.Platform): string => (p === 'win32' ? 'soul-core.exe' : 'soul-core')

/** Core 本体：开发时用 core/.venv 的 python，打包后用冻结的 soul-core 可执行文件。 */
export function coreLaunch(i: LaunchInput): Launch {
  const { join } = i.platform === 'win32' ? win32 : posix // 按目标平台拼路径，与运行机器无关
  if (i.isPackaged) {
    const dir = join(i.resourcesPath, 'core')
    return { command: join(dir, exe(i.platform)), args: [], cwd: dir }
  }
  const py = join(i.repoRoot, 'core', '.venv', i.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')
  return { command: py, args: ['-m', 'soul_core.main'], cwd: join(i.repoRoot, 'core') }
}

/** 子命令（models / runner）：开发时 python -m，打包后 soul-core <子命令>。 */
export function coreSubcommand(i: LaunchInput, module: string, sub: string): Launch {
  const l = coreLaunch(i)
  return i.isPackaged ? { ...l, args: [sub] } : { ...l, args: ['-m', module] }
}
