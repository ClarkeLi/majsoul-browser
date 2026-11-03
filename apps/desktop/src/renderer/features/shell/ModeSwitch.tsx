import { useTranslation } from 'react-i18next'
import { SegmentedControl } from '@renderer/components/ui/SegmentedControl'
import type { Mode } from '@shared/protocol'

export function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const { t } = useTranslation()
  return (
    <SegmentedControl<Mode>
      aria-label={t('mode.label')}
      value={mode}
      onChange={onChange}
      options={[
        { value: 'off', label: t('mode.off') },
        { value: 'assist', label: t('mode.assist') },
        { value: 'auto', label: t('mode.auto'), tone: 'gold' }
      ]}
    />
  )
}
