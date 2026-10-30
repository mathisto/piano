import { describe, expect, it } from 'vitest'
import { beatAt, ticks } from './metronome'
import type { Bar } from './song'

const bar = (i: number, t0: number, t1: number, n = 4, den = 4, ql?: number): Bar => ({ i, t0, t1, n, den, ql })
const four = [bar(0, 0, 2), bar(1, 2, 4)] // 4/4 at 120 bpm

describe('ticks', () => {
  it('accents the downbeat of each bar and spaces beats evenly', () => {
    const t = ticks(four, 0, 4, false)
    expect(t.map((x) => x.t)).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5])
    expect(t.map((x) => x.kind[0]).join('')).toBe('dbbbdbbb')
  })
  it('is half-open, so consecutive windows never repeat or drop a click', () => {
    const w = [...ticks(four, 0, 0.7, false), ...ticks(four, 0.7, 2.2, false), ...ticks(four, 2.2, 9, false)]
    expect(w).toEqual(ticks(four, 0, 9, false))
  })
  it('adds eighths between beats', () => {
    const t = ticks(four, 0, 1, true)
    expect(t.map((x) => [x.t, x.kind])).toEqual([[0, 'down'], [0.25, 'sub'], [0.5, 'beat'], [0.75, 'sub']])
  })
  it('counts a dotted quarter in 6/8 and puts three eighths in it', () => {
    const six = [bar(0, 0, 1.5, 6, 8)] // 6/8, eighth = 0.25 s
    expect(ticks(six, 0, 9, false).map((x) => x.t)).toEqual([0, 0.75])
    expect(ticks(six, 0, 9, true).map((x) => x.t)).toEqual([0, 0.25, 0.5, 0.75, 1, 1.25])
  })
  it('follows tempo changes because it reads the bars', () => {
    const t = ticks([bar(0, 0, 2), bar(1, 2, 3)], 0, 9, false).map((x) => x.t) // second bar twice as fast
    expect(t).toEqual([0, 0.5, 1, 1.5, 2, 2.25, 2.5, 2.75])
  })
  it('spaces a pickup bar by the bar length and gives it no downbeat', () => {
    const t = ticks([bar(0, 0, 1, 4, 4, 2), bar(1, 1, 3)], 0, 3, false) // two quarters, then 4/4
    expect(t.map((x) => [x.t, x.kind])).toEqual([[0, 'beat'], [0.5, 'beat'], [1, 'down'], [1.5, 'beat'], [2, 'beat'], [2.5, 'beat']])
  })
  it('counts a half-beat pickup back from its end: its eighth is an off-beat, with no click of its own', () => {
    const t = ticks([bar(0, 0, 0.25, 4, 4, 0.5), bar(1, 0.25, 2.25)], 0, 1, true) // an eighth, then 4/4
    expect(t.map((x) => [x.t, x.kind])).toEqual([[0, 'sub'], [0.25, 'down'], [0.5, 'sub'], [0.75, 'beat']])
    expect(beatAt([bar(0, 0, 0.25, 4, 4, 0.5)], 0.1)).toEqual({ k: 0, n: 1 })
  })
  it('starts mid-song and in a loop window', () => {
    expect(ticks(four, 2.4, 3.1, false).map((x) => x.t)).toEqual([2.5, 3])
    expect(ticks(four, 5, 6, false)).toEqual([])
  })
})

describe('beatAt', () => {
  it('names the beat and the bar length', () => {
    expect(beatAt(four, 0)).toEqual({ k: 0, n: 4 })
    expect(beatAt(four, 1.6)).toEqual({ k: 3, n: 4 })
    expect(beatAt(four, 2)).toEqual({ k: 0, n: 4 })
    expect(beatAt(four, -1)).toBeNull()
    expect(beatAt(four, 4)).toBeNull()
  })
})
