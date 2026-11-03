/** 术语词典：文案在 i18n 的 gloss.<key>（t = 名称，a = 用 | 分隔的别名，d = 解释）。 */
export const GLOSS_KEYS = [
  'shanten', 'ukeire', 'tenpai', 'ryanmen', 'kanchan', 'penchan', 'head', 'taatsu', 'isolated', 'goodshape',
  'genbutsu', 'suji', 'kabe', 'furiten', 'riichi', 'ippatsu', 'pushfold', 'menzen', 'yaku', 'dora',
  'honba', 'kyotaku', 'tsumogiri', 'avoid4', 'allLast', 'placement'
] as const
export type GlossKey = (typeof GLOSS_KEYS)[number]

export type Seg = string | { key: GlossKey; text: string }

const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * 把一段文字切成普通文字与术语。aliases 是 [key, 别名] 列表；长的别名优先，
 * 每个术语只标第一次出现（避免满屏下划线），英文不区分大小写、按词边界匹配。
 */
export function splitTerms(text: string, aliases: Array<[GlossKey, string]>): Seg[] {
  const list = aliases.filter(([, a]) => a.trim().length > 0).sort((x, y) => y[1].length - x[1].length)
  if (!text || list.length === 0) return [text]
  const byLower = new Map(list.map(([k, a]) => [a.toLowerCase(), k]))
  const pat = list.map(([, a]) => (/^[\w ]+$/.test(a) ? `\\b${esc(a)}\\b` : esc(a))).join('|')
  const re = new RegExp(pat, 'gi')
  const out: Seg[] = []
  const used = new Set<GlossKey>()
  let last = 0
  for (const m of text.matchAll(re)) {
    const key = byLower.get(m[0].toLowerCase())
    if (!key || used.has(key)) continue
    used.add(key)
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push({ key, text: m[0] })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
