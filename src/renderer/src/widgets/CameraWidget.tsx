import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import type { CameraStatus } from '@shared/types'
import { useSettings } from '../hooks/useSettings'

function Overlay({ status }: { status: CameraStatus }) {
  const text =
    status.state === 'idle'
      ? 'No camera configured'
      : status.state === 'starting'
        ? 'Connecting to camera…'
        : 'Camera offline — reconnecting…'

  const sub =
    status.state === 'idle'
      ? 'Add an RTSP URL in the gear menu'
      : status.state === 'offline' || status.state === 'error'
        ? status.message
        : undefined

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-900/80 text-center">
      {status.state !== 'idle' && (
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-200" />
      )}
      <span className="text-lg font-medium text-neutral-200">{text}</span>
      {sub && <span className="max-w-[90%] truncate text-xs text-neutral-500">{sub}</span>}
      {status.retries > 0 && status.state !== 'live' && (
        <span className="text-xs text-neutral-600">attempt {status.retries}</span>
      )}
    </div>
  )
}

export function CameraWidget() {
  const { settings } = useSettings()
  const rtspUrl = settings?.camera.rtspUrl ?? ''
  const [status, setStatus] = useState<CameraStatus>({ state: 'idle', url: null, retries: 0 })
  const videoRef = useRef<HTMLVideoElement>(null)

  // Subscribe to pipeline status from the main process.
  useEffect(() => {
    void window.api.camera.getStatus().then(setStatus)
    return window.api.camera.onStatus(setStatus)
  }, [])

  // Drive the pipeline from the configured URL. Main treats "" as idle/stop.
  useEffect(() => {
    if (!settings) return
    void window.api.camera.start(rtspUrl)
    return () => {
      void window.api.camera.stop()
    }
  }, [settings, rtspUrl])

  // Attach hls.js when the stream goes live.
  useEffect(() => {
    if (status.state !== 'live' || !status.url) return
    const video = videoRef.current
    if (!video) return

    let hls: Hls | null = null
    if (Hls.isSupported()) {
      hls = new Hls({
        lowLatencyMode: true,
        liveSyncDuration: 2,
        liveMaxLatencyDuration: 6,
        maxBufferLength: 6,
        backBufferLength: 10
      })
      hls.loadSource(status.url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => void video.play().catch(() => {}))
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal || !hls) return
        // Try in-player recovery; persistent failures are handled by main's restart loop.
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError()
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = status.url
      void video.play().catch(() => {})
    }

    return () => {
      hls?.destroy()
      video.removeAttribute('src')
      video.load()
    }
  }, [status.state, status.url])

  // Drag-to-pan: the feed is shown with object-cover (fills the frame, crops the
  // overfilled axis). Dragging adjusts object-position so the cropped edges can be
  // brought into view — i.e. pan around the full image without letterboxing.
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const drag = useRef<{ x: number; y: number } | null>(null)
  const live = status.state === 'live'

  function onPointerDown(e: React.PointerEvent) {
    if (!live) return
    drag.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY }
    const gain = 1.5
    const clamp = (v: number) => Math.min(100, Math.max(0, v))
    setPos((p) => ({
      x: clamp(p.x - (dx / rect.width) * 100 * gain),
      y: clamp(p.y - (dy / rect.height) * 100 * gain)
    }))
  }
  function endDrag(e: React.PointerEvent) {
    drag.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* pointer already released */
    }
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onDoubleClick={() => setPos({ x: 50, y: 50 })}
      className={`relative h-full w-full overflow-hidden bg-black ${
        live ? (drag.current ? 'cursor-grabbing' : 'cursor-grab') : ''
      }`}
      title={live ? 'Drag to pan · double-click to re-center' : undefined}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        draggable={false}
        style={{ objectPosition: `${pos.x}% ${pos.y}%` }}
        className="h-full w-full select-none object-cover"
      />
      {status.state !== 'live' && <Overlay status={status} />}
    </div>
  )
}
