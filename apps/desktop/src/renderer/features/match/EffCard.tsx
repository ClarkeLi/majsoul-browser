import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar } from '@renderer/components/ui/Bar'
import { Tile } from '@renderer/components/ui/Tile'
import { tileName } from '@renderer/lib/tiles'
import type { Alt, RecommendationMsg } from '@shared/protocol'
import s from './EffCard.module.css'

function label(t: ReturnType<typeof useTranslation>['t'], a: Alt): string {
  if (a.tile) return `${t('action.discard')} ${tileName(t, a.tile)}`
  const map: Record<string, string> = { riichi: 'riichi', chi: 'chi', pon: 'pon', kan: 'daiminkan', hora: 'ron', kyuushu: 'kyuushu', pass: 'pass' }
  return t(`action.${map[a.kind] ?? a.kind}`)
}

/** 候选 · 牌效：每个候选动作的概率，以及打后向听、进张；点一行展开进张牌与余张。 */
export function EffCard({ rec, max }: { rec: RecommendationMsg | null; max: number }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState<string | null>(null)
  const alts = (rec?.alts ?? []).slice(0, max + 1)
  const options = rec?.insight?.options ?? {}
  if (alts.length === 0) return <div className={s.empty}>{t('rec.none')}</div>
  return (
    <div className={s.table}>
      <div className={[s.row, s.hd].join(' ')}>
        <span /><span />
        <span>{t('rec.candidates')}</span>
        <span className={s.r}>{t('eff.shanten')}</span>
        <span className={s.r}>{t('eff.ukeire')}</span>
      </div>
      {alts.map((a, i) => {
        const o = a.tile ? options[a.tile] : undefined
        const expandable = !!o && o.ukeire.length > 0
        const isOpen = open === a.id
        return (
          <div key={a.id} className={s.item} data-top={i === 0 || undefined}>
            <button type="button" className={s.row} disabled={!expandable} aria-expanded={expandable ? isOpen : undefined} onClick={() => setOpen(isOpen ? null : a.id)}>
              <span className={s.tile}>{a.tile ? <Tile code={a.tile} size="sm" /> : null}</span>
              <span className={s.name}>{label(t, a)}</span>
              <span className={s.p} title={`${Math.round(a.p * 100)}%`}>
                <Bar value={a.p} height={4} label={`${Math.round(a.p * 100)}%`} />
                <b className="num">{Math.round(a.p * 100)}%</b>
              </span>
              <span className={[s.r, s.sh].join(' ')} data-tenpai={o?.shanten === 0 || undefined}>
                {o ? (o.shanten === 0 ? t('eff.tenpaiAfter') : t('eff.cnt', { n: o.shanten })) : ''}
              </span>
              <span className={[s.r, 'num'].join(' ')}>{o ? o.total : ''}</span>
            </button>
            {isOpen && o && (
              <div className={s.uk}>
                {o.ukeire.map((u) => (
                  <span key={u.tile} className={s.ut} title={`${tileName(t, u.tile)} · ${t('hero.left', { n: u.left })}`}>
                    <Tile code={u.tile} size="xs" /><em className="num">{u.left}</em>
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
