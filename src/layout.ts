// Pure staff layout: the notation layer (bar, qb, qd, voice, ties, tuplets, graces) in, placed glyph descriptions out.
// No DOM. staff.ts paints the result; everything that can collide or clip is decided here and tested in layout.test.ts.
import { tiedSegments } from './quantize'
import type { Note, Song } from './song'
import { BOTTOM_STEP, clefFor, keyAcc, keySigSteps, spell, type Spelled } from './spell'

export type Clef = 'treble' | 'bass'
export const S = 10 // one staff space, viewBox units
export const GRAND = { h: 166, base: { treble: 64, bass: 134 } } // 166 leaves room for stems below the bass staff
export const SOLO = { h: 104, base: { treble: 72, bass: 72 } }
export const GAP = 26 // between systems in sheet view
export const MID_STEP = { treble: 34, bass: 22 } // B4, D3: the middle line of each clef
export const MIN_GAP = 14 // least distance between two onset columns
const TOP_STEP = { treble: BOTTOM_STEP.treble + 8, bass: BOTTOM_STEP.bass + 8 }
const HEAD = 5.9 // half a notehead
const SECOND = 11.4 // a displaced second
const LEDGER_MAX = 3 // more ledger lines than this and the passage goes under an 8va / 8vb
const LEDGER_CLAMP = 7 // never draw further out than this, whatever the pitch
const SQUEEZE = 0.65 // a dense bar may shrink its gaps to this share before it is called too dense
const COMFORT = 1.15 // gaps wanted when deciding how many bars share a system
const ZOOMS = [1, 1.2, 1.45, 1.75] // sheet pages shrink the glyphs this much before a bar is called too dense
const near = (a: number, b: number, e = 0.02) => Math.abs(a - b) < e
const qk = (q: number) => Math.round(q * 48)
const barQ = (b: { n: number; den: number; ql?: number }) => b.ql ?? (b.n * 4) / b.den

// ---- written values ----

interface Fig {
  head: 0 | 1 | 2 // whole, half, black
  dots: number
  flags: number
}
const f = (head: 0 | 1 | 2, dots: number, flags: number): Fig => ({ head, dots, flags })
const FIGS: [number, Fig][] = [
  [4, f(0, 0, 0)], [3.5, f(1, 2, 0)], [3, f(1, 1, 0)], [2, f(1, 0, 0)], [1.75, f(2, 2, 0)], [1.5, f(2, 1, 0)], [1, f(2, 0, 0)],
  [0.75, f(2, 1, 1)], [0.5, f(2, 0, 1)], [0.375, f(2, 1, 2)], [0.25, f(2, 0, 2)], [0.1875, f(2, 1, 3)], [0.125, f(2, 0, 3)],
]
/** A tuplet as written, '5:4'; '' for none; true is a triplet. */
type Tup = boolean | string
const ratio = (t: Tup) => (t === true ? 1.5 : t ? Number(t.split(':')[0]) / Number(t.split(':')[1]) : 1)
/** A value in sounding quarters as a notehead: a triplet 8th (1/3) is written as an 8th, a quintuplet 16th (1/5) as a 16th. */
export function figure(v: number, tup: Tup = false): Fig {
  const w = v * ratio(tup)
  return FIGS.reduce((a, b) => (Math.abs(Math.log(b[0] / w)) < Math.abs(Math.log(a[0] / w)) ? b : a))[1]
}
const isStd = (v: number, tup: Tup) => FIGS.some(([x]) => Math.abs(x - v * ratio(tup)) < 0.02 * x + 1e-6)
const STD = FIGS.map(([x]) => x).sort((a, b) => a - b)

/** A value that is not a notehead (5/2 quarters) as tied pieces that break at the beat. */
export function splitValue(q: number, v: number, tup: Tup): { q: number; v: number }[] {
  if (tup || isStd(v, false)) return [{ q, v }]
  const out: { q: number; v: number }[] = []
  let pos = q
  let left = v
  while (left > 0.06) {
    const toBeat = Math.ceil(pos - 1e-6) - pos
    const cap = toBeat > 0.02 && left > toBeat + 0.06 ? toBeat : left
    const w = STD.filter((x) => x <= cap + 0.02).pop()
    if (!w) break
    out.push({ q: pos, v: w })
    pos += w
    left -= w
  }
  return out.length ? out : [{ q, v }]
}

const REST_PLAIN = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.375, 0.25, 0.125]
const REST_TRIP = [4 / 3, 2 / 3, 1 / 3, 1 / 6]
/** A silence of `g` quarters at `q` as rests that start on their own grid. */
export function restPieces(q: number, g: number): { q: number; v: number; tup: boolean }[] {
  const tup = ![q, g].every((x) => near(x * 8, Math.round(x * 8), 0.04))
  const set = tup ? REST_TRIP : REST_PLAIN
  const out: { q: number; v: number; tup: boolean }[] = []
  let pos = q
  let left = g
  while (left > 0.06) {
    const fit = set.filter((v) => v <= left + 0.02)
    const v = fit.find((x) => pos % x < 0.02 || x - (pos % x) < 0.02) ?? fit[fit.length - 1]
    if (!v) break
    out.push({ q: pos, v, tup })
    pos += v
    left -= v
  }
  return out
}

/** Where eighths may beam together, in quarters from the start of a full bar. */
export function beamBounds(n: number, den: number): number[] {
  if (den >= 8 && n % 3 === 0) {
    if (n === 3) return [0]
    const g = den === 8 ? 1.5 : 0.75
    return Array.from({ length: n / 3 }, (_, i) => i * g)
  }
  if (den === 8 && n === 5) return [0, 1.5]
  if (den === 8 && n === 7) return [0, 1, 2]
  const beat = den >= 8 ? 4 / den : 1
  return Array.from({ length: Math.ceil(((n * 4) / den) / beat - 1e-9) }, (_, i) => i * beat)
}

// ---- analysis: what is written, per bar, with no x ----

interface CNote {
  ids: number[]
  p: number
  sp: Spelled
  tiePrev: boolean
  tieNext: boolean
  glyph?: 'sharp' | 'flat' | 'natural'
  accCol: number
}
export interface Chord {
  clef: Clef
  lane: 1 | 2
  bar: number
  q: number
  v: number
  tup: string
  grace: boolean
  cont: boolean // a tied continuation, not the played note
  notes: CNote[] // ascending by step
  t: number // seconds, when its sound starts
  want?: number
  fig: Fig
  beam?: Beam
  ci: number // index into BarA.cols
  seconds: boolean
  accCols: number
}
export interface Rest {
  clef: Clef
  bar: number
  q: number
  v: number
  tup: string
}
export interface Beam {
  clef: Clef
  lane: 1 | 2
  bar: number
  chords: Chord[]
}
export interface Tuplet {
  clef: Clef
  lane: 1 | 2
  bar: number
  items: (Chord | Rest)[]
}
interface Col {
  q: number
  L: number // room left of the column (heads, accidentals, graces)
  R: number
  gw: number // of L, what graces take
  virtual?: boolean
}
export interface BarA {
  i: number
  ql: number
  n: number
  den: number
  fifths: number
  cols: Col[]
  r: number[] // least distance from the previous column
  minA: number // least room between the barline and the first column
  half: number // half a beat in quarters: the air a barline gets at 'sparse' spacing
  chords: Chord[]
  rests: Rest[]
  barRest: Record<Clef, boolean> // the staff is silent: a whole-bar rest, if the staff is in use
  two: Record<Clef, boolean> // two voices in this staff
  beams: Beam[]
  tuplets: Tuplet[]
}
export interface Analysis {
  song: Song
  bars: BarA[]
  clefs: Clef[]
  solo: boolean
  read: boolean
  pad: number // drills: margin inside a bar
  pages: Map<string, Page[]>
}

interface Inst {
  n: Note
  clef: Clef
  bar: number
  q: number
  v: number
  tup: string
  tiePrev: boolean
  tieNext: boolean
  cont: boolean
  grace: boolean
  t: number
}

const keyAt = (song: Song, bar: number) => {
  let x = song.keys?.length ? song.keys[0].fifths : song.fifths
  for (const k of song.keys ?? []) if (k.bar <= bar) x = k.fifths
  return x
}

function instances(n: Note, song: Song, qls: number[], only?: Clef): Inst[] {
  const b = song.bars[n.bar]
  const clef = only ?? clefFor(n.p, n.h) // a one-staff layout writes every note on it
  const q0 = n.qb ?? ((n.t - b.t0) / Math.max(b.t1 - b.t0, 1e-6)) * qls[n.bar]
  const base = { n, clef, tup: '', tiePrev: false, tieNext: false, cont: false, grace: false }
  if (n.grace) return [{ ...base, bar: n.bar, q: q0, v: 0.125, grace: true, t: n.t }]
  const qd = n.qd ?? Math.max(n.beats, 0.125)
  const segs = tiedSegments({ bar: n.bar, qb: q0, qd, qrest: n.qrest, tieNext: n.tieNext, voice: n.voice ?? 1 }, qls)
  const out: Inst[] = []
  segs.forEach((s, k) => {
    const tup = n.tuplet && k === 0 ? `${n.tuplet.num}:${n.tuplet.den}` : ''
    const ps = splitValue(s.qb, s.qd, tup)
    ps.forEach((p, m) => {
      const cont = s.tiePrev || m > 0
      const bb = song.bars[s.bar]
      out.push({
        ...base,
        bar: s.bar,
        q: p.q,
        v: p.v,
        tup,
        cont,
        tiePrev: cont,
        tieNext: m < ps.length - 1 || s.tieNext,
        t: cont ? bb.t0 + (p.q / qls[s.bar]) * (bb.t1 - bb.t0) : n.t,
      })
    })
  })
  return out
}

