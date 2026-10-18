import { del, get, keys, set } from 'idb-keyval'
import { fromMidi, type Song } from './song'

export interface Stored {
  id: string
  title: string
  bytes: ArrayBuffer
  added: number
}

export interface Progress {
  plays: number
  last: number
  best?: { score: number; acc: number; grade: string }
  heat: number[] // decaying per-bar trouble score
}

export async function hash(bytes: ArrayBuffer): Promise<string> {
  const d = await crypto.subtle.digest('SHA-1', bytes)
  return [...new Uint8Array(d).slice(0, 6)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function addFile(file: File): Promise<Stored> {
  const bytes = await file.arrayBuffer()
  const s: Stored = {
    id: await hash(bytes),
    title: file.name.replace(/\.(mid|midi)$/i, '').replace(/[_-]+/g, ' '),
    bytes,
    added: Date.now(),
  }
  fromMidi(bytes, s.title, s.id) // throws on junk before we keep it
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

export function toSong(s: Stored, split: number): Song {
  return fromMidi(s.bytes, s.title, s.id, split)
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

export async function exportAll() {
  const prog = Object.fromEntries(await allProgress())
  return JSON.stringify({ version: 1, progress: prog, settings: localStorage.getItem('piano.settings') }, null, 1)
}
