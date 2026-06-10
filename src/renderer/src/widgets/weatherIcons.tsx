// WMO weather interpretation codes -> human label + a simple line-icon category.
// Reference: https://open-meteo.com/en/docs (WMO Weather interpretation codes)

export type WeatherCategory =
  | 'clear'
  | 'partly'
  | 'cloudy'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'thunder'

export function describeWeather(code: number): string {
  const map: Record<number, string> = {
    0: 'Clear',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    56: 'Freezing drizzle',
    57: 'Freezing drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Freezing rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Rain showers',
    81: 'Rain showers',
    82: 'Heavy showers',
    85: 'Snow showers',
    86: 'Snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm',
    99: 'Thunderstorm'
  }
  return map[code] ?? 'Unknown'
}

function categorize(code: number): WeatherCategory {
  if (code === 0 || code === 1) return 'clear'
  if (code === 2) return 'partly'
  if (code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 71 && code <= 77) return 'snow'
  if (code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'thunder'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  return 'cloudy'
}

/** A simple stroked line icon matching the rest of the UI (no emoji). */
export function WeatherIcon({ code, className = 'h-6 w-6' }: { code: number; className?: string }) {
  const cat = categorize(code)
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {cat === 'clear' && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
        </>
      )}
      {cat === 'partly' && (
        <>
          <circle cx="8" cy="8" r="3" />
          <path d="M8 2v1.5M3.5 8H2M4.6 4.6l-1 -1M11.4 4.6l1 -1" />
          <path d="M7 18h9a3 3 0 000-6 4.5 4.5 0 00-8.6-1.3A3.2 3.2 0 007 18z" />
        </>
      )}
      {cat === 'cloudy' && (
        <path d="M7 18h10a3.5 3.5 0 00.4-7 5 5 0 00-9.7-1.2A3.6 3.6 0 007 18z" />
      )}
      {cat === 'fog' && (
        <>
          <path d="M6 13h10a3.3 3.3 0 00.4-6.6A4.8 4.8 0 007 5.3" />
          <path d="M4 17h16M6 20h12" />
        </>
      )}
      {cat === 'rain' && (
        <>
          <path d="M7 15h10a3.4 3.4 0 00.4-6.8A4.9 4.9 0 008 6.8" />
          <path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5" />
        </>
      )}
      {cat === 'snow' && (
        <>
          <path d="M7 14h10a3.4 3.4 0 00.4-6.8A4.9 4.9 0 008 5.8" />
          <path d="M8.5 18h.01M12 19h.01M15.5 18h.01M10 21h.01M14 21h.01" />
        </>
      )}
      {cat === 'thunder' && (
        <>
          <path d="M7 13h10a3.4 3.4 0 00.4-6.8A4.9 4.9 0 008 4.8" />
          <path d="M13 14l-3 4h3l-1 3 3.5-4.5H12z" />
        </>
      )}
    </svg>
  )
}
