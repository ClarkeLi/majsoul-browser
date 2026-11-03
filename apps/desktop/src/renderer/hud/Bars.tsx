import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Tile } from '@renderer/components/ui/Tile'
import { seatWind } from '@renderer/lib/dora'
import { relSeat, tileName, windChar } from '@renderer/lib/tiles'
import type { GroupView, HandGroup, HandValue, Meld, StateMsg, WaitValue } from '@shared/protocol'
import { BAR_MIN } from '@shared/layout-fit'
import { placeAdvice, placement } from './coach'
import { Rich } from './Term'
import s from './Bars.module.css'

const DONE = new Set(['run', 'triplet'])
/** 下栏至少这么高才把教学提示放进去（否则留在游戏画面的教学条里） */
export const TIP_BAR_MIN = 70
const fmt = (n: number): string => n.toLocaleString('en-US')
const diff = (d: number): string => (d === 0 ? '±0' : `${d > 0 ? '+' : '−'}${fmt(Math.abs(d))}`)


/** 下信息栏：左边手牌分组（哪些成了、哪些在等什么、还剩几张），右边押引红绿条。 */
export function BottomBar({ h, groups, practiceHint, melds, self, push, danger = 0 }: { h: number; groups: GroupView | null | undefined; practiceHint: string | null; melds: Meld[]; self: number; /** 押引红绿条面板（放在最右边） */ push?: ReactNode; /** 立直的对手数：>0 时栏边线变红 */ danger?: number }) {
  const { t } = useTranslation()
  if (h < BAR_MIN) return null
  const full = h >= 78
  const tilePx = Math.max(14, Math.min(28, Math.round(h * (full ? 0.28 : 0.5))))
  const waitPx = Math.max(12, Math.round(tilePx * 0.62))
  const focus = groups?.discard
  return (
    <div className={s.bottom} style={{ height: h }} data-zone="bar-bottom" data-full={full || undefined} data-danger={danger > 0 || undefined}>
      <div className={s.hand}>
        {practiceHint ? (
          <span className={s.muted}><Rich text={practiceHint} /></span>
        ) : !groups ? (
          <span className={s.muted}>{t('bars.noGroups')}</span>
        ) : (
          <>
            <div className={s.summary}>
              <span className={s.sTitle}>{focus ? t('bars.after', { tile: tileName(t, focus) }) : t('bars.now')}</span>
              <b className={s.sShanten} data-tenpai={groups.shanten === 0 || undefined} key={groups.shanten}><Rich text={groups.shanten === 0 ? t('bars.tenpai') : t('bars.n', { n: groups.shanten })} /></b>
              <span className={s.sTotal}><Rich text={t('bars.total', { n: groups.total })} /></span>
              {groups.form !== 'regular' && <span className={s.form}>{t(`bars.form.${groups.form}`)}</span>}
            </div>
            <div className={s.groups}>
              {full && groups.ukeire.length > 0 && !(groups.values?.length) && (
                <div className={s.chip} data-kind="uk">
                  <span className={s.ukTiles}>{groups.ukeire.slice(0, 6).map((u) => <span key={u.tile} className={s.ukt}><Tile code={u.tile} px={waitPx + 2} /><em className="num">{u.left}</em></span>)}</span>
                  <span className={s.cl}><b><Rich text={t('bars.ukeire')} /></b></span>
                </div>
              )}
              {full && (groups.values?.length ?? 0) > 0 && groups.values!.map((v) => <ValueChip key={v.tile} v={v} px={Math.round(tilePx * 0.95)} />)}
              {groups.groups.map((g, i) => <Chip key={i} g={g} tilePx={(groups.values?.length ?? 0) > 0 ? Math.round(tilePx * 0.8) : tilePx} waitPx={waitPx} labels={full && !(groups.values?.length)} />)}
              {melds.map((m, i) => <MeldChip key={`m${i}`} m={m} self={self} px={Math.round(tilePx * (m.type === 'kakan' ? 0.62 : 0.85))} label={full} />)}
            </div>
          </>
        )}
      </div>
      {push}
    </div>
  )
}

/** 一种和法的简写：3 番 30 符 · 3,900（满贯以上写名称） */
function valueText(t: ReturnType<typeof useTranslation>['t'], v: HandValue): string {
  const lv = v.level ? t(`coach.level2.${v.level}`, { defaultValue: '' }) : ''
  return lv ? `${lv} ${fmt(v.points)}` : `${v.han}${t('coach.han')}${v.fu}${t('coach.fu')} ${fmt(v.points)}`
}

