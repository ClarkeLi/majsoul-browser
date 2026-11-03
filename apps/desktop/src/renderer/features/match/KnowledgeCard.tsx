import { useTranslation } from 'react-i18next'
import { renderKnowledge } from '@renderer/lib/points'
import type { Tip } from '@shared/protocol'
import s from './KnowledgeCard.module.css'

/** 知识点：这一手相关的 1–3 条规则 / 常识（旧面板的“这一手的知识点”）。 */
export function KnowledgeCard({ items, self }: { items: Tip[]; self: number }) {
  const { t } = useTranslation()
  return (
    <ul className={s.list}>
      {items.map((k) => <li key={k.code}><span className={s.ic} aria-hidden>i</span><span>{renderKnowledge(t, k, self)}</span></li>)}
    </ul>
  )
}
