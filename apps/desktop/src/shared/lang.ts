/** 支持的界面语言（主进程、渲染层、信息层共用）。 */
export const LANGS = ['zh-CN', 'en', 'ja', 'ko', 'de'] as const
export type Lang = (typeof LANGS)[number]

/** 语言选择器里显示的名字（各自用本语言书写） */
export const LANG_LABELS: Record<Lang, string> = { 'zh-CN': '简体中文', en: 'English', ja: '日本語', ko: '한국어', de: 'Deutsch' }

export function isLang(x: unknown): x is Lang {
  return typeof x === 'string' && (LANGS as readonly string[]).includes(x)
}

/** 系统区域设置 → 界面语言；不认识的一律英语。 */
export function pickLang(locale: string | null | undefined): Lang {
  const l = (locale ?? '').toLowerCase()
  if (l.startsWith('zh')) return 'zh-CN'
  if (l.startsWith('ja')) return 'ja'
  if (l.startsWith('ko')) return 'ko'
  if (l.startsWith('de')) return 'de'
  return 'en'
}
