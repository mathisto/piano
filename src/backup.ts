// Export and import (Settings > Options): the whole record as one JSON file, songs included, and an import merged into what this browser has.
import { get, keys, set } from './kv'
import type { PaceMemo } from './paced'
import { allProgress, getCoach, getDrill, getHistory, getPractice, getRuns, getScales, getTech, getTheory, getTouch, HISTORY_KEEP, listSongs, type Progress, type Runs, serial, TOUCH_KEEP } from './store'
import { KEEP } from './take'

export async function exportAll() {
  const prog = Object.fromEntries(await allProgress())
  const songs = (await listSongs()).map((s) => ({ ...s, bytes: b64(s.bytes) }))
  return JSON.stringify({ version: 1, progress: prog, reading: await getDrill(), touch: await getTouch(), practice: await getPractice(), technique: await getTech(), runs: await getRuns(), scales: await getScales(), theory: await getTheory(), history: await getHistory(), coach: await getCoach(), extra: await getExtra(), songs, settings: settingsText() }, null, 1)
}
const settingsText = () => {
  try {
    return localStorage.getItem('piano.settings')
  } catch {
    return null // no localStorage: nothing to carry, and the backup before an import must not fail on it
  }
}

const b64 = (b: ArrayBuffer) => {
  const u = new Uint8Array(b)
  let s = ''
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)) // a spread of a whole file overflows the stack
  return btoa(s)
}
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer

/** The small per-key records that have no store of their own: the scale quiz, each day's plan, a piece's simplify level, a week's snapshot, a piece's last takes. */
const EXTRA = /^(scale:quiz|plan:|simp:|snap:|take:)/
async function getExtra() {
  const out: Record<string, unknown> = {}
  for (const k of await keys()) if (EXTRA.test(String(k))) out[String(k)] = await get(k)
  return out
}

// ---- merging an export into what this browser has: an import adds to the record, it never rolls it back ----
// No stat records a time of its own, so per card the one seen more often (n, or runs) wins; a tie goes to the file.

type Rec = Record<string, unknown>
const seenN = (x: unknown) => Number((x as { n?: number; runs?: number } | undefined)?.n ?? (x as { runs?: number } | undefined)?.runs ?? 0)
const moreSeen = (a: Rec, b: Rec) => Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])].map((k) => [k, !(k in b) || (k in a && seenN(a[k]) > seenN(b[k])) ? a[k] : b[k]]))
const byTs = <T extends { ts: number }>(a: T[], b: T[]) => [...new Map([...a, ...b].filter((e) => typeof e?.ts === 'number').map((e) => [e.ts, e])).values()].sort((x, y) => x.ts - y.ts)
const most = (a: Record<string, number>, b: Record<string, number>) => {
  const o = { ...a }
  for (const [k, v] of Object.entries(b)) if (typeof v === 'number') o[k] = Math.max(o[k] ?? 0, v)
  return o
}
const lastDay = (m?: PaceMemo) => Math.max(0, ...(m?.days ?? []))
const mergeRuns = (a: Runs, b: Partial<Runs>): Runs => {
  const best = { ...a.best }
  for (const [k, v] of Object.entries(b.best ?? {})) {
    const o = best[k]
    const ms = [o?.ms, v.ms].filter((x) => x! > 0) as number[] // 0: no time yet
    best[k] = o ? { streak: Math.max(o.streak, v.streak), ms: ms.length ? Math.min(...ms) : 0 } : v
  }
  const paced = { ...a.paced }
  for (const [k, v] of Object.entries(b.paced ?? {})) if (!paced[k] || lastDay(v) >= lastDay(paced[k])) paced[k] = v
  const presets = [...new Map([...a.presets, ...(Array.isArray(b.presets) ? b.presets : [])].map((p) => [JSON.stringify(p), p])).values()]
  return { presets, last: b.last ?? a.last, best, paced }
}
/** A piece: the record played last wins, with the most plays, the best result and the furthest Memorise stage of either. */
const mergeProg = (a: Progress, b: Progress): Progress => {
  const [old, now] = (a.last ?? 0) > (b.last ?? 0) ? [b, a] : [a, b]
  const mem = (b.memStage ?? 0) > (a.memStage ?? 0) ? b : a
  return {
    ...old,
    ...now,
    plays: Math.max(a.plays ?? 0, b.plays ?? 0),
    best: [a.best, b.best].filter((x) => x).sort((x, y) => y!.acc - x!.acc)[0],
    memStage: mem.memStage,
    memDay: mem.memDay,
    days: [...new Set([...(a.days ?? []), ...(b.days ?? [])])].sort((x, y) => x - y).slice(-6),
  }
}

