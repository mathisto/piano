import type { PulsePlay } from './pulse'
import { MAJOR, NAMES, pc, type TCard } from './theory-cards'

/** Ear trainers: the app plays, the player plays it back. Pure logic only; the sound is in ear-play.ts. */
export type Play =
  | { kind: 'notes'; ev: { p: number[]; at: number; dur: number }[] } // pitches sounded together, ms from the start
  | { kind: 'rhythm'; onsets: number[] } // eighth notes from the downbeat of one bar of 4/4
  | PulsePlay // the pulse trainers (pulse.ts)
  | { kind: 'qa'; ev: { p: number[]; at: number; dur: number }[]; cells: number[]; tonic: number; minor: boolean; end: 'tonic' | 'dominant'; echo: boolean } // a two-bar phrase, then two bars of the player's own (ear2.ts)

/** Tunable: tempo, the half-width of a good tap, the biggest whole-bar offset still counted, a chord's keys count as one tap, the wait for a stray extra tap. */
export const RHYTHM = { bpm: 80, window: 110, maxBias: 250, merge: 60, grace: 400 }
const NOTE_MS = 600 // a phrase note and the gap to the next

export const MINOR = [0, 2, 3, 5, 7, 8, 10]

/** A small deterministic generator, so the same level always deals the same cards and the spaced review can find them again. */
export function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const tonicMidi = (t: number) => 60 + (t > 6 ? t - 12 : t) // C4 up to F♯4, then B3 and below for the flat side
export const noteAt = (tonic: number, sc: number[], k: number) => tonicMidi(tonic) + 12 * Math.floor(k / 7) + sc[((k % 7) + 7) % 7]

const notes = (ps: number[], step = NOTE_MS): Play => ({ kind: 'notes', ev: ps.map((p, i) => ({ p: [p], at: i * step, dur: step - 50 })) })

// ---- play it back ----
const PLAY_LEVELS = [
  { steps: [1], keys: [0], minor: false, chroma: false }, // stepwise in C major
  { steps: [1, 2], keys: [0], minor: false, chroma: false }, // steps and thirds
  { steps: [1, 2, 3, 4, 7], keys: [0], minor: false, chroma: false }, // leaps up to an octave
  { steps: [1, 2, 3, 4], keys: [7, 5, 2, 10, 9, 3], minor: false, chroma: false }, // G, F, D, B♭, A, E♭
  { steps: [1, 2, 3, 4], keys: [0, 9, 2, 4, 7, 11], minor: true, chroma: false }, // natural minor
  { steps: [1, 2, 3], keys: [0, 7, 5, 2], minor: false, chroma: true }, // a note off the scale
]

/** Phrases of 2 to 5 notes (longer at higher levels), 90 per level. */
export function playCards(level: number): TCard[] {
  const L = PLAY_LEVELS[level - 1]
  const rnd = seeded(1000 + level)
  const out = new Map<string, TCard>()
  for (let guard = 0; out.size < 90 && guard < 2000; guard++) {
    const tonic = L.keys[Math.floor(rnd() * L.keys.length)]
    const sc = L.minor ? MINOR : MAJOR
    const n = 2 + Math.min(3, Math.floor(rnd() * (2 + level)))
    let k = Math.floor(rnd() * 5)
    const ks = [k]
    while (ks.length < n) {
      let d = L.steps[Math.floor(rnd() * L.steps.length)] * (rnd() < 0.5 ? -1 : 1)
      if (k + d < -2 || k + d > 9) d = -d
      k += d
      ks.push(k)
    }
    const ps = ks.map((x) => noteAt(tonic, sc, x))
    if (L.chroma) {
      const i = Math.floor(rnd() * n)
      const alt = ps[i] + (rnd() < 0.5 ? 1 : -1)
      if (!sc.map((s) => pc(tonic + s)).includes(pc(alt))) ps[i] = alt
      else continue // nothing off the scale: not a level-6 phrase
    }
    const id = `ear:play:${level}:${tonic}:${ps.join('-')}`
    const word = `${NAMES[tonic]} ${L.minor ? 'minor' : 'major'}`
    out.set(id, { id, prompt: `Listen: ${n} notes in ${word}`, name: `${n} notes in ${word}`, steps: ps.map((p) => ({ pcs: [pc(p)] })), show: ps.map((p) => NAMES[pc(p)]).join(' '), play: notes(ps, NOTE_MS) })
  }
  return [...out.values()]
}

