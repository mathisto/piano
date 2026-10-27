import { noteName } from './spell'
import { build, type Bar, type Hand, type Raw, type Song } from './song'

export type Form = 'major' | 'natural' | 'harmonic' | 'melodic' | 'chromatic' | 'arpMajor' | 'arpMinor' | 'dom7' | 'dim7'
export type Hands = 'R' | 'L' | 'both' | 'contrary' // both: parallel, an octave apart; contrary: from one note, apart and back
export interface Card {
  tonic: number // pitch class
  form: Form
  hands: Hands
  oct: 1 | 2
}

const STEPS: Record<Form, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  natural: [0, 2, 3, 5, 7, 8, 10],
  harmonic: [0, 2, 3, 5, 7, 8, 11],
  melodic: [0, 2, 3, 5, 7, 9, 11], // going up; coming down it is the natural minor
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  arpMajor: [0, 4, 7],
  arpMinor: [0, 3, 7],
  dom7: [0, 4, 7, 10], // by chord root: C dominant 7th is C E G B flat
  dim7: [0, 3, 6, 9],
}
const DOWN_MELODIC = STEPS.natural
const isMinor = (f: Form) => f === 'natural' || f === 'harmonic' || f === 'melodic' || f === 'arpMinor'
const isScale = (f: Form) => f === 'major' || f === 'natural' || f === 'harmonic' || f === 'melodic'
const BLACK = [1, 3, 6, 8, 10]

// Key signature (fifths) of each major tonic, and of each minor through its relative major.
const MAJOR_FIFTHS = [0, -5, 2, -3, 4, -1, 6, 1, -4, 3, -2, 5]
export function fifthsOf(tonic: number, form: Form): number {
  if (form === 'chromatic') return 0 // written with accidentals: sharps going up, flats coming down
  if (form === 'dom7') return MAJOR_FIFTHS[(tonic + 5) % 12] // the dominant of the key a fourth up
  if (form === 'dim7') return fifthsOf((tonic + 1) % 12, 'natural') // the seventh degree of the minor key a semitone up
  return isMinor(form) ? (tonic === 3 ? -6 : MAJOR_FIFTHS[(tonic + 3) % 12]) : MAJOR_FIFTHS[tonic]
}
const MAJOR_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']
const MINOR_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B']
const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
/** The twelve starting notes as the Key select names them for a form. */
export const keyLabels = (form: Form) => (form === 'chromatic' ? SHARP_NAMES : isMinor(form) || form === 'dim7' ? MINOR_NAMES : MAJOR_NAMES)
const KIND: Record<Form, string> = { major: 'major', natural: 'natural minor', harmonic: 'harmonic minor', melodic: 'melodic minor', chromatic: 'chromatic', arpMajor: 'major arpeggio', arpMinor: 'minor arpeggio', dom7: 'dominant 7th arpeggio', dim7: 'diminished 7th arpeggio' }
export const keyName = (tonic: number, form: Form) => `${keyLabels(form)[tonic]} ${KIND[form]}`

/**
 * Standard fingering, one octave up from the tonic (eight notes), right hand and left hand. Minor keys use the same
 * fingers for every form. From pianoscales.org, checked only in part against a second source: keys in UNCHECKED are
 * the ones to confirm against a printed book before anyone relies on them.
 */
const M = { R: '12312345', L: '54321321' }
const FINGERS: Record<string, { R: string; L: string }> = {
  M0: M, M2: M, M4: M, M7: M, M9: M,
  M5: { R: '12341234', L: '54321321' },
  M11: { R: '12312345', L: '43214321' },
  M1: { R: '23123412', L: '32143213' },
  M3: { R: '31234123', L: '32143213' },
  M6: { R: '23412312', L: '43213214' },
  M8: { R: '34123123', L: '32143213' },
  M10: { R: '41231234', L: '32143213' }, // right hand confirmed in Alfred's Complete Book of Scales: starts on 4, or on 2
  m9: M, m2: M, m4: M, m7: M, m0: M,
  m11: { R: '12312345', L: '43214321' },
  m5: { R: '12341234', L: '54321321' },
  m6: { R: '34123123', L: '43213214' },
  m1: { R: '34123123', L: '32143213' },
  m8: { R: '34123123', L: '32143213' },
  m3: { R: '31234123', L: '21432132' },
  m10: { R: '41231234', L: '21321432' },
}
const UNCHECKED = new Set(['m3:L', 'm10:R', 'm10:L', 'm6:R', 'm6:L', 'm11:L'])
export const fingering = (tonic: number, form: Form, h: Hand) => (isScale(form) ? FINGERS[`${isMinor(form) ? 'm' : 'M'}${tonic}`][h] : fingers(tonic, form, h, 1).join(''))

