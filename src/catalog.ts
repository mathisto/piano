import { get, keys, set } from './kv'
import type { Catalog, Piece } from './catalog-types'
import { libraryUrl, loadManifest, type LibraryEntry } from './credits'
import { served } from './net'

// The open library: a catalogue (the bundled pieces, plus the big one from the corpus when it has been fetched once),
// a loader for its files and a search over it. Progress stays keyed lib:<id>, so the bundled ids never change.

/** Where the corpus lives: this origin on the web; the public site inside the iPad app, whose origin is capacitor://localhost (the server sends Access-Control-Allow-Origin *). */
export const CORPUS: string =
  import.meta.env?.VITE_CORPUS ?? (/^https?:$/.test(globalThis.location?.protocol ?? '') ? new URL('/corpus/', location.origin).href : 'https://pianoforte.mattkelly.io/corpus/')

export const gradeOf = (p: Piece) => p.gradeOverride ?? p.grade

const LEVEL_GRADE: Record<string, number> = { Beginner: 1, Elementary: 2, Intermediate: 3 }

const at = <T>(list: T[], item: T, same: (x: T) => boolean) => {
  const i = list.findIndex(same)
  return i >= 0 ? i : list.push(item) - 1
}

/** The bundled manifest as a catalogue, so the Songs page works the same with no network. */
export function builtin(list: LibraryEntry[]): Catalog {
  const composers: Catalog['composers'] = []
  const licences: Catalog['licences'] = []
  const pieces = list.map((e): Piece => {
    const m = /^(.*?)\s*\((\d{4})[–-](\d{4})\)$/.exec(e.composer)
    const c = m ? { name: m[1], born: +m[2], died: +m[3] } : { name: e.composer, died: 0 }
    const lieder = e.collection.startsWith('OpenScore')
    const folded = /folded into the right hand/.test(e.sourceEdition)
    return {
      id: e.id,
      title: e.title,
      composer: at(composers, c, (x) => x.name === c.name),
      fifths: 0, meter: '', bars: 0, sec: 0, bpm: 0, notes: 0, lo: 0, hi: 0, tracks: 0, // read from the file when the row shows
      grade: LEVEL_GRADE[e.level] ?? 3,
      gradeWhy: [],
      tags: [e.level.toLowerCase()],
      source: lieder ? 'openscore-lieder' : 'mutopia',
      sourceUrl: e.sourceUrl,
      licenceEvidence: e.licenceEvidence,
      licence: at(licences, { id: e.licence, url: e.licenceUrl }, (x) => x.id === e.licence),
      edition: e.sourceEdition.replace(/;\s*the vocal line is folded into the right hand$/, ''),
      typesetter: e.typesetter,
      arranger: e.arranger,
      ...(e.nc ? { nc: true as const } : {}),
      quality: 1,
      flags: lieder ? [folded ? 'voice-folded' : 'voice-dropped'] : [],
      format: e.format,
      file: `p/${e.sha256.slice(0, 16)}.${e.format === 'midi' ? 'mid' : 'mxl'}`,
      bytes: e.bytes,
      sha256: e.sha256,
    }
  })
  return { v: 1, built: '', composers, licences, pieces }
}

/** The network catalogue, plus any bundled piece it does not carry (re-indexed into its tables). */
export function merge(net: Catalog, base: Catalog): Catalog {
  const have = new Set([...net.pieces.map((p) => p.id), ...Object.keys(net.aliases ?? {})])
  const composers = [...net.composers]
  const licences = [...net.licences]
  const extra = base.pieces
    .filter((p) => !have.has(p.id))
    .map((p) => {
      const c = base.composers[p.composer]
      const l = base.licences[p.licence]
      return { ...p, composer: at(composers, c, (x) => x.name === c.name), licence: at(licences, l, (x) => x.id === l.id) }
    })
  return { ...net, composers, licences, pieces: [...net.pieces, ...extra] }
}

// ---------------------------------------------------------------- search

/** Lower case, no diacritics, split into words and numbers: "Dvořák Op.46" -> dvorak, op, 46. */
export const tokens = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().match(/\p{L}+|\p{N}+/gu) ?? []

export interface Index {
  cat: Catalog
  fields: string[][][] // per piece: title, composer, opus, tags
  rank: Int32Array // place in the browsing order: easiest first, then best quality, then catalogue order (the bundle's is curated)
}

const WEIGHT = [4, 3, 3, 1] // a title word beats a composer or opus word beats a tag

export function index(cat: Catalog): Index {
  const who = cat.composers.map((c) => tokens(c.name))
  const fields = cat.pieces.map((p) => [tokens(p.title), who[p.composer] ?? [], tokens(p.opus ?? ''), p.tags.flatMap(tokens)])
  const ps = cat.pieces
  const order = ps.map((_, i) => i).sort((a, b) => gradeOf(ps[a]) - gradeOf(ps[b]) || ps[b].quality - ps[a].quality || a - b)
  const rank = new Int32Array(order.length)
  order.forEach((i, r) => (rank[i] = r))
  return { cat, fields, rank }
}

export interface Filter {
  grade?: number
  composer?: number
}

