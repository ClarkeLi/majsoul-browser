import { useEffect, useRef, useState } from 'react'
import type { StateMsg } from '@shared/protocol'
import { detectFx, type FxEvent, type FxSnap } from './events'

const SHOW_MS = 2000
/** 同时最多排队几个；立直警告优先 */
const MAX_QUEUE = 3

/** 把快照变化变成一个个依次播放的横幅事件。forced（截图用）会一直显示。 */
export function useFx(snap: FxSnap | null, state: StateMsg | null, forced: FxEvent | null): { ev: FxEvent | null; id: number } {
  const prev = useRef<FxSnap | null>(null)
  const seq = useRef(0)
  const [queue, setQueue] = useState<Array<{ ev: FxEvent; id: number }>>([])
  const key = snap ? JSON.stringify([snap.game, snap.round, snap.tenpai, snap.judgeKey, snap.riichi, snap.rank]) : ''

  useEffect(() => {
    if (!snap || !state) return
    const evs = detectFx(prev.current, snap, state)
    prev.current = snap
    if (evs.length === 0) return
    setQueue((q) => {
      const add = evs.map((ev) => ({ ev, id: ++seq.current }))
      const all = [...q, ...add]
      const urgent = all.filter((x) => x.ev.k === 'riichi')
      const rest = all.filter((x) => x.ev.k !== 'riichi')
      return [...urgent, ...rest].slice(0, MAX_QUEUE)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const head = queue[0]
  useEffect(() => {
    if (!head) return
    const id = setTimeout(() => setQueue((q) => q.slice(1)), SHOW_MS)
    return () => clearTimeout(id)
  }, [head?.id])

  if (forced) return { ev: forced, id: -1 }
  return head ? { ev: head.ev, id: head.id } : { ev: null, id: 0 }
}
