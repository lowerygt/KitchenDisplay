import { useCallback, useEffect, useState } from 'react'
import type { Settings } from '@shared/types'

/**
 * Loads settings once, keeps them in sync with main-process broadcasts (so a
 * change made from the Settings screen reflects everywhere), and exposes a
 * patch helper.
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    let mounted = true
    void window.api.settings.get().then((s) => {
      if (mounted) setSettings(s)
    })
    const off = window.api.settings.onChange((s) => setSettings(s))
    return () => {
      mounted = false
      off()
    }
  }, [])

  const update = useCallback(async (patch: Partial<Settings>) => {
    const next = await window.api.settings.update(patch)
    setSettings(next)
    return next
  }, [])

  return { settings, update }
}
