import { build, type Bar, type Hand, type Raw, type Song } from './song'
import { isBlack } from './osk'
import { clefFor, noteName } from './spell'

/** Natural (white-key) pitches from lo to hi inclusive. */
export const whites = (lo: number, hi: number): number[] =>
  Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((p) => !isBlack(p))

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
  scale?: number[] // melody stages: fragments of four notes walked through this scale
  need?: number // sightings of a card before it counts as mastered (default 12)
  sharp?: boolean // black keys outside the key are written as sharps (the raised seventh of a flat minor key)
  alt?: boolean // cards switch clef every time: treble, bass, treble...
  cover?: number // reading ahead: once the set starts, the card to play and the next cover-1 are hidden
}

const T = (lo: number, hi: number) => whites(lo, hi)
const chroma = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
const major = (tonic: number) => [0, 2, 4, 5, 7, 9, 11, 12].map((i) => tonic + i)
// natural minor, with the raised seventh under each tonic: the leading tone where it arises
const minor = (tonic: number) => [-1, 0, 2, 3, 5, 7, 8, 10, 11, 12].map((i) => tonic + i)
const MAJOR = [0, 2, 4, 5, 7, 9, 11]

/** The notes of a major key from lo to hi: the white keys in C. */
export const keyNotes = (lo: number, hi: number, fifths = 0): number[] => chroma(lo, hi).filter((p) => MAJOR.includes((p - fifths * 7 + 1200) % 12))

/** The Fluent tier: the same cards against a tighter clock. Single notes and tunes 1.5 s a card, chords half their goal. */
export const fluentMs = (st: Stage) => (st.size === 1 ? 1500 : st.goalMs / 2)

