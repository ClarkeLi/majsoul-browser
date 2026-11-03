/** 游戏 view 的导航与权限白名单。 */
const ALLOWED_HOST_SUFFIXES = ['maj-soul.com', 'majsoul.com', 'catfood.com', 'yo-star.com', 'mahjongsoul.com']

export function isAllowedNavigation(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol === 'about:') return true
    if (u.protocol !== 'https:' && u.protocol !== 'wss:') return false
    return ALLOWED_HOST_SUFFIXES.some((s) => u.hostname === s || u.hostname.endsWith('.' + s))
  } catch {
    return false
  }
}

/** 权限请求一律拒绝 */
export function denyAllPermissions(): boolean {
  return false
}
