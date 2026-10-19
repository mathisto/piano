import { describe, expect, it } from 'vitest'
import { exercise, type Opts } from './technique'
import { DEFAULT_EDGES } from './touch'

const base: Opts = { pattern: 'five', tonic: 0, dyn: 'medium', hands: 'R', bpm: 80 }
const mk = (o: Partial<Opts> = {}) => exercise({ ...base, ...o }, DEFAULT_EDGES)

describe('technique exercises', () => {
  it('five-finger C goes up and back down on the white keys', () => {
    expect(mk().notes.map((n) => n.p)).toEqual([60, 62, 64, 65, 67, 65, 64, 62, 60])
  })

  it('scales climb an octave and come back, in the tonic', () => {
    const p = mk({ pattern: 'scale', tonic: 7 }).notes.map((n) => n.p)
    expect(p.slice(0, 8)).toEqual([67, 69, 71, 72, 74, 76, 78, 79])
    expect(p[p.length - 1]).toBe(67)
    expect(mk({ pattern: 'scale', tonic: 7 }).fifths).toBe(1)
  })

  it('arpeggios stack thirds', () => {
    expect(mk({ pattern: 'arp' }).notes.map((n) => n.p).slice(0, 4)).toEqual([60, 64, 67, 72])
  })

  it('both hands play together, the left an octave down', () => {
    const s = mk({ hands: 'both' })
    expect(s.notes).toHaveLength(18)
    expect(s.notes.filter((n) => n.h === 'L').map((n) => n.p)[0]).toBe(48)
  })

  it('steady dynamics aim every note at one band', () => {
    expect(new Set(mk({ dyn: 'soft' }).notes.map((n) => n.want!.join()))).toEqual(new Set(['1,45']))
    expect(new Set(mk({ dyn: 'hard' }).notes.map((n) => n.want!.join()))).toEqual(new Set(['86,127']))
  })

  it('a crescendo raises the target note by note and a decrescendo lowers it', () => {
    const c = mk({ dyn: 'cresc' }).notes.map((n) => (n.want![0] + n.want![1]) / 2)
    expect(c[c.length - 1]).toBeGreaterThan(c[0] + 40)
    expect([...c].sort((a, b) => a - b)).toEqual(c)
    const d = mk({ dyn: 'decresc' }).notes.map((n) => (n.want![0] + n.want![1]) / 2)
    expect(d[0]).toBeGreaterThan(d[d.length - 1] + 40)
  })

  it('accent puts a hard note on the first beat of each bar and medium elsewhere', () => {
    const s = mk({ dyn: 'accent' })
    s.notes.forEach((n) => expect(n.want![0]).toBe(n.t % (4 * s.spb) < 1e-6 ? 86 : 46))
  })

  it('keeps targets in range and bars in four', () => {
    const s = mk({ dyn: 'cresc', pattern: 'scale' })
    for (const n of s.notes) {
      expect(n.want![0]).toBeGreaterThanOrEqual(1)
      expect(n.want![1]).toBeLessThanOrEqual(127)
    }
    expect(s.bars[0].n).toBe(4)
    expect(s.spb).toBeCloseTo(60 / 80)
  })
})
