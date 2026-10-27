import { del, get, keys, set } from './kv'
import { INTERVALS, dayNum, type Stats } from './drill'
import type { PaceMemo } from './paced'
import type { RunSpec } from './run'
import type { QuizStats, ScaleStats } from './scales'
import type { TechStats } from './syllabus'
import type { Seen } from './coach'
import type { KeyTouch } from './settings'
import type { Selection, Tempo } from './midi-tracks'
import type { Song } from './song'
import { KEEP, type Take } from './take'

export interface Stored {
  id: string
  title: string
  bytes: ArrayBuffer
  added: number
  kind?: 'midi' | 'xml' // absent on older saves: MIDI
  tempo?: Tempo // a library MIDI: the catalogue's pace in place of the file's own
  pickup?: number // a library MIDI: quarters in the first bar, from the catalogue
  pick?: Selection // which MIDI tracks to import and the hand each is pinned to; absent = chosen automatically
}

export interface Progress {
  plays: number
  last: number
  best?: { score: number; acc: number; grade: string }
  heat: number[] // decaying per-bar trouble score
  box?: number // spaced review: 0..4, up a box for a clean run, down one for a messy one
  due?: number // the local day number a review is next due
  boxDay?: number // the day the box last went up
  days?: number[] // the last few days with a clean run: ready is two different days
  memStage?: number // Memorise: the highest stage cleared, 0..4
  memDay?: number // the local day number it was cleared
}

/** Memorise cleared a stage: keep the highest, and the day. */
export const memorised = (id: string, stage: number) =>
  serial(async () => {
    const p = await getProgress(id)
    if (stage < (p.memStage ?? 0)) return
    Object.assign(p, { memStage: stage, memDay: dayNum() })
    await set(`prog:${id}`, p)
  })

export async function hash(bytes: ArrayBuffer): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const d = await crypto.subtle.digest('SHA-1', bytes)
    return [...new Uint8Array(d).slice(0, 6)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // some web views are not a secure context: FNV-1a twice, enough to tell two files apart
  let a = 0x811c9dc5
  let b = 0x01000193
  for (const x of new Uint8Array(bytes)) {
    a = Math.imul(a ^ x, 16777619) >>> 0
    b = Math.imul(b + x, 2246822519) >>> 0
  }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0').slice(0, 4)
}

export async function addFile(file: File): Promise<Stored> {
  const bytes = await file.arrayBuffer()
  const s: Stored = {
    id: await hash(bytes),
    title: file.name.replace(/\.(mid|midi|xml|musicxml|mxl)$/i, '').replace(/[_-]+/g, ' '),
    bytes,
    added: Date.now(),
    kind: /\.(xml|musicxml|mxl)$/i.test(file.name) ? 'xml' : 'midi',
  }
  await toSong(s, 60) // throws on junk before we keep it
  await set(`song:${s.id}`, s)
  return s
}

/** Change which tracks of a stored MIDI file are used; undefined goes back to the automatic pick. */
export async function setPick(id: string, pick: Selection | undefined) {
  const s = await get<Stored>(`song:${id}`)
  if (!s) return
  if (pick) s.pick = pick
  else delete s.pick
  await set(`song:${id}`, s)
}

export async function listSongs(): Promise<Stored[]> {
  const ks = (await keys()).filter((k) => String(k).startsWith('song:'))
  const rows = await Promise.all(ks.map((k) => get<Stored>(k)))
  return rows.filter((r): r is Stored => !!r).sort((a, b) => b.added - a.added)
}

export async function removeSong(id: string) {
  await del(`song:${id}`)
  await del(`prog:${id}`)
  await del(`take:${id}`)
}

/** The parsers load with the first piece read, not at boot (docs/changes/perf.md). */
export async function toSong(s: Stored, split: number): Promise<Song> {
  if (s.kind === 'xml') {
    const { fromMusicXml, xmlText } = await import('./musicxml')
    return fromMusicXml(await xmlText(s.bytes), s.title, s.id, s.tempo)
  }
  const { autoSelect, fromMidi, inspectMidi } = await import('./midi-tracks')
  return fromMidi(s.bytes, s.title, s.id, split, s.pick ?? autoSelect(inspectMidi(s.bytes)), s.tempo, s.pickup)
}

export async function getProgress(id: string): Promise<Progress> {
  return (await get<Progress>(`prog:${id}`)) ?? { plays: 0, last: 0, heat: [] }
}

export async function allProgress(): Promise<Map<string, Progress>> {
  const ks = (await keys()).filter((k) => String(k).startsWith('prog:'))
  const m = new Map<string, Progress>()
  for (const k of ks) {
    const p = await get<Progress>(k)
    if (p) m.set(String(k).slice(5), p)
  }
  return m
}

