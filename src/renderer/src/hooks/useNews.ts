import { useCallback, useEffect, useState } from 'react'
import type { NewsResult } from '@shared/types'
import { useSettings } from './useSettings'

/**
 * Pulls merged RSS/Atom headlines from the main process, re-fetching when the
 * feed set changes and on a slow interval.
 */
export function useNews() {
  const { settings } = useSettings()
  const [result, setResult] = useState<NewsResult | null>(null)
  const [loading, setLoading] = useState(true)

  const feedsKey = settings
    ? JSON.stringify(settings.news.feeds.map((f) => [f.id, f.url, f.label]))
    : ''
  const refreshMs = 15 * 60 * 1000 // 15 minutes

  const refresh = useCallback(async () => {
    try {
      const r = await window.api.news.get()
      setResult(r)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!settings) return
    void refresh()
    const id = window.setInterval(() => void refresh(), refreshMs)
    return () => window.clearInterval(id)
  }, [feedsKey, refreshMs, settings, refresh])

  return { result, loading, refresh }
}
