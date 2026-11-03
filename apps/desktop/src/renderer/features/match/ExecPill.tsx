import { useTranslation } from 'react-i18next'
import { Pill, type PillTone } from '@renderer/components/ui/Pill'
import type { ExecStatus } from '@renderer/stores/types'
import type { Mode } from '@shared/protocol'

export function ExecPill({ exec, mode }: { exec: ExecStatus; mode: Mode }) {
  const { t } = useTranslation()
  let tone: PillTone = 'gray'
  let text: string
  switch (exec.s) {
    case 'scheduled': tone = 'gold'; text = t('exec.scheduled', { s: (exec.delayMs / 1000).toFixed(1) }); break
    case 'executing': tone = 'gold'; text = t('exec.executing'); break
    case 'confirmed': tone = 'jade'; text = t('exec.confirmed'); break
    case 'paused': tone = 'amber'; text = t('exec.paused', { reason: t(`reason.${exec.reason}`, { defaultValue: exec.reason }) }); break
    case 'failed': tone = 'red'; text = t('exec.failed', { reason: t(`reason.${exec.reason}`, { defaultValue: exec.reason }) }); break
    case 'thinking': text = t('exec.thinking'); break
    default: text = mode === 'off' ? t('exec.offMode') : t('exec.idle')
  }
  return <Pill tone={tone}>{text}</Pill>
}
