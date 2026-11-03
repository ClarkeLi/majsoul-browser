import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Tile } from '@renderer/components/ui/Tile'
import { relSeat } from '@renderer/lib/tiles'
import type { FxEvent } from './events'
import s from './Fx.module.css'

/** [强调色, 色块上的字色]：朱 / 紅底用浅字，山吹 / 青竹底用墨字 */
const ACC: Record<FxEvent['k'], [string, string]> = {
  tenpai: ['--wa-take', '--wa-ink'],
  agree: ['--wa-kin', '--wa-ink'],
  miss: ['--wa-shu', '--wa-paper'],
  riichi: ['--wa-shu', '--wa-paper'],
  rank: ['--wa-kin', '--wa-ink']
}

/**
 * 横幅：牌桌下沿弹出一条转播字幕式的横条——左边一枚“盖章”的汉字（聴 / 連 / 惜 / 立 / 昇…），右边大字 + 一句“为什么 / 下一步”。
 * 听牌给待牌与余张，一致给连击，不一致给 AI 的选择与价值差，立直给对他最安全的牌。约 2 秒后消失。
 */
export function Callout({ ev, u, self, hold }: { ev: FxEvent; u: number; self: number; /** 截图用：停在最后一帧，不消失 */ hold?: boolean }) {
  const { t } = useTranslation()
  const down = ev.k === 'rank' && ev.to > ev.from
  const [a, on] = down ? ['--wa-shu', '--wa-paper'] : ACC[ev.k]
  const px = Math.round(u * 0.16)
  const style = { '--acc': `var(${a})`, '--on': `var(${on})` } as CSSProperties
  let glyph = ''
  let big = ''
  let sub: ReactNode = null
  let badge: ReactNode = null
  switch (ev.k) {
    case 'tenpai': {
      glyph = t('fx.glyph.tenpai')
      big = t('fx.tenpai')
      const left = ev.waits.reduce((n, w) => n + w.left, 0)
      sub = <>{ev.waits.slice(0, 5).map((w) => <Tile key={w.tile} code={w.tile} px={px} />)}<span>{t('fx.tenpaiSub', { n: ev.waits.length, left })}</span></>
      break
    }
    case 'agree':
      glyph = ev.streak >= 2 ? t('fx.glyph.combo') : t('fx.glyph.agree')
      big = ev.streak >= 2 ? t('fx.combo') : t('fx.agree')
      badge = ev.streak >= 2 ? <b className={`${s.badge} num`}>×{ev.streak}</b> : null
      sub = <><Tile code={ev.tile} px={px} /><span>{ev.streak >= 2 ? t('fx.comboSub', { n: ev.streak }) : t('fx.agreeSub')}</span></>
      break
    case 'miss':
      glyph = t('fx.glyph.miss')
      big = t('fx.miss')
      sub = <><span>{t('fx.youPlayed')}</span><Tile code={ev.actual} px={px} /><span>{t('fx.aiPick')}</span><Tile code={ev.want} px={px} />{ev.qLoss !== null && <em className="num">{t('fx.loss', { v: ev.qLoss.toFixed(2) })}</em>}</>
      break
    case 'riichi':
      glyph = t('fx.glyph.riichi')
      big = t('fx.riichi', { who: t(`seat.${relSeat(ev.seat, self)}`) })
      sub = ev.safe
        ? <><span>{t('fx.riichiSafe')}</span><Tile code={ev.safe} px={px} /><span>{t(`coach.whyShort.${ev.why}`, { basis: '', n: 2 })}</span></>
        : <span>{t('fx.riichiNoSafe')}</span>
      break
    case 'rank':
      glyph = down ? t('fx.glyph.rankDown') : t('fx.glyph.rankUp')
      big = down ? t('fx.rankDown', { n: ev.to }) : t('fx.rankUp', { n: ev.to })
      sub = <span>{t(`fx.rankSub${ev.to}`)}</span>
      break
  }
  return (
    <div className={s.callout} data-k={ev.k} data-hold={hold || undefined} style={style} data-testid="callout">
      <span className={s.glyph}>{glyph}</span>
      <span className={s.body}>
        <span className={s.big}>{big}{badge}</span>
        <span className={s.sub}>{sub}</span>
      </span>
    </div>
  )
}
