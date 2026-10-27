import { timing, type Timing } from './coach'
import { cardKey, type Card, type Stats } from './drill'
import type { Grade } from './judge'
import type { Hand } from './song'

/** Paced Sight Run: a metronome sets the pace, one card to a beat (or to two), and a miss does not stop it. This is the planning, the scoring and the tempo rule. */

export const PACE = { min: 30, max: 100, start: 50, step: 4 } // bpm
export const PACED_CARDS = 16 // an endless spec still has an end: a paced run is one unbroken pulse
const SLACK = 1.25 // the beat is a quarter longer than your usual time on a card
export const CLEAN = 0.9 // share of cards on the beat for a clean run
export const ROUGH = 0.6 // under this a run is rough
export const MIN_CARDS = 12 // a shorter run says too little to move the tempo

export interface Pace {
  bpm: number
  every: 1 | 2 // beats a card gets
}
/** What is kept per range: the tempo to offer next, clean days at it, rough runs in a row. */
export interface PaceMemo extends Pace {
  days: number[]
  rough: number
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const even = (n: number) => Math.round(n / 2) * 2
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** The tempo to offer: where the player left this range, else a beat a quarter slower than their usual time on these cards (two beats a card when that is slower than 40 bpm), else 50. */
export function suggest(pool: Card[], stats: Stats, memo?: PaceMemo): Pace & { why: string } {
  if (memo) return { bpm: memo.bpm, every: memo.every, why: 'where you left this range' }
  const rts = pool.flatMap((c) => (stats[cardKey(c)]?.n >= 3 ? [stats[cardKey(c)].rt] : []))
  if (rts.length < 3) return { bpm: PACE.start, every: 1, why: 'a gentle start' }
  const ms = median(rts) * SLACK
  const why = `a little under your usual ${(median(rts) / 1000).toFixed(1)} s a card`
  return ms <= 1500 ? { bpm: clamp(even(60000 / ms), 40, 80), every: 1, why } : { bpm: clamp(even(120000 / ms), PACE.min, 80), every: 2, why }
}

/** The start card's line: what the pulse is and what to do when you slip. */
export const paceHint = (p: Pace) => `${p.bpm} bpm, a card ${p.every === 1 ? 'every beat' : 'every two beats'}. If you slip, keep going: the next card is on the next beat.`

/** One note of the set as the judge left it: grade is undefined while its window is still open. */
export interface Struck {
  card: number
  p: number
  h: Hand
  t: number
  grade?: Grade
  off: number // ms from the beat, + is late
}

export interface Score {
  n: number // cards whose notes were all judged
  hit: number // of those, cards with every note on the beat
  cells: (boolean | undefined)[] // per card in order: on the beat, missed, or not reached
  missed: number[] // card indices
  timing: Timing | null
}

/** A card is on the beat when each of its notes was struck inside the window. Cards the run never reached are not counted. */
export function score(cards: Card[], notes: Struck[]): Score {
  const cells = cards.map((_, i) => {
    const ns = notes.filter((x) => x.card === i)
    return ns.length && ns.every((x) => x.grade) ? ns.every((x) => x.grade !== 'miss') : undefined
  })
  const hits = notes.flatMap((x) => (x.grade && x.grade !== 'miss' ? [{ t: x.t, p: x.p, h: x.h, off: x.off }] : []))
  return {
    n: cells.filter((c) => c !== undefined).length,
    hit: cells.filter(Boolean).length,
    cells,
    missed: cells.flatMap((c, i) => (c === false ? [i] : [])),
    timing: timing(hits),
  }
}

/** The tempo rule, like Ready: a clean run on two different days at the same tempo raises it a few bpm; two rough runs in a row lower it. A short run changes nothing. */
export function after(memo: PaceMemo | undefined, run: Pace & { n: number; hit: number; day: number }): { memo: PaceMemo; note: string } {
  const same = memo && memo.bpm === run.bpm && memo.every === run.every
  const cur: PaceMemo = memo ?? { bpm: run.bpm, every: run.every, days: [], rough: 0 }
  const share = run.n ? run.hit / run.n : 0
  const at = `${run.bpm} bpm`
  if (run.n < MIN_CARDS) return { memo: cur, note: `A run of ${MIN_CARDS} cards or more moves the tempo. Next time: ${cur.bpm} bpm.` }
  if (share >= CLEAN) {
    const days = [...new Set([...(same ? cur.days : []), run.day])].slice(-2)
    if (days.length >= 2) {
      const bpm = Math.min(PACE.max, run.bpm + PACE.step)
      return { memo: { bpm, every: run.every, days: [], rough: 0 }, note: `Clean on two days at ${at}. Next time: ${bpm} bpm.` }
    }
    return { memo: { bpm: run.bpm, every: run.every, days, rough: 0 }, note: `Clean at ${at}. A second clean day moves it up ${PACE.step}.` }
  }
  if (share < ROUGH) {
    const rough = (same ? cur.rough : 0) + 1
    if (rough >= 2) {
      const bpm = Math.max(PACE.min, run.bpm - PACE.step)
      return { memo: { bpm, every: run.every, days: [], rough: 0 }, note: `Two rough runs in a row at ${at}. Next time: ${bpm} bpm.` }
    }
    return { memo: { bpm: run.bpm, every: run.every, days: same ? cur.days : [], rough }, note: `Fast for now at ${at}. Another run like it and the tempo comes down ${PACE.step}.` }
  }
  return { memo: { bpm: run.bpm, every: run.every, days: same ? cur.days : [], rough: 0 }, note: `Not clean yet at ${at}: the tempo stays.` }
}