const meanP = (g: Inst[]) => g.reduce((s, x) => s + x.n.p, 0) / g.length

/** One staff, one onset: split what sounds there into the upper and the lower voice. */
function lanes(list: Inst[]): [Inst[], Inst[]] {
  const by = new Map<string, Inst[]>()
  for (const x of list) {
    const k = `${x.n.h}${x.n.voice ?? 1}`
    by.set(k, [...(by.get(k) ?? []), x])
  }
  const l1: Inst[][] = []
  const l2: Inst[][] = []
  for (const g of [...by.values()].sort((a, b) => meanP(b) - meanP(a))) {
    if ((g[0].n.voice ?? 1) === 2) l2.push(g)
    else if (!l1.length || (near(l1[0][0].v, g[0].v) && l1[0][0].tup === g[0].tup)) l1.push(g)
    else l2.push(g)
  }
  return [l1.flat(), l2.flat()]
}

function mkChord(list: Inst[], lane: 1 | 2, fifths: number): Chord {
  const by = new Map<number, CNote>()
  for (const x of list) {
    const c = by.get(x.n.p)
    if (c) {
      c.ids.push(x.n.id)
      c.tiePrev ||= x.tiePrev
      c.tieNext ||= x.tieNext
    } else by.set(x.n.p, { ids: [x.n.id], p: x.n.p, sp: spell(x.n.p, x.n.flat ? -2 : fifths, x.n.acc), tiePrev: x.tiePrev, tieNext: x.tieNext, accCol: 0 })
  }
  const notes = [...by.values()].sort((a, b) => a.sp.step - b.sp.step || a.p - b.p)
  const x0 = list[0]
  const v = Math.min(...list.map((x) => x.v))
  return {
    clef: x0.clef,
    lane,
    bar: x0.bar,
    q: x0.q,
    v,
    tup: x0.tup,
    grace: x0.grace,
    cont: list.every((x) => x.cont),
    notes,
    t: Math.min(...list.map((x) => x.t)),
    want: list.find((x) => x.n.want)?.n.want?.[0],
    fig: figure(v, x0.tup),
    ci: 0,
    seconds: notes.some((n, i) => i > 0 && n.sp.step - notes[i - 1].sp.step <= 1),
    accCols: 0,
  }
}

export function analyze(song: Song, o: { read?: boolean; hide?: (n: Note) => boolean } = {}): Analysis {
  const read = !!o.read
  const qls = song.bars.map(barQ)
  const used = new Set(song.notes.map((n) => clefFor(n.p, n.h)))
  // a one-hand song (a single melody, an import with one track) gets one big staff instead of a grand staff half empty
  const share = (c: Clef) => song.notes.filter((n) => clefFor(n.p, n.h) === c).length / Math.max(1, song.notes.length)
  const lead: Clef = share('treble') >= share('bass') ? 'treble' : 'bass'
  const solo = (read && used.size === 1) || (!read && song.notes.length >= 8 && share(lead) >= 0.97)
  const clefs: Clef[] = solo ? [read ? [...used][0] : lead] : ['treble', 'bass']
  const withRests = !read && song.artic !== 'staccato'
  const bars: BarA[] = song.bars.map((b, i) => ({
    i,
    ql: qls[i],
    n: b.n,
    den: b.den,
    fifths: keyAt(song, i),
    cols: [],
    r: [],
    minA: 9,
    half: (4 / b.den) / 2,
    chords: [],
    rests: [],
    barRest: { treble: false, bass: false },
    two: { treble: false, bass: false },
    beams: [],
    tuplets: [],
  }))
  const per: Inst[][] = bars.map(() => [])
  for (const n of song.notes) if (!o.hide?.(n)) for (const x of instances(n, song, qls, solo ? clefs[0] : undefined)) if (per[x.bar]) per[x.bar].push(x)

  for (const B of bars) {
    const nominal = (B.n * 4) / B.den
    const phase = Math.max(0, nominal - B.ql) // a pickup is the end of a bar: beams count from where the bar would have begun
    const ka = keyAcc(B.fifths)
    for (const clef of clefs) {
      const mine = per[B.i].filter((x) => x.clef === clef)
      // chords: one onset, one voice
      const at = new Map<string, Inst[]>()
      for (const x of mine) {
        const k = x.grace ? `g${Math.round(x.t * 50)}` : String(qk(x.q))
        at.set(k, [...(at.get(k) ?? []), x])
      }
      const l1: Chord[] = []
      const l2: Chord[] = []
      const graces: Chord[] = []
      for (const list of at.values()) {
        if (list[0].grace) {
          graces.push(mkChord(list, 1, B.fifths))
          continue
        }
        const [a, b] = lanes(list)
        const c1 = a.length ? mkChord(a, 1, B.fifths) : undefined
        const c2 = b.length ? mkChord(b, 2, B.fifths) : undefined
        if (c1 && c2) {
          // the same pitch in both voices is one notehead
          c2.notes = c2.notes.filter((n) => {
            const twin = c1.notes.find((m) => m.p === n.p)
            if (twin) twin.ids.push(...n.ids)
            return !twin
          })
          c1.seconds = c1.notes.some((n, i) => i > 0 && n.sp.step - c1.notes[i - 1].sp.step <= 1)
        }
        if (c1) l1.push(c1)
        if (c2?.notes.length) (c1 ? l2 : l1).push(c1 ? c2 : { ...c2, lane: 1 })
      }
      const byQ = (a: Chord, b: Chord) => a.q - b.q
      l1.sort(byQ)
      l2.sort(byQ)
      graces.sort((a, b) => a.t - b.t)
      for (const g of graces) {
        // a grace note leads into the next written onset of its staff
        g.q = [...l1, ...l2].filter((c) => c.q >= g.q - 0.02).sort(byQ)[0]?.q ?? g.q
      }
      B.two[clef] = !!l1.length && !!l2.length

      // silences in the upper voice; a short one after a note is articulation, so the note takes it
      let pos = 0
      let prev: Chord | undefined
      const gap = (g0: number, g: number, next?: Chord) => {
        if (prev && g <= 0.26 && !prev.tup && isStd(prev.v + g, false)) {
          prev.v += g
          prev.fig = figure(prev.v)
        } else if (withRests) {
          if (!prev?.tup && !next?.tup) {
            // a silence outside a triplet is written on the eighth-of-a-quarter grid: an off-grid edge is the player's, not the composer's
            const a = Math.round(g0 * 8) / 8
            const e = Math.round((g0 + g) * 8) / 8
            g0 = a
            g = e - a
          }
          for (const r of restPieces(g0, g)) B.rests.push({ clef, bar: B.i, q: r.q, v: r.v, tup: r.tup ? '3:2' : '' })
        }
      }
      if (!l1.length) B.barRest[clef] = true
      else {
        for (const c of l1) {
          if (c.q > pos + 0.04) gap(pos, c.q - pos, c)
          pos = Math.max(pos, c.q + c.v)
          prev = c
        }
        if (B.ql - pos > 0.04) gap(pos, B.ql - pos)
      }

      // beams: runs of flagged notes in one voice and one beat group, with no silence between
      const bounds = beamBounds(B.n, B.den)
      const grp = (q: number) => bounds.reduce((g, b, k) => (q + phase >= b - 0.01 ? k : g), 0)
      for (const lane of [l1, l2]) {
        let run: Chord[] = []
        const flush = () => {
          if (run.length > 1) {
            const beam: Beam = { clef, lane: run[0].lane, bar: B.i, chords: run }
            for (const c of run) c.beam = beam
            B.beams.push(beam)
          }
          run = []
        }
        for (const c of lane) {
          const last = run[run.length - 1]
          if (c.fig.flags === 0 || (last && (grp(last.q) !== grp(c.q) || !near(last.q + last.v, c.q, 0.03)))) flush()
          if (c.fig.flags > 0) run.push(c)
        }
        flush()
      }

      // tuplets: complete groups of triplet notes and rests within one voice
      for (const lane of [1, 2] as const) {
        const items: (Chord | Rest)[] = [...(lane === 1 ? l1 : l2), ...(lane === 1 ? B.rests.filter((r) => r.clef === clef) : [])].sort((a, b) => a.q - b.q)
        const done = new Set<Chord | Rest>()
        for (const it of items) {
          if (!it.tup || done.has(it)) continue
          for (const G of [0.5, 1, 1.5, 2, 3, 4]) {
            const gs = Math.floor((it.q + 0.01) / G) * G
            const grp = items.filter((x) => x.q > gs - 0.02 && x.q < gs + G - 0.02)
            const tiles = grp.every((x, k) => x.tup && (k === 0 ? near(x.q, gs) : near(x.q, grp[k - 1].q + grp[k - 1].v)))
            const last = grp[grp.length - 1]
            if (grp.length > 1 && tiles && near(last.q + last.v, gs + G)) {
              B.tuplets.push({ clef, lane, bar: B.i, items: grp })
              for (const x of grp) done.add(x)
              break
            }
          }
        }
      }

      // accidentals in force, time order, graces first; ties carry their pitch
      const inForce = new Map<number, number>()
      for (const c of [...graces, ...l1, ...l2].sort((a, b) => a.q - b.q || +b.grace - +a.grace)) {
        const lastStep: number[] = []
        for (const n of [...c.notes].reverse()) {
          const cur = inForce.get(n.sp.step) ?? ka[n.sp.letter]
          if (n.tiePrev || n.sp.acc === cur) continue
          n.glyph = n.sp.acc > 0 ? 'sharp' : n.sp.acc < 0 ? 'flat' : 'natural'
          inForce.set(n.sp.step, n.sp.acc)
          let k = lastStep.findIndex((s) => s - n.sp.step >= 6)
          if (k < 0) k = lastStep.length
          lastStep[k] = n.sp.step
          n.accCol = k
        }
        c.accCols = lastStep.length
      }
      B.chords.push(...graces, ...l1, ...l2)
    }

    // columns: every onset of both staves, with the room its glyphs ask for
    const cols = new Map<number, Col>()
    const col = (q: number) => {
      const k = qk(q)
      if (!cols.has(k)) cols.set(k, { q, L: HEAD, R: HEAD, gw: 0 })
      return cols.get(k)!
    }
    for (const c of B.chords) {
      const k = col(c.q)
      if (c.grace) {
        const w = 9 + (c.notes.some((n) => n.glyph) ? 6 : 0)
        k.L += w
        k.gw += w
        continue
      }
      let L = HEAD
      if (c.accCols) L = 20 + (c.accCols - 1) * 8 + (c.seconds ? SECOND : 0)
      else if (c.seconds) L = HEAD + SECOND
      let R = c.seconds ? HEAD + SECOND : HEAD
      if (c.fig.dots) R = Math.max(R, (c.seconds ? SECOND : 0) + 10 + c.fig.dots * 4.5 + 1)
      if (c.fig.flags && !c.beam && c.fig.head !== 0) R = Math.max(R, 16.5)
      k.L = Math.max(k.L - k.gw, L) + k.gw
      k.R = Math.max(k.R, R)
    }
    for (const r of B.rests) {
      const k = col(r.q)
      k.L = Math.max(k.L, 7.5)
      k.R = Math.max(k.R, 7.5)
    }
    B.cols = [...cols.values()].sort((a, b) => a.q - b.q)
    if (!B.cols.length || B.cols[0].q > 0.02) B.cols.unshift({ q: 0, L: 0, R: 0, gw: 0, virtual: true })
    for (const c of B.chords) c.ci = B.cols.findIndex((k) => near(k.q, c.q, 0.011))
    B.r = B.cols.map((k, i) => (i === 0 ? 0 : B.cols[i - 1].virtual ? 0 : Math.max(MIN_GAP, B.cols[i - 1].R + k.L + 1.5)))
    B.minA = B.cols[0].virtual ? 9 : Math.max(9, B.cols[0].L + 3)
  }

  // drills: an accidental needs room to its left, so a set with any gets wider margins
  const ka0 = keyAcc(song.fifths)
  const signs = song.notes.some((n) => {
    const sp = spell(n.p, n.flat ? -2 : song.fifths, n.acc)
    return sp.acc !== ka0[sp.letter]
  })
  return { song, bars, clefs, solo, read, pad: read && signs ? 30 : 14, pages: new Map() }
}

