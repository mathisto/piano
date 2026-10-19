import { Midi } from '@tonejs/midi'

export type Hand = 'R' | 'L'

export interface Note {
  id: number
  t: number // seconds at 100% tempo
  d: number
  p: number // MIDI pitch
  v: number // 0..1
  h: Hand
  bar: number
  beats: number // duration in quarter notes
  flat?: boolean // a black key the source wants written as a flat (drills); otherwise spelled by the key
  want?: [number, number] // key velocity range (1..127) this note is meant to be played in; technique exercises set it
}

export interface Bar {
  i: number
  t0: number
  t1: number
  n: number // time signature numerator
  den: number
}

export interface Song {
  id: string
  title: string
  notes: Note[]
  bars: Bar[]
  end: number
  fifths: number // key signature, -7..7
  lo: number
  hi: number
  spb: number // seconds per quarter note, first bar
}

export interface Raw {
  t: number
  d: number
  p: number
  v: number
  track: number
  h?: Hand // set when the source already knows the hand
  flat?: boolean
  want?: [number, number]
}

/** Hands: two tracks -> lower mean pitch is left; anything else splits at `split`. */
function assignHands(raw: Raw[], split: number): Hand[] {
  const tracks = [...new Set(raw.map((r) => r.track))]
  let base: Hand[]
  if (tracks.length === 2) {
    const mean = (k: number) => {
      const xs = raw.filter((r) => r.track === k)
      return xs.reduce((s, r) => s + r.p, 0) / xs.length
    }
    const left = mean(tracks[0]) <= mean(tracks[1]) ? tracks[0] : tracks[1]
    base = raw.map((r) => (r.track === left ? 'L' : 'R'))
  } else base = raw.map((r) => (r.p >= split ? 'R' : 'L'))
  return raw.map((r, i) => r.h ?? base[i]) // a hand the source states wins
}

export function barAt(bars: Bar[], t: number): number {
  let lo = 0
  let hi = bars.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (bars[mid].t0 <= t) lo = mid
    else hi = mid - 1
  }
  return lo
}

export function build(
  id: string,
  title: string,
  raw: Raw[],
  bars: Bar[],
  fifths: number,
  split = 60,
): Song {
  const hands = assignHands(raw, split)
  const notes: Note[] = raw
    .map((r, k) => ({ r, h: hands[k] }))
    .sort((a, b) => a.r.t - b.r.t || a.r.p - b.r.p)
    .map(({ r, h }, id) => {
      const bar = barAt(bars, r.t + 1e-6)
      const b = bars[bar]
      const q = (b.t1 - b.t0) / ((b.n * 4) / b.den)
      return { id, t: r.t, d: r.d, p: r.p, v: r.v, h, bar, beats: r.d / q, flat: r.flat, want: r.want }
    })
  const last = notes.reduce((m, n) => Math.max(m, n.t + n.d), 0)
  const b0 = bars[0]
  return {
    id,
    title,
    notes,
    bars,
    end: Math.max(last, bars[bars.length - 1].t1),
    fifths,
    lo: notes.reduce((m, n) => Math.min(m, n.p), 127),
    hi: notes.reduce((m, n) => Math.max(m, n.p), 0),
    spb: (b0.t1 - b0.t0) / ((b0.n * 4) / b0.den),
  }
}

const MAJOR_FIFTHS: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
  F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
}

function keyToFifths(key: string, scale: string): number {
  const maj = MAJOR_FIFTHS[key] ?? 0
  return scale === 'minor' ? maj - 3 : maj
}

