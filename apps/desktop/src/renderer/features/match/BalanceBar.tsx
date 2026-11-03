import { useTranslation } from 'react-i18next'
import { balanceView, fmt } from '@renderer/lib/points'
import { relSeat } from '@renderer/lib/tiles'
import type { Balance, CandValue } from '@shared/protocol'
import s from './BalanceBar.module.css'

/**
 * 押引红绿条（旧面板的“放铳损失 vs 和牌收益”）：中线左边红 = 放铳损失，右边绿 = 和牌收益，按两者较大的那个归一。
 * 下面逐家列出损失来自谁：对他的放铳率 × 他的估计打点。未听牌时收益按向听与进张估（与候选价值同一口径）。
 */
export function BalanceBar({ b, self, values }: { b: Balance; self: number; values?: CandValue[] }) {
  const { t } = useTranslation()
  const { gain, loss, net, est } = balanceView(b, values)
  const m = Math.max(gain, loss, 1)
  return (
    <div className={s.wrap}>
      <div className={s.bar} role="img" aria-label={`${t('bal.loss')} ${fmt(loss)} / ${t('bal.gain')} ${fmt(gain)}`}>
        <span className={s.l}><i style={{ width: `${(loss / m) * 100}%` }} /></span>
        <span className={s.mid} />
        <span className={s.r}><i style={{ width: `${(gain / m) * 100}%` }} data-est={est || undefined} /></span>
      </div>
      <div className={s.legend}>
        <span>{t('bal.loss')} <b className="num" data-tone="loss">−{fmt(loss)}</b></span>
        <span className={s.net} data-sign={net >= 0 ? 'pos' : 'neg'}>{t('bal.net')} <b className="num">{net >= 0 ? '+' : '−'}{fmt(Math.abs(net))}</b></span>
        <span>{t('bal.gain')} <b className="num" data-tone="gain">{est ? '≈' : ''}+{fmt(gain)}</b></span>
      </div>
      {b.parts.length > 0 && (
        <div className={s.parts}>
          {b.parts.filter((p) => p.p >= 0.1).sort((a, c) => c.p * c.val - a.p * a.val).map((p) => (
            <span key={p.seat} className={s.part}>
              {t(`seat.${relSeat(p.seat, self)}`)} <b className="num">{p.p}%</b> × <b className="num">{fmt(p.val)}</b>
              <i className="num">= {fmt((p.p / 100) * p.val)}</i>
            </span>
          ))}
        </div>
      )}
      <p className={s.note}>{b.shanten > 0 ? t(est ? 'bal.notTenpai' : 'bal.notTenpaiNone', { n: b.shanten }) : t('bal.note')}</p>
    </div>
  )
}
