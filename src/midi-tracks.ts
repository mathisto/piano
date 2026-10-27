// The MIDI reader (@tonejs/midi): loaded with the first file opened, not at boot (docs/changes/perf.md).
import { Midi } from '@tonejs/midi'
import { quantize } from './quantize'
import { assignHands, build, COMFORT, density, estimateFifths, estimateKeys, type Bar, type Hand, type Raw, type Song } from './song'
import { spellWindow } from './spell'

export interface TrackInfo {
  index: number // position in the file, the key for selecting it
  name: string
  channel: number
  program: string
  percussion: boolean
  notes: number
  lo: number
  hi: number
  mono: number // share of onsets that are a single note: 1 is a pure line, near 0 is chords or pads
  perBar: number[] // notes starting in each bar, for judging density
}

export interface Report {
  tracks: TrackInfo[] // only tracks that have notes
  bars: number
  seconds: number
}

/** What to import from a multi-track file: which tracks, and the hand each is pinned to. */
export interface Selection {
  tracks: number[]
  hands: Record<number, Hand>
}

const CHORD = 0.03 // seconds: onsets this close count as one chord

export function inspectMidi(buf: ArrayBuffer): Report {
  const midi = new Midi(buf)
  const sig = midi.header.timeSignatures[0]?.timeSignature ?? [4, 4]
  const barTicks = Math.round((sig[0] * 4 * midi.header.ppq) / sig[1])
  let bars = 0
  let heading = '' // some rips name an empty track and put its notes in the next one
  const tracks: TrackInfo[] = []
  midi.tracks.forEach((tr, index) => {
    if (!tr.notes.length) {
      heading = tr.name
      return
    }
    const perBar: number[] = []
    for (const n of tr.notes) {
      const b = Math.floor(n.ticks / barTicks)
      perBar[b] = (perBar[b] ?? 0) + 1
    }
    bars = Math.max(bars, perBar.length)
    const onsets = new Map<number, number>() // chord slot -> notes in it (a linear count: a 25,000-note file took 28 s with a filter per onset)
    for (const n of tr.notes) {
      const k = Math.round(n.time / CHORD)
      onsets.set(k, (onsets.get(k) ?? 0) + 1)
    }
    const alone = [...onsets.values()].filter((c) => c === 1).length
    const ps = tr.notes.map((n) => n.midi)
    tracks.push({
      index,
      name: tr.name || heading || tr.instrument.name || `Track ${index + 1}`,
      channel: tr.channel,
      program: tr.instrument.name,
      percussion: tr.instrument.percussion || tr.channel === 9,
      notes: tr.notes.length,
      lo: ps.reduce((a, b) => Math.min(a, b)), // not Math.min(...ps): a spread of 125,000 notes overflows the stack
      hi: ps.reduce((a, b) => Math.max(a, b)),
      mono: onsets.size ? alone / onsets.size : 0,
      perBar: Array.from(perBar, (v) => v ?? 0),
    })
  })
  return { tracks, bars, seconds: midi.duration }
}

// General MIDI programs that make an accompaniment on their own: pianos, guitars, harp
const keyed = (program: string) => /piano|clavi|harpsichord|guitar|harp|celesta|glock|music box|marimba|vibraphone/i.test(program)

const RIGHT = /(?<![a-z])(up|upper|rh|right|treble|dis[ck]ant|oberstimme|staffu)(?![a-z])/i
const LEFT = /(?<![a-z])(down|lower|lh|left|bass|unterstimme|staffl)(?![a-z])/i

/** Hands from track names (rh/lh, upper/lower, Discant/Bass ...), only when every track names one hand and both hands appear. */
export function namedHands(tracks: TrackInfo[]): Record<number, Hand> {
  const hs = tracks.map((t) => (RIGHT.test(t.name) === LEFT.test(t.name) ? undefined : RIGHT.test(t.name) ? 'R' : 'L'))
  return hs.every(Boolean) && new Set(hs).size === 2 ? Object.fromEntries(tracks.map((t, i) => [t.index, hs[i]!])) : {}
}

/** Everything when the file is already readable; otherwise a lead line and an accompaniment, with drums and pads left out. */
export function autoSelect(r: Report): Selection {
  const live = r.tracks.filter((t) => !t.percussion)
  const all = { tracks: live.map((t) => t.index), hands: namedHands(live) }
  // a piano score is a few keyed tracks (often one per hand): keep them all and let Simplify thin a busy one
  if (density(live, r.bars) <= COMFORT || live.length <= 3 || live.every((t) => keyed(t.program))) return all

  // a lead is a line of single notes in the singing register; a melodic instrument beats a keyed one, which is the accompaniment's job
  const score = (t: TrackInfo) => t.mono * Math.min(1, t.notes / 200) * Math.max(0.2, 1 - Math.abs((t.lo + t.hi) / 2 - 72) / 48)
  const lines = live.filter((t) => t.mono > 0.6 && t.lo >= 48)
  const lead = [...(lines.some((t) => !keyed(t.program)) ? lines.filter((t) => !keyed(t.program)) : lines)].sort((a, b) => score(b) - score(a))[0]
  const comp = [...live]
    .filter((t) => t !== lead && keyed(t.program))
    .sort((a, b) => b.notes - a.notes)[0]
  const tracks = [lead, comp].filter((t): t is TrackInfo => !!t)
  if (!tracks.length) return all
  return { tracks: tracks.map((t) => t.index), hands: lead ? { [lead.index]: 'R' } : {} }
}

const MAJOR_FIFTHS: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
  F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
}

/** The MIDI reader names the major key that has the signature, for a minor piece too (C minor arrives as 'Eb'), so the scale needs no correction. */
function keyToFifths(key: string): number {
  return MAJOR_FIFTHS[key] ?? 0
}

/** A catalogue piece's own pace in place of the file's: quarter-note bpm, and whether it is a guess from a tempo word ('tempo-estimated'). */
export interface Tempo {
  bpm: number
  guess: boolean
}

export function fromMidi(buf: ArrayBuffer, title: string, id: string, split = 60, pick?: Selection, tempo?: Tempo, pickup?: number): Song {
  const midi = new Midi(buf)
  const h = midi.header
  if (tempo && !h.tempos.length) h.setTempo(tempo.bpm)
  else if (tempo) {
    const k = tempo.bpm / h.tempos[0].bpm // one scale for every event: a tempo map keeps its shape
    for (const t of h.tempos) t.bpm *= k
    h.update()
  }
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
      pickup,
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
    const bar = k.ticks ? z.bars.findLastIndex((b) => b.tick <= k.ticks + ppq / 8) : 0 // a key at the very start is bar 0's, even when a pickup there is shorter than the slack
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
    ...(tempo ? (tempo.guess ? ['tempo-estimated'] : []) : midi.header.tempos.length ? [] : ['no-tempo']),
    ...(new Set(raw.map((r) => r.track)).size >= 3 && raw.some((r) => !r.h) ? ['three-track-midi'] : []), // hands fell back to a split at one pitch
  ]
  if (flags.length) song.flags = flags
  return song
}
