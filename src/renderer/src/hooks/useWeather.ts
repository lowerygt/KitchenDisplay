import { useCallback, useEffect, useState } from 'react'
import type { WeatherResult } from '@shared/types'
import { useSettings } from './useSettings'

/**
 * Pulls the forecast from the main process, re-fetching when the ZIP/units
 * change and on a slow interval (weather doesn't move fast, and Open-Meteo is
 * a shared free service — be a good citizen).
 */
export function useWeather() {
  const { settings } = useSettings()
  const [result, setResult] = useState<WeatherResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const zip = settings?.weather.zip
  const units = settings?.weather.units
  const refreshMs = 30 * 60 * 1000 // 30 minutes

  const refresh = useCallback(async () => {
    try {
      const r = await window.api.weather.get()
      setResult(r)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Weather unavailable')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!settings) return
    void refresh()
    const id = window.setInterval(() => void refresh(), refreshMs)
    return () => window.clearInterval(id)
    // zip + units are the settings that change what we fetch.
  }, [zip, units, settings, refresh, refreshMs])

  return { result, error, loading, refresh }
}
