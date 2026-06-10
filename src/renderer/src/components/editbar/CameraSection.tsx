import { useEffect, useState } from 'react'
import { INPUT_BASE, SectionTitle, type SectionProps } from './common'

export function CameraSection({ settings, update }: SectionProps) {
  const [rtsp, setRtsp] = useState(settings.camera.rtspUrl)

  // Keep the local field in sync if settings change elsewhere.
  useEffect(() => setRtsp(settings.camera.rtspUrl), [settings.camera.rtspUrl])

  function commitRtsp() {
    const next = rtsp.trim()
    if (next !== settings.camera.rtspUrl) {
      void update({ camera: { ...settings.camera, rtspUrl: next } })
    }
  }

  return (
    <>
      <SectionTitle>Camera RTSP URL</SectionTitle>
      <input
        value={rtsp}
        onChange={(e) => setRtsp(e.target.value)}
        onBlur={commitRtsp}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitRtsp()
        }}
        placeholder="rtsp://user:pass@192.168.1.50:554/stream1"
        className={`w-full ${INPUT_BASE}`}
      />
      <p className="mt-1 text-[10px] text-neutral-600">Enter or blur to apply.</p>
    </>
  )
}
