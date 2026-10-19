import { build, type Bar, type Hand, type Raw, type Song } from './song'
import { noteName } from './spell'
import { DEFAULT_EDGES, type Edges } from './touch'

export type Pattern = 'five' | 'scale' | 'arp' | 'contrary' | 'rhythm'
export type Dyn = 'soft' | 'medium' | 'hard' | 'cresc' | 'decresc' | 'accent' | 'even' | 'balance'
export type Artic = 'legato' | 'staccato'

export interface Opts {
  pattern: Pattern
  tonic: number // pitch class of the key, 0..11
  minor?: boolean // natural minor on the same tonic
  dyn: Dyn
  hands: Hand | 'both'
  bpm: number
  artic?: Artic // note length: legato holds each note to the next, staccato lifts quickly
  level?: 1 | 2 | 3 // rhythm cards only: quarters and halves, then eighths, then dotted notes and syncopation
}

export const PATTERNS: Record<Pattern, string> = { five: 'Five-finger', scale: 'Scale', arp: 'Arpeggio', contrary: 'Contrary motion', rhythm: 'Rhythm' }
export const DYNS: Record<Dyn, string> = {
  soft: 'Steady soft',
  medium: 'Steady medium',
  hard: 'Steady hard',
  cresc: 'Crescendo, soft to hard',
  decresc: 'Decrescendo, hard to soft',
  accent: 'Accent the first beat',
  even: 'Even: every note alike',
  balance: 'Melody over accompaniment',
}
export const ARTICS: Record<'normal' | Artic, string> = { normal: 'Normal', legato: 'Legato', staccato: 'Staccato' }

// Keys with a friendly signature, as pitch class -> fifths of the major key, and of the relative major for the minor.
export const KEYS: Record<number, number> = { 0: 0, 7: 1, 2: 2, 9: 3, 5: -1, 10: -2, 3: -3 }
export const KEYS_MINOR: Record<number, number> = { 9: 0, 4: 1, 11: 2, 2: -1, 7: -2, 0: -3 }

const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12]
const MINOR = [0, 2, 3, 5, 7, 8, 10, 12]
// Degrees (0 = tonic, 7 = the octave) up and back down.
const SHAPE: Record<Exclude<Pattern, 'rhythm'>, number[]> = {
  five: [0, 1, 2, 3, 4, 3, 2, 1, 0],
  scale: [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0],
  arp: [0, 2, 4, 7, 4, 2, 0],
  contrary: [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0],
}
const BODY = 14 // each target band is this wide around its centre on a crescendo, either side
const clamp = (v: number) => Math.min(127, Math.max(1, Math.round(v)))

/** The velocity range asked of note `i` of `n`, or none. Bands follow the player's own edges. */
function want(dyn: Dyn, i: number, n: number, bar0: boolean, hand: Hand, e: Edges): [number, number] | undefined {
  const soft: [number, number] = [1, e.soft]
  const medium: [number, number] = [e.soft + 1, e.hard - 1]
  const hard: [number, number] = [e.hard, 127]
  if (dyn === 'even') return undefined // judged on the spread of what was played, not on a level
  if (dyn === 'balance') return hand === 'R' ? [e.soft + 1, 127] : soft
  if (dyn === 'soft') return soft
  if (dyn === 'medium') return medium
  if (dyn === 'hard') return hard
  if (dyn === 'accent') return bar0 ? hard : medium
  const lo = (1 + e.soft) / 2
  const hi = (e.hard + 127) / 2
  const c = lo + ((dyn === 'cresc' ? i : n - 1 - i) / Math.max(1, n - 1)) * (hi - lo)
  return [clamp(c - BODY), clamp(c + BODY)]
}

// One bar of 4/4 as note values in beats, by level.
const CELLS: Record<1 | 2 | 3, number[][]> = {
  1: [[1, 1, 1, 1], [2, 1, 1], [1, 1, 2], [2, 2], [4]],
  2: [[0.5, 0.5, 1, 1, 1], [1, 0.5, 0.5, 1, 1], [1, 1, 0.5, 0.5, 1], [0.5, 0.5, 0.5, 0.5, 1, 1], [1, 1, 1, 0.5, 0.5]],
  3: [[1.5, 0.5, 1, 1], [0.5, 1, 0.5, 1, 1], [1, 1.5, 0.5, 1], [1.5, 0.5, 1.5, 0.5], [0.5, 1, 1, 1, 0.5]],
}

/** Four bars of one note in written rhythms, to play in time: the count-in click sets the pulse. */
function rhythm(o: Opts): Song {
  const q = 60 / o.bpm
  const level = o.level ?? 1
  const pool = level === 1 ? CELLS[1] : [...CELLS[1].slice(0, 2), ...CELLS[level]]
  const raw: Raw[] = []
  let beat = 0
  for (let b = 0; b < 4; b++) {
    for (const dur of pool[(b * 2 + level) % pool.length]) {
      raw.push({ t: beat * q, d: dur * q * 0.9, p: 60, v: 0.7, track: 0, h: 'R' })
      beat += dur
    }
  }
  const bars: Bar[] = Array.from({ length: 4 }, (_, i) => ({ i, t0: i * 4 * q, t1: (i + 1) * 4 * q, n: 4, den: 4 }))
  return build(`tech:rhythm:${level}:${o.bpm}`, `Rhythm, level ${level}`, raw, bars, 0)
}

/** A practice exercise as a song: quarter notes in 4/4, each carrying the velocity range to aim for. */
export function exercise(o: Opts, e: Edges = DEFAULT_EDGES): Song {
  if (o.pattern === 'rhythm') return rhythm(o)
  const q = 60 / o.bpm
  const steps = SHAPE[o.pattern]
  const I = o.minor ? MINOR : MAJOR
  const raw: Raw[] = []
  const hands: Hand[] = o.hands === 'both' || o.pattern === 'contrary' || o.dyn === 'balance' ? ['R', 'L'] : [o.hands]
  const len = o.artic === 'staccato' ? 0.3 : o.artic === 'legato' ? 0.98 : 0.9
  steps.forEach((deg, i) => {
    for (const h of hands) {
      const w = want(o.dyn, i, steps.length, i % 4 === 0, h, e)
      const mid = 60 + o.tonic
      // contrary motion: the left hand walks down through the same scale from the same tonic
      const p = o.pattern === 'contrary' && h === 'L' ? mid - (12 - I[7 - deg]) : (h === 'R' ? 60 : 48) + o.tonic + I[deg]
      raw.push({ t: i * q, d: q * len, p, v: 0.7, track: 0, h, want: w })
    }
  })
  const bars: Bar[] = Array.from({ length: Math.ceil(steps.length / 4) }, (_, i) => ({ i, t0: i * 4 * q, t1: (i + 1) * 4 * q, n: 4, den: 4 }))
  const fifths = (o.minor ? KEYS_MINOR : KEYS)[o.tonic] ?? 0
  const tonic = noteName(60 + o.tonic).replace(/\d+$/, '')
  const title = `${tonic} ${o.minor ? 'minor' : 'major'} ${PATTERNS[o.pattern].toLowerCase()}, ${DYNS[o.dyn].toLowerCase()}${o.artic ? `, ${o.artic}` : ''}${o.hands === 'R' ? '' : o.hands === 'L' ? ', left hand' : ', both hands'}`
  const id = `tech:${o.pattern}:${o.tonic}${o.minor ? 'm' : ''}:${o.dyn}:${o.hands}${o.artic ? ':' + o.artic : ''}`
  return { ...build(id, title, raw, bars, fifths), dyn: o.dyn, artic: o.artic }
}
