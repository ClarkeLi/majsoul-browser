import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { de } from './de'
import { en } from './en'
import { ja } from './ja'
import { ko } from './ko'
import { zhCN } from './zh-CN'

void i18next.use(initReactI18next).init({
  lng: 'zh-CN',
  fallbackLng: 'en',
  resources: { 'zh-CN': { translation: zhCN }, en: { translation: en }, ja: { translation: ja }, ko: { translation: ko }, de: { translation: de } },
  interpolation: { escapeValue: false },
  returnObjects: true
})

export default i18next
