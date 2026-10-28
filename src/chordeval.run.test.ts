import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { annAt, chordOf, EPS, keyOf, parseRn, triad, type Cls } from './chordeval'
import { chordAt, SHAPES, TUNE } from './lead'
import { parseXml, fromMusicXml, xmlText } from './musicxml'
import { windows } from './pedal'
import type { Note, Song } from './song'

/** The evaluation run: `CHORDEVAL=1 npx vitest run src/chordeval.run.test.ts`. Reads the When in Rome corpus from .cache/chordeval/wir (git-ignored, never committed); skipped when the variable is not set. */

type Tune = typeof TUNE
// the values the Lead sheet shipped with before this evaluation: every new term off
const ORIGINAL: Tune = { missing: 0.15, seventh: 0.3, maj7: 0, m7: 0, strong: 0, root: 0, dia: 0 }
const ROOT = '.cache/chordeval/wir/Corpus'
const CORPORA = ['Piano_Sonatas', 'Keyboard_Other', 'OpenScore-LiederCorpus']
type Pred = [number, Cls] | null

interface Piece {
  id: string
  corpus: string
  comp: string
  song: Song
  nums: string[]
  anns: ReturnType<typeof parseRn>['anns']
  total: number
  skipped: number
}
interface Row {
  piece: Piece
  form: string
  truth: [number, Cls]
  alt: number
  a: number
  b: number
  notes: Note[] // those sounding in the window
  split: boolean // the analysis changes chord inside this window
  pred: Record<string, Pred>
}

const dirs = (d: string) => readdirSync(d).filter((x) => statSync(join(d, x)).isDirectory())
function* pieceDirs(d: string, depth: number): Generator<string> {
  if (existsSync(join(d, 'score.mxl')) && existsSync(join(d, 'analysis.txt'))) yield d
  else if (depth < 5) for (const x of dirs(d)) yield* pieceDirs(join(d, x), depth + 1)
}

async function load(dir: string, corpus: string): Promise<Piece | string> {
  const b = readFileSync(join(dir, 'score.mxl'))
  // a repeat or a volta played twice would be two bars for one analysed measure: read the score straight through
  const xml = (await xmlText(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer)).replace(/<repeat\b[^>]*\/>|<ending\b[^>]*\/>|<ending\b[^>]*>[^<]*<\/ending>/g, '')
  const id = dir.slice(ROOT.length + 1)
  let song: Song
  try {
    song = fromMusicXml(xml, id, id)
  } catch (e) {
    return `${id}: ${(e as Error).message}`
  }
  const part = parseXml(xml).c.find((x) => x.n === 'part')
  const nums = (part?.c.filter((x) => x.n === 'measure') ?? []).map((m) => m.a.number)
  if (nums.length !== song.bars.length) return `${id}: ${song.bars.length} bars against ${nums.length} measures`
  const rn = parseRn(readFileSync(join(dir, 'analysis.txt'), 'utf8'))
  return { id, corpus, comp: id.split('/')[1].split(',')[0], song, nums, ...rn }
}

const tonicOf = (f: number) => (((f * 7) % 12) + 12) % 12

/** Weight of the pitch classes sounding in [a, b), and whether the best of the given candidate chords fits them better: tonic or dominant, nothing else. */
function bestOf(song: Song, a: number, b: number, cands: Pred[]): Pred {
  const w = new Array<number>(12).fill(0)
  for (const n of song.notes) w[n.p % 12] += Math.max(0, Math.min(b, n.t + n.d) - Math.max(a, n.t))
  const sum = w.reduce((x, y) => x + y, 0)
  if (!sum) return null
  const set = (c: Pred) => (c![1] === 'm' ? [0, 3, 7] : [0, 4, 7]).map((i) => (c![0] + i) % 12)
  const fit = (c: Pred) => set(c).reduce((x, pc) => x + w[pc], 0)
  return cands.reduce((x, y) => (fit(y) > fit(x) ? y : x))
}

