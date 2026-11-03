import { useTranslation } from 'react-i18next'
import { Bar, type BarTone } from '@renderer/components/ui/Bar'
import { Pill } from '@renderer/components/ui/Pill'
import { Tile } from '@renderer/components/ui/Tile'
import { seatWind } from '@renderer/lib/dora'
import { relSeat } from '@renderer/lib/tiles'
import type { StateMsg } from '@shared/protocol'
import s from './OpponentsCard.module.css'

const tone = (th: number): BarTone => (th < 0.3 ? 'risk-1' : th < 0.6 ? 'risk-2' : th < 0.85 ? 'risk-3' : 'risk-4')
export const fmtDiff = (d: number): string => (d === 0 ? '±0' : `${d > 0 ? '+' : '−'}${Math.abs(d).toLocaleString('en-US')}`)

/** 对手：每家一行 —— 风位 / 座位 / 点数与点差 / 立直 / 威胁度 / 牌河 / 副露。 */
export function OpponentsCard({ state }: { state: StateMsg }) {
  const { t } = useTranslation()
  const self = state.self_seat ?? 0
  const seats = [1, 2, 3].map((d) => (self + d) % 4)
  return (
    <div className={s.list}>
      {seats.map((seat) => {
        const th = state.analysis?.threat.find((x) => x.seat === seat)
        const level = th ? (th.threat >= 0.7 ? 'High' : th.threat >= 0.3 ? 'Mid' : 'Low') : null
        const riichi = state.riichi.includes(seat)
        const wind = seatWind(seat, state.round.oya)
        const diff = (state.scores[seat] ?? 0) - (state.scores[self] ?? 0)
        const melds = state.melds[seat] ?? []
        return (
          <div key={seat} className={[s.opp, riichi ? s.riichi : ''].join(' ')}>
            <div className={s.head}>
              <span className={s.wd} data-oya={wind === 'E' || undefined} aria-label={t(`wind.${wind}`)}>{t(`wind.${wind}`)}</span>
              <span className={s.who}>{t(`seat.${relSeat(seat, self)}`)}</span>
              {riichi && <Pill tone="red">{t('opp.riichi')}</Pill>}
              <span className={[s.pt, 'num'].join(' ')}>{(state.scores[seat] ?? 0).toLocaleString('en-US')}</span>
              <span className={[s.df, 'num'].join(' ')}>{fmtDiff(diff)}</span>
            </div>
            <div className={s.threat}>
              <span className={s.k}>{t('oppRow.threat')}</span>
              {th ? <Bar value={th.threat} tone={tone(th.threat)} height={5} label={`${Math.round(th.threat * 100)}%`} /> : <span className={s.none}>—</span>}
              <span className={s.lb}>{th ? `${t(`oppRow.${th.label}`, { defaultValue: th.label })} · ${t(`oppRow.level${level}`)}` : ''}</span>
            </div>
            <div className={s.river} aria-label={t('oppRow.river')}>
              {(state.rivers[seat] ?? []).map((r, i) => (
                <Tile key={i} code={r.tile} size="xs" state={r.called ? 'called' : r.riichi ? 'riichi' : r.tsumogiri ? 'tsumogiri' : 'normal'} />
              ))}
            </div>
            {melds.length > 0 && (
              <div className={s.melds}>
                {melds.map((m, i) => <span key={i} className={s.meld}>{m.tiles.map((c, j) => <Tile key={j} code={c} size="xs" />)}</span>)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
