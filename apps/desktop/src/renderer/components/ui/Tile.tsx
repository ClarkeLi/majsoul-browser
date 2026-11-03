import { tileFace } from '@renderer/lib/tiles'
import s from './Tile.module.css'

const urls = import.meta.glob('../../../../resources/tiles/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const byName = Object.fromEntries(Object.entries(urls).map(([p, u]) => [p.split('/').pop()!.replace('.svg', ''), u]))

export type TileSize = 'xl' | 'md' | 'sm' | 'xs'
export type TileState = 'normal' | 'recommended' | 'candidate' | 'dim' | 'tsumogiri' | 'called' | 'riichi'

interface Props { code: string; size?: TileSize; state?: TileState; back?: boolean; title?: string; px?: number }

/** 牌：Front.svg 作底，叠加牌面（赤五用 *-Dora.svg），牌背用 Back.svg。 */
export function Tile({ code, size = 'md', state = 'normal', back, title, px }: Props) {
  const face = back ? null : tileFace(code)
  return (
    <span className={[s.tile, s[size], s[state]].join(' ')} title={title} data-code={code} style={px ? { width: px, height: Math.round((px * 4) / 3) } : undefined}>
      <img className={s.layer} src={back ? byName['Back'] : byName['Front']} alt="" draggable={false} />
      {face && byName[face] && <img className={s.layer} src={byName[face]} alt={code} draggable={false} />}
    </span>
  )
}
