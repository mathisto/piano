import './coach.css'
import { judged, lines, MIN_RUN } from './even'
import type { Edges } from './touch'
import type { Hand, Note } from './song'
import { settings } from './settings'
import * as store from './store'

/** How a run was played over time, from the key downs and ups: timing evenness, legato or staccato, the balance of the hands. */

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const mad = (xs: number[]) => {
  const m = median(xs)
  return median(xs.map((x) => Math.abs(x - m))) * 1.48
}

// ---------- timing ----------

export interface Timing {
  n: number // gaps compared
  spread: number // ms: robust spread of each gap against its written length; a constant lead or lag does not move it
  bias: number // ms: mean offset from the beat, + is late
}

const ON_BEAT = 8 // ms: a lean under this is centred, as the timing histogram says

/** `off` is each struck note's offset from its written time in real ms (Judge.off). Gaps are taken per hand, so bias cancels out of the spread. */
export function timing(hits: { t: number; p: number; h: Hand; off: number }[]): Timing | null {
  const gaps = lines(hits).flatMap((l) => l.slice(1).map((x, i) => x.off - l[i].off))
  if (gaps.length < MIN_RUN - 1) return null
  return { n: gaps.length, spread: mad(gaps), bias: mean(hits.map((x) => x.off)) }
}

export function timingLine(x: Timing) {
  const b = Math.round(Math.abs(x.bias))
  const lean = Math.abs(x.bias) < ON_BEAT ? 'you sit on the beat' : `you run <b>${b} ms</b> ${x.bias > 0 ? 'behind' : 'ahead of'} the beat`
  return `Timing: your gaps vary by about <b>${Math.round(x.spread)} ms</b>; ${lean}.`
}

// ---------- articulation ----------

export interface Press {
  i: number // note index
  down: number // performance.now() ms
  up: number
}

export interface Artic {
  kind: 'legato' | 'staccato'
  n: number // joins (legato) or notes (staccato) judged
  ok: number
  typical: number // legato: median overlap in ms, + overlaps, - a gap; staccato: median share of the written value held
}

// Tolerant on purpose: MIDI and a web view add jitter, and the research only says "slight overlap" and "short".
export const LEGATO_GAP = 30 // ms: a lift shorter than this still sounds joined
export const LEGATO_BLUR = 120 // ms: overlap past this (or a third of the gap, if longer) smears the two notes
export const STACCATO_MAX = 0.5 // share of the written value: held longer than this is not detached

/** Legato: the overlap of each key with the next one in its hand. Staccato: how much of each written value the key was held. */
export function articulation(kind: Artic['kind'], notes: Note[], presses: Press[], rate: number): Artic | null {
  const by = new Map(presses.map((x) => [x.i, x])) // a note struck twice (Learn's hold-to-advance) keeps its last press
  const played = [...by.values()].map((x) => ({ ...x, t: notes[x.i].t, p: notes[x.i].p, h: notes[x.i].h }))
  const onsets = { R: [] as number[], L: [] as number[] }
  for (const n of notes) if (onsets[n.h].at(-1) !== n.t) onsets[n.h].push(n.t)
  const marks: number[] = []
  let ok = 0
  for (const l of lines(played))
    for (let k = 0; k < l.length; k++) {
      const a = l[k]
      const ts = onsets[a.h]
      const next = ts[ts.indexOf(a.t) + 1]
      if (next === undefined) continue
      const gapMs = ((next - a.t) / rate) * 1000
      if (kind === 'staccato') {
        const share = (a.up - a.down) / gapMs
        marks.push(share)
        if (share <= STACCATO_MAX) ok++
      } else {
        const b = l[k + 1]
        if (!b || b.t !== next) continue // the next note was missed: no join to judge
        const over = a.up - b.down
        marks.push(over)
        if (over >= -LEGATO_GAP && over <= Math.max(LEGATO_BLUR, gapMs / 3)) ok++
      }
    }
  return marks.length >= MIN_RUN - 1 ? { kind, n: marks.length, ok, typical: median(marks) } : null
}

export function articLine(a: Artic) {
  if (a.kind === 'staccato') return `Staccato: <b>${a.ok} of ${a.n}</b> notes short; you hold about <b>${Math.round(a.typical * 100)}%</b> of each note's value.`
  const t = Math.round(Math.abs(a.typical))
  const how = a.typical < -LEGATO_GAP ? `you lift about <b>${t} ms</b> before the next note` : a.typical > LEGATO_BLUR ? `keys overlap by about <b>${t} ms</b>, which blurs` : `keys overlap by about <b>${Math.max(0, Math.round(a.typical))} ms</b>`
  return `Legato: <b>${a.ok} of ${a.n}</b> joins smooth; ${how}.`
}