// ---- horizontal: the time-to-x map ----

interface SysX {
  X: number[][] // x of every column, per bar, from the system's left edge
  bl: number[] // barline x per bar start, plus the closing one
  u: number // x per quarter in sparse stretches
  s: number // share of the minimum gaps in use
  E: number[]
  squash: number // < 1 when even the narrowest gaps overflowed and everything was pressed together
}

/** Positions for given spacing: u per quarter, gaps never below s times their minimum, with extra room `ex` at a bar's start. */
function positions(bs: BarA[], ex: number[], u: number, s: number): { X: number[][]; bl: number[]; E: number[] } {
  const a = (j: number) => Math.max(u * bs[j].half, bs[j].minA * s) + ex[j]
  const a0 = a(0)
  let x = a0
  const X: number[][] = []
  const bl = [0]
  const E: number[] = [] // where each bar's time ends: the next bar's first column
  bs.forEach((B, j) => {
    const xs: number[] = []
    B.cols.forEach((c, i) => {
      if (i > 0) x += Math.max(B.r[i] * s, u * (c.q - B.cols[i - 1].q))
      xs.push(x)
    })
    X.push(xs)
    const last = B.cols[B.cols.length - 1]
    const aN = j + 1 < bs.length ? a(j + 1) : Math.max(u * B.half, 9 * s)
    x += Math.max(u * (B.ql - last.q), (last.R + 4) * s + aN)
    E.push(x)
    bl.push(x - aN)
  })
  return { X, bl, E }
}

function solveX(bs: BarA[], ex: number[], avail: number): SysX {
  const end = (u: number, s: number) => positions(bs, ex, u, s).bl[bs.length]
  let u = 0
  let s = 1
  let squash = 1
  if (end(0, 1) > avail) {
    // even bare minimum gaps overflow: shrink them, down to a floor
    if (end(0, SQUEEZE) > avail) {
      s = SQUEEZE
      squash = avail / end(0, SQUEEZE)
    } else {
      let lo = SQUEEZE
      let hi = 1
      for (let k = 0; k < 24; k++) {
        const m = (lo + hi) / 2
        if (end(0, m) > avail) hi = m
        else lo = m
      }
      s = lo
    }
  } else {
    let lo = 0
    let hi = 8
    while (end(hi, 1) < avail && hi < 4096) hi *= 2
    for (let k = 0; k < 30; k++) {
      const m = (lo + hi) / 2
      if (end(m, 1) > avail) hi = m
      else lo = m
    }
    u = lo
  }
  const p = positions(bs, ex, u, s)
  if (squash < 1) {
    p.X = p.X.map((r) => r.map((x) => x * squash))
    p.bl = p.bl.map((x) => x * squash)
    p.E = p.E.map((x) => x * squash)
  }
  return { ...p, u, s, squash }
}

// ---- windows: which bars share a page ----

export interface Cfg {
  view: 'sheet' | 'both'
  px: { w: number; h: number } // the host in pixels
  zoom?: number // 1 is the default size; below 1 the staff draws smaller, so more bars and more lines fit; above it the page fills the host at most
}
export interface Win {
  from: number
  to: number
  systems: { from: number; to: number }[]
  z: number // sheet pages: glyph shrink
  nominal: number // sheet pages: viewBox height before content makes it taller
  follow: boolean // 'both': the window starts at the bar being played
}
interface Page {
  from: number
  to: number
  z: number
  systems: { from: number; to: number }[]
}

const sigChanged = (a: BarA, b: BarA) => a.n !== b.n || a.den !== b.den
const keyChange = (p: number, n: number) => {
  // cancel the sharps or flats that stop with naturals, then the new signature in full
  const flip = Math.sign(p) !== Math.sign(n)
  return { nat: p === 0 ? 0 : flip ? Math.abs(p) : Math.max(0, Math.abs(p) - Math.abs(n)), first: flip ? 0 : Math.abs(n), n: Math.abs(n) }
}
const exOf = (an: Analysis, i: number) => {
  const B = an.bars[i]
  const P = an.bars[i - 1]
  let w = 0
  if (P.fifths !== B.fifths) {
    const k = keyChange(P.fifths, B.fifths)
    w += (k.nat + k.n) * 9 + 6
  }
  if (sigChanged(P, B)) w += 24
  return w
}
const headerW = (an: Analysis, from: number) => 14 + 40 + Math.abs(an.bars[from].fifths) * 9 + (from === 0 || sigChanged(an.bars[from - 1], an.bars[from]) ? 26 : 8)

/** Width of bars [from, to) at spacing u and gap share s, with the system's own header. */
function widthOf(an: Analysis, from: number, to: number, u: number, s: number) {
  const bs = an.bars.slice(from, to)
  return positions(bs, bs.map((_, j) => (j ? exOf(an, from + j) : 0)), u, s).bl[bs.length]
}

const sysCount = (cfg: Cfg) => (cfg.view === 'sheet' && cfg.px.h / (GRAND.h * 2 + GAP) >= 1.7 ? 2 : 1)
const nominalH = (cfg: Cfg, sys: number) => (sys === 2 ? GRAND.h * 2 + GAP : Math.max(GRAND.h, cfg.px.h / 2.6))

/** Pixels per viewBox unit below which the staff is too small to read, however far the player zooms out: a staff space is 10 units. */
const MIN_PX = 1
/** The zoom, but never past the point where the staff drops under MIN_PX: `vb` is the page height at zoom 1. */
const zoomFor = (cfg: Cfg, vb: number) => Math.max(cfg.zoom ?? 1, Math.min(1, (vb * MIN_PX) / Math.max(cfg.px.h, 1)))

/** A sheet page's height in viewBox units and how many lines fit in it, once the player's zoom is applied: a second line appears when two fit, and goes when they no longer do. */
function sheetBox(cfg: Cfg) {
  const sys0 = sysCount(cfg)
  const zoom = zoomFor(cfg, nominalH(cfg, sys0))
  const H = Math.max(GRAND.h, nominalH(cfg, sys0) / zoom)
  return { H, zoom, n: zoom === 1 ? sys0 : Math.max(1, Math.floor((H + GAP) / (GRAND.h + GAP))) }
}

