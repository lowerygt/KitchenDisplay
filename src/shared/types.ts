// Domain types shared between main and renderer.

export interface Todo {
  id: string
  text: string
  done: boolean
  createdAt: number
}

export type WidgetId = 'clock' | 'agenda' | 'todo' | 'camera' | 'weather' | 'photo' | 'news' | 'timer'

/** A widget's position and size on the dashboard grid (1-based, in grid cells). */
export interface GridPlacement {
  col: number
  row: number
  colSpan: number
  rowSpan: number
}

/** Fully customizable dashboard layout: grid size + per-widget placement. */
export interface LayoutSettings {
  columns: number
  rows: number
  placements: Record<WidgetId, GridPlacement>
}

export interface NewsFeedSource {
  id: string
  /** RSS or Atom feed URL. */
  url: string
  /** Optional display label; falls back to the feed's own title. */
  label?: string
}

export interface NewsSettings {
  feeds: NewsFeedSource[]
}

export interface NewsItem {
  /** Stable id (feed id + guid/link/title). */
  id: string
  title: string
  link?: string
  /** Display name of the source feed. */
  source: string
  /** ISO 8601 publish time, when available. */
  isoDate?: string
}

export interface NewsFeedError {
  url: string
  message: string
}

export interface NewsResult {
  items: NewsItem[]
  errors: NewsFeedError[]
  fetchedAt: string
}

export interface PhotoSettings {
  /** Absolute path to a folder of images to rotate through. Empty = unconfigured. */
  folder: string
  /** Seconds each photo is shown before advancing. */
  intervalSeconds: number
  /** Randomize order instead of alphabetical. */
  shuffle: boolean
}

export type WeatherUnits = 'imperial' | 'metric'

export interface WeatherSettings {
  /** US ZIP code used to geocode the forecast location. */
  zip: string
  units: WeatherUnits
}

export interface WeatherDay {
  /** YYYY-MM-DD (local to the forecast location). */
  dateISO: string
  /** WMO weather interpretation code. */
  weatherCode: number
  tempMax: number
  tempMin: number
  /** Max precipitation probability for the day, 0..100, or null if unavailable. */
  precipProb: number | null
}

export interface WeatherResult {
  /** Human-readable place, e.g. "Charlotte, NC". */
  place: string
  units: WeatherUnits
  current: {
    temp: number
    weatherCode: number
    humidity: number | null
    windSpeed: number | null
  }
  /** Today + the next 3 days (4 entries). */
  days: WeatherDay[]
  fetchedAt: string
}

export interface NightModeSettings {
  enabled: boolean
  /** "HH:mm" 24h local time. */
  start: string
  /** "HH:mm" 24h local time. */
  end: string
  /** 0..1 dim overlay opacity applied during night hours. */
  dimLevel: number
}

export interface CameraSettings {
  rtspUrl: string
  mode: 'hls' | 'webrtc'
}

export type CameraState = 'idle' | 'starting' | 'live' | 'offline' | 'error'

export interface CameraStatus {
  state: CameraState
  /** Loopback HLS playlist URL the renderer should play, when live. */
  url: string | null
  /** Human-readable detail for offline/error states. */
  message?: string
  /** Number of automatic restart attempts since last going live. */
  retries: number
}

export type CalendarFeedType = 'ics' | 'google'

export interface CalendarFeed {
  id: string
  type: CalendarFeedType
  label: string
  /** Hex color used to tint this feed's events in the unified agenda. */
  color: string
  enabled: boolean
  /** ICS feeds: the secret .ics URL. */
  url?: string
  /** Google feeds: the account email once connected (display only). */
  account?: string
}

export interface CalendarEvent {
  /** Stable per-occurrence id (feed + uid + start). */
  id: string
  feedId: string
  feedLabel: string
  color: string
  title: string
  /** ISO 8601. */
  start: string
  /** ISO 8601. */
  end: string
  allDay: boolean
  location?: string
}

export interface CalendarFeedError {
  feedId: string
  label: string
  message: string
}

export interface CalendarResult {
  events: CalendarEvent[]
  errors: CalendarFeedError[]
  fetchedAt: string
}

export interface Settings {
  /** Index (0-based) of the currently displayed slot in savedLayouts. */
  activeLayout: number
  /** The three user-saveable layout slots ("Layout 1/2/3"). */
  savedLayouts: LayoutSettings[]
  enabledWidgets: Record<WidgetId, boolean>
  /** Calendar auto-refresh cadence in minutes. */
  refreshMinutes: number
  /** How many days ahead the agenda shows (including today). */
  agendaDays: number
  calendars: CalendarFeed[]
  weather: WeatherSettings
  photos: PhotoSettings
  news: NewsSettings
  nightMode: NightModeSettings
  autoStart: boolean
  camera: CameraSettings
  timers: TimerSettings
}

