// Packs (docs/changes/studies-packs.md): a small JSON text file that names things the app already has, in an order, with a note for each.
// It never carries music: a piece is a catalogue id, an exercise its recipe, a reading or scale stage its id. Pure: lazy with the pack page, never boot.
import { mastery, STAGES as READ, type Stats } from './drill'
import { mastery as scaleMastery, STAGES as SCALES, type ScaleStats } from './scales'
import { stateOf, type TechStats } from './syllabus'
import { ARTICS, DYNS, exercise, KEYS, KEYS_MINOR, type Opts, PATTERNS } from './technique'
import type { Piece } from './catalog-types'
import type { Progress } from './store'

export interface Item {
  piece?: string // a catalogue id (an alias resolves)
  drill?: Opts // a Technique exercise, by its settings
  read?: string // a Read stage id
  scale?: string // a Scales stage id
  title?: string // the name shown in this pack, else the piece's, exercise's or stage's own
  note?: string
  rate?: number // a share of the written tempo, 0.4 to 1
  view?: { names?: boolean; fingers?: boolean } // false turns that aid off for this item
}
export interface Pack {
  pth: 1
  id: string // stable: progress and a re-import go by it
  title: string
  by: string // the credit, shown as written, never trusted
  about?: string
  licence?: 'CC0-1.0' | 'CC-BY-4.0' // of the list, its order and its notes only
  kind?: 'study' // on Technique, with the studies; else on Songs
  warmup?: number // a warm-up of n a day: a rotation, never a book to finish
  items: Item[]
}

const LIMIT = { title: 80, by: 80, about: 300, note: 140, itemTitle: 60, items: 200, bytes: 64_000 }
const URL_RE = /https?:|www\.|:\/\//i

/** A pack from its text, or an Error that says what is wrong and where. Nothing it does not know is accepted. */
export function parsePack(text: string): Pack {
  if (text.length > LIMIT.bytes) throw new Error('This pack is too big. A pack is a short list, under 64 KB.')
  let d: any
  try {
    d = JSON.parse(text)
  } catch {
    throw new Error('This is not a pack file: it is not JSON.')
  }
  if (d?.pth === undefined) throw new Error('This is not a pack file: it has no "pth" version.')
  if (d.pth !== 1) throw new Error(`This pack is version ${d.pth}; this app reads version 1. Update the app.`)
  only(d, ['pth', 'id', 'title', 'by', 'about', 'licence', 'kind', 'warmup', 'items'], 'The pack')
  if (typeof d.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(d.id)) throw new Error('"id" must be lower-case letters, digits and dashes, up to 64.')
  text1(d, 'title', LIMIT.title, 'The pack', true)
  text1(d, 'by', LIMIT.by, 'The pack', true)
  text1(d, 'about', LIMIT.about, 'The pack')
  if (d.licence !== undefined && d.licence !== 'CC0-1.0' && d.licence !== 'CC-BY-4.0') throw new Error('"licence" must be "CC0-1.0" or "CC-BY-4.0".')
  if (d.kind !== undefined && d.kind !== 'study') throw new Error('"kind" can only be "study".')
  if (d.warmup !== undefined && !(Number.isInteger(d.warmup) && d.warmup >= 1 && d.warmup <= 5)) throw new Error('"warmup" must be a whole number from 1 to 5.')
  if (!Array.isArray(d.items) || !d.items.length) throw new Error('"items" must be a list with at least one item.')
  if (d.items.length > LIMIT.items) throw new Error(`A pack holds at most ${LIMIT.items} items.`)
  d.items.forEach(item)
  return d as Pack
}

function only(o: any, keys: string[], who: string) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error(`${who} must be an object.`)
  const bad = Object.keys(o).find((k) => !keys.includes(k))
  if (bad) throw new Error(`${who}: "${bad}" is not something it can have.`)
}
function text1(o: any, k: string, max: number, who: string, need = false) {
  const v = o[k]
  if (v === undefined && !need) return
  if (typeof v !== 'string' || !v.trim()) throw new Error(`${who}: "${k}" must be some text.`)
  if (v.length > max) throw new Error(`${who}: "${k}" is longer than ${max} characters.`)
  if (URL_RE.test(v)) throw new Error(`${who}: "${k}" holds a web address; a pack's text cannot.`)
}

