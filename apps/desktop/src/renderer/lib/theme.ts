export type ThemeSetting = 'dark' | 'light' | 'system'

export function applyTheme(setting: ThemeSetting): () => void {
  const root = document.documentElement
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const set = (): void => { root.dataset.theme = setting === 'system' ? (mq.matches ? 'dark' : 'light') : setting }
  set()
  if (setting === 'system') {
    mq.addEventListener('change', set)
    return () => mq.removeEventListener('change', set)
  }
  return () => {}
}
