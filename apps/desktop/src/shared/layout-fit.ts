import type { Rect } from './ui-map'

export type HudDock = 'split' | 'bottom'
export interface FitOptions {
  /** 给信息栏预留固定空间（上/下），游戏画面在剩下的区域里缩放 */
  reserve: boolean
  /** split：多出的空间上下平分；bottom：画面贴上，多出的全部给下方信息栏 */
  dock: HudDock
}
export const RESERVE_TOP = 34
export const RESERVE_BOTTOM = 92
/** 低于这个高度的信息栏只放一行摘要 / 不放内容（px） */
export const BAR_MIN = 26

export interface Fitted {
  /** 游戏画面（严格 16:9），相对区域左上角 */
  game: Rect
  top: Rect
  bottom: Rect
  left: Rect
  right: Rect
}

/** 把严格 16:9 的游戏画面放进 areaW×areaH 的区域；主进程摆游戏视图、信息层窗口排版都用这一个函数。 */
export function fitGame(areaW: number, areaH: number, o: FitOptions = { reserve: false, dock: 'split' }): Fitted {
  const rt = o.reserve ? RESERVE_TOP : 0
  const rb = o.reserve ? RESERVE_BOTTOM : 0
  const innerH = Math.max(0, areaH - rt - rb)
  let w = Math.max(0, areaW)
  let h = Math.floor((w * 9) / 16)
  if (h > innerH) {
    h = innerH
    w = Math.floor((h * 16) / 9)
  }
  const x = Math.floor((areaW - w) / 2)
  const spare = innerH - h
  const y = rt + (o.dock === 'bottom' ? 0 : Math.floor(spare / 2))
  return {
    game: { x, y, w, h },
    top: { x: 0, y: 0, w: areaW, h: y },
    bottom: { x: 0, y: y + h, w: areaW, h: Math.max(0, areaH - y - h) },
    left: { x: 0, y, w: x, h },
    right: { x: x + w, y, w: Math.max(0, areaW - x - w), h }
  }
}
