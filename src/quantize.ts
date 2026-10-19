// The notation layer: turns performed notes (ticks) into clean bars, and clean-but-raw positions into written values.
// Everything is in ticks and quarter notes, never seconds, so a tempo map cannot distort a position.
import type { Hand } from './song'

const near = (a: number, b: number, e = 1e-3) => Math.abs(a - b) < e
const PLAIN = [4, 3.5, 3, 2, 1.5, 1, 0.75, 0.5, 0.375, 0.25, 0.125] // written values in quarters
const TRIPLET = [8 / 3, 4 / 3, 2 / 3, 1 / 3, 1 / 6]

/** 2/3, 1/3, 1/6 ...: a value that only exists inside a triplet. */
export const isTripletValue = (x: number) => near(x * 6, Math.round(x * 6)) && !near(x * 4, Math.round(x * 4)) && !near(x * 2, Math.round(x * 2))
const isTripletPos = (x: number) => near(x * 6, Math.round(x * 6)) && Math.round(x * 6) % 3 !== 0

function snapDur(target: number, room: number, triplet: boolean) {
  const t = Math.max(target, 0.03)
  const c = [...PLAIN, ...(triplet ? TRIPLET : [])].filter((v) => v <= room + 1e-6 && (v >= 0.25 || room < 0.25 || t >= 0.1)) // a 30 ms staccato is not a 32nd
  return c.length ? c.reduce((b, v) => (Math.abs(Math.log(v / t)) < Math.abs(Math.log(b / t)) ? v : b)) : room
}

// ---- stage 2: written values, voices and ties from positions ----

export interface NIn {
  q: number // onset, quarters from tick 0
  dq: number // performed length, quarters
  hand: Hand
  grace?: boolean
}
export interface BarQ {
  q0: number
  ql: number
}
export interface NOut {
  bar: number
  qb: number
  qd: number // written length in quarters; for a tied note, up to the barline
  qrest?: number // tied note: quarters still to write after the barline (use tiedSegments)
  tuplet?: { num: number; den: number }
  tieNext?: boolean
  voice: 1 | 2
  grace?: boolean
}

export function barIndex(bars: BarQ[], q: number) {
  let lo = 0
  let hi = bars.length - 1
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1
    if (bars[m].q0 <= q + 1e-6) lo = m
    else hi = m - 1
  }
  return lo
}

/**
 * Written value = performed length clipped to the next onset in the same voice and to the barline, then snapped.
 * A note that rings well past the barline keeps one playing note and gets `tieNext` and `qrest`.
 * A long note under a moving line of the same hand goes to voice 2; pedal and legato overlaps are just clipped.
 */
export function notate(items: NIn[], bars: BarQ[]): NOut[] {
  const out: NOut[] = new Array(items.length)
  for (const hand of ['R', 'L'] as Hand[]) {
    const mine = items.map((_, i) => i).filter((i) => items[i].hand === hand)
    const live = mine.filter((i) => !items[i].grace).sort((a, b) => items[a].q - items[b].q)
    const cl: { q: number; ids: number[] }[] = []
    for (const i of live) {
      const c = cl[cl.length - 1]
      if (c && near(c.q, items[i].q)) c.ids.push(i)
      else cl.push({ q: items[i].q, ids: [i] })
    }
    const end = (i: number) => items[i].q + items[i].dq
    const voice = new Map<number, 1 | 2>()
    cl.forEach((c, j) => {
      const nx = cl[j + 1]
      const nxEnd = nx ? Math.max(...nx.ids.map(end)) : 0
      for (const i of c.ids) voice.set(i, nx && items[i].dq >= 1.5 && nx.q < end(i) - 0.5 && nxEnd < end(i) - 0.25 ? 2 : 1)
    })
    for (const v of [1, 2] as const) {
      const vc = cl.map((c) => ({ q: c.q, ids: c.ids.filter((i) => voice.get(i) === v) })).filter((c) => c.ids.length)
      vc.forEach((c, j) => {
        const next = vc[j + 1]?.q ?? Infinity
        const bar = barIndex(bars, c.q)
        const barEnd = bars[bar].q0 + bars[bar].ql
        const perfEnd = c.q + Math.max(...c.ids.map((i) => items[i].dq))
        const qb = c.q - bars[bar].q0
        const rest = Math.round((Math.min(perfEnd, next) - barEnd) * 12) / 12
        const tie = next > barEnd + 1e-6 && perfEnd - barEnd > 0.2 && rest >= 1 / 12
        const room = Math.min(next, barEnd) - c.q
        const qd = tie ? barEnd - c.q : snapDur(Math.min(perfEnd - c.q, room), room, isTripletPos(qb) || isTripletValue(room))
        const tuplet = isTripletPos(qb) || (!tie && isTripletValue(qd)) ? { num: 3, den: 2 } : undefined
        for (const i of c.ids) out[i] = { bar, qb, qd, voice: v, ...(tuplet && { tuplet }), ...(tie && { tieNext: true, qrest: rest }) }
      })
    }
    // graces sit on the note they lead into
    for (const i of mine.filter((i) => items[i].grace)) {
      const bar = barIndex(bars, items[i].q)
      out[i] = { bar, qb: items[i].q - bars[bar].q0, qd: 0.125, voice: 1, grace: true }
    }
  }
  return out
}

