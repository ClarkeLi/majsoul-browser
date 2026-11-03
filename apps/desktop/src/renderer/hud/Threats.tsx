import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Tile } from '@renderer/components/ui/Tile'
import { seatWind } from '@renderer/lib/dora'
import { relSeat, tileName, windChar } from '@renderer/lib/tiles'
import type { RecommendationMsg, StateMsg } from '@shared/protocol'
import { oppSafety, placement, riichiTurn, threatLevel, type SafeTile } from './coach'
import { Rich } from './Term'
import p from './Panel.module.css'
import s from './Threats.module.css'

type T = ReturnType<typeof useTranslation>['t']
const fmtDiff = (d: number): string => (d === 0 ? '±0' : `${d > 0 ? '+' : '−'}${Math.abs(d).toLocaleString('en-US')}`)
const SEGS = 10

function safeLabel(t: T, x: SafeTile, long: boolean): string {
  const k = long ? 'why' : 'whyShort'
  if (x.why === 'honor_seen') return t(`coach.${k}.honor_seen`, { n: x.seen ?? 2 })
  return t(`coach.${k}.${x.why}`, { basis: x.basis ? tileName(t, x.basis) : '' })
}

/**
 * 对手卡（右侧）：每家一行——风位（亲 = 朱底）、名次、点差、听牌可能（十格热度条）、立直判子、理由、对他安全的牌；
 * 底部是押引三格（弃 · 平 · 攻，结论那一格实色）和依据。
 */
export function ThreatCard({ state, rec, u, hidden }: { state: StateMsg; rec: RecommendationMsg | null; u: number; hidden: boolean }) {
  const { t } = useTranslation()
  const self = state.self_seat ?? 0
  const a = state.analysis
  const place = placement(state)
  const verdict = hidden ? null : rec?.insight?.verdict ?? null
  const top = (a?.threat ?? []).reduce<{ seat: number; threat: number } | null>((m, x) => (!m || x.threat > m.threat ? x : m), null)
  const focusTile = rec?.kind === 'riichi' ? rec.riichi_tile : rec?.tile
  const focusSh = focusTile ? rec?.insight?.options[focusTile]?.shanten : undefined
  const anyThreat = (top?.threat ?? 0) >= 0.4 || state.riichi.some((x) => x !== self)
  return (
    <section className={`${p.card} ${s.card}`} style={{ '--acc': `var(${anyThreat ? '--wa-shu' : '--wa-ai'})` } as CSSProperties} data-hit data-alert={anyThreat || undefined} data-testid="opps">
      <header className={p.head}>
        <span className={p.badge}>{t('hud.badge.opps')}</span>
        <span className={p.eyebrow}>{t('coach.opps')}</span>
        {verdict && <span className={s.vtag} data-advice={verdict.advice}>{t(`verdict.${verdict.advice}`)}</span>}
      </header>
      {[1, 2, 3].map((d, k) => {
        const seat = (self + d) % 4
        const th = a?.threat.find((x) => x.seat === seat)
        const v = th?.threat ?? 0
        const lvl = threatLevel(v)
        const riichi = state.riichi.includes(seat)
        const wind = seatWind(seat, state.round.oya)
        const diff = (state.scores[seat] ?? 0) - (state.scores[self] ?? 0)
        const rt = riichiTurn(state, seat)
        const nm = state.melds[seat]?.filter((m) => m.type !== 'ankan').length ?? 0
        const reason = riichi ? (rt ? t('coach.reason.riichi', { n: rt }) : t('coach.reason.riichiNoTurn')) : nm > 0 ? t('coach.reason.melds', { n: nm }) : t('coach.reason.closed')
        const danger = riichi || v >= 0.4
        const safe = danger ? oppSafety(state, seat).slice(0, 3) : []
        const lit = Math.max(1, Math.round(v * SEGS))
        return (
          <div key={seat} className={s.row} data-danger={danger || undefined} data-level={lvl} data-riichi={riichi || undefined} style={{ animationDelay: `${k * 80}ms` }}>
            <div className={s.line}>
              <span className={s.wd} data-oya={wind === 'E' || undefined} title={t(`wind.${wind}`)}>{windChar(t, wind)}</span>
              <span className={s.who}>{t(`seat.${relSeat(seat, self)}`)}</span>
              <span className={s.rank} data-rank={place.ranks[seat]} title={t('coach.place.rank', { n: place.ranks[seat] })}>{place.ranks[seat]}</span>
              {riichi && <span className={s.stamp}>{t('action.riichi')}</span>}
              <span className={[s.df, 'num'].join(' ')}>{fmtDiff(diff)}</span>
            </div>
            <div className={s.meter}>
              <span className={s.segs} aria-label={`${Math.round(v * 100)}%`}>
                {Array.from({ length: SEGS }, (_, i) => <i key={i} data-on={i < lit || undefined} data-band={i < 4 ? 0 : i < 7 ? 1 : 2} style={{ animationDelay: `${k * 80 + i * 25}ms` }} />)}
              </span>
              <span className={s.lvl} data-level={lvl}>{t(`coach.level.${lvl}`)}</span>
            </div>
            <div className={s.reason}><Rich text={reason} /></div>
            {danger && (
              <div className={s.safe}>
                {safe.length === 0 ? <span className={s.none}>{t('coach.noSafe')}</span> : safe.map((x) => (
                  <span key={x.tile} className={s.st} data-why={x.why}><Tile code={x.tile} px={Math.round(u * 0.22)} /><span className={s.short}><Rich text={safeLabel(t, x, false)} /></span><span className={s.long}><Rich text={safeLabel(t, x, true)} /></span></span>
                ))}
              </div>
            )}
          </div>
        )
      })}
      {verdict && (
        <div className={s.verdict} data-advice={verdict.advice}>
          <div className={s.gauge} data-advice={verdict.advice}>
            <span>{t('fx.gauge.fold')}</span><span>{t('fx.gauge.balance')}</span><span>{t('fx.gauge.push')}</span>
          </div>
          <p className={s.desc}><Rich text={t(`verdict.${verdict.advice}Desc`)} /></p>
          <p className={s.basis}>
            <Rich text={t('coach.basisLine', {
              sh: focusSh === undefined ? '—' : focusSh === 0 ? t('shanten.tenpai') : t('shanten.n', { n: focusSh }),
              risk: verdict.risk.toFixed(1),
              who: top ? t(`seat.${relSeat(top.seat, self)}`) : '—',
              th: Math.round(verdict.max_threat * 100)
            })} />
          </p>
        </div>
      )}
    </section>
  )
}
