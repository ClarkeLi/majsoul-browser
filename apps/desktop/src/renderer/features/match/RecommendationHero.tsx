import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Tile } from '@renderer/components/ui/Tile'
import { tileName } from '@renderer/lib/tiles'
import { styleNote } from '@renderer/lib/points'
import type { ExecStatus } from '@renderer/stores/types'
import type { Mode, RecKind, RecommendationMsg } from '@shared/protocol'
import { ExecPill } from './ExecPill'
import s from './RecommendationHero.module.css'

const ACCENT: Record<string, string> = {
  discard: '--act-discard', riichi: '--act-riichi', tsumo: '--act-riichi', ron: '--act-riichi',
  chi: '--act-call', pon: '--act-call', daiminkan: '--act-call', ankan: '--act-call', kakan: '--act-call',
  pass: '--act-pass', kyuushu: '--act-pass'
}
const EYEBROW: Partial<Record<RecKind, string>> = {
  discard: 'discard', riichi: 'riichi', chi: 'call', pon: 'call', daiminkan: 'call', ankan: 'call', kakan: 'call',
  ron: 'win', tsumo: 'win', kyuushu: 'kyuushu', pass: 'pass'
}

function Ring({ value, label }: { value: number; label: string }) {
  return (
    <div className={s.ring} role="meter" aria-label={label} aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <svg viewBox="0 0 52 52" aria-hidden>
        <circle className={s.trk} cx="26" cy="26" r="21" />
        <circle className={s.arc} cx="26" cy="26" r="21" strokeDasharray="132" strokeDashoffset={132 * (1 - Math.max(0, Math.min(1, value)))} />
      </svg>
      <div className={s.val}><b className="num">{Math.round(value * 100)}<small>%</small></b><span>{label}</span></div>
    </div>
  )
}

export function RecommendationHero({ rec, exec, mode, tsumogiri }: { rec: RecommendationMsg | null; exec: ExecStatus; mode: Mode; tsumogiri?: boolean }) {
  const { t } = useTranslation()
  const kind = rec?.kind ?? null
  const showTile = kind === 'discard' || kind === 'riichi' || kind === 'kakan' || kind === 'ankan'
  const tile = kind === 'riichi' ? rec?.riichi_tile ?? null : rec?.tile ?? null
  const conf = rec?.confidence ?? null
  const isCall = kind === 'chi' || kind === 'pon' || kind === 'daiminkan'
  const consumed = isCall ? rec?.consumed ?? [] : []
  const word = kind === null ? t('hero.waiting') : kind === 'kyuushu' ? t('action.kyuushu') : t(`action.${kind}`)
  const name = kind === 'kyuushu' ? t('action.kyuushuNote') : kind === 'riichi' && tile ? `${t('action.discard')} ${tileName(t, tile)}` : tile && showTile ? tileName(t, tile) : ''
  const opt = tile ? rec?.insight?.options[tile] : undefined
  const verdict = rec?.insight?.verdict
  const risk = rec?.insight?.focus_risk
  const accVar = kind ? ACCENT[kind] ?? '--act-pass' : '--act-pass'
  const eyebrowKey = kind ? EYEBROW[kind] : undefined
  const eyebrow = eyebrowKey ? t(`hero.eyebrow.${eyebrowKey}`) + (kind === 'discard' && tsumogiri ? ` · ${t('hero.tsumogiri')}` : '') : 'MORTAL'

  return (
    <section className={s.hero} style={{ '--acc': `var(${accVar})` } as CSSProperties} data-kind={kind ?? 'wait'} aria-label={t('rec.title')}>
      <div key={rec?.revision ?? 'none'} className={s.inner}>
        {showTile && tile && <div className={s.tileSlot}><Tile code={tile} size="xl" /></div>}
        <div className={s.main}>
          <div className={s.eyebrow}>{eyebrow}</div>
          <div className={s.line}>
            <span className={s.verb} data-long={word.length > 3 || undefined}>{word}</span>
            {name && <span className={s.name}>{name}</span>}
            {isCall && consumed.length > 0 && (
              <span className={s.combo} aria-label={tileName(t, rec?.tile ?? '')}>
                {consumed.map((c, i) => <Tile key={i} code={c} size="sm" />)}
                {rec?.tile && <><span className={s.plus}>+</span><Tile code={rec.tile} size="sm" /></>}
              </span>
            )}
          </div>
          <div className={s.quick}>
            {opt && <span className={s.qk}>{t('hero.after')} <b>{opt.shanten === 0 ? t('shanten.tenpai') : t('shanten.n', { n: opt.shanten })}</b></span>}
            {opt && opt.shanten > 0 && <span className={s.qk}><b>{t('hero.ukeire', { n: opt.total })}</b></span>}
            {opt && opt.shanten === 0 && opt.ukeire.length > 0 && (
              <span className={s.qk}>{t('hero.waits')} {opt.ukeire.slice(0, 4).map((u) => <Tile key={u.tile} code={u.tile} size="xs" />)} <b>{t('hero.left', { n: opt.total })}</b></span>
            )}
            {risk !== null && risk !== undefined && <span className={s.qk}>{t('hero.risk', { v: risk })}</span>}
            {verdict && <span className={s.qk} data-advice={verdict.advice}><b>{t(`verdict.${verdict.advice}`)}</b></span>}
            {rec?.think_ms !== undefined && mode === 'auto' && <span className={s.qk}>{t('hero.think', { s: (rec.think_ms / 1000).toFixed(1) })}</span>}
            {rec?.style && <span className={s.styleNote} data-style={rec.style.kind}>{styleNote(t, rec.style)}</span>}
          </div>
          <div className={s.pills}>
            {rec?.latency_ms !== undefined && <span className={s.latency}>{Math.round(rec.latency_ms)}ms</span>}
            <ExecPill exec={exec} mode={mode} />
          </div>
        </div>
        {conf !== null && <Ring value={conf} label={t('hero.conf')} />}
      </div>
      {exec.s === 'thinking' && <span className={s.progress} aria-hidden />}
    </section>
  )
}

