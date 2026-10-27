// Library pipeline, the offline half: analyse (with the app's own importers), dedupe, emit.
// Bundled by scripts/library/vite.config.mjs into .cache/library/bin/pipeline.mjs and driven by build.mjs, which fetches,
// checks licences and normalises. Pure and deterministic: the same inputs give byte-identical output.
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { Midi } from '@tonejs/midi'
import { fromMidi, inspectMidi, type Selection, type Tempo } from '../../src/midi-tracks'
import { formTempo, onsetsOf } from '../../src/formtempo'
import { fromMusicXml, tempoWord, xmlText } from '../../src/musicxml'
import { estimateFifths, type Song } from '../../src/song'
import type { Catalog, Piece } from '../../src/catalog-types'
import { lyPickup, plays, withRepeats } from './repeats'
import { SOURCE } from '../../src/credits'
export { lyPickup, pickLy, unfold, withRepeats } from './repeats'
export { kernToMusicXml } from '../../src/kern' // --set chopin: Humdrum **kern, shipped as the MusicXML it converts to

export interface Input {
  id: string
  title: string
  composer: string // 'J. S. Bach (1685–1750)'
  opus?: string
  source: Piece['source']
  sourceUrl: string
  licenceEvidence: string
  licence: string
  licenceUrl: string
  edition: string
  typesetter?: string
  arranger?: string
  style?: string
  format: Piece['format']
  bytes: Uint8Array // as shipped: MIDI, or a piano-only .mxl
  upstreamSha: string // sha256 of the file as fetched, before normalising
  ly?: string // the LilyPond source of a Mutopia MIDI, read for repeats, D.C. and tempo marks
  noFormTempo?: true // leave a score that names no pace as it is, without the form guess (reanalyse --formtempo-only compares the two)
  noPickup?: true // leave the first bar to the detector, as before the .ly's \partial was read (reanalyse --pickup-only compares the two)
  matched?: boolean // withRepeats read this .ly against the MIDI before playing its repeats out: it is the score that plays it
  voice?: 'folded' | 'dropped' // a song: its vocal line folded into the right hand, or left out (flagged voice-folded, voice-dropped)
  alt?: Input // a folded song's piano-only version, shipped instead when the fold fails its gates (reach())
  why?: string // why the voice was left out
  rank?: number // between equally good versions of one work, the lower wins dedupe (build.mjs: Chopin first editions)
}

/** Gate names. fail: never shipped. review: minus 10 quality. flag: minus 3. */
export const GATES = {
  fail: ['parse', 'notes', 'bars', 'pitch', 'bar-order'],
  review: ['length', 'bar-length', 'key', 'hand-share', 'hand-register', 'chord', 'span'],
  flag: ['no-tempo', 'tempo-estimated', 'dc-ds', 'repeats', 'tuplets'],
} as const

export interface Analysis {
  id: string
  fails: string[]
  review: string[]
  flags: string[]
  tags: string[]
  quality: number
  grade: number
  gradeWhy: number[]
  error?: string
  song?: Song
  pick?: Selection
  tracks: number
  tempo?: number // quarter-note bpm the catalogue overrides the MIDI's own with (a tempo word of the .ly)
  pickup?: number // quarters in the first bar, as the .ly states it
  fp: Set<string>
  note?: string // why a song ships piano-only, kept in the report
}

const ab = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer
const p95 = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length * 0.95)] : 0)
const clamp = (x: number, hi: number) => Math.max(0, Math.min(hi, x))
const r2 = (x: number) => Math.round(x * 100) / 100

const HAND_NAME: [RegExp, 'R' | 'L'][] = [
  [/left|lower|bass|\blh\b|links|sinistra|gauche|unten/i, 'L'],
  [/right|upper|treble|\brh\b|rechts|destra|droite|oben/i, 'R'],
]