// ---- intervals ----
const SETS = [[1, 2, 3, 4], [5, 7], [8, 9, 10, 11], [12], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]]
const IVNAME = ['unison', 'minor 2nd', 'major 2nd', 'minor 3rd', 'major 3rd', 'perfect 4th', 'tritone', 'perfect 5th', 'minor 6th', 'major 6th', 'minor 7th', 'major 7th', 'octave']

/** Two notes: one after the other going up or down, or together. The first is named; play the second (the upper, when together). */
export function intervalCards(level: number): TCard[] {
  const out: TCard[] = []
  for (let root = 0; root < 12; root++)
    for (const n of SETS[level - 1])
      for (const dir of ['up', 'down', 'both'] as const) {
        const a = 60 + root
        const b = dir === 'down' ? a - n : a + n
        const iv = `${/^[aeiou]/.test(IVNAME[n]) ? 'an' : 'a'} ${IVNAME[n]}`
        out.push({
          id: `ear:iv:${n}:${dir}:${root}`,
          prompt: dir === 'both' ? `Two notes together, the lower is ${NAMES[root]}: play the higher` : `Hear ${NAMES[root]}, then another note: play that second note`,
          name: `${IVNAME[n]} ${dir === 'both' ? 'together' : dir}`,
          steps: [{ pcs: [pc(b)], abs: n === 12 ? b : undefined }],
          show: `${NAMES[pc(b)]}, ${iv} ${dir === 'down' ? 'below' : 'above'} ${NAMES[root]}`,
          play: { kind: 'notes', ev: dir === 'both' ? [{ p: [a, b], at: 0, dur: 1500 }] : [{ p: [a], at: 0, dur: 850 }, { p: [b], at: 1000, dur: 1000 }] },
        })
      }
  return out
}

// ---- scale degrees ----
const DEG_LEVELS = [{ degs: [1, 3, 5], keys: [0, 7, 5] }, { degs: [1, 2, 3, 4, 5, 6, 7], keys: [0, 7, 5] }, { degs: [1, 2, 3, 4, 5, 6, 7], keys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }]
const CADENCE = [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]] // I IV V I, close position

/** A cadence sets the key; then one note, the Nth degree, to play back. */
export function degreeCards(level: number): TCard[] {
  const L = DEG_LEVELS[level - 1]
  const out: TCard[] = []
  for (const tonic of L.keys)
    for (const d of L.degs) {
      const T = tonicMidi(tonic)
      const target = T + MAJOR[d - 1]
      const ev = CADENCE.map((c, i) => ({ p: c.map((x) => T - 12 + x), at: i * 650, dur: i === 3 ? 1100 : 600 }))
      ev.push({ p: [target], at: 4 * 650 + 700, dur: 1200 })
      out.push({ id: `ear:deg:${tonic}:${d}`, prompt: 'Hear a cadence, then one note: play that note', name: `degree ${d} of ${NAMES[tonic]} major`, steps: [{ pcs: [pc(target)] }], show: `Degree ${d} of ${NAMES[tonic]} major: ${NAMES[pc(target)]}`, play: { kind: 'notes', ev } })
    }
  return out
}

// ---- rhythm echo ----
type Unit = number[] // note lengths in eighths
const Q: Unit = [2]
const H: Unit = [4]
const EE: Unit = [1, 1]
const DQ: Unit = [3, 1]
const RHYTHM_UNITS: Unit[][] = [[Q, H], [Q, H, EE], [Q, H, EE, DQ]]

/** Every way to fill a bar of eight eighths with these units, as onset positions. */
function fill(units: Unit[], at = 0, got: number[] = [], used: Unit[] = []): { onsets: number[]; used: Unit[] }[] {
  if (at === 8) return [{ onsets: got, used }]
  return units.flatMap((u) => {
    const len = u.reduce((a, b) => a + b, 0)
    if (at + len > 8) return []
    let p = at
    const on = u.map((x) => ((p += x), p - x))
    return fill(units, at + len, [...got, ...on], [...used, u])
  })
}

/** Syncopation: an onset on an off-beat eighth that holds across the next beat. */
function syncopated(lens: number[]) {
  let p = 0
  return lens.some((l) => {
    const hit = p % 2 === 1 && l >= 2
    p += l
    return hit
  })
}
function lengths(at = 0, got: number[] = []): number[][] {
  if (at === 8) return [got]
  return [1, 2, 3, 4].flatMap((l) => (at + l <= 8 ? lengths(at + l, [...got, l]) : []))
}

