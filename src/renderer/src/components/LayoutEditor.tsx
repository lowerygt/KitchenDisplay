import { useEffect, useRef, useState } from 'react'
import {
  LAYOUT_SLOT_COUNT,
  LAYOUT_SLOT_LABELS,
  type GridPlacement,
  type LayoutSettings,
  type Settings,
  type WidgetId
} from '@shared/types'
import { WIDGET_LABELS } from '../layouts'

type DragMode = 'move' | 'resize'

interface DragState {
  id: WidgetId
  mode: DragMode
  startX: number
  startY: number
  orig: GridPlacement
}

const SLOTS = Array.from({ length: LAYOUT_SLOT_COUNT }, (_, i) => i)

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

/**
 * Full-screen drag-and-resize layout editor. Edits one of the three saveable
 * layout slots by direct manipulation; the draft is only persisted when the
 * user saves it into a slot.
 */
export function LayoutEditor({
  settings,
  update,
  onClose
}: {
  settings: Settings
  update: (patch: Partial<Settings>) => Promise<unknown>
  onClose: () => void
}) {
  // Which slot we're currently editing; starts on the active one.
  const [editingSlot, setEditingSlot] = useState(settings.activeLayout)
  const source: LayoutSettings =
    settings.savedLayouts[editingSlot] ?? settings.savedLayouts[0]
  const columns = source.columns
  const rows = source.rows

  const [placements, setPlacements] = useState<Record<WidgetId, GridPlacement>>(
    () => ({ ...source.placements })
  )
  const [drag, setDrag] = useState<DragState | null>(null)
  const [saving, setSaving] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const widgets = (Object.keys(placements) as WidgetId[]).filter(
    (id) => settings.enabledWidgets[id]
  )

  // Drag/resize: translate pointer movement into whole-cell deltas, snapped and
  // clamped to the grid. Subscribed only while a drag is active.
  useEffect(() => {
    if (!drag) return

    function onMove(e: PointerEvent) {
      const grid = gridRef.current
      if (!grid || !drag) return
      const rect = grid.getBoundingClientRect()
      const cellW = rect.width / columns
      const cellH = rect.height / rows
      const dCol = Math.round((e.clientX - drag.startX) / cellW)
      const dRow = Math.round((e.clientY - drag.startY) / cellH)
      const { orig } = drag

      setPlacements((prev) => {
        const next =
          drag.mode === 'move'
            ? {
                ...orig,
                col: clamp(orig.col + dCol, 1, columns - orig.colSpan + 1),
                row: clamp(orig.row + dRow, 1, rows - orig.rowSpan + 1)
              }
            : {
                ...orig,
                colSpan: clamp(orig.colSpan + dCol, 1, columns - orig.col + 1),
                rowSpan: clamp(orig.rowSpan + dRow, 1, rows - orig.row + 1)
              }
        return { ...prev, [drag.id]: next }
      })
    }

    function onUp() {
      setDrag(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [drag, columns, rows])

  // Esc cancels.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  function beginDrag(e: React.PointerEvent, id: WidgetId, mode: DragMode) {
    e.preventDefault()
    e.stopPropagation()
    setDrag({ id, mode, startX: e.clientX, startY: e.clientY, orig: placements[id] })
  }

  /** Load a different slot's contents into the editing canvas. */
  function loadSlot(slot: number) {
    const src = settings.savedLayouts[slot] ?? settings.savedLayouts[0]
    setEditingSlot(slot)
    setPlacements({ ...src.placements })
  }

  /** Persist the current canvas into a slot, make it active, and close. */
  async function saveTo(slot: number) {
    setSaving(true)
    const next = settings.savedLayouts.map((l, i) =>
      i === slot ? { columns, rows, placements } : l
    )
    await update({ savedLayouts: next, activeLayout: slot })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-neutral-950/95 backdrop-blur">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="mr-2">
          <div className="text-sm font-semibold text-neutral-100">Customize layout</div>
          <div className="text-[11px] text-neutral-500">
            Drag a tile to move it · drag the corner to resize
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="mr-1 text-[11px] uppercase tracking-widest text-neutral-500">Editing</span>
          {SLOTS.map((slot) => (
            <button
              key={slot}
              onClick={() => loadSlot(slot)}
              className={`rounded-lg px-2.5 py-1.5 text-xs transition ${
                editingSlot === slot
                  ? 'bg-white text-neutral-900'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {LAYOUT_SLOT_LABELS[slot]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-800 px-4 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700"
          >
            Cancel
          </button>
          <div className="flex items-center gap-1 rounded-lg bg-neutral-900 p-1 ring-1 ring-white/10">
            <span className="px-2 text-[11px] uppercase tracking-widest text-neutral-500">Save to</span>
            {SLOTS.map((slot) => (
              <button
                key={slot}
                onClick={() => void saveTo(slot)}
                disabled={saving}
                className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60"
              >
                {LAYOUT_SLOT_LABELS[slot]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editable grid */}
      <div className="min-h-0 flex-1 p-4">
        <div
          ref={gridRef}
          className="grid h-full w-full gap-2 rounded-xl"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: `${100 / columns}% ${100 / rows}%`
          }}
        >
          {widgets.map((id) => {
            const p = placements[id]
            const active = drag?.id === id
            return (
              <div
                key={id}
                onPointerDown={(e) => beginDrag(e, id, 'move')}
                style={{
                  gridColumn: `${p.col} / span ${p.colSpan}`,
                  gridRow: `${p.row} / span ${p.rowSpan}`
                }}
                className={`group relative flex cursor-grab select-none items-center justify-center rounded-xl ring-2 transition ${
                  active
                    ? 'cursor-grabbing bg-sky-500/25 ring-sky-400'
                    : 'bg-neutral-800/80 ring-white/15 hover:ring-sky-400/70'
                }`}
              >
                <div className="pointer-events-none flex flex-col items-center text-center">
                  <span className="text-sm font-semibold text-neutral-100">
                    {WIDGET_LABELS[id]}
                  </span>
                  <span className="mt-0.5 text-[11px] tabular-nums text-neutral-400">
                    {p.colSpan} × {p.rowSpan}
                  </span>
                </div>

                {/* Resize handle (bottom-right corner) */}
                <div
                  onPointerDown={(e) => beginDrag(e, id, 'resize')}
                  className="absolute bottom-0 right-0 flex h-6 w-6 cursor-nwse-resize items-end justify-end rounded-br-xl rounded-tl-md bg-white/10 p-1 opacity-70 hover:bg-sky-400/40 group-hover:opacity-100"
                  title="Drag to resize"
                >
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-neutral-200" fill="currentColor">
                    <path d="M14 6a1 1 0 011 1v6a1 1 0 01-1 1H8a1 1 0 110-2h3.586L3 4.414V8a1 1 0 11-2 0V2a1 1 0 011-1h6a1 1 0 110 2H5.414L14 11.586V8a1 1 0 011-1z" opacity="0.8" />
                  </svg>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-4 pb-3 text-center text-[11px] text-neutral-600">
        Only enabled tiles are shown. Toggle tiles on/off in the gear menu. Esc to cancel.
      </div>
    </div>
  )
}
