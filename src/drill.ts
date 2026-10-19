import { build, type Bar, type Hand, type Raw, type Song } from './song'
import { clefFor, noteName } from './spell'

/** Natural (white-key) pitches from lo to hi inclusive. */
export const whites = (lo: number, hi: number): number[] =>
  Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((p) => ![1, 3, 6, 8, 10].includes(p % 12))

export interface Stage {
  id: string
  name: string
  blurb: string
  pool: number[] // root pitches the cards are drawn from
  size: 1 | 2 | 3 // 1 = single notes, 2 = intervals, 3 = triads
  goalMs: number // "fluent" response time for one card
  hand?: Hand // pins the staff; otherwise middle C and up is treble
  flat?: boolean // black keys are written as flats (default: sharps)
  fifths?: number // key signature the whole set is read in (default: none)
  notes?: string // how the pool is described on the Read page, when a range says too little
}

const T = (lo: number, hi: number) => whites(lo, hi)
const BLACKS = [1, 3, 6, 8, 10]
const isBlack = (p: number) => BLACKS.includes(p % 12)
const chroma = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
const major = (tonic: number) => [0, 2, 4, 5, 7, 9, 11, 12].map((i) => tonic + i)

// Landmarks first (middle C, treble G, bass F), then neighbours, then the whole staff.
export const STAGES: Stage[] = [
  { id: 't-land', name: 'Treble landmarks', blurb: 'Middle C, the G line, high C. Learn three anchors first.', pool: [60, 67, 72], size: 1, goalMs: 2500 },
  { id: 't-five', name: 'Treble five-finger', blurb: 'C to G, the notes under a resting right hand.', pool: T(60, 67), size: 1, goalMs: 2500 },
  { id: 't-oct', name: 'Treble octave', blurb: 'Middle C up to the C above.', pool: T(60, 72), size: 1, goalMs: 2500 },
  { id: 't-staff', name: 'Treble staff', blurb: 'Every line and space, bottom E to top F.', pool: T(64, 77), size: 1, goalMs: 2500 },
  { id: 't-high', name: 'Treble reach', blurb: 'Ledger lines: middle C up to high C.', pool: T(60, 84), size: 1, goalMs: 3000 },
  { id: 'b-land', name: 'Bass landmarks', blurb: 'The F line, low C, and middle C from below.', pool: [53, 48, 60], size: 1, goalMs: 2500, hand: 'L' },
  { id: 'b-five', name: 'Bass five-finger', blurb: 'C to G under the left hand.', pool: T(48, 55), size: 1, goalMs: 2500, hand: 'L' },
  { id: 'b-oct', name: 'Bass octave', blurb: 'Low C up to middle C.', pool: T(48, 60), size: 1, goalMs: 2500, hand: 'L' },
  { id: 'b-staff', name: 'Bass staff', blurb: 'Every line and space, bottom G to top A.', pool: T(43, 57), size: 1, goalMs: 2500, hand: 'L' },
  { id: 'b-low', name: 'Bass reach', blurb: 'Ledger lines: low C up to middle C.', pool: T(36, 60), size: 1, goalMs: 3000, hand: 'L' },
  { id: 'grand', name: 'Both clefs', blurb: 'The whole grand staff, mixed.', pool: T(43, 77), size: 1, goalMs: 3000 },
  { id: 'sharps', name: 'Sharps', blurb: 'Black keys written as sharps, mixed in with the white ones.', pool: chroma(60, 72), size: 1, goalMs: 3000, notes: 'C4 to C5, with sharps' },
  { id: 'flats', name: 'Flats', blurb: 'The same black keys, written as flats.', pool: chroma(60, 72), size: 1, goalMs: 3000, flat: true, notes: 'C4 to C5, with flats' },
  { id: 'keys-g', name: 'Key of G', blurb: 'One sharp in the key signature: every F is F sharp, with no sign beside the note.', pool: major(67), size: 1, goalMs: 3000, fifths: 1, notes: 'G major scale' },
  { id: 'keys-f', name: 'Key of F', blurb: 'One flat in the key signature: every B is B flat, with no sign beside the note.', pool: major(65), size: 1, goalMs: 3000, fifths: -1, notes: 'F major scale' },
  { id: 'ints', name: 'Intervals', blurb: 'Two notes at once: seconds to fifths, treble clef.', pool: T(60, 74), size: 2, goalMs: 4000 },
  { id: 'triads', name: 'Triads', blurb: 'Three notes stacked in thirds, treble clef.', pool: T(60, 71), size: 3, goalMs: 5000 },
]

export interface Card {
  pitches: number[] // ascending
  hand: Hand
  flat?: boolean // spelled as a flat
  fifths?: number // read in this key
}

export interface NoteStat {
  n: number // times seen
  clean: number // moving average of first-try correct, 0..1
  rt: number // moving average response time in ms
}
export type Stats = Record<string, NoteStat>

const A = 0.3
const NEED = 12 // sightings before a card can count as mastered: about two sets on a small stage
// A card is the same skill wherever it is dealt, but F sharp and G flat are different reading, as are keys.
const key = (c: Card) =>
  `${c.pitches.length}:${clefFor(c.pitches[0], c.hand)}:${c.pitches[0]}${c.flat ? ':b' : ''}${c.fifths ? `:f${c.fifths}` : ''}`
