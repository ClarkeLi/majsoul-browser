import { fitGame, type FitOptions } from '@shared/layout-fit'
import type { Rect } from '@shared/ui-map'
export type { Rect }

export const TOPBAR_H = 44
export const STATUSBAR_H = 24
export const SIDEBAR_MIN = 340
export const SIDEBAR_MAX = 520
export const SIDEBAR_DEFAULT = 400
export const RAIL_W = 56

export interface SidebarState { width: number; collapsed: boolean }

export function clampSidebar(width: number): number {
  return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(width)))
}

/**
 * 游戏区严格 16:9。返回窗口内容区坐标系下的：游戏画面、整个游戏区（信息层窗口覆盖它）、侧栏。
 * 游戏区 = 顶栏与状态栏之间、侧栏左边的整块区域；上下左右多出来的部分（含预留的信息栏）由信息层使用。
 */
export function computeLayout(winW: number, winH: number, sb: SidebarState, fit?: FitOptions): { game: Rect; area: Rect; sidebar: Rect } {
  const sbW = sb.collapsed ? RAIL_W : clampSidebar(sb.width)
  const areaW = Math.max(0, winW - sbW)
  const areaH = Math.max(0, winH - TOPBAR_H - STATUSBAR_H)
  const f = fitGame(areaW, areaH, fit)
  return {
    game: { x: f.game.x, y: TOPBAR_H + f.game.y, w: f.game.w, h: f.game.h },
    area: { x: 0, y: TOPBAR_H, w: areaW, h: areaH },
    sidebar: { x: areaW, y: TOPBAR_H, w: sbW, h: areaH }
  }
}
