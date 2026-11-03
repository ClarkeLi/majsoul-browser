import { useTranslation } from 'react-i18next'
import { Tile } from '@renderer/components/ui/Tile'
import { useCountUp } from '@renderer/lib/count-up'
import { balanceView, fmt, signed } from '@renderer/lib/points'
import type { RecommendationMsg } from '@shared/protocol'
import { Rich } from './Term'
import s from './Balance.module.css'

export interface BalRow { key: string; tile: string; reach: boolean; p: number | null; gain: number; loss: number; net: number; est: boolean; focus: boolean }

/** 推荐里的候选价值 -> 红绿条的行（与侧栏「候选 · 收益 vs 损失」、算法改判同一口径）。没有候选价值时退回推荐牌的押引。 */
export function balanceRows(rec: RecommendationMsg | null): BalRow[] {
  const ins = rec?.insight
  if (!rec || !ins) return []
  const focusKey = rec.kind === 'riichi' ? `reach:${rec.riichi_tile ?? ''}` : rec.kind === 'discard' ? `dahai:${rec.tile ?? ''}` : null
  const vals = ins.values ?? []
  if (vals.length > 0) {
    return vals.map((v) => {
      const key = `${v.kind}:${v.tile}`
      return { key, tile: v.tile, reach: v.kind === 'reach', p: v.p, gain: Math.max(0, v.attack), loss: v.loss, net: v.value, est: v.shanten > 0, focus: key === focusKey }
    })
  }
  if (!ins.balance) return []
  const b = balanceView(ins.balance, vals)
  return [{ key: `dahai:${ins.balance.tile}`, tile: ins.balance.tile, reach: false, p: null, gain: b.gain, loss: b.loss, net: b.net, est: b.est, focus: true }]
}

/**
 * 下栏的押引红绿条：每个候选一行，中线左红 = 放铳损失、右绿 = 和牌收益（未听牌为估算，斜纹），右边是净值。
 * 标题右侧是推荐那一手的净值（滚动跳分）。
 */
export function BalancePanel({ rec, hidden, stale, rows: maxRows }: { rec: RecommendationMsg | null; hidden: boolean; stale: boolean; rows: number }) {
  const { t } = useTranslation()
  const all = hidden ? [] : balanceRows(rec)
  const focus = all.find((r) => r.focus) ?? all[0]
  // 推荐的那一手总是显示；其余按原顺序（立直在前，然后按 AI 概率）
  const rows = all.slice(0, maxRows)
  if (focus && !rows.includes(focus)) rows[rows.length - 1] = focus
  const m = Math.max(1, ...rows.map((r) => Math.max(r.gain, r.loss)))
  const best = rows.length > 1 ? rows.reduce((b, r) => (r.net > b.net ? r : b), rows[0]!) : null
  const net = useCountUp(focus?.net ?? 0)
  return (
    <div className={s.panel} data-stale={stale || undefined} data-testid="balance">
      <div className={s.side}>
        <span className={s.title}><i className={s.ic}>{t('cards.ic.values')}</i>{t('hud.bal.title')}</span>
        <span className={s.sub}>{t('hud.bal.sub')}</span>
        {focus && (
          <span className={s.big} data-sign={focus.net >= 0 ? 'pos' : 'neg'} key={rec?.revision}>
            <i>{t('hud.bal.net')}</i><b className="num">{signed(net)}</b>
          </span>
        )}
      </div>
      {rows.length === 0 ? (
        <span className={s.muted}><Rich text={hidden ? t('hud.bal.hidden') : t('hud.bal.empty')} /></span>
      ) : (
        <div className={s.rows} key={rec?.revision}>
          {rows.map((r, i) => (
            <div key={r.key} className={s.row} data-focus={r.focus || undefined} style={{ animationDelay: `${i * 60}ms` }}>
              <span className={s.who}>
                <Tile code={r.tile} px={11} />
                {r.reach && <em className={s.riichi}>{t('vals.riichi')}</em>}
                {r.p !== null && <span className="num">{Math.round(r.p)}%</span>}
              </span>
              <span className={s.bar} title={`${t('bal.loss')} −${fmt(r.loss)} · ${t('bal.gain')} ${r.est ? '≈' : ''}+${fmt(r.gain)}`}>
                <span className={s.l}><i style={{ width: `${(r.loss / m) * 100}%`, animationDelay: `${i * 60}ms` }} /></span>
                <span className={s.mid} />
                <span className={s.r}><i data-est={r.est || undefined} style={{ width: `${(r.gain / m) * 100}%`, animationDelay: `${i * 60}ms` }} /></span>
              </span>
              <b className={['num', s.net].join(' ')} data-sign={r.net >= 0 ? 'pos' : 'neg'}>
                {best === r && <i className={s.best}>◎</i>}{signed(r.net)}
              </b>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
