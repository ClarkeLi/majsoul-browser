import { describe, expect, it } from 'vitest'
import { isLang, pickLang } from './lang'

describe('pickLang', () => {
  it('按系统区域选语言', () => {
    expect(pickLang('zh-Hans-CN')).toBe('zh-CN')
    expect(pickLang('zh-TW')).toBe('zh-CN')
    expect(pickLang('ja-JP')).toBe('ja')
    expect(pickLang('ko-KR')).toBe('ko')
    expect(pickLang('de-AT')).toBe('de')
    expect(pickLang('fr-FR')).toBe('en')
    expect(pickLang(undefined)).toBe('en')
  })
  it('isLang', () => {
    expect(isLang('ja')).toBe(true)
    expect(isLang('fr')).toBe(false)
  })
})
