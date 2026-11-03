import { useToasts } from '@renderer/stores'
import s from './Toast.module.css'

export function ToastHost() {
  const items = useToasts((st) => st.items)
  return (
    <div className={s.host} aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={s.toast} role="status">
          {t.text}
        </div>
      ))}
    </div>
  )
}
