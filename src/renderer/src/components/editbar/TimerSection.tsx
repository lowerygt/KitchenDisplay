import { isAlarmRunning, startAlarm, stopAlarm } from '../../lib/alarm'
import { SectionTitle, type SectionProps } from './common'

export function TimerSection({ settings, update }: SectionProps) {
  function setTimerVolume(volume: number) {
    void update({ timers: { ...settings.timers, volume } })
  }

  function testAlarm() {
    // Don't schedule a stop if a real timer alarm is already sounding.
    if (isAlarmRunning()) return
    startAlarm(settings.timers.volume)
    window.setTimeout(stopAlarm, 2000)
  }

  return (
    <>
      <SectionTitle>Timer</SectionTitle>
      <div className="space-y-2 px-2">
        <div>
          <div className="mb-1 flex items-center justify-between text-neutral-400">
            <span>Alarm volume</span>
            <span className="tabular-nums">{Math.round(settings.timers.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.timers.volume}
            onChange={(e) => setTimerVolume(Number(e.target.value))}
            className="w-full accent-white"
          />
        </div>
        <button
          onClick={testAlarm}
          className="w-full rounded-lg bg-neutral-800 py-1.5 text-xs text-neutral-200 ring-1 ring-white/5 hover:bg-neutral-700"
        >
          Test sound
        </button>
        <p className="text-[10px] text-neutral-600">
          Volume 0 silences the alarm; the screen flash still shows.
        </p>
      </div>
    </>
  )
}
