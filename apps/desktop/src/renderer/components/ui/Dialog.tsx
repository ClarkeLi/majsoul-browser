import { useEffect, useRef, type ReactNode } from 'react'
import s from './Dialog.module.css'

interface Props { open: boolean; title: string; children: ReactNode; actions: ReactNode; onClose: () => void }

/** 对话框锚定在最近的 position:relative 祖先（侧栏）里：原生游戏视图会盖住渲染层，所以不能铺满窗口。 */
export function Dialog({ open, title, children, actions, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className={s.scrim} onMouseDown={onClose}>
      <div ref={ref} className={s.dialog} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <h2 className={s.title}>{title}</h2>
        <div className={s.body}>{children}</div>
        <div className={s.actions}>{actions}</div>
      </div>
    </div>
  )
}
