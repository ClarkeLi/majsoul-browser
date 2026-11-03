/**
 * 点击坐标表（16×9 归一化坐标）。
 * 数值取自 MahjongCopilot（latorc，GPL-3.0）game/automation.py 的 Positions，保留署名；
 * 本项目整体以 GPL-3.0-or-later 发布。坐标表版本号用于游戏更新后提示。
 */
import type { ClickStep } from './protocol'

export interface Rect { x: number; y: number; w: number; h: number }

export const UI_MAP_VERSION = '0.16.289-4.0.51'

export const TEHAI_X = [
  2.23125, 3.021875, 3.8125, 4.603125, 5.39375, 6.184375, 6.975, 7.765625, 8.55625, 9.346875, 10.1375,
  10.928125, 11.71875, 12.509375
] as const
export const TEHAI_Y = 8.3625
/** 摸到的牌与手牌之间的额外间隔 */
export const TRUMO_SPACE = 0.246875

/** 按钮槽位（优先级越高越靠右下）：5 4 3 / 2 1 0，槽位 0 永远是“跳过” */
export const BUTTONS: ReadonlyArray<readonly [number, number]> = [
  [10.875, 7], [8.6375, 7], [6.4, 7], [10.875, 5.9], [8.6375, 5.9], [6.4, 5.9],
  [10.875, 4.8], [8.6375, 4.8], [6.4, 4.8]
]
/** 吃/碰/大明杠的候选组合位置 */
export const CANDIDATES: ReadonlyArray<readonly [number, number]> = [
  [3.6625, 6.3], [4.49625, 6.3], [5.33, 6.3], [6.16375, 6.3], [6.9975, 6.3], [7.83125, 6.3],
  [8.665, 6.3], [9.49875, 6.3], [10.3325, 6.3], [11.16625, 6.3], [12, 6.3]
]
/** 暗杠/加杠的候选组合位置 */
export const CANDIDATES_KAN: ReadonlyArray<readonly [number, number]> = [
  [4.325, 6.3], [5.4915, 6.3], [6.6583, 6.3], [7.825, 6.3], [8.9917, 6.3], [10.1583, 6.3], [11.325, 6.3]
]

export class SlotOutOfRange extends Error {}

export interface Point { x: number; y: number }

/** 16×9 -> view 内 DIP；rect 是游戏 Canvas 在 view 里的显示区域（view 保持 16:9 时即整个 view）。 */
export function toView(gx: number, gy: number, rect: Rect): Point {
  return { x: Math.round(rect.x + (gx / 16) * rect.w), y: Math.round(rect.y + (gy / 9) * rect.h) }
}

function pick<T>(arr: ReadonlyArray<T>, i: number, what: string): T {
  const v = arr[i]
  if (v === undefined) throw new SlotOutOfRange(`${what}槽位越界：${i}`)
  return v
}

/** 抽象点击步骤 -> view 内坐标；目标槽位越界时抛 SlotOutOfRange（失败关闭）。 */
export function stepToPoint(step: ClickStep, rect: Rect): Point {
  switch (step.t) {
    case 'hand': {
      const gx = pick(TEHAI_X, step.index, '手牌') + (step.gap ? TRUMO_SPACE : 0)
      return toView(gx, TEHAI_Y, rect)
    }
    case 'button': {
      const [gx, gy] = pick(BUTTONS, step.slot, '按钮')
      return toView(gx, gy, rect)
    }
    case 'candidate': {
      const idx = -step.count + 2 * step.index + 1 + (step.kan ? 3 : 5)
      const [gx, gy] = step.kan ? pick(CANDIDATES_KAN, idx, '候选') : pick(CANDIDATES, idx, '候选')
      return toView(gx, gy, rect)
    }
  }
}

export function planToPoints(steps: ClickStep[], rect: Rect): Point[] {
  return steps.map((s) => stepToPoint(s, rect))
}