export interface TimerSettings {
  /** Alarm loudness, 0..1. Zero silences the alarm (visual flash still shows). */
  volume: number
}

/** Dashboard grid resolution. Finer than the visible tiles for flexible sizing. */
export const GRID_COLUMNS = 12
export const GRID_ROWS = 8

/** Number of user-saveable layout slots ("Layout 1/2/3"). */
export const LAYOUT_SLOT_COUNT = 3
export const LAYOUT_SLOT_LABELS = ['Layout 1', 'Layout 2', 'Layout 3'] as const

/**
 * Seed contents for the three layout slots. The user can overwrite each slot
 * freely from the editor; these just give sensible, non-empty starting points.
 */
export const DEFAULT_LAYOUTS: LayoutSettings[] = [
  {
    columns: GRID_COLUMNS,
    rows: GRID_ROWS,
    placements: {
      clock: { col: 1, row: 1, colSpan: 6, rowSpan: 2 },
      weather: { col: 7, row: 1, colSpan: 6, rowSpan: 2 },
      camera: { col: 1, row: 3, colSpan: 6, rowSpan: 4 },
      agenda: { col: 7, row: 3, colSpan: 6, rowSpan: 2 },
      news: { col: 7, row: 5, colSpan: 6, rowSpan: 2 },
      todo: { col: 1, row: 7, colSpan: 6, rowSpan: 2 },
      photo: { col: 7, row: 7, colSpan: 3, rowSpan: 2 },
      timer: { col: 10, row: 7, colSpan: 3, rowSpan: 2 }
    }
  },
  {
    columns: GRID_COLUMNS,
    rows: GRID_ROWS,
    placements: {
      agenda: { col: 1, row: 1, colSpan: 6, rowSpan: 8 },
      clock: { col: 7, row: 1, colSpan: 3, rowSpan: 2 },
      weather: { col: 10, row: 1, colSpan: 3, rowSpan: 2 },
      news: { col: 7, row: 3, colSpan: 6, rowSpan: 2 },
      photo: { col: 7, row: 5, colSpan: 3, rowSpan: 2 },
      timer: { col: 10, row: 5, colSpan: 3, rowSpan: 2 },
      todo: { col: 7, row: 7, colSpan: 3, rowSpan: 2 },
      camera: { col: 10, row: 7, colSpan: 3, rowSpan: 2 }
    }
  },
  {
    columns: GRID_COLUMNS,
    rows: GRID_ROWS,
    placements: {
      camera: { col: 1, row: 1, colSpan: 9, rowSpan: 6 },
      clock: { col: 10, row: 1, colSpan: 3, rowSpan: 2 },
      weather: { col: 10, row: 3, colSpan: 3, rowSpan: 2 },
      news: { col: 10, row: 5, colSpan: 3, rowSpan: 2 },
      agenda: { col: 1, row: 7, colSpan: 3, rowSpan: 2 },
      timer: { col: 4, row: 7, colSpan: 3, rowSpan: 2 },
      photo: { col: 7, row: 7, colSpan: 3, rowSpan: 2 },
      todo: { col: 10, row: 7, colSpan: 3, rowSpan: 2 }
    }
  }
]

/** Palette for new calendar feeds (cycled in order). */
export const CALENDAR_COLORS = [
  '#34a853', // green (google)
  '#0a84ff', // blue (ms/outlook)
  '#ff375f', // red
  '#ff9f0a', // orange
  '#bf5af2', // purple
  '#5ac8fa' // teal
]

export const DEFAULT_SETTINGS: Settings = {
  activeLayout: 0,
  savedLayouts: DEFAULT_LAYOUTS,
  enabledWidgets: {
    clock: true,
    agenda: true,
    todo: true,
    camera: true,
    weather: true,
    photo: true,
    news: true,
    timer: true
  },
  refreshMinutes: 5,
  agendaDays: 7,
  calendars: [],
  weather: { zip: '28210', units: 'imperial' },
  photos: { folder: '', intervalSeconds: 15, shuffle: true },
  news: {
    feeds: [{ id: 'default-bbc', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', label: 'BBC World' }]
  },
  nightMode: { enabled: false, start: '22:00', end: '06:30', dimLevel: 0.6 },
  autoStart: false,
  camera: { rtspUrl: '', mode: 'hls' },
  timers: { volume: 0.8 }
}
