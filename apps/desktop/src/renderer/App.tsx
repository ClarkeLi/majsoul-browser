import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/Button'
import { Dialog } from '@renderer/components/ui/Dialog'
import { ToastHost } from '@renderer/components/ui/Toast'
import i18n from '@renderer/i18n'
import { Sidebar, type TabId } from '@renderer/features/shell/Sidebar'
import { StatusBar } from '@renderer/features/shell/StatusBar'
import { TopBar } from '@renderer/features/shell/TopBar'
import { applyTheme } from '@renderer/lib/theme'
import { applyCoreMessage, updateSettings, useMatch, useModels, useReview, useSession, useStats, useSettings, useToasts } from '@renderer/stores'
import type { Mode } from '@shared/protocol'
import s from './App.module.css'
import { SCENARIOS, scenario, type Scenario } from './mock/scenarios'

const SB_MIN = 340
const SB_MAX = 520

function mockFromHash(): { name: Scenario; theme?: string; sidebar?: number; collapsed?: boolean } | null {
  const m = /^#\/mock\/([\w-]+)(?:\?(.*))?$/.exec(window.location.hash)
  if (!m || !SCENARIOS.includes(m[1] as Scenario)) return null
  const q = new URLSearchParams(m[2] ?? '')
  return { name: m[1] as Scenario, theme: q.get('theme') ?? undefined, sidebar: q.get('sidebar') ? Number(q.get('sidebar')) : undefined, collapsed: q.get('collapsed') === '1' }
}

