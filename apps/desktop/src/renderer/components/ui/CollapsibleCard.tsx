import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { updateSettings, useSettings } from '@renderer/stores'
import s from './CollapsibleCard.module.css'

interface Props { id: string; icon: string; title: string; sub?: ReactNode; children: ReactNode; className?: string }

/** 可折叠卡片：标题栏 = 单字图标 + 标题 + 副标题 + 箭头；折叠状态记在设置里，重启后保持。 */
export function CollapsibleCard({ id, icon, title, sub, children, className }: Props) {
  const collapsed = useSettings((st) => st.collapsedCards.includes(id))
  const toggle = (): void => {
    const cur = useSettings.getState().collapsedCards
    updateSettings({ collapsedCards: collapsed ? cur.filter((x) => x !== id) : [...cur, id] })
  }
  return (
    <section className={[s.card, collapsed ? s.closed : '', className ?? ''].join(' ')}>
      <button type="button" className={s.head} aria-expanded={!collapsed} onClick={toggle}>
        <span className={s.ic} aria-hidden>{icon}</span>
        <span className={s.title}>{title}</span>
        {sub !== undefined && <span className={s.sub}>{sub}</span>}
        <ChevronDown className={s.chev} size={14} strokeWidth={1.75} aria-hidden />
      </button>
      {!collapsed && <div className={s.body}>{children}</div>}
    </section>
  )
}
