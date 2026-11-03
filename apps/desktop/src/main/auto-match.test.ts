import { describe, expect, it } from 'vitest'
import { AutoMatch, againButtonVisible, againPopupVisible, okButtonVisible, POS, roomOfModeId, type AutoMatchStatus, type Frame } from './auto-match'

const W = 1600, H = 900, U = W / 16
type Screen = boolean | 'again' | 'popup'
/** 灰底；ok=true 时在「確認」按钮位置画一块亮黄色（实测 250,224,120）；'again' 再加上蓝色「再來一場」（实测 56,86,153） */
function frame(screen: Screen): Frame {
  const ok = screen === true || screen === 'again'
  const data = new Uint8Array(W * H * 4)
  for (let i = 0; i < data.length; i += 4) { data[i] = 60; data[i + 1] = 50; data[i + 2] = 40; data[i + 3] = 255 }
  if (ok) {
    for (let y = Math.round(7.85 * U); y < Math.round(8.45 * U); y++) {
      for (let x = Math.round(13.5 * U); x < Math.round(15.2 * U); x++) {
        const i = (y * W + x) * 4
        data[i] = 120; data[i + 1] = 224; data[i + 2] = 250     // BGRA
      }
    }
  }
  const paint = (x0: number, x1: number, y0: number, y1: number, rgb: [number, number, number]): void => {
    for (let y = Math.round(y0 * U); y < Math.round(y1 * U); y++) {
      for (let x = Math.round(x0 * U); x < Math.round(x1 * U); x++) {
        const i = (y * W + x) * 4
        data[i] = rgb[2]; data[i + 1] = rgb[1]; data[i + 2] = rgb[0]
      }
    }
  }
  if (screen === 'popup') {
    // 弹窗：確認（黄）+ 取消（蓝）；背后的按钮变暗（实测 76,68,37 / 17,26,46）
    paint(5.25, 7.78, 6.29, 6.9, [238, 191, 85])
    paint(8.2, 10.73, 6.29, 6.9, [49, 77, 137])
    paint(13.5, 15.2, 7.85, 8.45, [76, 68, 37])
    paint(11.1, 13.2, 7.85, 8.45, [17, 26, 46])
  }
  if (screen === 'again') {
    for (let y = Math.round(7.85 * U); y < Math.round(8.45 * U); y++) {
      for (let x = Math.round(11.1 * U); x < Math.round(13.2 * U); x++) {
        const i = (y * W + x) * 4
        data[i] = 153; data[i + 1] = 86; data[i + 2] = 56
      }
    }
  }
  return { width: W, height: H, data }
}

function harness(screens: Screen[]) {
  let t = 0
  const clicks: Array<[number, number]> = []
  const statuses: AutoMatchStatus[] = []
  let k = 0
  const am = new AutoMatch({
    click: async (x, y) => { clicks.push([x, y]) },
    wheel: async () => {},
    capture: async () => frame(screens[Math.min(k++, screens.length - 1)]!),
    now: () => t,
    sleep: async (ms) => { t += ms },
    onStatus: (s) => statuses.push(s)
  })
  return { am, clicks, statuses, advance: (ms: number) => { t += ms } }
}

describe('okButtonVisible', () => {
  it('黄色確認按钮 → true；普通画面 → false', () => {
    expect(okButtonVisible(frame(true))).toBe(true)
    expect(okButtonVisible(frame(false))).toBe(false)
  })
})

describe('againButtonVisible', () => {
  it('只有蓝色「再來一場」和黄色「確認」同时出现才算', () => {
    expect(againButtonVisible(frame('again'))).toBe(true)
    expect(againButtonVisible(frame(true))).toBe(false)
    expect(againButtonVisible(frame(false))).toBe(false)
  })
})

describe('againPopupVisible', () => {
  it('弹窗时只认弹窗，背后变暗的按钮不算', () => {
    expect(againPopupVisible(frame('popup'))).toBe(true)
    expect(okButtonVisible(frame('popup'))).toBe(false)
    expect(againButtonVisible(frame('popup'))).toBe(false)
    expect(againPopupVisible(frame('again'))).toBe(false)
  })
})