/** Three or more MIDI tracks: pin each to a hand by its name, else by its middle pitch (the app would split them all at middle C). */
export function pinHands(buf: ArrayBuffer): Selection | undefined {
  const live = inspectMidi(buf).tracks.filter((t) => !t.percussion)
  if (live.length < 3) return undefined
  const hands: Record<number, 'R' | 'L'> = {}
  for (const t of live) hands[t.index] = HAND_NAME.find(([re]) => re.test(t.name))?.[1] ?? ((t.lo + t.hi) / 2 < 60 ? 'L' : 'R')
  if (!Object.values(hands).includes('L')) hands[[...live].sort((a, b) => a.lo + a.hi - b.lo - b.hi)[0].index] = 'L'
  if (!Object.values(hands).includes('R')) hands[[...live].sort((a, b) => b.lo + b.hi - a.lo - a.hi)[0].index] = 'R'
  return { tracks: live.map((t) => t.index), hands }
}

/** Grade cut points on D, the sum of the seven terms: the 8th, 30th, 60th and 85th percentile of D over the analysed
 * Mutopia set (scripts/library/fit.mjs), so it splits 8/22/30/25/15% into grades 1 to 5. */
export const CUTS = [3.52, 5.47, 7.07, 8.19]

/** Gates, flags, tags and the grade terms for one parsed Song. `marks` is the score text (.ly or MusicXML) when there is one. */
export function judge(s: Song, marks = '', hasTempo = true) {
  const fails: string[] = []
  const review: string[] = []
  const flags: string[] = []
  const notes = s.notes.filter((n) => !n.grace)
  const bars = s.bars
  if (notes.length < 20) fails.push('notes')
  if (bars.length < 4 || bars.length > 5000) fails.push('bars')
  if (s.lo < 21 || s.hi > 108) fails.push('pitch')
  if (bars.some((b, i) => i > 0 && !(b.t0 > bars[i - 1].t0))) fails.push('bar-order')
  if (s.end < 10 || s.end > 900) review.push('length')
  if (bars.some((b, i) => i > 0 && i < bars.length - 1 && Math.abs((b.ql ?? (b.n * 4) / b.den) - (b.n * 4) / b.den) > 1e-6)) review.push('bar-length')
  const est = estimateFifths(notes.map((n) => ({ p: n.p, d: n.d, dq: n.qd })))
  const off = Math.abs(est - s.fifths) % 12
  if (Math.min(off, 12 - off) >= 3) review.push('key')
  const L = notes.filter((n) => n.h === 'L')
  const R = notes.filter((n) => n.h === 'R')
  const left = notes.length ? L.length / notes.length : 0
  if (left < 0.15 || left > 0.85) review.push('hand-share')
  if (L.filter((n) => n.p > 72).length > 0.1 * L.length || R.filter((n) => n.p < 48).length > 0.1 * R.length) review.push('hand-register')
  // chords: the notes one hand starts together
  const at = new Map<string, number[]>()
  for (const n of notes) {
    const k = `${n.h}:${n.bar}:${(n.qb ?? n.t).toFixed(3)}`
    at.set(k, [...(at.get(k) ?? []), n.p])
  }
  const chords = [...at.values()]
  const maxChord = Math.max(0, ...chords.map((c) => c.length))
  const spanP95 = p95(chords.map((c) => Math.max(...c) - Math.min(...c))) // over every onset, single notes too (as src/library.test.ts)
  if (maxChord > 5) review.push('chord')
  if (spanP95 > 12) review.push('span')
  if (!hasTempo) flags.push('no-tempo')
  if (s.flags?.includes('tempo-estimated')) flags.push('tempo-estimated') // a MusicXML score with only a tempo word: the bpm is the importer's guess
  if (/D\.\s?[CS]\.|\\segno|\\coda|<segno|<coda|dacapo=|dalsegno=|\bFine\b|\bCoda\b/.test(marks)) flags.push('dc-ds')
  // LilyPond's MIDI plays a repeat only under \unfoldRepeats; the MusicXML importer expands them unless it says it could not
  if ((/\\repeat\s+"?volta/.test(marks) && !/\\unfoldRepeats/.test(marks)) || s.flags?.includes('repeats-unexpanded')) flags.push('repeats')
  if (notes.some((n) => n.tuplet && !(n.tuplet.num === 3 && n.tuplet.den === 2))) flags.push('tuplets')
  const tags = [...(notes.some((n) => n.tieNext) ? ['ties'] : []), ...(notes.some((n) => n.tuplet?.num === 3 && n.tuplet.den === 2) ? ['triplets'] : [])]

  // grade: seven capped terms, summed
  const perBar = new Array(bars.length).fill(0)
  for (const n of notes) perBar[n.bar]++
  const onsets = new Set(notes.map((n) => `${n.bar}:${(n.qb ?? n.t).toFixed(3)}`)).size
  const tonic = (((7 * s.fifths) % 12) + 12) % 12
  const scale = new Set([0, 2, 4, 5, 7, 9, 11].map((x) => (x + tonic) % 12))
  const share = (f: (n: (typeof notes)[0]) => boolean) => (notes.length ? notes.filter(f).length / notes.length : 0)
  const why = [
    clamp(onsets / Math.max(s.end, 1) / 2, 3),
    clamp((p95(perBar) - 6) / 8, 2),
    clamp(0.5 * (maxChord - 2), 1.5),
    clamp((spanP95 - 7) / 4, 1.5),
    clamp((s.hi - s.lo - 24) / 24, 1),
    clamp(3 * share((n) => !scale.has(n.p % 12)), 1),
    clamp(5 * share((n) => !!n.tuplet) + 1.5 * share((n) => (n.qd ?? n.beats) <= 0.25 + 1e-6), 1),
  ].map(r2)
  const D = why.reduce((a, b) => a + b, 0)
  const grade = 1 + CUTS.filter((c) => D >= c).length
  return { fails, review, flags, tags, grade, gradeWhy: why, quality: 100 - 10 * review.length - 3 * flags.length }
}

/** 4-grams of the intervals of the top line (highest note at each onset). */
export function fingerprint(s: Song): Set<string> {
  const top = new Map<number, number>()
  for (const n of s.notes) if (!n.grace) top.set(Math.round(n.t * 50), Math.max(top.get(Math.round(n.t * 50)) ?? 0, n.p))
  const line = [...top.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1])
  const iv = line.slice(1).map((p, i) => p - line[i])
  const out = new Set<string>()
  for (let i = 0; i + 4 <= iv.length; i++) out.add(iv.slice(i, i + 4).join(','))
  return out
}

// ---- the pace a Mutopia .ly names ----

const LY_NUMBER = /\\tempo[^\n]*=\s*\d|tempoWholesPerMinute/ // either one LilyPond writes into the MIDI
// the text after \tempo, \mark, \markup, a script string or a header piece/meter/subtitle: a string, a {group} (one nested level) or the rest of the line
const LY_TEXT = /(?:\\tempo|\\mark(?:up)?|\b(?:piece|meter|subtitle)\s*=|[\^_-](?="))\s*(?:\\markup\s*)?("(?:[^"\\]|\\.)*"|\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|[^\n]{0,200})/g
const LY_METRONOME = /\\note\s+#"(\d+)(\.*)"[^=]{0,60}=\s*(\d+)/ // a markup's (note = 66): the unit, its dots and the number

/** What a .ly says about pace: `given` when it holds a number the MIDI already plays; else `bpm` (quarters a minute) from the
 * first markup metronome mark ("exact") or tempo word (a guess) in it, in file order. */
export function lyPace(ly: string, compound = false): { given: boolean; bpm?: number; exact?: boolean } {
  const src = ly.replace(/%\{[\s\S]*?%\}|%.*$/gm, ' ')
  if (LY_NUMBER.test(src)) return { given: true }
  for (const [, text] of src.matchAll(LY_TEXT)) {
    const m = LY_METRONOME.exec(text)
    if (m) return { given: false, bpm: Math.round(+m[3] * (4 / +m[1]) * (2 - 0.5 ** m[2].length)), exact: true }
    const bpm = tempoWord(text, compound)
    if (bpm) return { given: false, bpm }
  }
  return { given: false }
}

export * from '../../src/formtempo' // for formtempo-eval.mjs
const LY_HEAD = /\b(?:title|subtitle|piece|meter)\s*=\s*(?:\\markup\s*)?("(?:[^"\\]|\\.)*"|\{[^{}]*\})/g // the header's strings that can name a form
const lyHeads = (ly: string) => [...ly.replace(/%.*$/gm, ' ').matchAll(LY_HEAD)].map((m) => m[1])

export async function analyse(e: Input): Promise<Analysis> {
  const base = { id: e.id, review: [], flags: [], tags: [], quality: 0, grade: 0, gradeWhy: [], tracks: 0, fp: new Set<string>() }
  try {
    let s: Song, marks: string, hasTempo: boolean, pick: Selection | undefined, tracks: number, tempo: Tempo | undefined, pickup: number | undefined
    if (e.format === 'midi') {
      pick = pinHands(ab(e.bytes))
      const midi = new Midi(ab(e.bytes))
      tracks = midi.tracks.filter((t) => t.notes.length).length
      marks = e.ly ?? ''
      // LilyPond's default is 60: a file at exactly that, or with no tempo event, whose .ly gives no number, has no tempo
      // (a non-60 one with no number in this .ly got it from an \include or a sibling .ly)
      const [n, d] = midi.header.timeSignatures[0]?.timeSignature ?? [4, 4]
      const pace = e.ly ? lyPace(e.ly, d === 8 && n > 3 && n % 3 === 0) : { given: true }
      // a movement of a zip (mutopia-N-k) may have been given a sibling's .ly when none matched (pickLy's fallback)
      if (pace.bpm && /^mutopia-\d+-\d+$/.test(e.id) && !e.matched && !plays(e.bytes, e.ly!)) pace.bpm = undefined
      const flat = midi.header.tempos.every((t) => Math.abs(t.bpm - 60) < 0.01)
      if (!pace.given && flat && pace.bpm) tempo = { bpm: pace.bpm, guess: !pace.exact }
      hasTempo = !!tempo || (e.ly ? pace.given || !flat : midi.header.tempos.length > 0)
      pickup = e.ly && !e.noPickup ? lyPickup(e.bytes, e.ly, e.matched) : undefined // plays()'s test is inside: a .ly that is not this file's says nothing
      s = fromMidi(ab(e.bytes), e.title, e.id, 60, pick, tempo, pickup)
      if (!tempo && !pace.given && flat && !e.noFormTempo) {
        // nothing in the .ly names a pace: guess one from the form, else 100. A movement of a zip reads the .ly's header only when it is this file's
        const mine = !/^mutopia-\d+-\d+$/.test(e.id) || e.matched || plays(e.bytes, e.ly!)
        tempo = { bpm: formTempo([e.title, ...(mine ? lyHeads(e.ly!) : [])].join(' '), onsetsOf(s)).bpm, guess: true }
        hasTempo = true
        s = fromMidi(ab(e.bytes), e.title, e.id, 60, pick, tempo, pickup)
      }
    } else {
      marks = await xmlText(ab(e.bytes))
      s = fromMusicXml(marks, e.title, e.id)
      if (s.flags?.includes('no-tempo') && !e.noFormTempo) {
        // only a form in the table (already 100 otherwise): the title names it
        const g = formTempo(e.title, onsetsOf(s))
        if (g.form) s = fromMusicXml(marks, e.title, e.id, (tempo = { bpm: g.bpm, guess: true }))
      }
      tracks = (marks.match(/<part id="/g) ?? []).length
      hasTempo = !s.flags?.includes('no-tempo') // a <sound tempo>, a <metronome> or a tempo word (that one flagged 'tempo-estimated')
    }
    return { ...base, ...judge(s, marks, hasTempo), song: s, pick, tracks, ...(tempo && { tempo: tempo.bpm }), ...(pickup !== undefined && { pickup }), fp: fingerprint(s) }
  } catch (err) {
    return { ...base, fails: ['parse'], error: String((err as Error).message ?? err) }
  }
}

/** A folded song's right hand: 95% of its onsets reach 14 semitones or less and none holds more than 5 notes (as src/library.test.ts). */
export function reach(s: Song) {
  const at = new Map<string, Set<number>>()
  for (const n of s.notes) if (n.h === 'R' && !n.grace) at.set(n.t.toFixed(3), (at.get(n.t.toFixed(3)) ?? new Set()).add(n.p))
  const cs = [...at.values()].map((c) => [...c])
  const span = p95(cs.map((c) => Math.max(...c) - Math.min(...c)))
  const most = Math.max(0, ...cs.map((c) => c.length))
  return { span, most, ok: span <= 14 && most <= 5 }
}

/** analyse(), and for a folded song the fold gate: one that fails it, or the normal gates, is analysed again piano-only. */
async function voiced(e: Input): Promise<{ e: Input; a: Analysis }> {
  const a = await analyse(e)
  const r = a.song && reach(a.song)
  const why = !e.alt ? '' : a.fails.length ? a.fails.join(' ') : !r!.ok ? `right-hand reach ${r!.span}, ${r!.most} at once` : a.quality < 70 ? `quality ${a.quality}` : ''
  if (why) return voiced({ ...e.alt!, why: `voice dropped: folded ${why}` })
  if (e.voice) a.flags.push(`voice-${e.voice}`) // after judge(), so quality is not docked
  return { e, a: { ...a, ...(e.why && { note: e.why }) } }
}

// ---- dedupe ----

const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
// surname and dates: 'F. F. Chopin (1810–1849)' and 'Frédéric Chopin (1810–1849)' are one composer
export const composerKey = (c: string) => fold(c.replace(/\(.*\)/, '')).trim().split(/[\s.]+/).pop()!.replace(/[^a-z]/g, '') + (c.match(/\d{4}/g) ?? []).join('')
const CAT = /\b(BWV\s*(?:Anh\.?\s*)?\d+[a-z]?|K(?:V|\.)?\s*\d+[a-z]?|Anh\.?\s*\d+|WoO\s*\d+|Op\.?\s*\d+[a-z]?(?:,?\s*No\.?\s*\d+)?)/i
export const catKey = (e: Pick<Input, 'title' | 'opus'>) => {
  const m = CAT.exec(`${e.opus ?? ''} ${e.title}`)
  return m ? fold(m[1]).replace(/[^a-z0-9]/g, '') : ''
}
const words = (t: string) => new Set(fold(t.replace(CAT, '')).split(/[^a-z0-9]+/).filter((w) => w.length > 1))
export const jaccard = <T,>(a: Set<T>, b: Set<T>) => {
  let n = 0
  for (const x of a) if (b.has(x)) n++
  return a.size + b.size ? n / (a.size + b.size - n) : 0
}
const idOrder = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true })
const LIC_RANK = (l: string) => (/^(Public Domain|CC0)/.test(l) ? 0 : /-SA-/.test(l) ? 2 : 1)
const SRC_RANK = { mutopia: 0, 'openscore-lieder': 1, pdmx: 2, chopin: 3 }

/** Same composer, and the same catalogue number or a similar title, and the same tune by fingerprint: keep a pinned one, else the best one. */
export function dedupe(items: { e: Input; a: Analysis }[], pinned = new Set<string>()): { keep: typeof items; dropped: { id: string; dupOf: string }[] } {
  const better = (x: (typeof items)[0], y: (typeof items)[0]) =>
    +pinned.has(y.e.id) - +pinned.has(x.e.id) ||
    x.a.fails.length - y.a.fails.length ||
    y.a.quality - x.a.quality ||
    (x.e.format === 'musicxml' ? 0 : 1) - (y.e.format === 'musicxml' ? 0 : 1) ||
    LIC_RANK(x.e.licence) - LIC_RANK(y.e.licence) ||
    SRC_RANK[x.e.source] - SRC_RANK[y.e.source] ||
    (x.e.rank ?? 0) - (y.e.rank ?? 0) ||
    (x.e.id < y.e.id ? -1 : 1)
  const parent = items.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const byComposer = new Map<string, number[]>()
  items.forEach((x, i) => byComposer.set(composerKey(x.e.composer), [...(byComposer.get(composerKey(x.e.composer)) ?? []), i]))
  for (const idx of byComposer.values())
    for (let i = 0; i < idx.length; i++)
      for (let j = i + 1; j < idx.length; j++) {
        const [x, y] = [items[idx[i]], items[idx[j]]]
        const cx = catKey(x.e)
        // movements of one Mutopia page share a page, so a zip that holds a movement twice is caught whatever the file names
        const same = x.e.sourceUrl === y.e.sourceUrl || (cx && cx === catKey(y.e)) || jaccard(words(x.e.title), words(y.e.title)) >= 0.6
        // editions of one song under one catalogue number: one folds and another falls back to piano-only, so their top lines differ
        const song = x.e.voice && y.e.voice && cx && cx === catKey(y.e)
        if (same && (song || jaccard(x.a.fp, y.a.fp) >= 0.6)) parent[find(idx[j])] = find(idx[i])
      }
  const groups = new Map<number, number[]>()
  items.forEach((_, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), i]))
  const keep: typeof items = []
  const dropped: { id: string; dupOf: string }[] = []
  for (const g of groups.values()) {
    const sorted = g.map((i) => items[i]).sort(better)
    keep.push(sorted[0])
    for (const x of sorted.slice(1)) dropped.push({ id: x.e.id, dupOf: sorted[0].e.id })
  }
  return { keep: keep.sort((x, y) => idOrder(x.e.id, y.e.id)), dropped: dropped.sort((x, y) => idOrder(x.id, y.id)) }
}

// ---- run: analyse, dedupe, select, emit ----

export interface Options {
  overrides?: Record<string, number>
  grades?: [number, number] // ship only these grades
  limit?: number // ship at most this many: pinned first, then the easiest (grade, then D)
  pinned?: string[] // ids already shipped (public/library): they win dedupe and ship at any grade
}

export interface Row {
  id: string
  stage: 'analyse' | 'dedupe' | 'quality' | 'grade' | 'limit' | 'shipped'
  why: string[]
  grade?: number
  d?: number // the grade's sum of terms
  quality?: number
}

const sha = (b: Uint8Array | string) => createHash('sha256').update(b).digest('hex')
const parseComposer = (c: string) => {
  const m = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(c)
  const ys = (m?.[2] ?? '').match(/\d{4}/g) ?? []
  return { name: (m?.[1] ?? c).trim(), born: ys.length > 1 ? Number(ys[0]) : undefined, died: Number(ys[ys.length - 1]) }
}
const lname = (l: string) => l.replace(/^CC-/, 'CC ').replace(/-(\d+(\.\d+)?)$/, ' $1')

export async function run(inputs: Input[], out: string, o: Options = {}): Promise<Row[]> {
  const pinned = new Set(o.pinned)
  // LilyPond's MIDI plays a volta repeat once: play it out (repeats.ts), except in a pinned file, which stays the bundle's
  const all = inputs.map((e) => (pinned.has(e.id) ? e : withRepeats(e))).sort((a, b) => idOrder(a.id, b.id))
  const items: { e: Input; a: Analysis }[] = []
  for (const e of all) items.push(await voiced(e))
  const rows = new Map<string, Row>()
  const set = (id: string, stage: Row['stage'], why: string[], a?: Analysis) => {
    rows.set(id, { id, stage, why: a?.note ? [...why, a.note] : why, ...(a && a.grade && { grade: a.grade, d: r2(a.gradeWhy.reduce((x, y) => x + y, 0)), quality: a.quality }) })
    return false
  }
  for (const { e, a } of items) {
    const g = o.overrides?.[e.id]
    if (g) a.grade = g
    if (a.fails.length) set(e.id, 'analyse', a.error ? [...a.fails, a.error] : a.fails, a)
  }
  const { keep, dropped } = dedupe(items, pinned)
  for (const d of dropped) set(d.id, 'dedupe', [`duplicate of ${d.dupOf}`], items.find((x) => x.e.id === d.id)!.a)
  let ship = keep.filter(({ e, a }) => {
    if (a.fails.length) return false
    if (a.quality < 70) return set(e.id, 'quality', [...a.review, ...a.flags], a)
    if (o.grades && !pinned.has(e.id) && (a.grade < o.grades[0] || a.grade > o.grades[1])) return set(e.id, 'grade', [`grade ${a.grade}`], a)
    return true
  })
  const D = (a: Analysis) => a.gradeWhy.reduce((x, y) => x + y, 0)
  ship.sort((x, y) => +pinned.has(y.e.id) - +pinned.has(x.e.id) || x.a.grade - y.a.grade || D(x.a) - D(y.a) || idOrder(x.e.id, y.e.id))
  for (const { e, a } of ship.slice(o.limit ?? Infinity)) set(e.id, 'limit', [], a)
  ship = ship.slice(0, o.limit ?? Infinity).sort((x, y) => idOrder(x.e.id, y.e.id))

  // emit
  mkdirSync(`${out}/p`, { recursive: true })
  const composers = [...new Map(ship.map(({ e }) => [parseComposer(e.composer).name, parseComposer(e.composer)])).values()].sort((a, b) => (a.name < b.name ? -1 : 1))
  const licences = [...new Map(ship.map(({ e }) => [e.licence, { id: e.licence, url: e.licenceUrl }])).values()].sort((a, b) => (a.id < b.id ? -1 : 1))
  const pieces: Piece[] = []
  const files = new Set<string>()
  for (const { e, a } of ship) {
    const s = a.song!
    const h = sha(e.bytes)
    const file = `p/${h.slice(0, 16)}.${e.format === 'midi' ? 'mid' : 'mxl'}`
    writeFileSync(`${out}/${file}`, e.bytes)
    files.add(file.slice(2))
    const full = s.bars.find((b) => !b.ql || Math.abs(b.ql - (b.n * 4) / b.den) < 1e-6) ?? s.bars[0]
    const keys = s.keys && s.keys.length > 1 ? s.keys.map((k) => k.fifths) : undefined
    const go = o.overrides?.[e.id]
    pieces.push({
      id: e.id,
      title: e.title,
      composer: composers.findIndex((c) => c.name === parseComposer(e.composer).name),
      ...(e.opus && { opus: e.opus }),
      fifths: s.fifths,
      ...(keys && { keys }),
      meter: `${full.n}/${full.den}`,
      bars: s.bars.length,
      sec: Math.round(s.end * 10) / 10,
      bpm: Math.round(60 / s.spb),
      notes: s.notes.length,
      lo: s.lo,
      hi: s.hi,
      tracks: a.tracks,
      ...(a.pick && { pick: a.pick }),
      ...(a.tempo && { tempo: a.tempo }),
      ...(a.pickup !== undefined && { pickup: a.pickup }),
      grade: a.grade,
      gradeWhy: a.gradeWhy,
      ...(go && { gradeOverride: go }),
      tags: [...a.tags, ...(e.style ? [fold(e.style)] : [])],
      source: e.source,
      sourceUrl: e.sourceUrl,
      licenceEvidence: e.licenceEvidence,
      licence: licences.findIndex((l) => l.id === e.licence),
      edition: e.edition,
      ...(e.typesetter && { typesetter: e.typesetter }),
      ...(e.arranger && { arranger: e.arranger }),
      quality: a.quality,
      flags: [...a.review, ...a.flags],
      format: e.format,
      file,
      bytes: e.bytes.length,
      sha256: h,
    })
    set(e.id, 'shipped', [], a)
  }
  for (const f of readdirSync(`${out}/p`)) if (!files.has(f)) rmSync(`${out}/p/${f}`)
  // a dropped duplicate's id leads to the piece that ships instead, unless it was shipped itself (then it is the bundle's)
  const aliases = Object.fromEntries(dropped.filter((d) => !pinned.has(d.id) && pieces.some((p) => p.id === d.dupOf)).map((d) => [d.id, d.dupOf]))
  // the app refetches only when built changes, so it hashes what ships, not the inputs (the same inputs ship new files when the code changes)
  const built = sha(JSON.stringify([composers, licences, aliases, pieces])).slice(0, 16)
  const cat: Catalog = { v: 1, built, composers, licences, ...(Object.keys(aliases).length && { aliases }), pieces }
  writeFileSync(`${out}/catalog.json`, JSON.stringify(cat) + '\n')
  writeFileSync(`${out}/LICENSES.md`, licencesMd(cat))
  return [...rows.values()].sort((a, b) => idOrder(a.id, b.id))
}

function licencesMd(cat: Catalog) {
  const { composers, licences, pieces } = cat
  const credit = (p: Piece) => [SOURCE[p.source], p.typesetter && `typeset by ${p.typesetter}`, p.arranger && `arr. ${p.arranger}`, p.flags.includes('voice-folded') && 'vocal line folded into the right hand', p.flags.includes('voice-dropped') && 'voice part left out'].filter(Boolean).join(', ')
  const who = (p: Piece) => {
    const c = composers[p.composer]
    return `${c.name} (${c.born ?? ''}–${c.died})`
  }
  const cell = (s: string) => s.replace(/\|/g, '/')
  const sa = pieces.filter((p) => /-SA-/.test(licences[p.licence].id))
  return `# Licences of the score files in this folder

Generated by \`scripts/library/pipeline.ts\`. Do not edit by hand.

These files are **data**, not code. The app's source code is MIT-licensed; each score below stays under the licence shown for it. Files marked CC BY-SA must stay under that licence, including any converted or edited copy. The licence was read from each piece's own source page (or, for OpenScore, from the \`<rights>\` element of the file).

| File | Title | Composer | Licence | Source edition | Credit | Source page |
|---|---|---|---|---|---|---|
${pieces.map((p) => `| \`${p.file}\` | ${cell(p.title)} | ${cell(who(p))} | [${lname(licences[p.licence].id)}](${licences[p.licence].url}) | ${cell(p.edition)} | ${cell(credit(p))} | [source](${p.sourceUrl}) |`).join('\n')}