const mod = (a: number, n: number) => ((a % n) + n) % n

/**
 * The book's rule: each hand uses its fourth finger once an octave, and that one place fixes the rest. Right hand: the
 * 4th ends a group 1-2-3-4, and 1-2-3 follows it. Left hand: the 4th starts a group 4-3-2-1, and 3-2-1 follows it.
 * `d4` is the scale degree (1 to 7) that takes the fourth finger. The top note carries on the last group; a left hand
 * that would start on the thumb starts on the fifth finger instead.
 */
export function derive(d4: number, h: Hand, oct: number): number[] {
  const at = (c: number) => {
    if (h === 'R') return mod(c - d4 + 3, 7) < 4 ? 1 + mod(c - d4 + 3, 7) : 1 + mod(c - d4 - 1, 7)
    return mod(c - d4, 7) < 4 ? 4 - mod(c - d4, 7) : 3 - mod(c - d4 - 4, 7)
  }
  const out = Array.from({ length: 7 * oct }, (_, k) => at((k % 7) + 1))
  out.push(h === 'R' ? out[out.length - 1] + 1 : at(1))
  if (h === 'L' && out[0] === 1) out[0] = 5
  return out
}

// Two octaves of the keys whose left hand runs 4-3-2-1 twice in an octave (B, B minor): the thumb has to land on E and B.
// (Alfred's book: in the first octave B takes the 4th finger, then the thumb on every B after it.)
const TWO_OCT: Record<string, string> = { 'M11:L': '432143213214321', 'm11:L': '432143213214321' }

/** Fingers of a run up `oct` octaves, from the fourth-finger rule; where the printed octave disagrees with the rule, the printed one wins. */
export function fingers(tonic: number, form: Form, h: Hand, oct: number): number[] {
  if (form === 'chromatic') return chromaticFingers(tonic, h, oct)
  if (!isScale(form)) return arpeggioFingers(tonic, form, h, oct)
  const key = `${isMinor(form) ? 'm' : 'M'}${tonic}`
  const s = FINGERS[key][h]
  if (oct === 2 && TWO_OCT[`${key}:${h}`]) return [...TWO_OCT[`${key}:${h}`]].map(Number)
  const d = derive((s.indexOf('4') % 7) + 1, h, oct)
  return oct === 1 && d.join('') !== s ? [...s].map(Number) : d
}

/**
 * Chromatic fingering, by the usual convention and so for any starting note: the 3rd finger on every black key, the
 * thumb on a white key, except where two white keys follow each other (E F, B C). Right hand going up: 1 then 2
 * (E1 F2); left hand going up: 2 then 1 (E2 F1). From C: RH 1 3 1 3 1 2 3 1 3 1 3 1 2, LH 1 3 1 3 2 1 3 1 3 1 3 2 1.
 * Coming down, each hand retraces its fingers.
 */
function chromaticFingers(tonic: number, h: Hand, oct: number): number[] {
  const n = 12 * oct
  const white = (i: number) => !BLACK.includes((tonic + i) % 12)
  return Array.from({ length: n + 1 }, (_, i) => (!white(i) ? 3 : (h === 'R' ? i > 0 && white(i - 1) : i < n && white(i + 1)) ? 2 : 1))
}

