import { describe, expect, it } from 'vitest'
import { ROOTS, pickSample } from './audio'

describe('piano samples', () => {
  it('has the 30 recordings, A0 to C8, every third semitone', () => {
    expect(ROOTS).toHaveLength(30)
    expect(ROOTS[0]).toEqual({ name: 'A0', midi: 21 })
    expect(ROOTS.at(-1)).toEqual({ name: 'C8', midi: 108 })
    expect(ROOTS.find((r) => r.name === 'C4')?.midi).toBe(60)
    expect(ROOTS.find((r) => r.name === 'Ds4')?.midi).toBe(63)
  })
  it('plays a recording as it is on its own pitch, and bends the nearest one otherwise', () => {
    expect(pickSample(60)).toEqual({ name: 'C4', rate: 1 })
    const d = pickSample(62) // D4 is two semitones above C4, one below D#4: bend the closer one down
    expect(d.name).toBe('Ds4')
    expect(d.rate).toBeCloseTo(2 ** (-1 / 12))
    for (let p = 21; p <= 108; p++) expect(Math.abs(Math.log2(pickSample(p).rate) * 12)).toBeLessThanOrEqual(1.5)
  })
})
