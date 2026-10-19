// Original MIDI fixtures and metrics for the notation layer. Test support only: nothing here ships.
import { Midi } from '@tonejs/midi'
import type { Hand, Song } from './song'

export const PPQ = 480

/** What the player meant: absolute quarter-note position of an onset, so a quantizer can be marked. */
export interface Truth {
  p: number
  tick: number // as played, jitter included
  at: number // as meant, in quarters from tick 0
  hand: Hand
  grace?: boolean
}
export interface Fixture {
  buf: ArrayBuffer
  truth: Truth[]
  bars?: number // bars the player meant
  pickup?: number // quarters in the meant pickup bar
}

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

class Writer {
  midi = new Midi()
  track = this.midi.addTrack()
  truth: Truth[] = []
  constructor(public jitter = 0, public drift: (at: number) => number = () => 0, seed = 1, bpm = 72, sig: [number, number] = [4, 4]) {
    this.rand = rng(seed)
    this.midi.header.setTempo(bpm)
    this.midi.header.timeSignatures.push({ ticks: 0, timeSignature: sig })
    this.bpm = bpm
  }
  rand: () => number
  bpm: number
  ms(ms: number) {
    return Math.round((ms / 1000) * (this.bpm / 60) * PPQ)
  }
  /** One note: `at` and `len` in quarters; the performance adds jitter, drift and an optional release. */
  add(p: number, at: number, len: number, hand: Hand, o: { end?: number; roll?: number; grace?: boolean; exact?: boolean } = {}) {
    const j = o.exact ? 0 : Math.round((this.rand() * 2 - 1) * this.ms(this.jitter))
    const tick = Math.max(0, Math.round(at * PPQ + j + this.ms(this.drift(at) * 1000) + (o.roll ?? 0)))
    const end = o.end ?? at + len
    const dur = o.grace ? this.ms(40) : Math.max(8, Math.round(end * PPQ - at * PPQ - j))
    this.track.addNote({ midi: p, ticks: tick, durationTicks: dur, velocity: 0.7 })
    this.truth.push({ p, tick, at, hand, grace: o.grace })
  }
  done(extra: Partial<Fixture> = {}): Fixture {
    return { buf: this.midi.toArray().buffer as ArrayBuffer, truth: this.truth, ...extra }
  }
}

const MEL_BARS: [number, number][][] = [
  [[0, 1], [1, 0.5], [1.5, 0.5], [2, 1], [3, 1]],
  [[0, 1.5], [1.5, 0.5], [2, 2]],
  [[0, 2], [2, 1], [3, 1]],
  [[0, 0.5], [0.5, 0.5], [1, 1], [2, 0.5], [2.5, 0.5], [3, 1]],
]
const MEL = [69, 72, 74, 73, 77, 76, 74, 72, 70, 69, 74, 79, 77, 74, 73, 69] // D minor, C sharp 73 and B flat 70
const ROOTS = [38, 34 + 12, 41, 36 + 12] // D, B flat, F, C (one octave up where it would go below A0 range of interest)

/** 16 bars of 4/4 at 72 bpm: LH sixteenth arpeggios then triplet eighths, pedal rings to the barline, melody, rolled chords, graces, a quarter-note triplet. */
export function pianoHuman(jitter = 30, drift = 70, seed = 7): Fixture {
  const w = new Writer(jitter, (at) => (Math.sin((at / 32) * Math.PI * 2) * drift) / 1000, seed)
  let m = 0
  for (let bar = 0; bar < 16; bar++) {
    const b0 = bar * 4
    const root = ROOTS[bar % 4]
    const tones = [0, 7, 12, bar % 2 ? 16 : 15].map((x) => Math.min(root + x, 59))
    const pedal = bar % 2 === 0
    const step = bar < 8 ? 0.25 : 1 / 3
    for (let i = 0; i * step < 4 - 1e-9; i++) {
      const at = b0 + i * step
      w.add(tones[i % 4], at, step * 1.1, 'L', { end: pedal ? b0 + 3.95 : undefined })
    }
    if (bar % 4 === 3) {
      for (const [k, p] of [69, 74, 77].entries()) w.add(p, b0, 1.5, 'R', { roll: w.ms(15 * k), end: b0 + 1.4 })
      w.add(76, b0 + 2, 1, 'R')
      w.add(74, b0 + 3, 1, 'R')
      continue
    }
    if (bar === 6) {
      for (const [k, at] of [0, 2 / 3, 4 / 3].entries()) w.add(MEL[(m + k) % 16], b0 + at, 2 / 3, 'R', { end: b0 + at + 0.6 })
      w.add(72, b0 + 2, 2, 'R')
      continue
    }
    for (const [at, len] of MEL_BARS[bar % 4]) {
      const p = MEL[m++ % 16]
      if (bar === 2 && at === 2) w.add(p - 2, b0 + at - 0.1, 0.05, 'R', { grace: true })
      w.add(p, b0 + at, len, 'R', { end: b0 + at + len * 1.08 })
    }
  }
  return w.done({ bars: 16 })
}

