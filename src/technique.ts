import { build, type Bar, type Hand, type Raw, type Song } from './song'
import { noteName } from './spell'
import { DEFAULT_EDGES, type Edges } from './touch'

export type Pattern = 'five' | 'scale' | 'arp'
export type Dyn = 'soft' | 'medium' | 'hard' | 'cresc' | 'decresc' | 'accent'

export interface Opts {
  pattern: Pattern
  tonic: number // pitch class of the major key, 0..11
  dyn: Dyn
  hands: Hand | 'both'
  bpm: number
}

export const PATTERNS: Record<Pattern, string> = { five: 'Five-finger', scale: 'Scale', arp: 'Arpeggio' }
export const DYNS: Record<Dyn, string> = {
  soft: 'Steady soft',
  medium: 'Steady medium',
  hard: 'Steady hard',
  cresc: 'Crescendo (soft to hard)',
  decresc: 'Decrescendo (hard to soft)',
  accent: 'Accent the first beat',
}
// Keys with a friendly signature, as pitch class -> fifths.
export const KEYS: Record<number, number> = { 0: 0, 7: 1, 2: 2, 9: 3, 5: -1, 10: -2, 3: -3 }

const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12]
// Degrees (0 = tonic, 7 = the octave) up and back down.
const SHAPE: Record<Pattern, number[]> = {
  five: [0, 1, 2, 3, 4, 3, 2, 1, 0],
  scale: [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0],
  arp: [0, 2, 4, 7, 4, 2, 0],
}
const BODY = 14 // each target band is this wide around its centre on a crescendo, either side
const clamp = (v: number) => Math.min(127, Math.max(1, Math.round(v)))

/** The velocity range asked of note `i` of `n`. Bands follow the player's own edges. */
function want(dyn: Dyn, i: number, n: number, bar0: boolean, e: Edges): [number, number] {
  const soft: [number, number] = [1, e.soft]
  const medium: [number, number] = [e.soft + 1, e.hard - 1]
  const hard: [number, number] = [e.hard, 127]
  if (dyn === 'soft') return soft
  if (dyn === 'medium') return medium
  if (dyn === 'hard') return hard
  if (dyn === 'accent') return bar0 ? hard : medium
  const lo = (1 + e.soft) / 2
  const hi = (e.hard + 127) / 2
  const c = lo + ((dyn === 'cresc' ? i : n - 1 - i) / Math.max(1, n - 1)) * (hi - lo)
  return [clamp(c - BODY), clamp(c + BODY)]
}

/** A practice exercise as a song: quarter notes in 4/4, each carrying the velocity range to aim for. */
export function exercise(o: Opts, e: Edges = DEFAULT_EDGES): Song {
  const q = 60 / o.bpm
  const steps = SHAPE[o.pattern]
  const raw: Raw[] = []
  const hands: Hand[] = o.hands === 'both' ? ['R', 'L'] : [o.hands]
  steps.forEach((deg, i) => {
    const w = want(o.dyn, i, steps.length, i % 4 === 0, e)
    for (const h of hands) {
      const base = (h === 'R' ? 60 : 48) + o.tonic
      raw.push({ t: i * q, d: q * 0.9, p: base + MAJOR[deg], v: 0.7, track: 0, h, want: w })
    }
  })
  const bars: Bar[] = Array.from({ length: Math.ceil(steps.length / 4) }, (_, i) => ({ i, t0: i * 4 * q, t1: (i + 1) * 4 * q, n: 4, den: 4 }))
  const fifths = KEYS[o.tonic] ?? 0
  const title = `${noteName(60 + o.tonic).replace(/\d+$/, '')} major ${PATTERNS[o.pattern].toLowerCase()}, ${DYNS[o.dyn].toLowerCase()}`
  return build(`tech:${o.pattern}:${o.tonic}:${o.dyn}:${o.hands}`, title, raw, bars, fifths)
}