/**
 * Arpeggio fingering from published group tables (docs/changes/fingers.md lists the sources): two octaves up as one string
 * per group, a code per root (C to B) picking the group. Triads: the white-key shape, the black-white-black keys with the
 * thumb on the white key, B flat's own left hand; sevenths: the thumb on a white key, 4th finger on a black one. One octave
 * is the first notes of it, a right hand ending in 5 keeping the 5.
 */
const ARP: Record<string, { pat: Record<string, string>; code: string }> = {
  'arpMajor:R': { pat: { w: '1231235', x: '2124124' }, code: 'wxwxwwwwxwxw' },
  'arpMajor:L': { pat: { a: '5421421', b: '5321321', c: '2142142', d: '3213213' }, code: 'acbcbaaacbdb' },
  'arpMinor:R': { pat: { w: '1231235', x: '2124124', y: '2312312' }, code: 'wxwwwwxwxwyw' },
  'arpMinor:L': { pat: { a: '5421421', c: '2142142', d: '3213213' }, code: 'acaaaacacada' },
  'dom7:R': { pat: { w: '123412345', f: '234123412', x: '412341234' }, code: 'wxwxwwfwxwxw' },
  'dom7:L': { pat: { w: '543214321', f: '432143214', x: '214321432', b: '321432143' }, code: 'wxwxwwfwxwbw' },
  'dim7:R': { pat: { w: '123412345', x: '412341234', y: '341234123' }, code: 'wxwywwxwxwyw' },
  'dim7:L': { pat: { w: '543214321', x: '321432143', y: '432143214' }, code: 'wxwywwxwywyw' },
}
function arpeggioFingers(tonic: number, form: Form, h: Hand, oct: number): number[] {
  const { pat, code } = ARP[`${form}:${h}`]
  const s = pat[code[tonic]]
  const k = STEPS[form].length
  return [...(oct === 2 ? s : h === 'R' && s.endsWith('5') ? s.slice(0, k) + '5' : s.slice(0, k + 1))].map(Number)
}

/** Contrary motion, left hand, as the run up from its lowest note: it copies the right hand's fingers unless that puts its thumb on a black key; then it keeps its own fingering. */
export function contraryLeft(tonic: number, form: Form, oct: number): { f: number[]; mirror: boolean; derived: boolean } {
  const own = fingers(tonic, form, 'L', oct)
  if (!isScale(form)) return { f: own, mirror: false, derived: false }
  const mir = fingers(tonic, form, 'R', oct).reverse()
  const I = STEPS[form]
  const ok = mir.every((f, j) => f !== 1 || !BLACK.includes((tonic + 12 * Math.floor(j / 7) + I[j % 7]) % 12))
  return ok ? { f: mir, mirror: true, derived: mir.join() !== own.join() } : { f: own, mirror: false, derived: false }
}

/** The scale as a song: eighth notes up and back, fingering carried on every note. */
export function scaleSong(c: Card, bpm: number): Song {
  const q = 60 / bpm
  const step = q / 2
  const I0 = STEPS[c.form]
  const k = I0.length
  const n = k * c.oct
  const up = Array.from({ length: n + 1 }, (_, d) => d)
  const order = [...up, ...up.slice(0, -1).reverse()]
  const raw: Raw[] = []
  const contrary = c.hands === 'contrary'
  const hands: Hand[] = c.hands === 'both' || c.hands === 'contrary' ? ['R', 'L'] : [c.hands]
  const start = 60 + c.tonic - (c.tonic > 6 ? 12 : 0) // contrary: both hands leave this note
  for (const h of hands) {
    const inv = contrary && h === 'L' // the left hand goes down first: it plays its own run up, backwards
    const fs = inv ? contraryLeft(c.tonic, c.form, c.oct).f : fingers(c.tonic, c.form, h, c.oct)
    const low = contrary ? (inv ? start - 12 * c.oct : start) : (h === 'R' ? 60 : 48) + c.tonic
    order.forEach((d, i) => {
      if (inv && (i === 0 || i === order.length - 1)) return // the unison is one note, the right hand's
      const j = inv ? n - d : d
      const down = inv ? i < n : i > n
      const I = down && c.form === 'melodic' ? DOWN_MELODIC : I0
      const black = c.form === 'chromatic' && BLACK.includes((low + 12 * Math.floor(j / k) + I[j % k]) % 12)
      raw.push({ t: i * step, d: step * 0.95, p: low + 12 * Math.floor(j / k) + I[j % k], v: 0.7, track: 0, h, f: fs[j], ...(black && { acc: down ? -1 : 1, flat: down }) })
    })
  }
  const total = order.length
  const bars: Bar[] = Array.from({ length: Math.ceil(total / 8) }, (_, i) => ({ i, t0: i * 4 * q, t1: (i + 1) * 4 * q, n: 4, den: 4 }))
  const title = `${keyName(c.tonic, c.form)}, ${c.oct === 1 ? 'one octave' : 'two octaves'}${c.hands === 'both' ? ', hands together' : contrary ? ', contrary motion' : c.hands === 'L' ? ', left hand' : ', right hand'}`
  return { ...build(`scale:${c.form}:${c.tonic}:${c.hands}:${c.oct}:${bpm}`, title, raw, bars, fifthsOf(c.tonic, c.form)), dyn: 'even' }
}

