import { useTranslation } from 'react-i18next'
import { Tile } from '@renderer/components/ui/Tile'
import { tileName } from '@renderer/lib/tiles'
import type { Analysis } from '@shared/protocol'
import s from './HeatCard.module.css'

/** 全牌危险度地图：每种牌一格，底色按综合放铳率分级，数字是余张；你手里有的牌描边。 */
export function HeatCard({ heat, hand }: { heat: NonNullable<Analysis['heat']>; hand: string[] }) {
  const { t } = useTranslation()
  const mine = new Set(hand.map((h) => (h.endsWith('r') ? h.slice(0, 2) : h)))
  const rows = [heat.slice(0, 9), heat.slice(9, 18), heat.slice(18, 27), heat.slice(27, 34)]
  return (
    <div className={s.map}>
      {rows.map((row, ri) => (
        <div key={ri} className={s.row}>
          {row.map((c) => (
            <div key={c.tile} className={s.cell} data-tier={c.tier} data-mine={mine.has(c.tile) || undefined} data-na={c.left === 0 || undefined}
              title={`${tileName(t, c.tile)} · ${t('hero.left', { n: c.left })} · ${t('hero.risk', { v: c.risk })} · ${t(`tier.${c.tier}`)}`}>
              <Tile code={c.tile} size="xs" />
              <span className="num">{c.risk}</span>
            </div>
          ))}
        </div>
      ))}
      <div className={s.legend}>{[0, 1, 2, 3, 4].map((n) => <span key={n}><i style={{ background: `var(--risk-${n})` }} />{t(`tier.${n}`)}</span>)}</div>
    </div>
  )
}
