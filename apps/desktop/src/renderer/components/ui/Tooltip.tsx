import type { ReactNode } from 'react'
import s from './Tooltip.module.css'

export function Tooltip({ content, children, side = 'top' }: { content: string; children: ReactNode; side?: 'top' | 'bottom' }) {
  return (
    <span className={s.wrap}>
      {children}
      <span role="tooltip" className={[s.tip, s[side]].join(' ')}>
        {content}
      </span>
    </span>
  )
}
