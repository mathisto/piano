import { describe, expect, it } from 'vitest'
import { DEFAULT_EDGES } from './touch'
import { deviations, evenness, lines, live, tolerance, type Hit } from './even'

const run = (vs: number[], h: 'R' | 'L' = 'R', p0 = 60): Hit[] => vs.map((v, i) => ({ v, t: i * 0.25, p: p0 + i, h }))

describe('tolerance', () => {
  it('is a share of the calibrated range: 12, 8 and 5 on the default bands', () => {
    expect(['gentle', 'steady', 'strict'].map((c) => tolerance(DEFAULT_EDGES, c as 'gentle'))).toEqual([12, 8, 5])
  })
  it('follows a player with a narrow range', () => {
    expect(tolerance({ soft: 40, hard: 70 }, 'gentle')).toBe(9)
  })
})

describe('deviations', () => {
  it('a steady crescendo has none: each note sits where its neighbours put it', () => {
    const d = deviations([40, 45, 50, 55, 60, 65, 70, 75, 80]).slice(3, -3)
    expect(d.every((x) => Math.abs(x!) < 0.01)).toBe(true)
  })
  it('one loud note stands out and its neighbours barely move', () => {
    const d = deviations([60, 60, 60, 90, 60, 60, 60])
    expect(d[3]).toBe(30)
    expect(Math.abs(d[2]!)).toBeLessThan(1)
  })
  it('the first and last notes and anything under the noise floor are not judged', () => {
    const d = deviations([60, 10, 60, 60, 60])
    expect([d[0], d[1], d[4]]).toEqual([null, null, null])
  })
})

describe('lines', () => {
  it('splits the hands and keeps the top note of a chord', () => {
    const hits: Hit[] = [
      { v: 60, t: 0, p: 60, h: 'R' }, { v: 70, t: 0.01, p: 64, h: 'R' }, { v: 50, t: 0, p: 48, h: 'L' }, { v: 61, t: 1, p: 62, h: 'R' },
    ]
    const ls = lines(hits)
    expect(ls.map((l) => l.length)).toEqual([2, 1])
    expect(ls[0][0].p).toBe(64)
  })
})

describe('evenness', () => {
  it('an even scale rates even', () => {
    const e = evenness(run([62, 64, 63, 62, 65, 63, 64, 62, 63, 64]), DEFAULT_EDGES, 'gentle')!
    expect(e.rating).toBe('even')
    expect(e.hint).toBeUndefined()
  })
  it('a run too short to judge says nothing', () => {
    expect(evenness(run([60, 60, 60, 60, 60]), DEFAULT_EDGES, 'gentle')).toBeNull()
  })
  it('one stray loud note does not wreck the spread, only the share inside the band', () => {
    const e = evenness(run([62, 63, 62, 64, 100, 63, 62, 64, 63, 62]), DEFAULT_EDGES, 'gentle')!
    expect(e.spread).toBeLessThan(3)
    expect(e.inside).toBeLessThan(1)
    expect(e.rating).not.toBe('uneven')
  })
  it('a wild run is uneven', () => {
    const e = evenness(run([40, 90, 35, 100, 45, 85, 30, 95, 50, 88]), DEFAULT_EDGES, 'strict')!
    expect(e.rating).toBe('uneven')
  })
  it('the strict setting catches what the gentle one lets pass', () => {
    const vs = [60, 70, 58, 69, 61, 71, 59, 70, 60, 69]
    expect(evenness(run(vs), DEFAULT_EDGES, 'gentle')!.inside).toBeGreaterThan(evenness(run(vs), DEFAULT_EDGES, 'strict')!.inside)
  })
  it('says which note keeps coming out loud, once it has repeated', () => {
    // the same pitch class (60, 72, 84) lands 20 above the rest each time
    const hits: Hit[] = Array.from({ length: 24 }, (_, i) => ({ v: i % 3 === 0 ? 85 : 62, t: i * 0.25, p: i % 3 === 0 ? 60 : 62 + (i % 3), h: 'R' as const }))
    expect(evenness(hits, DEFAULT_EDGES, 'gentle')!.hint).toMatch(/^C4? runs about \d+ louder/)
  })
  it('says when one hand runs louder than the other', () => {
    const e = evenness([...run([80, 81, 79, 80, 82, 80, 81, 80], 'R'), ...run([55, 54, 56, 55, 54, 56, 55, 54], 'L', 40)], DEFAULT_EDGES, 'gentle')!
    expect(e.hint).toMatch(/right hand ran about 26 louder/)
  })
})

describe('live', () => {
  it('waits for three notes, then compares with the median of the last few', () => {
    expect(live([60, 60], 80)).toBeNull()
    expect(live([60, 61, 59, 60], 80)).toBe(20)
    expect(live([60, 61, 59, 60], 8)).toBeNull()
  })
})
