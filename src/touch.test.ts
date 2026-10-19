import { describe, expect, it } from 'vitest'
import { band, velStats } from './touch'

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
