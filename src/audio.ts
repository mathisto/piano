import { PIANO, instrument, type Instrument, type Root } from './instruments'
import { served } from './net'
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
    const room = ctx.createConvolver() // a small hall under every instrument: a dry sample sounds like a sample
    room.buffer = hall(ctx)
    const wet = ctx.createGain()
    wet.gain.value = 0.2
    master.connect(room).connect(wet).connect(ctx.destination)
  }
  if (ctx.state !== 'running') void ctx.resume() // iOS reports `interrupted` after a call, Siri or lock, and needs this too
  master!.gain.value = settings.volume * 0.5
  return ctx
}

/** Two seconds of decaying noise that darkens as it dies: the impulse response of a mid-sized room. */
function hall(c: AudioContext): AudioBuffer {
  const len = Math.floor(c.sampleRate * 1.9)
  const b = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch)
    let lp = 0
    for (let i = 0; i < len; i++) {
      const t = i / c.sampleRate
      lp += (Math.random() * 2 - 1 - lp) * (0.85 - 0.7 * (i / len)) // one-pole lowpass that closes over time
      d[i] = lp * Math.exp((-6.9 * t) / 1.7) * Math.min(1, t / 0.012)
    }
  }
  return b
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
      const get = async (r: Root, k?: number) => {
        const file = k === undefined ? r.name : `${r.name}-${k}`
        try {
          const res = await fetch(`${base}${file}.mp3`)
          if (!served(res)) throw new Error(String(res.status))
          buffers.set(`${inst.base}/${file}`, await c.decodeAudioData(await res.arrayBuffer()))
          return 1
        } catch {
          return 0 /* a missing sample falls back to the synth for that note */
        }
      }
      const mid = inst.layers ? Math.floor((inst.layers - 1) / 2) : undefined
      const layer = async (k?: number) => {
        let n = 0
        for (let i = 0; i < inst.roots.length; i += 4) n += (await Promise.all(inst.roots.slice(i, i + 4).map((r) => get(r, k)))).reduce<number>((a, b) => a + b, 0) // four at a time
        return n
      }
      const ok = await layer(mid)
      states.set(inst.id, ok ? 'ready' : 'failed')
      if (ok < inst.roots.length) console.warn(`${inst.id}: ${ok} of ${inst.roots.length} recordings loaded`)
      if (ok && inst.layers) void (async () => {
        for (let k = 0; k < inst.layers!; k++) if (k !== mid) await layer(k) // soft and hard follow the medium one
      })()
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

/** `after` seconds from now on the audio clock. currentTime only moves in output-buffer steps, so the clock is read from the output timestamp, which pairs a context time with a performance.now() one; that keeps a click's jitter below a render quantum. A pair that disagrees with currentTime by over 100 ms is not trusted. */
function audioTime(c: AudioContext, after: number): number {
  const o = c.getOutputTimestamp?.()
  const t = o?.contextTime && o.performanceTime ? o.contextTime + (performance.now() - o.performanceTime) / 1000 + after : 0
  return Math.abs(t - c.currentTime - after) < 0.1 ? t : c.currentTime + after
}

/** A wood-block tick: a short noise knock on a pair of dying tones, lower on the first beat. `after` seconds from now, on the audio clock, so the beat does not wait for an animation frame. `soft` scales the level (the metronome's eighths). */
export function click(accent: boolean, after = 0, force = false, soft = 1) {
  const level = force ? settings.click || 0.6 : settings.click // the rhythm trainer needs its click even when the count-in is silent
  if (level <= 0) return
  const c = ready()
  const t = audioTime(c, after)
  const out = c.createGain()
  out.gain.value = level * 0.7 * (accent ? 1 : 0.7) * soft
  out.connect(c.destination)
  const f = accent ? 760 : 1130
  for (const [mult, amp, len] of [[1, 0.9, 0.07], [2.7, 0.35, 0.03]]) {
    const o = c.createOscillator()
    const g = c.createGain()
    o.frequency.value = f * mult
    g.gain.setValueAtTime(amp, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + len)
    o.connect(g).connect(out)
    o.start(t)
    o.stop(t + len + 0.01)
  }
  const knock = c.createBufferSource() // the 5 ms of wood meeting wood
  const n = c.createBuffer(1, Math.floor(c.sampleRate * 0.005), c.sampleRate)
  n.getChannelData(0).forEach((_, i, d) => (d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)))
  knock.buffer = n
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 2600
  const kg = c.createGain()
  kg.gain.value = 0.7
  knock.connect(bp).connect(kg).connect(out)
  knock.start(t)
}