/** 听牌时一张待牌值多少：荣和 / 自摸 / （门清默听时）立直后荣和；悬停看役 */
function ValueChip({ v, px }: { v: WaitValue; px: number }) {
  const { t } = useTranslation()
  const best = v.ron ?? v.tsumo
  const yaku = (best?.yaku ?? []).filter(([, han]) => han > 0).map(([id, han]) => `${t(`yaku.${id}`, { defaultValue: String(id) })}${han > 1 ? ` ${han}` : ''}`).join(' · ')
  return (
    <div className={s.chip} data-kind="value" data-noyaku={!v.ron || undefined} title={yaku}>
      <span className={s.vHead}><Tile code={v.tile} px={px} /><em className="num">{t('bars.left', { n: v.left })}</em></span>
      <span className={s.vBody}>
        <span className={s.vRow}>{v.ron ? <><i>{t('coach.ron')}</i><b className="num">{valueText(t, v.ron)}</b></> : <b className={s.noYaku}><Rich text={t('coach.noYaku')} /></b>}</span>
        {v.tsumo && <span className={s.vRow}><i>{t('coach.tsumo')}</i><span className="num">{valueText(t, v.tsumo)}</span></span>}
        {v.riichi_ron ? <span className={s.vRow} data-riichi><i><Rich text={t('coach.ifRiichi')} /></i><span className="num">{valueText(t, v.riichi_ron)}</span></span> : yaku ? <span className={s.vYaku}>{yaku}</span> : null}
      </span>
    </div>
  )
}

/**
 * 副露：按游戏里的样子摆。被鸣的那张横放，位置表示从谁那里鸣的：上家 → 最左，对家 → 中间，下家 → 最右；
 * 加杠把加上的那张叠在横放的牌上；暗杠两端扣着。
 */
export function meldLayout(m: Meld, self: number): Array<{ tile: string; side?: boolean; stack?: string; back?: boolean }> {
  const called = m.tiles[m.tiles.length - 1]!
  const rest = m.tiles.slice(0, -1)
  if (m.type === 'ankan') {
    const ts = m.tiles
    return [{ tile: ts[0]!, back: true }, { tile: ts[1]! }, { tile: ts[2]! }, { tile: ts[3]!, back: true }]
  }
  const rel = m.from === null ? 3 : (m.from - self + 4) % 4      // 1 下家 2 对家 3 上家
  if (m.type === 'kakan') {
    // tiles = 碰的三张（被鸣的在最后）+ 加上的一张
    const added = m.tiles[3]!
    const ponCalled = m.tiles[2]!
    const ponRest = m.tiles.slice(0, 2)
    const side = { tile: ponCalled, side: true, stack: added }
    return rel === 3 ? [side, ...ponRest.map((t) => ({ tile: t }))] : rel === 2 ? [{ tile: ponRest[0]! }, side, { tile: ponRest[1]! }] : [...ponRest.map((t) => ({ tile: t })), side]
  }
  const side = { tile: called, side: true }
  const plain = rest.map((t) => ({ tile: t }))
  if (rel === 3) return [side, ...plain]
  if (rel === 1) return [...plain, side]
  return [plain[0]!, side, ...plain.slice(1)]                       // 对家：第二张横放
}

function MeldChip({ m, self, px, label }: { m: Meld; self: number; px: number; label: boolean }) {
  const { t } = useTranslation()
  const h = Math.round((px * 4) / 3)
  return (
    <div className={s.chip} data-kind="meld" data-done>
      <span className={s.meld} style={{ height: m.type === 'kakan' ? px * 2 : h }}>
        {meldLayout(m, self).map((x, i) => x.side ? (
          <span key={i} className={s.side} style={{ width: h, height: m.type === 'kakan' ? px * 2 : px }}>
            {x.stack && <span className={s.rot} style={{ width: h, height: px }}><Tile code={x.stack} px={px} /></span>}
            <span className={s.rot} style={{ width: h, height: px }}><Tile code={x.tile} px={px} /></span>
          </span>
        ) : <Tile key={i} code={x.tile} px={px} back={x.back} />)}
      </span>
      {label && <span className={s.cl}><b>{t(`action.${m.type}`)}</b>{m.from !== null && m.type !== 'ankan' && <span>{t(`seat.${relSeat(m.from, self)}`)}</span>}</span>}
    </div>
  )
}

