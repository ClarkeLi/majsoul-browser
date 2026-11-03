import { useEffect, useRef, useState } from 'react'

/** 数字变化时从旧值滚动到新值（ease-out），用于信息层里的点数，给一点“跳分”的手感。 */
export function useCountUp(value: number, ms = 520): number {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  const cur = useRef(value)
  useEffect(() => {
    from.current = cur.current
    if (from.current === value) return
    let raf = 0
    const t0 = performance.now()
    const step = (now: number): void => {
      const k = Math.min(1, (now - t0) / ms)
      const e = 1 - (1 - k) ** 3
      cur.current = from.current + (value - from.current) * e
      setShown(cur.current)
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return shown
}
