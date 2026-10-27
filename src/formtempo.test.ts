import { describe, expect, it } from 'vitest'
import { DEFAULT_BPM, formTempo, medianIoi, onsetsOf } from './formtempo'
import type { Song } from './song'

const steady = (gap: number, n = 40) => Array.from({ length: n }, (_, i) => i * gap)

describe('formTempo', () => {
  it('names a form in the table by its word, in any language or spelling', () => {
    const q = steady(1)
    expect(formTempo('Mazurka in C major, Op. 33 No. 3', q)).toEqual({ bpm: 140, form: 'mazurka' })
    expect(formTempo('Valse, [op. posth.]', q).form).toBe('waltz')
    expect(formTempo('Walzer h-moll', q).form).toBe('waltz')
    expect(formTempo('Éccosaise Étude', q).form).toBe('etude')
    expect(formTempo('Melodic Study, Op. 840', q).form).toBe('etude')
    expect(['Bourree', 'Bourrèe', 'Bourrée'].map((t) => formTempo(t, q).form)).toEqual(['bourrée', 'bourrée', 'bourrée'])
    expect(formTempo('Allemande', q).bpm).toBe(80)
  })
  it('falls back to 100 for a form that did not predict the pace, and for no form', () => {
    expect(formTempo('Minuet in B-flat', steady(1))).toEqual({ bpm: DEFAULT_BPM })
    expect(formTempo('Goldberg Variations - 3', steady(1))).toEqual({ bpm: DEFAULT_BPM })
  })
  it('slows a piece whose median gap would play faster than 8 onsets a second, and never goes under 40', () => {
    expect(medianIoi(steady(0.25))).toBe(0.25)
    expect(formTempo('x', steady(0.25)).bpm).toBe(100) // 6.7 a second at 100
    expect(formTempo('x', steady(0.125)).bpm).toBe(60) // 8 a second at 60, not 13 at 100
    expect(formTempo('Etude', steady(0.125)).bpm).toBe(60) // the form's 138 is slowed too
    expect(formTempo('x', steady(0.03)).bpm).toBe(40)
    expect(formTempo('x', []).bpm).toBe(100) // too little to measure
  })
  it('onsetsOf counts a chord once and gives quarters across bars and a pickup', () => {
    const n = (bar: number, qb: number, grace = false) => ({ bar, qb, grace }) as never
    const s = { bars: [{ n: 4, den: 4, ql: 1 }, { n: 3, den: 4 }, { n: 3, den: 4 }], notes: [n(0, 0), n(1, 0), n(1, 0), n(1, 1.5), n(2, 0), n(2, 2.9, true)] } as unknown as Song
    expect(onsetsOf(s)).toEqual([0, 1, 2.5, 4])
  })
})