function sheetPages(an: Analysis, cfg: Cfg): Page[] {
  const key = `${cfg.px.w}x${cfg.px.h}x${cfg.zoom ?? 1}` // the zoom as asked: sheetBox applies the floor
  const hit = an.pages.get(key)
  if (hit) return hit
  const { H, n: sys, zoom } = sheetBox(cfg)
  const most = Math.min(8, Math.max(4, Math.round(4 / zoom))) // bars to a line: four on the default page, up to eight zoomed out
  const nb = an.bars.length
  const aspect = cfg.px.w / Math.max(cfg.px.h, 1)
  const pages: Page[] = []
  for (let b = 0; b < nb; ) {
    let page: Page | undefined
    for (const z of ZOOMS) {
      const W = H * z * aspect
      const systems: { from: number; to: number }[] = []
      let c = b
      for (let k = 0; k < sys && c < nb; k++) {
        const avail = W - 10 - headerW(an, c)
        let e = c + 1
        while (e < nb && e - c < most && widthOf(an, c, e + 1, 22, COMFORT) <= avail) e++
        systems.push({ from: c, to: e })
        c = e
      }
      page = { from: b, to: c, z, systems }
      // a bar alone in its system must fit at the full 14 units a gap, or the page zooms out
      if (systems.every((s) => s.to - s.from > 1 || widthOf(an, s.from, s.to, 0, 1) <= W - 10 - headerW(an, s.from))) break
    }
    pages.push(page!)
    b = page!.to
  }
  an.pages.set(key, pages)
  return pages
}

/** The bars on show when `bar` is playing. */
export function windowFor(an: Analysis, bar: number, cfg: Cfg): Win {
  const nb = an.bars.length
  bar = Math.min(Math.max(0, bar), nb - 1)
  const aspect = cfg.px.w / Math.max(cfg.px.h, 1)
  if (cfg.view === 'sheet' && !an.read) {
    const pages = sheetPages(an, cfg)
    let lo = 0
    let hi = pages.length - 1
    while (lo < hi) {
      const m = (lo + hi + 1) >> 1
      if (pages[m].from <= bar) lo = m
      else hi = m - 1
    }
    const p = pages[lo]
    return { from: p.from, to: p.to, systems: p.systems, z: p.z, nominal: sheetBox(cfg).H * p.z, follow: false }
  }
  // zoomed out: the bar being played and what follows it, in as many lines as fit
  const vb = an.solo ? SOLO.h : GRAND.h
  const zoom = zoomFor(cfg, vb)
  if (zoom < 1) {
    const H = vb / zoom
    const u = Math.min(40, 22 + Math.max(0, zoom - 0.7) * 60) // bars space as tightly as a sheet page by 0.7, and as the default window at 1
    const systems: { from: number; to: number }[] = []
    let c = bar
    for (let k = 0, n = Math.max(1, Math.floor((H + GAP) / (vb + GAP))); k < n && c < nb; k++) {
      const avail = H * aspect - 10 - headerW(an, c)
      let e = c + 1
      if (an.read) {
        // drill cards share a line by how many notes they hold: the default window fits 22 in two cards
        const cost = (i: number) => new Set(an.bars[i].cols.filter((x) => !x.virtual).map((x) => qk(x.q))).size * 9.2 + an.pad
        for (let used = cost(c); e < nb && e - c < 8 && used + cost(e) <= avail; e++) used += cost(e)
      } else while (e < nb && e - c < 8 && widthOf(an, c, e + 1, u, COMFORT) <= avail) e++
      systems.push({ from: c, to: e })
      c = e
    }
    return { from: bar, to: c, systems, z: 1, nominal: H, follow: true }
  }
  // one system from the bar being played: one bar, or two when they read comfortably
  let count = 1
  const vbH = an.solo ? SOLO.h : GRAND.h
  if (bar + 1 < nb) {
    if (an.read) {
      const on = new Set<string>()
      for (const B of [an.bars[bar], an.bars[bar + 1]]) for (const c of B.cols) if (!c.virtual) on.add(`${B.i}:${qk(c.q)}`)
      count = on.size <= 22 && !(an.pad > 14) ? 2 : 1
    } else {
      const avail = vbH * aspect - 10 - headerW(an, bar)
      count = widthOf(an, bar, bar + 2, 40, COMFORT) <= avail ? 2 : 1
    }
  }
  return { from: bar, to: bar + count, systems: [{ from: bar, to: bar + count }], z: 1, nominal: vbH, follow: true }
}

/** The largest staff size, in steps of 0.02 between `lo` and `hi`, at which the whole piece shows from its first bar; `lo` when none does. */
export function fitZoom(an: Analysis, cfg: Cfg, lo: number, hi: number): number {
  const all = (k: number) => windowFor(an, 0, { ...cfg, zoom: k / 50 }).to >= an.bars.length
  let a = Math.round(lo * 50)
  let b = Math.round(hi * 50)
  while (a < b) {
    const m = (a + b + 1) >> 1
    if (all(m)) a = m
    else b = m - 1
  }
  return a / 50
}

// ---- placed glyphs ----

export interface Head {
  x: number
  y: number
  ids: number[]
  kind: 0 | 1 | 2
  t: number
  want?: number
  grace: boolean
  cont: boolean
  up: boolean
  sys: number
  clef: Clef
  step: number // as drawn, after any 8va
  clamped: boolean
}
export interface LChord {
  sys: number
  clef: Clef
  lane: 1 | 2
  bar: number
  q: number
  x: number
  up: boolean
  grace: boolean
  heads: Head[]
  ledgers: { y: number; x1: number; x2: number }[]
  stem?: { x: number; y1: number; y2: number }
  flag?: { x: number; y: number; glyph: number }
  accs: { x: number; y: number; glyph: 'sharp' | 'flat' | 'natural'; grace: boolean }[]
  dots: { x: number; y: number }[]
  beamed: boolean
  slash?: boolean // acciaccatura
  art?: { x: number; y: number; kind: 'stac' | 'ten' | 'acc'; above: boolean } // y is the mark's middle
}
export interface LBeam {
  sys: number
  rows: { x1: number; y1: number; x2: number; y2: number; y3: number; y4: number }[] // top edge, then bottom edge at both ends
  chords: LChord[]
}
export interface LRest {
  sys: number
  clef: Clef
  x: number
  y: number
  v: number
  tup: string
  whole: boolean // a whole-bar rest
  bar: number
  q: number
}
export interface LTie {
  sys: number
  x1: number
  x2: number
  y: number
  below: boolean
  open?: 'left' | 'right'
}
export interface LTuplet {
  sys: number
  x1: number
  x2: number
  y: number
  up: boolean
  bracket: boolean
  num: number
}
export interface LOttava {
  sys: number
  clef: Clef
  x1: number
  x2: number
  y: number
  label: string
  below: boolean
}
/** A slur as a cubic curve; open at a system's edge when the rest of it is off the page or on the next line. */
export interface LSlur {
  sys: number
  x1: number
  y1: number
  x2: number
  y2: number
  c1: [number, number]
  c2: [number, number]
  above: boolean
}
/** A hairpin's piece in one system: half its opening at each end (0 is the point). */
export interface LWedge {
  sys: number
  x1: number
  x2: number
  y: number
  w1: number
  w2: number
}
/** A written dynamic letter, centred on x, its middle at y. */
export interface LDyn {
  sys: number
  x: number
  y: number
  text: string
}
export interface LSign {
  sys: number
  x: number
  y: number
  kind: 'gClef' | 'fClef' | 'sharp' | 'flat' | 'natural' | 'digits'
  text?: string
}
export interface LSystem {
  from: number
  to: number
  dy: number // y of the system's top in the viewBox
  h: number
  x0: number
  x1: number
  pad: number // headroom this system added above the staves
}
export interface LBar {
  i: number
  sys: number
  x: number // its left barline
  xEnd: number
  numY: number // baseline of its bar number
  xNext: number // where its time ends: the next bar's first column
  minGap: number // the closest two columns in this bar
  dense: boolean // still too tight to read after squeezing
  cols: { q: number; x: number }[]
}
export interface Layout {
  w: number
  h: number
  from: number
  to: number
  follow: boolean
  clefs: Clef[]
  base: Record<Clef, number>
  systems: LSystem[]
  bars: LBar[]
  chords: LChord[]
  beams: LBeam[]
  rests: LRest[]
  ties: LTie[]
  tuplets: LTuplet[]
  ottavas: LOttava[]
  slurs: LSlur[]
  wedges: LWedge[]
  dyns: LDyn[]
  signs: LSign[]
  finalBar: boolean
  /** A moment in time on the page: x, and the system it sits in. */
  posAt(t: number): { x: number; sys: number; dy: number }
}

export const yOf = (step: number, clef: Clef, base: Record<Clef, number>) => base[clef] - (step - BOTTOM_STEP[clef]) * (S / 2)

/** The page for a window. The viewBox height depends on the ink (8va, long stems), and its width on the height: so place twice when it grew. */
export function layout(an: Analysis, win: Win, cfg: Cfg): Layout {
  const a = place(an, win, cfg)
  const aspect = cfg.px.w / Math.max(cfg.px.h, 1)
  return a.w === Math.round(a.h * aspect) && a.w === a.w0 ? a : place(an, win, cfg, a.h)
}

type Placed = Layout & { w0: number }

