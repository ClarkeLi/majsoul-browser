import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/Button'
import { CollapsibleCard } from '@renderer/components/ui/CollapsibleCard'
import { deriveView, useMatch, useSession, useSettings } from '@renderer/stores'
import { DecisionTimeline } from './DecisionTimeline'
import { EffCard } from './EffCard'
import { EmptyState } from './EmptyState'
import { HandRow } from './HandRow'
import { HeatCard } from './HeatCard'
import { OpponentsCard } from './OpponentsCard'
import { PauseBanner } from './PauseBanner'
import { RecommendationHero } from './RecommendationHero'
import { ScoresCard } from './ScoresCard'
import { StatusStrip } from './StatusStrip'
import { TipsCard } from './TipsCard'
import { VerdictCard } from './VerdictCard'
import { WaitsCard } from './WaitsCard'
import { KnowledgeCard } from './KnowledgeCard'
import { PointsCard } from './PointsCard'
import { ValuesCard } from './ValuesCard'
import s from './MatchPage.module.css'

declare global {
  interface Window { soul?: import('../../../preload').SoulApi }
}

export function MatchPage() {
  const { t } = useTranslation()
  const session = useSession()
  const { state, rec, timeline, exec } = useMatch()
  const candidateCount = useSettings((st) => st.candidateCount)
  const view = deriveView(session, !!state)

  switch (view) {
    case 'disconnected': return <EmptyState title={t('empty.disconnected.title')} desc={t('empty.disconnected.desc')} />
    case 'lobby': return <EmptyState title={t('empty.lobby.title')} desc={t('empty.lobby.desc')} />
    case 'sanma': return <EmptyState title={t('empty.sanma.title')} desc={t('empty.sanma.desc')} />
    case 'core-down': return <EmptyState title={t('empty.coreDown.title')} desc={t('empty.coreDown.desc')} />
    case 'desynced':
      return <EmptyState title={t('empty.desynced.title')} desc={t('empty.desynced.desc')}
        action={<Button variant="secondary" onClick={() => window.soul?.reloadGame()}>{t('empty.desynced.action')}</Button>} />
    case 'no-model':
      return <EmptyState title={t('empty.noModel.title')} desc={t('empty.noModel.desc')}
        action={<Button variant="primary-gold">{t('empty.noModel.action')}</Button>} />
    case 'model-error':
      return <EmptyState title={t('empty.modelError.title')} desc={t('empty.modelError.desc', { code: session.modelError || 'model_load' })}
        action={<Button variant="secondary">{t('empty.modelError.action')}</Button>} />
  }
  if (!state) return <EmptyState title={t('empty.lobby.title')} desc={t('empty.lobby.desc')} />

  const a = state.analysis
  const self = state.self_seat
  const focus = rec?.kind === 'riichi' ? rec.riichi_tile : rec?.tile
  const focusOpt = focus ? rec?.insight?.options[focus] : undefined
  // 待牌：现在已经听牌 → 当前待牌；否则如果推荐的打法能听牌 → 打后待牌
  const waits = a?.wait && a.wait.shanten === 0 ? a.wait.waits : focusOpt && focusOpt.shanten === 0 && rec?.kind !== 'chi' ? focusOpt.ukeire : []
  const waitsAfter = !(a?.wait && a.wait.shanten === 0)
  const maxThreat = Math.max(0, ...(a?.threat.map((x) => x.threat) ?? [0]))
  const verdict = rec?.insight?.verdict
  const showVerdict = !!verdict && (maxThreat >= 0.3 || state.riichi.length > 0)
  const totalLeft = waits.reduce((n, w) => n + w.left, 0)
  const ins = rec?.insight
  // 打点：推荐打法能听牌 → 打后每张待牌的打点；现在已经听牌（没摸牌）→ 当前的
  const values = (ins?.groups?.values?.length ? ins.groups.values : a?.groups?.values) ?? []
  const myMelds = self !== null ? state.melds[self] ?? [] : []
  const closed = myMelds.every((m) => m.type === 'ankan')
  const inRiichi = self !== null && state.riichi.includes(self)
  const modelTop = rec?.style ? rec.style.model : rec?.kind === 'riichi' ? 'reach' : rec?.tile ?? null
  const cands = ins?.values ?? []

  return (
    <div className={s.page}>
      <div className={s.head}>
        <StatusStrip state={state} rec={rec} />
        <RecommendationHero rec={rec} exec={exec} mode={session.mode} tsumogiri={rec?.mjai?.tsumogiri} />
        {session.paused && <PauseBanner reason={session.paused} onResume={() => window.soul?.resumeAuto()} />}
      </div>
      <div className={s.scroll} data-testid="match-scroll">
        <CollapsibleCard id="eff" icon={t('cards.ic.eff')} title={t('cards.eff')} sub={t('cards.effSub')}>
          <EffCard rec={rec} max={candidateCount} />
        </CollapsibleCard>
        {rec?.tips && rec.tips.length > 0 && (
          <CollapsibleCard id="tips" icon={t('cards.ic.tips')} title={t('tips.title')} sub={`${rec.tips.length}`}>
            <TipsCard tips={rec.tips} self={self ?? 0} />
          </CollapsibleCard>
        )}
        <CollapsibleCard id="hand" icon={t('cards.ic.hand')} title={t('cards.hand')} sub={t('cards.handSub')}>
          <HandRow hand={state.hand} drawn={state.drawn} melds={self !== null ? state.melds[self] ?? [] : []} rec={rec} candidates={rec?.alts ?? []} risk={a?.risk} />
        </CollapsibleCard>
        {waits.length > 0 && (
          <CollapsibleCard id="waits" icon={t('cards.ic.waits')} title={waitsAfter ? t('cards.waitsAfter') : t('cards.waits')}
            sub={`${t('hero.sides', { n: waits.length })} · ${t('hero.left', { n: totalLeft })}`}>
            <WaitsCard waits={waits} furiten={!!a?.furiten} />
          </CollapsibleCard>
        )}
        {(values.length > 0 || ins?.attack) && (
          <CollapsibleCard id="points" icon={t('cards.ic.points')} title={t('pts.title')} sub={t('pts.sub')}>
            <PointsCard attack={ins?.attack} values={values} riichi={inRiichi} closed={closed} />
          </CollapsibleCard>
        )}
        {(showVerdict || (ins?.balance && ins.balance.shanten === 0)) && verdict && (
          <CollapsibleCard id="verdict" icon={t('cards.ic.verdict')} title={t('cards.verdict')} sub={t(`verdict.${verdict.advice}`)}>
            <VerdictCard advice={verdict.advice} risk={verdict.risk} threat={verdict.max_threat} balance={ins?.balance} values={ins?.values} self={self ?? 0} />
          </CollapsibleCard>
        )}
        {cands.length > 1 && (
          <CollapsibleCard id="values" icon={t('cards.ic.values')} title={t('vals.title')} sub={t('vals.sub')}>
            <ValuesCard values={cands} modelTop={modelTop} style={rec?.style} />
          </CollapsibleCard>
        )}
        {rec?.knowledge && rec.knowledge.length > 0 && (
          <CollapsibleCard id="know" icon={t('cards.ic.know')} title={t('know.title')} sub={`${rec.knowledge.length}`}>
            <KnowledgeCard items={rec.knowledge} self={self ?? 0} />
          </CollapsibleCard>
        )}
        <CollapsibleCard id="opps" icon={t('cards.ic.opps')} title={t('cards.opps')}>
          <OpponentsCard state={state} />
        </CollapsibleCard>
        <CollapsibleCard id="scores" icon={t('cards.ic.scores')} title={t('cards.scores')}>
          <ScoresCard state={state} />
        </CollapsibleCard>
        <CollapsibleCard id="log" icon={t('cards.ic.log')} title={t('rec.log')} sub={t('rec.recent', { n: Math.min(timeline.length, 12) })}>
          <DecisionTimeline entries={timeline} />
        </CollapsibleCard>
        {a?.heat && (
          <CollapsibleCard id="map" icon={t('cards.ic.map')} title={t('cards.map')} sub={t('cards.mapSub')}>
            <HeatCard heat={a.heat} hand={state.drawn ? [...state.hand, state.drawn] : state.hand} />
          </CollapsibleCard>
        )}
      </div>
    </div>
  )
}
