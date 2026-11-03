import i18next from 'i18next'
import { beforeAll, describe, expect, it } from 'vitest'
import { en } from '../i18n/en'
import { zhCN } from '../i18n/zh-CN'
import { renderTip } from './tips'

beforeAll(async () => {
  await i18next.init({ lng: 'zh-CN', resources: { 'zh-CN': { translation: zhCN }, en: { translation: en } }, returnObjects: true, interpolation: { escapeValue: false } })
})

describe('renderTip', () => {
  const t = i18next.t.bind(i18next)
  it('why_closer：向听更好时讲“更接近和牌”，不拿进张数误导', () => {
    const s = renderTip(t, { code: 'why_closer', tile: '9s', alt: '2s', a: { shanten: 0, total: 8 }, b: { shanten: 1, total: 34 } }, 1)
    expect(s).toContain('打九索比打二索更好')
    expect(s).toContain('听牌')
    expect(s).toContain('1 向听')
    expect(s).not.toContain('34 张')
  })
  it('why_more：向听相同时比进张数', () => {
    const s = renderTip(t, { code: 'why_more', tile: '2m', alt: '9s', a: { shanten: 1, total: 40 }, b: { shanten: 1, total: 30 } }, 1)
    expect(s).toContain('40 张')
    expect(s).toContain('30 张')
  })
  it('安全牌提示解释原因，座位按相对称呼', () => {
    const s = renderTip(t, { code: 'safe_tiles', seat: 3, safe: [{ tile: '3m', why: 'genbutsu', risk: 0.8 }, { tile: '4m', why: 'suji', risk: 1.5 }] }, 1)
    expect(s).toContain('对家')
    expect(s).toContain('三万（现物：他打过）')
    expect(s).toContain('筋')
  })
  it('规则类提示与鸣牌类型', () => {
    expect(renderTip(t, { code: 'call_rule', kind: 'pon' }, 0)).toContain('碰')
    expect(renderTip(t, { code: 'riichi_rule' }, 0)).toContain('立直')
  })
  it('所有 Core 可能给出的 code 在中英文里都有文案', () => {
    for (const code of ['why_closer', 'why_more', 'close_call', 'tenpai', 'furiten', 'safe_tiles', 'fold', 'riichi_rule', 'call_rule_chi', 'call_rule_pon', 'call_rule_daiminkan', 'kyuushu_rule', 'pass_rule', 'win_rule', 'k_ukeire', 'k_pushfold']) {
      expect(zhCN.tips[code as keyof typeof zhCN.tips], code).toBeTruthy()
      expect(en.tips[code as keyof typeof en.tips], code).toBeTruthy()
    }
    for (const why of ['genbutsu', 'suji', 'half_suji', 'nochance', 'onechance', 'honor', 'honor_seen', 'seen4', 'none']) {
      expect(zhCN.tips.why[why as keyof typeof zhCN.tips.why], why).toBeTruthy()
    }
  })
})