function place(an: Analysis, win: Win, cfg: Cfg, forceH?: number): Placed {
  const { song } = an
  const base = an.solo ? SOLO.base : GRAND.base
  const vbH = an.solo ? SOLO.h : GRAND.h
  const aspect = cfg.px.w / Math.max(cfg.px.h, 1)
  const clefs = an.clefs
  const top = base[clefs[0]] - 4 * S
  const bottom = base[clefs[clefs.length - 1]]
  const midY = (c: Clef) => base[c] - 2 * S
  const H0 = forceH ?? (win.follow ? Math.max(vbH, win.nominal) : win.nominal)
  const W0 = Math.round(H0 * aspect)

  const L: Placed = {
    w: 0, h: 0, w0: W0, from: win.from, to: win.to, follow: win.follow, clefs, base,
    systems: [], bars: [], chords: [], beams: [], rests: [], ties: [], tuplets: [], ottavas: [], slurs: [], wedges: [], dyns: [], signs: [],
    finalBar: win.to >= an.bars.length, posAt: () => ({ x: 0, sys: 0, dy: 0 }),
  }
  const ink: { lo: number; hi: number }[] = []
  const mark = (sys: number, y0: number, y1 = y0) => {
    const k = (ink[sys] ??= { lo: top - 1, hi: bottom + 1 })
    k.lo = Math.min(k.lo, y0, y1)
    k.hi = Math.max(k.hi, y0, y1)
  }

  // ---- columns: where every onset sits ----
  const sysData: { X: number[][]; bl: number[]; bs: BarA[] }[] = []
  win.systems.forEach((sy, si) => {
    const bs = an.bars.slice(sy.from, sy.to)
    const x0 = headerW(an, sy.from)
    const x1 = W0 - 10
    L.systems.push({ from: sy.from, to: sy.to, dy: 0, h: vbH, x0, x1, pad: 0 })
    let X: number[][]
    let bl: number[]
    let E: number[]
    let dense = false
    if (an.read) {
      // drills: cards wait, nothing sweeps. Equal bars, fixed margins, time-linear inside.
      const bw = (x1 - x0) / bs.length
      X = bs.map((B, j) => B.cols.map((c) => x0 + j * bw + an.pad + (c.q / B.ql) * (bw - 2 * an.pad)))
      bl = bs.map((_, j) => x0 + j * bw).concat(x1)
      E = bs.map((_, j) => x0 + (j + 1) * bw - an.pad)
    } else {
      const r = solveX(bs, bs.map((_, j) => (j ? exOf(an, sy.from + j) : 0)), x1 - x0)
      X = r.X.map((row) => row.map((x) => x0 + x))
      bl = r.bl.map((x) => x0 + x)
      E = r.E.map((x) => x0 + x)
      dense = r.squash < 1 || r.s < 0.8
    }
    sysData.push({ X, bl, bs })
    bs.forEach((B, j) => {
      const real = B.cols.map((c, i) => ({ c, x: X[j][i] })).filter((k) => !k.c.virtual)
      const gaps = real.slice(1).map((k, i) => k.x - real[i].x)
      const minGap = gaps.length ? Math.min(...gaps) : Infinity
      L.bars.push({ i: B.i, sys: si, x: bl[j], numY: top - 16, xEnd: bl[j + 1], xNext: E[j], minGap, dense: dense && minGap < 10.5, cols: B.cols.map((c, i) => ({ q: c.q, x: X[j][i] })) })
    })

    // clefs, key signature, time signature
    const f0 = bs[0].fifths
    for (const clef of clefs) {
      L.signs.push({ sys: si, x: 14, y: clef === 'treble' ? base.treble - S : base.bass - 3 * S, kind: clef === 'treble' ? 'gClef' : 'fClef' })
      keySigSteps(f0, clef).forEach((step, i) => L.signs.push({ sys: si, x: 14 + 38 + i * 9, y: yOf(step, clef, base), kind: f0 > 0 ? 'sharp' : 'flat' }))
    }
    const timeAt = (b: number, x: number) => {
      for (const clef of clefs) {
        L.signs.push({ sys: si, x, y: base[clef] - 2 * S, kind: 'digits', text: String(an.bars[b].n) })
        L.signs.push({ sys: si, x, y: base[clef], kind: 'digits', text: String(an.bars[b].den) })
      }
    }
    if (sy.from === 0 || sigChanged(an.bars[sy.from - 1], an.bars[sy.from])) timeAt(sy.from, 14 + 40 + Math.abs(f0) * 9)
    for (let j = 1; j < bs.length; j++) {
      const P = bs[j - 1]
      const B = bs[j]
      let x = bl[j] + 5
      if (P.fifths !== B.fifths) {
        const k = keyChange(P.fifths, B.fifths)
        for (const clef of clefs) {
          keySigSteps(P.fifths, clef).slice(k.first, k.first + k.nat).forEach((step, i) => L.signs.push({ sys: si, x: x + i * 9, y: yOf(step, clef, base), kind: 'natural' }))
          keySigSteps(B.fifths, clef).forEach((step, i) => L.signs.push({ sys: si, x: x + (k.nat + i) * 9, y: yOf(step, clef, base), kind: B.fifths > 0 ? 'sharp' : 'flat' }))
        }
        x += (k.nat + k.n) * 9 + 6
      }
      if (sigChanged(P, B)) timeAt(B.i, x)
    }
  })

  // ---- notes, system by system ----
  interface Pend { head: Head; chord: Chord; note: CNote; lc: LChord; si: number }
  const pending: Pend[] = []
  const lcOf = new Map<Chord, LChord>()
  const stemsOf = new Map<LChord, { x: number; yRoot: number }>()
  const beamRows: LBeam[] = []

  win.systems.forEach((sy, si) => {
    const { X, bl, bs } = sysData[si]
    for (const clef of clefs) {
      const all = bs.flatMap((B) => B.chords.filter((c) => c.clef === clef))
      const chords = all.filter((c) => !c.grace).sort((a, b) => a.bar - b.bar || a.q - b.q)
      const graces = all.filter((c) => c.grace)
      const hi = (c: Chord) => c.notes[c.notes.length - 1].sp.step
      const lo = (c: Chord) => c.notes[0].sp.step

      // 8va / 15ma and their low twins: a passage that would need more than three ledger lines
      const shiftOf = new Map<Chord, number>()
      const LIM = 2 * (LEDGER_MAX + 1)
      const need = (c: Chord) => {
        const up = hi(c) - TOP_STEP[clef]
        const dn = BOTTOM_STEP[clef] - lo(c)
        if (up >= LIM) return up >= LIM + 7 ? -14 : -7
        if (dn >= LIM) return dn >= LIM + 7 ? 14 : 7
        return 0
      }
      const fits = (c: Chord, s: number) => (s < 0 ? lo(c) + s >= BOTTOM_STEP[clef] - 2 * LEDGER_MAX : hi(c) + s <= TOP_STEP[clef] + 2 * LEDGER_MAX)
      let seg: { s: number; mem: Chord[] } | undefined
      let gapped: Chord[] = []
      const close = () => {
        if (!seg) return
        for (const c of seg.mem) shiftOf.set(c, seg.s)
        const a = seg.mem[0]
        const z = seg.mem[seg.mem.length - 1]
        const label = Math.abs(seg.s) === 14 ? (seg.s < 0 ? '15ma' : '15mb') : seg.s < 0 ? '8va' : '8vb'
        L.ottavas.push({ sys: si, clef, x1: X[a.bar - sy.from][a.ci], x2: X[z.bar - sy.from][z.ci] + 8, y: 0, label, below: seg.s > 0 })
        seg = undefined
      }
      for (const c of chords) {
        const s = need(c)
        if (s) {
          if (seg && Math.sign(seg.s) === Math.sign(s)) {
            seg.mem.push(...gapped, c)
            if (Math.abs(s) > Math.abs(seg.s)) seg.s = s
          } else {
            close()
            seg = { s, mem: [c] }
          }
          gapped = []
        } else if (seg) {
          if (gapped.length < 2 && fits(c, seg.s)) gapped.push(c)
          else {
            close()
            gapped = []
          }
        }
      }
      close()

      // drawn steps and stem directions
      const stepOf = (c: Chord, n: CNote) => {
        const s = n.sp.step + (shiftOf.get(c) ?? 0)
        const out = Math.min(TOP_STEP[clef] + 2 * LEDGER_CLAMP, Math.max(BOTTOM_STEP[clef] - 2 * LEDGER_CLAMP, s))
        return { step: out, clamped: out !== s }
      }
      const upOf = new Map<Chord, boolean>()
      const dirOf = (cs: Chord[]) => {
        if (bs[cs[0].bar - sy.from].two[clef]) return cs[0].lane === 1
        const steps = cs.flatMap((c) => c.notes.map((n) => stepOf(c, n).step))
        return steps.reduce((a, b) => a + b, 0) / steps.length < MID_STEP[clef]
      }
      const seen = new Set<Beam>()
      for (const c of chords) {
        if (!c.beam) upOf.set(c, dirOf([c]))
        else if (!seen.has(c.beam)) {
          seen.add(c.beam)
          const u = dirOf(c.beam.chords)
          for (const m of c.beam.chords) upOf.set(m, u)
        }
      }
      for (const g of graces) upOf.set(g, true)

      const mk = (c: Chord): LChord => {
        const j = c.bar - sy.from
        const col = bs[j].cols[c.ci]
        let x = X[j][c.ci]
        const up = upOf.get(c)!
        if (c.grace) {
          // graces sit left of the column, in the room it reserved
          const mine = graces.filter((g) => g.bar === c.bar && g.ci === c.ci)
          x = x - col.L + ((mine.indexOf(c) + 0.5) * col.gw) / mine.length
        }
        const lc: LChord = { sys: si, clef, lane: c.lane, bar: c.bar, q: c.q, x, up, grace: c.grace, heads: [], ledgers: [], accs: [], dots: [], beamed: !!c.beam }
        let prev: { step: number; dx: number } | undefined
        for (const n of up ? c.notes : [...c.notes].reverse()) {
          const { step, clamped } = stepOf(c, n)
          const dx = prev && Math.abs(step - prev.step) <= 1 && prev.dx === 0 ? (up ? SECOND : -SECOND) : 0
          prev = { step, dx }
          const y = yOf(step, clef, base)
          const h: Head = { x: x + dx, y, ids: n.ids, kind: c.fig.head, t: c.t, want: c.want, grace: c.grace, cont: c.cont, up, sys: si, clef, step, clamped }
          lc.heads.push(h)
          mark(si, y - 5, y + 5)
          // scales: the finger number staff.ts draws away from the stem (baseline +27 below, -19 above) is ink too
          if (!c.cont && !c.grace && song.notes[n.ids[0]]?.f) mark(si, up ? y + 31 : y - 31)
          if (c.fig.dots && !c.grace) {
            const online = step % 2 === BOTTOM_STEP[clef] % 2
            for (let d = 0; d < c.fig.dots; d++) lc.dots.push({ x: x + 10 + Math.max(0, dx) + d * 4.5, y: y - (online ? S / 2 : 0) })
          }
          if (n.glyph) lc.accs.push({ x: x - (c.grace ? 8 : 15 + n.accCol * 8) - (dx < 0 ? SECOND : 0), y, glyph: n.glyph, grace: c.grace })
          if (!c.grace) pending.push({ head: h, chord: c, note: n, lc, si })
        }
        lc.heads.sort((a, b) => b.y - a.y) // lowest first
        const sTop = Math.max(...lc.heads.map((h) => h.step))
        const sLow = Math.min(...lc.heads.map((h) => h.step))
        const xa = Math.min(...lc.heads.map((h) => h.x)) - (c.grace ? 7 : 10)
        const xb = Math.max(...lc.heads.map((h) => h.x)) + (c.grace ? 7 : 10)
        for (let s = BOTTOM_STEP[clef] - 2; s >= sLow; s -= 2) lc.ledgers.push({ y: yOf(s, clef, base), x1: xa, x2: xb })
        for (let s = TOP_STEP[clef] + 2; s <= sTop; s += 2) lc.ledgers.push({ y: yOf(s, clef, base), x1: xa, x2: xb })
        lcOf.set(c, lc)
        return lc
      }
      const lcs = chords.map(mk)
      const glcs = graces.map(mk)
      L.chords.push(...glcs, ...lcs)

      // stems, flags, beams
      const yTop = (lc: LChord) => lc.heads[lc.heads.length - 1].y
      const yLow = (lc: LChord) => lc.heads[0].y
      for (const lc of [...lcs, ...glcs]) {
        const sx = lc.x + (lc.grace ? (lc.up ? 3.7 : -3.7) : lc.up ? 5.4 : -5.4)
        stemsOf.set(lc, { x: sx, yRoot: lc.up ? yLow(lc) : yTop(lc) })
      }
      const doneBeam = new Set<Beam>()
      for (const c of chords) {
        const lc = lcOf.get(c)!
        mark(si, yTop(lc) - 5, yLow(lc) + 5)
        if (c.fig.head === 0) continue // a whole note has no stem
        if (c.beam) {
          if (doneBeam.has(c.beam)) continue
          doneBeam.add(c.beam)
          const mem = c.beam.chords.map((m) => lcOf.get(m)!)
          const up = lc.up
          const bound = (m: LChord) => (up ? Math.min(yTop(m) - 3 * S, midY(clef)) : Math.max(yLow(m) + 3 * S, midY(clef)))
          const xs = mem.map((m) => stemsOf.get(m)!.x)
          const span = xs[xs.length - 1] - xs[0]
          const slope = span > 0 ? Math.max(-0.18, Math.min(0.18, ((bound(mem[mem.length - 1]) - bound(mem[0])) * 0.5) / span)) : 0
          let y0 = up ? Infinity : -Infinity
          mem.forEach((m, k) => {
            const b = bound(m) - slope * (xs[k] - xs[0])
            y0 = up ? Math.min(y0, b) : Math.max(y0, b)
          })
          const lineAt = (x: number) => y0 + slope * (x - xs[0])
          mem.forEach((m, k) => {
            m.stem = { x: xs[k], y1: stemsOf.get(m)!.yRoot, y2: lineAt(xs[k]) }
            mark(si, lineAt(xs[k]) - 6, lineAt(xs[k]) + 6)
          })
          const T = 5
          const dir = up ? 1 : -1
          const flags = c.beam.chords.map((m) => m.fig.flags)
          const rows: LBeam['rows'] = []
          const row = (xa: number, xb: number, r: number) => {
            const off = r * 7.5 * dir
            const ya = lineAt(xa) + off
            const yb = lineAt(xb) + off
            rows.push({ x1: xa, y1: ya, x2: xb + 1.3, y2: yb, y3: ya + T * dir, y4: yb + T * dir })
            mark(si, ya, yb + T * dir)
          }
          row(xs[0], xs[xs.length - 1], 0)
          for (let r = 1; r < 3; r++) {
            for (let k = 0; k < mem.length; ) {
              if (flags[k] <= r) {
                k++
                continue
              }
              let e = k
              while (e + 1 < mem.length && flags[e + 1] > r) e++
              if (e > k) row(xs[k], xs[e], r)
              else row(xs[k] + (k === 0 ? 0 : -6), xs[k] + (k === 0 ? 6 : 0), r) // a stub, toward the neighbour
              k = e + 1
            }
          }
          beamRows.push({ sys: si, rows, chords: mem })
          continue
        }
        const raw = lc.up ? yTop(lc) - 3.5 * S : yLow(lc) + 3.5 * S
        const tip = lc.up ? Math.min(raw, midY(clef)) : Math.max(raw, midY(clef)) // a stem always reaches the middle line
        const st = stemsOf.get(lc)!
        lc.stem = { x: st.x, y1: st.yRoot, y2: tip }
        mark(si, tip)
        if (c.fig.flags > 0) {
          lc.flag = { x: st.x - 0.3, y: tip, glyph: 0xe240 + (Math.min(c.fig.flags, 3) - 1) * 2 + (lc.up ? 0 : 1) }
          mark(si, tip, tip + (lc.up ? 28 : -28))
        }
      }
      // graces: a flagged stem and a slash for one, a thin beam and a slash on the first stem for a run
      const runs = new Map<string, LChord[]>()
      for (const lc of glcs) runs.set(`${lc.bar}|${lc.q}`, [...(runs.get(`${lc.bar}|${lc.q}`) ?? []), lc])
      for (const run of runs.values()) {
        const tips = run.map((lc) => yTop(lc) - 2.4 * S)
        const line = Math.min(...tips)
        run.forEach((lc) => {
          const st = stemsOf.get(lc)!
          lc.stem = { x: st.x, y1: st.yRoot, y2: run.length > 1 ? line : tips[run.indexOf(lc)] }
          mark(si, lc.stem.y2 - 2, yLow(lc) + 4)
        })
        run[0].slash = true
        if (run.length > 1) {
          const xa = stemsOf.get(run[0])!.x
          const xb = stemsOf.get(run[run.length - 1])!.x
          beamRows.push({ sys: si, rows: [{ x1: xa, y1: line, x2: xb + 1.3, y2: line, y3: line + 2.6, y4: line + 2.6 }], chords: run })
        } else run[0].flag = { x: stemsOf.get(run[0])!.x - 0.2, y: tips[0], glyph: 0xe240 }
      }

      // rests, only in a staff that has notes on this page
      if (chords.length) {
        for (const B of bs) {
          const j = B.i - sy.from
          const two = B.two[clef]
          if (B.barRest[clef] && !an.read) L.rests.push({ sys: si, clef, x: (bl[j] + bl[j + 1]) / 2, y: base[clef] - 3 * S, v: B.ql, tup: '', whole: true, bar: B.i, q: 0 })
          for (const r of B.rests.filter((x) => x.clef === clef)) {
            const y = figure(r.v, r.tup).head === 0 ? base[clef] - 3 * S : base[clef] - 2 * S
            L.rests.push({ sys: si, clef, x: X[j][B.cols.findIndex((k) => near(k.q, r.q, 0.011))], y: y - (two ? 1.5 * S : 0), v: r.v, tup: r.tup, whole: false, bar: B.i, q: r.q })
          }
        }
      }
    }

    // ottava brackets sit clear of the ink they span
    for (const o of L.ottavas.filter((x) => x.sys === si && x.y === 0)) {
      const span = L.chords.filter((c) => c.sys === si && c.clef === o.clef && c.x >= o.x1 - 12 && c.x <= o.x2)
      const ys = [
        ...span.flatMap((c) => [...c.heads.map((h) => h.y), ...(c.stem ? [c.stem.y2] : [])]),
        ...beamRows.filter((b) => b.sys === si && b.chords.some((c) => span.includes(c))).flatMap((b) => b.rows.flatMap((r) => [r.y1, r.y2, r.y3, r.y4])),
      ]
      o.y = o.below ? Math.max(bottom + 16, ...ys.map((y) => y + 9)) : Math.min(top - 30, ...ys.map((y) => y - 9))
      mark(si, o.y + (o.below ? 6 : -9))
    }
  })
  L.beams = beamRows

  // ---- ties: a note that carries into the next written onset ----
  const tieKey = (bar: number, clef: Clef, p: number, q: number) => `${bar}|${clef}|${p}|${qk(q)}`
  const into = new Map<string, Pend>()
  for (const p of pending) if (p.note.tiePrev) into.set(tieKey(p.chord.bar, p.chord.clef, p.note.p, p.chord.q), p)
  const from = new Map<string, Pend>()
  for (const p of pending) {
    if (!p.note.tieNext) continue
    const c = p.chord
    const nq = c.q + c.v
    const wrap = nq >= an.bars[c.bar].ql - 0.05
    from.set(tieKey(wrap ? c.bar + 1 : c.bar, c.clef, p.note.p, wrap ? 0 : nq), p)
  }
  for (const p of pending) {
    const { chord: c, note: n, head: h, si } = p
    const B = an.bars[c.bar]
    const tied = c.notes.filter((m) => m.tieNext || m.tiePrev)
    const k = tied.indexOf(n)
    const below = B.two[c.clef] ? c.lane === 2 : tied.length > 1 ? k < tied.length / 2 : !p.lc.up
    const y = h.y + (below ? 4 : -4)
    if (n.tieNext) {
      const nq = c.q + c.v
      const wrap = nq >= B.ql - 0.05
      const target = into.get(tieKey(wrap ? c.bar + 1 : c.bar, c.clef, n.p, wrap ? 0 : nq))
      if (target && target.si === si) L.ties.push({ sys: si, x1: h.x + 7.5, x2: target.head.x - 7.5, y, below })
      else L.ties.push({ sys: si, x1: h.x + 7.5, x2: Math.max(h.x + 16, L.systems[si].x1 - 2), y, below, open: 'right' })
    }
    if (n.tiePrev) {
      const src = from.get(tieKey(c.bar, c.clef, n.p, c.q))
      if (!src || src.si !== si) L.ties.push({ sys: si, x1: Math.min(h.x - 16, L.systems[si].x0 + 4), x2: h.x - 7.5, y, below, open: 'left' })
    }
  }
  for (const t of L.ties) mark(t.sys, t.y + (t.below ? 8 : -8))

  // ---- tuplet brackets ----
  win.systems.forEach((_, si) => {
    for (const B of sysData[si].bs) {
      for (const tp of B.tuplets) {
        const lcs = tp.items.flatMap((it) => ('notes' in it ? [lcOf.get(it)!] : []))
        const rs = L.rests.filter((r) => r.sys === si && r.clef === tp.clef && r.bar === B.i && tp.items.some((it) => !('notes' in it) && near(it.q, r.q, 0.011)))
        const xs = [...lcs.map((l) => l.x), ...rs.map((r) => r.x)]
        if (!xs.length) continue
        const up = lcs.length ? lcs[0].up : true
        const beamed = lcs.length === tp.items.length && lcs.every((l) => l.beamed) && new Set(tp.items.map((it) => ('notes' in it ? it.beam : undefined))).size === 1
        const edge = [
          ...lcs.flatMap((l) => (l.stem ? [l.stem.y2] : l.heads.map((h) => h.y))),
          ...beamRows.filter((b) => lcs.some((l) => b.chords.includes(l))).flatMap((b) => b.rows.flatMap((r) => (up ? [r.y1, r.y2] : [r.y3, r.y4]))),
        ]
        const y = edge.length ? (up ? Math.min(...edge) - 9 : Math.max(...edge) + 9) : base[tp.clef] - 4 * S - 8
        L.tuplets.push({ sys: si, x1: Math.min(...xs) - 6, x2: Math.max(...xs) + 6, y, up, bracket: !beamed, num: Number(tp.items[0].tup.split(':')[0]) || 3 })
        mark(si, y + (up ? -8 : 8))
      }
    }
  })

  // time to x
  L.posAt = (t: number) => {
    const bars = song.bars
    let lo = L.from
    let hi = L.to - 1
    while (lo < hi) {
      const m = (lo + hi + 1) >> 1
      if (bars[m].t0 <= t) lo = m
      else hi = m - 1
    }
    const b = bars[lo]
    const q = Math.min(1, Math.max(0, (t - b.t0) / Math.max(b.t1 - b.t0, 1e-6))) * barQ(b)
    const lb = L.bars[lo - L.from]
    const cols = lb.cols
    let k = cols.length - 1
    while (k > 0 && cols[k].q > q) k--
    const x1 = k + 1 < cols.length ? cols[k + 1].x : lb.xNext
    const q1 = k + 1 < cols.length ? cols[k + 1].q : barQ(b)
    return { x: cols[k].x + ((q - cols[k].q) / Math.max(q1 - cols[k].q, 1e-6)) * (x1 - cols[k].x), sys: lb.sys, dy: L.systems[lb.sys].dy }
  }
  marks(L, an, mark)

  // ---- the page: system heights and the viewBox ----
  L.systems.forEach((s, si) => {
    const k = ink[si] ?? { lo: top, hi: bottom }
    for (const b of L.bars.filter((x) => x.sys === si)) {
      // a bar number sits at a fixed height above the staff, and rises only where notes reach into it
      const lo = inkTop(L, beamRows, b.sys, b.x, b.x + 26)
      b.numY = Math.min(top - 16, lo - 5)
      if (b.numY < top - 16) k.lo = Math.min(k.lo, b.numY - 9)
    }
    s.pad = Math.max(0, 4 - k.lo)
    s.h = vbH + s.pad + Math.max(0, k.hi - (vbH - 2))
  })
  const content = L.systems.reduce((n, s) => n + s.h, 0) + GAP * (L.systems.length - 1)
  L.h = Math.max(content, H0)
  L.w = Math.round(L.h * aspect)
  let y = win.follow && win.nominal <= vbH ? 0 : (L.h - content) / 2 // the one-line follow window sits at the top; a zoomed-out page is centred
  for (const s of L.systems) {
    s.dy = y + s.pad
    y += s.h + GAP
  }

  return L
}

