import { useTranslation } from 'react-i18next'
import { Bar } from '@renderer/components/ui/Bar'
import type { Advice, Balance, CandValue } from '@shared/protocol'
import { BalanceBar } from './BalanceBar'
import s from './VerdictCard.module.css'

/** 押引判断：一个醒目的标签 + 两条仪表（推荐牌放铳率、场上最高威胁）。 */
export function VerdictCard({ advice, risk, threat, balance, values, self }: { advice: Advice; risk: number; threat: number; balance?: Balance; values?: CandValue[]; self: number }) {
  const { t } = useTranslation()
  return (
    <div className={s.wrap}>
      <div className={s.top}>
        <span className={s.tag} data-advice={advice}>{t(`verdict.${advice}`)}</span>
        <span className={s.desc}>{t(`verdict.${advice}Desc`)}</span>
      </div>
      {balance && <BalanceBar b={balance} self={self} values={values} />}
      <div className={s.meter}>
        <span>{t('verdict.riskOf')}</span><Bar value={Math.min(1, risk / 15)} tone={risk < 2 ? 'risk-1' : risk < 5 ? 'risk-2' : risk < 9 ? 'risk-3' : 'risk-4'} height={5} label={`${risk}%`} /><b className="num">{risk}%</b>
      </div>
      <div className={s.meter}>
        <span>{t('verdict.threatOf')}</span><Bar value={threat} tone={threat < 0.3 ? 'risk-1' : threat < 0.6 ? 'risk-2' : threat < 0.85 ? 'risk-3' : 'risk-4'} height={5} label={`${Math.round(threat * 100)}%`} /><b className="num">{Math.round(threat * 100)}%</b>
      </div>
    </div>
  )
}