// ---------------------------------------------------------------- the curriculum

export interface Stat {
  streak: number // clean runs in a row at the tempo being worked on
  best: number // fastest tempo with three clean runs, 0 if none yet
  n: number
}
export type ScaleStats = Record<string, Stat>
export const cardKey = (c: Card) => `${c.form}:${c.tonic}:${c.hands}:${c.oct}`
export const parseId = (id: string): { card: Card; bpm: number } | null => {
  const m = /^scale:(major|natural|harmonic|melodic|chromatic|arpMajor|arpMinor|dom7|dim7):(\d+):(R|L|both|contrary):([12]):(\d+)$/.exec(id)
  return m ? { card: { form: m[1] as Form, tonic: Number(m[2]), hands: m[3] as Hands, oct: Number(m[4]) as 1 | 2 }, bpm: Number(m[5]) } : null
}

type Combo = [Hands, 1 | 2]
export interface Stage {
  id: string
  name: string
  blurb: string
  keys: [number, Form][]
  combos: Combo[]
  bpm: number // eighth notes, at this many beats a minute
}

const maj = (...t: number[]): [number, Form][] => t.map((x) => [x, 'major'])
const min = (...t: number[]): [number, Form][] => t.map((x) => [x, 'harmonic'])
const SEP: Combo[] = [['R', 1], ['L', 1]]
export const STAGES: Stage[] = [
  { id: 's1', name: 'The easy keys', blurb: 'C, G and F major; A and D minor. One octave, each hand on its own.', keys: [...maj(0, 7, 5), ...min(9, 2)], combos: SEP, bpm: 60 },
  { id: 's2', name: 'The easy keys, longer', blurb: 'The same five keys over two octaves, then hands together.', keys: [...maj(0, 7, 5), ...min(9, 2)], combos: [['R', 2], ['L', 2], ['both', 1]], bpm: 66 },
  { id: 's3', name: 'Two more sharps', blurb: 'D, A and E major; E and G minor.', keys: [...maj(2, 9, 4), ...min(4, 7)], combos: [...SEP, ['R', 2], ['L', 2], ['both', 1]], bpm: 66 },
  { id: 's4', name: 'The black-key keys', blurb: 'B and D flat first, as Chopin taught: the long fingers sit on the black keys. Then E flat, F sharp, A flat, B flat and their minors.', keys: [...maj(11, 1, 3, 6, 8, 10), ...min(11, 6, 1, 8, 3, 10)], combos: [...SEP, ['both', 1]], bpm: 60 },
  { id: 's5', name: 'All 24 keys together', blurb: 'Every major and harmonic minor, hands together over two octaves.', keys: [...maj(0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5), ...min(9, 4, 11, 6, 1, 8, 3, 10, 5, 0, 7, 2)], combos: [['both', 2]], bpm: 80 },
  { id: 's6', name: 'Up to speed', blurb: 'All 24 keys again, faster.', keys: [...maj(0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5), ...min(9, 4, 11, 6, 1, 8, 3, 10, 5, 0, 7, 2)], combos: [['both', 2]], bpm: 100 },
]