/** Piece indices whose words start with every word typed, best first; an empty query lists all in browsing order. */
export function search(ix: Index, q: string, f: Filter = {}): number[] {
  const qs = tokens(q)
  const hits: [number, number][] = []
  ix.cat.pieces.forEach((p, i) => {
    if (f.grade !== undefined && gradeOf(p) !== f.grade) return
    if (f.composer !== undefined && p.composer !== f.composer) return
    let score = 0
    for (const t of qs) {
      let best = 0
      ix.fields[i].forEach((words, k) => {
        for (let j = 0; j < words.length; j++) if (words[j].startsWith(t)) best = Math.max(best, WEIGHT[k] + (words[j] === t ? 1 : 0) + (k === 0 && j === 0 ? 1 : 0))
      })
      if (!best) return
      score += best
    }
    hits.push([i, score])
  })
  return hits.sort((a, b) => b[1] - a[1] || ix.rank[a[0]] - ix.rank[b[0]]).map((h) => h[0])
}

// ---------------------------------------------------------------- state

export let catalog: Catalog = { v: 1, built: '', composers: [], licences: [], pieces: [] }
export let searchIndex = index(catalog)
let byId = new Map<string, Piece>()
let bundle = new Map<string, string>() // id -> file in public/library/
export const cached = new Set<string>() // ids whose file is in IndexedDB

export function use(c: Catalog) {
  catalog = c
  searchIndex = index(c)
  byId = new Map(c.pieces.map((p) => [p.id, p]))
}

/** A piece by id, following the catalogue's aliases (an old id -> its new one). */
export const piece = (id: string) => byId.get(id) ?? byId.get(catalog.aliases?.[id] ?? '')
export const inBundle = (id: string) => bundle.has(id)
export const local = (id: string) => bundle.has(id) || cached.has(id)

/** Whether the corpus catalogue could be had: undefined while asking, false when it could not be fetched (offline, 404, damaged). `have`: one is stored from an earlier visit. */
export const net: { ok?: boolean; have: boolean } = { have: false }
let changed = () => {}

/** The bundled catalogue now, the stored network one if any, then a revalidation in the background; onChange runs when that brings a newer one or fails with nothing stored. */
export async function init(onChange: () => void) {
  changed = onChange
  net.ok = undefined
  const list = await loadManifest()
  bundle = new Map(list.map((e) => [e.id, e.file]))
  const base = builtin(list)
  const stored = await get<Catalog>('catalog')
  try {
    use(stored ? merge(stored, base) : base)
    net.have = !!stored
  } catch {
    net.have = false
    use(base) // a stored catalogue that does not read (an old shape, a damaged write): the bundled pieces, and the corpus is fetched again
  }
  for (const k of await keys()) if (String(k).startsWith('libfile:')) cached.add(String(k).slice(8))
  void fetchCatalog(stored?.built).then((c) => {
    if (c) {
      use(merge(c, base))
      void set('catalog', c, true)
    }
    if (c || (!net.ok && !net.have)) onChange()
  })
}

/** Ask again, from the Songs page's Try again. */
export const retry = () => init(changed)

/** catalog.json, revalidated with the server (the browser sends its ETag); undefined when offline, unchanged or malformed. Sets `net.ok`. */
export async function fetchCatalog(built?: string, f: typeof fetch = fetch): Promise<Catalog | undefined> {
  net.ok = false
  try {
    const r = await f(new URL('catalog.json', CORPUS).href, { cache: 'no-cache' })
    if (!r.ok) return
    const c = (await r.json()) as Catalog
    if (c?.v !== 1 || !Array.isArray(c.pieces) || !Array.isArray(c.composers) || !Array.isArray(c.licences)) return
    net.ok = true
    if (c.built !== built) return c
  } catch {
    /* offline: the bundled pieces stay */
  }
}

// ---------------------------------------------------------------- files

export interface IO {
  fetch: typeof fetch
  get: (k: string) => Promise<unknown>
  set: (k: string, v: unknown) => Promise<void>
}
// a stalled connection must end in the retry message, not hang: 20 s covers a piece on a slow link
const IDB: IO = { fetch: (u, o) => fetch(u, { signal: AbortSignal.timeout(20_000), ...o }), get, set: (k, v) => set(k, v, true) }

export async function sha256(b: ArrayBuffer) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))].map((x) => x.toString(16).padStart(2, '0')).join('')
}
// some web views are not a secure context and have no crypto.subtle: the bytes are then taken on trust
const intact = async (b: ArrayBuffer, want: string) => !globalThis.crypto?.subtle || (await sha256(b)) === want

/** A piece's file: from IndexedDB, else the copy bundled with the app, else the corpus (then kept in IndexedDB). A file whose sha256 is wrong is never used. */
export async function pieceBytes(p: Piece, io: IO = IDB, bundled = bundle.has(p.id) ? libraryUrl(bundle.get(p.id)!) : undefined): Promise<ArrayBuffer> {
  const kept = await io.get(`libfile:${p.id}`).catch(() => undefined)
  if (kept instanceof ArrayBuffer && (await intact(kept, p.sha256))) return kept
  for (const url of [bundled, new URL(p.file, CORPUS).href]) {
    if (!url) continue
    try {
      const r = await io.fetch(url)
      if (!served(r)) continue
      const b = await r.arrayBuffer()
      if (!(await intact(b, p.sha256))) continue
      if (url !== bundled) {
        await io.set(`libfile:${p.id}`, b).catch(() => {})
        cached.add(p.id)
      }
      return b
    } catch {
      /* the next place */
    }
  }
  throw new Error(`${p.title} could not be loaded. Check the connection and try again.`)
}