describe('roomOfModeId', () => {
  it('铜之间四人东 = 2，玉之间四人南 = 12；三麻不支持', () => {
    expect(roomOfModeId(2)).toEqual({ level: 0, mode: 'east' })
    expect(roomOfModeId(12)).toEqual({ level: 3, mode: 'south' })
    expect(roomOfModeId(17)).toBeNull()
  })
})

describe('AutoMatch', () => {
  const run = async (h: ReturnType<typeof harness>, n: number, step = 2500): Promise<void> => {
    for (let i = 0; i < n; i++) { await h.am.tick(); h.advance(step) }
  }

  it('完整流程：对局结束 → 確認 → 確認 → 再來一場 → 弹窗確認 → 排队 → 下一局', async () => {
    const h = harness([true, true, 'again', 'popup'])
    h.am.setInGame(true)
    h.am.setEnabled(true)
    expect(h.am.state).toBe('playing')
    h.am.setGameConn(true)
    h.am.onGameEnd()                               // 开始看画面（会立即看一次）
    await new Promise((r) => setTimeout(r, 0))
    await run(h, 4)
    expect(h.clicks).toEqual([[...POS.ok], [...POS.ok], [...POS.again], [...POS.popupOk]])
    expect(h.am.state).toBe('waiting')
    h.am.onMatchRequested()
    expect(h.am.state).toBe('queued')
    h.am.onGameStart()
    expect(h.am.state).toBe('playing')
  })

  it.each([
    ['段位分页', [true, 'again', 'popup'] as Screen[], [POS.ok, POS.again, POS.popupOk]],
    ['知名度页', ['again', 'popup'] as Screen[], [POS.again, POS.popupOk]],
    ['弹窗上', ['popup'] as Screen[], [POS.popupOk]]
  ])('从%s打开也能接着走', async (_name, screens, want) => {
    const h = harness(screens)
    h.am.setGameConn(true)
    h.am.setEnabled(true)
    await new Promise((r) => setTimeout(r, 0))
    await run(h, screens.length)
    expect(h.clicks).toEqual(want.map((p) => [...p]))
    expect(h.am.state).toBe('waiting')
  })

  it('在大厅打开：没有任何按钮、不在牌局里 → 6 秒后按场次去匹配', async () => {
    const h = harness([false])
    h.am.setRoom({ level: 0, mode: 'east' })
    h.am.setEnabled(true)
    await new Promise((r) => setTimeout(r, 0))
    await run(h, 4)
    expect(h.clicks.slice(0, 3)).toEqual([[...POS.ranked], [...POS.levels[0]], [...POS.modes.east]])
    expect(h.am.state).toBe('waiting')
  })

  it('一局接一局：排队 → 对局 → 结束后又自动开始看画面', async () => {
    const h = harness(['popup'])
    h.am.setEnabled(true)
    await new Promise((r) => setTimeout(r, 0))
    h.am.onMatchRequested()
    h.am.setInGame(true)
    expect(h.am.state).toBe('playing')
    h.am.setInGame(false)
    expect(h.am.state).toBe('scanning')
  })

  it('弹窗確認后迟迟没有匹配请求：重来，最多 3 次，然后停下；再打开一次又从当前画面开始', async () => {
    const h = harness(['popup'])
    h.am.setEnabled(true)
    await new Promise((r) => setTimeout(r, 0))
    await run(h, 12, 9000)
    expect(h.clicks.filter((c) => c[0] === POS.popupOk[0]).length).toBe(3)
    expect(h.am.state).toBe('stuck')
    h.am.setEnabled(true)                          // 再点一次「自动匹配」
    await new Promise((r) => setTimeout(r, 0))
    expect(h.am.state).toBe('waiting')
    expect(h.clicks.filter((c) => c[0] === POS.popupOk[0]).length).toBe(4)
  })

  it('没开启 / 在对局中时什么都不点', async () => {
    const h = harness([true])
    await h.am.tick()
    h.am.setInGame(true)
    h.am.setEnabled(true)
    await h.am.tick()
    expect(h.clicks).toEqual([])
  })

  it('不知道打哪个场时大厅里不乱点', async () => {
    const h = harness([false])
    h.am.setEnabled(true)
    await new Promise((r) => setTimeout(r, 0))
    await run(h, 4)
    expect(h.am.state).toBe('stuck')
    expect(h.clicks).toEqual([])
  })
})
