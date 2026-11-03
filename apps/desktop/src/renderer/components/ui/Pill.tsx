import type { ReactNode } from 'react'
import s from './Pill.module.css'

export type PillTone = 'gray' | 'gold' | 'jade' | 'amber' | 'red'

export function Pill({ tone = 'gray', children, title }: { tone?: PillTone; children: ReactNode; title?: string }) {
  return (
    <span className={[s.pill, s[tone]].join(' ')} title={title}>
      {children}
    </span>
  )
}