const ALL_MAJ = maj(0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5)
const ALL_MIN = min(9, 4, 11, 6, 1, 8, 3, 10, 5, 0, 7, 2)
const triads = (f: 'arpMajor' | 'arpMinor', ...t: number[]): [number, Form][] => t.map((x) => [x, f])
const EASY = [...triads('arpMajor', 0, 7, 5), ...triads('arpMinor', 9, 2)]
const ALL_ARP = [...triads('arpMajor', 0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5), ...triads('arpMinor', 9, 4, 11, 6, 1, 8, 3, 10, 5, 0, 7, 2)]
const chrom = (...t: number[]): [number, Form][] => t.map((x) => [x, 'chromatic'])
const seventh = (f: 'dom7' | 'dim7', ...t: number[]): [number, Form][] => t.map((x) => [x, f])
STAGES.push(
  { id: 's7', name: 'Contrary motion', blurb: 'Both hands leave one note and move apart: C, G, F, D, A, E major and A, E, D minor. One octave.', keys: [...maj(0, 7, 5, 2, 9, 4), ...min(9, 4, 2)], combos: [['contrary', 1]], bpm: 60 },
  { id: 's8', name: 'Contrary motion, all keys', blurb: 'Every major and harmonic minor, two octaves, the hands meeting back on the first note.', keys: [...ALL_MAJ, ...ALL_MIN], combos: [['contrary', 2]], bpm: 72 },
  { id: 's9', name: 'The chromatic scale', blurb: 'Thumb on white keys, 3rd finger on black. Each hand, then an octave apart, then in contrary motion, from C.', keys: chrom(0), combos: [['R', 1], ['L', 1], ['both', 2], ['contrary', 2]], bpm: 60 },
  { id: 's10', name: 'Chromatic from every note', blurb: 'The twelve starting notes, two octaves, hands an octave apart.', keys: chrom(0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5), combos: [['both', 2]], bpm: 72 },
  { id: 's11', name: 'Triad arpeggios', blurb: 'The broken chord up and down: C, G and F major, A and D minor. Each hand, then together.', keys: EASY, combos: [['R', 1], ['L', 1], ['both', 1]], bpm: 60 },
  { id: 's12', name: 'Arpeggios in all keys', blurb: 'Every major and minor triad, two octaves, hands together.', keys: ALL_ARP, combos: [['both', 2]], bpm: 72 },
  { id: 's13', name: 'Seventh arpeggios', blurb: 'Dominant sevenths on all twelve roots, then the three diminished sevenths, one octave, hands together.', keys: [...seventh('dom7', 0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5), ...seventh('dim7', 0, 1, 2)], combos: [['both', 1]], bpm: 60 },
)

export const cardsOf = (s: Stage): Card[] => s.keys.flatMap(([tonic, form]) => s.combos.map(([hands, oct]) => ({ tonic, form, hands, oct })))
export const solid = (stats: ScaleStats, c: Card, bpm: number) => (stats[cardKey(c)]?.best ?? 0) >= bpm

export function mastery(s: Stage, stats: ScaleStats) {
  const cs = cardsOf(s)
  const done = cs.filter((c) => solid(stats, c, s.bpm)).length
  return { pct: cs.length ? done / cs.length : 0, solid: done === cs.length, done, total: cs.length }
}

/** The first scale of a stage that is not solid yet, or the first one. */
export const nextCard = (s: Stage, stats: ScaleStats): Card => cardsOf(s).find((c) => !solid(stats, c, s.bpm)) ?? cardsOf(s)[0]
/** The first stage with something left to do. */
export const nextStage = (stats: ScaleStats): Stage => STAGES.find((s) => !mastery(s, stats).solid) ?? STAGES[STAGES.length - 1]

