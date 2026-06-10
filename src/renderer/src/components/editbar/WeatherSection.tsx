import { useEffect, useState } from 'react'
import type { WeatherUnits } from '@shared/types'
import { INPUT_BASE, SectionTitle, type SectionProps } from './common'

export function WeatherSection({ settings, update }: SectionProps) {
  const [zip, setZip] = useState(settings.weather.zip)

  // Keep the local field in sync if settings change elsewhere.
  useEffect(() => setZip(settings.weather.zip), [settings.weather.zip])

  function commitZip() {
    const next = zip.trim()
    if (next !== settings.weather.zip) {
      void update({ weather: { ...settings.weather, zip: next } })
    }
  }

  function setUnits(units: WeatherUnits) {
    if (units !== settings.weather.units) {
      void update({ weather: { ...settings.weather, units } })
    }
  }

  return (
    <>
      <SectionTitle>Weather</SectionTitle>
      <input
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        onBlur={commitZip}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitZip()
        }}
        inputMode="numeric"
        placeholder="ZIP code (e.g. 28210)"
        className={`w-full ${INPUT_BASE}`}
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        {(['imperial', 'metric'] as const).map((u) => (
          <button
            key={u}
            onClick={() => setUnits(u)}
            className={`rounded-lg px-2 py-1.5 transition ${
              settings.weather.units === u
                ? 'bg-white text-neutral-900'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {u === 'imperial' ? '°F' : '°C'}
          </button>
        ))}
      </div>
    </>
  )
}
