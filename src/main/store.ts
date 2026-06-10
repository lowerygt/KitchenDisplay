import { randomUUID } from 'node:crypto'
import Store from 'electron-store'
import {
  DEFAULT_SETTINGS,
  DEFAULT_LAYOUTS,
  LAYOUT_SLOT_COUNT,
  type LayoutSettings,
  type Settings,
  type Todo
} from '../shared/types'
import type { TodoPatch } from '../shared/ipc'

interface StoreSchema {
  settings: Settings
  todos: Todo[]
}

/**
 * electron-store chosen over better-sqlite3: pure-JS JSON store needs no native
 * rebuild against Electron's ABI (which is fragile on Node 24), and the data set
 * (a handful of to-dos + settings) is tiny. Tokens are stored separately and
 * encrypted with safeStorage in a later milestone, not here.
 */
const store = new Store<StoreSchema>({
  name: 'kitchen-display',
  defaults: {
    settings: DEFAULT_SETTINGS,
    todos: []
  }
})

// ---- Settings ----

/** Clamp a possibly-missing slot index into the valid [0, count) range. */
function clampSlot(index: number | undefined): number {
  if (typeof index !== 'number' || Number.isNaN(index)) return 0
  return Math.max(0, Math.min(LAYOUT_SLOT_COUNT - 1, Math.floor(index)))
}

/** Merge stored layout slots over the seed defaults, slot by slot. */
function mergeLayouts(stored: LayoutSettings[] | undefined): LayoutSettings[] {
  return DEFAULT_LAYOUTS.map((fallback, i) => {
    const s = stored?.[i]
    return {
      columns: s?.columns ?? fallback.columns,
      rows: s?.rows ?? fallback.rows,
      placements: { ...fallback.placements, ...s?.placements }
    }
  })
}

export function getSettings(): Settings {
  // Merge persisted values over defaults so new fields added in later versions
  // still get sane values without a migration step.
  const stored = store.get('settings')
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    // Rebuild all three layout slots so any widget missing from a stored slot
    // (e.g. a tile added in a newer version) still gets a default placement.
    savedLayouts: mergeLayouts(stored?.savedLayouts),
    activeLayout: clampSlot(stored?.activeLayout),
    enabledWidgets: { ...DEFAULT_SETTINGS.enabledWidgets, ...stored?.enabledWidgets },
    weather: { ...DEFAULT_SETTINGS.weather, ...stored?.weather },
    photos: { ...DEFAULT_SETTINGS.photos, ...stored?.photos },
    news: { ...DEFAULT_SETTINGS.news, ...stored?.news },
    nightMode: { ...DEFAULT_SETTINGS.nightMode, ...stored?.nightMode },
    camera: { ...DEFAULT_SETTINGS.camera, ...stored?.camera },
    timers: { ...DEFAULT_SETTINGS.timers, ...stored?.timers }
  }
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const next: Settings = { ...getSettings(), ...patch }
  store.set('settings', next)
  return next
}

// ---- Todos ----

export function listTodos(): Todo[] {
  return store.get('todos')
}

function saveTodos(todos: Todo[]): Todo[] {
  store.set('todos', todos)
  return todos
}

export function addTodo(text: string): Todo[] {
  const trimmed = text.trim()
  if (!trimmed) return listTodos()
  const todo: Todo = { id: randomUUID(), text: trimmed, done: false, createdAt: Date.now() }
  return saveTodos([...listTodos(), todo])
}

export function updateTodo(id: string, patch: TodoPatch): Todo[] {
  return saveTodos(
    listTodos().map((t) =>
      t.id === id ? { ...t, ...patch, text: patch.text?.trim() ?? t.text } : t
    )
  )
}

export function removeTodo(id: string): Todo[] {
  return saveTodos(listTodos().filter((t) => t.id !== id))
}

export function reorderTodos(orderedIds: string[]): Todo[] {
  const byId = new Map(listTodos().map((t) => [t.id, t]))
  const reordered = orderedIds.map((id) => byId.get(id)).filter((t): t is Todo => Boolean(t))
  // Keep any todos not present in the supplied order (defensive).
  const missing = listTodos().filter((t) => !orderedIds.includes(t.id))
  return saveTodos([...reordered, ...missing])
}

export function clearCompletedTodos(): Todo[] {
  return saveTodos(listTodos().filter((t) => !t.done))
}
