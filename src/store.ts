import { del, get, keys, set } from 'idb-keyval'
import type { Stats } from './drill'
import type { RunSpec } from './run'
import type { TechStats } from './syllabus'
import { fromMusicXml, xmlText } from './musicxml'
import { autoSelect, inspectMidi, type Selection } from './midi-tracks'
import { fromMidi, type Song } from './song'

export interface Stored {
  id: string
  title: string
  bytes: ArrayBuffer
  added: number
  kind?: 'midi' | 'xml' // absent on older saves: MIDI
  pick?: Selection // which MIDI tracks to import and the hand each is pinned to; absent = chosen automatically
}

export interface Progress {
  plays: number
  last: number
  best?: { score: number; acc: number; grade: string }
  heat: number[] // decaying per-bar trouble score
}

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
}

export async function toSong(s: Stored, split: number): Promise<Song> {
  return s.kind === 'xml' ? fromMusicXml(await xmlText(s.bytes), s.title, s.id) : fromMidi(s.bytes, s.title, s.id, split, s.pick ?? autoSelect(inspectMidi(s.bytes)))
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

/** Fold one session's trouble into the long-run heat: old trouble cools as you improve. */
export async function commit(id: string, heat: number[], result?: { score: number; acc: number; grade: string }) {
  const p = await getProgress(id)
  const n = Math.max(p.heat.length, heat.length)
  p.heat = Array.from({ length: n }, (_, i) => (p.heat[i] ?? 0) * 0.7 + (heat[i] ?? 0))
  p.last = Date.now()
  if (result) {
    p.plays++
    if (!p.best || result.score > p.best.score) p.best = result
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
  return JSON.stringify({ version: 1, progress: prog, reading: await getDrill(), touch: await getTouch(), practice: await getPractice(), technique: await getTech(), runs: await getRuns(), settings: localStorage.getItem('piano.settings') }, null, 1)
}

/** Reads back what exportAll wrote. Songs are not in the export, only progress, reading, touch and settings. */
export async function importAll(text: string) {
  const d = JSON.parse(text)
  if (d?.version !== 1) throw new Error('Not a piano export.')
  for (const [id, p] of Object.entries(d.progress ?? {})) await set(`prog:${id}`, p)
  if (d.reading) await set('drill:stats', d.reading)
  if (d.touch) await set('touch:log', d.touch)
  if (d.practice) await set('practice:days', d.practice)
  if (d.technique) await set('tech:stats', d.technique)
  if (d.runs) await set('run:state', d.runs)
  if (typeof d.settings === 'string') localStorage.setItem('piano.settings', d.settings)
}

export async function clearAll() {
  for (const k of await keys()) if (/^(song|prog|drill|touch|practice|plan|tech|simp|snap|run):/.test(String(k))) await del(k)
  localStorage.removeItem('piano.settings')
}

export async function getDrill(): Promise<Stats> {
  return (await get<Stats>('drill:stats')) ?? {}
}

export async function saveDrill(s: Stats) {
  await set('drill:stats', s)
}

/** Sight Run: saved setups, the last one used, and the best score for each range. */
export async function getRuns(): Promise<{ presets: RunSpec[]; last?: RunSpec; best: Record<string, { score: number; streak: number }> }> {
  return (await get('run:state')) ?? { presets: [], best: {} }
}

export async function saveRuns(r: Awaited<ReturnType<typeof getRuns>>) {
  await set('run:state', r)
}
