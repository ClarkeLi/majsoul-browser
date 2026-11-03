import { Check, Circle, Loader } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/Button'
import { Card } from '@renderer/components/ui/Card'
import { Pill } from '@renderer/components/ui/Pill'
import { useModels } from '@renderer/stores'
import { EmptyState } from '../match/EmptyState'
import s from './ModelsPage.module.css'

const STEPS = ['copy', 'verify', 'load'] as const

export function ModelsPage() {
  const { t, i18n } = useTranslation()
  const m = useModels()

  useEffect(() => {
    const api = window.soul
    if (!api) return
    void api.listModels().then((list) => useModels.setState({ list }))
    void api.getSettings().then((st) => {
      const path = (st as { activeModel?: string | null }).activeModel
      if (path) useModels.setState({ active: path.split(/[\\/]/).pop()!.replace(/\.pth$/, '') })
    })
    return api.onModelProgress((p) => {
      const st = useModels.getState()
      if ('step' in p) useModels.setState({ steps: { ...st.steps, [p.step]: 'ok' } })
      else if ('error' in p) useModels.setState({ error: p.error, importing: false })
      else if ('done' in p) { useModels.setState({ importing: false, list: [...st.list.filter((x) => x.sha256 !== p.done.sha256), p.done] }) }
    })
  }, [])

  const doImport = async (): Promise<void> => {
    useModels.setState({ importing: true, error: '', steps: { copy: 'running' } })
    const r = await window.soul?.importModel()
    if (r?.canceled) useModels.setState({ importing: false, steps: {} })
  }
  const date = (sec: number): string => new Date(sec * 1000).toLocaleDateString(i18n.language)

  return (
    <div className={s.page}>
      <div className={s.head}>
        <Button variant="primary-gold" onClick={doImport} disabled={m.importing}>{t('models.import')}</Button>
        {m.pending && <Pill tone="amber">{t('models.pending')}</Pill>}
      </div>
      {(m.importing || m.error) && (
        <Card>
          <ul className={s.steps}>
            {STEPS.map((k) => {
              const st = m.steps[k] ?? 'pending'
              return (
                <li key={k} className={s.step} data-state={st}>
                  {st === 'ok' ? <Check size={14} strokeWidth={1.75} /> : st === 'running' ? <Loader size={14} strokeWidth={1.75} /> : <Circle size={14} strokeWidth={1.75} />}
                  <span>{t(`models.steps.${k}`)}</span>
                </li>
              )
            })}
          </ul>
          {m.error && <div className={s.err} role="alert">{t('models.failed', { msg: m.error })}</div>}
        </Card>
      )}
      {m.list.length === 0 && !m.importing ? (
        <EmptyState title={t('models.empty')} desc={t('models.emptyDesc')} />
      ) : (
        m.list.map((e) => {
          const active = m.active === e.sha256
          return (
            <Card key={e.sha256} className={active ? s.active : ''}>
              <div className={s.row}>
                <div className={s.name}>{e.tag || e.name}</div>
                {active ? <Pill tone="gold">{t('models.active')}</Pill> : (
                  <Button variant="secondary" onClick={async () => { if (await window.soul?.activateModel(e.sha256)) useModels.setState({ active: e.sha256 }) }}>{t('models.activate')}</Button>
                )}
              </div>
              <div className={s.meta}>
                <span className="mono">{e.sha256.slice(0, 8)}</span>
                <span>{t('models.size', { mb: (e.size / 1048576).toFixed(0) })}</span>
                <span>v{e.version}</span>
                <span>{t('models.imported', { date: date(e.imported_at) })}</span>
              </div>
            </Card>
          )
        })
      )}
    </div>
  )
}
