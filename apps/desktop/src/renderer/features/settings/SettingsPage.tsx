import { LANGS, LANG_LABELS } from '@shared/lang'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@renderer/i18n'
import { Button } from '@renderer/components/ui/Button'
import { Dialog } from '@renderer/components/ui/Dialog'
import { SegmentedControl } from '@renderer/components/ui/SegmentedControl'
import { Switch } from '@renderer/components/ui/Switch'
import { updateSettings, useSettings } from '@renderer/stores'
import s from './SettingsPage.module.css'

function Row({ label, desc, children }: { label: string; desc: string; children: ReactNode }) {
  return (
    <div className={s.row}>
      <div className={s.text}><div className={s.label}>{label}</div><div className={s.desc}>{desc}</div></div>
      <div className={s.ctl}>{children}</div>
    </div>
  )
}

/** 打牌风格：总开关 + 掷骰 / 爱赌 / 算法改判三个分项，以及预计的 AI 一致率 */
function StylePanel() {
  const { t } = useTranslation()
  const st = useSettings()
  const on = st.playStyle
  const parts = st.styleParts
  const anyPart = parts.dice || parts.gamble || parts.arb
  // 旧原型自对战标定：只开掷骰 ≈ 80%；爱赌 / 改判只在少数局面介入（真实对局回放见 docs/STATUS.md）
  const agree = !on || !anyPart ? 100 : parts.dice ? 80 : 97
  const keys = ['dice', 'gamble', 'arb'] as const
  return (
    <section className={s.style} data-on={on || undefined}>
      <div className={s.styleHead}>
        <div className={s.text}>
          <div className={s.styleTitle}>{t('settings.playStyle')}</div>
          <div className={s.desc}>{t('settings.playStyleDesc')}</div>
        </div>
        <Switch label={t('settings.playStyle')} checked={on} onChange={(v) => updateSettings({ playStyle: v })} />
      </div>
      <div className={s.agree}>
        <span>{t('settings.agree')}</span>
        <span className={s.agreeTrack} role="meter" aria-valuenow={agree} aria-valuemin={0} aria-valuemax={100} aria-label={t('settings.agree')}>
          <span className={s.agreeFill} style={{ width: `${agree}%` }} />
        </span>
        <b className="num">{agree === 100 ? '100%' : `≈ ${agree}%`}</b>
      </div>
      <div className={s.agreeNote}>{on && anyPart ? t('settings.agreeOn') : t('settings.agreeOff')}</div>
      <div className={s.parts} aria-disabled={!on || undefined}>
        {keys.map((k) => (
          <div key={k} className={s.part} data-active={(on && parts[k]) || undefined}>
            <div className={s.partHead}>
              <span className={s.partName}>{t(`settings.style.${k}`)}</span>
              <Switch label={t(`settings.style.${k}`)} checked={parts[k]} onChange={(v) => updateSettings({ styleParts: { ...parts, [k]: v } })} />
            </div>
            <div className={s.partDesc}>{t(`settings.style.${k}Desc`)}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function SettingsPage({ version }: { version: string }) {
  const { t } = useTranslation()
  const st = useSettings()
  const [confirm, setConfirm] = useState<null | 'login' | 'records'>(null)
  return (
    <div className={s.page}>
      <h2 className={s.group}>{t('settings.general')}</h2>
      <Row label={t('settings.language')} desc={t('settings.languageDesc')}>
        <SegmentedControl aria-label={t('settings.language')} value={st.language} onChange={(v) => { void i18n.changeLanguage(v); updateSettings({ language: v }) }}
          options={LANGS.map((l) => ({ value: l, label: LANG_LABELS[l] }))} />
      </Row>
      <Row label={t('settings.theme')} desc={t('settings.themeDesc')}>
        <SegmentedControl aria-label={t('settings.theme')} value={st.theme} onChange={(v) => updateSettings({ theme: v })}
          options={[{ value: 'dark', label: t('settings.themeDark') }, { value: 'light', label: t('settings.themeLight') }, { value: 'system', label: t('settings.themeSystem') }]} />
      </Row>

      <h2 className={s.group}>{t('settings.auto')}</h2>
      <StylePanel />
      <Row label={t('settings.delay')} desc={t('settings.delayDesc')}><span className={s.value}>{t('settings.delayValue')}</span></Row>
      <Row label={t('settings.failPolicy')} desc={t('settings.failPolicyDesc')}><span className={s.value}>{t('settings.failPolicyValue')}</span></Row>

      <h2 className={s.group}>{t('hud.title')}</h2>
      <Row label={t('hud.title')} desc={t('hud.desc')}><Switch label={t('hud.title')} checked={st.overlayEnabled} onChange={(v) => updateSettings({ overlayEnabled: v })} /></Row>
      <Row label={t('hud.scale')} desc={t('hud.scaleDesc')}>
        <SegmentedControl aria-label={t('hud.scale')} value={String(st.hudScale)} onChange={(v) => updateSettings({ hudScale: Number(v) })}
          options={[{ value: '0.85', label: t('hud.small') }, { value: '1', label: t('hud.mid') }, { value: '1.1', label: t('hud.large') }]} />
      </Row>
      <Row label={t('hud.side')} desc={t('hud.sideDesc')}>
        <SegmentedControl aria-label={t('hud.side')} value={st.hudSide} onChange={(v) => updateSettings({ hudSide: v })}
          options={[{ value: 'both', label: t('hud.both') }, { value: 'left', label: t('hud.left') }, { value: 'right', label: t('hud.right') }]} />
      </Row>
      <Row label={t('hud.reserve')} desc={t('hud.reserveDesc')}><Switch label={t('hud.reserve')} checked={st.hudReserve} onChange={(v) => updateSettings({ hudReserve: v })} /></Row>
      <Row label={t('hud.dock')} desc={t('hud.dockDesc')}>
        <SegmentedControl aria-label={t('hud.dock')} value={st.hudDock} onChange={(v) => updateSettings({ hudDock: v })}
          options={[{ value: 'split', label: t('hud.dockSplit') }, { value: 'bottom', label: t('hud.dockBottom') }]} />
      </Row>
      <Row label={t('automatch.label')} desc={t('automatch.desc')}><Switch label={t('automatch.label')} checked={st.autoMatch} onChange={(v) => updateSettings({ autoMatch: v })} /></Row>
      <Row label={t('hud.practice')} desc={t('hud.practiceDesc')}><Switch label={t('hud.practice')} checked={st.hudPractice} onChange={(v) => updateSettings({ hudPractice: v })} /></Row>
      <Row label={t('hud.teach')} desc={t('hud.teachDesc')}><Switch label={t('hud.teach')} checked={st.hudTeach} onChange={(v) => updateSettings({ hudTeach: v })} /></Row>
      <Row label={t('hud.bars')} desc={t('hud.barsDesc')}><Switch label={t('hud.bars')} checked={st.hudBars} onChange={(v) => updateSettings({ hudBars: v })} /></Row>

      <h2 className={s.group}>{t('settings.display')}</h2>
      <Row label={t('settings.risk')} desc={t('settings.riskDesc')}><Switch label={t('settings.risk')} checked={st.showRisk} onChange={(v) => updateSettings({ showRisk: v })} /></Row>
      <Row label={t('settings.candidates')} desc={t('settings.candidatesDesc')}>
        <SegmentedControl aria-label={t('settings.candidates')} value={String(st.candidateCount)} onChange={(v) => updateSettings({ candidateCount: Number(v) as 1 | 2 | 3 })}
          options={['1', '2', '3'].map((n) => ({ value: n, label: n }))} />
      </Row>
      <Row label={t('settings.tileSize')} desc={t('settings.tileSizeDesc')}>
        <SegmentedControl aria-label={t('settings.tileSize')} value={String(st.tileMax)} onChange={(v) => updateSettings({ tileMax: Number(v) })}
          options={[{ value: '26', label: t('settings.sizeS') }, { value: '32', label: t('settings.sizeM') }, { value: '38', label: t('settings.sizeL') }]} />
      </Row>

      <h2 className={s.group}>{t('settings.data')}</h2>
      <Row label={t('settings.openDir')} desc={t('settings.openDirDesc')}><Button variant="secondary" onClick={() => window.soul?.openDataDir()}>{t('settings.openDirBtn')}</Button></Row>
      <Row label={t('settings.records')} desc={t('settings.recordsDesc')}><Switch label={t('settings.records')} checked={st.recordsEnabled} onChange={(v) => updateSettings({ recordsEnabled: v })} /></Row>
      <Row label={t('settings.diagnostics')} desc={t('settings.diagnosticsDesc')}><Button variant="secondary" onClick={() => void window.soul?.exportDiagnostics()}>{t('settings.diagnosticsBtn')}</Button></Row>
      <Row label={t('settings.clearLogin')} desc={t('settings.clearLoginDesc')}><Button variant="danger" onClick={() => setConfirm('login')}>{t('settings.clear')}</Button></Row>
      <Row label={t('settings.clearRecords')} desc={t('settings.clearRecordsDesc')}><Button variant="danger" onClick={() => setConfirm('records')}>{t('settings.clear')}</Button></Row>

      <h2 className={s.group}>{t('settings.about')}</h2>
      <Row label={t('settings.version')} desc=""><span className={s.value}>{version}</span></Row>
      <Row label={t('settings.license')} desc=""><span className={s.value}>{t('settings.licenseValue')}</span></Row>
      <Row label={t('settings.thirdParty')} desc={t('settings.thirdPartyDesc')}><span /></Row>

      <Dialog open={confirm !== null} title={t('settings.confirmTitle')} onClose={() => setConfirm(null)}
        actions={<>
          <Button variant="secondary" data-autofocus onClick={() => setConfirm(null)}>{t('settings.cancel')}</Button>
          <Button variant="danger" onClick={async () => { if (confirm === 'login') await window.soul?.clearLogin(); else await window.soul?.clearRecords(); setConfirm(null) }}>{t('settings.clear')}</Button>
        </>}>
        {confirm === 'login' ? t('settings.confirmLogin') : t('settings.confirmRecords')}
      </Dialog>
    </div>
  )
}