/** Quarters and eighths, exact ticks, 100 bpm speeding up mid-bar then a ritardando 100 to 50 in one-beat steps. */
export function ritard(jitter = 0): Fixture {
  const w = new Writer(jitter, () => 0, 3, 100)
  const t = w.midi.header.tempos
  t.length = 0
  t.push({ ticks: 0, bpm: 100 } as never, { ticks: 6 * PPQ, bpm: 120 } as never)
  for (let b = 32; b < 44; b++) t.push({ ticks: b * PPQ, bpm: 100 - (50 * (b - 32)) / 11 } as never)
  w.midi.header.update()
  for (let bar = 0; bar < 12; bar++) {
    const b0 = bar * 4
    for (let i = 0; i < 8; i++) w.add(48 + [0, 7, 12, 7][i % 4], b0 + i / 2, 0.5, 'L', { exact: !jitter, end: b0 + i / 2 + 0.55 })
    for (const [at, len] of MEL_BARS[bar % 4]) w.add(72 + (bar + at) % 7, b0 + at, len, 'R', { exact: !jitter })
  }
  return w.done({ bars: 12 })
}

/** 3/4 waltz, one-beat pickup collapsed to tick 0 (the DAW-less export). */
export function waltz(jitter = 0, padded = false): Fixture {
  const w = new Writer(jitter, () => 0, 11, 96, [3, 4])
  const lead = 1 // the pickup is the beat before the first meant downbeat
  const at = (x: number) => x + (padded ? 2 : 0) // padded: two beats of silence first, so the barlines are already right
  w.add(76, at(0), 1, 'R', { end: at(0) + 0.9 })
  for (let bar = 0; bar < 8; bar++) {
    const b0 = lead + bar * 3
    w.add(bar % 2 ? 43 : 48, at(b0), 3, 'L', { end: at(b0) + 2.9 }) // a bass whole bar
    for (const k of [1, 2]) w.add(bar % 2 ? 62 : 64, at(b0 + k), 1, 'L', { end: at(b0 + k) + 0.9 })
    if (bar % 2 === 0) w.add(79 - (bar % 4), at(b0), 3, 'R', { end: at(b0) + 2.9 })
    else for (const k of [0, 1, 2]) w.add(77 - k, at(b0 + k), 1, 'R', { end: at(b0 + k) + 0.9 })
  }
  const fin = lead + 8 * 3
  w.add(48, at(fin), 3, 'L')
  w.add(72, at(fin), 3, 'R')
  return w.done({ pickup: padded ? undefined : 1, bars: 9 })
}

/** 6/8, one-eighth pickup at tick 0, flowing eighths over dotted-quarter bass. */
export function sixEight(jitter = 0): Fixture {
  const w = new Writer(jitter, () => 0, 5, 84, [6, 8])
  w.add(67, 0, 0.5, 'R', { end: 0.45 })
  for (let bar = 0; bar < 8; bar++) {
    const b0 = 0.5 + bar * 3
    w.add(43, b0, 1.5, 'L', { end: b0 + 1.45 })
    w.add(50, b0 + 1.5, 1.5, 'L', { end: b0 + 2.95 })
    for (let i = 0; i < 6; i++) w.add(67 + [0, 2, 4, 5, 7, 9][(i + bar) % 6], b0 + i / 2, 0.5, 'R', { end: b0 + i / 2 + 0.45 })
  }
  w.add(43, 0.5 + 24, 3, 'L')
  w.add(67, 0.5 + 24, 3, 'R')
  return w.done({ pickup: 0.5, bars: 9 })
}

