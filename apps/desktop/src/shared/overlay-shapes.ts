import type { ClickStep } from './protocol'
import { stepToPoint, type Point, type Rect } from './ui-map'

export interface Shape { kind: 'tile' | 'button'; cx: number; cy: number; w: number; h: number; label: string | null; /** 原始步骤类型（手牌 / 按钮 / 吃杠候选） */ step: ClickStep['t'] }

/** 点击步骤 -> 浮层上要画的框（坐标相对游戏区左上角）。越界的步骤直接跳过，不画。 */
export function overlayShapes(steps: ClickStep[], rect: Rect): Shape[] {
  const unit = rect.w / 16
  const out: Shape[] = []
  steps.forEach((s, i) => {
    let p: Point
    try { p = stepToPoint(s, rect) } catch { return }
    const label = steps.length > 1 ? String(i + 1) : null
    if (s.t === 'hand') out.push({ kind: 'tile', cx: p.x, cy: p.y, w: unit * 0.74, h: unit * 1.02, label, step: s.t })
    else out.push({ kind: 'button', cx: p.x, cy: p.y, w: unit * 1.7, h: unit * 0.82, label, step: s.t })
  })
  return out
}
