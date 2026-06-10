import type { NewsItem } from '@shared/types'
import { useNews } from '../hooks/useNews'

const REL_FMT = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

function relativeTime(isoDate?: string): string {
  if (!isoDate) return ''
  const then = new Date(isoDate).getTime()
  if (Number.isNaN(then)) return ''
  const diffMin = Math.round((then - Date.now()) / 60_000)
  const absMin = Math.abs(diffMin)
  if (absMin < 60) return REL_FMT.format(diffMin, 'minute')
  const diffHr = Math.round(diffMin / 60)
  if (Math.abs(diffHr) < 24) return REL_FMT.format(diffHr, 'hour')
  return REL_FMT.format(Math.round(diffHr / 24), 'day')
}

function HeadlineRow({ item }: { item: NewsItem }) {
  return (
    <li className="py-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
          {item.source}
        </span>
        {item.isoDate && (
          <span className="shrink-0 text-xs tabular-nums text-neutral-500">
            {relativeTime(item.isoDate)}
          </span>
        )}
      </div>
      <p className="text-base leading-snug text-neutral-100">{item.title}</p>
    </li>
  )
}

export function NewsWidget() {
  const { result, loading } = useNews()

  if (loading && !result) {
    return <div className="flex h-full items-center justify-center text-neutral-600">Loading…</div>
  }

  const items = result?.items ?? []
  const hasErrors = (result?.errors.length ?? 0) > 0

  return (
    <div className="flex h-full flex-col">
      {hasErrors && items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-neutral-600">
          <span className="text-lg">Headlines unavailable</span>
          <span className="text-sm">Check the feed URLs in the gear menu</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-neutral-600">
          <span className="text-lg">No headlines</span>
          <span className="text-sm">Add an RSS feed in the gear menu</span>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-white/5 overflow-y-auto pr-1">
          {items.map((item) => (
            <HeadlineRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  )
}
