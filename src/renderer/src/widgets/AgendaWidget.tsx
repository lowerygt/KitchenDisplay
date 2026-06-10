import { useMemo } from 'react'
import type { CalendarEvent } from '@shared/types'
import { useCalendar } from '../hooks/useCalendar'

const TIME_FMT = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const DAY_FMT = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function dayLabel(dayMs: number, todayMs: number): string {
  const diff = Math.round((dayMs - todayMs) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return DAY_FMT.format(new Date(dayMs))
}

interface DayGroup {
  dayMs: number
  events: CalendarEvent[]
}

function groupByDay(events: CalendarEvent[]): DayGroup[] {
  const map = new Map<number, CalendarEvent[]>()
  for (const ev of events) {
    const key = startOfDay(new Date(ev.start))
    const bucket = map.get(key)
    if (bucket) bucket.push(ev)
    else map.set(key, [ev])
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([dayMs, evs]) => ({ dayMs, events: evs }))
}

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <li className="flex items-baseline gap-3 py-1.5">
      <span
        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: event.color }}
        title={event.feedLabel}
      />
      <span className="w-24 shrink-0 text-right text-lg tabular-nums text-neutral-400">
        {event.allDay ? 'All day' : TIME_FMT.format(new Date(event.start))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xl text-neutral-100">{event.title}</span>
        {event.location && (
          <span className="block truncate text-sm text-neutral-500">{event.location}</span>
        )}
      </span>
    </li>
  )
}

export function AgendaWidget() {
  const { result, loading } = useCalendar()
  const groups = useMemo(() => groupByDay(result?.events ?? []), [result])
  const todayMs = startOfDay(new Date())

  return (
    <div className="flex h-full flex-col">
      {result && result.errors.length > 0 && (
        <div className="mb-2 shrink-0 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-300">
          {result.errors.map((e) => `${e.label}: ${e.message}`).join(' · ')}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="py-6 text-center text-neutral-600">Loading…</div>
        ) : groups.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-neutral-600">
            <span className="text-lg">No upcoming events</span>
            <span className="text-sm">Add a calendar feed in the gear menu</span>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.dayMs} className="mb-4">
              <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-neutral-400">
                {dayLabel(group.dayMs, todayMs)}
              </h3>
              <ul className="divide-y divide-white/5">
                {group.events.map((ev) => (
                  <EventRow key={ev.id} event={ev} />
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
