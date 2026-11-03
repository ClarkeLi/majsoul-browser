import s from './Tabs.module.css'

export interface TabItem<T extends string> { value: T; label: string }

export function Tabs<T extends string>({ items, value, onChange, label }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className={s.tabs} role="tablist" aria-label={label}>
      {items.map((it) => (
        <button key={it.value} role="tab" type="button" aria-selected={it.value === value} className={[s.tab, it.value === value ? s.active : ''].join(' ')} onClick={() => onChange(it.value)}>
          {it.label}
        </button>
      ))}
    </div>
  )
}