function Chip({ g, tilePx, waitPx, labels }: { g: HandGroup; tilePx: number; waitPx: number; labels: boolean }) {
  const { t } = useTranslation()
  const done = DONE.has(g.kind)
  const left = g.waits.reduce((n, w) => n + w.left, 0)
  return (
    <div className={s.chip} data-kind={g.kind} data-done={done || undefined}>
      <span className={s.ct}>{g.tiles.map((c, i) => <Tile key={i} code={c} px={tilePx} />)}</span>
      {labels && (
        <span className={s.cl}>
          <b><Rich text={t(`bars.kind.${g.kind}`)} /></b>
          {g.waits.length > 0 && (
            <>
              <span>{t(`bars.need.${g.kind}`, { defaultValue: '' })}</span>
              {g.waits.map((w) => <Tile key={w.tile} code={w.tile} px={waitPx} />)}
              <em className="num">{t('bars.left', { n: left })}</em>
            </>
          )}
        </span>
      )}
    </div>
  )
}

/** 顺位提示（All Last 的策略 + 升位需要多大的牌）；没什么可说时返回空串。 */
export function placeNote(t: ReturnType<typeof useTranslation>['t'], state: StateMsg): string {
  const self = state.self_seat ?? 0
  const p = placement(state)
  const adv = placeAdvice(p)
  const who = (seat: number | null): string => (seat === null ? '' : t(`seat.${relSeat(seat, self)}`))
  const show = p.needOther !== null && !!p.tierOther && (p.allLast || state.round.bakaze !== 'E')
  const need = !show ? '' : p.needOther === 0
    ? t('coach.place.needAny')
    : t('coach.place.need', { tier: t(`coach.tier.${p.tierOther}`), pts: fmt(p.needOther!), who: who(p.aboveSeat), direct: t(`coach.tier.${p.tierDirect}`) })
  return [adv ? t(`coach.place.advice.${adv}`) : '', need].filter(Boolean).join(' ')
}

/** 上信息栏：局况 + 你的名次与上下差 + 升位需要多少 + 四家点数。 */
export function TopBar({ h, state, danger = 0 }: { h: number; state: StateMsg; danger?: number }) {
  const { t } = useTranslation()
  if (h < BAR_MIN) return null
  const r = state.round
  const self = state.self_seat ?? 0
  const a = state.analysis
  const order = [0, 1, 2, 3].map((k) => (r.oya + k) % 4)
  const p = placement(state)
  const note = placeNote(t, state)
  return (
    <div className={s.top} style={{ height: h }} data-zone="bar-top" data-hit data-danger={danger > 0 || undefined}>
      <span className={s.round}>{t('bars.round', { wind: t(`wind.${r.bakaze}`), kyoku: r.kyoku })}</span>
      <span className={s.meta}>
        {danger > 0 && <span data-danger>{t('fx.danger', { n: danger })}</span>}
        {p.allLast && <span data-al><Rich text={t('coach.place.allLast')} /></span>}
        <span><Rich text={t('shanten.honbaShort', { n: r.honba })} /></span>
        {r.kyotaku > 0 && <span><Rich text={t('round.kyotaku', { n: r.kyotaku })} /></span>}
        {r.left !== null && <span>{t('shanten.leftShort', { n: r.left })}</span>}
        {a?.turn !== undefined && <span>{t('shanten.turn', { n: a.turn })}</span>}
      </span>
      <span className={s.place} data-rank={p.rank}>
        <b className="num" key={p.rank}>{p.rank}</b>
        <span className={s.pRank}><Rich text={t('coach.place.rankShort')} /></span>
        {p.toAbove !== null && <span className={s.up}>{t('coach.place.up', { v: fmt(p.toAbove) })}</span>}
        {p.overBelow !== null && <span className={s.down}>{t('coach.place.down', { v: fmt(p.overBelow) })}</span>}
      </span>
      {note && <span className={s.note} title={note}><Rich text={note} /></span>}
      <span className={s.scores}>
        {order.map((seat) => {
          const me = seat === self
          const w = seatWind(seat, r.oya)
          return (
            <span key={seat} className={s.sc} data-me={me || undefined} data-riichi={state.riichi.includes(seat) || undefined}>
              <b data-oya={w === 'E' || undefined} title={t(`wind.${w}`)}>{windChar(t, w)}</b>
              <i>{me ? t('scoreCard.you') : t(`seat.${relSeat(seat, self)}`)}</i>
              <span className="num">{fmt(state.scores[seat] ?? 0)}</span>
              {!me && <em className="num">{diff((state.scores[seat] ?? 0) - (state.scores[self] ?? 0))}</em>}
              <u className="num">{p.ranks[seat]}</u>
            </span>
          )
        })}
      </span>
    </div>
  )
}
