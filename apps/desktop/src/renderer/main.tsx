import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './styles/global.css'
import { App } from './App'
import { HudApp } from './hud/HudApp'

// 同一个渲染包：#/hud… 是游戏画面上的透明信息层窗口，其余是主界面
const isHud = window.location.hash.startsWith('#/hud')
if (isHud) document.documentElement.classList.add('hud')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isHud ? <HudApp /> : <App />}
  </StrictMode>
)
