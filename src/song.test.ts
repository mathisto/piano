import { describe, expect, it } from 'vitest'
import { fromSpec, parseName, estimateFifths } from './song'
import { clefFor, keySigSteps, spell } from './spell'

describe('spell', () => {
  it('spells by key signature', () => {
    expect(spell(61, 2)).toMatchObject({ letter: 0, acc: 1, oct: 4 }) // C# in D major
    expect(spell(70, -1)).toMatchObject({ letter: 6, acc: -1, oct: 4 }) // Bb in F major
    expect(spell(65, 1)).toMatchObject({ letter: 3, acc: 0 }) // F natural in G major
    expect(spell(61, -3)).toMatchObject({ letter: 1, acc: -1 }) // Db in Eb major
    expect(spell(60, 0).step).toBe(28)
  })
  it('puts middle C where each hand expects it', () => {
    expect(clefFor(60, 'R')).toBe('treble')
    expect(clefFor(60, 'L')).toBe('bass')
    expect(clefFor(72, 'L')).toBe('treble')
  })
  it('lays out key signatures', () => {
    expect(keySigSteps(2, 'treble')).toEqual([5 * 7 + 3, 5 * 7 + 0])
    expect(keySigSteps(-1, 'bass')).toEqual([2 * 7 + 6])
  })
})

describe('song', () => {
  it('parses note names', () => {
    expect([parseName('C4'), parseName('F#4'), parseName('Bb3'), parseName('A0')]).toEqual([60, 66, 58, 21])
  })
  it('builds bars and assigns hands from the two spec lines', () => {
    const s = fromSpec({ id: 't', title: 't', bpm: 120, fifths: 0, rh: 'C5:1 D5:1 E5:1 F5:1 G5:4', lh: 'C3+G3:4 C3+G3:4' })
    expect(s.bars).toHaveLength(2)
    expect(s.bars[1].t0).toBeCloseTo(2)
    expect(s.notes.filter((n) => n.h === 'L')).toHaveLength(4)
    expect(s.notes.find((n) => n.p === 79)?.bar).toBe(1)
    expect(s.notes.find((n) => n.p === 72)?.beats).toBeCloseTo(0.95, 2)
  })
  it('estimates a key from pitch classes', () => {
    const g = [67, 69, 71, 72, 74, 76, 78, 79].map((p) => ({ p, d: 1 }))
    expect(estimateFifths(g)).toBe(1)
  })
})
