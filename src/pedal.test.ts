import { describe, expect, it } from 'vitest'
import { changes, pedalLine, pedalReport, type PedalEv } from './pedal'
import { exercise } from './technique'
import { build, type Bar, type Raw } from './song'

// 120 bpm, 4/4: a quarter is 0.5 s, a bar 2 s. One chord a bar unless a bar is given as two.
// The changes are read from the bass, so F stands on its root: as F/C over the C before it (60, 65, 69) it would be no change.
const Q = 0.5
const CHORDS: Record<string, number[]> = { C: [60, 64, 67], F: [53, 57, 60], G: [59, 62, 67], Am: [57, 60, 64], Em: [59, 64, 67] }
const piece = (names: string[]) => {
  const raw: Raw[] = names.flatMap((c, b) => CHORDS[c].map((p) => ({ t: b * 4 * Q, d: 3.9 * Q, p, v: 0.7, track: 0, h: 'R' as const })))
  const bars: Bar[] = names.map((_, i) => ({ i, t0: i * 4 * Q, t1: (i + 1) * 4 * Q, n: 4, den: 4 }))
  return build('t', 't', raw, bars, 0)
}
const song = piece(['C', 'F', 'G', 'C'])
const press = (...t: number[]): PedalEv[] => t.map((x, i) => ({ t: x, down: i % 2 === 0 })) // down, up, down, up...

describe('changes', () => {
  it('finds the bar lines where the chord moves, and none inside a held chord', () => {
    expect(changes(song).map((c) => c.bar)).toEqual([1, 2, 3])
  })
  it('sees a change half way through a bar', () => {
    const raw: Raw[] = [60, 64, 67].map((p) => ({ t: 0, d: 0.9, p, v: 0.7, track: 0, h: 'R' as const }))
    raw.push(...CHORDS.F.map((p) => ({ t: 1, d: 0.9, p, v: 0.7, track: 0, h: 'R' as const })))
    const s = build('h', 'h', raw, [{ i: 0, t0: 0, t1: 2, n: 4, den: 4 }], 0)
    expect(changes(s)).toEqual([{ t: 1, bar: 0 }])
  })
  it('a passing note does not make a new chord', () => {
    const raw: Raw[] = [...CHORDS.C, 62].map((p, i) => ({ t: i === 3 ? 1 : 0, d: i === 3 ? 0.2 : 1.9, p, v: 0.7, track: 0, h: 'R' as const }))
    expect(changes(build('p', 'p', raw, [{ i: 0, t0: 0, t1: 2, n: 4, den: 4 }], 0))).toEqual([])
  })
  it('a bass shorter than a beat is passing, not a change', () => {
    const raw: Raw[] = [48, 60, 64, 67].map((p) => ({ t: 0, d: p === 48 ? 0.9 : 1.9, p, v: 0.7, track: 0, h: 'R' as const }))
    raw.push({ t: 1, d: 0.2, p: 47, v: 0.7, track: 0, h: 'L' }) // B under the second half of a C bar
    expect(changes(build('b', 'b', raw, [{ i: 0, t0: 0, t1: 2, n: 4, den: 4 }], 0))).toEqual([])
  })
})

describe('pedalReport', () => {
  it('lifting at each chord change and pressing again is clean', () => {
    // bar lines at 2, 4, 6 s: up just after, down again right behind
    const r = pedalReport(song, press(0, 2.1, 2.2, 4.1, 4.2, 6.1, 6.2, 7.9))!
    expect(r.changes).toBe(3)
    expect(r.blurred).toEqual([])
    expect(pedalLine(r)).toBe('Pedal: you lifted it and pressed it again with the chord every time (3 of 3).')
  })
  it('a lift a little before the change still counts as changing with it', () => {
    expect(pedalReport(song, press(0, 1.8, 1.9, 3.8, 3.9, 5.8, 5.9, 7.9))!.blurred).toEqual([])
  })
  it('a pedal held through every change is blurred, and the line says what to do', () => {
    const r = pedalReport(song, press(0, 7.9))!
    expect(r.blurred).toEqual([1, 2, 3])
    expect(pedalLine(r)).toContain('stayed down through all 3 chord changes')
  })
  it('a late lift (past the grace) is blurred; a lift just inside it is not', () => {
    expect(pedalReport(song, press(0, 2.4, 2.5, 4.1, 4.2, 6.1, 6.2, 7.9))!.blurred).toEqual([1])
    expect(pedalReport(song, press(0, 2.12, 2.2, 4.1, 4.2, 6.1, 6.2, 7.9))!.blurred).toEqual([])
  })
  it('the grace is a quarter of a beat but never under 150 ms', () => {
    expect(pedalReport(song, press(0, 2.14, 2.2, 4.1, 4.2, 6.1, 6.2, 7.9))!.blurred).toEqual([]) // 140 ms: past 0.25 beat at 120 bpm, inside 150 ms
  })
  it('lifts are measured from when the player struck the chord, when the judge has it', () => {
    const lifts = press(0, 2.35, 2.45, 4.35, 4.45, 6.35, 6.45, 7.9) // 350 ms after each written change
    expect(pedalReport(song, lifts)!.blurred).toEqual([1, 2, 3])
    const struck = song.notes.map((n) => n.t + 0.3) // every chord struck 300 ms late: the lifts come 50 ms after it
    expect(pedalReport(song, lifts, struck)!.blurred).toEqual([])
  })
  it('names the bars (1-based) and counts the clean ones', () => {
    const r = pedalReport(song, press(0, 2.1, 2.2, 7.9))!
    expect(r.changes).toBe(3)
    expect(pedalLine(r)).toBe('Pedal: you changed it with the chord 1 of 3 times; in bars 3 and 4 the old chord was still ringing under the new one.')
  })
  it('a pedal that is up at a change was not in play there: not counted', () => {
    // pedal down only through the third bar: one change touched, below the minimum
    expect(pedalReport(song, press(4.1, 6.1))).toBeNull()
  })
  it('no pedal at all says nothing', () => {
    expect(pedalReport(song, [])).toBeNull()
    expect(pedalReport(song, [{ t: 0, down: false }])).toBeNull()
  })
  it('a pedal already down when the run starts counts from the start', () => {
    expect(pedalReport(song, [{ t: -1e9, down: true }])!.blurred).toEqual([1, 2, 3])
  })
  it('more than three blurred bars are shortened', () => {
    const s = piece(['C', 'F', 'G', 'Am', 'F', 'C'])
    expect(pedalLine(pedalReport(s, press(0, 2.1, 2.2, 11.9))!)).toContain('bars 3, 4, 5 and 1 more')
  })
})

describe('the Technique pedal exercise', () => {
  it('is four chords I IV V I whose changes the coach finds, in major and minor', () => {
    for (const minor of [false, true]) {
      const ex = exercise({ pattern: 'pedal', tonic: minor ? 9 : 0, minor, dyn: 'medium', hands: 'both', bpm: 60 })
      expect(ex.notes).toHaveLength(16)
      expect(changes(ex).map((c) => c.bar)).toEqual([1, 2, 3])
    }
  })
})
