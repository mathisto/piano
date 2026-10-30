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
  best?: { acc: number } // records from before 2026-10-30 also carry an arcade score and letter grade, unread
  heat: number[] // decaying per-bar trouble score
  box?: number // spaced review: 0..4, up a box for a clean run, down one for a messy one
  due?: number // the local day number a review is next due
  boxDay?: number // the day the box last went up
  days?: number[] // the last few days with a clean run: ready is two different days
  memStage?: number // Memorise: the highest stage cleared, 0..4
  memDay?: number // the local day number it was cleared
  bars?: number // the bar count heat was kept for: a piece that changed length (a re-analysed catalogue file) starts its heat again
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
  return serial(async () => {
    const kept = { ...(await get<Stored>(`song:${s.id}`)), ...s } // the same file again keeps its track choice
    await set(`song:${s.id}`, kept)
    return kept
  })
}

/** Change which tracks of a stored MIDI file are used; undefined goes back to the automatic pick. */
export const setPick = (id: string, pick: Selection | undefined) =>
  serial(async () => {
    const s = await get<Stored>(`song:${id}`)
    if (!s) return
    if (pick) s.pick = pick
    else delete s.pick
    await set(`song:${id}`, s)
  })

export async function listSongs(): Promise<Stored[]> {
  const ks = (await keys()).filter((k) => String(k).startsWith('song:'))
  const rows = await Promise.all(ks.map((k) => get<Stored>(k)))
  return rows.filter((r): r is Stored => !!r).sort((a, b) => b.added - a.added)
}

export const removeSong = (id: string) => serial(async () => void (await Promise.all(['song', 'prog', 'take', 'simp'].map((k) => del(`${k}:${id}`)))))

/** The parsers load with the first piece read, not at boot (docs/changes/perf.md). */
export async function toSong(s: Stored, split: number): Promise<Song> {
  if (s.kind === 'xml') {
    const { fromMusicXml, xmlText } = await import('./musicxml')
    return fromMusicXml(await xmlText(s.bytes), s.title, s.id, s.tempo)
  }
  const { autoSelect, fromMidi, inspectMidi } = await import('./midi-tracks')
  return fromMidi(s.bytes, s.title, s.id, split, s.pick ?? autoSelect(inspectMidi(s.bytes)), s.tempo, s.pickup)
}

/** `bars`: the piece as it is now; heat kept for another bar count is stale and not returned. */
export async function getProgress(id: string, bars?: number): Promise<Progress> {
  const p = (await get<Progress>(`prog:${id}`)) ?? { plays: 0, last: 0, heat: [] }
  if (bars !== undefined && p.bars !== undefined && p.bars !== bars) p.heat = []
  return p
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

// every write that reads first (progress, the logs, the plan) queues: two writers at once (a pass and Memorise, two plan ticks) would lose one.
// Another tab of the app writes the same database, so where the browser has Web Locks the queue's turn is also a lock across tabs.
let queue: Promise<unknown> = Promise.resolve()
const locked = <T>(f: () => Promise<T>): Promise<T> => (globalThis.navigator?.locks ? navigator.locks.request('piano-store', f) : f())
export const serial = <T>(f: () => Promise<T>): Promise<T> => {
  const turn = () => locked(f)
  const r = queue.then(turn, turn)
  queue = r.catch(() => {})
  return r
}
/** Read a record, change it, write it back, in the queue. */
const edit = <T>(key: string, empty: T, f: (v: T) => T) =>
  serial(async () => {
    const v = f((await get<T>(key)) ?? empty)
    await set(key, v)
    return v
  })
export const commit = (...a: Parameters<typeof commitNow>) => serial(() => commitNow(...a))

/** Fold one session's trouble into the long-run heat: old trouble cools as you improve. `bars`: the piece's bar count now. */
async function commitNow(id: string, heat: number[], bars: number, result?: { acc: number }, clean?: boolean) {
  const p = await getProgress(id, bars)
  p.heat = cool(p.heat, heat).slice(0, bars)
  p.bars = bars
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

export const TOUCH_KEEP = 300

export async function getTouch(): Promise<TouchEntry[]> {
  return (await get<TouchEntry[]>('touch:log')) ?? []
}

export const logTouch = (e: TouchEntry) => edit<TouchEntry[]>('touch:log', [], (l) => [...l, e].slice(-TOUCH_KEEP))

/** Seconds practised per local day, the effort measure: it only goes up. */
export async function getPractice(): Promise<Record<string, number>> {
  return (await get<Record<string, number>>('practice:days')) ?? {}
}

export const addPractice = (day: string, sec: number) => edit<Record<string, number>>('practice:days', {}, (d) => ({ ...d, [day]: (d[day] ?? 0) + sec }))

/** Plan steps finished on a local day, so Today can tick them off. */
export async function getPlan(day: string): Promise<string[]> {
  return (await get<string[]>(`plan:${day}`)) ?? []
}

export const markPlan = (day: string, step: string) => edit<string[]>(`plan:${day}`, [], (d) => (d.includes(step) ? d : [...d, step]))

/** How much of a song to show: 0 full, 1 two hands, 2 melody and bass, 3 melody. Absent means the automatic level. */
export async function getSimplify(id: string): Promise<number | undefined> {
  return get<number>(`simp:${id}`)
}

export const setSimplify = (id: string, level: number) => serial(() => set(`simp:${id}`, level))

/** A weekly snapshot of skill, so the Monday recap can say what improved. */
export async function getSnap(week: string): Promise<{ read: Record<string, number>; tech: number } | undefined> {
  return get(`snap:${week}`)
}

export const putSnap = (week: string, s: { read: Record<string, number>; tech: number }) => serial(() => set(`snap:${week}`, s))

export async function getTech(): Promise<TechStats> {
  return (await get<TechStats>('tech:stats')) ?? {}
}

export const saveTech = (f: (s: TechStats) => TechStats) => edit<TechStats>('tech:stats', {}, f)

/** Export and import are a Settings button away, not boot JS (src/backup.ts). */
export const exportAll = async () => (await import('./backup')).exportAll()
export const importAll = async (text: string) => (await import('./backup')).importAll(text)

export const clearAll = () =>
  serial(async () => {
    for (const k of await keys()) if (/^(song|prog|drill|touch|practice|plan|tech|simp|snap|run|scale|theory|history|coach|take|backup):/.test(String(k))) await del(k)
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith('piano.')) localStorage.removeItem(k) // settings, the first-run and help flags, tips, ghost: a clean start
    } catch {
      /* no localStorage: nothing to clear */
    }
  })