function item(it: any, i: number) {
  const who = `Item ${i + 1}`
  only(it, ['piece', 'drill', 'read', 'scale', 'title', 'note', 'rate', 'view'], who)
  const what = ['piece', 'drill', 'read', 'scale'].filter((k) => it[k] !== undefined)
  if (what.length !== 1) throw new Error(`${who} must name exactly one of "piece", "drill", "read" or "scale".`)
  for (const k of ['piece', 'read', 'scale']) if (it[k] !== undefined && (typeof it[k] !== 'string' || !it[k] || it[k].length > 64)) throw new Error(`${who}: "${k}" must be an id.`)
  if (it.drill !== undefined) drill(it.drill, who)
  text1(it, 'title', LIMIT.itemTitle, who)
  text1(it, 'note', LIMIT.note, who)
  if (it.rate !== undefined && !(typeof it.rate === 'number' && it.rate >= 0.4 && it.rate <= 1)) throw new Error(`${who}: "rate" must be a number from 0.4 to 1.`)
  if (it.view !== undefined) {
    only(it.view, ['names', 'fingers'], `${who}'s "view"`)
    for (const v of Object.values(it.view)) if (typeof v !== 'boolean') throw new Error(`${who}: "view" takes true or false.`)
  }
}

function drill(o: any, who: string) {
  only(o, ['pattern', 'tonic', 'minor', 'dyn', 'hands', 'bpm', 'artic', 'level'], `${who}'s "drill"`)
  const one = (k: string, ok: boolean, says: string) => {
    if (!ok) throw new Error(`${who}: the drill's "${k}" ${says}.`)
  }
  one('pattern', o.pattern in PATTERNS, `must be one of ${Object.keys(PATTERNS).join(', ')}`)
  one('minor', o.minor === undefined || typeof o.minor === 'boolean', 'is true or false')
  one('tonic', Number.isInteger(o.tonic) && (o.pattern === 'rhythm' || o.tonic in (o.minor ? KEYS_MINOR : KEYS)), 'must be a key the Technique page offers (a pitch class, 0 is C)')
  one('dyn', o.dyn in DYNS, `must be one of ${Object.keys(DYNS).join(', ')}`)
  one('hands', ['R', 'L', 'both'].includes(o.hands), 'must be R, L or both')
  one('bpm', Number.isInteger(o.bpm) && o.bpm >= 30 && o.bpm <= 200, 'must be a whole number from 30 to 200')
  one('artic', o.artic === undefined || (o.artic !== 'normal' && o.artic in ARTICS), 'must be legato or staccato')
  one('level', o.level === undefined || [1, 2, 3].includes(o.level), 'must be 1, 2 or 3')
}

// ---------------------------------------------------------------- links: the whole pack in the URL fragment, which never reaches a server

const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
async function pipe(b: Uint8Array, s: CompressionStream | DecompressionStream, cap = Infinity) {
  const out: Uint8Array[] = []
  let n = 0
  const r = new Blob([b as BlobPart]).stream().pipeThrough(s).getReader()
  for (let c; !(c = await r.read()).done; ) {
    if ((n += c.value.length) > cap) {
      void r.cancel()
      throw new Error('This pack link is too big.')
    }
    out.push(c.value)
  }
  return new Uint8Array(await new Blob(out as BlobPart[]).arrayBuffer())
}

/** The fragment that carries a pack: `pack=` and the deflated JSON in base64url. */
export const packFragment = async (p: Pack) => `pack=${b64u(await pipe(new TextEncoder().encode(JSON.stringify(p)), new CompressionStream('deflate-raw')))}`

/** A pack from a fragment (with or without its `#`), checked as a file is. */
export async function packFromFragment(frag: string): Promise<Pack> {
  const s = frag.replace(/^#?pack=/, '')
  let bytes: Uint8Array
  try {
    bytes = Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))
  } catch {
    throw new Error('This pack link is damaged. Ask for it again, or for the file.')
  }
  let text: string
  try {
    text = new TextDecoder().decode(await pipe(bytes, new DecompressionStream('deflate-raw'), LIMIT.bytes))
  } catch (e) {
    throw new Error((e as Error).message === 'This pack link is too big.' ? 'This pack link is too big.' : 'This pack link is damaged. Ask for it again, or for the file.')
  }
  return parsePack(text)
}