/** Old trouble cools by 30% a session; what falls under one stray wrong note is gone, so a mastered piece stops offering a loop. */
export const cool = (old: number[], run: number[]) =>
  Array.from({ length: Math.max(old.length, run.length) }, (_, i) => {
    const h = (old[i] ?? 0) * 0.7 + (run[i] ?? 0)
    return h < 0.25 ? 0 : h
  })

// progress is read, changed and written back: two writers at once (a pass and Memorise) would lose one, so they queue
let queue: Promise<unknown> = Promise.resolve()
const serial = <T>(f: () => Promise<T>): Promise<T> => {
  const r = queue.then(f, f)
  queue = r.catch(() => {})
  return r
}
export const commit = (...a: Parameters<typeof commitNow>) => serial(() => commitNow(...a))

/** Fold one session's trouble into the long-run heat: old trouble cools as you improve. */
async function commitNow(id: string, heat: number[], result?: { score: number; acc: number; grade: string }, clean?: boolean) {
  const p = await getProgress(id)
  p.heat = cool(p.heat, heat)
  p.last = Date.now()
  if (clean !== undefined) {
    const day = dayNum()
    const climb = clean && p.boxDay !== day // spacing means days: several clean passes in one day are one step up
    p.box = Math.min(INTERVALS.length - 1, Math.max(0, (p.box ?? 0) + (clean ? (climb ? 1 : 0) : -1)))
    if (climb) p.boxDay = day
    p.due = day + INTERVALS[p.box]
    if (clean && !p.days?.includes(day)) p.days = [...(p.days ?? []), day].slice(-6)
  }
  if (result) {
    p.plays++
    if (!p.best || result.acc > p.best.acc) p.best = result
  }
  await set(`prog:${id}`, p)
  return p
}

export interface TouchEntry {
  ts: number
  id: string // song id, or 'calibration'
  title: string
  mode: string
  n: number
  mean: number
  sd: number
  R: { n: number; mean: number }
  L: { n: number; mean: number }
  bands: { soft: number; medium: number; hard: number }
  keyTouch?: KeyTouch // the keyboard's key touch setting at the time
}

const TOUCH_KEEP = 300

export async function getTouch(): Promise<TouchEntry[]> {
  return (await get<TouchEntry[]>('touch:log')) ?? []
}

export async function logTouch(e: TouchEntry) {
  await set('touch:log', [...(await getTouch()), e].slice(-TOUCH_KEEP))
}

/** Seconds practised per local day, the effort measure: it only goes up. */
export async function getPractice(): Promise<Record<string, number>> {
  return (await get<Record<string, number>>('practice:days')) ?? {}
}

export async function addPractice(day: string, sec: number) {
  const d = await getPractice()
  d[day] = (d[day] ?? 0) + sec
  await set('practice:days', d)
}

/** Plan steps finished on a local day, so Today can tick them off. */
export async function getPlan(day: string): Promise<string[]> {
  return (await get<string[]>(`plan:${day}`)) ?? []
}

export async function markPlan(day: string, step: string) {
  const d = await getPlan(day)
  if (!d.includes(step)) await set(`plan:${day}`, [...d, step])
}

/** How much of a song to show: 0 full, 1 two hands, 2 melody and bass, 3 melody. Absent means the automatic level. */
export async function getSimplify(id: string): Promise<number | undefined> {
  return get<number>(`simp:${id}`)
}

export async function setSimplify(id: string, level: number) {
  await set(`simp:${id}`, level)
}

/** A weekly snapshot of skill, so the Monday recap can say what improved. */
export async function getSnap(week: string): Promise<{ read: Record<string, number>; tech: number } | undefined> {
  return get(`snap:${week}`)
}

export async function putSnap(week: string, s: { read: Record<string, number>; tech: number }) {
  await set(`snap:${week}`, s)
}

export async function getTech(): Promise<TechStats> {
  return (await get<TechStats>('tech:stats')) ?? {}
}

export async function saveTech(s: TechStats) {
  await set('tech:stats', s)
}

export async function exportAll() {
  const prog = Object.fromEntries(await allProgress())
  return JSON.stringify({ version: 1, progress: prog, reading: await getDrill(), touch: await getTouch(), practice: await getPractice(), technique: await getTech(), runs: await getRuns(), scales: await getScales(), theory: await getTheory(), history: await getHistory(), coach: await getCoach(), extra: await getExtra(), settings: localStorage.getItem('piano.settings') }, null, 1)
}

/** The small per-key records that have no store of their own: the scale quiz, each day's plan, a piece's simplify level, a week's snapshot, a piece's last takes. */
const EXTRA = /^(scale:quiz|plan:|simp:|snap:|take:)/
async function getExtra() {
  const out: Record<string, unknown> = {}
  for (const k of await keys()) if (EXTRA.test(String(k))) out[String(k)] = await get(k)
  return out
}

