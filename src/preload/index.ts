import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type KitchenApi, type TodoPatch } from '../shared/ipc'
import type { CameraStatus, Settings } from '../shared/types'

const api: KitchenApi = {
  getAppInfo: () => ipcRenderer.invoke(IPC.appGetInfo),
  onOpenSettings: (handler) => {
    const listener = (): void => handler()
    ipcRenderer.on(IPC.openSettings, listener)
    return () => ipcRenderer.removeListener(IPC.openSettings, listener)
  },

  settings: {
    get: () => ipcRenderer.invoke(IPC.settingsGet),
    update: (patch: Partial<Settings>) => ipcRenderer.invoke(IPC.settingsUpdate, patch),
    onChange: (handler) => {
      const listener = (_e: unknown, settings: Settings): void => handler(settings)
      ipcRenderer.on(IPC.settingsChanged, listener)
      return () => ipcRenderer.removeListener(IPC.settingsChanged, listener)
    }
  },

  todos: {
    list: () => ipcRenderer.invoke(IPC.todosList),
    add: (text: string) => ipcRenderer.invoke(IPC.todosAdd, text),
    update: (id: string, patch: TodoPatch) => ipcRenderer.invoke(IPC.todosUpdate, id, patch),
    remove: (id: string) => ipcRenderer.invoke(IPC.todosRemove, id),
    reorder: (orderedIds: string[]) => ipcRenderer.invoke(IPC.todosReorder, orderedIds),
    clearCompleted: () => ipcRenderer.invoke(IPC.todosClearCompleted)
  },

  camera: {
    start: (rtspUrl: string) => ipcRenderer.invoke(IPC.cameraStart, rtspUrl),
    stop: () => ipcRenderer.invoke(IPC.cameraStop),
    getStatus: () => ipcRenderer.invoke(IPC.cameraStatus),
    onStatus: (handler) => {
      const listener = (_e: unknown, status: CameraStatus): void => handler(status)
      ipcRenderer.on(IPC.cameraStatusChanged, listener)
      return () => ipcRenderer.removeListener(IPC.cameraStatusChanged, listener)
    }
  },

  calendar: {
    getEvents: () => ipcRenderer.invoke(IPC.calendarGetEvents)
  },

  weather: {
    get: () => ipcRenderer.invoke(IPC.weatherGet)
  },

  photos: {
    list: () => ipcRenderer.invoke(IPC.photosList),
    pickFolder: () => ipcRenderer.invoke(IPC.photosPickFolder)
  },

  news: {
    get: () => ipcRenderer.invoke(IPC.newsGet)
  },

  window: {
    toggleFullscreen: () => ipcRenderer.invoke(IPC.windowToggleFullscreen),
    isFullscreen: () => ipcRenderer.invoke(IPC.windowIsFullscreen)
  }
}

// contextIsolation is on, so expose the API through the bridge rather than the window directly.
contextBridge.exposeInMainWorld('api', api)