export const CLEAN_RUNS = 3

/** A run that counts: every note, no stray ones, in time, and not an uneven touch when that is being judged. */
export const passed = (r: { clean: boolean; acc: number; even: { rating: string } | null }) => r.clean && r.acc >= 0.85 && r.even?.rating !== 'uneven'

/** Three clean runs in a row at a tempo make it solid at that tempo; a bad run starts the count again. */
export function record(stats: ScaleStats, c: Card, bpm: number, ok: boolean): ScaleStats {
  const k = cardKey(c)
  const s = stats[k] ?? { streak: 0, best: 0, n: 0 }
  const streak = ok ? s.streak + 1 : 0
  stats[k] = { n: s.n + 1, streak: streak >= CLEAN_RUNS ? 0 : streak, best: streak >= CLEAN_RUNS ? Math.max(s.best, bpm) : s.best }
  return stats
}

// ---------------------------------------------------------------- why this fingering, and the quiz on it

/** The scale degrees that take the 4th finger: one a hand, except B's left hand, which has two. */
export function fourth(tonic: number, form: Form, h: Hand): number[] {
  const s = fingering(tonic, form, h)
  const first = (s.indexOf('4') % 7) + 1
  return h === 'L' && s === '43214321' ? [1, 5] : [first]
}

/** The name of a scale degree in a key, without its octave: A sharp, not A#4. */
export const degreeName = (tonic: number, form: Form, degree: number) => noteName(60 + ((tonic + STEPS[form][degree - 1]) % 12), fifthsOf(tonic, form)).replace(/\d+$/, '')

const list = (ds: number[]) => (ds.length === 1 ? `${ds[0]}` : `${ds.slice(0, -1).join(', ')} and ${ds[ds.length - 1]}`)
const cyc = (from: number, n: number) => Array.from({ length: n }, (_, i) => mod(from - 1 + i, 7) + 1)

/** The reason for a fingering, in the book's terms: where the 4th finger sits and the two groups it makes. */
export function why(tonic: number, form: Form, h: Hand): string {
  const [d] = fourth(tonic, form, h)
  const at = fourth(tonic, form, h).map((x) => `${degreeName(tonic, form, x)} (degree ${x})`).join(' and ')
  if (h === 'L' && fourth(tonic, form, h).length === 2)
    return `Left hand: the 4th finger sits on ${at}, so each half of the octave runs 4-3-2-1, ending on the thumb at E and B. In the first octave B takes the 4th finger; after that B takes the thumb.`
  if (h === 'R') return `Right hand: the 4th finger ends a group 1-2-3-4, on ${at}. That group is degrees ${list(cyc(d - 3, 4))}; the other is 1-2-3 on degrees ${list(cyc(d + 1, 3))}.`
  return `Left hand: the 4th finger starts a group 4-3-2-1, on ${at}. That group is degrees ${list(cyc(d, 4))}; the other is 3-2-1 on degrees ${list(cyc(d + 4, 3))}.`
}

/** The hands whose fingering for this card nobody has checked against the book: every arpeggio, chromatic from any note but C, and a contrary left hand that is not a table fingering. */
export function unchecked(c: Card): Hand[] {
  if (c.form === 'chromatic') return c.tonic === 0 ? [] : ['R', 'L']
  if (!isScale(c.form)) return ['R', 'L']
  const t = (h: Hand) => UNCHECKED.has(`${isMinor(c.form) ? 'm' : 'M'}${c.tonic}:${h}`)
  return (['R', 'L'] as const).filter((h) => t(h) || (h === 'L' && c.hands === 'contrary' && contraryLeft(c.tonic, c.form, c.oct).derived))
}

/** One plain sentence when a card's fingering (of one hand, if `only`) is not from a checked book table; empty otherwise. */
export function checkNote(c: Card, only?: Hand): string {
  const u = unchecked(c).filter((h) => !only || h === only)
  if (!u.length) return ''
  const hs = u.length === 2 ? 'both hands' : u[0] === 'R' ? 'the right hand' : 'the left hand'
  return `${isScale(c.form) ? `Fingering for ${hs}` : `The fingering for ${hs}`} is ${isScale(c.form) ? '' : 'from teaching tables, '}not yet checked against a book; your teacher or book wins.`
}

