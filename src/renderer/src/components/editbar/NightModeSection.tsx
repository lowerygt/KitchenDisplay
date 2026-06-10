import type { Settings } from '@shared/types'
import { SectionTitle, type SectionProps } from './common'

export function NightModeSection({ settings, update }: SectionProps) {
  function setNightMode(patch: Partial<Settings['nightMode']>) {
    void update({ nightMode: { ...settings.nightMode, ...patch } })
  }

  return (
    <>
      <SectionTitle>Night mode</SectionTitle>
      <label className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-neutral-800">
        <span className="text-neutral-200">Dim on schedule</span>
        <input
          type="checkbox"
          checked={settings.nightMode.enabled}
          onChange={(e) => setNightMode({ enabled: e.target.checked })}
          className="h-4 w-4 accent-white"
        />
      </label>
      {settings.nightMode.enabled && (
        <div className="mt-1 space-y-2 px-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-400">From</span>
            <input
              type="time"
              value={settings.nightMode.start}
              onChange={(e) => setNightMode({ start: e.target.value })}
              className="rounded-lg bg-neutral-800 px-2 py-1 text-xs text-neutral-100 outline-none ring-1 ring-white/5 focus:ring-white/20"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-400">To</span>
            <input
              type="time"
              value={settings.nightMode.end}
              onChange={(e) => setNightMode({ end: e.target.value })}
              className="rounded-lg bg-neutral-800 px-2 py-1 text-xs text-neutral-100 outline-none ring-1 ring-white/5 focus:ring-white/20"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-neutral-400">
              <span>Dim level</span>
              <span className="tabular-nums">{Math.round(settings.nightMode.dimLevel * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={0.9}
              step={0.05}
              value={settings.nightMode.dimLevel}
              onChange={(e) => setNightMode({ dimLevel: Number(e.target.value) })}
              className="w-full accent-white"
            />
          </div>
        </div>
      )}
    </>
  )
}
