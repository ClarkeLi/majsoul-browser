import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronUp, Eye, GraduationCap, X } from 'lucide-react'
import { Tile } from '@renderer/components/ui/Tile'
import { useCountUp } from '@renderer/lib/count-up'
import { tileName } from '@renderer/lib/tiles'
import { styleNote } from '@renderer/lib/points'
import type { Alt, RecKind, RecommendationMsg, StateMsg } from '@shared/protocol'
import { optionRows, type Judgement, type PracticeStats } from './coach'
import { ACT_COLOR } from './Target'
import { renderTip } from './tips'
import { Rich } from './Term'
import p from './Panel.module.css'
import s from './Decision.module.css'

const EYEBROW: Record<string, string> = { discard: 'discard', riichi: 'riichi', chi: 'call', pon: 'call', daiminkan: 'call', ankan: 'call', kakan: 'call', tsumo: 'win', ron: 'win', kyuushu: 'kyuushu', pass: 'pass' }

type T = ReturnType<typeof useTranslation>['t']

function altLabel(t: T, a: Alt): string {
  if (a.tile) return tileName(t, a.tile)
  const map: Record<string, string> = { riichi: 'riichi', chi: 'chi', pon: 'pon', kan: 'daiminkan', hora: 'ron', kyuushu: 'kyuushu', pass: 'pass' }
  return t(`action.${map[a.kind] ?? a.kind}`)
}

interface Props {
  rec: RecommendationMsg | null
  state: StateMsg
  u: number
  fresh: boolean
  /** 练习模式且答案还没揭晓 */
  hidden: boolean
  practice: boolean
  judge: Judgement | null
  stats: PracticeStats
  teach: boolean
  onReveal: () => void
  onPractice: (v: boolean) => void
}

/**
 * 决策卡（左下）：一眼看到“打什么”——推荐牌、明朝体大字动作、把握度环；
 * 下面是向听进度轨（现在 → 打后 → 听 → 和）、要点、一句“为什么”和候选竞速条。悬停展开全部理由、待牌、上一手与本局失误。
 */
export function DecisionCard({ rec, state, u, fresh, hidden, practice, judge, stats, teach, onReveal, onPractice }: Props) {
  const { t } = useTranslation()
  const kind: RecKind | null = rec?.kind ?? null
  const idleTenpai = !kind && state.analysis?.wait?.shanten === 0      // 等别人出牌、自己已听牌
  const accent = hidden ? '--wa-ai' : kind ? ACT_COLOR[kind] ?? '--wa-nezumi' : idleTenpai ? '--wa-take' : '--wa-nezumi'
  // 标题行的汉字徽章
  const badgeText = hidden ? t('hud.badge.think') : kind ? t(`hud.badge.${EYEBROW[kind] ?? 'discard'}`) : idleTenpai ? t('fx.glyph.tenpai') : t('hud.badge.idle')
  return (
    <section className={`${p.card} ${s.card}`} style={{ '--acc': `var(${accent})` } as CSSProperties} data-hit data-grow data-stale={(!hidden && !!rec && !fresh) || undefined} data-testid="coach">
      <header className={p.head}>
        <span className={p.badge} key={`${badgeText}-${rec?.revision ?? 0}`}>{badgeText}</span>
        {judge ? <FeedbackMini j={judge} u={u} /> : <span className={p.eyebrow}>{hidden ? t('coach.yourTurn') : kind ? t(`hero.eyebrow.${EYEBROW[kind] ?? 'discard'}`) : t('coach.title')}</span>}
        <Sync stats={stats} />
        <button type="button" className={s.mode} data-on={practice || undefined} onClick={() => onPractice(!practice)} title={t('coach.practiceTip')}>
          <GraduationCap size={12} strokeWidth={2.25} />{practice ? t('coach.practiceOn') : t('coach.practice')}
        </button>
      </header>
      {hidden ? <Hidden onReveal={onReveal} /> : <Answer rec={rec} state={state} u={u} teach={teach} />}
      {judge && <div className={s.fbFull}><Feedback j={judge} u={u} /></div>}
      <More stats={stats} u={u} />
      <span className={s.expand} aria-hidden><ChevronUp size={12} strokeWidth={2.25} /></span>
    </section>
  )
}

