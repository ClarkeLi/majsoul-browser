import { describe, expect, it } from 'vitest'
import { coreLaunch, coreSubcommand } from './core-launch'

const base = { resourcesPath: '/App/Contents/Resources', repoRoot: '/repo' }
describe('coreLaunch', () => {
  it('开发：core/.venv 的 python -m soul_core.main', () => {
    const l = coreLaunch({ ...base, isPackaged: false, platform: 'darwin' })
    expect(l.command).toBe('/repo/core/.venv/bin/python')
    expect(l.args).toEqual(['-m', 'soul_core.main'])
  })
  it('开发（Windows）：Scripts/python.exe', () => {
    expect(coreLaunch({ ...base, isPackaged: false, platform: 'win32' }).command.replace(/\\/g, '/')).toBe('/repo/core/.venv/Scripts/python.exe')
  })
  it('打包：resources/core/soul-core(.exe)', () => {
    expect(coreLaunch({ ...base, isPackaged: true, platform: 'darwin' }).command).toBe('/App/Contents/Resources/core/soul-core')
    expect(coreLaunch({ ...base, isPackaged: true, platform: 'win32' }).command.replace(/\\/g, '/')).toBe('/App/Contents/Resources/core/soul-core.exe')
  })
  it('子命令', () => {
    expect(coreSubcommand({ ...base, isPackaged: true, platform: 'darwin' }, 'soul_core.models', 'models').args).toEqual(['models'])
    expect(coreSubcommand({ ...base, isPackaged: false, platform: 'darwin' }, 'soul_core.models', 'models').args).toEqual(['-m', 'soul_core.models'])
  })
})
