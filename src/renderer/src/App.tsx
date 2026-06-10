import { useEffect, useState } from 'react'
import type { AppInfo } from '@shared/ipc'
import type { WidgetId } from '@shared/types'
import { ErrorBoundary } from './components/ErrorBoundary'
import { EditBar } from './components/EditBar'
import { LayoutEditor } from './components/LayoutEditor'
import { NightOverlay } from './components/NightOverlay'
import { WidgetCard } from './components/WidgetCard'
import { useSettings } from './hooks/useSettings'
import { WIDGET_LABELS } from './layouts'
import { WIDGETS } from './widgets/registry'

export default function App() {
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [openSignal, setOpenSignal] = useState(0)
  const [editingLayout, setEditingLayout] = useState(false)
  const { settings, update } = useSettings()

  useEffect(() => {
    void window.api.getAppInfo().then(setInfo)
    // Ctrl+, (from main) opens the settings/edit panel.
    const off = window.api.onOpenSettings(() => setOpenSignal((n) => n + 1))
    return off
  }, [])

  if (!settings) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-600">Loading…</div>
    )
  }

  const layout = settings.savedLayouts[settings.activeLayout] ?? settings.savedLayouts[0]
  const { columns, rows, placements } = layout
  const visible = (Object.keys(placements) as WidgetId[]).filter(
    (id) => settings.enabledWidgets[id]
  )

  return (
    <>
      <NightOverlay nightMode={settings.nightMode} />
      <EditBar
        settings={settings}
        update={update}
        openSignal={openSignal}
        onCustomizeLayout={() => setEditingLayout(true)}
      />

      <div
        className="grid h-full w-full gap-4 p-4"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
        }}
      >
        {visible.map((id) => {
          const widget = WIDGETS[id]
          const p = placements[id]
          return (
            <div
              key={id}
              style={{
                gridColumn: `${p.col} / span ${p.colSpan}`,
                gridRow: `${p.row} / span ${p.rowSpan}`
              }}
            >
              <ErrorBoundary label={WIDGET_LABELS[id]}>
                <WidgetCard title={widget.title} padded={widget.padded}>
                  {widget.render()}
                </WidgetCard>
              </ErrorBoundary>
            </div>
          )
        })}
      </div>

      {editingLayout && (
        <LayoutEditor settings={settings} update={update} onClose={() => setEditingLayout(false)} />
      )}

      {info && (
        <div className="pointer-events-none fixed bottom-1 right-2 text-[10px] text-neutral-700">
          {info.name} v{info.version} · Ctrl+, settings · Esc quit
        </div>
      )}
    </>
  )
}
