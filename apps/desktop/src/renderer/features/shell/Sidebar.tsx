import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/Button'
import { Tabs } from '@renderer/components/ui/Tabs'
import { Tile } from '@renderer/components/ui/Tile'
import { MatchPage } from '@renderer/features/match/MatchPage'
import { ModelsPage } from '@renderer/features/models/ModelsPage'
import { ReviewPage } from '@renderer/features/review/ReviewPage'
import { SettingsPage } from '@renderer/features/settings/SettingsPage'
import { StatsPage } from '@renderer/features/stats/StatsPage'
import { useMatch, useSession } from '@renderer/stores'
import s from './Sidebar.module.css'

export type TabId = 'match' | 'review' | 'stats' | 'models' | 'settings'

interface Props { width: number; collapsed: boolean; tab: TabId; version: string; onTab: (t: TabId) => void; onToggle: () => void; children?: ReactNode }

export function Sidebar({ width, collapsed, tab, version, onTab, onToggle, children }: Props) {
  const { t } = useTranslation()
  const rec = useMatch((m) => m.rec)
  const mode = useSession((st) => st.mode)
  if (collapsed) {
    return (
      <aside className={s.rail} style={{ width: 'var(--rail-w)' }} aria-label={t('tabs.match')}>
        <div className={s.railTile}>{rec?.tile ? <Tile code={rec.kind === 'riichi' ? rec.riichi_tile ?? rec.tile : rec.tile} size="sm" state="recommended" /> : null}</div>
        <span className={s.railMode}>{t(`mode.${mode}`)}</span>
        <Button variant="ghost" iconOnly aria-label={t('sidebar.expand')} onClick={onToggle} icon={<ChevronsLeft size={16} strokeWidth={1.75} />} />
        {children}
      </aside>
    )
  }
  return (
    <aside className={s.side} style={{ width }}>
      <div className={s.tabrow}>
        <Tabs<TabId> label={t('tabs.match')} value={tab} onChange={onTab}
          items={[{ value: 'match', label: t('tabs.match') }, { value: 'review', label: t('tabs.review') }, { value: 'stats', label: t('tabs.stats') }, { value: 'models', label: t('tabs.models') }]} />
        <Button variant="ghost" iconOnly aria-label={t('sidebar.collapse')} onClick={onToggle} className={s.collapse} icon={<ChevronsRight size={16} strokeWidth={1.75} />} />
      </div>
      <div className={tab === 'match' ? s.matchBody : s.scroll}>
        {tab === 'match' && <MatchPage />}
        {tab === 'review' && <ReviewPage />}
        {tab === 'stats' && <StatsPage />}
        {tab === 'models' && <ModelsPage />}
        {tab === 'settings' && <SettingsPage version={version} />}
      </div>
      {children}
    </aside>
  )
}
