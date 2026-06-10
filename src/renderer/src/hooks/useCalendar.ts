import { useCallback, useEffect, useState } from 'react'
import type { CalendarResult } from '@shared/types'
import { useSettings } from './useSettings'

/**
 * Pulls merged calendar events from the main process, re-fetching when the feed
 * set changes and on the configured refresh interval.
 */
export function useCalendar() {
  const { settings } = useSettings()
  const [result, setResult] = useState<CalendarResult | null>(null)
  const [loading, setLoading] = useState(true)

  const feedsKey = settings
    ? JSON.stringify(settings.calendars.map((f) => [f.id, f.enabled, f.url, f.color, f.label, f.type]))
    : ''
  const refreshMs = Math.max(60_000, (settings?.refreshMinutes ?? 5) * 60_000)

  const refresh = useCallback(async () => {
    const r = await window.api.calendar.getEvents()
    setResult(r)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!settings) return
    void refresh()
    const id = window.setInterval(() => void refresh(), refreshMs)
    return () => window.clearInterval(id)
    // feedsKey + refreshMs capture the settings that affect fetching.
  }, [feedsKey, refreshMs, settings, refresh])

  return { result, loading, refresh }
}
