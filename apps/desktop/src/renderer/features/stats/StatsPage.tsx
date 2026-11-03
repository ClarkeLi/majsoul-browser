import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@renderer/components/ui/Card'
import { useStats } from '@renderer/stores'
import type { StatsData } from '@shared/protocol'
import { EmptyState } from '../match/EmptyState'
import s from './StatsPage.module.css'

export type { StatsData }

const pct = (v: number | null): string => (v === null ? '—' : `${(v * 100).toFixed(1)}%`)

/** 右下角的最近 20 局 sparkline：单系列只用 --gold。 */
function Spark({ values }: { values: Array<number | null> }) {
  const pts = values.filter((v): v is number => v !== null)
  if (pts.length < 2) return <svg className={s.spark} aria-hidden />
  const lo = Math.min(...pts), hi = Math.max(...pts), span = hi - lo || 1
  const d = pts.map((v, i) => `${(i / (pts.length - 1)) * 60},${16 - ((v - lo) / span) * 14 - 1}`).join(' ')
  return <svg className={s.spark} viewBox="0 0 60 16" aria-hidden><polyline points={d} fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" /></svg>
}

function Tile({ label, value, series }: { label: string; value: string; series: Array<number | null> }) {
  return (
    <Card className={s.tile}>
      <div className={[s.value, 'num'].join(' ')}>{value}</div>
      <div className={s.label}>{label}</div>
      <Spark values={series} />
    </Card>
  )
}

export function StatsPage() {
  const { t } = useTranslation()
  const data = useStats((st) => st.data)
  useEffect(() => { window.soul?.getStats() }, [])
  if (!data || data.games === 0) return <EmptyState title={t('stats.empty')} desc={t('review.emptyDesc')} />
  const trend = data.trend.agree.map((v, i) => ({ n: i + 1, agree: v === null ? null : Math.round(v * 100) }))
  const dist = [
    { k: t('action.riichi'), v: data.dist.riichi }, { k: t('action.chi'), v: data.dist.call }, { k: t('action.ron'), v: data.dist.win }
  ]
  return (
    <div className={s.page}>
      <div className={s.tiles}>
        <Tile label={t('stats.avgRank')} value={data.avg_rank === null ? '—' : data.avg_rank.toFixed(2)} series={data.trend.rank.map((r) => (r === null ? null : -r))} />
        <Tile label={t('stats.winRate')} value={pct(data.win_rate)} series={[]} />
        <Tile label={t('stats.dealInRate')} value={pct(data.deal_in_rate)} series={[]} />
        <Tile label={t('stats.agree')} value={pct(data.agree_rate)} series={data.trend.agree} />
      </div>
      <Card>
        <h3 className={s.title}>{t('stats.trend')} · {t('stats.last20')}</h3>
        <div className={s.chart}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="n" tick={{ fill: 'var(--text-2)', fontSize: 11 }} stroke="var(--line)" />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-2)', fontSize: 11 }} stroke="var(--line)" unit="%" />
              <RTooltip contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--text-1)', fontSize: 12 }} />
              <Line type="monotone" dataKey="agree" stroke="var(--gold)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <h3 className={s.title}>{t('stats.dist')}</h3>
        <ul className={s.dist}>
          {dist.map((d) => (
            <li key={d.k}><span>{d.k}</span><span className={s.bar}><span style={{ width: `${(d.v ?? 0) * 100}%` }} /></span><span className="num">{pct(d.v)}</span></li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
