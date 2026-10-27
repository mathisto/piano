import { Midi } from '@tonejs/midi'
import type { Selection } from './midi-tracks'
import { notate, quantize } from './quantize'
import { spellWindow } from './spell'

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
  f?: number // fingering 1..5, drawn beside the head: scales set it
  // Notation layer. t, d, beats and bar above stay the performance; these say how to write it. All quarter notes.
  qb?: number // quantized onset from the start of its bar
  qd?: number // written length, snapped to a standard or tuplet value; clipped to the next onset in its voice and to the barline
  qrest?: number // tied note: quarters left to write after the barline; tiedSegments() cuts them per bar
  tuplet?: { num: number; den: number } // {3,2}: written as a triplet, so qd and qb are sounding quarters
  tieNext?: boolean // the written value runs past the barline; the playing note is still one note
  tiePrev?: boolean // set on the continuation pieces tiedSegments() returns, never on a Note
  voice?: 1 | 2 // 2 is a long note held under a moving line in the same hand
  grace?: boolean // an ornament shorter than a 32nd: draw small, don't give it a beat (qb is the note it leads into)
  acc?: -1 | 0 | 1 // accidental to write with: a MIDI black key's, chosen from its neighbours, or a score's written one; spell(p, fifths, acc)
  part?: number // the source part (MusicXML part index, MIDI track) when the piece has several: a voice folded into the right hand stays 'R' but keeps its part
  also?: number // a second part that wrote the same note (a voice the piano doubles): the note is both parts'
  art?: 'stac' | 'ten' | 'acc' // a score's articulation: staccato (or staccatissimo), tenuto, accent
  slur?: boolean // under a slur and joined to the next note of its hand (the slur's last note is not)
}

export interface Bar {
  i: number
  t0: number
  t1: number
  n: number // time signature numerator
  den: number
  ql?: number // length in quarters when it is not n*4/den: a pickup bar
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
  artic?: 'legato' | 'staccato' // technique exercises: how long to hold each note
  keys?: { bar: number; fifths: number }[] // key changes estimated from the notes, first at bar 0; fifths is the best single key
  dyn?: string // technique exercises: soft, medium, hard, cresc, decresc or accent, drawn as dynamics on the staff
  flags?: string[] // what an importer could not do cleanly, for the ingestion pipeline: see scoreFlags in flags.ts
  parts?: string[] // names of the source parts, indexed like Note.part
  curve?: number[] // a score with dynamics marks: the written level (0..1) of each bar, the mean of its notes' v
  wedges?: { t0: number; t1: number; up: boolean }[] // hairpins, by the first and last note under them (seconds); up is a crescendo
  marks?: { t: number; text: string }[] // the dynamic letters a score writes (p, mf, sfz), where it writes them
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
  f?: number // fingering 1..5, scales
  // Clean sources give their rhythm (quarters from the start); a MIDI import gives the quantized onset. Else it is read from t and d.
  q?: number
  dq?: number
  grace?: boolean
  acc?: -1 | 0 | 1
  tuplet?: { num: number; den: number } // a score's own tuplet ratio, so its rhythm is never guessed
  part?: number
  also?: number
  art?: Note['art']
  slur?: boolean
}

/** One track: split at a pitch, but a note near the split follows whichever hand's line is nearest in pitch and time. */
function splitByLine(raw: Raw[], split: number): Hand[] {
  const out: Hand[] = new Array(raw.length)
  const last: Record<Hand, { p: number; t: number } | undefined> = { R: undefined, L: undefined }
  const near = (h: Hand, r: Raw) => (last[h] && r.t - last[h]!.t <= 1.5 ? Math.abs(r.p - last[h]!.p) : Infinity)
  const order = raw.map((_, i) => i).sort((a, b) => raw[a].t - raw[b].t || raw[a].p - raw[b].p)
  for (const i of order) {
    const r = raw[i]
    let h: Hand = r.p >= split ? 'R' : 'L'
    if (Math.abs(r.p - split) <= 3) {
      const dR = near('R', r)
      const dL = near('L', r)
      if (dR < dL && dR <= 7) h = 'R'
      else if (dL < dR && dL <= 7) h = 'L'
    }
    out[i] = h
    last[h] = { p: r.p, t: r.t }
  }
  return out
}

