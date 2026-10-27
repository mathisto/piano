import { describe, expect, it } from 'vitest'
import { cardKey, deckSong, noteCards, type Card, type Stats } from './drill'
import { after, MIN_CARDS, PACE, paceHint, score, suggest, type PaceMemo, type Struck } from './paced'

const card = (p: number, more: number[] = []): Card => ({ pitches: [p, ...more], hand: 'R' })
const pool = [60, 62, 64, 65, 67].map((p) => card(p))
const seen = (rt: number): Stats => Object.fromEntries(pool.map((c) => [cardKey(c), { n: 5, clean: 1, rt }]))

describe('planning: the tempo to offer', () => {
  it('50 bpm, a card a beat, with no history', () => {
    expect(suggest(pool, {})).toMatchObject({ bpm: PACE.start, every: 1 })
    expect(suggest(pool, { [cardKey(pool[0])]: { n: 9, clean: 1, rt: 900 } })).toMatchObject({ bpm: PACE.start }) // one card says too little
  })
  it('a beat a quarter slower than the usual time on a card', () => {
    expect(suggest(pool, seen(1200))).toMatchObject({ bpm: 40, every: 1 }) // 1.5 s a beat
    expect(suggest(pool, seen(800))).toMatchObject({ bpm: 60, every: 1 })
  })
  it('never quick to begin with, and two beats a card when one beat would be under 40 bpm', () => {
    expect(suggest(pool, seen(300)).bpm).toBe(80)
    expect(suggest(pool, seen(2400))).toMatchObject({ bpm: 40, every: 2 }) // 3 s a card
    expect(suggest(pool, seen(9000))).toMatchObject({ bpm: PACE.min, every: 2 })
  })
  it('where the player left the range wins over history', () => {
    const memo: PaceMemo = { bpm: 58, every: 1, days: [], rough: 0 }
    expect(suggest(pool, seen(3000), memo)).toMatchObject({ bpm: 58, every: 1 })
  })
})

describe('the song a paced run plays', () => {
  const d = [card(60), card(64), card(67, [71])]
  it('cards sit on the beats of a real tempo, two beats apart when asked', () => {
    const one = deckSong('x', 'x', d, 0, { bpm: 60, every: 1 })
    expect(one.notes.map((n) => n.t)).toEqual([0, 1, 2, 2])
    const two = deckSong('x', 'x', d, 0, { bpm: 50, every: 2 })
    expect(two.notes.map((n) => +n.t.toFixed(3))).toEqual([0, 2.4, 4.8, 4.8])
    expect(two.spb).toBeCloseTo(1.2)
    expect(noteCards(d, two, { bpm: 50, every: 2 })).toEqual([0, 1, 2, 2])
  })
})

describe('scoring', () => {
  const cards = [card(60), card(62), card(64, [67]), card(65)]
  const s = (card: number, p: number, grade: Struck['grade'], off = 0, t = card): Struck => ({ card, p, h: 'R', t, grade, off })
  it('counts cards on the beat and names the ones missed', () => {
    const r = score(cards, [s(0, 60, 'perfect'), s(1, 62, 'miss'), s(2, 64, 'good'), s(2, 67, 'great'), s(3, 65, 'good')])
    expect([r.n, r.hit, r.missed]).toEqual([4, 3, [1]])
    expect(r.cells).toEqual([true, false, true, true])
  })
  it('a chord with one note missing is a missed card', () => {
    const r = score(cards, [s(0, 60, 'good'), s(1, 62, 'good'), s(2, 64, 'good'), s(2, 67, 'miss'), s(3, 65, 'good')])
    expect(r.missed).toEqual([2])
  })
  it('cards not reached are left out of the count', () => {
    const r = score(cards, [s(0, 60, 'good'), s(1, 62, 'miss'), s(2, 64, undefined), s(2, 67, undefined), s(3, 65, undefined)])
    expect([r.n, r.hit]).toEqual([2, 1])
    expect(r.cells).toEqual([true, false, undefined, undefined])
  })
  it('timing comes from the existing code: bias in ms, + is late', () => {
    const many = Array.from({ length: 10 }, (_, i) => card(60 + i))
    const r = score(many, many.map((c, i) => s(i, c.pitches[0], 'good', [10, 60, 30, 70, 20, 50, 40, 55, 15, 0][i], i)))
    expect(r.timing?.bias).toBeCloseTo(35)
    expect(r.timing?.spread).toBeGreaterThan(0)
  })
})

describe('the tempo rule', () => {
  const run = (o: Partial<Parameters<typeof after>[1]> = {}) => ({ bpm: 50, every: 1 as const, n: 16, hit: 16, day: 100, ...o })
  it('one clean day does not raise the tempo', () => {
    const r = after(undefined, run())
    expect(r.memo).toMatchObject({ bpm: 50, days: [100] })
  })
  it('a second clean day at the same tempo raises it a few bpm, and starts the count again', () => {
    const a = after(undefined, run()).memo
    expect(after(a, run({ day: 100 })).memo.bpm).toBe(50) // the same day twice is still one day
    const b = after(a, run({ day: 101 }))
    expect(b.memo).toMatchObject({ bpm: 50 + PACE.step, days: [] })
    expect(b.note).toMatch(/two days/)
  })
  it('a clean run at another tempo starts a new count there', () => {
    const a = after(undefined, run()).memo
    expect(after(a, run({ bpm: 56, day: 101 })).memo).toMatchObject({ bpm: 56, days: [101] })
  })
  it('between clean and rough changes nothing', () => {
    const a = after(undefined, run()).memo
    expect(after(a, run({ hit: 12, day: 101 })).memo).toMatchObject({ bpm: 50, days: [100], rough: 0 })
  })
  it('two rough runs in a row lower the tempo; a decent one between breaks the row', () => {
    const one = after(undefined, run({ hit: 5 })).memo
    expect(one.rough).toBe(1)
    expect(after(one, run({ hit: 5 })).memo.bpm).toBe(50 - PACE.step)
    const mid = after(one, run({ hit: 12 })).memo
    expect(after(mid, run({ hit: 5 })).memo).toMatchObject({ bpm: 50, rough: 1 })
  })
  it('stays inside the limits and a short run moves nothing', () => {
    expect(after({ bpm: PACE.min, every: 1, days: [], rough: 1 }, run({ bpm: PACE.min, hit: 2 })).memo.bpm).toBe(PACE.min)
    expect(after({ bpm: PACE.max, every: 1, days: [99], rough: 0 }, run({ bpm: PACE.max, day: 100 })).memo.bpm).toBe(PACE.max)
    const m: PaceMemo = { bpm: 50, every: 1, days: [99], rough: 0 }
    expect(after(m, run({ n: MIN_CARDS - 1, hit: MIN_CARDS - 1 })).memo).toEqual(m)
  })
})

it('the start card says what to do when you slip', () => {
  expect(paceHint({ bpm: 50, every: 2 })).toMatch(/50 bpm, a card every two beats.*keep going/)
})