// Landmarks first (middle C, treble G, bass F), then neighbours, then the whole staff.
// Ids and pools of the first stages are stored progress: add stages, never rename or repool one.
export const STAGES: Stage[] = [
  { id: 't-land', name: 'Treble landmarks', blurb: 'Middle C, the G line, high C. Learn three anchors first.', pool: [60, 67, 72], size: 1, goalMs: 2500 },
  { id: 't-five', name: 'Treble five-finger', blurb: 'C to G, the notes under a resting right hand.', pool: T(60, 67), size: 1, goalMs: 2500 },
  { id: 't-oct', name: 'Treble octave', blurb: 'Middle C up to the C above.', pool: T(60, 72), size: 1, goalMs: 2500 },
  { id: 't-anch', name: 'Treble high anchors', blurb: 'High C, the G just over the staff, and the C on two ledger lines.', pool: [72, 79, 84], size: 1, goalMs: 2500, notes: 'C5, G5, C6' },
  { id: 't-staff', name: 'Treble staff', blurb: 'Every line and space, bottom E to top F.', pool: T(64, 77), size: 1, goalMs: 2500 },
  { id: 't-led1', name: 'Treble, one ledger line', blurb: 'Just off the staff: B and C on the ledger below, A and B on the ledger above.', pool: [59, 60, 62, 79, 81, 83], size: 1, goalMs: 2500, hand: 'R', notes: 'B3 to D4, G5 to B5' },
  { id: 't-led2', name: 'Treble, two ledger lines', blurb: 'A below middle C, and C and D above high B.', pool: [57, 59, 83, 84, 86], size: 1, goalMs: 3000, hand: 'R', notes: 'A3, B3, B5 to D6' },
  { id: 't-high', name: 'Treble reach', blurb: 'Ledger lines: middle C up to high C.', pool: T(60, 84), size: 1, goalMs: 3000 },
  { id: 'b-land', name: 'Bass landmarks', blurb: 'The F line, low C, and middle C from below.', pool: [53, 48, 60], size: 1, goalMs: 2500, hand: 'L' },
  { id: 'b-five', name: 'Bass five-finger', blurb: 'C to G under the left hand.', pool: T(48, 55), size: 1, goalMs: 2500, hand: 'L' },
  { id: 'b-oct', name: 'Bass octave', blurb: 'Low C up to middle C.', pool: T(48, 60), size: 1, goalMs: 2500, hand: 'L' },
  { id: 'b-anch', name: 'Bass low anchors', blurb: 'Low C, the G on the bottom line, and the C two ledger lines down.', pool: [48, 43, 36], size: 1, goalMs: 2500, hand: 'L', notes: 'C3, G2, C2' },
  { id: 'b-staff', name: 'Bass staff', blurb: 'Every line and space, bottom G to top A.', pool: T(43, 57), size: 1, goalMs: 2500, hand: 'L' },
  { id: 'b-led1', name: 'Bass, one ledger line', blurb: 'Just off the staff: D and E on the ledger below, C and D on the ledger above.', pool: [38, 40, 41, 59, 60, 62], size: 1, goalMs: 2500, hand: 'L', notes: 'D2 to F2, B3 to D4' },
  { id: 'b-led2', name: 'Bass, two ledger lines', blurb: 'Low C on the second ledger, and the B under it.', pool: [35, 36, 38, 40], size: 1, goalMs: 3000, hand: 'L', notes: 'B1 to E2' },
  { id: 'b-low', name: 'Bass reach', blurb: 'Ledger lines: low C up to middle C.', pool: T(36, 60), size: 1, goalMs: 3000, hand: 'L' },
  { id: 'mixed', name: 'Switching clefs', blurb: 'Treble, then bass, then treble: every card changes clef, so you read the clef first.', pool: [...T(43, 57), ...T(64, 77)], size: 1, goalMs: 3000, alt: true, notes: 'Both staffs, alternating' },
  { id: 'grand', name: 'Both clefs', blurb: 'The whole grand staff, mixed.', pool: T(43, 77), size: 1, goalMs: 3000 },
  { id: 'oct8', name: 'Octave signs', blurb: 'Under an 8va line the note sounds an octave higher; over 8vb, an octave lower.', pool: [...T(24, 29), ...T(91, 98)], size: 1, goalMs: 3000, notes: 'C1 to F1 under 8vb, G6 to D7 under 8va' },
  { id: 'sharps', name: 'Sharps', blurb: 'Black keys written as sharps, mixed in with the white ones.', pool: chroma(60, 72), size: 1, goalMs: 3000, notes: 'C4 to C5, with sharps' },
  { id: 'flats', name: 'Flats', blurb: 'The same black keys, written as flats.', pool: chroma(60, 72), size: 1, goalMs: 3000, flat: true, notes: 'C4 to C5, with flats' },
  { id: 'keys-g', name: 'Key of G', blurb: 'One sharp in the key signature: every F is F sharp, with no sign beside the note.', pool: major(67), size: 1, goalMs: 3000, fifths: 1, notes: 'G major scale' },
  { id: 'keys-f', name: 'Key of F', blurb: 'One flat in the key signature: every B is B flat, with no sign beside the note.', pool: major(65), size: 1, goalMs: 3000, fifths: -1, notes: 'F major scale' },
  { id: 'keys-am', name: 'A minor', blurb: 'No sharps or flats in the key, but the seventh is often raised: G sharp carries its own sign.', pool: minor(69), size: 1, goalMs: 3000, notes: 'A minor, with G and G sharp' },
  { id: 'keys-dm', name: 'D minor', blurb: 'One flat, like F major, with C sharp as the raised seventh.', pool: minor(62), size: 1, goalMs: 3000, fifths: -1, sharp: true, notes: 'D minor, with C and C sharp' },
  { id: 'keys-d', name: 'Key of D', blurb: 'Two sharps: every F and every C is sharp.', pool: major(62), size: 1, goalMs: 3000, fifths: 2, notes: 'D major scale' },
  { id: 'keys-bb', name: 'Key of B♭', blurb: 'Two flats: every B and every E is flat.', pool: major(70), size: 1, goalMs: 3000, fifths: -2, notes: 'B♭ major scale' },
  { id: 'keys-a', name: 'Key of A', blurb: 'Three sharps: F, C and G.', pool: major(69), size: 1, goalMs: 3000, fifths: 3, notes: 'A major scale' },
  { id: 'keys-eb', name: 'Key of E♭', blurb: 'Three flats: B, E and A.', pool: major(63), size: 1, goalMs: 3000, fifths: -3, notes: 'E♭ major scale' },
  { id: 'tune-c', name: 'Four-note tunes', blurb: 'Runs, turns and a skip in C: read the shape of the line, not each letter.', pool: [], scale: whites(60, 69), size: 1, goalMs: 3000, need: 6, notes: 'C4 to A4, four notes at a time' },
  { id: 'tune-g', name: 'Tunes in G', blurb: 'The same shapes with one sharp in the key.', pool: [], scale: major(67), size: 1, goalMs: 3500, fifths: 1, need: 6, notes: 'G major, four notes at a time' },
  { id: 'tune-f', name: 'Tunes in F', blurb: 'The same shapes with one flat in the key.', pool: [], scale: major(65), size: 1, goalMs: 3500, fifths: -1, need: 6, notes: 'F major, four notes at a time' },
  { id: 'tune-b', name: 'Bass tunes', blurb: 'Four-note lines under the left hand.', pool: [], scale: whites(43, 53), size: 1, goalMs: 3500, hand: 'L', need: 6, notes: 'G2 to F3, four notes at a time' },
  { id: 'tune-a1', name: 'Read one ahead', blurb: 'Tunes in C where each note vanishes as it comes up: read it while you play the one before.', pool: [], scale: whites(60, 69), size: 1, goalMs: 3000, need: 6, cover: 1, notes: 'C4 to A4, the next note hidden' },
  { id: 'tune-a2', name: 'Read two ahead', blurb: 'The next two notes vanish: keep your eyes two notes past your fingers.', pool: [], scale: whites(60, 69), size: 1, goalMs: 3500, need: 6, cover: 2, notes: 'C4 to A4, the next two notes hidden' },
  { id: 'ints', name: 'Intervals', blurb: 'Two notes at once: seconds to fifths, treble clef.', pool: T(60, 74), size: 2, goalMs: 4000 },
  { id: 'triads', name: 'Triads', blurb: 'Three notes stacked in thirds, treble clef.', pool: T(60, 71), size: 3, goalMs: 5000 },
]

