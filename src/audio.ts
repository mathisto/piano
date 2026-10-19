import { settings } from './settings'

let ctx: AudioContext | undefined
let master: GainNode | undefined

interface Voice {
  g: GainNode
  end: (when: number) => void
}
const voices = new Map<number, Voice>() // by pitch, oldest first

function ready(): AudioContext {
  if (!ctx) {
    ;(navigator as unknown as { audioSession?: { type: string } }).audioSession?.type && ((navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'playback') // iOS: not muted by the silent switch
    ctx = new AudioContext({ latencyHint: 'interactive' })
    master = ctx.createGain()
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  master!.gain.value = settings.volume * 0.5
  return ctx
}

// ---- sampled grand piano: Salamander V3, one recording every third semitone, pitched to fit ----

const NAMES: [string, number][] = [['C', 0], ['Ds', 3], ['Fs', 6], ['A', 9]]
export const ROOTS: { name: string; midi: number }[] = [
  { name: 'A0', midi: 21 },
  ...[1, 2, 3, 4, 5, 6, 7].flatMap((o) => NAMES.map(([n, pc]) => ({ name: `${n}${o}`, midi: 12 * (o + 1) + pc }))),
  { name: 'C8', midi: 108 },
]

/** The recording closest to a pitch, and the playback rate that bends it there. */
export function pickSample(p: number): { name: string; rate: number } {
  const r = ROOTS.reduce((a, b) => (Math.abs(b.midi - p) < Math.abs(a.midi - p) ? b : a))
  return { name: r.name, rate: 2 ** ((p - r.midi) / 12) }
}

const buffers = new Map<string, AudioBuffer>()
export const piano = { state: 'idle' as 'idle' | 'loading' | 'ready' | 'failed' }
let loading: Promise<void> | undefined

/** Fetch and decode the piano (about 2 MB). Until it lands, the simple synth covers. */
export function preload(): Promise<void> {
  if (settings.instrument !== 'piano') return Promise.resolve()
  loading ??= (async () => {
    piano.state = 'loading'
    const c = ready()
    const base = `${import.meta.env.BASE_URL}samples/salamander/`
    let ok = 0
    await Promise.all(
      ROOTS.map(async (r) => {
        try {
          const res = await fetch(`${base}${r.name}.mp3`)
          if (!res.ok) throw new Error(String(res.status))
          buffers.set(r.name, await c.decodeAudioData(await res.arrayBuffer()))
          ok++
        } catch {
          /* a missing sample falls back to its neighbour's synth voice */
        }
      }),
    )
    piano.state = ok === ROOTS.length ? 'ready' : ok ? 'ready' : 'failed'
    if (!ok) loading = undefined // let a later try fetch again
  })()
  return loading
}

/** Call from a user gesture so the browser lets us make sound. */
export function unlock() {
  ready()
  void preload()
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

function sampleVoice(c: AudioContext, p: number, vel: number): Voice | undefined {
  const s = pickSample(p)
  const buf = buffers.get(s.name)
  if (!buf) return undefined
  const src = c.createBufferSource()
  src.buffer = buf
  src.playbackRate.value = s.rate
  const lp = c.createBiquadFilter() // soft hits are darker, hard hits brighter
  lp.type = 'lowpass'
  lp.frequency.value = 2500 + 12000 * vel
  const g = c.createGain()
  g.gain.value = 0.12 + 0.88 * vel ** 1.6
  src.connect(lp).connect(g).connect(master!)
  src.start()
  src.onended = () => {
    if (voices.get(p)?.g === g) voices.delete(p)
    g.disconnect()
  }
  return { g, end: (t) => src.stop(t) }
}

// ponytail: two-partial synth, kept as the fallback while the piano loads and as a second instrument choice.
function synthVoice(c: AudioContext, p: number, vel: number): Voice {
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
  a.onended = () => {
    if (voices.get(p)?.g === g) voices.delete(p)
    g.disconnect()
  }
  a.stop(c.currentTime + decay + 0.05)
  b.stop(c.currentTime + decay + 0.05)
  return { g, end: (t) => (a.stop(t), b.stop(t)) }
}

export function noteOn(p: number, vel: number, force = false) {
  if (!settings.sound && !force) return
  const c = ready()
  noteOff(p, true)
  while (voices.size >= 40) noteOff(voices.keys().next().value as number, true) // cap polyphony
  void preload()
  const v = (settings.instrument === 'piano' ? sampleVoice(c, p, vel) : undefined) ?? synthVoice(c, p, vel)
  voices.set(p, v)
}

export function noteOff(p: number, hard = false) {
  const v = voices.get(p)
  if (!v || !ctx) return
  const t = ctx.currentTime
  v.g.gain.cancelScheduledValues(t)
  v.g.gain.setValueAtTime(v.g.gain.value, t)
  v.g.gain.exponentialRampToValueAtTime(0.0005, t + (hard ? 0.02 : 0.3)) // the damper
  try {
    v.end(t + (hard ? 0.03 : 0.35))
  } catch {
    /* already stopped */
  }
  voices.delete(p)
}
