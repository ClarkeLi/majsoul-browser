import { Repeat, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/Button'
import { Tooltip } from '@renderer/components/ui/Tooltip'
import { updateSettings, useMatch, useSession, useSettings } from '@renderer/stores'
import type { Mode } from '@shared/protocol'
import { ModeSwitch } from './ModeSwitch'
import s from './TopBar.module.css'

interface Props { platform: string; onMode: (m: Mode) => void; onStop: () => void; onSettings: () => void }

export function TopBar({ platform, onMode, onStop, onSettings }: Props) {
  const { t } = useTranslation()
  const session = useSession()
  const state = useMatch((m) => m.state)
  const rec = useMatch((m) => m.rec)
  const autoMatch = useSettings((x) => x.autoMatch)
  const amStatus = session.mode === 'auto' && autoMatch ? session.automatch ?? 'scanning' : 'off'
  const mac = platform === 'darwin'
  const dot = session.phase === 'in_game' ? 'jade' : session.connected ? 'amber' : 'gray'
  const dotLabel = session.phase === 'in_game' ? t('topbar.connected') : session.connected ? t('topbar.lobby') : t('topbar.disconnected')
  const round = state && session.phase === 'in_game'
    ? t('round.label', { wind: t(`wind.${state.round.bakaze}`), kyoku: state.round.kyoku, honba: state.round.honba })
    : ''
  const hotkey = platform === 'darwin' ? '⌃⇧Space' : 'Ctrl+Shift+Space'
  const modelText = session.model === 'ready' ? t('topbar.model', { name: session.modelName || 'Mortal', ms: Math.round(rec?.latency_ms ?? 0) }) : t('topbar.modelNone')

  return (
    <header className={s.bar} data-mode={session.mode}>
      <div className={s.left} style={{ paddingLeft: mac ? 'var(--traffic-light-w)' : 'var(--sp-4)' }}>
        <span className={s.app}>{t('app.name')}</span>
        <span className={s.conn}><span className={[s.dot, s[dot]].join(' ')} aria-hidden />{dotLabel}{round && ` · ${round}`}</span>
      </div>
      <div className={s.right}>
        <span className={s.model}>{modelText}</span>
        <ModeSwitch mode={session.mode} onChange={onMode} />
        <Tooltip content={t('automatch.hint')} side="bottom">
          <button type="button" className={s.am} data-on={autoMatch || undefined} data-status={amStatus} onClick={() => {
            // 打开自动匹配 = 全程自动：还不是自动模式就一并切过去（第一次会弹出确认）
            // 已停下（stuck）时再点一次 = 从当前画面重新接着走，而不是关掉
            const next = amStatus === 'stuck' ? true : !autoMatch
            updateSettings({ autoMatch: next })
            if (next && session.mode !== 'auto') onMode('auto')
          }} aria-pressed={autoMatch}>
            <Repeat size={13} strokeWidth={2} />
            <span>{t('automatch.label')}</span>
            {autoMatch && <em>{t(`automatch.s.${amStatus}`)}</em>}
          </button>
        </Tooltip>
        {session.mode === 'auto' && (
          <Button variant="danger" onClick={onStop} aria-label={t('topbar.stopHint')}>
            {t('topbar.stop')}<span className={s.hotkey}>{hotkey}</span>
          </Button>
        )}
        <Tooltip content={t('topbar.settings')} side="bottom">
          <Button variant="ghost" iconOnly aria-label={t('topbar.settings')} onClick={onSettings} icon={<Settings size={16} strokeWidth={1.75} />} />
        </Tooltip>
      </div>
    </header>
  )
}