/** 3/4 for four bars then 4/4 for four, with a slowdown mid-bar; eighths over a bar-long bass. */
export function mixed(jitter = 0): Fixture {
  const w = new Writer(jitter, () => 0, 9, 90, [3, 4])
  w.midi.header.timeSignatures.push({ ticks: 12 * PPQ, timeSignature: [4, 4] } as never)
  w.midi.header.tempos.push({ ticks: 18 * PPQ, bpm: 70 } as never)
  w.midi.header.update()
  for (const [at, len] of [[0, 3], [3, 3], [6, 3], [9, 3], [12, 4], [16, 4], [20, 4], [24, 4]]) w.add(48, at, len, 'L', { exact: !jitter, end: at + len - 0.05 })
  for (let i = 0; i < 56; i++) w.add(72 + (i % 5), i / 2, 0.5, 'R', { exact: !jitter, end: i / 2 + 0.45 })
  return w.done()
}

/** The orchestral-style file from midi-tracks.test.ts: melody, harp arpeggio, held pads, drums; exact ticks, 120 bpm. */
export function orchestral(): ArrayBuffer {
  const m = new Midi()
  m.header.setTempo(120)
  const add = (name: string, program: number, channel: number, f: (t: ReturnType<Midi['addTrack']>) => void) => {
    const t = m.addTrack()
    t.name = name
    t.channel = channel
    t.instrument.number = program
    f(t)
  }
  add('Flute', 73, 0, (t) => {
    for (let i = 0; i < 64; i++) t.addNote({ midi: 72 + (i % 5), time: i * 0.5, duration: 0.45, velocity: 0.7 })
  })
  add('Harp', 46, 1, (t) => {
    for (let i = 0; i < 256; i++) t.addNote({ midi: 48 + [0, 4, 7, 12][i % 4] + (i % 8 > 3 ? 12 : 0), time: i * 0.125, duration: 0.12, velocity: 0.5 })
  })
  for (const [k, name] of ['Strings A', 'Strings B', 'Strings C'].entries())
    add(name, 48, 2 + k, (t) => {
      for (let i = 0; i < 16; i++) for (const p of [40, 47, 52, 55, 59]) t.addNote({ midi: p + k, time: i * 2, duration: 2, velocity: 0.6 })
    })
  add('Drums', 0, 9, (t) => {
    for (let i = 0; i < 64; i++) t.addNote({ midi: 36, time: i * 0.5, duration: 0.1, velocity: 0.8 })
  })
  return m.toArray().buffer as ArrayBuffer
}

// ---- metrics, defined on the performance fields so they run before and after the notation layer ----

const VALUES = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25] // the staff's own quant()
const quant = (b: number) => VALUES.reduce((a, v) => (Math.abs(v - b) < Math.abs(a - b) ? v : a))

export interface Metrics {
  notes: number
  chords: number // distinct (hand, onset) groups
  crossing: number // notes whose written value runs past the barline untied
  overfull: number // chords whose written value runs past the next chord in the same hand
  overfullPct: number
}

const qlOf = (s: Song, i: number) => s.bars[i].ql ?? (s.bars[i].n * 4) / s.bars[i].den

/** `after` reads the notation layer; otherwise it replays what the staff does today with t and beats. */
export function measure(s: Song, after: boolean): Metrics {
  let crossing = 0
  const groups = new Map<string, { at: number; end: number; hand: Hand; voice: number }>()
  const spans: Record<string, { at: number; end: number }[]> = {}
  for (const n of s.notes) {
    if (n.grace) continue
    const b = s.bars[n.bar]
    const q = (b.t1 - b.t0) / qlOf(s, n.bar)
    const at = after ? n.qb! : (n.t - b.t0) / q
    const len = after ? n.qd! : quant(n.beats)
    if (at + len > qlOf(s, n.bar) + 0.01 && !(after && n.tieNext)) crossing++
    const abs = s.bars.slice(0, n.bar).reduce((a, _, i) => a + qlOf(s, i), 0) + at
    const voice = after ? (n.voice ?? 1) : 1
    const key = `${n.h}:${voice}:${after ? abs.toFixed(3) : Math.round(n.t * 100)}`
    const g = groups.get(key)
    if (g) g.end = after ? Math.max(g.end, abs + len) : Math.min(g.end, abs + len)
    else groups.set(key, { at: abs, end: abs + len, hand: n.h, voice })
  }
  for (const [k, g] of groups) (spans[k.split(':').slice(0, 2).join(':')] ??= []).push(g)
  let overfull = 0
  for (const list of Object.values(spans)) {
    list.sort((a, b) => a.at - b.at)
    list.forEach((g, i) => {
      if (i + 1 < list.length && g.end > list[i + 1].at + 0.02) overfull++
    })
  }
  return { notes: s.notes.length, chords: groups.size, crossing, overfull, overfullPct: overfull / Math.max(1, groups.size) }
}
