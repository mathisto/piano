import { cards, whites, weight, type Card, type Stage, type Stats } from './drill'

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
  mode: 'practice' | 'arcade'
  lives: boolean // arcade: three misses end the run
  widen: boolean // a clean set stretches the range by one note
  ahead: number // notes visible ahead of the one to play; 0 shows the whole set
  name?: string
}

export const DEFAULT_RUN: RunSpec = { clef: 'treble', lo: 60, hi: 72, acc: 'nat', fifths: 0, size: 1, near: 0.4, weak: 0.5, length: 0, mode: 'practice', lives: false, widen: false, ahead: 0 }

/** The notes each clef lets you pick: a few ledger lines past the staff. */
export const LIMITS = { treble: [55, 88], bass: [36, 62], grand: [36, 88] } as const

export const SET = 16 // cards dealt at a time in an endless run
const GOAL = { 1: 3000, 2: 4000, 3: 5000 } as const // "fluent" ms per card, as in the stages
export const goalMs = (s: RunSpec) => GOAL[s.size]

const BLACKS = [1, 3, 6, 8, 10]
const isBlack = (p: number) => BLACKS.includes(p % 12)
const MAJOR = [0, 2, 4, 5, 7, 9, 11]
const tonic = (fifths: number) => (((fifths * 7) % 12) + 12) % 12

/** Pitches the spec can deal as a root. */
export function runPitches(s: RunSpec): number[] {
  const inKey = s.fifths ? MAJOR.map((i) => (tonic(s.fifths) + i) % 12) : null
  const out: number[] = []
  for (let p = s.lo; p <= s.hi; p++) {
    if (inKey ? inKey.includes(p % 12) : s.acc === 'nat' ? !isBlack(p) : true) out.push(p)
  }
  return out
}

/** Every card the spec can deal. */
export function runCards(s: RunSpec): Card[] {
  const hand = (p: number) => (s.clef === 'treble' ? 'R' : s.clef === 'bass' ? 'L' : p >= 60 ? 'R' : 'L')
  if (s.size === 1)
    return runPitches(s).map((p) => ({ pitches: [p], hand: hand(p), flat: s.acc === 'flat' && !s.fifths && isBlack(p) ? true : undefined, fifths: s.fifths || undefined }))
  const stage: Stage = { id: 'run', name: '', blurb: '', pool: whites(s.lo, s.hi), size: s.size, goalMs: goalMs(s) }
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

// ---------------------------------------------------------------- the arcade

export const mult = (streak: number) => Math.min(8, 1 + Math.floor(streak / 5))
/** The pace tightens as the combo climbs: at ×8 a card has to be answered in about 60% of the usual time. */
export const pace = (goal: number, streak: number) => goal * Math.max(0.5, 1 - 0.06 * (mult(streak) - 1))
export const base = (rt: number, goal: number) => (rt <= goal / 2 ? 150 : rt <= goal ? 100 : 60)

export interface Arcade {
  score: number
  streak: number
  best: number
  lives: number
  cards: number
  clean: number
}
export const newArcade = (s: RunSpec): Arcade => ({ score: 0, streak: 0, best: 0, lives: s.lives ? 3 : 0, cards: 0, clean: 0 })

/** One finished card. A first-try answer scores by speed and the combo; anything else breaks the combo (and costs a life if they are on). */
export function award(a: Arcade, s: RunSpec, clean: boolean, rt: number): Arcade {
  const streak = clean ? a.streak + 1 : 0
  return {
    score: a.score + (clean ? base(rt, pace(goalMs(s), a.streak)) * mult(a.streak) : 0),
    streak,
    best: Math.max(a.best, streak),
    lives: !clean && s.lives ? a.lives - 1 : a.lives,
    cards: a.cards + 1,
    clean: a.clean + (clean ? 1 : 0),
  }
}
export const over = (a: Arcade, s: RunSpec) => s.lives && a.lives <= 0

/** Personal bests are kept per range, not per slider. */
export const bestKey = (s: RunSpec) => `${s.clef}:${s.lo}-${s.hi}:${s.acc}:${s.fifths}:${s.size}`