function rows(pieces: Piece[], preds: Record<string, (p: Piece, w: { bar: number; a: number; b: number }, t: { key: number; minor: boolean }) => Pred>) {
  const out: Row[] = []
  for (const piece of pieces) {
    const { song } = piece
    for (const w of windows(song)) {
      const bar = song.bars[w.bar]
      const m = parseInt(piece.nums[w.bar])
      if (!Number.isFinite(m)) continue
      const nom = (bar.n * 4) / bar.den
      const ql = bar.ql ?? nom
      const scale = ql / (bar.t1 - bar.t0)
      const q = (w.a - bar.t0) * scale + (w.bar === 0 ? nom - ql : 0)
      const q2 = (w.b - bar.t0) * scale + (w.bar === 0 ? nom - ql : 0)
      const t = annAt(piece.anns, m, q)
      if (!t || t.root < 0) continue
      const notes = song.notes.filter((n) => Math.min(w.b, n.t + n.d) - Math.max(w.a, n.t) > 0)
      out.push({
        piece,
        form: t.form,
        truth: [t.root, t.cls],
        alt: t.alt,
        a: w.a,
        b: w.b,
        notes,
        split: piece.anns.some((a) => a.m === m && a.q > q + EPS && a.q < q2 - EPS),
        pred: Object.fromEntries(Object.entries(preds).map(([k, f]) => [k, f(piece, w, t, notes)])),
      })
    }
  }
  return out
}

const lead = (t: Tune): Parameters<typeof rows>[1][string] => (p, w, _t, notes) => {
  const c = chordAt(p.song, w.a, w.b, t, notes)
  return c && [c.root, (SHAPES[c.k][0] || 'M') as Cls]
}
const BASE: Parameters<typeof rows>[1] = {
  lead: lead(TUNE),
  'lead before this evaluation': lead(ORIGINAL),
  'tonic (key signature)': (p) => [tonicOf(p.song.fifths), 'M'],
  'tonic (local key, oracle)': (_p, _w, t) => [t.key, t.minor ? 'm' : 'M'],
  'tonic/dominant, best fit (local key, oracle)': (p, w, t) =>
    bestOf(p.song, w.a, w.b, [[t.key, t.minor ? 'm' : 'M'], [(t.key + 7) % 12, 'M']]),
  'tonic then dominant by half bar (oracle)': (p, w, t) => {
    const first = Math.abs(w.a - p.song.bars[w.bar].t0) < 1e-6
    return first ? [t.key, t.minor ? 'm' : 'M'] : [(t.key + 7) % 12, 'M']
  },
}

const hit = (r: Row, k: string) => {
  const p = r.pred[k]
  return p ? { root: p[0] === r.truth[0], tri: p[0] === r.truth[0] && triad(p[1]) === triad(r.truth[1]), exact: p[0] === r.truth[0] && p[1] === r.truth[1] } : { root: false, tri: false, exact: false }
}
const pct = (x: number, n: number) => (n ? ((100 * x) / n).toFixed(1) : '-').padStart(5)

function table(title: string, rs: Row[], keys: string[], by?: (r: Row) => string) {
  const groups = new Map<string, Row[]>()
  for (const r of rs) groups.set(by ? by(r) : 'all', [...(groups.get(by ? by(r) : 'all') ?? []), r])
  const lines = [`\n## ${title}`]
  for (const [g, grs] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
    const pieces = new Set(grs.map((r) => r.piece.id)).size
    lines.push(`\n${g}: ${grs.length} windows, ${pieces} pieces`, `${'predictor'.padEnd(46)} root  triad  exact`)
    for (const k of keys) {
      const h = grs.map((r) => hit(r, k))
      lines.push(`${k.padEnd(46)} ${pct(h.filter((x) => x.root).length, h.length)}  ${pct(h.filter((x) => x.tri).length, h.length)}  ${pct(h.filter((x) => x.exact).length, h.length)}`)
    }
  }
  return lines.join('\n')
}

// a fixed shuffle of the pieces (mulberry32, seed 20261027): the first half tunes, the second is held out
export function split(ids: string[], seed = 20261027) {
  let s = seed
  const rnd = () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const a = [...ids].sort()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return { tune: new Set(a.slice(0, a.length >> 1)), held: new Set(a.slice(a.length >> 1)) }
}

