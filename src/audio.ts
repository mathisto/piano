import { settings } from './settings'

let ctx: AudioContext | undefined
let master: GainNode | undefined
const voices = new Map<number, { g: GainNode; stop: () => void }>()

function ready(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext({ latencyHint: 'interactive' })
    master = ctx.createGain()
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  master!.gain.value = settings.volume * 0.5
  return ctx
}

/** Call from a user gesture so the browser lets us make sound. */
export function unlock() {
  ready()
}

export function click(accent: boolean) {
  const c = ready()
  const o = c.createOscillator()
  const g = c.createGain()
  o.frequency.value = accent ? 1568 : 1046
  g.gain.setValueAtTime(0.4, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06)
  o.connect(g).connect(master!)
  o.start()
  o.stop(c.currentTime + 0.08)
}

// ponytail: two-partial synth, not samples. Salamander sample packs go here when sound packs land.
export function noteOn(p: number, vel: number) {
  if (!settings.sound) return
  const c = ready()
  noteOff(p, true)
  const f = 440 * 2 ** ((p - 69) / 12)
  const g = c.createGain()
  const peak = 0.15 + 0.5 * vel
  const decay = 2.5 - Math.min(p, 96) / 60
  g.gain.setValueAtTime(0, c.currentTime)
  g.gain.linearRampToValueAtTime(peak, c.currentTime + 0.006)
  g.gain.exponentialRampToValueAtTime(peak * 0.25, c.currentTime + 0.35)
  g.gain.exponentialRampToValueAtTime(0.0005, c.currentTime + decay)
  const a = c.createOscillator()
  const b = c.createOscillator()
  a.type = 'triangle'
  b.type = 'sine'
  a.frequency.value = f
  b.frequency.value = f * 2
  const bg = c.createGain()
  bg.gain.value = 0.35
  a.connect(g)
  b.connect(bg).connect(g)
  g.connect(master!)
  a.start()
  b.start()
  const stop = () => {
    a.stop()
    b.stop()
    g.disconnect()
  }
  a.onended = () => voices.get(p)?.g === g && voices.delete(p)
  a.stop(c.currentTime + decay + 0.05)
  b.stop(c.currentTime + decay + 0.05)
  voices.set(p, { g, stop })
}

export function noteOff(p: number, hard = false) {
  const v = voices.get(p)
  if (!v || !ctx) return
  const t = ctx.currentTime
  v.g.gain.cancelScheduledValues(t)
  v.g.gain.setValueAtTime(v.g.gain.value, t)
  v.g.gain.exponentialRampToValueAtTime(0.0005, t + (hard ? 0.02 : 0.25))
  voices.delete(p)
}
