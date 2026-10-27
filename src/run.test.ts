import { describe, expect, it } from 'vitest'
import { DEFAULT_RUN, LIMITS, award, base, closeness, deal, mult, newArcade, over, pace, runCards, runPitches, widened, type RunSpec } from './run'

const spec = (o: Partial<RunSpec> = {}): RunSpec => ({ ...DEFAULT_RUN, ...o })
// a repeatable stream of "random" numbers
const seeded = (seed = 7) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646

describe('what a run can deal', () => {
  it('naturals only by default, every key with sharps or flats', () => {
    expect(runPitches(spec({ lo: 60, hi: 72 }))).toEqual([60, 62, 64, 65, 67, 69, 71, 72])
    expect(runPitches(spec({ lo: 60, hi: 72, acc: 'sharp' }))).toHaveLength(13)
  })
  it('a key signature deals only that key, and draws the signature', () => {
    const g = runCards(spec({ lo: 67, hi: 79, fifths: 1 }))
    expect(g.map((c) => c.pitches[0] % 12)).not.toContain(5) // no F natural in G major
    expect(g.map((c) => c.pitches[0] % 12)).toContain(6)
    expect(g.every((c) => c.fifths === 1)).toBe(true)
  })
  it('flats are written as flats, and only on black keys', () => {
    const cs = runCards(spec({ lo: 60, hi: 64, acc: 'flat' }))
    expect(cs.filter((c) => c.flat).map((c) => c.pitches[0])).toEqual([61, 63])
  })
  it('the clef pins the staff: treble is the right hand, bass the left, grand splits at middle C', () => {
    expect(runCards(spec({ clef: 'treble', lo: 57, hi: 60 })).every((c) => c.hand === 'R')).toBe(true)
    expect(runCards(spec({ clef: 'bass', lo: 48, hi: 55 })).every((c) => c.hand === 'L')).toBe(true)
    expect(runCards(spec({ clef: 'grand', lo: 55, hi: 64 })).map((c) => c.hand)).toEqual(['L', 'L', 'L', 'R', 'R', 'R'])
  })
  it('intervals and triads stay inside the range', () => {
    for (const size of [2, 3] as const) {
      const cs = runCards(spec({ size, lo: 60, hi: 72 }))
      expect(cs.length).toBeGreaterThan(0)
      expect(cs.every((c) => c.pitches.length === size && Math.max(...c.pitches) <= 72)).toBe(true)
    }
  })
})

describe('dealing', () => {
  const pool = runCards(spec({ lo: 48, hi: 84, clef: 'grand' }))
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const leaps = (near: number) => {
    const d = deal(pool, {}, spec({ near }), 400, undefined, seeded())
    return mean(d.slice(1).map((c, i) => Math.abs(c.pitches[0] - d[i].pitches[0])))
  }
  it('never the same card twice running', () => {
    const d = deal(pool, {}, spec(), 300, undefined, seeded())
    expect(d.slice(1).every((c, i) => c !== d[i])).toBe(true)
  })
  it('the first card avoids the one before the set', () => {
    expect(deal(pool, {}, spec(), 1, pool[3], seeded(3))[0]).not.toBe(pool[3])
  })
  it('the neighbour slider shortens the leaps', () => {
    expect(leaps(1)).toBeLessThan(leaps(0.5))
    expect(leaps(0.5)).toBeLessThan(leaps(0))
    expect(leaps(1)).toBeLessThan(4)
  })
  it('closeness is flat at zero and falls with distance', () => {
    expect(closeness(12, 0)).toBe(1)
    expect(closeness(12, 0.8)).toBeLessThan(closeness(2, 0.8))
  })
  it('the weak-notes slider deals the slow note more often', () => {
    const slow = pool[5]
    const stats = Object.fromEntries(pool.map((c) => [`1:${c.hand === 'R' ? 'treble' : 'bass'}:${c.pitches[0]}`, { n: 20, clean: 1, rt: 800 }]))
    stats[`1:${slow.hand === 'R' ? 'treble' : 'bass'}:${slow.pitches[0]}`] = { n: 20, clean: 0.3, rt: 6000 }
    const count = (weak: number) => deal(pool, stats, spec({ weak, near: 0 }), 2000, undefined, seeded()).filter((c) => c === slow).length
    expect(count(1)).toBeGreaterThan(count(0) * 1.8)
  })
})

describe('widening', () => {
  it('adds a white note at the top, then the bottom, and stops at the clef limit', () => {
    const s = spec({ lo: 60, hi: 72 })
    const a = widened(s, 0)
    expect([a.lo, a.hi]).toEqual([60, 74])
    const b = widened(a, 1)
    expect([b.lo, b.hi]).toEqual([59, 74])
    const top = spec({ lo: 60, hi: LIMITS.treble[1] })
    expect(widened(top, 0).hi).toBe(LIMITS.treble[1])
  })
})

describe('the arcade', () => {
  it('the multiplier climbs every five clean cards and stops at eight', () => {
    expect([0, 4, 5, 10, 34, 35, 99].map(mult)).toEqual([1, 1, 2, 3, 7, 8, 8])
  })
  it('faster answers score more, and the pace tightens with the combo', () => {
    expect(base(1000, 3000)).toBeGreaterThan(base(2500, 3000))
    expect(base(2500, 3000)).toBeGreaterThan(base(4000, 3000))
    expect(pace(3000, 0)).toBe(3000)
    expect(pace(3000, 40)).toBeLessThan(2000)
  })
  it('a clean card scores and builds the combo; a miss clears it', () => {
    const s = spec({ mode: 'arcade' })
    let a = newArcade(s)
    for (let i = 0; i < 6; i++) a = award(a, s, true, 1000)
    expect(a.streak).toBe(6)
    expect(a.score).toBe(150 * 5 + 150 * 2) // five at x1, the sixth at x2
    a = award(a, s, false, 1000)
    expect([a.streak, a.best, a.score]).toEqual([0, 6, 1050])
  })
  it('three misses end a run only when lives are on', () => {
    const on = spec({ lives: true })
    let a = newArcade(on)
    for (let i = 0; i < 3; i++) a = award(a, on, false, 0)
    expect(over(a, on)).toBe(true)
    const off = spec()
    expect(over(award(newArcade(off), off, false, 0), off)).toBe(false)
  })
})