/** Krumhansl-Schmuckler over pitch-class durations; returns fifths of the best major/minor key. */
export function estimateFifths(raw: { p: number; d: number }[]): number {
  const maj = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
  const min = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
  const h = new Array(12).fill(0)
  for (const r of raw) h[r.p % 12] += r.d
  const corr = (prof: number[], tonic: number) => {
    const xs = h.map((_, i) => h[(i + tonic) % 12])
    const mx = xs.reduce((a, b) => a + b, 0) / 12
    const mp = prof.reduce((a, b) => a + b, 0) / 12
    let num = 0, dx = 0, dp = 0
    for (let i = 0; i < 12; i++) {
      num += (xs[i] - mx) * (prof[i] - mp)
      dx += (xs[i] - mx) ** 2
      dp += (prof[i] - mp) ** 2
    }
    return num / Math.sqrt(dx * dp || 1)
  }
  let best = { s: -2, f: 0 }
  const majFifths = [0, -5, 2, -3, 4, -1, 6, 1, -4, 3, -2, 5] // tonic pc -> fifths of major key
  for (let pc = 0; pc < 12; pc++) {
    const a = corr(maj, pc)
    if (a > best.s) best = { s: a, f: majFifths[pc] }
    const b = corr(min, pc)
    if (b > best.s) best = { s: b, f: majFifths[(pc + 3) % 12] }
  }
  return best.f
}

export function fromMidi(buf: ArrayBuffer, title: string, id: string, split = 60): Song {
  const midi = new Midi(buf)
  const raw: Raw[] = []
  midi.tracks.forEach((tr, track) => {
    if (tr.instrument.percussion) return
    for (const n of tr.notes) {
      raw.push({ t: n.time, d: Math.max(n.duration, 0.03), p: n.midi, v: n.velocity, track })
    }
  })
  if (!raw.length) throw new Error('No notes found in this file.')

  const ppq = midi.header.ppq
  const sigs = midi.header.timeSignatures.length
    ? midi.header.timeSignatures
    : [{ ticks: 0, timeSignature: [4, 4] }]
  const endTick = midi.header.secondsToTicks(Math.max(...raw.map((r) => r.t + r.d)))
  const bars: Bar[] = []
  let tick = 0
  let si = 0
  while (tick <= endTick && bars.length < 5000) {
    while (si + 1 < sigs.length && sigs[si + 1].ticks <= tick) si++
    const [n, den] = sigs[si].timeSignature
    const len = Math.round((n * 4 * ppq) / den)
    bars.push({
      i: bars.length,
      t0: midi.header.ticksToSeconds(tick),
      t1: midi.header.ticksToSeconds(tick + len),
      n,
      den,
    })
    tick += len
  }
  const ks = midi.header.keySignatures[0]
  const fifths = ks?.key ? keyToFifths(ks.key, ks.scale) : estimateFifths(raw)
  return build(id, title, raw, bars, fifths, split)
}

// ---- tiny text format for the starter songs: "C4:1 E4+G4:2 R:1" (name[+name]:beats) ----

const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

export function parseName(s: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(s)
  if (!m) throw new Error(`bad note name: ${s}`)
  return 12 * (Number(m[3]) + 1) + LETTER_PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0)
}

export interface Spec {
  id: string
  title: string
  bpm: number
  sig?: [number, number]
  fifths: number
  rh: string
  lh: string
}

export function fromSpec(s: Spec): Song {
  const [n, den] = s.sig ?? [4, 4]
  const q = 60 / s.bpm
  const raw: Raw[] = []
  let total = 0
  ;[s.rh, s.lh].forEach((line, track) => {
    let beat = 0
    for (const tok of line.trim().split(/\s+/)) {
      const [names, dur] = tok.split(':')
      const len = Number(dur)
      if (!(len > 0)) throw new Error(`bad token: ${tok}`)
      if (names !== 'R') {
        for (const nm of names.split('+')) {
          raw.push({ t: beat * q, d: len * q * 0.95, p: parseName(nm), v: 0.7, track })
        }
      }
      beat += len
    }
    total = Math.max(total, beat)
  })
  const barQ = (n * 4) / den
  const count = Math.ceil(total / barQ - 1e-9)
  const bars: Bar[] = Array.from({ length: count }, (_, i) => ({
    i,
    t0: i * barQ * q,
    t1: (i + 1) * barQ * q,
    n,
    den,
  }))
  return build(s.id, s.title, raw, bars, s.fifths)
}
