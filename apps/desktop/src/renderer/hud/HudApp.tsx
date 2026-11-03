import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@renderer/i18n'
import { applyTheme } from '@renderer/lib/theme'
import { scenario, SCENARIOS, type Scenario } from '@renderer/mock/scenarios'
import { applyCoreMessage, updateSettings, useMatch, useSession, useSettings } from '@renderer/stores'
import type { RecKind } from '@shared/protocol'
import { overlayShapes } from '@shared/overlay-shapes'
import { TEHAI_X, TRUMO_SPACE } from '@shared/ui-map'
import { fitGame } from '@shared/layout-fit'
import { BalancePanel } from './Balance'
import { BottomBar, placeNote, TIP_BAR_MIN, TopBar } from './Bars'
import { EMPTY_PRACTICE } from './coach'
import { DecisionCard } from './Decision'
import { Callout } from './fx/Callout'
import { snapOf, type FxEvent } from './fx/events'
import { useFx } from './fx/useFx'
import { HandTip, hoveredTile } from './HandTip'
import { useHudPointer } from './pointer'
import { Rich } from './Term'
import { Target } from './Target'
import { ThreatCard } from './Threats'
import { renderTip } from './tips'
import { ZONES } from './zones'
import s from './Hud.module.css'

const CALLISH: RecKind[] = ['chi', 'pon', 'daiminkan', 'ankan', 'kakan', 'riichi']
/** 下栏至少这么高才放押引红绿条面板 */
const PUSH_BAR_MIN = 44

/** 截图用：#/hud-mock/<场景>?fx=tenpai|combo|miss|riichi|rank 让横幅一直显示 */
const MOCK_FX: Record<string, FxEvent> = {
  tenpai: { k: 'tenpai', waits: [{ tile: '2s', left: 2 }, { tile: '5m', left: 3 }, { tile: '5p', left: 3 }] },
  combo: { k: 'agree', tile: '9s', streak: 5 },
  agree: { k: 'agree', tile: '9s', streak: 1 },
  miss: { k: 'miss', want: '1p', actual: '9m', qLoss: 0.62 },
  riichi: { k: 'riichi', seat: 1, safe: '9s', why: 'genbutsu' },
  rank: { k: 'rank', from: 2, to: 1 }
}

interface MockOpts { name: Scenario; theme: string; scale: number; side: string; rings: boolean; practice: boolean; hover: number | null; expand: boolean; fx: FxEvent | null }
function parseMock(): MockOpts | null {
  const m = /^#\/hud-mock\/([\w-]+)(?:\?(.*))?$/.exec(window.location.hash)
  if (!m || !SCENARIOS.includes(m[1] as Scenario)) return null
  const q = new URLSearchParams(m[2] ?? '')
  return {
    name: m[1] as Scenario, theme: q.get('theme') ?? 'dark', scale: Number(q.get('scale') ?? 1), side: q.get('side') ?? 'both',
    rings: q.get('rings') !== '0', practice: q.get('practice') === '1', hover: q.has('hover') ? Number(q.get('hover')) : null, expand: q.get('expand') === '1',
    fx: MOCK_FX[q.get('fx') ?? ''] ?? null
  }
}