export function App() {
  const { t } = useTranslation()
  const mock = useRef(mockFromHash()).current
  const settings = useSettings()
  const [tab, setTab] = useState<TabId>('match')
  const [platform, setPlatform] = useState('darwin')
  const [dataRoot, setDataRoot] = useState('…/MajsoulBrowserData')
  const [version, setVersion] = useState('0.1.0')
  const [confirmAuto, setConfirmAuto] = useState(false)
  const wizardOpen = !settings.firstRunDone
  const autoConfirmed = useRef(false)
  const push = useToasts((st) => st.push)

  // ---- 初始化：mock 场景或真实 Core
  useEffect(() => {
    if (mock) {
      const b = scenario(mock.name)
      useSession.setState(b.session)
      useMatch.setState(b.match)
      if (b.tab) setTab(b.tab)
      if (b.models) useModels.setState(b.models)
      if (b.reviews) useReview.setState(b.reviews as never)
      if (b.stats) useStats.setState({ data: b.stats })
      if (b.firstRun) settings.patch({ firstRunDone: false })
      if (b.showRisk) settings.patch({ showRisk: true })
      settings.patch({ theme: (mock.theme as 'dark' | 'light') ?? 'dark', sidebar: { width: mock.sidebar ?? 400, collapsed: !!mock.collapsed } })
      return
    }
    const api = window.soul
    if (!api) return
    void api.info().then((i) => { setPlatform(i.platform); setDataRoot(i.dataRoot); setVersion(i.version) })
    void api.getSettings().then((st) => { settings.patch(st as never); void i18n.changeLanguage((st as { language?: string }).language ?? 'zh-CN') })
    const off = [
      api.onCore((m) => applyCoreMessage(m, useSettings.getState().autoDelayMs)),
      api.onCoreStatus((st) => useSession.setState({ coreState: st.state })),
      api.onStats((st) => useSession.setState({ frames: st.frames })),
      api.onAppEvent((e) => {
        if (e.t === 'auto-stopped') { useSession.setState({ mode: 'assist' }); push(t('toast.autoStopped')) }
        if (e.t === 'shortcut') handleShortcut(String(e.name))
        if (e.t === 'settings') useSettings.getState().patch(e.settings as never)
        if (e.t === 'automatch') {
          useSession.setState({ automatch: String(e.status), automatchDetail: e.detail ? String(e.detail) : undefined })
          if (e.status === 'stuck') push(t('automatch.stuck'))
        }
      })
    ]
    return () => off.forEach((f) => f())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => applyTheme(settings.theme), [settings.theme])

  const setMode = useCallback((m: Mode) => {
    useSession.setState({ mode: m })
    window.soul?.setMode(m)
    if (m !== 'auto') useMatch.setState({ exec: { s: 'idle' } })
  }, [])

  const onMode = (m: Mode): void => {
    if (m === 'auto' && !autoConfirmed.current) { setConfirmAuto(true); return }
    setMode(m)
  }

  const stop = (): void => { window.soul?.stopAuto(); if (mock) { setMode('assist'); push(t('toast.autoStopped')) } }

  const toggleSidebar = (): void => {
    const next = { ...settings.sidebar, collapsed: !settings.sidebar.collapsed }
    settings.patch({ sidebar: next })
    window.soul?.setSidebar(next)
  }

  function handleShortcut(name: string): void {
    if (name === 'toggle-sidebar') toggleSidebar()
    else if (name === 'toggle-assist') setMode(useSession.getState().mode === 'off' ? 'assist' : 'off')
    else if (name.startsWith('tab-')) setTab((['match', 'review', 'stats', 'models'] as TabId[])[Number(name.slice(4)) - 1] ?? 'match')
  }

  // ---- 拖拽侧栏宽度（pointer capture：光标越过原生游戏视图时也不丢事件）
  const drag = useRef<{ x: number; w: number } | null>(null)
  const onDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, w: settings.sidebar.width }
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!drag.current) return
    const w = Math.min(SB_MAX, Math.max(SB_MIN, drag.current.w + (drag.current.x - e.clientX)))
    settings.patch({ sidebar: { ...settings.sidebar, width: w } })
  }
  const onUp = (): void => {
    if (!drag.current) return
    drag.current = null
    window.soul?.setSidebar(useSettings.getState().sidebar)
  }

  const sbW = settings.sidebar.collapsed ? 56 : settings.sidebar.width
  return (
    <div className={s.app}>
      <TopBar platform={platform} onMode={onMode} onStop={stop} onSettings={() => setTab('settings')} />
      <div className={s.main} style={{ gridTemplateColumns: `minmax(0, 1fr) ${sbW}px` }}>
        <div className={s.game} aria-hidden />
        <div className={s.sideWrap}>
          {!settings.sidebar.collapsed && (
            <div className={s.handle} role="separator" aria-orientation="vertical" aria-label={t('sidebar.resize')}
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} />
          )}
          <Sidebar width={sbW} collapsed={settings.sidebar.collapsed} tab={tab} version={version} onTab={setTab} onToggle={toggleSidebar}>
            <Dialog open={wizardOpen} title={t('wizard.title')} onClose={() => {}}
              actions={<Button variant="primary-gold" data-autofocus onClick={() => updateSettings({ firstRunDone: true })}>{t('wizard.start')}</Button>}>
              <ul className={s.list}>{(t('wizard.items', { returnObjects: true }) as unknown as string[]).map((x) => <li key={x}>{x}</li>)}</ul>
            </Dialog>
            <Dialog open={confirmAuto} title={t('dialog.autoTitle')} onClose={() => setConfirmAuto(false)}
              actions={<>
                <Button variant="secondary" data-autofocus onClick={() => setConfirmAuto(false)}>{t('dialog.cancel')}</Button>
                <Button variant="primary-gold" onClick={() => { autoConfirmed.current = true; setConfirmAuto(false); setMode('auto') }}>{t('dialog.enable')}</Button>
              </>}>
              <ul className={s.list}>{(t('dialog.autoItems', { returnObjects: true }) as unknown as string[]).map((x) => <li key={x}>{x}</li>)}</ul>
            </Dialog>
          </Sidebar>
        </div>
      </div>
      <StatusBar dataRoot={dataRoot} />
      <ToastHost />
    </div>
  )
}
