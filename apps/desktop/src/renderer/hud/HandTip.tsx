import { useTranslation } from 'react-i18next'
import { Tile } from '@renderer/components/ui/Tile'
import { relSeat, tileName } from '@renderer/lib/tiles'
import type { RecommendationMsg, StateMsg } from '@shared/protocol'
import { TEHAI_X, TRUMO_SPACE } from '@shared/ui-map'
import { plain } from './coach'
import { Rich } from './Term'
import s from './HandTip.module.css'

/** 手牌区（单位 u）：牌中心 x 来自 ui-map，半宽约 0.37u */
const HAND_TOP = 7.7, HAND_BOTTOM = 9, HALF_W = 0.38

/** 鼠标（画面内 u 坐标）落在第几张手牌上；摸到的牌下标 = hand.length。不在手牌上返回 null。 */
export function hoveredTile(gx: number, gy: number, handLen: number, hasDrawn: boolean): number | null {
  if (gy < HAND_TOP || gy > HAND_BOTTOM) return null
  const n = handLen + (hasDrawn ? 1 : 0)
  for (let i = 0; i < n; i++) {
    const isDrawn = hasDrawn && i === handLen
    const cx = (TEHAI_X[Math.min(i, TEHAI_X.length - 1)] ?? 0) + (isDrawn ? TRUMO_SPACE : 0)
    if (Math.abs(gx - cx) <= HALF_W) return i
  }
  return null
}

/** 悬停手牌：这张牌的危险度与原因、（答案揭晓后）打它之后的向听 / 进张、AI 给它的概率。 */
export function HandTip({ state, rec, index, u, hidden }: { state: StateMsg; rec: RecommendationMsg | null; index: number; u: number; hidden: boolean }) {
  const { t } = useTranslation()
  const isDrawn = !!state.drawn && index === state.hand.length
  const code = isDrawn ? state.drawn! : state.hand[index]
  if (!code) return null
  const self = state.self_seat ?? 0
  const r = state.analysis?.risk[code] ?? state.analysis?.risk[plain(code)]
  const opt = !hidden ? rec?.insight?.options[code] ?? rec?.insight?.options[plain(code)] : undefined
  const alt = !hidden ? rec?.alts?.find((x) => x.kind === 'discard' && x.tile && plain(x.tile) === plain(code)) : undefined
  const cx = (TEHAI_X[Math.min(index, TEHAI_X.length - 1)] ?? 0) + (isDrawn ? TRUMO_SPACE : 0)
  const W = 2.7
  const left = Math.max(0.1, Math.min(16 - W - 0.1, cx - W / 2))
  return (
    <div className={s.tip} style={{ left: u * left, bottom: u * (9 - 7.48), width: u * W }} data-tier={r?.tier ?? 0} data-testid="hand-tip">
      <div className={s.head}>
        <Tile code={code} px={Math.round(u * 0.3)} />
        <b>{tileName(t, code)}</b>
        {r && <span className={s.tier} data-tier={r.tier}>{t(`tier.${r.tier}`)} · <span className="num">{t('coach.hand.risk', { v: r.risk.toFixed(1) })}</span></span>}
      </div>
      {r?.why && <div className={s.why}><Rich text={t(`tips.why.${r.why}`, { defaultValue: r.why })} />{r.vs !== undefined && <em>{t('coach.hand.vs', { who: t(`seat.${relSeat(r.vs, self)}`) })}</em>}</div>}
      {opt && <div className={s.eff}><Rich text={t('coach.hand.after', { sh: opt.shanten === 0 ? t('shanten.tenpai') : t('shanten.n', { n: opt.shanten }), n: opt.total })} /></div>}
      {alt && <div className={s.ai}><span className={s.pb}><i style={{ width: `${Math.max(2, Math.round(alt.p * 100))}%` }} /></span><span className="num">{t('coach.hand.ai', { p: Math.round(alt.p * 100) })}</span></div>}
    </div>
  )
}
