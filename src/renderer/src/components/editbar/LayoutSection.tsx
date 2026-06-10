import { LAYOUT_SLOT_COUNT, LAYOUT_SLOT_LABELS, type WidgetId } from '@shared/types'
import { WIDGET_LABELS } from '../../layouts'
import { SectionTitle, type SectionProps } from './common'

const SLOTS = Array.from({ length: LAYOUT_SLOT_COUNT }, (_, i) => i)
const WIDGETS = Object.keys(WIDGET_LABELS) as WidgetId[]

export function LayoutSection({
  settings,
  update,
  onCustomizeLayout
}: SectionProps & { onCustomizeLayout: () => void }) {
  function selectLayout(slot: number) {
    if (slot !== settings.activeLayout) void update({ activeLayout: slot })
  }

  function toggleWidget(id: WidgetId) {
    void update({
      enabledWidgets: { ...settings.enabledWidgets, [id]: !settings.enabledWidgets[id] }
    })
  }

  return (
    <>
      <SectionTitle first>Layout</SectionTitle>
      <div className="mb-2 grid grid-cols-3 gap-2">
        {SLOTS.map((slot) => (
          <button
            key={slot}
            onClick={() => selectLayout(slot)}
            className={`rounded-lg px-2 py-2 text-xs transition ${
              settings.activeLayout === slot
                ? 'bg-white text-neutral-900'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {LAYOUT_SLOT_LABELS[slot]}
          </button>
        ))}
      </div>
      <button
        onClick={onCustomizeLayout}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16M4 12h10M4 19h7M17 16l3 3-3 3M20 19h-9" />
        </svg>
        Customize layout…
      </button>
      <p className="-mt-2 mb-4 text-[10px] text-neutral-600">
        Switch between three layouts. Customize drags &amp; resizes tiles, then saves to any slot.
      </p>

      <SectionTitle first>Widgets</SectionTitle>
      <div className="space-y-1">
        {WIDGETS.map((id) => (
          <label
            key={id}
            className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-neutral-800"
          >
            <span className="text-neutral-200">{WIDGET_LABELS[id]}</span>
            <input
              type="checkbox"
              checked={settings.enabledWidgets[id]}
              onChange={() => toggleWidget(id)}
              className="h-4 w-4 accent-white"
            />
          </label>
        ))}
      </div>
    </>
  )
}
