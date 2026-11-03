import type { ReactNode } from 'react'
import s from './EmptyState.module.css'

/** 整页居中：一行标题 + 一行说明 + 至多一个按钮，不放插画。 */
export function EmptyState({ title, desc, action }: { title: string; desc: string; action?: ReactNode }) {
  return (
    <div className={s.wrap}>
      <div className={s.title}>{title}</div>
      <div className={s.desc}>{desc}</div>
      {action}
    </div>
  )
}
