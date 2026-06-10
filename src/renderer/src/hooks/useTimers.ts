import { useCallback, useEffect, useState } from 'react'
import { startAlarm, stopAlarm } from '../lib/alarm'

export type TimerState = 'running' | 'paused' | 'ringing'

export interface KitchenTimer {
  id: string
  label: string
  /** Original duration, for restarts/labels. */
  totalMs: number
  /** Absolute epoch ms when the timer fires; authoritative while running. */
  endAt: number
  /** Remaining ms; authoritative only while paused. */
  remainingMs: number
  state: TimerState
}

const STORAGE_KEY = 'kitchen-timers'
/** An expired timer found on startup older than this is dropped instead of ringing. */
const STALE_RING_MS = 60_000
const TICK_MS = 250

function loadTimers(): KitchenTimer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as KitchenTimer[]
    if (!Array.isArray(parsed)) return []
    const now = Date.now()
    const out: KitchenTimer[] = []
    for (const t of parsed) {
      if (typeof t?.id !== 'string' || typeof t?.endAt !== 'number') continue
      if (t.state === 'paused') {
        out.push(t)
      } else if (t.endAt > now) {
        out.push({ ...t, state: 'running' })
      } else if (now - t.endAt < STALE_RING_MS) {
        // Fired while the app was closed/crashed just now — still worth ringing.
        out.push({ ...t, remainingMs: 0, state: 'ringing' })
      }
      // else: stale alarm from hours ago; drop silently.
    }
    return out
  } catch {
    return []
  }
}

function saveTimers(timers: KitchenTimer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers))
  } catch {
    // Persistence is best-effort; timers still work for this session.
  }
}

/** Display remaining ms for a timer at the given instant. */
export function remainingFor(t: KitchenTimer, now: number): number {
  return t.state === 'paused' ? t.remainingMs : Math.max(0, t.endAt - now)
}

export function useTimers(alarmVolume = 0.8) {
  const [timers, setTimers] = useState<KitchenTimer[]>(loadTimers)
  const [now, setNow] = useState(() => Date.now())

  // Single ticker: refresh displayed time and flip finished timers to ringing.
  useEffect(() => {
    const id = window.setInterval(() => {
      const n = Date.now()
      setNow(n)
      setTimers((prev) =>
        prev.some((t) => t.state === 'running' && t.endAt <= n)
          ? prev.map((t) =>
              t.state === 'running' && t.endAt <= n
                ? { ...t, remainingMs: 0, state: 'ringing' as const }
                : t
            )
          : prev
      )
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    saveTimers(timers)
  }, [timers])

  // One shared alarm for however many timers are ringing; stops when the last
  // is dismissed and on unmount (e.g. widget disabled mid-ring).
  const anyRinging = timers.some((t) => t.state === 'ringing')
  useEffect(() => {
    if (anyRinging) startAlarm(alarmVolume)
    else stopAlarm()
  }, [anyRinging, alarmVolume])
  useEffect(() => () => stopAlarm(), [])

  const addTimer = useCallback((minutes: number, label?: string) => {
    const totalMs = Math.round(minutes * 60_000)
    const timer: KitchenTimer = {
      id: crypto.randomUUID(),
      label: label ?? `${minutes} min`,
      totalMs,
      endAt: Date.now() + totalMs,
      remainingMs: totalMs,
      state: 'running'
    }
    setTimers((prev) => [...prev, timer])
  }, [])

  /** Add time: extends running/paused timers; snoozes a ringing one back to running. */
  const extend = useCallback((id: string, ms: number) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        if (t.state === 'paused') return { ...t, remainingMs: t.remainingMs + ms }
        if (t.state === 'ringing')
          return { ...t, state: 'running', endAt: Date.now() + ms, remainingMs: ms }
        return { ...t, endAt: t.endAt + ms }
      })
    )
  }, [])

  const pause = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id && t.state === 'running'
          ? { ...t, state: 'paused', remainingMs: Math.max(0, t.endAt - Date.now()) }
          : t
      )
    )
  }, [])

  const resume = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id && t.state === 'paused'
          ? { ...t, state: 'running', endAt: Date.now() + t.remainingMs }
          : t
      )
    )
  }, [])

  /** Remove a timer (cancel while counting, dismiss while ringing — same thing). */
  const remove = useCallback((id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setTimers((prev) => prev.filter((t) => t.state !== 'ringing'))
  }, [])

  const setLabel = useCallback((id: string, label: string) => {
    setTimers((prev) => prev.map((t) => (t.id === id ? { ...t, label } : t)))
  }, [])

  return { timers, now, addTimer, extend, pause, resume, remove, dismissAll, setLabel }
}
