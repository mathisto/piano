import { del, get, keys, set } from 'idb-keyval'
import type { Stats } from './drill'
import { fromMusicXml, xmlText } from './musicxml'
import { fromMidi, type Song } from './song'

export interface Stored {
  id: string
  title: string
  bytes: ArrayBuffer
  added: number
  kind?: 'midi' | 'xml' // absent on older saves: MIDI
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
  return s.kind === 'xml' ? fromMusicXml(await xmlText(s.bytes), s.title, s.id) : fromMidi(s.bytes, s.title, s.id, split)
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

export async function exportAll() {
  const prog = Object.fromEntries(await allProgress())
  return JSON.stringify({ version: 1, progress: prog, reading: await getDrill(), touch: await getTouch(), settings: localStorage.getItem('piano.settings') }, null, 1)
}

export async function getDrill(): Promise<Stats> {
  return (await get<Stats>('drill:stats')) ?? {}
}

export async function saveDrill(s: Stats) {
  await set('drill:stats', s)
}
