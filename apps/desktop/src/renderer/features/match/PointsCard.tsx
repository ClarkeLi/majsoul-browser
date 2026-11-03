import { useTranslation } from 'react-i18next'
import { Tile } from '@renderer/components/ui/Tile'
import { fmt, handText, pct, yakuList } from '@renderer/lib/points'
import { tileName } from '@renderer/lib/tiles'
import type { Attack, AttackPlan, HandValue, WaitValue } from '@shared/protocol'
import s from './PointsCard.module.css'

function Cell({ v, tsumo }: { v: HandValue | null | undefined; tsumo?: boolean }) {
  const { t } = useTranslation()
  if (!v) return <span className={s.noYaku}>{t('pts.noYaku')}</span>
  const pay = tsumo && v.pay && v.pay[1] ? `${fmt(v.pay[1])}/${fmt(v.pay[0] ?? 0)}` : null
  return (
    <span className={s.cell} title={yakuList(t, v).map((y) => `${y.name} ${y.han}`).join(' · ')}>
      <b className="num">{fmt(v.points)}</b>
      <i>{v.level ? t(`coach.level2.${v.level}`, { defaultValue: '' }) || `${v.han}${t('coach.han')}` : `${v.han}${t('coach.han')}${v.fu}${t('coach.fu')}`}</i>
      {pay && <i className={s.pay}>{pay}</i>}
    </span>
  )
}

function Option({ name, plan, best, maxEv, single }: { name: string; plan: AttackPlan; best: boolean; maxEv: number; single: boolean }) {
  const { t } = useTranslation()
  return (
    <div className={s.opt} data-best={(best && !single) || undefined}>
      <div className={s.optHead}>
        <span className={s.optName}>{name}</span>
        {best && !single && <span className={s.badge}>{t('pts.best')}</span>}
      </div>
      <div className={s.kv}><span>{t('pts.winRate')}</span><b className="num">{plan.yakuless ? '—' : pct(plan.win_rate)}</b></div>
      <span className={s.meter}><i style={{ width: `${plan.win_rate * 100}%` }} /></span>
      <div className={s.kv}><span>{t('pts.avg')}</span><b className="num">{plan.yakuless ? t('pts.noYaku') : fmt(plan.avg)}</b></div>
      <div className={s.kv}><span>{t('pts.ev')}</span><b className={['num', s.ev].join(' ')}>{fmt(plan.ev)}</b></div>
      <span className={s.meter} data-ev><i style={{ width: `${Math.max(0, plan.ev) / maxEv * 100}%` }} /></span>
    </div>
  )
}

/**
 * 打点 · 默听 vs 立直：每张待牌 荣和 / 自摸（以及立直后）的点数与役，加上两种打法的和牌率、平均打点、期望值对比。
 * 和旧面板一样：期望值 = 和牌率 × (平均打点 + 供托) − 没和牌时收不回的立直棒。
 */
