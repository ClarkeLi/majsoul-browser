import i18next from 'i18next'
import { beforeAll, describe, expect, it } from 'vitest'
import { de } from '../i18n/de'
import { en } from '../i18n/en'
import { ja } from '../i18n/ja'
import { ko } from '../i18n/ko'
import { zhCN } from '../i18n/zh-CN'
import { GLOSS_KEYS, splitTerms, type GlossKey } from './glossary'

beforeAll(async () => {
  await i18next.init({ lng: 'zh-CN', resources: { 'zh-CN': { translation: zhCN }, en: { translation: en }, ja: { translation: ja }, ko: { translation: ko }, de: { translation: de } }, returnObjects: true, interpolation: { escapeValue: false } })
})

describe('splitTerms', () => {
  const zh: Array<[GlossKey, string]> = [['shanten', '向听'], ['ukeire', '进张'], ['suji', '筋'], ['tenpai', '听牌']]
  it('切出术语，每个只标第一次', () => {
    const s = splitTerms('打后 1 向听，进张 34 张；向听更低的牌更好', zh)
    expect(s).toEqual(['打后 1 ', { key: 'shanten', text: '向听' }, '，', { key: 'ukeire', text: '进张' }, ' 34 张；向听更低的牌更好'])
  })
  it('没有术语时原样返回', () => {
    expect(splitTerms('你好', zh)).toEqual(['你好'])
  })
  it('英文按词边界、不区分大小写', () => {
    const s = splitTerms('Tenpai now; retenpai is not a term', [['tenpai', 'tenpai']])
    expect(s).toEqual([{ key: 'tenpai', text: 'Tenpai' }, ' now; retenpai is not a term'])
  })
  it('长别名优先', () => {
    const s = splitTerms('壁 No Chance', [['kabe', '壁'], ['kabe', 'No Chance']])
    expect(s[0]).toEqual({ key: 'kabe', text: '壁' })
  })
})

describe('词典文案', () => {
  it('五种语言每个术语都有名称与解释', () => {
    for (const lng of ['zh-CN', 'en', 'ja', 'ko', 'de']) {
      for (const k of GLOSS_KEYS) {
        expect(i18next.t(`gloss.${k}.t`, { lng }), `${lng} ${k}`).not.toBe(`gloss.${k}.t`)
        expect(i18next.t(`gloss.${k}.d`, { lng }).length, `${lng} ${k}`).toBeGreaterThan(8)
      }
    }
  })
})
