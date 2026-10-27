import { describe, expect, it } from 'vitest'
import { articulation, articulationReport, fixedAt, levelRuns, marksFor, melodyHand, seen, shapeReport, songLines, timing, voiceLine, voicing, type Press } from './coach'
import { fromMusicXml } from './musicxml'
import { touchPiece } from './score-fixtures'
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

describe('a real piece: following the written touch', () => {
  const song = fromMusicXml(touchPiece(), 'Touch', 'id') // 120 bpm: a quarter is 500 ms
  const E = DEFAULT_EDGES
  /** Every note struck on time; `hold` ms held and `vel` velocity per note. */
  const run = (hold: (n: Note) => number, vel: (n: Note, i: number) => number) => ({
    presses: song.notes.map((n, i) => ({ i, down: n.t * 1000, up: n.t * 1000 + hold(n) })),
    samples: song.notes.map((n, i) => ({ v: vel(n, i), h: n.h, p: n.p, t: n.t })),
  })
  const good = (n: Note) => (n.art === 'stac' ? 150 : n.slur ? 520 : 450)
  const shaped = (n: Note, i: number) => Math.round(30 + (n.v - 0.35) * 160 + (n.art === 'acc' ? 20 : 0) + (i % 2)) // follows the page, with a little noise
  const lines = (r: ReturnType<typeof run>) => songLines(song, r.presses, r.samples, E, 'steady', 1)

  it('played as written: nothing to say', () => {
    expect(lines(run(good, shaped))).toEqual([])
  })
  it('staccato held long and slurs lifted are each named', () => {
    const r = run((n) => (n.art === 'stac' ? 480 : n.slur ? 400 : 450), shaped)
    const a = articulationReport(song, r.presses)
    expect(a.map((f) => f.line).join()).toMatch(/8 of 8<\/b> staccato/)
    expect(a.map((f) => f.line).join()).toMatch(/7 of 7<\/b> joins had a gap/)
  })
  it('a flat crescendo and flat accents', () => {
    const r = run(good, (_, i) => 70 + (i % 3))
    const s = shapeReport(song, r.samples, E)
    expect(s.map((f) => f.line)).toContain('You played the crescendo in bars 5 to 8 as a flat line.')
    expect(s.map((f) => f.line).join()).toMatch(/4 of 4<\/b> accents/)
  })
  it('a crescendo played softer is named as such', () => {
    const r = run(good, (n, i) => (n.bar >= 4 && n.bar <= 7 ? 100 - (n.bar - 4) * 15 : shaped(n, i)))
    expect(shapeReport(song, r.samples, E)[0].line).toMatch(/crescendo in bars 5 to 8 getting softer/)
  })
  it('at most two lines, the most repeated first', () => {
    const r = run((n) => (n.art === 'stac' ? 480 : n.slur ? 400 : 450), (_, i) => 70 + (i % 3))
    const out = lines(r)
    expect(out).toHaveLength(2)
    expect(out[0]).toMatch(/staccato|crescendo/)
  })
  it('evenness only in the run written at one level', () => {
    expect(levelRuns(song.notes).map((l) => l.length)).toEqual([17]) // bars 1-4 and the hairpin's first note, still p; then the level moves, and accents break
    const r = run(good, (n, i) => (i < 16 ? (i % 4 === 2 ? 60 : 30) : shaped(n, i)))
    expect(shapeReport(song, r.samples, E).map((f) => f.line).join()).toMatch(/run in bars 1 to 5, written at one level/)
  })
  it('a MIDI file (no written marks) and Fixed key touch say nothing about shape', () => {
    const plain = { ...song, curve: undefined, notes: song.notes.map((n) => ({ ...n, art: undefined, slur: undefined })) }
    const r = run(() => 480, () => 70)
    expect(songLines(plain, r.presses, r.samples, E, 'steady', 1)).toEqual([])
    expect(shapeReport(song, r.samples, E)).toEqual([])
  })
  it('steps between soft and loud at bar lines', () => {
    // p, f, p, f in turn: four bar lines to follow, none followed
    const s = fromMusicXml(touchPiece().replace(/<direction placement="below"><direction-type><wedge[^]*?<\/direction>/g, '').replace('<measure number="2">', '<measure number="2"><direction><direction-type><dynamics><f/></dynamics></direction-type></direction>').replace('<measure number="3">', '<measure number="3"><direction><direction-type><dynamics><p/></dynamics></direction-type></direction>').replace('<measure number="4">', '<measure number="4"><direction><direction-type><dynamics><f/></dynamics></direction-type></direction>').replace('<measure number="5">', '<measure number="5"><direction><direction-type><dynamics><p/></dynamics></direction-type></direction>'), 't', 'id')
    const flat = s.notes.map((n, i) => ({ v: 70 + (i % 2), h: n.h, p: n.p, t: n.t }))
    expect(shapeReport(s, flat, E).map((f) => f.line).join()).toMatch(/at <b>5<\/b> bar lines; you followed <b>0<\/b>/)
    const follow = s.notes.map((n) => ({ v: n.v > 0.5 ? 100 : 40, h: n.h, p: n.p, t: n.t }))
    expect(shapeReport(s, follow, E).map((f) => f.line).join()).not.toMatch(/bar lines/)
  })
})
