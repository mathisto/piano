import './coach.css'
import { evenness, judged, lines, MIN_RUN, MIN_V, tolerance, type Coach, type Evenness } from './even'
import { writtenTargets, type Edges } from './touch'
import { barAt, type Hand, type Note, type Song } from './song'
import { settings } from './settings'
import * as store from './store'
import { mean, median } from './util'

/** How a run was played over time, from the key downs and ups: timing evenness, legato or staccato, the balance of the hands. */

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

/** Legato: the overlap of each key with the next one in its hand. Staccato: how much of each written value the key was held. `only` picks the notes judged (a song's staccato or slurred ones). */
export function articulation(kind: Artic['kind'], notes: Note[], presses: Press[], rate: number, only: (n: Note) => boolean = () => true): Artic | null {
  const by = new Map(presses.map((x) => [x.i, x])) // a note struck twice (Learn's hold-to-advance) keeps its last press
  const played = [...by.values()].map((x) => ({ ...x, t: notes[x.i].t, p: notes[x.i].p, h: notes[x.i].h }))
  const onsets = { R: [] as number[], L: [] as number[] }
  for (const n of notes) if (onsets[n.h].at(-1) !== n.t) onsets[n.h].push(n.t)
  const marks: number[] = []
  let ok = 0
  for (const l of lines(played))
    for (let k = 0; k < l.length; k++) {
      const a = l[k]
      if (!only(notes[a.i])) continue
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
  melody: Hand // the hand that carries the tune
  gap: number // mean melody-hand velocity minus mean other hand
  aim: number // the melody hand should be at least this much louder
}

export const BALANCE_SHARE = 0.25 // of the calibrated soft-to-hard range: about 10 on the default bands
const CLEAR_TOP = 0.75 // share of bars with both hands where one hand holds the highest note

/** The hand with the highest note in most bars where both play; null when neither clearly leads (or too few bars to say). */
export function melodyHand(notes: Note[]): Hand | null {
  const top = new Map<number, { R: number; L: number }>()
  for (const n of notes) {
    const b = top.get(n.bar) ?? { R: 0, L: 0 }
    b[n.h] = Math.max(b[n.h], n.p)
    top.set(n.bar, b)
  }
  let r = 0
  let l = 0
  for (const b of top.values()) if (b.R && b.L && b.R !== b.L) b.R > b.L ? r++ : l++
  return r + l >= 2 && Math.max(r, l) / (r + l) >= CLEAR_TOP ? (r > l ? 'R' : 'L') : null
}

/** The melody hand over the other. Null without a clear melody hand, or without four notes in each hand. */
export function voicing(samples: { v: number; h: Hand }[], e: Edges, melody: Hand | null): Voicing | null {
  if (!melody) return null
  const M = samples.filter((s) => s.h === melody).map((s) => s.v)
  const O = samples.filter((s) => s.h !== melody).map((s) => s.v)
  if (M.length < 4 || O.length < 4) return null
  return { melody, gap: mean(M) - mean(O), aim: Math.max(3, Math.round((e.hard - e.soft) * BALANCE_SHARE)) }
}

export function voiceLine(x: Voicing) {
  const g = Math.round(Math.abs(x.gap))
  const [m, o] = x.melody === 'R' ? ['right', 'left'] : ['left', 'right']
  const said = g < 1 ? 'the hands came out level' : x.gap > 0 ? `the melody (${m} hand) ran <b>${g}</b> louder than the ${o}` : `the ${o} hand ran <b>${g}</b> louder than the melody (${m} hand)`
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

// ---------- following the score (songs) ----------

/** A pattern from a song run; `n` is how often it showed, and the most repeated earn the results lines. */
export interface Finding {
  n: number
  line: string
}
export const REPEATS = 3 // a pattern shows at least this often (and in a third of its chances) before it earns a line
const MOST = 2 // song lines per run
const often = (miss: number, n: number) => miss >= REPEATS && miss * 3 >= n
const where = (s: Song, t0: number, t1: number) => {
  const [a, b] = [barAt(s.bars, t0 + 1e-6) + 1, barAt(s.bars, t1 + 1e-6) + 1]
  return a === b ? `bar ${a}` : `bars ${a} to ${b}`
}

/** Staccato notes held short and slurred notes joined, judged as in the exercises: only the lines worth saying. */
export function articulationReport(song: Song, presses: Press[], rate = 1): Finding[] {
  const out: Finding[] = []
  const st = articulation('staccato', song.notes, presses, rate, (n) => n.art === 'stac')
  if (st && often(st.n - st.ok, st.n)) out.push({ n: st.n - st.ok, line: `<b>${st.n - st.ok} of ${st.n}</b> staccato notes were held long (about ${Math.round(st.typical * 100)}% of their value); let each key spring back at once.` })
  const lg = articulation('legato', song.notes, presses, rate, (n) => !!n.slur)
  if (lg && often(lg.n - lg.ok, lg.n)) {
    const how = lg.typical < -LEGATO_GAP ? 'had a gap; hold each key until the next one sounds' : lg.typical > LEGATO_BLUR ? 'blurred; let each key up as the next goes down' : 'were not joined'
    out.push({ n: lg.n - lg.ok, line: `Under the slurs, <b>${lg.n - lg.ok} of ${lg.n}</b> joins ${how}.` })
  }
  return out
}

/** How far a line rises from its first point to its last: least squares through (t, y), each hand measured against its own mean. */
function rise(xs: { t: number; h: Hand }[], ys: number[], span: number) {
  const c = (h: Hand) => {
    const k = xs.flatMap((x, i) => (x.h === h ? [i] : []))
    return { t: mean(k.map((i) => xs[i].t)), y: mean(k.map((i) => ys[i])) }
  }
  const m = { R: c('R'), L: c('L') }
  let num = 0
  let den = 0
  xs.forEach((x, i) => {
    num += (x.t - m[x.h].t) * (ys[i] - m[x.h].y)
    den += (x.t - m[x.h].t) ** 2
  })
  return den ? (num / den) * span : 0
}

/** Stretches where evenness is the point: 8 or more single notes in one hand, equal gaps, one written level, no accent. */
export function levelRuns(notes: Note[], min = 8): Note[][] {
  const out: Note[][] = []
  for (const h of ['R', 'L'] as const) {
    const on: Note[][] = []
    for (const n of notes)
      if (n.h === h && !n.grace) {
        const last = on.at(-1)
        if (last && n.t - last[0].t < 0.03) last.push(n)
        else on.push([n])
      }
    let cur: Note[] = []
    const flush = () => {
      if (cur.length >= min) out.push(cur)
      cur = []
    }
    for (const c of on) {
      const [n, prev] = [c[0], cur.at(-1)]
      if (c.length > 1 || n.art === 'acc') {
        flush()
        continue
      }
      const g0 = cur.length > 1 ? cur[1].t - cur[0].t : 0
      if (prev && (Math.abs(n.v - prev.v) > 0.005 || (g0 && Math.abs(n.t - prev.t - g0) > g0 * 0.1))) flush()
      cur.push(n)
    }
    flush()
  }
  return out
}

/**
 * The written dynamics against the velocities you played, both on your calibrated range: hairpins (a flat or backwards line),
 * changes between soft and loud at a bar line, accents over their neighbours, and evenness in a run written at one level.
 */
export function shapeReport(song: Song, samples: { v: number; h: Hand; p: number; t: number }[], e: Edges, coach: Exclude<Coach, 'off'> = 'steady'): Finding[] {
  const out: Finding[] = []
  if (!song.curve || samples.every((s) => s.v === samples[0].v)) return out // no written dynamics, or Fixed key touch
  const tol = tolerance(e, coach)
  const at = new Map(song.notes.map((n) => [`${n.t}:${n.p}`, n]))
  const struck = samples.flatMap((s) => {
    const n = at.get(`${s.t}:${s.p}`)
    return n && s.v >= MIN_V ? [{ ...s, n }] : []
  })
  const mid = ([a, b]: [number, number]) => (a + b) / 2

  const want = writtenTargets(song.notes, e)
  if (want) {
    const aim = new Map(song.notes.map((n, i) => [n, mid(want[i])]))
    const off: string[] = []
    let most = 0
    for (const w of song.wedges ?? []) {
      const xs = struck.filter((s) => s.t >= w.t0 - 1e-6 && s.t <= w.t1 + 1e-6)
      if (xs.length < 2 * REPEATS) continue
      const goal = rise(xs, xs.map((s) => aim.get(s.n)!), w.t1 - w.t0)
      const got = rise(xs, xs.map((s) => s.v), w.t1 - w.t0)
      if (Math.abs(goal) < 2 * tol || (Math.sign(got) === Math.sign(goal) && Math.abs(got) > tol)) continue
      off.push(`You played the ${w.up ? 'crescendo' : 'diminuendo'} in ${where(song, w.t0, w.t1)} ${Math.abs(got) <= tol ? 'as a flat line' : `getting ${w.up ? 'softer' : 'louder'}`}`)
      most = Math.max(most, xs.length)
    }
    if (off.length) out.push({ n: most, line: off[0] + (off.length > 1 ? `, and ${off.length - 1} more like it.` : '.') })
  }

  const lv = writtenTargets(song.curve.map((v) => ({ v })), e)
  if (lv) {
    const hm = { R: mean(struck.filter((s) => s.h === 'R').map((s) => s.v)), L: mean(struck.filter((s) => s.h === 'L').map((s) => s.v)) }
    const per = song.bars.map(() => [] as number[])
    for (const s of struck) per[s.n.bar]?.push(s.v - hm[s.h])
    const pinned = (b: number) => song.wedges?.some((w) => barAt(song.bars, w.t0 + 1e-6) <= b && b <= barAt(song.bars, w.t1 + 1e-6))
    let n = 0
    let miss = 0
    for (let b = 1; b < per.length; b++) {
      const goal = mid(lv[b]) - mid(lv[b - 1])
      if (Math.abs(goal) < 2 * tol || pinned(b) || pinned(b - 1) || per[b].length < 2 || per[b - 1].length < 2) continue
      n++
      const got = mean(per[b]) - mean(per[b - 1])
      if (Math.sign(got) !== Math.sign(goal) || Math.abs(got) <= tol) miss++
    }
    if (often(miss, n)) out.push({ n: miss, line: `The score changes between soft and loud at <b>${n}</b> bar lines; you followed <b>${n - miss}</b> of them.` })
  }

  let acc = 0
  let flat = 0
  for (const l of lines(struck))
    l.forEach((x, k) => {
      if (x.n.art !== 'acc') return
      const ref = l.filter((y, j) => j !== k && Math.abs(j - k) <= 3 && y.n.art !== 'acc').map((y) => y.v)
      if (ref.length < 2) return
      acc++
      if (x.v - median(ref) < tol / 2) flat++
    })
  if (often(flat, acc)) out.push({ n: flat, line: `<b>${flat} of ${acc}</b> accents came out no louder than the notes around them.` })

  let worst: { ev: Evenness; l: Note[] } | undefined
  for (const l of levelRuns(song.notes)) {
    const set = new Set(l)
    const ev = evenness(struck.filter((s) => set.has(s.n)), e, coach)
    if (ev && ev.n >= 6 && (!worst || ev.inside < worst.ev.inside)) worst = { ev, l }
  }
  const stray = worst ? Math.round((1 - worst.ev.inside) * worst.ev.n) : 0
  if (worst && worst.ev.rating !== 'even' && stray >= REPEATS)
    out.push({ n: stray, line: `In the run in ${where(song, worst.l[0].t, worst.l.at(-1)!.t)}, written at one level, <b>${Math.round(worst.ev.inside * 100)}%</b> of notes stayed within ±${worst.ev.band} of their neighbours.${worst.ev.hint ? ` ${worst.ev.hint}` : ''}` })
  return out
}

/** At most two lines for a song run, the most repeated patterns first. */
export const songLines = (song: Song, presses: Press[], samples: { v: number; h: Hand; p: number; t: number }[], e: Edges, coach: Exclude<Coach, 'off'>, rate: number) =>
  [...articulationReport(song, presses, rate), ...shapeReport(song, samples, e, coach)]
    .sort((a, b) => b.n - a.n)
    .slice(0, MOST)
    .map((f) => f.line)

/** The extra results lines; `perform` already shows timing as its histogram caption. */
export function coachLines(r: { timing: Timing | null; artic: Artic | null; voice: Voicing | null; fixed?: number; mode: string; follow?: string[]; pedal?: string | null }, test: boolean) {
  const out: string[] = [...(r.follow ?? [])]
  if (r.pedal) out.push(r.pedal)
  if (test) out.push('A test run: no touch marks while you played.')
  if (r.timing && r.mode !== 'perform') out.push(timingLine(r.timing))
  if (r.artic) out.push(articLine(r.artic))
  if (r.voice) out.push(voiceLine(r.voice))
  if (r.fixed !== undefined)
    out.push(settings.keyTouch === 'Fixed' ? `Key touch is Fixed: every note came in at ${r.fixed}, so evenness cannot be measured.` : `Every note came in at velocity ${r.fixed}. If the keyboard's key touch is Fixed, evenness cannot be measured.`)
  return out.length ? `<div class="coachlines">${out.map((l) => `<p>${l}</p>`).join('')}</div>` : ''
}
