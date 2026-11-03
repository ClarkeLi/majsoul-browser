import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tile, type TileState } from '@renderer/components/ui/Tile'
import { Tooltip } from '@renderer/components/ui/Tooltip'
import { tileName } from '@renderer/lib/tiles'
import { useSettings } from '@renderer/stores'
import { Bar } from '@renderer/components/ui/Bar'
import type { Alt, Analysis, Meld, RecommendationMsg } from '@shared/protocol'
import s from './HandRow.module.css'

interface Props { hand: string[]; drawn: string | null; melds: Meld[]; rec: RecommendationMsg | null; candidates: Alt[]; risk?: Analysis['risk'] }

const GAP = 2
const DRAWN_GAP = 10

function TileWithRisk({ code, px, tip, state, tier, label }: { code: string; px: number; tip: string; state: TileState; tier?: number; label: string }) {
  return (
    <span className={s.col}>
      <Tooltip content={tip}><Tile code={code} px={px} state={state} /></Tooltip>
      {tier !== undefined && <span className={s.risk} style={{ width: px }}><Bar value={(tier + 1) / 5} tone={`risk-${tier}` as 'risk-0'} height={3} label={label} /></span>}
    </span>
  )
}

/** 13 张紧贴，摸到的牌与手牌之间留 10px；副露靠右。牌宽按容器宽度自适应（最大 32px）。 */
export function HandRow({ hand, drawn, melds, rec, candidates, risk }: Props) {
  const { t } = useTranslation()
  const tileMax = useSettings((st) => st.tileMax)
  const showRisk = useSettings((st) => st.showRisk)
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(368)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const meldTiles = melds.reduce((n, m) => n + m.tiles.length, 0)
  const units = hand.length + (drawn ? 1 : 0) + meldTiles * 0.7
  const fixed = GAP * (hand.length - 1) + (drawn ? DRAWN_GAP : 0) + (melds.length ? 12 + melds.length * 4 : 0)
  const px = Math.max(14, Math.min(tileMax, Math.floor((w - fixed) / Math.max(units, 1))))

  const target = rec?.kind === 'discard' ? rec.tile : rec?.kind === 'riichi' ? rec.riichi_tile : null
  // 整个界面只允许一张牌处于 recommended：优先摸到的牌，其次手牌里第一张匹配
  const recIndex = target ? (drawn === target ? -1 : hand.indexOf(target)) : -2
  const recDrawn = !!target && drawn === target
  const candSet = new Set(candidates.slice(1).map((a) => a.tile).filter(Boolean) as string[])
  const q0 = candidates[0]?.q
  const stateOf = (code: string, i: number, isDrawn: boolean): TileState => {
    if ((isDrawn && recDrawn) || (!isDrawn && i === recIndex)) return 'recommended'
    return candSet.has(code) ? 'candidate' : 'normal'
  }
  const tip = (code: string): string => {
    const a = candidates.find((c) => c.tile === code)
    const tier = risk?.[code]?.tier
    if (!a || q0 === undefined) return tier === undefined ? tileName(t, code) : `${tileName(t, code)} · ${t('risk.label', { n: tier })}`
    const dq = (a.q - q0).toFixed(2).replace('-', '−')
    return t('risk.hover', { dq, risk: tier ?? '—' })
  }

  return (
    <div className={s.wrap}>
      <div ref={ref} className={s.row} style={{ minHeight: Math.round((px * 4) / 3) + 8 }}>
        <div className={s.hand} style={{ gap: GAP }}>
          {hand.map((c, i) => (
            <TileWithRisk key={`${c}-${i}`} code={c} px={px} tip={tip(c)} state={stateOf(c, i, false)} tier={showRisk ? risk?.[c]?.tier : undefined} label={t('risk.label', { n: risk?.[c]?.tier ?? 0 })} />
          ))}
          {drawn && (
            <span style={{ marginLeft: DRAWN_GAP - GAP }}>
              <TileWithRisk code={drawn} px={px} tip={tip(drawn)} state={stateOf(drawn, -1, true)} tier={showRisk ? risk?.[drawn]?.tier : undefined} label={t('risk.label', { n: risk?.[drawn]?.tier ?? 0 })} />
            </span>
          )}
        </div>
        {melds.length > 0 && (
          <div className={s.melds}>
            {melds.map((m, i) => (
              <span key={i} className={s.meld}>{m.tiles.map((c, j) => <Tile key={j} code={c} px={Math.round(px * 0.7)} />)}</span>
            ))}
          </div>
        )}
      </div>
      {showRisk && risk && (
        <div className={s.legend} aria-hidden>
          {[0, 1, 2, 3, 4].map((n) => <span key={n}><i style={{ background: `var(--risk-${n})` }} />{t(`tier.${n}`)}</span>)}
        </div>
      )}
    </div>
  )
}
