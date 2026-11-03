import { useEffect, useState } from 'react'

/**
 * 信息层的鼠标：窗口默认点击穿透，但鼠标移动会被转发进来。
 *  - 鼠标在带 data-hit 的面板上 → 请求主进程接收点击；离开 → 恢复穿透
 *  - 返回当前鼠标位置（窗口坐标；离开窗口为 null），用于悬停手牌显示危险度
 */
export function useHudPointer(): { x: number; y: number } | null {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  useEffect(() => {
    let hit = false
    let raf = 0
    let last: { x: number; y: number } | null = null
    const setHit = (v: boolean): void => {
      if (v === hit) return
      hit = v
      window.soul?.setHudInteractive?.(v)
    }
    const move = (e: MouseEvent): void => {
      last = { x: e.clientX, y: e.clientY }
      const el = document.elementFromPoint(e.clientX, e.clientY)
      setHit(!!el?.closest('[data-hit]'))
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; setPos(last) })
    }
    const leave = (): void => { last = null; setHit(false); setPos(null) }
    window.addEventListener('mousemove', move)
    document.documentElement.addEventListener('mouseleave', leave)
    window.addEventListener('blur', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      document.documentElement.removeEventListener('mouseleave', leave)
      window.removeEventListener('blur', leave)
      if (raf) cancelAnimationFrame(raf)
      setHit(false)
    }
  }, [])
  return pos
}
