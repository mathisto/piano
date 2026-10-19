import { describe, expect, it } from 'vitest'
import { band, calibrate, velStats } from './touch'

describe('touch', () => {
  it('bands velocity into soft, medium, hard at the default edges', () => {
    expect([1, 45, 46, 85, 86, 127].map((v) => band(v))).toEqual(['soft', 'soft', 'medium', 'medium', 'hard', 'hard'])
  })

  it('uses a calibrated range when given one', () => {
    const cal = { soft: 30, hard: 70 } // upper edge of soft, lower edge of hard
    expect([30, 31, 69, 70].map((v) => band(v, cal))).toEqual(['soft', 'medium', 'medium', 'hard'])
  })

  it('summarises a run: mean, spread, hands, bands, histogram', () => {
    const s = velStats([
      { v: 40, h: 'R' },
      { v: 60, h: 'R' },
      { v: 80, h: 'L' },
      { v: 100, h: 'L' },
    ])
    expect(s.n).toBe(4)
    expect(s.mean).toBe(70)
    expect(s.sd).toBeCloseTo(Math.sqrt(500), 5)
    expect(s.hands.R).toEqual({ n: 2, mean: 50 })
    expect(s.hands.L).toEqual({ n: 2, mean: 90 })
    expect(s.bands).toEqual({ soft: 1, medium: 2, hard: 1 })
    expect(s.hist).toHaveLength(8)
    expect(s.hist.reduce((a, b) => a + b, 0)).toBe(4)
    expect(s.hist).toEqual([0, 0, 1, 1, 0, 1, 1, 0]) // 16-wide bins: 40, 60, 80, 100
  })

  it('is empty-safe', () => {
    const s = velStats([])
    expect(s.n).toBe(0)
    expect(s.mean).toBe(0)
    expect(s.hands.R.n).toBe(0)
  })
})

describe('calibrate', () => {
  it('puts each edge halfway between the means of neighbouring bands', () => {
    expect(calibrate([20, 30], [60, 70], [100, 110])).toEqual({ soft: 45, hard: 85 })
  })

  it('refuses a run where the bands do not rise clearly', () => {
    expect(calibrate([60, 62], [61, 63], [64, 66])).toBeNull()
    expect(calibrate([], [60], [100])).toBeNull()
  })
})

import { writtenTargets } from './touch'
import type { Note } from './song'

describe('registers', () => {
  it('reports the average strike by low, middle and high keys', () => {
    const s = velStats([
      { v: 40, h: 'L', p: 48 },
      { v: 50, h: 'L', p: 50 },
      { v: 70, h: 'R', p: 64 },
      { v: 90, h: 'R', p: 80 },
    ])
    expect(s.regions.low).toEqual({ n: 2, mean: 45 })
    expect(s.regions.mid).toEqual({ n: 1, mean: 70 })
    expect(s.regions.high).toEqual({ n: 1, mean: 90 })
  })
})

describe('play as written', () => {
  const note = (id: number, v: number): Note => ({ id, t: id, d: 0.5, p: 60, v, h: 'R', bar: 0, beats: 1 })
  it('leaves a file with flat dynamics alone', () => {
    expect(writtenTargets([note(0, 0.7), note(1, 0.7), note(2, 0.71)])).toBeNull()
  })
  it('maps the loudest and softest written notes onto the player\'s own soft and hard', () => {
    const w = writtenTargets([note(0, 0.3), note(1, 0.6), note(2, 0.9)], { soft: 40, hard: 90 })!
    const mid = (i: number) => (w[i][0] + w[i][1]) / 2
    expect(mid(0)).toBeLessThan(mid(1))
    expect(mid(1)).toBeLessThan(mid(2))
    expect(mid(0)).toBeLessThan(40) // the softest is inside soft
    expect(mid(2)).toBeGreaterThan(90) // the loudest is inside hard
    for (const [lo, hi] of w) {
      expect(lo).toBeGreaterThanOrEqual(1)
      expect(hi).toBeLessThanOrEqual(127)
    }
  })
})