/** What a score writes about touch: articulation, slurs, hairpins and dynamic letters. MIDI files and drills have none. */
function marks(L: Layout, an: Analysis, mark: (sys: number, y0: number, y1?: number) => void) {
  const { song } = an
  const { base } = L
  const d = (above: boolean) => (above ? -1 : 1)
  const two = (c: LChord) => L.chords.some((o) => o.sys === c.sys && o.bar === c.bar && o.clef === c.clef && o.lane === 2)
  const side = (c: LChord) => (two(c) ? c.lane === 1 : !c.up) // away from the stem; past it, outward, when a staff has two voices

  // articulation: in a space, never on a staff or ledger line; past a finger number
  for (const c of L.chords) {
    const kind = c.grace ? undefined : c.heads.flatMap((h) => (h.cont ? [] : h.ids.map((id) => song.notes[id]?.art))).find(Boolean)
    if (!kind) continue
    const above = side(c)
    const h = above ? c.heads[c.heads.length - 1] : c.heads[0]
    const B0 = BOTTOM_STEP[c.clef]
    const onLine = (st: number) => (st - B0) % 2 === 0 && ((st >= B0 && st <= B0 + 8) || c.ledgers.some((l) => near(l.y, yOf(st, c.clef, base))))
    let step = h.step - d(above) * (kind === 'acc' ? 3 : 2)
    if (onLine(step)) step -= d(above)
    let y = yOf(step, c.clef, base)
    if (c.stem && c.up === above) y = above ? Math.min(y, c.stem.y2 - 7) : Math.max(y, c.stem.y2 + 7)
    if (c.heads.some((x) => !x.cont && song.notes[x.ids[0]]?.f)) y = above ? Math.min(y, h.y - 38) : Math.max(y, h.y + 38)
    c.art = { x: c.x, y, kind, above }
    mark(c.sys, y - 6, y + 6)
  }

  // slurs: the first to the last note of a run in one hand and part, over the heads unless every stem points up
  const lcOf = new Map<number, LChord>()
  for (const c of L.chords) if (!c.grace) for (const h of c.heads) if (!h.cont) for (const id of h.ids) lcOf.set(id, c)
  const edge = (c: LChord, above: boolean) => {
    const ys = [...c.heads.map((h) => h.y + d(above) * 7), ...(c.stem && c.up === above ? [c.stem.y2 + d(above) * 4] : []), ...(c.art?.above === above ? [c.art.y + d(above) * 7] : [])]
    return above ? Math.min(...ys) : Math.max(...ys)
  }
  const lines = new Map<string, Note[][]>()
  for (const n of song.notes) {
    if (n.grace) continue
    const k = `${n.h}${n.part ?? 0}`
    const gs = lines.get(k) ?? lines.set(k, []).get(k)!
    const g = gs[gs.length - 1]
    if (g && Math.abs(g[0].t - n.t) < 1e-3) g.push(n)
    else gs.push([n])
  }
  for (const gs of lines.values()) {
    for (let a = 0; a < gs.length; a++) {
      if (!gs[a].some((n) => n.slur)) continue
      let z = a
      while (z + 1 < gs.length && gs[z].some((n) => n.slur)) z++
      const ids = new Set(gs.slice(a, z + 1).flatMap((g) => g.map((n) => n.id)))
      const end = (g: Note[]) => g.map((n) => lcOf.get(n.id)).find(Boolean)
      slur(end(gs[a]), end(gs[z]), L.chords.filter((c) => !c.grace && c.heads.some((h) => h.ids.some((i) => ids.has(i)))))
      a = Math.max(a, z - 1) // the last note may start the next slur
    }
  }
  function slur(ca: LChord | undefined, cz: LChord | undefined, all: LChord[]) {
    if (!all.length || (ca && ca === cz)) return
    const ends = [ca, cz].filter((c) => !!c)
    const above = (ends.length ? ends : all).some(side) // under the notes only when its ends' stems both point up
    const dir = d(above)
    for (const si of new Set(all.map((c) => c.sys))) {
      const mine = all.filter((c) => c.sys === si)
      const sy = L.systems[si]
      const a = ca?.sys === si ? ca : undefined
      const z = cz?.sys === si ? cz : undefined
      const far = above ? Math.min(...mine.map((c) => edge(c, true))) : Math.max(...mine.map((c) => edge(c, false)))
      const x1 = a ? a.x : Math.min(sy.x0 + 4, Math.min(...mine.map((c) => c.x)) - 6) // open: from the system's start or to its end
      const x2 = z ? z.x : Math.max(sy.x1 - 2, Math.max(...mine.map((c) => c.x)) + 6)
      let y1 = a ? edge(a, above) : z ? edge(z, above) : far
      let y2 = z ? edge(z, above) : y1
      const span = Math.max(x2 - x1, 1)
      // high enough to clear every note under it; past 4 spaces the ends move out instead
      const gaps = mine.flatMap((c) => {
        const u = (c.x - x1) / span
        return c === a || c === z || u <= 0 || u >= 1 ? [] : [{ k: 3 * u * (1 - u), g: (edge(c, above) - (y1 + (y2 - y1) * u)) * dir }]
      })
      let H = Math.min(24, Math.max(6, span * 0.12))
      for (const { k, g } of gaps) H = Math.max(H, g / k)
      H = Math.min(H, 4 * S)
      const lift = Math.max(0, ...gaps.map(({ k, g }) => g - k * H))
      y1 += dir * lift
      y2 += dir * lift
      L.slurs.push({ sys: si, x1, y1, x2, y2, c1: [x1 + span / 3, y1 + (y2 - y1) / 3 + dir * H], c2: [x1 + (2 * span) / 3, y1 + (2 * (y2 - y1)) / 3 + dir * H], above })
      mark(si, y1, y2)
      mark(si, (y1 + y2) / 2 + dir * 0.75 * H)
    }
  }

  // dynamic letters and hairpins: between the staves (under a lone staff), clear of the notes over their stretch
  if (!song.marks?.length && !song.wedges?.length) return
  const bars = song.bars
  const span = L.systems.map((sy) => [bars[sy.from].t0, bars[sy.to - 1].t1])
  const ys = (si: number, clef: Clef, xa: number, xb: number, stems: boolean) =>
    L.chords.filter((c) => c.sys === si && c.clef === clef && c.x + 8 >= xa && c.x - 8 <= xb).flatMap((c) => [...c.heads.map((h) => h.y), ...(c.stem && stems ? [c.stem.y2] : []), ...(c.art ? [c.art.y] : [])])
  // ponytail: slurs and beams in the gap are not avoided; a stem is, unless that leaves no room
  const rowAt = (si: number, xa: number, xb: number) => {
    if (L.clefs.length === 1) return Math.max(base[L.clefs[0]] + 25, ...ys(si, L.clefs[0], xa, xb, true).map((y) => y + 16))
    const band = (stems: boolean) => [Math.max(base.treble + 2, ...ys(si, 'treble', xa, xb, stems).map((y) => y + 8)), Math.min(base.bass - 4 * S - 2, ...ys(si, 'bass', xa, xb, stems).map((y) => y - 8))]
    const [hi, lo] = band(true)[1] - band(true)[0] >= 16 ? band(true) : band(false)
    return (hi + lo) / 2
  }
  for (const m of song.marks ?? []) {
    if (m.t < span[0][0] - 1e-6 || m.t >= span[span.length - 1][1]) continue
    const p = L.posAt(m.t)
    const y = rowAt(p.sys, p.x - m.text.length * 7.5, p.x + m.text.length * 7.5)
    L.dyns.push({ sys: p.sys, x: p.x, y, text: m.text })
    mark(p.sys, y - 14, y + 8)
  }
  const HALF = 6 // half a hairpin's opening
  for (const w of song.wedges ?? []) {
    const len = Math.max(w.t1 - w.t0, 1e-6)
    L.systems.forEach((sy, si) => {
      const [s0, s1] = span[si]
      if (w.t1 < s0 || w.t0 >= s1) return
      let x1 = w.t0 >= s0 ? L.posAt(w.t0).x - 4 : sy.x0 + 4
      let x2 = w.t1 < s1 ? Math.min(L.posAt(w.t1).x + 14, sy.x1 - 2) : sy.x1 - 2
      for (const g of L.dyns) {
        const r = g.text.length * 7.5 + 3
        if (g.sys !== si || g.x + r < x1 || g.x - r > x2) continue
        if (g.x < (x1 + x2) / 2) x1 = g.x + r
        else x2 = g.x - r
      }
      if (x2 - x1 < 10) return
      const f1 = Math.max(0, (s0 - w.t0) / len)
      const f2 = Math.min(1, (s1 - w.t0) / len)
      const y = rowAt(si, x1, x2)
      L.wedges.push({ sys: si, x1, x2, y, w1: HALF * (w.up ? f1 : 1 - f1), w2: HALF * (w.up ? f2 : 1 - f2) })
      mark(si, y - HALF, y + HALF)
    })
  }
}