/** A note's written value cut at barlines, ready to draw: each piece says which neighbour it is tied to. */
export function tiedSegments(n: NOut, ql: number[]) {
  const segs = [{ bar: n.bar, qb: n.qb, qd: n.qd, tiePrev: false, tieNext: !!n.tieNext }]
  let left = n.qrest ?? 0
  for (let b = n.bar + 1; left > 1e-6 && b < ql.length; b++) {
    const qd = Math.min(left, ql[b])
    left -= qd
    segs.push({ bar: b, qb: 0, qd, tiePrev: true, tieNext: left > 1e-6 })
  }
  return segs
}

// ---- stage 1: positions from a performance ----

export interface QIn {
  tick: number
  dtick: number
  p: number
  hand: Hand
}
export interface QOpts {
  ppq: number
  sigs: { tick: number; n: number; den: number }[]
  tempos: { tick: number; bpm: number }[]
}
export interface QOut {
  q: number[] // snapped onset, quarters from tick 0
  dq: number[] // performed length, quarters
  grace: boolean[]
  bars: { tick: number; len: number; n: number; den: number }[]
  pickup: number // quarters in a short first bar, 0 for none
}

const CHORD_S = 0.04 // onsets this close, at the local tempo, are one chord
const EARLY = 0.12 // quarters: a note this early belongs to the next beat
const SIGMA = 0.05 // quarters of timing noise a grid has to explain
const SWITCH = 5 // cost of changing grid between two beats of one hand
const GRIDS = [
  { pos: [0, 0.25, 0.5, 0.75], pen: 0 },
  { pos: [0, 1 / 3, 2 / 3], pen: 1.5 },
  { pos: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875], pen: 4 },
]

interface Cluster {
  x: number // quarters
  dur: number // longest member
  ids: number[]
  q: number
  grace: boolean
  hand: Hand
}

