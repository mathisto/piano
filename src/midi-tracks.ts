import { Midi } from '@tonejs/midi'
import type { Hand } from './song'

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
    const onsets = [...new Set(tr.notes.map((n) => Math.round(n.time / CHORD)))]
    const alone = onsets.filter((o) => tr.notes.filter((n) => Math.round(n.time / CHORD) === o).length === 1).length
    const ps = tr.notes.map((n) => n.midi)
    tracks.push({
      index,
      name: tr.name || heading || tr.instrument.name || `Track ${index + 1}`,
      channel: tr.channel,
      program: tr.instrument.name,
      percussion: tr.instrument.percussion || tr.channel === 9,
      notes: tr.notes.length,
      lo: Math.min(...ps),
      hi: Math.max(...ps),
      mono: onsets.length ? alone / onsets.length : 0,
      perBar: Array.from(perBar, (v) => v ?? 0),
    })
  })
  return { tracks, bars, seconds: midi.duration }
}

const p95 = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length * 0.95)] : 0)

/** Notes per bar, 95th percentile, over a set of tracks. */
export function density(tracks: TrackInfo[], bars: number) {
  return p95(Array.from({ length: bars }, (_, b) => tracks.reduce((a, t) => a + (t.perBar[b] ?? 0), 0)))
}

export const COMFORT = 16 // notes in a bar the staff can show without turning into a smear

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
