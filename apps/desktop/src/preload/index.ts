import { contextBridge, ipcRenderer } from 'electron'
import type { CoreMessage, ModelEntry, ModelProgress, Mode } from '@shared/protocol'

type Unsub = () => void
const on = <T>(channel: string, cb: (v: T) => void): Unsub => {
  const h = (_e: unknown, v: T): void => cb(v)
  ipcRenderer.on(channel, h)
  return () => ipcRenderer.removeListener(channel, h)
}

const api = {
  onCore: (cb: (m: CoreMessage) => void) => on('core:message', cb),
  onCoreStatus: (cb: (s: { state: string; detail?: string }) => void) => on('core:status', cb),
  onAppEvent: (cb: (e: { t: string; [k: string]: unknown }) => void) => on('app:event', cb),
  onSettings: (cb: (s: Record<string, unknown>) => void) => on('settings:changed', cb),
  onStats: (cb: (s: { frames: number }) => void) => on('app:stats', cb),
  info: (): Promise<{ dataRoot: string; version: string; platform: string; protocolVersion: number; packaged: boolean }> => ipcRenderer.invoke('app:info'),
  getSettings: (): Promise<Record<string, unknown>> => ipcRenderer.invoke('settings:get'),
  patchSettings: (p: object): Promise<Record<string, unknown>> => ipcRenderer.invoke('settings:patch', p),
  setMode: (m: Mode) => ipcRenderer.send('mode:set', m),
  stopAuto: () => ipcRenderer.send('auto:stop'),
  resumeAuto: () => ipcRenderer.send('auto:resume'),
  /** 仅信息层使用：鼠标是否停在可交互的面板上 */
  setHudInteractive: (v: boolean) => ipcRenderer.send('hud:interactive', v === true),
  setSidebar: (v: { width: number; collapsed: boolean }) => ipcRenderer.send('layout:sidebar', v),
  listModels: (): Promise<ModelEntry[]> => ipcRenderer.invoke('models:list'),
  importModel: (): Promise<{ canceled: boolean; ok?: boolean }> => ipcRenderer.invoke('models:import'),
  activateModel: (sha: string): Promise<boolean> => ipcRenderer.invoke('models:activate', sha),
  onModelProgress: (cb: (p: ModelProgress) => void) => on('models:progress', cb),
  getStats: () => ipcRenderer.send('stats:get'),
  listReviews: () => ipcRenderer.send('review:list'),
  getReview: (file: string) => ipcRenderer.send('review:get', file),
  exportDiagnostics: (): Promise<string> => ipcRenderer.invoke('diag:export'),
  clearLogin: (): Promise<boolean> => ipcRenderer.invoke('data:clearLogin'),
  clearRecords: (): Promise<boolean> => ipcRenderer.invoke('data:clearRecords'),
  reloadGame: () => ipcRenderer.send('game:reload'),
  openDataDir: () => ipcRenderer.send('data:open')
}

contextBridge.exposeInMainWorld('soul', api)
export type SoulApi = typeof api
