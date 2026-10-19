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

import { assignHands } from './song'
import type { Raw } from './song'

describe('single-track hand split follows the line', () => {
  const at = (t: number, p: number): Raw => ({ t, d: 0.4, p, v: 0.7, track: 0 })
  it('keeps a melody that dips below the split in the right hand', () => {
    const raw = [at(0, 64), at(0, 40), at(1, 62), at(1, 43), at(2, 60), at(2, 40), at(3, 59), at(3, 43), at(4, 58), at(4, 40)]
    const h = assignHands(raw, 60)
    expect(raw.map((r, i) => [r.p, h[i]]).filter(([p]) => (p as number) >= 58).every(([, x]) => x === 'R')).toBe(true)
    expect(raw.map((r, i) => [r.p, h[i]]).filter(([p]) => (p as number) < 50).every(([, x]) => x === 'L')).toBe(true)
  })
  it('still splits a lone note far from either line by pitch', () => {
    const h = assignHands([at(0, 72), at(5, 48)], 60)
    expect(h).toEqual(['R', 'L'])
  })
})
