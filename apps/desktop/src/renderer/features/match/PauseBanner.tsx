import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/Button'
import s from './PauseBanner.module.css'

export function PauseBanner({ reason, onResume }: { reason: string; onResume: () => void }) {
  const { t } = useTranslation()
  return (
    <div className={s.banner} role="alert">
      <span className={s.text}>{t(`reason.${reason}`, { defaultValue: reason })}</span>
      <Button variant="secondary" onClick={onResume}>{t('banner.resume')}</Button>
    </div>
  )
}