/** Level 1 quarters and halves; 2 adds eighths; 3 dotted rhythms; 4 syncopation. */
export function rhythmCards(level: number): TCard[] {
  let pats: number[][]
  if (level === 4) pats = lengths().filter(syncopated).map((ls) => ls.map((_, i) => ls.slice(0, i).reduce((a, b) => a + b, 0)))
  else {
    const need = level === 1 ? undefined : level === 2 ? EE : DQ
    pats = fill(RHYTHM_UNITS[level - 1]).filter((f) => !need || f.used.includes(need)).map((f) => f.onsets)
  }
  return pats.map((onsets) => ({
    id: `ear:rhy:${onsets.join('')}`,
    prompt: 'Echo the bar',
    name: `rhythm ${grid(onsets)}`,
    steps: [],
    show: 'Here is the bar',
    play: { kind: 'rhythm', onsets },
  }))
}

/** The bar as eight eighth-note cells: x is a tap, a dot is a gap; a bar line every beat. */
export const grid = (onsets: number[]) =>
  Array.from({ length: 8 }, (_, i) => (onsets.includes(i) ? 'x' : '·')).reduce((s, c, i) => s + (i && i % 2 === 0 ? ' ' : '') + c, '')

export const beatMs = () => 60000 / RHYTHM.bpm

export interface TapScore {
  ok: boolean
  bias: number // ms, the mean offset of the taps from the grid: positive is late
  spread: number // ms, the standard deviation of the taps once the bias is taken out
  note?: string
}

/** Score taps against moments in ms (`win` is one half-width for all, or one per moment). The mean offset is the player's bias (and the speaker's lag); what is judged is each tap's distance from the grid once that is taken away. */
export function scoreAt(at: number[], taps: number[], win: number | number[] = RHYTHM.window): TapScore {
  if (taps.length !== at.length) return { ok: false, bias: 0, spread: 0, note: `You tapped ${taps.length} of ${at.length}.` }
  const err = taps.map((t, i) => t - at[i])
  const bias = err.reduce((a, b) => a + b, 0) / err.length
  const dev = err.map((e) => e - bias)
  const spread = Math.sqrt(dev.reduce((a, d) => a + d * d, 0) / Math.max(1, err.length - 1))
  return { ok: dev.every((d, i) => Math.abs(d) <= (typeof win === 'number' ? win : win[i])) && Math.abs(bias) <= RHYTHM.maxBias, bias, spread }
}

/** Score taps against a bar of eighth-note onsets. */
export const scoreTaps = (onsets: number[], taps: number[], win = RHYTHM.window) => scoreAt(onsets.map((o) => (o * beatMs()) / 2), taps, win)

/** "Bias 12 ms late, spread 18 ms": the offset of the bar from the click, and how even the taps were inside it, kept apart. */
export function biasText(bias: number, spread: number) {
  const b = Math.round(bias)
  return `Bias ${Math.abs(b) < 5 ? 'none' : `${Math.abs(b)} ms ${b > 0 ? 'late' : 'early'}`}, spread ${Math.round(spread)} ms`
}

// ---- the card, as markup ----
export interface EarView {
  replays: number
  last: string // the verdict on the rhythm just tapped
  summary: string // for the results card
}

/** What the player is told to do, and the controls and answer grid beside the prompt. */
export const earAsk = (c: TCard) => c.ask ?? (c.play?.kind === 'rhythm' ? 'Listen to the bar, then tap it back on the click, on any key.' : c.play?.kind === 'pulse' ? c.play.ask : 'Listen, then play it back on your keyboard, in any octave.')

/** The bar as eight cells counted 1 & 2 & 3 & 4 &, the taps filled in. */
const cells = (onsets: number[]) => {
  const say = (i: number) => (i % 2 ? '&' : String(i / 2 + 1))
  return `<div class="ear-grid" role="img" aria-label="Taps on ${onsets.map(say).join(', ')}">${Array.from({ length: 8 }, (_, i) => `<i${onsets.includes(i) ? ' class="on"' : ''}>${say(i)}</i>`).join('')}</div>`
}

export function earBlock(c: TCard, v: EarView, answered?: 'ok' | 'miss') {
  const p = c.play!
  const shape = p.kind === 'rhythm' && answered ? cells(p.onsets) : ''
  const last = v.last && answered ? `<p class="line">${v.last}</p>` : ''
  return `${last}${shape}`
}

/** Replay, at the left of the card's Stop row while the card waits for an answer. */
export const replayBtn = (v: EarView) => `<button class="btn ghost" id="thReplay">Replay${v.replays ? ` · ${v.replays}` : ''}</button>`
