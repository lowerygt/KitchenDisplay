import IcalExpander from 'ical-expander'
import type {
  CalendarEvent,
  CalendarFeed,
  CalendarFeedError,
  CalendarResult,
  Settings
} from '../shared/types'
import { getSettings } from './store'

const FETCH_TIMEOUT_MS = 15_000

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    // Google publishes secret iCal as webcal://; normalize to https.
    const httpsUrl = url.replace(/^webcal:\/\//i, 'https://')
    const res = await fetch(httpsUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'KitchenDisplay/1.0', Accept: 'text/calendar,*/*' }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

function parseIcs(ics: string, feed: CalendarFeed, after: Date, before: Date): CalendarEvent[] {
  const expander = new IcalExpander({ ics, maxIterations: 2000, skipInvalidDates: true })
  const { events, occurrences } = expander.between(after, before)

  const out: CalendarEvent[] = []
  const push = (
    uid: string,
    summary: string,
    location: string | undefined,
    start: { toJSDate(): Date; isDate: boolean },
    end: { toJSDate(): Date }
  ): void => {
    const startDate = start.toJSDate()
    out.push({
      id: `${feed.id}:${uid}:${startDate.toISOString()}`,
      feedId: feed.id,
      feedLabel: feed.label,
      color: feed.color,
      title: summary || '(no title)',
      start: startDate.toISOString(),
      end: end.toJSDate().toISOString(),
      allDay: start.isDate,
      location: location || undefined
    })
  }

  for (const e of events) push(e.uid, e.summary, e.location, e.startDate, e.endDate)
  for (const o of occurrences) {
    push(o.item.uid, o.item.summary, o.item.location, o.startDate, o.endDate)
  }
  return out
}

/** Fetch + merge events from all enabled ICS feeds in the configured window. */
export async function getCalendarEvents(settings: Settings = getSettings()): Promise<CalendarResult> {
  const now = new Date()
  const after = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // local midnight today
  const before = new Date(after)
  before.setDate(before.getDate() + Math.max(1, settings.agendaDays))

  const icsFeeds = settings.calendars.filter((f) => f.enabled && f.type === 'ics' && f.url)

  const errors: CalendarFeedError[] = []
  const results = await Promise.all(
    icsFeeds.map(async (feed): Promise<CalendarEvent[]> => {
      try {
        const ics = await fetchText(feed.url!)
        return parseIcs(ics, feed, after, before)
      } catch (err) {
        errors.push({
          feedId: feed.id,
          label: feed.label,
          message: err instanceof Error ? err.message : String(err)
        })
        return []
      }
    })
  )

  const events = results
    .flat()
    .filter((e) => new Date(e.end) >= after && new Date(e.start) < before)
    .sort((a, b) => a.start.localeCompare(b.start))

  return { events, errors, fetchedAt: now.toISOString() }
}