/** 同步率（本局与 AI 一致的比例）+ 连击火焰 */
function Sync({ stats }: { stats: PracticeStats }) {
  const { t } = useTranslation()
  if (stats.judged === 0) return null
  const streak = stats.streak ?? 0
  const rate = stats.agree / stats.judged
  return (
    <span className={s.sync} title={`${t('coach.statTitle')} · ${t('fx.best', { n: stats.bestStreak ?? 0 })}`} data-hot={streak >= 3 || undefined}>
      {streak >= 2 && <span className={s.streak}>{t('fx.glyph.combo')}<b className="num">×{streak}</b></span>}
      <span className={s.rate}>
        <i style={{ '--v': rate } as CSSProperties} />
        <b className="num">{stats.agree}/{stats.judged}</b>
      </span>
    </span>
  )
}

/** 标题行里的一行反馈：✓ 牌 一致 / ✕ 你打的 → AI 选的 损失 */
function FeedbackMini({ j, u }: { j: Judgement; u: number }) {
  const { t } = useTranslation()
  const px = Math.round(u * 0.2)
  return (
    <span className={s.fbMini} data-agree={j.agree || undefined} title={t('coach.last')}>
      {j.agree ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
      <Tile code={j.actual} px={px} />
      {j.agree ? <span>{t('coach.agreeShort')}</span> : <><i>→</i><Tile code={j.want} px={px} />{j.qLoss !== null && <b className="num">−{j.qLoss.toFixed(2)}</b>}</>}
    </span>
  )
}

function Feedback({ j, u }: { j: Judgement; u: number }) {
  const { t } = useTranslation()
  const px = Math.round(u * 0.24)
  if (j.agree) {
    return (
      <div className={s.fb} data-agree>
        <Check size={14} strokeWidth={2.5} />
        <span>{t('coach.last')}</span>
        <Tile code={j.actual} px={px} />
        <b>{t('coach.agree')}</b>
      </div>
    )
  }
  return (
    <div className={s.fb}>
      <X size={14} strokeWidth={2.5} />
      <span>{t('coach.youPlayed')}</span><Tile code={j.actual} px={px} />{j.actualRiichi && <em>{t('coach.riichiMark')}</em>}
      {j.pActual !== null && <span className="num">{t('coach.aiProb', { p: Math.round(j.pActual * 100) })}</span>}
      <span className={s.fbSep}>·</span>
      <span>{t('coach.aiPick')}</span><Tile code={j.want} px={px} />{j.wantRiichi && <em>{t('coach.riichiMark')}</em>}
      {j.qLoss !== null && <b className="num">{t('coach.loss', { v: j.qLoss.toFixed(2) })}</b>}
    </div>
  )
}

function Hidden({ onReveal }: { onReveal: () => void }) {
  const { t } = useTranslation()
  return (
    <div className={s.hidden}>
      <p className={s.ask}><Rich text={t('coach.think')} /></p>
      <p className={s.hint}><Rich text={t('coach.thinkHint')} /></p>
      <button type="button" className={s.reveal} onClick={onReveal}><Eye size={14} strokeWidth={2} />{t('coach.reveal')}</button>
    </div>
  )
}

/** 把握度环：数字滚动、弧线缓动 */
function Confidence({ v }: { v: number }) {
  const { t } = useTranslation()
  const shown = useCountUp(Math.round(v * 100), 600)
  return (
    <span className={s.conf} role="meter" aria-valuenow={Math.round(v * 100)} title={t('coach.confTitle')}>
      <svg viewBox="0 0 36 36" aria-hidden>
        <circle className={s.trk} cx="18" cy="18" r="14" />
        <circle className={s.arc} cx="18" cy="18" r="14" strokeDasharray="88" strokeDashoffset={88 * (1 - v)} />
      </svg>
      <b className="num">{Math.round(shown)}</b>
    </span>
  )
}

/**
 * 向听进度轨：3+ · 2 · 1 · 听 · 和。实心 = 打完这张之后到了哪一格，空心描边 = 现在在哪一格。
 * 一眼看出这一手是在前进、原地，还是为了防守在后退。
 */
function Track({ now, after, right }: { now: number | null; after: number; right: string }) {
  const { t } = useTranslation()
  const cell = (sh: number): number => (sh >= 3 ? 0 : 3 - sh)       // 0..3（3 = 听牌），4 = 和
  const a = cell(after)
  const n = now === null ? null : cell(now)
  const labels = ['3+', '2', '1', t('fx.tenpaiShort'), t('fx.win')]
  return (
    <div className={s.track} data-tenpai={after === 0 || undefined}>
      <span className={s.tl}>{t('fx.track')}</span>
      <span className={s.steps}>
        {labels.map((l, i) => (
          <i key={i} data-on={i <= a || undefined} data-at={i === a || undefined} data-now={i === n && n !== a ? true : undefined} data-goal={i === 4 || undefined} style={{ animationDelay: `${i * 70}ms` }}>{l}</i>
        ))}
      </span>
      <span className={s.tright}><Rich text={right} /></span>
    </div>
  )
}

function Answer({ rec, state, u, teach }: { rec: RecommendationMsg | null; state: StateMsg; u: number; teach: boolean }) {
  const { t } = useTranslation()
  const a = state.analysis
  if (!rec?.kind) {
    // 没有推荐（等待别人出牌）：听牌时显示待牌
    const waits = a?.wait && a.wait.shanten === 0 ? a.wait.waits : []
    return (
      <div className={s.idle}>
        {waits.length > 0 ? (
          <>
            <div className={s.idleRow}><span className={s.idleBig}>{t('coach.tenpaiNow')}</span>{a?.furiten && <span className={s.pillRed}>{t('shanten.furiten')}</span>}</div>
            <Waits list={waits} u={u} />
          </>
        ) : <span className={s.muted}>{t('coach.noRec')}</span>}
      </div>
    )
  }
  const kind = rec.kind
  const tile = kind === 'riichi' ? rec.riichi_tile ?? null : rec.tile ?? null
  const showTile = !!tile && (kind === 'discard' || kind === 'riichi' || kind === 'kakan' || kind === 'ankan')
  const isCall = kind === 'chi' || kind === 'pon' || kind === 'daiminkan'
  const opt = tile ? rec.insight?.options[tile] : undefined
  const verdict = rec.insight?.verdict
  const risk = rec.insight?.focus_risk ?? null
  const conf = rec.confidence ?? null
  const word = kind === 'kyuushu' ? t('action.kyuushu') : t(`action.${kind}`)
  const self = state.self_seat ?? 0
  const tips = (rec.tips ?? []).map((x) => renderTip(t, x, self)).filter(Boolean)
  const rows = optionRows(rec, state, 5)
  const now = typeof rec.shanten === 'number' ? rec.shanten : null
  const waitsLeft = opt && opt.shanten === 0 ? opt.ukeire.reduce((n, w) => n + w.left, 0) : 0
  return (
    <>
      <div className={s.hero} key={rec.revision}>
        {showTile && <span className={s.heroTile}><Tile code={tile!} px={Math.round(u * 0.44)} /></span>}
        <div className={s.what}>
          <span className={s.verb}>{word}</span>
          {showTile && <span className={s.name}>{tileName(t, tile!)}</span>}
          {isCall && rec.tile && (
            <span className={s.combo}>{(rec.consumed ?? []).map((c, i) => <Tile key={i} code={c} px={Math.round(u * 0.28)} />)}<i>+</i><Tile code={rec.tile} px={Math.round(u * 0.28)} /></span>
          )}
        </div>
        {conf !== null && <Confidence v={conf} />}
      </div>
      {opt && <Track now={now} after={opt.shanten} right={opt.shanten === 0 ? t('coach.waitLeft', { n: waitsLeft }) : t('hero.ukeire', { n: opt.total })} />}
      <div className={s.chips}>
        {risk !== null && <span data-risk={risk < 2 ? 1 : risk < 5 ? 2 : risk < 9 ? 3 : 4}>{t('fx.risk')} <b className="num">{risk.toFixed(1)}%</b></span>}
        {a?.furiten && <span data-bad><Rich text={t('shanten.furiten')} /></span>}
        {verdict && <span data-advice={verdict.advice}><Rich text={t(`coach.adviceChip.${verdict.advice}`)} /></span>}
      </div>
      {rec.style && <div className={s.style} data-style={rec.style.kind}>{styleNote(t, rec.style)}</div>}
      {opt && opt.shanten === 0 && opt.ukeire.length > 0 && <div className={s.extra}><Waits list={opt.ukeire} u={u} /></div>}
      {teach && tips[0] && <p className={s.lead} key={`${rec.revision}-lead`}><Rich text={tips[0]} /></p>}
      {rows.length > 1 && <Race rows={rows} u={u} top={rows[0]!.id} rev={rec.revision} />}
      {teach && tips.length > 1 && (
        <ul className={s.reasons}>
          {tips.slice(1).map((x, i) => <li key={i}><Rich text={x} /></li>)}
        </ul>
      )}
    </>
  )
}

function Waits({ list, u }: { list: Array<{ tile: string; left: number }>; u: number }) {
  const { t } = useTranslation()
  const total = list.reduce((n, w) => n + w.left, 0)
  return (
    <div className={s.waits}>
      <span className={s.wl}><Rich text={t('coach.waitLeft', { n: total })} /></span>
      {list.slice(0, 6).map((w) => (
        <span key={w.tile} className={s.wt} data-out={w.left === 0 || undefined}>
          <Tile code={w.tile} px={Math.round(u * 0.3)} />
          <i>{[0, 1, 2, 3].map((k) => <b key={k} data-gone={k >= w.left || undefined} />)}</i>
        </span>
      ))}
    </div>
  )
}

/** 候选：AI 概率条（◎ = 本命），后面跟打后向听 / 进张 / 放铳，每列最好的标绿。 */
function Race({ rows, u, top, rev }: { rows: ReturnType<typeof optionRows>; u: number; top: string; rev: number }) {
  const { t } = useTranslation()
  const hasEff = rows.some((r) => r.shanten !== null)
  const hasRisk = rows.some((r) => r.risk !== null)
  return (
    <div className={s.table} data-eff={hasEff || undefined} data-risk={hasRisk || undefined} role="table" key={rev}>
      <div className={s.th} role="row">
        <span>{t('coach.col.cand')}</span><span>{t('coach.col.ai')}</span>
        {hasEff && <span><Rich text={t('coach.col.after')} /></span>}
        {hasEff && <span><Rich text={t('coach.col.ukeire')} /></span>}
        {hasRisk && <span>{t('coach.col.risk')}</span>}
      </div>
      {rows.map((r, i) => (
        <div key={r.id} className={s.tr} role="row" data-top={r.id === top || undefined} data-extra={i >= 3 || undefined}>
          <span className={s.tc} data-notile={!r.tile || undefined}>{r.id === top && <i className={s.crown}>◎</i>}{r.tile && <Tile code={r.tile} px={Math.round(u * 0.17)} />}<em>{altLabel(t, { id: r.id, kind: r.kind, p: r.p, q: 0, tile: r.tile ?? undefined })}</em></span>
          <span className={s.pbar}><i style={{ width: `${Math.max(3, Math.round(r.p * 100))}%`, animationDelay: `${i * 70}ms` }} /><b className="num">{Math.round(r.p * 100)}</b></span>
          {hasEff && <span className="num" data-best={r.best.shanten || undefined} data-tenpai={r.shanten === 0 || undefined}>{r.shanten === null ? '—' : r.shanten === 0 ? t('eff.tenpaiAfter') : t('eff.cnt', { n: r.shanten })}</span>}
          {hasEff && <span className="num" data-best={r.best.total || undefined}>{r.total ?? '—'}</span>}
          {hasRisk && <span className="num" data-best={r.best.risk || undefined} data-high={(r.risk ?? 0) >= 5 || undefined}>{r.risk === null ? '—' : `${r.risk.toFixed(1)}`}</span>}
        </div>
      ))}
    </div>
  )
}

/** 只在展开时出现：本局失误与连击 */
function More({ stats, u }: { stats: PracticeStats; u: number }) {
  const { t } = useTranslation()
  if (stats.judged === 0) return null
  return (
    <div className={s.more}>
      <div className={s.moreHead}>
        <span>{t('coach.mistakes')}</span>
        <span className="num">{t('fx.best', { n: stats.bestStreak ?? 0 })} · {t('coach.lossSum', { v: stats.lossSum.toFixed(2) })}</span>
      </div>
      {stats.mistakes.length === 0 ? <span className={s.muted}>{t('coach.noMistakes')}</span> : stats.mistakes.slice(0, 3).map((m, i) => (
        <div key={i} className={s.mk}>
          <span>{t('coach.youPlayed')}</span><Tile code={m.actual} px={Math.round(u * 0.2)} />
          <span>{t('coach.aiPick')}</span><Tile code={m.want} px={Math.round(u * 0.2)} />
          {m.qLoss !== null && <b className="num">{t('coach.loss', { v: m.qLoss.toFixed(2) })}</b>}
        </div>
      ))}
    </div>
  )
}
