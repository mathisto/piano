import { describe, expect, it } from 'vitest'
import { mix } from './audio'

const all = () => true

describe('mix: which recordings a hit blends', () => {
  it('a soft hit is the soft recording alone, a hard hit the hard one', () => {
    expect(mix(0.05, all)).toEqual([[0, 1]])
    expect(mix(1, all)).toEqual([[2, 1]])
  })
  it('between two recordings the gains are equal-power: their squares sum to one', () => {
    const m = mix(0.38, all)
    expect(m.map(([k]) => k)).toEqual([0, 1])
    expect(m.reduce((a, [, g]) => a + g * g, 0)).toBeCloseTo(1)
  })
  it('uses what has loaded: the medium layer alone while the others are still coming', () => {
    expect(mix(0.9, (k) => k === 1)).toEqual([[1, 1]])
    expect(mix(0.9, () => false)).toEqual([])
  })
  it('two recordings (soft, hard) split the strengths between them', () => {
    expect(mix(0.1, all, 2)).toEqual([[0, 1]])
    expect(mix(1, all, 2)).toEqual([[1, 1]])
    expect(mix(0.54, all, 2).map(([k]) => k)).toEqual([0, 1])
  })
})
