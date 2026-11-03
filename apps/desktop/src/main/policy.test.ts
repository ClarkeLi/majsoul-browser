import { describe, expect, it } from 'vitest'
import { ALLOWED_CDP, ALLOWED_INPUT } from './frame-tap'
import { isAllowedNavigation } from './navigation-policy'

describe('只读与导航白名单', () => {
  it('FrameTap 只允许 Network.enable 与 Target.setAutoAttach', () => {
    expect([...ALLOWED_CDP].sort()).toEqual(['Network.enable', 'Target.setAutoAttach'])
  })
  it('点击/焦点相关只允许鼠标事件与焦点模拟', () => {
    expect([...ALLOWED_INPUT].sort()).toEqual(['Emulation.setFocusEmulationEnabled', 'Input.dispatchMouseEvent'])
  })
  it('导航白名单', () => {
    expect(isAllowedNavigation('https://game.maj-soul.com/1/')).toBe(true)
    expect(isAllowedNavigation('https://evil.example.com/')).toBe(false)
    expect(isAllowedNavigation('http://game.maj-soul.com/')).toBe(false)
    expect(isAllowedNavigation('file:///etc/passwd')).toBe(false)
    expect(isAllowedNavigation('https://maj-soul.com.evil.com/')).toBe(false)
  })
})