export function PointsCard({ attack, values, riichi, closed }: { attack?: Attack; values: WaitValue[]; riichi: boolean; closed: boolean }) {
  const { t } = useTranslation()
  const damaName = riichi ? t('pts.riichiDone') : closed ? t('pts.dama') : t('pts.open')
  const showRiichi = values.some((v) => v.riichi_ron)
  const best = values.reduce<HandValue | null>((b, v) => {
    const x = v.ron ?? v.tsumo
    return x && (!b || x.points > b.points) ? x : b
  }, null)
  const yaku = yakuList(t, best)
  const opts: Array<[string, string, AttackPlan]> = attack ? [['dama', damaName, attack.dama]] : []
  if (attack?.riichi) opts.push(['riichi', t('pts.riichi'), attack.riichi])
  const maxEv = Math.max(1, ...opts.map((o) => o[2].ev))
  return (
    <div className={s.wrap}>
      {values.length > 0 && (
        <div className={s.table} style={{ gridTemplateColumns: showRiichi ? 'auto 1fr 1fr 1fr 1fr' : 'auto 1fr 1fr' }}>
          <span className={s.th}>{t('pts.wait')}</span>
          <span className={s.th}>{damaName} · {t('pts.ron')}</span>
          <span className={s.th}>{damaName} · {t('pts.tsumo')}</span>
          {showRiichi && <><span className={s.th} data-riichi>{t('pts.riichi')} · {t('pts.ron')}</span><span className={s.th} data-riichi>{t('pts.riichi')} · {t('pts.tsumo')}</span></>}
          {values.map((v) => (
            <div key={v.tile} className={s.row} style={{ gridColumn: '1 / -1' }}>
              <span className={s.wt} title={tileName(t, v.tile)}><Tile code={v.tile} size="sm" /><i className="num">{t('hero.left', { n: v.left })}</i></span>
              <Cell v={v.ron} />
              <Cell v={v.tsumo} tsumo />
              {showRiichi && <><Cell v={v.riichi_ron} /><Cell v={v.riichi_tsumo} tsumo /></>}
            </div>
          ))}
        </div>
      )}
      {yaku.length > 0 && (
        <div className={s.yaku}>
          {yaku.map((y) => <span key={y.id} className={s.chip} data-dora={y.dora || undefined}>{y.name}<b className="num">{y.han}</b></span>)}
          {best && <span className={s.total}>{handText(t, best)}</span>}
        </div>
      )}
      {opts.length > 0 && attack && (
        <>
          <div className={s.cmp} data-single={opts.length === 1 || undefined}>
            {opts.map(([k, name, plan]) => (
              <Option key={k} name={name} plan={plan} maxEv={maxEv} single={opts.length === 1}
                best={attack.mode === k || (k === 'dama' && attack.mode === 'open')} />
            ))}
          </div>
          <PointsNote attack={attack} riichi={riichi} closed={closed} />
        </>
      )}
    </div>
  )
}

function PointsNote({ attack, riichi, closed }: { attack: Attack; riichi: boolean; closed: boolean }) {
  const { t } = useTranslation()
  const d = attack.dama, r = attack.riichi
  const lines: string[] = []
  if (attack.no_riichi) lines.push(t(`pts.notes.noRiichi_${attack.no_riichi}`) + (d.yakuless ? t('pts.notes.onlyTsumo') : t('pts.notes.onlyDama')))
  else if (d.yakuless && r) lines.push(t('pts.notes.yakulessDama'))
  else if (r) {
    const diff = r.ev - d.ev
    // 与推荐一致：立直要比默听高出一成以上才推荐立直
    lines.push(attack.mode === 'riichi' ? t('pts.notes.riichiBetter', { a: fmt(d.avg), b: fmt(r.avg), d: fmt(diff) })
      : diff > 0 ? t('pts.notes.close', { d: fmt(diff) }) : t('pts.notes.damaBetter', { d: fmt(-diff) }))
  } else if (riichi) lines.push(t('pts.notes.inRiichi'))
  else if (!closed) lines.push(t('pts.notes.openHand'))
  if (attack.furiten) lines.push(t('pts.notes.furiten'))
  if (r?.stick_cost) lines.push(t('pts.notes.stick', { n: fmt(r.stick_cost) }))
  if (d.pot) lines.push(t('pts.notes.pot', { n: fmt(d.pot) }))
  return (
    <div className={s.note}>
      {lines.map((l, i) => <p key={i}>{l}</p>)}
      {attack.riichi_warn.map((w, i) => (
        <p key={`w${i}`} className={s.warn}><b>{t('pts.warnLabel')}</b>{t(`pts.warn.${w.code}`, { n: 'n' in w ? w.n : 'left' in w ? fmt(w.left) : '' })}</p>
      ))}
      <p className={s.model}>{t('pts.notes.model', { u: attack.unseen, d: attack.draws })}</p>
    </div>
  )
}
