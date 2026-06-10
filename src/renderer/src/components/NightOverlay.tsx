import type { NightModeSettings } from '@shared/types'
import { useNow } from '../hooks/useNow'

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/** True when `now` falls in [start, end), handling windows that wrap midnight. */
function isNight(now: Date, start: string, end: string): boolean {
  const cur = now.getHours() * 60 + now.getMinutes()
  const s = toMinutes(start)
  const e = toMinutes(end)
  if (s === e) return false
  return s < e ? cur >= s && cur < e : cur >= s || cur < e
}

/**
 * A non-interactive dim layer drawn over the dashboard during the configured
 * night hours. Sits below the EditBar (z-50) so the gear/full-screen controls
 * stay reachable.
 */
export function NightOverlay({ nightMode }: { nightMode: NightModeSettings }) {
  const now = useNow(30_000) // re-check twice a minute
  if (!nightMode.enabled) return null
  if (!isNight(now, nightMode.start, nightMode.end)) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 bg-black transition-opacity duration-1000"
      style={{ opacity: Math.min(0.95, Math.max(0, nightMode.dimLevel)) }}
    />
  )
}
