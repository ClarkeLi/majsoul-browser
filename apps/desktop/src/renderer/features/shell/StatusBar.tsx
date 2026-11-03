import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/Button'
import { useMatch, useSession } from '@renderer/stores'
import s from './StatusBar.module.css'

export function StatusBar({ dataRoot }: { dataRoot: string }) {
  const { t } = useTranslation()
  const { frames, decisions } = useSession()
  const timeline = useMatch((m) => m.timeline)
  const judged = timeline.filter((e) => e.agree !== undefined)
  const agree = judged.length ? `${Math.round((judged.filter((e) => e.agree).length / judged.length) * 100)}%` : '—'
  return (
    <footer className={s.bar}>
      <span>{t('status.frames', { n: frames.toLocaleString('en-US') })}</span>
      <span>{t('status.decisions', { n: decisions })}</span>
      <span>{t('status.agree', { v: agree })}</span>
      <span className={s.path} title={dataRoot}>{t('status.dataDir', { path: dataRoot })}</span>
      <Button variant="ghost" iconOnly aria-label={t('status.info')} icon={<Info size={14} strokeWidth={1.75} />} className={s.info} />
    </footer>
  )
}
