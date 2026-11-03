import { useTranslation } from 'react-i18next'
import { Pill } from '@renderer/components/ui/Pill'
import { Tile } from '@renderer/components/ui/Tile'
import { doraFromMarker, seatWind } from '@renderer/lib/dora'
import type { RecommendationMsg, StateMsg } from '@shared/protocol'
import s from './StatusStrip.module.css'

/** 局况条：东 1 局 · 本场 · 供托 · 余牌 · 巡目 · 自风 · 宝牌；右侧是向听 / 听牌 / 振听。 */
export function StatusStrip({ state, rec }: { state: StateMsg; rec: RecommendationMsg | null }) {
  const { t } = useTranslation()
  const r = state.round
  const a = state.analysis
  const self = state.self_seat ?? 0
  // 向听来源：没有摸牌时用手牌本身；摸牌后用推荐牌打后的向听
  const focus = rec?.kind === 'riichi' ? rec.riichi_tile : rec?.tile
  const after = focus ? rec?.insight?.options[focus]?.shanten : undefined
  const sh = a?.wait ? a.wait.shanten : after
  let pill: { tone: 'jade' | 'red' | 'gray'; text: string } | null = null
  if (a?.furiten) pill = { tone: 'red', text: t('shanten.furiten') }
  else if (sh === 0) pill = { tone: 'jade', text: t('shanten.tenpai') }
  else if (sh !== undefined && sh > 0) pill = { tone: 'gray', text: t('shanten.n', { n: sh }) }

  return (
    <div className={s.strip}>
      <div className={s.row}>
        <span className={s.kyoku}>{t('bars.round', { wind: t(`wind.${r.bakaze}`), kyoku: r.kyoku })}</span>
        <span className={s.chips}>
          <span>{t('shanten.honbaShort', { n: r.honba })}</span>
          {r.kyotaku > 0 && <span>{t('round.kyotaku', { n: r.kyotaku })}</span>}
          {r.left !== null && <span>{t('shanten.leftShort', { n: r.left })}</span>}
          {a?.turn !== undefined && <span>{t('shanten.turn', { n: a.turn })}</span>}
          <span>{t('shanten.seatWind', { w: t(`wind.${seatWind(self, r.oya)}`) })}</span>
        </span>
        {pill && <span className={s.pill}><Pill tone={pill.tone}>{pill.text}</Pill></span>}
      </div>
      <div className={s.row}>
        <span className={s.lbl}>{t('round.dora')}</span>
        <span className={s.dora}>
          {r.dora_markers.map((m, i) => (
            <span key={i} className={s.pair}><Tile code={m} size="xs" /><i>›</i><Tile code={doraFromMarker(m)} size="sm" /></span>
          ))}
        </span>
      </div>
    </div>
  )
}
