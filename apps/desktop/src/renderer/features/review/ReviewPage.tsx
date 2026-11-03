import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/Button'
import { Card } from '@renderer/components/ui/Card'
import { Tile } from '@renderer/components/ui/Tile'
import { tileName } from '@renderer/lib/tiles'
import { useReview } from '@renderer/stores'
import type { ReviewItem } from '@shared/protocol'
import { EmptyState } from '../match/EmptyState'
import s from './ReviewPage.module.css'

const pct = (v: number | null): string => (v === null ? '—' : `${Math.round(v * 100)}%`)

function Item({ it }: { it: ReviewItem }) {
  const { t } = useTranslation()
  const what = (code: string | null): string => (code && /^[0-9ESWNPFC]/.test(code) && code !== 'none' ? `${t('action.discard')} ${tileName(t, code)}` : code ?? '—')
  return (
    <li className={[s.item, it.agree ? '' : s.differ].join(' ')}>
      <span className={s.tile}>{it.tile ? <Tile code={it.tile} size="sm" /> : null}</span>
      <span className={s.cols}>
        <span>{t('review.yourChoice')} {what(it.actual)}</span>
        <span className={s.sub}>{t('review.recommended')} {it.kind === 'discard' ? what(it.tile) : t(`action.${it.kind}`, { defaultValue: it.kind })}</span>
      </span>
      <span className={[s.loss, 'num'].join(' ')}>{it.q_loss ? t('review.loss', { v: it.q_loss.toFixed(2) }) : it.agree ? '✓' : ''}</span>
    </li>
  )
}

export function ReviewPage() {
  const { t, i18n } = useTranslation()
  const { games, detail } = useReview()
  useEffect(() => { window.soul?.listReviews() }, [])

  if (detail) {
    return (
      <div className={s.page}>
        <div><Button variant="ghost" onClick={() => useReview.setState({ detail: null })}>← {t('review.back')}</Button></div>
        <Card>
          <div className={s.stats}>
            <div><div className={[s.big, 'num'].join(' ')}>{pct(detail.agree_rate)}</div><div className={s.sub}>{t('review.agreeRate')}</div></div>
            <div><div className={[s.big, 'num'].join(' ')}>{detail.decisions}</div><div className={s.sub}>{t('review.decisions')}</div></div>
            <div><div className={[s.big, 'num'].join(' ')}>{detail.total_q_loss.toFixed(1)}</div><div className={s.sub}>{t('review.qLoss')}</div></div>
          </div>
        </Card>
        <Card>
          <h3 className={s.title}>{t('review.mistakes')}</h3>
          <ul className={s.list}>{detail.top_mistakes.length ? detail.top_mistakes.map((m) => <Item key={m.rev} it={m} />) : <li className={s.sub}>{t('review.noMistakes')}</li>}</ul>
        </Card>
        <Card>
          <h3 className={s.title}>{t('review.turns')}</h3>
          <ul className={s.list}>{detail.items.map((m, i) => <Item key={i} it={m} />)}</ul>
        </Card>
      </div>
    )
  }
  if (games.length === 0) return <EmptyState title={t('review.empty')} desc={t('review.emptyDesc')} />
  return (
    <div className={s.page}>
      {games.map((g) => (
        <button key={g.file} type="button" className={s.game} onClick={() => window.soul?.getReview(g.file)}>
          <span className={s.gname}>{t('review.game', { id: (g.uuid ?? g.file).slice(-6) })}</span>
          <span className={s.sub}>{g.started ? new Date(g.started * 1000).toLocaleString(i18n.language) : ''}</span>
          <span className={[s.gstat, 'num'].join(' ')}>{pct(g.agree_rate)} · {g.decisions}</span>
        </button>
      ))}
    </div>
  )
}
