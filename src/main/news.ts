import Parser from 'rss-parser'
import type { NewsItem, NewsResult, NewsSettings } from '../shared/types'
import { getSettings } from './store'

const MAX_PER_FEED = 15
const MAX_TOTAL = 40

const parser = new Parser({
  timeout: 12_000,
  headers: { 'User-Agent': 'KitchenDisplay/0.1 (local dashboard)' }
})

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/**
 * Fetch every configured RSS/Atom feed, merge the items newest-first, and
 * report per-feed failures without aborting the others.
 */
export async function getNews(settings: NewsSettings = getSettings().news): Promise<NewsResult> {
  const items: NewsItem[] = []
  const errors: NewsResult['errors'] = []

  await Promise.all(
    settings.feeds.map(async (feed) => {
      if (!feed.url) return
      try {
        const parsed = await parser.parseURL(feed.url)
        const source = feed.label?.trim() || parsed.title || hostname(feed.url)
        for (const it of (parsed.items ?? []).slice(0, MAX_PER_FEED)) {
          const key = it.guid || it.link || it.title || Math.random().toString(36)
          items.push({
            id: `${feed.id}:${key}`,
            title: (it.title ?? '').trim(),
            link: it.link,
            source,
            isoDate: it.isoDate
          })
        }
      } catch (e) {
        errors.push({ url: feed.url, message: e instanceof Error ? e.message : 'Failed to load feed' })
      }
    })
  )

  // Newest first; undated items sink to the bottom.
  items.sort((a, b) => (b.isoDate ?? '').localeCompare(a.isoDate ?? ''))

  return { items: items.slice(0, MAX_TOTAL), errors, fetchedAt: new Date().toISOString() }
}
