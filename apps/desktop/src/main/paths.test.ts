import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DataRootError, ensureDataRoot, resolveDataRoot } from './paths'

const base = { env: {}, isPackaged: true, platform: 'darwin' as const, exePath: '/Apps/Majsoul-Browser.app/Contents/MacOS/Majsoul-Browser', repoRoot: '/repo' }

describe('resolveDataRoot', () => {
  it('环境变量优先', () => expect(resolveDataRoot({ ...base, env: { MAJSOUL_BROWSER_DATA_DIR: '/x' } })).toBe('/x'))
  it('开发模式用仓库 .data', () => expect(resolveDataRoot({ ...base, isPackaged: false })).toBe('/repo/.data'))
  it('macOS：.app 所在目录', () => expect(resolveDataRoot(base)).toBe('/Apps/MajsoulBrowserData'))
  it('Windows：可执行文件同级', () =>
    expect(resolveDataRoot({ ...base, platform: 'win32', exePath: 'C:/软件 目录/soul.exe' })).toBe('C:\\软件 目录\\MajsoulBrowserData'))
  it('Linux AppImage：.AppImage 文件旁', () =>
    expect(resolveDataRoot({ ...base, platform: 'linux', exePath: '/tmp/.mount_x/majsoul-browser', env: { APPIMAGE: '/home/a/Apps/Majsoul-Browser.AppImage' } })).toBe('/home/a/Apps/MajsoulBrowserData'))
  it('macOS AppTranslocation 阻止启动', () =>
    expect(() => resolveDataRoot({ ...base, exePath: '/private/var/folders/x/AppTranslocation/AB/d/Soul.app/Contents/MacOS/Soul' })).toThrow(DataRootError))
})

describe('ensureDataRoot', () => {
  it('创建子目录', () => {
    const d = join(mkdtempSync(join(tmpdir(), 'soul-')), 'MajsoulBrowserData')
    expect(() => ensureDataRoot(d)).not.toThrow()
  })
  it('不可写时抛带提示的错误（不静默回退）', () => {
    // 把「文件」当作父目录：任何平台上都无法在其下建目录
    const f = join(mkdtempSync(join(tmpdir(), 'soul-')), 'a-file')
    writeFileSync(f, 'x')
    expect(() => ensureDataRoot(join(f, 'MajsoulBrowserData'))).toThrow(DataRootError)
  })
})
