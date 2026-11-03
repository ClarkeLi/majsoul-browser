import { useTranslation } from 'react-i18next'
import { Pill } from '@renderer/components/ui/Pill'
import { Tile } from '@renderer/components/ui/Tile'
import { tileName } from '@renderer/lib/tiles'
import type { UkeireTile } from '@shared/protocol'
import s from './WaitsCard.module.css'

/** 待牌：每种牌一块，下面 4 个点表示场上还剩几张（实心 = 还在）。 */
export function WaitsCard({ waits, furiten }: { waits: UkeireTile[]; furiten: boolean }) {
  const { t } = useTranslation()
  return (
    <div className={s.wrap}>
      <div className={s.list}>
        {waits.map((w) => (
          <div key={w.tile} className={s.wt} title={`${tileName(t, w.tile)} · ${t('hero.left', { n: w.left })}`}>
            <Tile code={w.tile} size="md" />
            <span className={s.pips} aria-label={t('hero.left', { n: w.left })}>
              {[0, 1, 2, 3].map((i) => <i key={i} data-gone={i >= w.left || undefined} />)}
            </span>
          </div>
        ))}
      </div>
      {furiten && <Pill tone="red">{t('shanten.furiten')}</Pill>}
    </div>
  )
}
