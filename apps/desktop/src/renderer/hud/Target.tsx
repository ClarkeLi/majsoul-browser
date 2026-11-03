import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { RecKind } from '@shared/protocol'
import type { Shape } from '@shared/overlay-shapes'
import s from './Target.module.css'

/** 每种动作的强调色（画在游戏上，不随主题变）：打 = 青竹，立直 = 山吹，鸣 = 藍，和 = 紅。 */
export const ACT_COLOR: Record<string, string> = {
  discard: '--wa-take', riichi: '--wa-kin', tsumo: '--wa-beni', ron: '--wa-beni',
  chi: '--wa-ai', pon: '--wa-ai', daiminkan: '--wa-ai', ankan: '--wa-ai', kakan: '--wa-ai',
  pass: '--wa-kinari', kyuushu: '--wa-kinari'
}

/**
 * “点这里”：实色粗框（外圈墨色描边，在奶白牌面和蓝色牌桌上都看得清）+ 一圈向外扩的细线 + 上方的札（动作名，轻轻上下跳）。
 * 每个新推荐会像“拍牌”一样落下一次（key = revision）。整个元素点击穿透。
 */
export function Target({ r, kind }: { r: Shape; kind: RecKind | null }) {
  const { t } = useTranslation()
  const word = r.step === 'hand' ? t('action.discard') : r.step === 'candidate' ? t('hud.pickCombo') : kind ? t(`action.${kind}`) : ''
  const style = { left: r.cx - r.w / 2, top: r.cy - r.h / 2, width: r.w, height: r.h, '--acc': `var(${ACT_COLOR[kind ?? 'discard'] ?? '--wa-take'})` } as CSSProperties
  return (
    <div className={s.target} data-kind={r.kind} style={style} data-testid="target">
      <i className={s.ripple} />
      <span className={s.frame} />
      <span className={s.tag}>
        {r.label && <em className="num">{r.label}</em>}
        {word}
      </span>
    </div>
  )
}