async function loadAll() {
  const pieces: Piece[] = []
  const failed: string[] = []
  for (const c of CORPORA) for (const d of pieceDirs(join(ROOT, c), 0)) {
    const p = await load(d, c)
    typeof p === 'string' ? failed.push(p) : pieces.push(p)
  }
  return { pieces, failed }
}

describe.skipIf(!process.env.CHORDEVAL)('chord evaluation against When in Rome', () => {
  it('reports', async () => {
    const { pieces, failed } = await loadAll()
    const rs = rows(pieces, BASE)
    const keys = Object.keys(BASE)
    const labels = pieces.reduce((s, p) => s + p.total, 0)
    const skipped = pieces.reduce((s, p) => s + p.skipped, 0)
    const out = [
      `# Chord evaluation, ${new Date().toISOString().slice(0, 10)}`,
      `pieces read: ${pieces.length} (${failed.length} failed: ${failed.slice(0, 8).join('; ')})`,
      `chord labels: ${labels}, unsupported and skipped: ${skipped} (${((100 * skipped) / labels).toFixed(1)}%)`,
      `windows scored: ${rs.length}; with a chord change inside the window: ${rs.filter((r) => r.split).length}`,
      `a cadential 6/4 counts as the dominant it stands for; if the tonic it sounds as is also accepted, lead root goes ${pct(rs.filter((r) => hit(r, 'lead').root).length, rs.length)} -> ${pct(rs.filter((r) => hit(r, 'lead').root || r.pred.lead?.[0] === r.alt).length, rs.length)}`,
      `piece mean (each piece counts once), lead root/triad/exact: ${['root', 'tri', 'exact'].map((m) => (pieces.map((p) => { const r = rs.filter((x) => x.piece === p); return r.length ? r.filter((x) => hit(x, 'lead')[m as 'root']).length / r.length : NaN }).filter((x) => x === x).reduce((a, b, _, l) => a + b / l.length, 0) * 100).toFixed(1)).join(' / ')}`,
      table('Overall', rs, keys),
      table('Split by piece (fixed seed): tune half and held-out half', rs, keys, (r) => (split(pieces.map((p) => p.id)).tune.has(r.piece.id) ? 'tune half' : 'held-out half')),
      table('By whether the analysis changes chord inside the window', rs, keys, (r) => (r.split ? 'chord changes inside the window' : 'one chord in the window')),
      table('By corpus', rs, keys, (r) => r.piece.corpus),
      table('By composer', rs, keys, (r) => r.piece.comp),
      table('By movement (Mozart) or section (the rest)', rs, keys, (r) => (r.piece.corpus === 'Piano_Sonatas' ? `Mozart movement ${r.piece.id.split('/').pop()}` : r.form || '(none)')),
    ]
    writeFileSync('.cache/chordeval/report.txt', out.join('\n'))
    console.log(out.join('\n'))
    expect(pieces.length).toBeGreaterThanOrEqual(30)
  }, 900_000)
})

