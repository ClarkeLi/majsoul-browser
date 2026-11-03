import { useTranslation } from 'react-i18next'
import { renderTip } from '@renderer/hud/tips'
import type { Tip } from '@shared/protocol'
import s from './TipsCard.module.css'

/** 教学提示：这一手为什么这样打（与游戏画面上的信息层是同一份内容）。 */
export function TipsCard({ tips, self }: { tips: Tip[]; self: number }) {
  const { t } = useTranslation()
  return (
    <ul className={s.list}>
      {tips.map((tip) => <li key={tip.code}>{renderTip(t, tip, self)}</li>)}
    </ul>
  )
}