// ---------- voicing ----------

export interface Voicing {
  gap: number // mean right-hand velocity minus mean left
  aim: number // the melody hand should be at least this much louder
}

export const BALANCE_SHARE = 0.25 // of the calibrated soft-to-hard range: about 10 on the default bands

/** The right hand (the melody) over the left. Null without four notes in each hand. */
export function voicing(samples: { v: number; h: Hand }[], e: Edges): Voicing | null {
  const R = samples.filter((s) => s.h === 'R').map((s) => s.v)
  const L = samples.filter((s) => s.h === 'L').map((s) => s.v)
  if (R.length < 4 || L.length < 4) return null
  return { gap: mean(R) - mean(L), aim: Math.max(3, Math.round((e.hard - e.soft) * BALANCE_SHARE)) }
}

export function voiceLine(x: Voicing) {
  const g = Math.round(Math.abs(x.gap))
  const said = g < 1 ? 'the hands came out level' : `the ${x.gap > 0 ? 'right' : 'left'} hand ran <b>${g}</b> louder than the ${x.gap > 0 ? 'left' : 'right'}`
  return `Voicing: ${said}; aim for the melody at least <b>${x.aim}</b> louder.`
}

/** The one velocity every note came in at, when they all did: a keyboard set to Fixed key touch. */
export function fixedAt(vs: number[]): number | undefined {
  return vs.length >= 4 && vs.every((v) => v === vs[0]) ? vs[0] : undefined
}

// ---------- fading the live marks (guidance hypothesis) ----------

export type Marks = 'full' | 'faint' | 'none'
export interface Seen {
  runs: number // finished runs of this exercise
  even: number // 'even' ratings in a row
}
export const FADE_AFTER = 3 // even runs in a row before the live marks fade
export const TEST_EVERY = 4 // every 4th run has no live marks at all

export function marksFor(s: Seen | undefined, always: boolean): Marks {
  if (always) return 'full'
  if (((s?.runs ?? 0) + 1) % TEST_EVERY === 0) return 'none'
  return (s?.even ?? 0) >= FADE_AFTER ? 'faint' : 'full'
}

/** A run with no rating (too short to judge) keeps the count where it was. */
export const seen = (s: Seen | undefined, rating: string | undefined): Seen => ({ runs: (s?.runs ?? 0) + 1, even: rating === 'even' ? (s?.even ?? 0) + 1 : rating ? 0 : (s?.even ?? 0) })

/** Whether the touch coach watches this run at all. */
export const coached = (id: string, dyn: string | undefined, mode: string) => settings.coach !== 'off' && mode !== 'read' && judged(id, dyn)

let book: Record<string, Seen> | undefined
export let marks: Marks = 'full' // for the run about to start

/** Decide the live marks for the next run of `id`. */
export async function arm(id: string): Promise<Marks> {
  book ??= await store.getCoach()
  marks = marksFor(book[id], settings.marks)
  document.querySelector('#staff')?.classList.toggle('marks-faint', marks === 'faint')
  return marks
}

export async function tally(id: string, rating: string | undefined) {
  book ??= await store.getCoach()
  book[id] = seen(book[id], rating)
  await store.saveCoach(book)
}

/** The extra results lines; `perform` already shows timing as its histogram caption. */
export function coachLines(r: { timing: Timing | null; artic: Artic | null; voice: Voicing | null; fixed?: number; mode: string }, test: boolean) {
  const out: string[] = []
  if (test) out.push('A test run: no touch marks while you played.')
  if (r.timing && r.mode !== 'perform') out.push(timingLine(r.timing))
  if (r.artic) out.push(articLine(r.artic))
  if (r.voice) out.push(voiceLine(r.voice))
  if (r.fixed !== undefined)
    out.push(settings.keyTouch === 'Fixed' ? `Key touch is Fixed: every note came in at ${r.fixed}, so evenness cannot be measured.` : `Every note came in at velocity ${r.fixed}. If the keyboard's key touch is Fixed, evenness cannot be measured.`)
  return out.length ? `<div class="coachlines">${out.map((l) => `<p>${l}</p>`).join('')}</div>` : ''
}
