import s from './Bar.module.css'

export type BarTone = 'gold' | 'risk-0' | 'risk-1' | 'risk-2' | 'risk-3' | 'risk-4'

/** 概率条 / 危险度条：宽度表示数值，颜色从不单独承载信息。 */
export function Bar({ value, tone = 'gold', height = 4, label }: { value: number; tone?: BarTone; height?: number; label?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <span className={s.track} style={{ height }} role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span className={s.fill} data-tone={tone} style={{ width: `${pct}%` }} />
    </span>
  )
}