/** Every x and y the layout would draw in, for tests: the extremes in viewBox units. */
export function inkBounds(L: Layout) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  const pt = (sys: number, x: number, y: number) => {
    const d = L.systems[sys].dy
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y + d)
    maxY = Math.max(maxY, y + d)
  }
  for (const c of L.chords) {
    for (const h of c.heads) (pt(c.sys, h.x - HEAD, h.y - 5), pt(c.sys, h.x + HEAD, h.y + 5))
    for (const l of c.ledgers) (pt(c.sys, l.x1, l.y), pt(c.sys, l.x2, l.y))
    if (c.stem) (pt(c.sys, c.stem.x, c.stem.y1), pt(c.sys, c.stem.x, c.stem.y2))
    for (const a of c.accs) (pt(c.sys, a.x - 5, a.y - 8), pt(c.sys, a.x + 5, a.y + 8))
  }
  for (const b of L.beams) for (const r of b.rows) (pt(b.sys, r.x1, r.y1), pt(b.sys, r.x2, r.y4))
  for (const r of L.rests) (pt(r.sys, r.x - 7, r.y - 10), pt(r.sys, r.x + 7, r.y + 10))
  for (const t of L.ties) (pt(t.sys, t.x1, t.y), pt(t.sys, t.x2, t.y + (t.below ? 7 : -7)))
  for (const t of L.tuplets) (pt(t.sys, t.x1, t.y - 8), pt(t.sys, t.x2, t.y + 8))
  for (const o of L.ottavas) (pt(o.sys, o.x1, o.y - 8), pt(o.sys, o.x2, o.y + 8))
  for (const c of L.chords) if (c.art) (pt(c.sys, c.art.x - 7, c.art.y - 5), pt(c.sys, c.art.x + 7, c.art.y + 5))
  for (const s of L.slurs) (pt(s.sys, s.x1, s.y1), pt(s.sys, s.x2, s.y2), pt(s.sys, s.c1[0], (s.y1 + s.y2) / 2 + (s.c1[1] - s.y1 - (s.y2 - s.y1) / 3) * 0.75))
  for (const w of L.wedges) (pt(w.sys, w.x1, w.y - HEAD), pt(w.sys, w.x2, w.y + HEAD))
  for (const g of L.dyns) (pt(g.sys, g.x - g.text.length * 7.5, g.y - 13), pt(g.sys, g.x + g.text.length * 7.5, g.y + 7))
  return { minX, maxX, minY, maxY }
}

