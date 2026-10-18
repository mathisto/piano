import { expect, it } from 'vitest'
import { STARTERS } from './starters'
import { fromSpec } from './song'

it('every starter parses and fills whole bars', () => {
  for (const s of STARTERS) {
    const song = fromSpec(s.spec)
    expect(song.notes.length).toBeGreaterThan(8)
    expect(song.notes.some((n) => n.h === 'R') && song.notes.some((n) => n.h === 'L')).toBe(true)
    const q = (s.spec.sig?.[0] ?? 4) * (4 / (s.spec.sig?.[1] ?? 4))
    for (const line of [s.spec.rh, s.spec.lh]) {
      const beats = line.trim().split(/\s+/).reduce((a, t) => a + Number(t.split(':')[1]), 0)
      expect(beats % q, `${s.spec.title} line is ${beats} beats, bar is ${q}`).toBeCloseTo(0, 5)
    }
  }
})
