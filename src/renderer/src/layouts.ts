import type { WidgetId } from '@shared/types'

// Grid placement + the three saveable layout slots live in @shared/types
// (DEFAULT_LAYOUTS, LAYOUT_SLOT_LABELS, GRID_COLUMNS, GRID_ROWS) so the
// main-process defaults and the renderer agree. Layouts are rendered from
// settings.savedLayouts[activeLayout] via inline CSS grid styles, which
// sidesteps Tailwind's purge of dynamic class names entirely.

export const WIDGET_LABELS: Record<WidgetId, string> = {
  clock: 'Clock',
  weather: 'Weather',
  agenda: 'Agenda',
  todo: 'To-do',
  camera: 'Camera',
  photo: 'Photos',
  news: 'Headlines',
  timer: 'Timer'
}
