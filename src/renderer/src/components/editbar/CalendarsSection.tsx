import { useState } from 'react'
import { CALENDAR_COLORS, type CalendarFeed } from '@shared/types'
import { INPUT_BASE, SectionTitle, newId, type SectionProps } from './common'

export function CalendarsSection({ settings, update }: SectionProps) {
  const [newFeedLabel, setNewFeedLabel] = useState('')
  const [newFeedUrl, setNewFeedUrl] = useState('')

  function setCalendars(calendars: CalendarFeed[]) {
    void update({ calendars })
  }

  function addIcsFeed() {
    const url = newFeedUrl.trim()
    if (!url) return
    const label = newFeedLabel.trim() || `Calendar ${settings.calendars.length + 1}`
    const color = CALENDAR_COLORS[settings.calendars.length % CALENDAR_COLORS.length]
    setCalendars([
      ...settings.calendars,
      { id: newId(), type: 'ics', label, color, url, enabled: true }
    ])
    setNewFeedLabel('')
    setNewFeedUrl('')
  }

  function toggleFeed(id: string) {
    setCalendars(settings.calendars.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)))
  }

  function removeFeed(id: string) {
    setCalendars(settings.calendars.filter((f) => f.id !== id))
  }

  return (
    <>
      <SectionTitle>Calendars</SectionTitle>
      {settings.calendars.length > 0 && (
        <div className="mb-2 space-y-1">
          {settings.calendars.map((feed) => (
            <div
              key={feed.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-800"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: feed.color }}
              />
              <span className="min-w-0 flex-1 truncate text-neutral-200" title={feed.url}>
                {feed.label}
                {feed.type === 'google' && (
                  <span className="ml-1 text-[10px] text-neutral-500">Google</span>
                )}
              </span>
              <input
                type="checkbox"
                checked={feed.enabled}
                onChange={() => toggleFeed(feed.id)}
                className="h-4 w-4 accent-white"
              />
              <button
                onClick={() => removeFeed(feed.id)}
                aria-label="Remove feed"
                className="px-1 text-lg leading-none text-neutral-600 hover:text-red-400"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        value={newFeedLabel}
        onChange={(e) => setNewFeedLabel(e.target.value)}
        placeholder="Name (optional)"
        className={`mb-1 w-full ${INPUT_BASE}`}
      />
      <div className="flex gap-1">
        <input
          value={newFeedUrl}
          onChange={(e) => setNewFeedUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addIcsFeed()
          }}
          placeholder="Secret iCal .ics URL"
          className={`min-w-0 flex-1 ${INPUT_BASE}`}
        />
        <button
          onClick={addIcsFeed}
          className="shrink-0 rounded-lg bg-neutral-700 px-3 text-lg leading-none text-neutral-100 hover:bg-neutral-600"
          aria-label="Add calendar feed"
        >
          +
        </button>
      </div>
      <p className="mt-1 text-[10px] text-neutral-600">
        Google Calendar → Settings → “Secret address in iCal format”.
      </p>
    </>
  )
}