/** A hand clap for the rhythm trainer: two short bursts of band-passed noise a few ms apart, on the audio clock. */
export function clap(after = 0) {
  const c = ready()
  const t = c.currentTime + after
  const out = c.createGain()
  out.gain.value = 0.9
  out.connect(c.destination)
  for (const d of [0, 0.012, 0.026]) {
    const n = c.createBuffer(1, Math.floor(c.sampleRate * 0.09), c.sampleRate)
    n.getChannelData(0).forEach((_, i, a) => (a[i] = (Math.random() * 2 - 1) * (1 - i / a.length) ** 2))
    const src = c.createBufferSource()
    src.buffer = n
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1500
    bp.Q.value = 0.8
    src.connect(bp).connect(out)
    src.start(t + d)
  }
}

/** The velocities a set of recordings at different strengths stands for, soft to hard. */
const layerAt = (n: number) => (n >= 3 ? [0.22, 0.54, 0.85] : n === 2 ? [0.3, 0.78] : [0.5])

/** The recordings a hit of this strength blends, as [layer, gain]: the near ones, equal-power. */
export function mix(vel: number, have: (k: number) => boolean, layers = 3): [number, number][] {
  const at = layerAt(layers)
  const ks = at.map((_, k) => k).filter(have)
  if (!ks.length) return []
  const w = ks.map((k) => Math.max(0, 1 - Math.abs(vel - at[k]) / 0.33))
  const sum = w.reduce((a, b) => a + b, 0)
  if (sum === 0) return [[ks.reduce((a, b) => (Math.abs(vel - at[b]) < Math.abs(vel - at[a]) ? b : a)), 1]]
  return ks.map((k, i): [number, number] => [k, Math.sqrt(w[i] / sum)]).filter(([, g]) => g > 0)
}

function sampleVoice(c: AudioContext, inst: Instrument, p: number, vel: number): Voice | undefined {
  if (!inst.roots.length) return undefined // the synth has no recordings to pick from
  const s = pickSample(p, inst)
  const key = `${inst.base}/${s.name}`
  const parts = (inst.layers ? mix(vel, (k) => buffers.has(`${key}-${k}`), inst.layers).map(([k, w]) => [buffers.get(`${key}-${k}`)!, w] as const) : buffers.has(key) ? [[buffers.get(key)!, 1] as const] : [])
  if (!parts.length) return undefined
  const k = inst.dyn
  const lp = c.createBiquadFilter() // soft hits are darker, hard hits brighter
  lp.type = 'lowpass'
  lp.frequency.value = 2500 + 12000 * (1 - k + k * vel)
  const g = c.createGain()
  g.gain.value = inst.gain * (1 - k + k * (0.12 + 0.88 * vel ** 1.6))
  lp.connect(g).connect(master!)
  const srcs = parts.map(([buf, w]) => {
    const src = c.createBufferSource()
    src.buffer = buf
    src.playbackRate.value = s.rate
    if (s.loop) {
      src.loop = true
      ;[src.loopStart, src.loopEnd] = s.loop
    }
    const pg = c.createGain()
    pg.gain.value = w
    src.connect(pg).connect(lp)
    src.start()
    if (s.loop) src.stop(c.currentTime + 30) // ponytail: a note nobody releases stops after 30 s instead of droning on
    return src
  })
  srcs[0].onended = () => {
    if (voices.get(p)?.g === g) voices.delete(p)
    g.disconnect()
  }
  return { g, end: (t) => srcs.forEach((x) => x.stop(t)), release: inst.release }
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

/** `as` is another instrument for this one note (the app's voice line on strings); until it has loaded the chosen instrument plays it. */
export function noteOn(p: number, vel: number, force = false, as?: string) {
  if (!settings.sound && !force) return
  const c = ready()
  noteOff(p, true)
  while (voices.size >= 40) noteOff(voices.keys().next().value as number, true) // cap polyphony
  let inst = instrument(as ?? settings.instrument)
  if (loadState(inst.id) === 'idle') void preload(inst.id) // a failed load is retried by unlock() or the picker, not by every note
  if (as && loadState(inst.id) !== 'ready') inst = instrument(settings.instrument)
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