export interface Card {
  pitches: number[] // ascending, or in playing order when `seq`
  seq?: boolean // a melodic fragment: one note per beat instead of one chord
  hand: Hand
  flat?: boolean // spelled as a flat
  sharp?: boolean // spelled as a sharp against a flat key
  fifths?: number // read in this key
  tag?: string // a different skill on the same notes: 'x' switching clefs, 'a1' / 'a2' reading ahead
}

export interface NoteStat {
  n: number // times seen
  clean: number // moving average of first-try correct, 0..1
  rt: number // moving average response time in ms
  box?: number // review box, 0..4
  due?: number // local day number when it is next due
}
export type Stats = Record<string, NoteStat>

const A = 0.3
const NEED = 12 // sightings before a card can count as mastered: about two sets on a small stage
// A card is the same skill wherever it is dealt, but F sharp and G flat are different reading, as are keys.
const key = (c: Card) =>
  (c.seq
    ? `s${c.pitches.length}:${clefFor(c.pitches[0], c.hand)}:${c.pitches.join('-')}${c.fifths ? `:f${c.fifths}` : ''}`
    : `${c.pitches.length}:${clefFor(c.pitches[0], c.hand)}:${c.pitches[0]}${c.flat ? ':b' : ''}${c.sharp ? ':s' : ''}${c.fifths ? `:f${c.fifths}` : ''}`) + (c.tag ? `:${c.tag}` : '')
export const cardKey = key

/** Days until a card is due again, by review box: a clean answer moves it up a box, a miss down one. */
export const INTERVALS = [1, 2, 4, 8, 16]

/** Whole local days since the epoch, so "today" does not move at UTC midnight. */
export const dayNum = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000)

export function record(stats: Stats, k: string, clean: boolean, rt: number, day = dayNum()): Stats {
  const s = stats[k]
  const c = clean ? 1 : 0
  const box = Math.min(INTERVALS.length - 1, Math.max(0, (s?.box ?? 0) + (clean ? 1 : -1)))
  const sched = { box, due: day + INTERVALS[box] }
  stats[k] = s
    ? { n: s.n + 1, clean: s.clean + A * (c - s.clean), rt: s.rt + A * (rt - s.rt), ...sched }
    : { n: 1, clean: c, rt, ...sched }
  return stats
}

const handOf = (p: number): Hand => (p >= 60 ? 'R' : 'L')