// The reader checked against the DCML tables the Mozart analyses came from (their `root` is already absolute-in-key, in fifths): same root at the same moment?
describe.skipIf(!process.env.CHORDEVAL || !existsSync('.cache/chordeval/dcml-mozart/harmonies'))('Roman-numeral reader against DCML Mozart harmonies', () => {
  it('agrees', () => {
    const TYPE: Record<string, Cls> = { M: 'M', m: 'm', o: 'dim', o7: 'dim', '%7': 'dim', '+': 'aug', Mm7: '7', mm7: 'm7', MM7: 'maj7' }
    let n = 0
    let root = 0
    let cls = 0
    const bad: string[] = []
    for (const dir of [...pieceDirs(join(ROOT, 'Piano_Sonatas'), 0)]) {
      const [, , k, mv] = dir.slice(ROOT.length + 1).split('/')
      const f = `.cache/chordeval/dcml-mozart/harmonies/${k}-${mv}.harmonies.tsv`
      if (!existsSync(f)) continue
      const { anns } = parseRn(readFileSync(join(dir, 'analysis.txt'), 'utf8'))
      const [head, ...lines] = readFileSync(f, 'utf8').trim().split('\n').map((l) => l.split('\t'))
      const col = (r: string[], c: string) => r[head.indexOf(c)]
      for (const r of lines) {
        const g = keyOf(col(r, 'globalkey') + ':')
        const loc = g && chordOf(col(r, 'localkey'), g[0], g[1])
        const cl = TYPE[col(r, 'chord_type')]
        if (!g || !loc || !cl) continue
        const [a, b] = col(r, 'mn_onset').split('/').map(Number)
        const x = annAt(anns, +col(r, 'mn'), (4 * a) / (b || 1))
        const want = (loc[0] + 7 * +col(r, 'root') + 1200) % 12
        n++
        if (x?.root === want) {
          root++
          if (x.cls === cl) cls++
        } else if (bad.length < 12) bad.push(`${k}-${mv} m${col(r, 'mn')} ${col(r, 'label')} (${col(r, 'localkey')} in ${col(r, 'globalkey')}): reader ${x?.root}, DCML ${want}`)
      }
    }
    console.log(`DCML check: ${n} rows, root agrees ${((100 * root) / n).toFixed(1)}%, class agrees ${((100 * cls) / n).toFixed(1)}%\n${bad.join('\n')}`)
    writeFileSync('.cache/chordeval/dcml-check.txt', `${n} rows, root ${root}, class ${cls}\n${bad.join('\n')}`)
    expect(root / n).toBeGreaterThan(0.9)
  })
})

const acc = (rs: Row[], t: Tune) => {
  let root = 0
  let tri = 0
  let exact = 0
  for (const r of rs) {
    const c = chordAt(r.piece.song, r.a, r.b, t, r.notes)
    if (!c || c.root !== r.truth[0]) continue
    const cls = (SHAPES[c.k][0] || 'M') as Cls
    root++
    if (triad(cls) === triad(r.truth[1])) tri++
    if (cls === r.truth[1]) exact++
  }
  const n = rs.length
  return { root: (100 * root) / n, tri: (100 * tri) / n, exact: (100 * exact) / n }
}
const fmt = (x: { root: number; tri: number; exact: number }) => `${x.root.toFixed(1)} / ${x.tri.toFixed(1)} / ${x.exact.toFixed(1)}`
const J = (x: { root: number; exact: number }) => (x.root + x.exact) / 2

// Tuning by piece: the search sees only the tune half; the held-out half is read once per candidate for the table, never to choose.
const GRID: Record<keyof Tune, number[]> = {
  seventh: [0.05, 0.1, 0.2, 0.3, 0.4],
  missing: [0, 0.15, 0.4, 0.7],
  strong: [0, 0.5, 1, 2, 3, 5],
  root: [0, 0.05, 0.1, 0.2, 0.3, 0.45, 0.6],
  dia: [0, 0.05, 0.1, 0.2, 0.3],
  maj7: [0, 0.15, 0.3], // a clean major seventh chord must still beat its triad: seventh + maj7 stays under 0.5
  m7: [0, 0.15, 0.3],
}
const KEYS = Object.keys(GRID) as (keyof Tune)[]
const tuneOn = (T: Row[], t: Tune, ks = KEYS) => {
  for (const k of ks) t = { ...t, [k]: GRID[k].map((v) => ({ v, j: J(acc(T, { ...t, [k]: v })) })).sort((a, b) => b.j - a.j)[0].v }
  return t
}
/** Coordinate search on `T`, then backward elimination: drop the term whose loss on T is smallest while it costs under 0.3 points, search the rest again. */
function search(T: Row[]) {
  let t = ORIGINAL
  for (let round = 0; round < 3; round++) t = tuneOn(T, t)
  const on = (x: Tune) => KEYS.filter((k) => x[k] !== ORIGINAL[k])
  for (;;) {
    const base = J(acc(T, t))
    const tries = on(t).map((k) => ({ k, loss: base - J(acc(T, { ...t, [k]: ORIGINAL[k] })) })).sort((a, b) => a.loss - b.loss)
    if (!tries.length || tries[0].loss >= 0.3) return t
    t = tuneOn(T, { ...t, [tries[0].k]: ORIGINAL[tries[0].k] }, on({ ...t, [tries[0].k]: ORIGINAL[tries[0].k] }))
  }
}