/** What each key of an export holds and how it merges: a file whose field is the wrong kind of thing is skipped, never stored to break a page later. */
type Merge = (had: any, file: any) => unknown
const FIELDS: [field: string, key: string, kind: 'object' | 'array', merge: Merge][] = [
  ['reading', 'drill:stats', 'object', moreSeen],
  ['touch', 'touch:log', 'array', (a, b) => byTs(a, b).slice(-TOUCH_KEEP)],
  ['practice', 'practice:days', 'object', most],
  ['technique', 'tech:stats', 'object', moreSeen],
  ['runs', 'run:state', 'object', mergeRuns],
  ['scales', 'scale:stats', 'object', moreSeen],
  ['theory', 'theory:stats', 'object', moreSeen],
  ['history', 'history:log', 'array', (a, b) => byTs(a, b).slice(-HISTORY_KEEP)],
  ['coach', 'coach:stats', 'object', moreSeen],
]
/** The per-key records: a day's plan is both days' ticks, a piece's takes both lists; a simplify level or a week's snapshot is the file's. */
const mergeExtra = (k: string, a: any, b: any): unknown =>
  a === undefined ? b
  : k.startsWith('plan:') && Array.isArray(a) && Array.isArray(b) ? [...new Set([...a, ...b])]
  : k.startsWith('take:') && Array.isArray(a) && Array.isArray(b) ? byTs(a, b).reverse().slice(0, KEEP)
  : k === 'scale:quiz' && kindOf(a) === 'object' && kindOf(b) === 'object' ? moreSeen(a, b)
  : b
const kindOf = (v: unknown) => (Array.isArray(v) ? 'array' : v && typeof v === 'object' ? 'object' : '')

/** Reads back what exportAll wrote, merged into what is here (above); the settings in the file replace these. What was here first is kept under `backup:last`. */
export const importAll = (text: string) =>
  serial(async () => {
    const d = JSON.parse(text)
    if (d?.version !== 1) throw new Error('Not a piano export.')
    await set('backup:last', await exportAll()) // the one before the last import, to undo it by hand
    for (const [id, p] of Object.entries(d.progress ?? {}) as [string, Progress][]) {
      if (!Array.isArray(p?.heat)) continue
      const had = await get<Progress>(`prog:${id}`)
      await set(`prog:${id}`, had ? mergeProg(had, p) : p)
    }
    for (const [field, key, kind, merge] of FIELDS) {
      if (kindOf(d[field]) !== kind) continue
      const had = await get(key)
      await set(key, kindOf(had) === kind ? merge(had, d[field]) : d[field])
    }
    for (const [k, v] of Object.entries(d.extra ?? {})) if (EXTRA.test(k)) await set(k, mergeExtra(k, await get(k), v)) // only the small records exportAll writes, never a song or the catalogue
    for (const s of Array.isArray(d.songs) ? d.songs : []) {
      if (typeof s?.id !== 'string' || typeof s.title !== 'string' || typeof s.bytes !== 'string' || (await get(`song:${s.id}`))) continue // one already here is the same file (the id is its hash)
      try {
        await set(`song:${s.id}`, { ...s, bytes: unb64(s.bytes), added: Number(s.added) || Date.now() })
      } catch {
        /* not base64: that song is skipped */
      }
    }
    try {
      if (typeof d.settings === 'string') localStorage.setItem('piano.settings', d.settings)
    } catch {
      /* no localStorage: the settings in the file are skipped */
    }
  })
