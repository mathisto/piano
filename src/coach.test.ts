import { describe, expect, it } from 'vitest'
import { articulation, fixedAt, marksFor, melodyHand, seen, timing, voiceLine, voicing, type Press } from './coach'
import { DEFAULT_EDGES } from './touch'
import { evenness } from './even'
import type { Note } from './song'

const Q = 0.5 // a quarter at 120 bpm, seconds
const scale = (n = 10, h: 'R' | 'L' = 'R'): Note[] => Array.from({ length: n }, (_, i) => ({ id: i, t: i * Q, d: Q * 0.9, p: (h === 'R' ? 60 : 48) + i, v: 0.7, h, bar: 0, beats: 1 }))

describe('timing', () => {
  it('a constant lag is bias, not spread', () => {
    const x = timing(scale().map((n) => ({ ...n, off: 20 })))!
    expect(x.spread).toBe(0)
    expect(x.bias).toBe(20)
  })
  it('wobbling gaps show as spread while the mean offset stays the bias', () => {
    const offs = [0, 20, -10, 15, -5, 10, 0, 20, -10, 10]
    const x = timing(scale().map((n, i) => ({ ...n, off: offs[i] })))!
    expect(x.spread).toBeGreaterThan(10)
    expect(x.bias).toBe(5)
  })
  it('gaps are taken per hand, never across them', () => {
    const both = [...scale(8).map((n) => ({ ...n, off: 0 })), ...scale(8, 'L').map((n) => ({ ...n, off: 40 }))]
    expect(timing(both)!.spread).toBe(0)
  })
  it('too few notes say nothing', () => {
    expect(timing(scale(4).map((n) => ({ ...n, off: 0 })))).toBeNull()
  })
})

/** Key down on the beat (in ms), held for `hold` ms. */
const played = (notes: Note[], hold: (i: number) => number): Press[] => notes.map((n, i) => ({ i, down: n.t * 1000, up: n.t * 1000 + hold(i) }))

describe('articulation', () => {
  const notes = scale()
  it('legato: a slight overlap is smooth', () => {
    const a = articulation('legato', notes, played(notes, () => 530), 1)!
    expect(a.n).toBe(9)
    expect(a.ok).toBe(9)
    expect(a.typical).toBe(30)
  })
  it('legato: lifting early leaves a gap', () => {
    const a = articulation('legato', notes, played(notes, () => 400), 1)!
    expect(a.ok).toBe(0)
    expect(a.typical).toBe(-100)
  })
  it('legato: a long overlap blurs', () => {
    expect(articulation('legato', notes, played(notes, () => 800), 1)!.ok).toBe(0)
  })
  it('legato: a missed note leaves no join to judge on either side', () => {
    const ps = played(notes, () => 520).filter((x) => x.i !== 4)
    expect(articulation('legato', notes, ps, 1)!.n).toBe(7)
  })
  it('staccato: share of the written value, at the played tempo', () => {
    const a = articulation('staccato', notes, played(notes, () => 150), 1)!
    expect(a.ok).toBe(9)
    expect(a.typical).toBeCloseTo(0.3)
    // at half tempo a quarter lasts a second, so 400 ms held is short (at full tempo it would not be)
    const slow = articulation('staccato', notes, notes.map((n, i) => ({ i, down: n.t * 2000, up: n.t * 2000 + 400 })), 0.5)!
    expect(slow.ok).toBe(9)
  })
  it('staccato: a key held through is not short', () => {
    expect(articulation('staccato', notes, played(notes, () => 480), 1)!.ok).toBe(0)
  })
})

describe('voicing', () => {
  const s = [...Array(6).fill({ v: 80, h: 'R' }), ...Array(6).fill({ v: 60, h: 'L' })]
  it('the melody hand over the other, with an aim from the calibrated range', () => {
    expect(voicing(s, DEFAULT_EDGES, 'R')).toEqual({ melody: 'R', gap: 20, aim: 10 })
  })
  it('a left-hand melody is judged against the right, not the other way round', () => {
    const x = voicing(s, DEFAULT_EDGES, 'L')!
    expect(x.gap).toBe(-20)
    expect(voiceLine(x)).toContain('right hand ran <b>20</b> louder than the melody (left hand)')
  })
  it('says nothing without a clear melody hand', () => {
    expect(voicing(s, DEFAULT_EDGES, null)).toBeNull()
  })
  it('needs both hands', () => {
    expect(voicing(Array(8).fill({ v: 80, h: 'R' }), DEFAULT_EDGES, 'R')).toBeNull()
  })
})

describe('melodyHand', () => {
  const bars = (r: number[], l: number[]): Note[] => [...r.map((p, bar) => ({ id: bar, t: bar, d: 1, p, v: 0.7, h: 'R' as const, bar, beats: 1 })), ...l.map((p, bar) => ({ id: 99 + bar, t: bar, d: 1, p, v: 0.7, h: 'L' as const, bar, beats: 1 }))]
  it('is the right hand when it holds the top line', () => {
    expect(melodyHand(bars([72, 74, 76, 77], [48, 50, 52, 53]))).toBe('R')
  })
  it('is the left hand for a left-hand melody (cello line over high chords)', () => {
    expect(melodyHand(bars([60, 60, 60, 60], [67, 69, 71, 67]))).toBe('L')
  })
  it('is null when the hands trade the top line', () => {
    expect(melodyHand(bars([72, 50, 72, 50], [48, 60, 48, 60]))).toBeNull()
  })
  it('is null with a single hand', () => {
    expect(melodyHand(bars([72, 74, 76, 77], []))).toBeNull()
  })
})

describe('fixed key touch', () => {
  it('one velocity for every note is noticed, and is not rated even', () => {
    expect(fixedAt(Array(10).fill(64))).toBe(64)
    expect(fixedAt([64, 64, 65, 64])).toBeUndefined()
    expect(evenness(scale().map((n) => ({ v: 64, t: n.t, p: n.p, h: n.h })), DEFAULT_EDGES, 'gentle')).toBeNull()
  })
})

describe('fading the live marks', () => {
  it('full marks until three even runs in a row, then faint', () => {
    let s = seen(undefined, 'even')
    expect(marksFor(s, false)).toBe('full')
    s = seen(seen(s, 'even'), 'even')
    expect(s).toEqual({ runs: 3, even: 3 })
    expect(marksFor(s, false)).toBe('none') // run 4 is a test run
    s = seen(s, 'even')
    expect(marksFor(s, false)).toBe('faint')
    expect(marksFor(seen(s, 'nearly'), false)).toBe('full')
  })
  it('every 4th run is a test run, and Always show marks overrides both', () => {
    const due = [0, 1, 2, 3, 4, 5, 6, 7].map((runs) => marksFor({ runs, even: 0 }, false))
    expect(due).toEqual(['full', 'full', 'full', 'none', 'full', 'full', 'full', 'none'])
    expect(marksFor({ runs: 3, even: 9 }, true)).toBe('full')
  })
  it('a run too short to rate keeps the count', () => {
    expect(seen({ runs: 2, even: 2 }, undefined)).toEqual({ runs: 3, even: 2 })
  })
})
