import { describe, expect, it } from 'vitest'
import { compareTakes, ghostOf, newTake, type Take } from './take'
import type { Bar, Note } from './song'

// two bars of 2 s, two notes each: C4 D4 | E4 F4
const bars = [0, 1].map((i): Bar => ({ i, t0: i * 2, t1: i * 2 + 2, n: 4, den: 4 }))
const notes = [60, 62, 64, 65].map((p, i) => ({ id: i, t: i, d: 0.5, p, v: 0.7, h: 'R', bar: i >> 1, beats: 1 }) as Note)
const song = { notes, bars }

const take = (keys: [p: number, t: number, i: number][], miss: number[] = [], o: Partial<Take> = {}): Take => ({
  ...newTake('perform', 1, false, notes.length),
  p: keys.map((k) => k[0]),
  v: keys.map(() => 80),
  t: keys.map((k) => k[1]),
  d: keys.map(() => 400),
  i: keys.map((k) => k[2]),
  miss,
  ...o,
})

describe('compareTakes', () => {
  it('per bar: share of right keys, and their mean offset; last time beside this run', () => {
    const now = take([[60, -20, 0], [62, 1020, 1], [64, 2000, 2], [65, 3040, 3]])
    const last = take([[60, 30, 0], [61, 1000, -1], [64, 2010, 2]], [1, 3])
    const c = compareTakes(song, now, last)!
    expect(c.bars[0][0]).toEqual({ acc: 1, off: 0 }) // -20 and +20
    expect(c.bars[1][0]).toEqual({ acc: 1, off: 20 })
    expect(c.bars[0][1]).toEqual({ acc: 1 / 3, off: 30 }) // one right, one wrong key, one missed note
    expect(c.bars[1][1]).toEqual({ acc: 0.5, off: 10 })
    expect(c.all[0].acc).toBe(1)
    expect(c.all[1].acc).toBeCloseTo(2 / 5)
  })
  it('offsets are at the speed you played: 100 song ms late at half tempo is 200 ms', () => {
    const c = compareTakes(song, take([[60, 100, 0]], [], { rate: 0.5 }), take([]))!
    expect(c.bars[0][0].off).toBe(200)
  })
  it('a bar with nothing played or due is empty, and a waiting run has no timing', () => {
    const c = compareTakes(song, take([[60, 50, 0]], [], { wait: true }), take([]))!
    expect(c.bars[0][0]).toEqual({ acc: 1, off: null })
    expect(c.bars[1][0]).toEqual({ acc: null, off: null })
    expect(c.bars[0][1]).toEqual({ acc: null, off: null })
  })
  it('takes from another arrangement are not compared', () => {
    expect(compareTakes(song, take([]), take([], [], { n: 9 }))).toBeNull()
  })
})

describe('ghostOf', () => {
  it('in time order, in seconds, with the hand of the note played or by register', () => {
    const g = ghostOf(take([[64, 2000, 2], [48, 500, -1], [60, 0, 0]]), { notes: notes.map((n, i) => (i === 0 ? { ...n, h: 'L' } : n)) })
    expect(g).toEqual({ p: [60, 48, 64], t: [0, 0.5, 2], d: [0.4, 0.4, 0.4], h: ['L', 'L', 'R'] })
  })
})
