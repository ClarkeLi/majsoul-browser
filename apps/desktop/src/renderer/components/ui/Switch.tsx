import s from './Switch.module.css'

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={[s.sw, checked ? s.on : ''].join(' ')} onClick={() => onChange(!checked)}>
      <span className={s.knob} />
    </button>
  )
}