/** Hands: two tracks -> lower mean pitch is left; anything else splits at `split`. */
export function assignHands(raw: Raw[], split: number): Hand[] {
  const tracks = [...new Set(raw.map((r) => r.track))]
  let base: Hand[]
  if (tracks.length === 2) {
    const mean = (k: number) => {
      const xs = raw.filter((r) => r.track === k)
      return xs.reduce((s, r) => s + r.p, 0) / xs.length
    }
    const left = mean(tracks[0]) <= mean(tracks[1]) ? tracks[0] : tracks[1]
    base = raw.map((r) => (r.track === left ? 'L' : 'R'))
  } else base = splitByLine(raw, split)
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

/** A rhythm written as 0.3333 is a third of a quarter; 0.2 (a quintuplet) is not 5/24. */
const onLattice = (x: number) => (Math.abs(Math.round(x * 24) / 24 - x) < 2e-3 ? Math.round(x * 24) / 24 : x)
const barQ = (b: Bar) => b.ql ?? (b.n * 4) / b.den

export function build(
  id: string,
  title: string,
  raw: Raw[],
  bars: Bar[],
  fifths: number,
  split = 60,
): Song {
  const hands = assignHands(raw, split)
  let acc = 0
  const bq = bars.map((b) => ({ q0: (acc += barQ(b)) - barQ(b), ql: barQ(b) }))
  // rhythm: as given, else read off the clock inside the bar (clean sources: drills, exercises)
  const rhythm = raw.map((r, k) => {
    if (r.q !== undefined) return { q: r.tuplet ? r.q : onLattice(r.q), dq: r.dq ?? r.d, hand: hands[k], grace: r.grace, tuplet: r.tuplet }
    const i = barAt(bars, r.t + 1e-6)
    const qs = (bars[i].t1 - bars[i].t0) / barQ(bars[i])
    return { q: bq[i].q0 + Math.round(((r.t - bars[i].t0) / qs) * 24) / 24, dq: r.d / qs, hand: hands[k] }
  })
  const written = notate(rhythm, bq)
  const notes: Note[] = raw
    .map((r, k) => ({ r, h: hands[k], w: written[k] }))
    .sort((a, b) => a.r.t - b.r.t || a.r.p - b.r.p)
    .map(({ r, h, w }, id) => {
      const b = bars[w.bar]
      const q = (b.t1 - b.t0) / barQ(b)
      return { id, t: r.t, d: r.d, p: r.p, v: r.v, h, beats: r.d / q, flat: r.flat, want: r.want, ...(r.f && { f: r.f }), ...w, ...(r.acc !== undefined && { acc: r.acc }), ...(r.part !== undefined && { part: r.part }), ...(r.also !== undefined && { also: r.also }), ...(r.art && { art: r.art }), ...(r.slur && { slur: true }) }
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
    spb: (b0.t1 - b0.t0) / barQ(b0),
  }
}

const MAJOR_FIFTHS: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
  F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
}

/** The MIDI reader names the major key that has the signature, for a minor piece too (C minor arrives as 'Eb'), so the scale needs no correction. */
function keyToFifths(key: string): number {
  return MAJOR_FIFTHS[key] ?? 0
}

const KS_MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
const KS_MIN = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
const MAJ_FIFTHS = [0, -5, 2, -3, 4, -1, 6, 1, -4, 3, -2, 5] // tonic pc -> fifths of the major key

/** Krumhansl-Schmuckler over a pitch-class histogram; the best major/minor key as fifths, with its correlation. */
function ks(h: number[]): { f: number; s: number } {
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
  for (let pc = 0; pc < 12; pc++) {
    const a = corr(KS_MAJ, pc)
    if (a > best.s) best = { s: a, f: MAJ_FIFTHS[pc] }
    const b = corr(KS_MIN, pc)
    if (b > best.s) best = { s: b, f: MAJ_FIFTHS[(pc + 3) % 12] }
  }
  return best
}

/** An onset counts once, a long note a little more (capped at a quarter note's worth), so a held pedal tone cannot outvote the tune. */
const keyWeight = (len: number) => 1 + Math.min(len, 1)

export function estimateFifths(raw: { p: number; d: number; dq?: number }[]): number {
  const h = new Array(12).fill(0)
  for (const r of raw) h[r.p % 12] += keyWeight(r.dq ?? r.d)
  return ks(h).f
}

/** The key per stretch of bars: best key of a sliding window, with stretches under four bars folded into their neighbour. */
export function estimateKeys(notes: Note[], nbars: number, win = 8): { bar: number; fifths: number }[] {
  const per = Array.from({ length: nbars }, () => new Array(12).fill(0))
  for (const n of notes) per[n.bar][n.p % 12] += keyWeight(n.qd ?? n.beats)
  const f = per.map((_, b) => {
    const h = new Array(12).fill(0)
    for (let i = Math.max(0, b - win / 2); i < Math.min(nbars, b + win / 2); i++) per[i].forEach((v, k) => (h[k] += v))
    return h.some((v) => v) ? ks(h).f : NaN
  })
  const runs: { bar: number; fifths: number }[] = []
  f.forEach((x, b) => {
    const fifths = Number.isNaN(x) ? (runs[runs.length - 1]?.fifths ?? 0) : x
    if (!runs.length || runs[runs.length - 1].fifths !== fifths) runs.push({ bar: b, fifths })
  })
  for (let again = true; again; ) {
    const i = runs.findIndex((r, j) => runs.length > 1 && (runs[j + 1]?.bar ?? nbars) - r.bar < 4)
    again = i >= 0
    if (again) runs.splice(i, 1)
    for (let j = runs.length - 1; j > 0; j--) if (runs[j].fifths === runs[j - 1].fifths) runs.splice(j, 1)
  }
  runs[0].bar = 0
  return runs
}

export function fromMidi(buf: ArrayBuffer, title: string, id: string, split = 60, pick?: Selection): Song {
  const midi = new Midi(buf)
  const raw: Raw[] = []
  const ticks: { tick: number; dtick: number }[] = []
  midi.tracks.forEach((tr, track) => {
    if (pick ? !pick.tracks.includes(track) : tr.instrument.percussion) return
    for (const n of tr.notes) {
      raw.push({ t: n.time, d: Math.max(n.duration, 0.03), p: n.midi, v: n.velocity, track, h: pick?.hands[track] })
      ticks.push({ tick: n.ticks, dtick: n.durationTicks })
    }
  })
  if (!raw.length) throw new Error('No notes found in this file.')

  const ppq = midi.header.ppq
  const hands = assignHands(raw, split)
  const z = quantize(
    ticks.map((k, i) => ({ ...k, p: raw[i].p, hand: hands[i] })),
    {
      ppq,
      sigs: midi.header.timeSignatures.map((s) => ({ tick: s.ticks, n: s.timeSignature[0], den: s.timeSignature[1] })),
      tempos: midi.header.tempos.map((t) => ({ tick: t.ticks, bpm: t.bpm })),
    },
  )
  const bars: Bar[] = z.bars.map((b, i) => ({
    i,
    t0: midi.header.ticksToSeconds(b.tick),
    t1: midi.header.ticksToSeconds(b.tick + b.len),
    n: b.n,
    den: b.den,
    ...(i === 0 && z.pickup && { ql: z.pickup }),
  }))
  // key changes as the file states them: the reader repeats each event once per track, a key before its first event is C
  const keys: { bar: number; fifths: number }[] = []
  for (const k of [...midi.header.keySignatures].sort((a, b) => a.ticks - b.ticks)) {
    const bar = z.bars.findLastIndex((b) => b.tick <= k.ticks + ppq / 8)
    if (keys[keys.length - 1]?.bar === bar) keys.pop()
    if (keys[keys.length - 1]?.fifths !== keyToFifths(k.key)) keys.push({ bar, fifths: keyToFifths(k.key) })
  }
  if (keys.length && keys[0].bar > 0) keys.unshift({ bar: 0, fifths: 0 })
  raw.forEach((r, i) => Object.assign(r, { q: z.q[i], dq: z.dq[i], grace: z.grace[i] }))
  const fifths = keys.length ? keys[0].fifths : estimateFifths(raw.filter((r) => !r.grace))
  const acc = spellWindow(raw.map((r) => r.p), z.q, fifths)
  raw.forEach((r, i) => (r.acc = acc[i]))
  const tracks = new Set(raw.map((r) => r.track))
  if (tracks.size >= 3) for (const r of raw) r.part = r.track // two tracks are the two hands; more are parts the app can play for you
  const song = build(id, title, raw, bars, fifths, split)
  if (tracks.size >= 3) song.parts = midi.tracks.map((tr, i) => tr.name || tr.instrument.name || `Track ${i + 1}`)
  const est = keys.length ? keys : estimateKeys(song.notes, bars.length)
  if (est.length > 1) song.keys = est
  const flags = [
    ...(midi.header.tempos.length ? [] : ['no-tempo']),
    ...(new Set(raw.map((r) => r.track)).size >= 3 && raw.some((r) => !r.h) ? ['three-track-midi'] : []), // hands fell back to a split at one pitch
  ]
  if (flags.length) song.flags = flags
  return song
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
          raw.push({ t: beat * q, d: len * q * 0.95, p: parseName(nm), v: 0.7, track, q: beat, dq: len })
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
