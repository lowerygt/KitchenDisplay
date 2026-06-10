// Synthesized kitchen-timer alarm via Web Audio: three short square-wave beeps
// per second, looping until stopped. No audio asset needed, so nothing extra
// to bundle or unpack from the asar.

/** Square waves are loud; scale user volume down so 1.0 isn't ear-splitting. */
const GAIN_SCALE = 0.3
const BEEP_FREQ_HZ = 880

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let intervalId: number | null = null

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function beepBurst(): void {
  if (!ctx || !masterGain) return
  for (let i = 0; i < 3; i++) {
    const t0 = ctx.currentTime + i * 0.2
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.value = BEEP_FREQ_HZ
    // Short attack/release envelope so the beeps don't click.
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, t0)
    env.gain.linearRampToValueAtTime(1, t0 + 0.01)
    env.gain.setValueAtTime(1, t0 + 0.1)
    env.gain.linearRampToValueAtTime(0, t0 + 0.12)
    osc.connect(env)
    env.connect(masterGain)
    osc.start(t0)
    osc.stop(t0 + 0.15)
  }
}

export function isAlarmRunning(): boolean {
  return intervalId !== null
}

export function setAlarmVolume(volume: number): void {
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, volume)) * GAIN_SCALE
}

/** Begin looping the alarm. Safe to call repeatedly; re-calls just update volume. */
export function startAlarm(volume: number): void {
  if (intervalId !== null) {
    setAlarmVolume(volume)
    return
  }
  const c = getContext()
  void c.resume()
  masterGain = c.createGain()
  masterGain.connect(c.destination)
  setAlarmVolume(volume)
  beepBurst()
  intervalId = window.setInterval(beepBurst, 1000)
}

export function stopAlarm(): void {
  if (intervalId !== null) {
    window.clearInterval(intervalId)
    intervalId = null
  }
  masterGain?.disconnect()
  masterGain = null
}