// ---------------------------------------------------------------- where you are in a pack

export interface Ctx {
  piece: (id: string) => Piece | undefined
  prog: Map<string, Progress>
  tech: TechStats
  drill: Stats
  scales: ScaleStats
  day: number
  dayOf: (ts: number) => number
}
export type State = 'done' | 'learning' | 'new' | 'missing'
export interface Row {
  i: number
  item: Item
  title: string
  level?: number // a piece's grade; none for a study (decision 26) or what is not a piece
  state: State
  word: string // the item's own word for it: Ready, Solid, Learning
  today?: boolean // a warm-up item played today
}

/** Each item, resolved: its name and its state by its own rule (a piece Ready, an exercise or stage Solid). An id the app does not know is `missing`, shown greyed, never an error. */
export function rows(p: Pack, c: Ctx): Row[] {
  return p.items.map((item, i): Row => {
    const named = (title: string, state: State, word: string, extra: Partial<Row> = {}) => ({ i, item, title: item.title ?? title, state, word, ...extra })
    if (item.piece !== undefined) {
      const pc = c.piece(item.piece)
      if (!pc) return named(item.piece, 'missing', 'Not in the library yet')
      const pr = c.prog.get(`lib:${pc.id}`)
      const st: State = (pr?.days?.length ?? 0) >= 2 ? 'done' : (pr?.plays ?? 0) > 0 ? 'learning' : 'new'
      return named(pc.title, st, st === 'done' ? 'Ready' : st === 'learning' ? 'Learning' : '', { ...(pc.kind !== 'study' && { level: pc.gradeOverride ?? pc.grade }), ...(pr?.last && c.dayOf(pr.last) === c.day && { today: true }) })
    }
    if (item.drill) {
      const song = exercise(item.drill)
      const s = stateOf(c.tech, song.id, c.day)
      const st: State = s === 'solid' || s === 'due' ? 'done' : s === 'learning' ? 'learning' : 'new'
      return named(song.title[0].toUpperCase() + song.title.slice(1), st, s === 'due' ? 'Due' : st === 'done' ? 'Solid' : st === 'learning' ? 'Learning' : '')
    }
    const stage = item.read !== undefined ? READ.find((s) => s.id === item.read) : SCALES.find((s) => s.id === item.scale)
    if (!stage) return named(String(item.read ?? item.scale), 'missing', 'Not in this version of the app')
    const m = item.read !== undefined ? mastery(stage as (typeof READ)[number], c.drill) : scaleMastery(stage as (typeof SCALES)[number], c.scales)
    const st: State = m.solid ? 'done' : m.pct > 0 ? 'learning' : 'new'
    return named(stage.name, st, st === 'done' ? 'Solid' : st === 'learning' ? `${Math.round(m.pct * 100)}%` : '')
  })
}

/** What is next: the first item not done (a warm-up: today's n, the ones played longest ago, the first of them not played today). Undefined when nothing is left for today. */
export function nextOf(p: Pack, rs: Row[], c: Ctx): { next?: Row; today: Row[] } {
  const live = rs.filter((r) => r.state !== 'missing')
  if (!p.warmup) return { next: live.find((r) => r.state !== 'done') ?? undefined, today: [] }
  const last = (r: Row) => (r.item.piece && c.prog.get(`lib:${c.piece(r.item.piece)?.id}`)?.last) || 0
  const today = [...live.filter((r) => r.today), ...live.filter((r) => !r.today).sort((a, b) => last(a) - last(b) || a.i - b.i)].slice(0, p.warmup).sort((a, b) => a.i - b.i)
  return { next: today.find((r) => !r.today), today }
}

/** The ids a pack names that the catalogue, the Read stages or the Scales stages do not have: for a pack's checks (first-party packs must have none). */
export const unknown = (p: Pack, has: (id: string) => boolean) =>
  p.items.flatMap((it, i) => ((it.piece !== undefined && !has(it.piece)) || (it.read !== undefined && !READ.some((s) => s.id === it.read)) || (it.scale !== undefined && !SCALES.some((s) => s.id === it.scale)) ? [i] : []))
