import { useNow } from '../hooks/useNow'

const TIME_FMT = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
})
const DATE_FMT = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric'
})

export function ClockWidget() {
  const now = useNow(1000)
  const [time, meridiem] = TIME_FMT.format(now).split(' ')

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="flex items-baseline gap-3 leading-none">
        <span className="text-[8rem] font-extralight tabular-nums tracking-tight">{time}</span>
        <span className="text-3xl font-light text-neutral-400">{meridiem}</span>
      </div>
      <div className="mt-2 text-3xl font-light text-neutral-300">{DATE_FMT.format(now)}</div>
    </div>
  )
}
