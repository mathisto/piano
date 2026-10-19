import { PIANO, instrument, type Instrument } from './instruments'
import { settings } from './settings'

let ctx: AudioContext | undefined
let master: GainNode | undefined

interface Voice {
  g: GainNode
  end: (when: number) => void
  release: number // damper time on key-up
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

// ---- sampled instruments (instruments.ts): one recording every third semitone, pitched to fit ----

export const ROOTS = PIANO.roots

/** The recording closest to a pitch, and the playback rate that bends it there. */
export function pickSample(p: number, inst: Instrument = PIANO): { name: string; rate: number; loop?: [number, number] } {
  const r = inst.roots.reduce((a, b) => (Math.abs(b.midi - p) < Math.abs(a.midi - p) ? b : a))
  return { name: r.name, rate: 2 ** ((p - r.midi) / 12), loop: r.loop }
}

type State = 'idle' | 'loading' | 'ready' | 'failed'
const buffers = new Map<string, AudioBuffer>() // by "folder/name"
const states = new Map<string, State>()
const loading = new Map<string, Promise<void>>()
export const loadState = (id: string): State => states.get(id) ?? 'idle'

/** Fetch and decode an instrument (the piano is about 2 MB, the rest under 500 KB), only when it is wanted. Until it lands, the simple synth covers; a failed load leaves the synth in charge. */
export function preload(id = settings.instrument): Promise<void> {
  const inst = instrument(id)
  if (!inst.base) return Promise.resolve()
  let p = loading.get(inst.id)
  if (!p) {
    p = (async () => {
      states.set(inst.id, 'loading')
      const c = ready()
      const base = `${import.meta.env.BASE_URL}samples/${inst.base}/`
      let ok = 0
      await Promise.all(
        inst.roots.map(async (r) => {
          try {
            const res = await fetch(`${base}${r.name}.mp3`)
            if (!res.ok) throw new Error(String(res.status))
            buffers.set(`${inst.base}/${r.name}`, await c.decodeAudioData(await res.arrayBuffer()))
            ok++
          } catch {
            /* a missing sample falls back to the synth for that note */
          }
        }),
      )
      states.set(inst.id, ok ? 'ready' : 'failed')
      if (!ok) loading.delete(inst.id) // let a later try fetch again
    })()
    loading.set(inst.id, p)
  }
  return p
}

/** Call from a user gesture so the browser lets us make sound. */
export function unlock() {
  ready()
  void preload()
}

/** A woodblock metronome click: a deeper tock on the first beat, a higher tick on the rest. It skips the piano's master bus, which sits low. */
export function click(accent: boolean) {
  const c = ready()
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'triangle'
  const f = accent ? 900 : 1500
  o.frequency.setValueAtTime(f * 1.6, c.currentTime)
  o.frequency.exponentialRampToValueAtTime(f, c.currentTime + 0.012)
  g.gain.setValueAtTime(Math.min(1, settings.volume + 0.2) * (accent ? 1 : 0.75), c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.07)
  o.connect(g).connect(c.destination)
  o.start()
  o.stop(c.currentTime + 0.09)
}

function sampleVoice(c: AudioContext, inst: Instrument, p: number, vel: number): Voice | undefined {
  const s = pickSample(p, inst)
  const buf = buffers.get(`${inst.base}/${s.name}`)
  if (!buf) return undefined
  const src = c.createBufferSource()
  src.buffer = buf
  src.playbackRate.value = s.rate
  if (s.loop) {
    src.loop = true
    ;[src.loopStart, src.loopEnd] = s.loop
  }
  const k = inst.dyn
  const lp = c.createBiquadFilter() // soft hits are darker, hard hits brighter
  lp.type = 'lowpass'
  lp.frequency.value = 2500 + 12000 * (1 - k + k * vel)
  const g = c.createGain()
  g.gain.value = inst.gain * (1 - k + k * (0.12 + 0.88 * vel ** 1.6))
  src.connect(lp).connect(g).connect(master!)
  src.start()
  if (s.loop) src.stop(c.currentTime + 30) // ponytail: a note nobody releases stops after 30 s instead of droning on
  src.onended = () => {
    if (voices.get(p)?.g === g) voices.delete(p)
    g.disconnect()
  }
  return { g, end: (t) => src.stop(t), release: inst.release }
}

// ponytail: two-partial synth, kept as the fallback while a sampled instrument loads and as an instrument choice of its own.
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
  return { g, end: (t) => (a.stop(t), b.stop(t)), release: 0.3 }
}

export function noteOn(p: number, vel: number, force = false) {
  if (!settings.sound && !force) return
  const c = ready()
  noteOff(p, true)
  while (voices.size >= 40) noteOff(voices.keys().next().value as number, true) // cap polyphony
  const inst = instrument(settings.instrument)
  if (loadState(inst.id) === 'idle') void preload(inst.id) // a failed load is retried by unlock() or the picker, not by every note
  const v = sampleVoice(c, inst, p, vel) ?? synthVoice(c, p, vel)
  voices.set(p, v)
}

export function noteOff(p: number, hard = false) {
  const v = voices.get(p)
  if (!v || !ctx) return
  const t = ctx.currentTime
  v.g.gain.cancelScheduledValues(t)
  v.g.gain.setValueAtTime(v.g.gain.value, t)
  v.g.gain.exponentialRampToValueAtTime(0.0005, t + (hard ? 0.02 : v.release)) // the damper
  try {
    v.end(t + (hard ? 0.03 : v.release + 0.05))
  } catch {
    /* already stopped */
  }
  voices.delete(p)
}