// Tuning by piece: the search sees only its own half; the other half is read afterwards, never to choose.
describe.skipIf(!process.env.CHORDTUNE)('tune the chord match', () => {
  it('searches', async () => {
    const { pieces } = await loadAll()
    const { tune, held } = split(pieces.map((p) => p.id))
    const rs = rows(pieces, {})
    const T = rs.filter((r) => tune.has(r.piece.id))
    const H = rs.filter((r) => held.has(r.piece.id))
    const out = [`pieces ${pieces.length}: tune ${tune.size} (${T.length} windows), held out ${held.size} (${H.length} windows). root / triad / exact`, `start    tune ${fmt(acc(T, ORIGINAL))}   held ${fmt(acc(H, ORIGINAL))}`, '\none term at a time, best value on the tune half, the rest as shipped:']
    for (const k of KEYS) {
      const best = GRID[k].map((v) => ({ v, x: acc(T, { ...ORIGINAL, [k]: v }) })).sort((a, b) => J(b.x) - J(a.x))[0]
      out.push(`${k.padEnd(8)} ${String(best.v).padEnd(5)} tune ${fmt(best.x)}   held ${fmt(acc(H, { ...ORIGINAL, [k]: best.v }))}`)
    }
    const t = search(T)
    out.push(`\nsearched on the tune half: ${JSON.stringify(t)}`, `tune ${fmt(acc(T, t))}   held ${fmt(acc(H, t))}`, '\ntake one term out of that (held-out):')
    for (const k of KEYS.filter((x) => t[x] !== ORIGINAL[x])) out.push(`without ${k.padEnd(8)} tune ${fmt(acc(T, { ...t, [k]: ORIGINAL[k] }))}   held ${fmt(acc(H, { ...t, [k]: ORIGINAL[k] }))}`)
    const u = search(H)
    out.push(`\nthe other way round (search on the held-out half): ${JSON.stringify(u)}`, `searched half ${fmt(acc(H, u))}   other half ${fmt(acc(T, u))}   (that half with the shipped values: ${fmt(acc(T, ORIGINAL))})`)
    // the Mozart analyses are CC BY-NC-SA (DCML): the same search without them, read on the other pieces of the held-out half
    const free = (r: Row) => r.piece.corpus !== 'Piano_Sonatas'
    const f = search(T.filter(free))
    out.push(`\nsearched without the Mozart pieces (CC BY-NC-SA): ${JSON.stringify(f)}`, `held-out half without Mozart: ${fmt(acc(H.filter(free), f))}   with the shipped values: ${fmt(acc(H.filter(free), t))}   before: ${fmt(acc(H.filter(free), ORIGINAL))}`)
    const conf = new Map<string, number>()
    const rel = new Map<number, number>()
    for (const r of H) {
      const c = chordAt(r.piece.song, r.a, r.b, t, r.notes)
      const key = `${r.truth[1]} -> ${c ? SHAPES[c.k][0] || 'M' : 'silence'}`
      if (c && c.root === r.truth[0]) conf.set(key, (conf.get(key) ?? 0) + 1)
      else if (c) rel.set((c.root - r.truth[0] + 12) % 12, (rel.get((c.root - r.truth[0] + 12) % 12) ?? 0) + 1)
    }
    out.push('\nheld-out with the searched values, root right: truth -> predicted class', ...[...conf].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `  ${k}: ${v}`))
    out.push('held-out, root wrong: predicted root minus true root (semitones): ' + [...rel].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' '))
    const truthN = new Map<string, number>()
    for (const r of rs) truthN.set(r.truth[1], (truthN.get(r.truth[1]) ?? 0) + 1)
    out.push('truth classes, all windows: ' + [...truthN].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${((100 * v) / rs.length).toFixed(1)}%`).join(', '))
    writeFileSync('.cache/chordeval/tune.txt', out.join('\n'))
    expect(out.length).toBeGreaterThan(3)
  }, 1_800_000)
})
