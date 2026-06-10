import type { ReactNode } from 'react'
import type { WidgetId } from '@shared/types'
import { ClockWidget } from './ClockWidget'
import { TodoWidget } from './TodoWidget'
import { CameraWidget } from './CameraWidget'
import { AgendaWidget } from './AgendaWidget'
import { WeatherWidget } from './WeatherWidget'
import { PhotoWidget } from './PhotoWidget'
import { NewsWidget } from './NewsWidget'
import { TimerWidget } from './TimerWidget'

interface WidgetDef {
  title?: string
  padded: boolean
  render: () => ReactNode
}

export const WIDGETS: Record<WidgetId, WidgetDef> = {
  clock: { padded: true, render: () => <ClockWidget /> },
  weather: { title: 'Weather', padded: true, render: () => <WeatherWidget /> },
  todo: { title: 'To-do', padded: true, render: () => <TodoWidget /> },
  agenda: {
    title: 'Agenda',
    padded: true,
    render: () => <AgendaWidget />
  },
  camera: {
    title: 'Camera',
    padded: false,
    render: () => <CameraWidget />
  },
  photo: {
    padded: false,
    render: () => <PhotoWidget />
  },
  news: {
    title: 'Headlines',
    padded: true,
    render: () => <NewsWidget />
  },
  timer: {
    title: 'Timer',
    padded: true,
    render: () => <TimerWidget />
  }
}
