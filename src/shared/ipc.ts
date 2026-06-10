// Shared contract between the main process and the renderer.
// Keep this the single source of truth for IPC channel names and payload types.

import type { CalendarResult, CameraStatus, NewsResult, Settings, Todo, WeatherResult } from './types'

export const IPC = {
  appGetInfo: 'app:getInfo',
  openSettings: 'ui:openSettings', // main -> renderer (hotkey driven)

  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',
  settingsChanged: 'settings:changed', // main -> renderer broadcast

  todosList: 'todos:list',
  todosAdd: 'todos:add',
  todosUpdate: 'todos:update',
  todosRemove: 'todos:remove',
  todosReorder: 'todos:reorder',
  todosClearCompleted: 'todos:clearCompleted',

  cameraStart: 'camera:start',
  cameraStop: 'camera:stop',
  cameraStatus: 'camera:status',
  cameraStatusChanged: 'camera:statusChanged', // main -> renderer broadcast

  calendarGetEvents: 'calendar:getEvents',

  weatherGet: 'weather:get',

  photosList: 'photos:list',
  photosPickFolder: 'photos:pickFolder',

  newsGet: 'news:get',

  windowToggleFullscreen: 'window:toggleFullscreen',
  windowIsFullscreen: 'window:isFullscreen'
} as const

export interface AppInfo {
  name: string
  version: string
  platform: NodeJS.Platform
  isDev: boolean
}

export type TodoPatch = Partial<Pick<Todo, 'text' | 'done'>>

// The typed surface exposed to the renderer via contextBridge (window.api).
export interface KitchenApi {
  getAppInfo: () => Promise<AppInfo>
  /** main -> renderer: fired when the Settings hotkey (Ctrl+,) is pressed. */
  onOpenSettings: (handler: () => void) => () => void

  settings: {
    get: () => Promise<Settings>
    update: (patch: Partial<Settings>) => Promise<Settings>
    onChange: (handler: (settings: Settings) => void) => () => void
  }

  todos: {
    list: () => Promise<Todo[]>
    add: (text: string) => Promise<Todo[]>
    update: (id: string, patch: TodoPatch) => Promise<Todo[]>
    remove: (id: string) => Promise<Todo[]>
    reorder: (orderedIds: string[]) => Promise<Todo[]>
    clearCompleted: () => Promise<Todo[]>
  }

  camera: {
    /** Start (or restart) the RTSP -> HLS pipeline for the given URL. */
    start: (rtspUrl: string) => Promise<CameraStatus>
    stop: () => Promise<CameraStatus>
    getStatus: () => Promise<CameraStatus>
    onStatus: (handler: (status: CameraStatus) => void) => () => void
  }

  calendar: {
    /** Fetch + merge events from all enabled feeds for the configured window. */
    getEvents: () => Promise<CalendarResult>
  }

  weather: {
    /** Geocode the configured ZIP and fetch today + next-3-day forecast. Rejects on failure. */
    get: () => Promise<WeatherResult>
  }

  photos: {
    /** Absolute paths of image files in the configured folder (served via the kdphoto:// scheme). */
    list: () => Promise<string[]>
    /** Open a native folder picker; resolves to the chosen path, or null if cancelled. */
    pickFolder: () => Promise<string | null>
  }

  news: {
    /** Fetch + merge headlines from all configured RSS/Atom feeds, newest first. */
    get: () => Promise<NewsResult>
  }

  window: {
    /** Toggle kiosk full-screen; resolves to the new full-screen state. */
    toggleFullscreen: () => Promise<boolean>
    isFullscreen: () => Promise<boolean>
  }
}