export function HudApp() {
  const { t } = useTranslation()
  const mock = useMemo(parseMock, [])
  const settings = useSettings()
  const session = useSession()
  const { state, rec, judge, practice: stats } = useMatch()
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [tipIdx, setTipIdx] = useState(0)
  const [revealed, setRevealed] = useState<number | null>(null)
  const pointer = useHudPointer()

  useEffect(() => {
    const on = (): void => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  useEffect(() => {
    document.body.dataset.hud = '1'
    if (mock) {
      const b = scenario(mock.name)
      useSession.setState({ ...b.session, mode: b.session.mode === 'off' ? 'assist' : b.session.mode })
      useMatch.setState(b.match)
      useSettings.getState().patch({ theme: mock.theme as 'dark' | 'light', hudScale: mock.scale, hudSide: mock.side as 'both', hudPractice: mock.practice })
      if (mock.expand) document.body.dataset.expand = '1'
      return
    }
    const api = window.soul
    if (!api) return
    void api.getSettings().then((st) => { useSettings.getState().patch(st as never); void i18n.changeLanguage((st as { language?: string }).language ?? 'zh-CN') })
    const offs = [
      api.onCore((m) => applyCoreMessage(m, useSettings.getState().autoDelayMs)),
      api.onSettings((st) => { useSettings.getState().patch(st as never); void i18n.changeLanguage((st as { language?: string }).language ?? 'zh-CN') })
    ]
    return () => offs.forEach((f) => f())
  }, [mock])

  useEffect(() => applyTheme(settings.theme), [settings.theme])

  // 教学条目：顺位提示（All Last / 南场才有）排第一，然后是这一手的理由
  const note = state ? placeNote(t, state) : ''
  const tips = useMemo(() => [...(note ? [{ code: '__place' }] : []), ...(rec?.tips ?? [])], [note, rec?.tips])
  useEffect(() => { setTipIdx(0) }, [rec?.revision])
  useEffect(() => {
    if (tips.length < 2) return
    const id = setInterval(() => setTipIdx((i) => (i + 1) % tips.length), 7000)
    return () => clearInterval(id)
  }, [tips.length])

  // 事件横幅（听牌 / 连击 / 不一致 / 对手立直 / 名次变化）：只在“变化”时触发
  const forced = mock?.fx?.k === 'riichi' && state ? { ...mock.fx, seat: ((state.self_seat ?? 0) + 2) % 4 } : mock?.fx ?? null
  const fx = useFx(state ? snapOf(state, rec, judge ?? null, stats ?? EMPTY_PRACTICE) : null, state, forced)

  const visible = mock ? true : settings.overlayEnabled && session.mode !== 'off' && session.phase === 'in_game' && !!state
  if (!visible || !state) return null

  // 信息层窗口覆盖整个游戏区；画面位置用与主进程同一个函数算出来，上下多出来的部分放信息栏
  const fit = fitGame(size.w, size.h, { reserve: settings.hudReserve, dock: settings.hudDock })
  const u = fit.game.w / 16
  const scale = settings.hudScale
  const fresh = !!rec && rec.revision === state.revision
  const self = state.self_seat ?? 0
  const a = state.analysis
  const showL = settings.hudSide !== 'right'
  const showR = settings.hudSide !== 'left'
  // 练习模式：当前这手的答案在你出牌（或点“看答案”）之前都隐藏
  const hidden = settings.hudPractice && fresh && !!rec?.kind && revealed !== rec.revision
  const rect = { x: 0, y: 0, w: fit.game.w, h: fit.game.h }
  const danger = state.riichi.filter((x) => x !== self).length
  const groups = fresh && rec?.insight?.groups ? rec.insight.groups : a?.groups ?? rec?.insight?.groups
  const rings = !hidden && fresh && rec?.steps && (!mock || mock.rings) ? overlayShapes(rec.steps, rect) : []
  const tipI = Math.min(tipIdx, tips.length - 1)
  const tip = tips[tipI]
  const tipInBar = fit.bottom.h >= TIP_BAR_MIN
  const tipText = !tip ? '' : tip.code === '__place' ? note : hidden ? '' : renderTip(t, tip, self)
  const oneLine = !!rec?.kind && CALLISH.includes(rec.kind)

  // 悬停手牌（鼠标移动会转发进来，但点击仍然穿透到游戏）
  const hoverIdx = mock?.hover ?? (pointer ? hoveredTile((pointer.x - fit.game.x) / u, (pointer.y - fit.game.y) / u, state.hand.length, !!state.drawn) : null)

  return (
    <div className={s.root} style={{ '--u': `${u}px`, '--hs': scale } as CSSProperties} data-testid="hud-root">
      <TopBar h={fit.top.h} state={state} danger={danger} />
      <BottomBar
        h={fit.bottom.h} groups={hidden ? null : groups} practiceHint={hidden ? t('coach.hiddenBar') : null} melds={state.melds[self] ?? []} self={self}
        danger={danger}
        push={fit.bottom.h >= PUSH_BAR_MIN ? <BalancePanel rec={rec} hidden={hidden} stale={!fresh} rows={Math.max(1, Math.min(5, Math.floor((fit.bottom.h - 18) / 17)))} /> : null}
      />
      <div className={s.game} style={{ left: fit.game.x, top: fit.game.y, width: fit.game.w, height: fit.game.h }} data-testid="hud-game">
        {showL && (
          <div className={s.zoneL} style={{ left: u * ZONES.left.x, bottom: u * (9 - ZONES.left.bottom), width: u * ZONES.left.w, transform: `scale(${scale})` }} data-zone="left">
            <DecisionCard
              rec={rec} state={state} u={u} fresh={fresh} hidden={hidden} practice={settings.hudPractice} judge={judge ?? null} stats={stats ?? EMPTY_PRACTICE}
              teach={settings.hudTeach} onReveal={() => rec && setRevealed(rec.revision)} onPractice={(v) => (mock ? useSettings.getState().patch({ hudPractice: v }) : updateSettings({ hudPractice: v }))}
            />
          </div>
        )}
        {showR && (
          <div className={s.zoneR} style={{ left: u * ZONES.right.x, top: u * ZONES.right.y, width: u * ZONES.right.w, transform: `scale(${scale})` }} data-zone="right">
            <ThreatCard state={state} rec={rec} u={u} hidden={hidden} />
          </div>
        )}
        {settings.hudTeach && tipText && !tipInBar && (
          <div className={s.strip} style={{ left: u * ZONES.strip.x, top: u * ZONES.strip.y, width: u * ZONES.strip.w, transform: `scale(${scale})` }} data-zone="strip" data-oneline={oneLine || undefined} data-stale={!fresh || undefined}>
            <span className={s.sic}>{t('tips.title')}</span>
            <span key={`${rec?.revision}-${tipIdx}`} className={s.stext}><Rich text={tipText} /></span>
            {tips.length > 1 && <span className={s.sdots}>{tips.map((_, i) => <i key={i} data-on={i === tipIdx || undefined} />)}</span>}
          </div>
        )}
        {settings.hudBars && a && (
          <div className={s.bars} data-zone="bars">
            {[...state.hand, ...(state.drawn ? [state.drawn] : [])].map((code, i) => {
              const isDrawn = !!state.drawn && i === state.hand.length
              const tier = a.risk[code]?.tier
              if (tier === undefined) return null
              const x = (TEHAI_X[Math.min(i, TEHAI_X.length - 1)] ?? 0) + (isDrawn ? TRUMO_SPACE : 0)
              return <i key={i} data-tier={tier} data-hover={i === hoverIdx || undefined} style={{ left: u * (x - ZONES.bars.w / 2), top: u * ZONES.bars.y, width: u * ZONES.bars.w, height: Math.max(3, u * ZONES.bars.h) }} />
            })}
          </div>
        )}
        {hoverIdx !== null && <HandTip state={state} rec={rec} index={hoverIdx} u={u} hidden={hidden} />}
        {rings.map((r, i) => <Target key={`${rec?.revision}-${i}`} r={r} kind={rec?.kind ?? null} />)}
        {fx.ev && (
          <div className={s.callZone} style={{ left: u * ZONES.callout.cx, top: u * ZONES.callout.y }} data-zone="callout">
            <Callout key={fx.id} ev={fx.ev} u={u} self={self} hold={fx.id === -1} />
          </div>
        )}
      </div>
    </div>
  )
}