${sa.length ? `## Share-alike (CC BY-SA)\n\n${sa.map((p) => `- \`${p.file}\`: ${lname(licences[p.licence].id)}, ${who(p)}, ${cell(p.title)}`).join('\n')}\n\nThese must be redistributed under the same licence, with the credit above.\n\n` : ''}Mutopia pieces are provided "as is" by volunteers (https://www.mutopiaproject.org/legal.html). OpenScore Lieder files are CC0 and the project asks for a credit (https://github.com/OpenScore/Lieder).${pieces.some((p) => p.source === 'chopin') ? " The Chopin first editions are First Editions of Fryderyk Chopin's Music, Copyright 2017-2021 The Fryderyk Chopin Institute (https://nifc.pl), https://chopinscores.org, https://github.com/pl-wnifc/humdrum-chopin-first-editions, licensed CC BY 4.0; converted here from Humdrum **kern to MusicXML (src/kern.ts)." : ''}
`
}

/** The published corpus plus this run's output in `out`: every base piece, file and table row as it was (same ids, same
 * indexes), the new pieces after them with their composer and licence re-indexed into the base tables. A new id the base
 * already has is skipped. Returns the ids added. */
export function merge(base: string, out: string): string[] {
  const b: Catalog = JSON.parse(readFileSync(`${base}/catalog.json`, 'utf8'))
  const n: Catalog = JSON.parse(readFileSync(`${out}/catalog.json`, 'utf8'))
  const composers = [...b.composers]
  const licences = [...b.licences]
  const at = <T,>(list: T[], item: T, key: (x: T) => string) => {
    const i = list.findIndex((x) => key(x) === key(item))
    return i >= 0 ? i : list.push(item) - 1
  }
  const who = (c: Catalog['composers'][0]) => composerKey(c.name) + c.died // surname and death year
  const have = new Set([...b.pieces.map((p) => p.id), ...Object.keys(b.aliases ?? {})])
  const added = n.pieces
    .filter((p) => !have.has(p.id))
    .map((p) => ({ ...p, composer: at(composers, n.composers[p.composer], who), licence: at(licences, n.licences[p.licence], (l) => l.id) }))
  cpSync(`${base}/p`, `${out}/p`, { recursive: true })
  const aliases = { ...b.aliases, ...Object.fromEntries(Object.entries(n.aliases ?? {}).filter(([k]) => !have.has(k))) }
  const cat: Catalog = { v: 1, built: sha(`${b.built} ${n.built}`).slice(0, 16), composers, licences, ...(Object.keys(aliases).length && { aliases }), pieces: [...b.pieces, ...added] }
  writeFileSync(`${out}/catalog.json`, JSON.stringify(cat) + '\n')
  writeFileSync(`${out}/LICENSES.md`, licencesMd(cat))
  return added.map((p) => p.id)
}