export function quantize(notes: QIn[], o: QOpts): QOut {
  const { ppq } = o
  const bpmAt = (tick: number) => {
    let b = o.tempos[0]?.bpm ?? 120
    for (const t of o.tempos) if (t.tick <= tick) b = t.bpm
    return b
  }

  // chords: per hand, onsets within a tolerance of the first one, scaled to the local tempo
  const clusters: Cluster[] = []
  const byHand: Record<Hand, Cluster[]> = { R: [], L: [] }
  for (const hand of ['R', 'L'] as Hand[]) {
    const ids = notes.map((_, i) => i).filter((i) => notes[i].hand === hand).sort((a, b) => notes[a].tick - notes[b].tick)
    let first = -1
    let c: Cluster | undefined
    for (const i of ids) {
      if (!c || notes[i].tick - first > Math.min((CHORD_S * bpmAt(first) * ppq) / 60, 0.1 * ppq)) {
        first = notes[i].tick
        c = { x: 0, dur: 0, ids: [], q: 0, grace: false, hand }
        byHand[hand].push(c)
      }
      c.ids.push(i)
      c.dur = Math.max(c.dur, notes[i].dtick / ppq)
    }
    for (const k of byHand[hand]) k.x = k.ids.reduce((s, i) => s + notes[i].tick, 0) / k.ids.length / ppq
    // a very short note right before another one is a grace note, not a beat of its own
    byHand[hand].forEach((k, j, all) => (k.grace = k.dur < 0.1 && j + 1 < all.length && all[j + 1].x - k.x <= 0.5))
    clusters.push(...byHand[hand])
  }
  const live = clusters.filter((c) => !c.grace)

  // a pickup: the barlines that put long notes and the closing chord on the downbeat
  const sigs = o.sigs.length ? o.sigs : [{ tick: 0, n: 4, den: 4 }]
  const B = (sigs[0].n * 4) / sigs[0].den
  const limit = sigs[1] ? sigs[1].tick / ppq : Infinity
  const head = live.filter((c) => c.x < limit)
  let pickup = 0
  if (head.length >= 6) {
    const score = (u: number) => {
      const phase = (x: number) => (((x - u) % B) + B) % B
      const at = (x: number) => phase(x) < 0.15 || phase(x) > B - 0.15
      const last = head.reduce((m, c) => (c.x > m.x ? c : m))
      return head.reduce((s, c) => s + (at(c.x) ? 1 + Math.min(c.dur, B) : 0), 0) + (at(last.x) ? 0.1 * head.length * 2 : 0)
    }
    const base = score(0)
    let best = 0
    let top = base * 1.4
    for (let u = 0.5; u < B; u += 0.5) {
      const s = score(u)
      if (s > top && head[0].x < u - 0.2) (top = s), (best = u)
    }
    pickup = best
  }

  // bars in ticks
  const endTick = Math.max(0, ...notes.map((n) => n.tick + n.dtick))
  const bars: QOut['bars'] = []
  let tick = 0
  let si = 0
  if (pickup) {
    bars.push({ tick: 0, len: Math.round(pickup * ppq), n: sigs[0].n, den: sigs[0].den })
    tick = bars[0].len
  }
  while (tick <= endTick && bars.length < 5000) {
    while (si + 1 < sigs.length && sigs[si + 1].tick <= tick) si++
    const { n, den } = sigs[si]
    const len = Math.round((n * 4 * ppq) / den)
    bars.push({ tick, len, n, den })
    tick += len
  }
  const bq = bars.map((b) => ({ q0: b.tick / ppq, ql: b.len / ppq }))

  // onsets: exact files snap to the 1/24 lattice; performances pick a grid per hand and beat, following the drift
  const lat = ppq / 24
  if (live.every((c) => Math.abs(c.x * 24 - Math.round(c.x * 24)) * lat <= 1.5)) for (const c of live) c.q = Math.round(c.x * 24) / 24
  else {
    const wins = new Map<number, { b: number; k: number; cs: Cluster[] }>()
    for (const c of live) {
      const b = barIndex(bq, c.x + EARLY)
      const k = Math.max(0, Math.floor(c.x - bq[b].q0 + EARLY))
      const key = b * 1000 + k
      if (!wins.has(key)) wins.set(key, { b, k, cs: [] })
      wins.get(key)!.cs.push(c)
    }
    const W = [...wins].sort((a, b) => a[0] - b[0]).map(([, w]) => ({ origin: bq[w.b].q0 + w.k, room: bq[w.b].ql - w.k, cs: w.cs }))
    const mid = (xs: number[]) => xs.sort((a, b) => a - b)[xs.length >> 1]
    // Rubato: how far off the beat the player is, read only from onsets on the beat itself (every grid has a beat),
    // smoothed over the neighbouring beats. The grid never decides it, so a wrong grid cannot confirm itself.
    const late = W.map((w) => w.cs.map((c) => c.x - w.origin).filter((x) => Math.abs(x) <= EARLY))
    const drift = W.map((w) => {
      const near = (span: number) => late.flatMap((l, j) => (Math.abs(W[j].origin - w.origin) <= span ? l : []))
      const xs = near(3).length ? near(3) : near(8)
      return xs.length ? Math.max(-0.15, Math.min(0.15, mid(xs))) : 0
    })
    // The grid of a hand is chosen over the whole piece (Viterbi): a passage of triplets stays triplets, which one beat alone cannot show.
    for (const hand of ['R', 'L'] as Hand[]) {
      const seq: { i: number; cs: Cluster[]; cost: number[]; snap: number[][] }[] = []
      W.forEach((w, i) => {
        const cs = w.cs.filter((c) => c.hand === hand)
        if (!cs.length) return
        const r = cs.map((c) => c.x - drift[i] - w.origin)
        const snap = GRIDS.map((g) => {
          const pos = g.pos.filter((p) => p < w.room - 1e-6)
          return r.map((x) => pos.reduce((a, p) => (Math.abs(p - x) < Math.abs(a - x) ? p : a)))
        })
        const cost = GRIDS.map((g, k) => g.pen + r.reduce((s, x, j) => s + Math.min(((x - snap[k][j]) / SIGMA) ** 2, 9), 0))
        seq.push({ i, cs, cost, snap })
      })
      const back: number[][] = []
      let dp = seq[0]?.cost ?? []
      seq.forEach((e, n) => {
        if (!n) return
        dp = e.cost.map((c, k) => {
          const from = dp.map((v, j) => v + (j === k ? 0 : SWITCH))
          const j = from.indexOf(Math.min(...from))
          ;(back[n] ??= [])[k] = j
          return from[j] + c
        })
      })
      let k = dp.indexOf(Math.min(...dp))
      for (let n = seq.length - 1; n >= 0; n--) {
        seq[n].cs.forEach((c, j) => (c.q = W[seq[n].i].origin + seq[n].snap[k][j]))
        k = back[n]?.[k] ?? k
      }
    }
  }

  const q = new Array<number>(notes.length)
  const grace = new Array<boolean>(notes.length).fill(false)
  for (const hand of ['R', 'L'] as Hand[]) {
    const all = byHand[hand]
    all.forEach((c, j) => {
      const target = c.grace ? all.slice(j + 1).find((k) => !k.grace) : c
      for (const i of c.ids) {
        q[i] = target ? target.q : Math.round(c.x * 24) / 24
        grace[i] = c.grace
      }
    })
  }
  return { q, dq: notes.map((n) => n.dtick / ppq), grace, bars, pickup }
}