/** Every card a stage can deal. Intervals and triads stack diatonic steps on a white-key root. */
// Shapes of four notes as steps through a scale: runs, turns, a skip, a broken chord.
const SHAPES = [[0, 1, 2, 3], [3, 2, 1, 0], [0, 2, 1, 2], [2, 1, 0, 1], [0, 1, 0, 2], [0, 2, 4, 2], [4, 3, 1, 2], [0, 0, 1, 2]]

export function cards(stage: Stage): Card[] {
  const tag = stage.alt ? 'x' : stage.cover ? `a${stage.cover}` : undefined
  if (stage.scale) {
    const out: Card[] = []
    const sc = stage.scale
    for (let i = 0; i < sc.length; i++)
      for (const sh of SHAPES) {
        const idx = sh.map((s) => i + s)
        if (idx.every((x) => x < sc.length)) out.push({ pitches: idx.map((x) => sc[x]), seq: true, hand: stage.hand ?? handOf(sc[i]), fifths: stage.fifths, tag })
      }
    return out
  }
  const inKey = keyNotes(0, 127, stage.fifths)
  if (stage.size === 1)
    return stage.pool.map((p) => ({ pitches: [p], hand: stage.hand ?? handOf(p), flat: stage.flat && isBlack(p) ? true : undefined, sharp: stage.sharp && !inKey.includes(p) ? true : undefined, fifths: stage.fifths, tag }))
  // stacked on the key's own notes, so every note is in the key and needs no sign
  const ws = keyNotes(stage.pool[0], stage.pool[stage.pool.length - 1] + 12, stage.fifths)
  const out: Card[] = []
  for (const root of stage.pool) {
    const i = ws.indexOf(root)
    if (stage.size === 3) {
      if (ws[i + 4] !== undefined) out.push({ pitches: [root, ws[i + 2], ws[i + 4]], hand: 'R', fifths: stage.fifths })
    } else {
      for (const step of [1, 2, 3, 4]) if (ws[i + step] !== undefined) out.push({ pitches: [root, ws[i + step]], hand: 'R', fifths: stage.fifths })
    }
  }
  return out
}

/** A stage's set: weak cards dealt more; a switching stage alternates treble and bass, starting on either. */
export function stageDeck(stage: Stage, stats: Stats, goalMs: number, n: number, rnd: () => number = Math.random): Card[] {
  const pool = cards(stage)
  if (!stage.alt) return deck(pool, stats, goalMs, n, rnd)
  const sides = [pool.filter((c) => c.hand === 'R'), pool.filter((c) => c.hand === 'L')]
  if (rnd() < 0.5) sides.reverse()
  const [a, b] = [deck(sides[0], stats, goalMs, Math.ceil(n / 2), rnd), deck(sides[1], stats, goalMs, n >> 1, rnd)]
  return a.flatMap((c, i) => (b[i] ? [c, b[i]] : [c]))
}

