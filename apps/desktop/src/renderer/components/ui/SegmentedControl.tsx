import s from './SegmentedControl.module.css'

export interface SegOption<T extends string> { value: T; label: string; tone?: 'default' | 'gold' }

interface Props<T extends string> {
  options: SegOption<T>[]
  value: T
  onChange: (v: T) => void
  'aria-label': string
}

export function SegmentedControl<T extends string>({ options, value, onChange, ...rest }: Props<T>) {
  return (
    <div className={s.seg} role="radiogroup" aria-label={rest['aria-label']}>
      {options.map((o) => {
        const active = o.value === value
        const cls = [s.item, active ? (o.tone === 'gold' ? s.activeGold : s.active) : ''].join(' ')
        return (
          <button key={o.value} type="button" role="radio" aria-checked={active} className={cls} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
