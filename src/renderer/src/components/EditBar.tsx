import { useEffect, useState } from 'react'
import type { Settings } from '@shared/types'
import { LayoutSection } from './editbar/LayoutSection'
import { CalendarsSection } from './editbar/CalendarsSection'
import { WeatherSection } from './editbar/WeatherSection'
import { PhotosSection } from './editbar/PhotosSection'
import { NewsSection } from './editbar/NewsSection'
import { CameraSection } from './editbar/CameraSection'
import { NightModeSection } from './editbar/NightModeSection'
import { TimerSection } from './editbar/TimerSection'
import { StartupSection } from './editbar/StartupSection'

/**
 * Floating gear/fullscreen buttons plus the settings panel. Each settings
 * group lives in its own component under ./editbar; this shell only owns
 * open/fullscreen state and stacks the sections.
 */
export function EditBar({
  settings,
  update,
  openSignal,
  onCustomizeLayout
}: {
  settings: Settings
  update: (patch: Partial<Settings>) => Promise<unknown>
  /** Incremented by the host to request opening the panel (e.g. Ctrl+, hotkey). */
  openSignal?: number
  /** Opens the full-screen drag/resize layout editor. */
  onCustomizeLayout?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  // Reflect the actual window state on mount.
  useEffect(() => {
    void window.api.window.isFullscreen().then(setFullscreen)
  }, [])

  // Open the panel when the host signals (hotkey).
  useEffect(() => {
    if (openSignal !== undefined && openSignal > 0) setOpen(true)
  }, [openSignal])

  async function toggleFullscreen() {
    const next = await window.api.window.toggleFullscreen()
    setFullscreen(next)
  }

  return (
    <div className="fixed right-3 top-3 z-50">
      <div className="flex justify-end gap-2">
        <button
          onClick={() => void toggleFullscreen()}
          aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'}
          title={fullscreen ? 'Exit full screen' : 'Full screen'}
          className="rounded-full bg-neutral-800/80 p-2 text-neutral-300 ring-1 ring-white/10 backdrop-blur hover:bg-neutral-700"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            {fullscreen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 4H5a1 1 0 00-1 1v4M15 4h4a1 1 0 011 1v4M9 20H5a1 1 0 01-1-1v-4M15 20h4a1 1 0 001-1v-4"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 9V5a1 1 0 011-1h4M20 9V5a1 1 0 00-1-1h-4M4 15v4a1 1 0 001 1h4M20 15v4a1 1 0 01-1 1h-4"
              />
            )}
          </svg>
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Edit layout"
          className="rounded-full bg-neutral-800/80 p-2 text-neutral-300 ring-1 ring-white/10 backdrop-blur hover:bg-neutral-700"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.4 13a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7.6 1.6 1.6 0 00-1 1.5v.2a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1.1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H1a2 2 0 110-4h.1a1.6 1.6 0 001.5-1.1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H11a1.6 1.6 0 001-1.5V1a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V11a1.6 1.6 0 001.5 1H23a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"
            />
          </svg>
        </button>
      </div>

      {open && (
        <div className="mt-2 max-h-[85vh] w-64 overflow-y-auto rounded-2xl bg-neutral-900/95 p-4 text-sm shadow-xl ring-1 ring-white/10 backdrop-blur">
          <LayoutSection
            settings={settings}
            update={update}
            onCustomizeLayout={() => {
              setOpen(false)
              onCustomizeLayout?.()
            }}
          />
          <CalendarsSection settings={settings} update={update} />
          <WeatherSection settings={settings} update={update} />
          <PhotosSection settings={settings} update={update} />
          <NewsSection settings={settings} update={update} />
          <CameraSection settings={settings} update={update} />
          <NightModeSection settings={settings} update={update} />
          <TimerSection settings={settings} update={update} />
          <StartupSection settings={settings} update={update} />
        </div>
      )}
    </div>
  )
}
