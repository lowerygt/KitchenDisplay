import { useEffect, useMemo, useRef, useState } from 'react'
import { useSettings } from './useSettings'

/** Renderer-side mirror of the main process's photoUrl() builder. */
export function photoUrl(absPath: string): string {
  return `kdphoto://local/${encodeURIComponent(absPath)}`
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Lists images from the configured folder and advances through them on the
 * configured interval. Re-lists periodically so newly-dropped photos appear
 * without a restart.
 */
export function usePhotos() {
  const { settings } = useSettings()
  const folder = settings?.photos.folder ?? ''
  const intervalSeconds = settings?.photos.intervalSeconds ?? 15
  const shuffle = settings?.photos.shuffle ?? true

  const [files, setFiles] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  // Load (and periodically re-load) the file list.
  useEffect(() => {
    if (!folder) {
      setFiles([])
      setLoading(false)
      return
    }
    let mounted = true
    const load = async () => {
      const list = await window.api.photos.list()
      if (!mounted) return
      setFiles(shuffle ? shuffled(list) : list)
      setLoading(false)
    }
    void load()
    const id = window.setInterval(() => void load(), 10 * 60 * 1000)
    return () => {
      mounted = false
      window.clearInterval(id)
    }
  }, [folder, shuffle])

  // Reset position when the set changes.
  const count = files.length
  const indexRef = useRef(0)
  indexRef.current = index
  useEffect(() => setIndex(0), [count])

  // Advance the slideshow.
  useEffect(() => {
    if (count <= 1) return
    const ms = Math.max(3, intervalSeconds) * 1000
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), ms)
    return () => window.clearInterval(id)
  }, [count, intervalSeconds])

  const current = useMemo(() => (count ? files[index % count] : null), [files, index, count])

  return { folder, current, count, loading }
}