/** What each key of an export holds: a file whose field is the wrong kind of thing is skipped, never stored to break a page later. */
const FIELDS: [field: string, key: string, kind: 'object' | 'array'][] = [
  ['reading', 'drill:stats', 'object'],
  ['touch', 'touch:log', 'array'],
  ['practice', 'practice:days', 'object'],
  ['technique', 'tech:stats', 'object'],
  ['runs', 'run:state', 'object'],
  ['scales', 'scale:stats', 'object'],
  ['theory', 'theory:stats', 'object'],
  ['history', 'history:log', 'array'],
  ['coach', 'coach:stats', 'object'],
]
const kindOf = (v: unknown) => (Array.isArray(v) ? 'array' : v && typeof v === 'object' ? 'object' : '')

/** Reads back what exportAll wrote. Songs are not in the export, only progress, reading, touch and settings. */
export async function importAll(text: string) {
  const d = JSON.parse(text)
  if (d?.version !== 1) throw new Error('Not a piano export.')
  for (const [id, p] of Object.entries(d.progress ?? {})) if (Array.isArray((p as Progress | null)?.heat)) await set(`prog:${id}`, p)
  for (const [field, key, kind] of FIELDS) if (kindOf(d[field]) === kind) await set(key, d[field])
  for (const [k, v] of Object.entries(d.extra ?? {})) if (EXTRA.test(k)) await set(k, v) // only the small records exportAll writes, never a song or the catalogue
  try {
    if (typeof d.settings === 'string') localStorage.setItem('piano.settings', d.settings)
  } catch {
    /* no localStorage: the settings in the file are skipped */
  }
}

export async function clearAll() {
  for (const k of await keys()) if (/^(song|prog|drill|touch|practice|plan|tech|simp|snap|run|scale|theory|history|coach|take):/.test(String(k))) await del(k)
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('piano.')) localStorage.removeItem(k) // settings, the first-run and help flags, tips, ghost: a clean start
  } catch {
    /* no localStorage: nothing to clear */
  }
}

export async function getDrill(): Promise<Stats> {
  return (await get<Stats>('drill:stats')) ?? {}
}

export async function saveDrill(s: Stats) {
  await set('drill:stats', s)
}

/** Sight Run: saved setups, the last one used, the best score for each range, and the tempo a paced run offers for each. */
export async function getRuns(): Promise<{ presets: RunSpec[]; last?: RunSpec; best: Record<string, { streak: number; ms: number }>; paced?: Record<string, PaceMemo> }> {
  return (await get('run:state')) ?? { presets: [], best: {} }
}

export async function saveRuns(r: Awaited<ReturnType<typeof getRuns>>) {
  await set('run:state', r)
}

export async function getScales(): Promise<ScaleStats> {
  return (await get<ScaleStats>('scale:stats')) ?? {}
}

export async function saveScales(s: ScaleStats) {
  await set('scale:stats', s)
}

export async function getQuiz(): Promise<QuizStats> {
  return (await get<QuizStats>('scale:quiz')) ?? {}
}

export async function saveQuiz(s: QuizStats) {
  await set('scale:quiz', s)
}

export async function getTheory(): Promise<Stats> {
  return (await get<Stats>('theory:stats')) ?? {}
}

export async function saveTheory(s: Stats) {
  await set('theory:stats', s)
}

/** One finished practice session of any kind, kept for the charts on Progress. */
export interface HistoryEntry {
  ts: number
  kind: 'read' | 'run' | 'scale' | 'theory' | 'song' | 'tech'
  label: string
  acc: number // 0..1
  ms?: number // median time a card took, where cards are timed
  even?: number // touch evenness: share of notes inside the band, 0..1
  bias?: number // timing: mean ms behind (+) or ahead of (-) the beat
}

export async function getHistory(): Promise<HistoryEntry[]> {
  return (await get<HistoryEntry[]>('history:log')) ?? []
}

export async function logHistory(e: HistoryEntry) {
  await set('history:log', [...(await getHistory()), e].slice(-600))
}

/** Per exercise: runs finished and even runs in a row, for fading the live touch marks. */
export async function getCoach(): Promise<Record<string, Seen>> {
  return (await get<Record<string, Seen>>('coach:stats')) ?? {}
}

export async function saveCoach(s: Record<string, Seen>) {
  await set('coach:stats', s)
}

/** The last few takes of a piece (src/take.ts), newest first. */
export async function getTakes(id: string): Promise<Take[]> {
  return (await get<Take[]>(`take:${id}`)) ?? []
}

export async function addTake(id: string, k: Take): Promise<Take[]> {
  const ks = [k, ...(await getTakes(id))].slice(0, KEEP)
  await set(`take:${id}`, ks)
  return ks
}
