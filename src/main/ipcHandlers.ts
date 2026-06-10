import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { IPC, type AppInfo, type TodoPatch } from '../shared/ipc'
import type { CameraStatus, Settings } from '../shared/types'
import {
  addTodo,
  clearCompletedTodos,
  getSettings,
  listTodos,
  removeTodo,
  reorderTodos,
  updateSettings,
  updateTodo
} from './store'
import { cameraService } from './camera'
import { getCalendarEvents } from './calendar'
import { getWeather } from './weather'
import { listPhotos } from './photos'
import { getNews } from './news'

/** Push the OS "open at login" registration in sync with the persisted setting. */
function applyAutoStart(enabled: boolean, isDev: boolean): void {
  // Skip in dev: the login item would point at the electron-vite dev binary.
  if (isDev) return
  app.setLoginItemSettings({ openAtLogin: enabled })
}

function focusedWindow(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
}

function broadcastSettings(settings: Settings): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(IPC.settingsChanged, settings)
  }
}

function broadcastCameraStatus(status: CameraStatus): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(IPC.cameraStatusChanged, status)
  }
}

export function registerIpc(isDev: boolean): void {
  cameraService.setStatusListener(broadcastCameraStatus)
  // Reflect the persisted auto-start preference into the OS on startup.
  applyAutoStart(getSettings().autoStart, isDev)
  ipcMain.handle(IPC.appGetInfo, (): AppInfo => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    isDev
  }))

  // Settings
  ipcMain.handle(IPC.settingsGet, (): Settings => getSettings())
  ipcMain.handle(IPC.settingsUpdate, (_e, patch: Partial<Settings>): Settings => {
    const next = updateSettings(patch)
    if (patch.autoStart !== undefined) applyAutoStart(next.autoStart, isDev)
    broadcastSettings(next)
    return next
  })

  // Todos — every mutation returns the full, persisted list.
  ipcMain.handle(IPC.todosList, () => listTodos())
  ipcMain.handle(IPC.todosAdd, (_e, text: string) => addTodo(text))
  ipcMain.handle(IPC.todosUpdate, (_e, id: string, patch: TodoPatch) => updateTodo(id, patch))
  ipcMain.handle(IPC.todosRemove, (_e, id: string) => removeTodo(id))
  ipcMain.handle(IPC.todosReorder, (_e, orderedIds: string[]) => reorderTodos(orderedIds))
  ipcMain.handle(IPC.todosClearCompleted, () => clearCompletedTodos())

  // Camera
  ipcMain.handle(IPC.cameraStart, (_e, rtspUrl: string) => cameraService.start(rtspUrl))
  ipcMain.handle(IPC.cameraStop, () => cameraService.stop())
  ipcMain.handle(IPC.cameraStatus, () => cameraService.getStatus())

  // Calendar
  ipcMain.handle(IPC.calendarGetEvents, () => getCalendarEvents())

  // Weather
  ipcMain.handle(IPC.weatherGet, () => getWeather())

  // Photos
  ipcMain.handle(IPC.photosList, () => listPhotos())
  ipcMain.handle(IPC.photosPickFolder, async (): Promise<string | null> => {
    const win = focusedWindow()
    const options: Electron.OpenDialogOptions = {
      title: 'Choose a photo folder',
      properties: ['openDirectory']
    }
    const result = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options)
    return result.canceled || !result.filePaths[0] ? null : result.filePaths[0]
  })

  // News
  ipcMain.handle(IPC.newsGet, () => getNews())

  // Window / kiosk controls
  ipcMain.handle(IPC.windowToggleFullscreen, (): boolean => {
    const win = focusedWindow()
    if (!win) return false
    const next = !win.isFullScreen()
    win.setFullScreen(next)
    return next
  })
  ipcMain.handle(IPC.windowIsFullscreen, (): boolean => focusedWindow()?.isFullScreen() ?? false)
}
