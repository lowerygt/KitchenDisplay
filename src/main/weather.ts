import type { WeatherResult, WeatherSettings } from '../shared/types'
import { getSettings } from './store'

const GEOCODE_TTL_MS = 24 * 60 * 60 * 1000 // ZIP -> lat/lon barely changes; cache a day.

interface GeoPoint {
  lat: number
  lon: number
  place: string
  at: number
}

const geoCache = new Map<string, GeoPoint>()

async function fetchJson<T>(url: string, timeoutMs = 12_000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'KitchenDisplay/0.1 (local dashboard)' }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

interface ZippoResponse {
  'post code'?: string
  places?: Array<{
    'place name'?: string
    'state abbreviation'?: string
    state?: string
    latitude?: string
    longitude?: string
  }>
}

/** Geocode a US ZIP via the free, key-less zippopotam.us service. */
async function geocodeZip(zip: string): Promise<GeoPoint> {
  const clean = zip.trim()
  const cached = geoCache.get(clean)
  if (cached && Date.now() - cached.at < GEOCODE_TTL_MS) return cached

  if (!/^\d{5}$/.test(clean)) throw new Error(`Invalid ZIP "${zip}" — expected 5 digits`)

  const data = await fetchJson<ZippoResponse>(`https://api.zippopotam.us/us/${clean}`)
  const place = data.places?.[0]
  if (!place?.latitude || !place?.longitude) throw new Error(`No location found for ZIP ${clean}`)

  const point: GeoPoint = {
    lat: Number(place.latitude),
    lon: Number(place.longitude),
    place: [place['place name'], place['state abbreviation'] ?? place.state]
      .filter(Boolean)
      .join(', '),
    at: Date.now()
  }
  geoCache.set(clean, point)
  return point
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number
    weather_code?: number
    relative_humidity_2m?: number
    wind_speed_10m?: number
  }
  daily?: {
    time?: string[]
    weather_code?: number[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    precipitation_probability_max?: Array<number | null>
  }
}

/**
 * Fetch the forecast for the configured ZIP: current conditions plus today and
 * the next three days. Uses Open-Meteo (no API key required) after geocoding the
 * ZIP. Throws on failure so the renderer can surface a friendly error.
 */
export async function getWeather(settings: WeatherSettings = getSettings().weather): Promise<WeatherResult> {
  const { zip, units } = settings
  const { lat, lon, place } = await geocodeZip(zip)

  const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius'
  const windUnit = units === 'imperial' ? 'mph' : 'kmh'

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    `&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto&forecast_days=4`

  const data = await fetchJson<OpenMeteoResponse>(url)
  const c = data.current ?? {}
  const d = data.daily ?? {}
  const times = d.time ?? []

  const days = times.slice(0, 4).map((dateISO, i) => ({
    dateISO,
    weatherCode: d.weather_code?.[i] ?? 0,
    tempMax: Math.round(d.temperature_2m_max?.[i] ?? 0),
    tempMin: Math.round(d.temperature_2m_min?.[i] ?? 0),
    precipProb: d.precipitation_probability_max?.[i] ?? null
  }))

  return {
    place,
    units,
    current: {
      temp: Math.round(c.temperature_2m ?? 0),
      weatherCode: c.weather_code ?? 0,
      humidity: c.relative_humidity_2m ?? null,
      windSpeed: c.wind_speed_10m != null ? Math.round(c.wind_speed_10m) : null
    },
    days,
    fetchedAt: new Date().toISOString()
  }
}
