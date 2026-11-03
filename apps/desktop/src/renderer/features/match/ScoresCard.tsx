import { useTranslation } from 'react-i18next'
import { seatWind } from '@renderer/lib/dora'
import { relSeat, windChar } from '@renderer/lib/tiles'
import type { StateMsg } from '@shared/protocol'
import { fmtDiff } from './OpponentsCard'
import s from './ScoresCard.module.css'

/** 点数状况：东南西北四格（你高亮、庄家标琥珀、立直标红条），含与你的点差。 */
export function ScoresCard({ state }: { state: StateMsg }) {
  const { t } = useTranslation()
  const self = state.self_seat ?? 0
  const order = [0, 1, 2, 3].map((k) => (state.round.oya + k) % 4)   // 东南西北
  return (
    <div className={s.grid}>
      {order.map((seat) => {
        const wind = seatWind(seat, state.round.oya)
        const me = seat === self
        return (
          <div key={seat} className={s.cell} data-me={me || undefined}>
            {state.riichi.includes(seat) && <i className={s.ri} aria-label={t('scoreCard.riichi')} />}
            <div className={s.hd}>
              <b data-oya={wind === 'E' || undefined}>{windChar(t, wind)}</b>
              <span>{me ? t('scoreCard.you') : t(`seat.${relSeat(seat, self)}`)}</span>
            </div>
            <div className={[s.pt, 'num'].join(' ')}>{(state.scores[seat] ?? 0).toLocaleString('en-US')}</div>
            <div className={[s.df, 'num'].join(' ')}>{me ? '' : fmtDiff((state.scores[seat] ?? 0) - (state.scores[self] ?? 0))}</div>
          </div>
        )
      })}
    </div>
  )
}