/** The bar that needs the most room at full gaps: for a Simplify prompt. */
export function densest(an: Analysis): { bar: number; columns: number; units: number } | undefined {
  let best: { bar: number; columns: number; units: number } | undefined
  for (const B of an.bars) {
    const units = widthOf(an, B.i, B.i + 1, 0, 1)
    if (!best || units > best.units) best = { bar: B.i, columns: B.cols.filter((c) => !c.virtual).length, units }
  }
  return best
}

/** The highest ink within an x range of a system: what a bar number has to clear. */
function inkTop(L: Layout, beams: LBeam[], sys: number, xa: number, xb: number) {
  let y = Infinity
  for (const c of L.chords) {
    if (c.sys !== sys || c.x + 14 < xa || c.x - 12 > xb) continue
    for (const h of c.heads) y = Math.min(y, h.y - 6)
    for (const l of c.ledgers) y = Math.min(y, l.y - 1)
    for (const a of c.accs) y = Math.min(y, a.y - 8)
    if (c.stem && c.stem.x >= xa - 2 && c.stem.x <= xb) y = Math.min(y, c.stem.y1, c.stem.y2)
  }
  for (const b of beams) if (b.sys === sys) for (const r of b.rows) if (r.x2 >= xa && r.x1 <= xb) y = Math.min(y, r.y1, r.y2, r.y3, r.y4)
  for (const t of L.tuplets) if (t.sys === sys && t.x2 >= xa && t.x1 <= xb) y = Math.min(y, t.y - 8)
  for (const o of L.ottavas) if (o.sys === sys && o.x2 >= xa && o.x1 <= xb) y = Math.min(y, o.y - 9)
  for (const c of L.chords) if (c.art && c.sys === sys && c.x + 7 >= xa && c.x - 7 <= xb) y = Math.min(y, c.art.y - 6)
  for (const s of L.slurs) if (s.sys === sys && s.x2 >= xa && s.x1 <= xb) y = Math.min(y, s.y1, s.y2, s.c1[1], s.c2[1])
  return y
}
