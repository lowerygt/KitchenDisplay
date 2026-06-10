import { photoUrl, usePhotos } from '../hooks/usePhotos'

export function PhotoWidget() {
  const { folder, current, count, loading } = usePhotos()

  if (!folder) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-neutral-600">
        <span className="text-lg">Photo frame</span>
        <span className="text-sm">Choose a photo folder in the gear menu</span>
      </div>
    )
  }

  if (loading && !current) {
    return <div className="flex h-full items-center justify-center text-neutral-600">Loading…</div>
  }

  if (!current) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-neutral-600">
        <span className="text-lg">No images found</span>
        <span className="text-sm">Add photos to the selected folder</span>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* key forces a remount per photo so the fade-in animation re-runs */}
      <img
        key={current}
        src={photoUrl(current)}
        alt=""
        className="absolute inset-0 h-full w-full animate-[fadeIn_900ms_ease] object-cover"
      />
      {count > 1 && (
        <div className="absolute bottom-2 right-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur">
          {count} photos
        </div>
      )}
    </div>
  )
}
