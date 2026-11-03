import { useTranslation } from 'react-i18next'
import { tileName } from '@renderer/lib/tiles'
import type { TimelineEntry } from '@renderer/stores/types'
import s from './DecisionTimeline.module.css'

export function DecisionTimeline({ entries }: { entries: TimelineEntry[] }) {
  const { t } = useTranslation()
  const what = (e: TimelineEntry): string => {
    const k = e.kind === 'discard' ? t('action.discard') : t(`action.${e.kind}`)
    return e.tile && (e.kind === 'discard' || e.kind === 'riichi') ? `${k} ${tileName(t, e.tile)}` : k
  }
  return (
    <ul className={s.list}>
      {entries.length === 0 && <li className={s.empty}>{t('timeline.empty')}</li>}
      {entries.map((e, i) => (
        <li key={e.id} className={[s.row, e.agree === false ? s.differ : ''].join(' ')}>
          <span className={[s.seq, 'num'].join(' ')}>{String(entries.length - i).padStart(2, '0')}</span>
          <span className={s.what}>{e.actual ? `${t('action.discard')} ${tileName(t, e.actual)}` : what(e)}</span>
          <span className={s.rec}>{t('timeline.recommended', { what: what(e) })}</span>
          <span className={s.verdict}>
            {e.agree === true ? `✓ ${t('timeline.agree')}` : e.agree === false ? `✗ ${t('timeline.differ')}` : e.executed ? `✓ ${t('timeline.executed')}` : ''}
          </span>
          <span className={[s.ms, 'num'].join(' ')}>{Math.round(e.latencyMs)}ms</span>
        </li>
      ))}
    </ul>
  )
}