/** What the Choose a scale card says about the fingering: the lead-in, each hand's fingers (the left hand going down in contrary motion), and the reasons. */
export function explain(c: Card): { lead: string; r: string; l: string; why: string[] } {
  const j = (a: number[]) => a.join(' ')
  const contrary = c.hands === 'contrary'
  const r = isScale(c.form) && !contrary ? [...fingering(c.tonic, c.form, 'R')].map(Number) : fingers(c.tonic, c.form, 'R', c.oct)
  const lAsc = contrary ? contraryLeft(c.tonic, c.form, c.oct).f : isScale(c.form) ? [...fingering(c.tonic, c.form, 'L')].map(Number) : fingers(c.tonic, c.form, 'L', c.oct)
  const l = contrary ? [...lAsc].reverse() : lAsc
  const lead = contrary ? 'Fingering out from the start' : `Fingering up the ${isScale(c.form) || c.form === 'chromatic' ? 'scale' : 'arpeggio'}`
  const why_: string[] = []
  if (isScale(c.form)) {
    why_.push(why(c.tonic, c.form, 'R'), contrary ? '' : why(c.tonic, c.form, 'L'))
    if (contrary) why_.push(contraryLeft(c.tonic, c.form, c.oct).mirror ? 'Contrary motion: the left hand uses the same fingers as the right, so the thumbs and the long fingers meet.' : 'Contrary motion: the left hand cannot copy the right here (its thumb would land on a black key), so each hand keeps its usual fingering.')
  } else if (c.form === 'chromatic')
    why_.push('The thumb on white keys, the 3rd finger on black keys. Where two white keys follow each other (E F, B C) the right hand plays 1 then 2 going up, the left hand 2 then 1. Coming down each hand retraces its fingers.')
  else why_.push('The group fingering several teaching tables agree on: the fingers repeat every octave, the thumb crosses under once and goes on a white key where it can, the long fingers on the black keys.')
  why_.push(checkNote(c))
  return { lead, r: j(r), l: j(l), why: why_.filter(Boolean) }
}

export interface QCard {
  tonic: number
  form: Form
  hand: Hand
}
export type QuizStats = Record<string, { n: number; ok: number }>
const qkey = (c: QCard) => `${c.form}:${c.tonic}:${c.hand}`

/** `n` cards, the keys you miss or have not met dealt more often, never the same one twice running. */
export function quizDeal(stats: QuizStats, n: number, rnd: () => number = Math.random): QCard[] {
  const pool: QCard[] = (['major', 'harmonic'] as const).flatMap((form) => Array.from({ length: 12 }, (_, tonic) => (['R', 'L'] as const).map((hand) => ({ tonic, form, hand }))).flat())
  const out: QCard[] = []
  for (let i = 0; i < n; i++) {
    const cand = pool.filter((c) => !out.length || qkey(c) !== qkey(out[out.length - 1]))
    const w = cand.map((c) => {
      const t = stats[qkey(c)]
      return t ? 1 + 3 * (1 - t.ok / t.n) + (t.n < 2 ? 2 : 0) : 3
    })
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

export const quizRight = (c: QCard, degree: number) => fourth(c.tonic, c.form, c.hand).includes(degree)
export function quizRecord(stats: QuizStats, c: QCard, ok: boolean): QuizStats {
  const t = stats[qkey(c)] ?? { n: 0, ok: 0 }
  stats[qkey(c)] = { n: t.n + 1, ok: t.ok + (ok ? 1 : 0) }
  return stats
}
/** Which degree of the key a pressed note is, whatever its octave; 0 when it is not in the scale. */
export const degreeOfPitch = (tonic: number, form: Form, p: number) => STEPS[form].findIndex((x) => (tonic + x) % 12 === p % 12) + 1
