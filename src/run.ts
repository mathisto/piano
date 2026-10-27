import { cards, keyNotes, weight, type Card, type Stage, type Stats } from './drill'

/** Sight Run: a reading drill you build yourself, from a range, a spread and a pace. */
export interface RunSpec {
  clef: 'treble' | 'bass' | 'grand'
  lo: number
  hi: number
  acc: 'nat' | 'sharp' | 'flat' // black keys: left out, written as sharps, written as flats
  fifths: number // read in this key: only its own notes are dealt, and the signature is drawn
  size: 1 | 2 | 3 // notes, intervals, triads
  near: number // 0 leaps anywhere in the range .. 1 mostly steps
  weak: number // 0 an even shuffle .. 1 weighted toward what you are slow or wrong at
  length: number // cards; 0 is endless
  widen: boolean // a clean set stretches the range by one note
  ahead: number // notes visible ahead of the one to play; 0 shows the whole set
  pace: number // beats a minute of a paced run, where a metronome leads and a miss does not stop it; 0 waits for you
  every: 1 | 2 // paced: beats each card gets
  name?: string
}

export const DEFAULT_RUN: RunSpec = { clef: 'treble', lo: 60, hi: 72, acc: 'nat', fifths: 0, size: 1, near: 0.4, weak: 0.5, length: 0, widen: false, ahead: 0, pace: 0, every: 1 }

/** The notes each clef lets you pick: a few ledger lines past the staff. */
export const LIMITS = { treble: [55, 88], bass: [36, 62], grand: [36, 88] } as const

export const SET = 16 // cards dealt at a time in an endless run
const GOAL = { 1: 3000, 2: 4000, 3: 5000 } as const // "fluent" ms per card, as in the stages
export const goalMs = (s: RunSpec) => GOAL[s.size]

const BLACKS = [1, 3, 6, 8, 10]
const isBlack = (p: number) => BLACKS.includes(p % 12)

/** Pitches the spec can deal as a root: the key's notes, the white keys, or every key. */
export const runPitches = (s: RunSpec): number[] =>
  s.fifths || s.acc === 'nat' ? keyNotes(s.lo, s.hi, s.fifths) : Array.from({ length: s.hi - s.lo + 1 }, (_, i) => s.lo + i)

/** Every card the spec can deal. */
export function runCards(s: RunSpec): Card[] {
  const hand = (p: number) => (s.clef === 'treble' ? 'R' : s.clef === 'bass' ? 'L' : p >= 60 ? 'R' : 'L')
  if (s.size === 1)
    return runPitches(s).map((p) => ({ pitches: [p], hand: hand(p), flat: s.acc === 'flat' && !s.fifths && isBlack(p) ? true : undefined, fifths: s.fifths || undefined }))
  // intervals and triads stack the key's own notes, read under its signature (naturals: C major)
  const stage: Stage = { id: 'run', name: '', blurb: '', pool: keyNotes(s.lo, s.hi, s.fifths), size: s.size, goalMs: goalMs(s), fifths: s.fifths || undefined }
  return cards(stage)
    .filter((c) => c.pitches[c.pitches.length - 1] <= s.hi)
    .map((c) => ({ ...c, hand: hand(c.pitches[0]) }))
}

/** Odds of the next note given the last: a spread of `near` makes a step likelier than a leap. */
export const closeness = (d: number, near: number) => (near <= 0 ? 1 : Math.exp(-d / (1.5 + 14 * (1 - near) ** 2)))

/** `n` cards: never the same card twice running, leaning toward neighbours by `near` and toward weak cards by `weak`. */
export function deal(pool: Card[], stats: Stats, s: RunSpec, n: number, prev?: Card, rnd: () => number = Math.random): Card[] {
  const out: Card[] = []
  let last = prev
  for (let i = 0; i < n; i++) {
    const cand = pool.length > 1 ? pool.filter((c) => c !== last) : pool
    const w = cand.map((c) => (last ? closeness(Math.abs(c.pitches[0] - last.pitches[0]), s.near) : 1) * weight(stats, c, goalMs(s)) ** s.weak)
    let r = rnd() * w.reduce((a, b) => a + b, 0)
    let pick = cand[cand.length - 1]
    for (let k = 0; k < cand.length; k++) {
      r -= w[k]
      if (r <= 0) {
        pick = cand[k]
        break
      }
    }
    out.push(pick)
    last = pick
  }
  return out
}

const stepWhite = (p: number, d: 1 | -1) => {
  let q = p + d
  while (isBlack(q)) q += d
  return q
}

/** The range one white note wider: the top on even turns, the bottom on odd ones, within what the clef can show. */
export function widened(s: RunSpec, turn: number): RunSpec {
  const [min, max] = LIMITS[s.clef]
  const hi = stepWhite(s.hi, 1)
  const lo = stepWhite(s.lo, -1)
  if (hi <= max && (turn % 2 === 0 || lo < min)) return { ...s, hi }
  return lo >= min ? { ...s, lo } : s
}

// ---------------------------------------------------------------- the tally

/** What a run shows while it goes: cards, first-try cards, the streak of them and the longest streak. */
export interface Tally {
  streak: number
  best: number
  cards: number
  clean: number
}
export const newTally = (): Tally => ({ streak: 0, best: 0, cards: 0, clean: 0 })

/** One finished card. A first-try answer extends the streak; anything else ends it. */
export function tally(a: Tally, clean: boolean): Tally {
  const streak = clean ? a.streak + 1 : 0
  return { streak, best: Math.max(a.best, streak), cards: a.cards + 1, clean: a.clean + (clean ? 1 : 0) }
}

/** Personal bests are kept per range, not per slider. */
export const bestKey = (s: RunSpec) => `${s.clef}:${s.lo}-${s.hi}:${s.acc}:${s.fifths}:${s.size}`
