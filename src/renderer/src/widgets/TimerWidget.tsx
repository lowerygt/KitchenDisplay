import { useSettings } from '../hooks/useSettings'
import { useTimers, remainingFor, type KitchenTimer } from '../hooks/useTimers'

/** One-tap presets, in minutes. */
const PRESETS = [1, 3, 5, 10, 15, 30]
/** Tap a timer's label to cycle through common kitchen labels. */
const LABEL_CYCLE = ['Pasta', 'Oven', 'Stove', 'Eggs', 'Rice', 'Tea']

function formatMs(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function defaultLabel(t: KitchenTimer): string {
  return `${Math.round(t.totalMs / 60_000)} min`
}

function nextLabel(t: KitchenTimer): string {
  const cycle = [defaultLabel(t), ...LABEL_CYCLE]
  const idx = cycle.indexOf(t.label)
  return cycle[(idx + 1) % cycle.length]
}

function TimerRow({
  timer,
  now,
  onExtend,
  onPauseResume,
  onRemove,
  onCycleLabel
}: {
  timer: KitchenTimer
  now: number
  onExtend: () => void
  onPauseResume: () => void
  onRemove: () => void
  onCycleLabel: () => void
}) {
  const ringing = timer.state === 'ringing'
  const paused = timer.state === 'paused'

  if (ringing) {
    return (
      <li className="flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold text-white">{timer.label}</div>
          <div className="text-sm text-red-100">Time&apos;s up!</div>
        </div>
        <button
          onClick={onExtend}
          className="shrink-0 rounded-xl bg-red-700 px-3 py-3 text-lg font-semibold text-white active:bg-red-800"
        >
          +1m
        </button>
        <button
          onClick={onRemove}
          className="shrink-0 rounded-xl bg-white px-4 py-3 text-lg font-bold text-red-700 active:bg-red-100"
        >
          Dismiss
        </button>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-2 rounded-xl bg-neutral-800 px-3 py-1.5 ring-1 ring-white/5">
      <button onClick={onCycleLabel} className="min-w-0 flex-1 text-left" aria-label="Change label">
        <span className="block truncate text-sm text-neutral-400">{timer.label}</span>
        <span
          className={`block text-3xl font-semibold tabular-nums leading-tight ${
            paused ? 'text-neutral-500' : 'text-neutral-100'
          }`}
        >
          {formatMs(remainingFor(timer, now))}
        </span>
      </button>
      <button
        onClick={onExtend}
        aria-label="Add one minute"
        className="shrink-0 rounded-xl bg-neutral-700 px-3 py-3 text-lg font-semibold text-neutral-100 active:bg-neutral-600"
      >
        +1m
      </button>
      <button
        onClick={onPauseResume}
        aria-label={paused ? 'Resume' : 'Pause'}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-700 text-xl text-neutral-100 active:bg-neutral-600"
      >
        {paused ? '▶' : '⏸'}
      </button>
      <button
        onClick={onRemove}
        aria-label="Cancel timer"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-3xl leading-none text-neutral-600 active:text-red-400"
      >
        ×
      </button>
    </li>
  )
}

/**
 * Full-screen takeover while any timer rings: pulsing red flash plus a card
 * with per-timer snooze/dismiss. Fixed at z-[45] — above NightOverlay (z-40)
 * so a night-time alarm is visible through the dim, below EditBar (z-50).
 * Tapping anywhere outside the card dismisses everything.
 */
function RingingOverlay({
  ringing,
  onExtend,
  onRemove,
  onDismissAll
}: {
  ringing: KitchenTimer[]
  onExtend: (id: string) => void
  onRemove: (id: string) => void
  onDismissAll: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[45] flex items-center justify-center p-8"
      onClick={onDismissAll}
    >
      <div className="absolute inset-0 animate-pulse bg-red-600/40" />
      <div
        className="relative flex w-full max-w-xl flex-col gap-3 rounded-2xl bg-neutral-900/95 p-6 ring-2 ring-red-500"
        onClick={(e) => e.stopPropagation()}
      >
        {ringing.map((t) => (
          <div key={t.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-3xl font-bold text-white">{t.label}</div>
              <div className="text-lg text-red-300">Time&apos;s up!</div>
            </div>
            <button
              onClick={() => onExtend(t.id)}
              className="shrink-0 rounded-xl bg-neutral-700 px-5 py-4 text-xl font-semibold text-neutral-100 active:bg-neutral-600"
            >
              +1m
            </button>
            <button
              onClick={() => onRemove(t.id)}
              className="shrink-0 rounded-xl bg-red-600 px-5 py-4 text-xl font-bold text-white active:bg-red-700"
            >
              Dismiss
            </button>
          </div>
        ))}
        {ringing.length > 1 && (
          <button
            onClick={onDismissAll}
            className="rounded-xl bg-white py-4 text-xl font-bold text-red-700 active:bg-red-100"
          >
            Dismiss all
          </button>
        )}
        <div className="text-center text-sm text-neutral-500">Tap outside to dismiss</div>
      </div>
    </div>
  )
}

export function TimerWidget() {
  const { settings } = useSettings()
  const { timers, now, addTimer, extend, pause, resume, remove, dismissAll, setLabel } = useTimers(
    settings?.timers.volume ?? 0.8
  )
  const ringing = timers.filter((t) => t.state === 'ringing')

  // Idle: nothing running — fill the tile with big one-tap presets.
  if (timers.length === 0) {
    return (
      <div className="grid h-full grid-cols-3 gap-2">
        {PRESETS.map((m) => (
          <button
            key={m}
            onClick={() => addTimer(m)}
            className="rounded-xl bg-neutral-800 text-2xl font-semibold text-neutral-100 ring-1 ring-white/5 active:bg-neutral-700"
          >
            {m}
            <span className="text-base font-normal text-neutral-400">m</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {timers.map((t) => (
          <TimerRow
            key={t.id}
            timer={t}
            now={now}
            onExtend={() => extend(t.id, 60_000)}
            onPauseResume={() => (t.state === 'paused' ? resume(t.id) : pause(t.id))}
            onRemove={() => remove(t.id)}
            onCycleLabel={() => setLabel(t.id, nextLabel(t))}
          />
        ))}
      </ul>
      <footer className="mt-2 flex shrink-0 items-center gap-1.5 border-t border-white/5 pt-2">
        <span className="pr-1 text-sm text-neutral-500">New</span>
        {PRESETS.map((m) => (
          <button
            key={m}
            onClick={() => addTimer(m)}
            className="min-w-12 flex-1 rounded-lg bg-neutral-800 py-2 text-lg font-medium text-neutral-300 ring-1 ring-white/5 active:bg-neutral-700"
          >
            {m}m
          </button>
        ))}
      </footer>
      {ringing.length > 0 && (
        <RingingOverlay
          ringing={ringing}
          onExtend={(id) => extend(id, 60_000)}
          onRemove={remove}
          onDismissAll={dismissAll}
        />
      )}
    </div>
  )
}