export async function getDrill(): Promise<Stats> {
  return (await get<Stats>('drill:stats')) ?? {}
}

// the drill, quiz, theory and coach stats are kept in memory by their page and saved whole
export const saveDrill = (s: Stats) => serial(() => set('drill:stats', s))

/** Sight Run: saved setups, the last one used, the best score for each range, and the tempo a paced run offers for each. */
export type Runs = { presets: RunSpec[]; last?: RunSpec; best: Record<string, { streak: number; ms: number }>; paced?: Record<string, PaceMemo> }
export async function getRuns(): Promise<Runs> {
  return (await get('run:state')) ?? { presets: [], best: {} }
}

export const saveRuns = (f: (r: Runs) => Runs) => edit<Runs>('run:state', { presets: [], best: {} }, f)

export async function getScales(): Promise<ScaleStats> {
  return (await get<ScaleStats>('scale:stats')) ?? {}
}

export const saveScales = (f: (s: ScaleStats) => ScaleStats) => edit<ScaleStats>('scale:stats', {}, f)

export async function getQuiz(): Promise<QuizStats> {
  return (await get<QuizStats>('scale:quiz')) ?? {}
}

export const saveQuiz = (s: QuizStats) => serial(() => set('scale:quiz', s))

export async function getTheory(): Promise<Stats> {
  return (await get<Stats>('theory:stats')) ?? {}
}

export const saveTheory = (s: Stats) => serial(() => set('theory:stats', s))

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

export const HISTORY_KEEP = 600
export const logHistory = (e: HistoryEntry) => edit<HistoryEntry[]>('history:log', [], (l) => [...l, e].slice(-HISTORY_KEEP))

/** Per exercise: runs finished and even runs in a row, for fading the live touch marks. */
export async function getCoach(): Promise<Record<string, Seen>> {
  return (await get<Record<string, Seen>>('coach:stats')) ?? {}
}

export const saveCoach = (s: Record<string, Seen>) => serial(() => set('coach:stats', s))

/** The last few takes of a piece (src/take.ts), newest first. */
export async function getTakes(id: string): Promise<Take[]> {
  return (await get<Take[]>(`take:${id}`)) ?? []
}

export const addTake = (id: string, k: Take) => edit<Take[]>(`take:${id}`, [], (ks) => [k, ...ks].slice(0, KEEP))