/** How much the player needs this card: unseen and shaky cards are dealt more often. */
export function weight(stats: Stats, c: Card, goalMs: number, today = dayNum()): number {
  const s = stats[key(c)]
  if (!s) return 4
  return 1 + 4 * (1 - s.clean) + Math.min(2, s.rt / goalMs) + (s.n < 3 ? 1.5 : 0) + (s.due !== undefined && s.due <= today ? 2 : 0)
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

/** Cards of a stage that have been seen and are due for review. */
export function dueCards(stage: Stage, stats: Stats, today = dayNum()): number {
  return cards(stage).filter((c) => {
    const s = stats[key(c)]
    return s?.due !== undefined && s.due <= today
  }).length
}

/** What to read next: the earliest stage with cards due, else the first stage not yet solid. */
export function focus(stats: Stats, today = dayNum()): { stage: Stage; reason: 'due' | 'next'; due: number } {
  for (const stage of STAGES) {
    const due = dueCards(stage, stats, today)
    if (due) return { stage, reason: 'due', due }
  }
  return { stage: nextStage(stats), reason: 'next', due: 0 }
}

export interface Mastery {
  pct: number // 0..1
  solid: boolean // every card seen enough, clean and fast
  seen: number
  total: number
}

/** How well a stage is known against a clock: its own goal (Solid), or fluentMs (Fluent). Same stats either way. */
export function mastery(stage: Stage, stats: Stats, goal = stage.goalMs): Mastery {
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
    const speed = Math.min(1, goal / Math.max(s.rt, 1))
    const need = stage.need ?? NEED
    const got = Math.min(1, s.n / need) * s.clean * speed
    sum += got
    if (s.n < need || s.clean < 0.85 || s.rt > goal) solid = false
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
  // so are switching and reading-ahead cards, which need their own kind of set
  for (const st of STAGES.filter((s) => s.size === 1 && !s.fifths && !s.alt && !s.cover))
    for (const c of cards(st)) if (stats[key(c)]) seen.set(key(c), c)
  return [...seen.values()]
}

/** The cards the player is weakest at, worst first. */
const KEY_NAME = ['A♭', 'E♭', 'B♭', 'F', 'C', 'G', 'D', 'A', 'E'] // by fifths, -4..4 (Sight Run's keys)

export function weakest(stats: Stats, n = 3): { name: string; clean: number; rt: number }[] {
  return Object.entries(stats)
    .filter(([, s]) => s.n >= 2 && (s.clean < 0.9 || s.rt > 2500)) // only what actually needs work
    .map(([k, s]) => {
      const [size, clef, p, ...flags] = k.split(':')
      const fifths = Number(flags.find((f) => f.startsWith('f'))?.slice(1) ?? 0)
      const spelled = noteName(Number(p.split('-')[0]), flags.includes('b') ? -2 : flags.includes('s') ? 2 : fifths)
      const inKey = fifths ? `, key of ${KEY_NAME[fifths + 4]}` : ''
      const name = size === '1' ? `${spelled}, ${clef} clef${inKey}` : size.startsWith('s') ? `tune from ${spelled}${inKey}` : `${size === '2' ? 'interval' : 'triad'} on ${spelled}${inKey}`
      return { name, clean: s.clean, rt: s.rt, score: s.clean - Math.min(1, s.rt / 6000) * 0.4 }
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, n)
}

const BPM = 60

/** Where each note of a deck sits: a chord card on one beat, a melodic fragment on consecutive beats. `every` spaces the cards (a paced run at two beats a card). */
export function layout(d: Card[], every = 1): { beat: number; card: number; p: number; c: Card }[] {
  const out: { beat: number; card: number; p: number; c: Card }[] = []
  let beat = 0
  d.forEach((c, card) => {
    c.pitches.forEach((p, k) => out.push({ beat: c.seq ? beat + k : beat, card, p, c }))
    beat += c.seq ? c.pitches.length : every
  })
  return out
}

/** A paced run's pulse: the song's tempo and how many beats each card gets. */
export interface Pulse {
  bpm: number
  every: 1 | 2
}

/** A drill session as a song: one card per beat (a fragment takes four), four beats to a bar, read in wait mode. With a `pulse` it is a real tempo, and the cards sit on its beats. */
export function deckSong(id: string, title: string, d: Card[], fifths = 0, pulse?: Pulse): Song {
  const q = 60 / (pulse?.bpm ?? BPM)
  const every = pulse?.every ?? 1
  const lay = layout(d, every)
  const total = lay.length ? Math.max(...lay.map((x) => x.beat)) + every : 0
  const raw: Raw[] = lay.map((x) => ({ t: x.beat * q, d: q * 0.9 * every, p: x.p, v: 0.7, track: 0, h: x.c.hand, flat: x.c.flat, ...(x.c.sharp && { acc: 1 as const }) }))
  const bars: Bar[] = Array.from({ length: Math.ceil(total / 4) }, (_, i) => ({ i, t0: i * 4 * q, t1: (i + 1) * 4 * q, n: 4, den: 4 }))
  return build(id, title, raw, bars, fifths)
}

/** The card each note of a deckSong belongs to, in the song's own note order. */
export function noteCards(d: Card[], song: Song, pulse?: Pulse): number[] {
  const q = 60 / (pulse?.bpm ?? BPM)
  const at = new Map(layout(d, pulse?.every).map((x) => [`${x.beat}:${x.p}`, x.card]))
  return song.notes.map((n) => at.get(`${Math.round(n.t / q)}:${n.p}`) ?? 0)
}