export const cardKey = key

export function record(stats: Stats, k: string, clean: boolean, rt: number): Stats {
  const s = stats[k]
  const c = clean ? 1 : 0
  stats[k] = s
    ? { n: s.n + 1, clean: s.clean + A * (c - s.clean), rt: s.rt + A * (rt - s.rt) }
    : { n: 1, clean: c, rt }
  return stats
}

const handOf = (p: number): Hand => (p >= 60 ? 'R' : 'L')

/** Every card a stage can deal. Intervals and triads stack diatonic steps on a white-key root. */
export function cards(stage: Stage): Card[] {
  if (stage.size === 1) return stage.pool.map((p) => ({ pitches: [p], hand: stage.hand ?? handOf(p), flat: stage.flat && isBlack(p) ? true : undefined, fifths: stage.fifths }))
  const ws = whites(stage.pool[0], stage.pool[stage.pool.length - 1] + 12)
  const out: Card[] = []
  for (const root of stage.pool) {
    const i = ws.indexOf(root)
    if (stage.size === 3) {
      if (ws[i + 4] !== undefined) out.push({ pitches: [root, ws[i + 2], ws[i + 4]], hand: 'R' })
    } else {
      for (const step of [1, 2, 3, 4]) if (ws[i + step] !== undefined) out.push({ pitches: [root, ws[i + step]], hand: 'R' })
    }
  }
  return out
}

/** How much the player needs this card: unseen and shaky cards are dealt more often. */
export function weight(stats: Stats, c: Card, goalMs: number): number {
  const s = stats[key(c)]
  if (!s) return 4
  return 1 + 4 * (1 - s.clean) + Math.min(2, s.rt / goalMs) + (s.n < 3 ? 1.5 : 0)
}

/** A deck of `n` cards, weighted toward weak ones, never the same card twice in a row. */
export function deck(pool: Card[], stats: Stats, goalMs: number, n: number, rnd: () => number = Math.random): Card[] {
  const out: Card[] = []
  for (let i = 0; i < n; i++) {
    const cand = pool.length > 1 ? pool.filter((c) => c !== out[i - 1]) : pool
    const w = cand.map((c) => weight(stats, c, goalMs))
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
  }
  return out
}

export interface Mastery {
  pct: number // 0..1
  solid: boolean // every card seen enough, clean and fast
  seen: number
  total: number
}

export function mastery(stage: Stage, stats: Stats): Mastery {
  const all = cards(stage)
  let sum = 0
  let solid = true
  let seen = 0
  for (const c of all) {
    const s = stats[key(c)]
    if (!s) {
      solid = false
      continue
    }
    seen++
    const speed = Math.min(1, stage.goalMs / Math.max(s.rt, 1))
    const got = Math.min(1, s.n / NEED) * s.clean * speed
    sum += got
    if (s.n < NEED || s.clean < 0.85 || s.rt > stage.goalMs) solid = false
  }
  return { pct: all.length ? sum / all.length : 0, solid, seen, total: all.length }
}

/** First stage that is not solid yet, or the last one. */
export function nextStage(stats: Stats): Stage {
  return STAGES.find((s) => !mastery(s, stats).solid) ?? STAGES[STAGES.length - 1]
}

/** Every single-note card the player has already seen, for mixed review. */
export function reviewPool(stats: Stats): Card[] {
  const seen = new Map<string, Card>()
  // key-signature stages are read in their own key, so they stay out of a mixed set in C
  for (const st of STAGES.filter((s) => s.size === 1 && !s.fifths))
    for (const c of cards(st)) if (stats[key(c)]) seen.set(key(c), c)
  return [...seen.values()]
}

/** The cards the player is weakest at, worst first. */
export function weakest(stats: Stats, n = 3): { name: string; clean: number; rt: number }[] {
  return Object.entries(stats)
    .filter(([, s]) => s.n >= 2 && (s.clean < 0.9 || s.rt > 2500)) // only what actually needs work
    .map(([k, s]) => {
      const [size, clef, p, ...flags] = k.split(':')
      const fifths = Number(flags.find((f) => f.startsWith('f'))?.slice(1) ?? 0)
      const spelled = noteName(Number(p), flags.includes('b') ? -2 : fifths)
      const name = size === '1' ? `${spelled}, ${clef} clef${fifths ? `, key of ${fifths > 0 ? 'G' : 'F'}` : ''}` : `${size === '2' ? 'interval' : 'triad'} on ${spelled}`
      return { name, clean: s.clean, rt: s.rt, score: s.clean - Math.min(1, s.rt / 6000) * 0.4 }
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, n)
}

export const BPM = 60

/** A drill session as a song: one card per beat, four to a bar, read in wait mode. */
export function deckSong(id: string, title: string, d: Card[], fifths = 0): Song {
  const q = 60 / BPM
  const raw: Raw[] = []
  d.forEach((c, i) => c.pitches.forEach((p) => raw.push({ t: i * q, d: q * 0.9, p, v: 0.7, track: 0, h: c.hand, flat: c.flat })))
  const bars: Bar[] = Array.from({ length: Math.ceil(d.length / 4) }, (_, i) => ({ i, t0: i * 4 * q, t1: (i + 1) * 4 * q, n: 4, den: 4 }))
  return build(id, title, raw, bars, fifths)
}
