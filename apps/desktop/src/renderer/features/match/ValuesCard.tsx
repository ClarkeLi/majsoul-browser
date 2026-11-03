import { useTranslation } from 'react-i18next'
import { Tile } from '@renderer/components/ui/Tile'
import { fmt, pct } from '@renderer/lib/points'
import type { CandValue, StyleInfo } from '@shared/protocol'
import s from './ValuesCard.module.css'

/**
 * 候选 · 收益 vs 损失：与算法改判同一口径。每行中线左边红 = 放铳损失，右边绿 = 进攻价值（听牌时 = 期望值），
 * 右侧是净值。标出 AI 首选与实际执行的那一手。
 */
export function ValuesCard({ values, modelTop, style }: { values: CandValue[]; modelTop: string | null; style?: StyleInfo }) {
  const { t } = useTranslation()
  const m = Math.max(1, ...values.map((v) => Math.max(v.attack, v.loss)))
  const best = values.reduce((b, v) => (v.value > b ? v.value : b), -Infinity)
  const key = (v: CandValue): string => (v.kind === 'reach' ? 'reach' : v.tile)
  const picked = style?.pick ?? modelTop
  return (
    <div className={s.wrap}>
      <div className={s.head}><span /><span>{t('vals.loss')}</span><span>{t('vals.attack')}</span><span>{t('vals.net')}</span></div>
      {values.map((v) => {
        const isModel = key(v) === modelTop
        const isPick = key(v) === picked
        return (
          <div key={key(v) + v.tile} className={s.row} data-pick={isPick || undefined} data-best={v.value === best || undefined}>
            <span className={s.who}>
              <Tile code={v.tile} size="sm" />
              {v.kind === 'reach' && <span className={s.riichi}>{t('vals.riichi')}</span>}
              <span className={s.p}>
                <span className="num">{Math.round(v.p)}%</span>
                {isModel && <span className={s.tag}>{t('vals.model')}</span>}
                {isPick && !isModel && <span className={s.tag} data-pick>{t('vals.pick')}</span>}
              </span>
            </span>
            <span className={s.bar}>
              <span className={s.l}><i style={{ width: `${(v.loss / m) * 100}%` }} /></span>
              <span className={s.mid} />
              <span className={s.r}><i style={{ width: `${(Math.max(0, v.attack) / m) * 100}%` }} /></span>
            </span>
            <span className={s.sub}>
              {v.shanten === 0 && v.win_rate !== undefined ? `${pct(v.win_rate)} · ${fmt(v.avg ?? 0)}` : t(v.shanten === 0 ? 'shanten.tenpai' : 'shanten.n', { n: v.shanten }) + ` · ${v.total}`}
            </span>
            <b className={['num', s.net].join(' ')} data-sign={v.value >= 0 ? 'pos' : 'neg'}>{v.value >= 0 ? '+' : '−'}{fmt(Math.abs(v.value))}</b>
          </div>
        )
      })}
      <p className={s.hint}>{t('vals.hint')}</p>
    </div>
  )
}
