import { useState } from 'react'
import type { NewsFeedSource } from '@shared/types'
import { INPUT_BASE, SectionTitle, newId, type SectionProps } from './common'

export function NewsSection({ settings, update }: SectionProps) {
  const [newNewsLabel, setNewNewsLabel] = useState('')
  const [newNewsUrl, setNewNewsUrl] = useState('')

  function setNewsFeeds(feeds: NewsFeedSource[]) {
    void update({ news: { ...settings.news, feeds } })
  }

  function addNewsFeed() {
    const url = newNewsUrl.trim()
    if (!url) return
    const label = newNewsLabel.trim()
    setNewsFeeds([...settings.news.feeds, { id: newId(), url, label: label || undefined }])
    setNewNewsLabel('')
    setNewNewsUrl('')
  }

  function removeNewsFeed(id: string) {
    setNewsFeeds(settings.news.feeds.filter((f) => f.id !== id))
  }

  return (
    <>
      <SectionTitle>Headlines</SectionTitle>
      {settings.news.feeds.length > 0 && (
        <div className="mb-2 space-y-1">
          {settings.news.feeds.map((feed) => (
            <div
              key={feed.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-800"
            >
              <span className="min-w-0 flex-1 truncate text-neutral-200" title={feed.url}>
                {feed.label || feed.url}
              </span>
              <button
                onClick={() => removeNewsFeed(feed.id)}
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
        value={newNewsLabel}
        onChange={(e) => setNewNewsLabel(e.target.value)}
        placeholder="Name (optional)"
        className={`mb-1 w-full ${INPUT_BASE}`}
      />
      <div className="flex gap-1">
        <input
          value={newNewsUrl}
          onChange={(e) => setNewNewsUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addNewsFeed()
          }}
          placeholder="RSS / Atom feed URL"
          className={`min-w-0 flex-1 ${INPUT_BASE}`}
        />
        <button
          onClick={addNewsFeed}
          className="shrink-0 rounded-lg bg-neutral-700 px-3 text-lg leading-none text-neutral-100 hover:bg-neutral-600"
          aria-label="Add news feed"
        >
          +
        </button>
      </div>
      <p className="mt-1 text-[10px] text-neutral-600">
        Any RSS/Atom URL, e.g. a news site or blog feed.
      </p>
    </>
  )
}
