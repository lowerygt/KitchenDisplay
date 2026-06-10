import type { WeatherDay, WeatherUnits } from '@shared/types'
import { useWeather } from '../hooks/useWeather'
import { WeatherIcon, describeWeather } from './weatherIcons'

const DOW_FMT = new Intl.DateTimeFormat(undefined, { weekday: 'short' })

function deg(units: WeatherUnits): string {
  return units === 'imperial' ? '°F' : '°C'
}

function dayName(dateISO: string, index: number): string {
  if (index === 0) return 'Today'
  // dateISO is YYYY-MM-DD; parse as local date (append time to avoid UTC shift).
  return DOW_FMT.format(new Date(`${dateISO}T00:00:00`))
}

function ForecastDay({ day, index }: { day: WeatherDay; index: number }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-white/5 px-2 py-3">
      <span className="text-sm font-medium text-neutral-300">{dayName(day.dateISO, index)}</span>
      <WeatherIcon code={day.weatherCode} className="my-1 h-8 w-8 text-neutral-200" />
      <span className="text-lg tabular-nums text-neutral-100">{day.tempMax}°</span>
      <span className="text-sm tabular-nums text-neutral-500">{day.tempMin}°</span>
      {day.precipProb != null && day.precipProb > 0 && (
        <span className="text-xs tabular-nums text-sky-400">{day.precipProb}%</span>
      )}
    </div>
  )
}

export function WeatherWidget() {
  const { result, error, loading } = useWeather()

  if (loading && !result) {
    return <div className="flex h-full items-center justify-center text-neutral-600">Loading…</div>
  }

  if (error && !result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-neutral-600">
        <span className="text-lg">Weather unavailable</span>
        <span className="text-sm">{error}</span>
        <span className="text-xs">Check the ZIP code in the gear menu</span>
      </div>
    )
  }

  if (!result) return null

  const { current, days, place, units } = result

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <WeatherIcon code={current.weatherCode} className="h-12 w-12 text-neutral-100" />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-light tabular-nums text-neutral-50">
                {current.temp}
              </span>
              <span className="text-xl text-neutral-400">{deg(units)}</span>
            </div>
            <div className="text-sm text-neutral-400">{describeWeather(current.weatherCode)}</div>
          </div>
        </div>
        <div className="text-right text-sm text-neutral-500">
          <div className="text-neutral-300">{place}</div>
          {current.windSpeed != null && (
            <div>Wind {current.windSpeed} {units === 'imperial' ? 'mph' : 'km/h'}</div>
          )}
          {current.humidity != null && <div>Humidity {current.humidity}%</div>}
        </div>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 items-stretch gap-2">
        {days.map((day, i) => (
          <ForecastDay key={day.dateISO} day={day} index={i} />
        ))}
      </div>
    </div>
  )
}
