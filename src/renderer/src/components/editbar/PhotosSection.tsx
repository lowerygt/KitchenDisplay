import type { Settings } from '@shared/types'
import { SectionTitle, type SectionProps } from './common'

export function PhotosSection({ settings, update }: SectionProps) {
  function setPhotos(patch: Partial<Settings['photos']>) {
    void update({ photos: { ...settings.photos, ...patch } })
  }

  async function choosePhotoFolder() {
    const folder = await window.api.photos.pickFolder()
    if (folder) setPhotos({ folder })
  }

  return (
    <>
      <SectionTitle>Photos</SectionTitle>
      <div
        className="mb-1 truncate rounded-lg bg-neutral-800 px-3 py-2 text-xs text-neutral-300"
        title={settings.photos.folder || undefined}
      >
        {settings.photos.folder || 'No folder selected'}
      </div>
      <button
        onClick={() => void choosePhotoFolder()}
        className="w-full rounded-lg bg-neutral-700 px-3 py-2 text-xs text-neutral-100 hover:bg-neutral-600"
      >
        Choose folder…
      </button>
      <div className="mt-2 flex items-center justify-between gap-2 px-1">
        <span className="text-neutral-400">Seconds per photo</span>
        <input
          type="number"
          min={3}
          max={600}
          value={settings.photos.intervalSeconds}
          onChange={(e) => setPhotos({ intervalSeconds: Math.max(3, Number(e.target.value) || 3) })}
          className="w-16 rounded-lg bg-neutral-800 px-2 py-1 text-right text-xs text-neutral-100 outline-none ring-1 ring-white/5 focus:ring-white/20"
        />
      </div>
      <label className="mt-1 flex cursor-pointer items-center justify-between rounded-lg px-1 py-1.5 hover:bg-neutral-800">
        <span className="text-neutral-200">Shuffle order</span>
        <input
          type="checkbox"
          checked={settings.photos.shuffle}
          onChange={(e) => setPhotos({ shuffle: e.target.checked })}
          className="h-4 w-4 accent-white"
        />
      </label>
    </>
  )
}
