import { describe, expect, it } from 'vitest'
import { RHYTHM } from './ear'
import { KEEP, endBeat, holdCards, keepCards, openBeat, pulseBars, pulseDeck, pulseText, scorePulse, subCards, SWING, type PulsePlay } from './pulse'
import { deckOf, TRAINERS } from './theory'

const play = (c: { play?: unknown }) => c.play as PulsePlay
const taps = (p: PulsePlay, f: (i: number, ms: number) => number) => p.want.map((b, i) => f(i, (b * 60000) / p.bpm))

describe('keep the beat', () => {
  it('clicks for two bars, is silent for the level, and the click returns', () => {
    for (const [level, s] of [[1, 1], [2, 2], [3, 4]]) {
      const p = play(keepCards(level)[0])
      expect(p.want).toEqual(Array.from({ length: 4 * s }, (_, i) => 8 + i))
      expect(p.clicks.filter((b) => b >= 8 && b < 8 + 4 * s)).toEqual([])
      expect(p.clicks.length).toBe(8 + 4)
      expect(p.clicks[p.clicks.length - 1]).toBe(8 + 4 * s + 3)
      expect(p.bars.filter((b) => b.silent).length).toBe(s)
    }
  })
  it('has unique ids and a keyboard open from the first click', () => {
    for (let l = 1; l <= 3; l++) {
      const d = keepCards(l)
      expect(new Set(d.map((c) => c.id)).size).toBe(d.length)
      expect(openBeat(play(d[0]))).toBe(0)
    }
  })
  it('names a speed-up in ms a beat, apart from bias and spread', () => {
    const p = play(keepCards(2)[0])
    const s = scorePulse(p, taps(p, (i, ms) => ms - 6 * i + 20))
    expect(s.drift).toBeCloseTo(-6, 5)
    expect(s.spread).toBeCloseTo(0, 5)
    expect(s.ok).toBe(true)
    expect(pulseText(s)).toMatch(/^You sped up by 6 ms a beat\. Bias 20 ms late, spread 0 ms\.$/)
  })
  it('a slow-down is positive drift; steady is said to be steady; a constant offset is bias only', () => {
    const p = play(keepCards(1)[0])
    expect(pulseText(scorePulse(p, taps(p, (i, ms) => ms + 9 * i)))).toMatch(/^You slowed down by 9 ms a beat/)
    const flat = scorePulse(p, taps(p, (_, ms) => ms + 40))
    expect(flat.drift).toBeCloseTo(0, 5)
    expect(flat.bias).toBeCloseTo(40, 5)
    expect(flat.ok).toBe(true) // bias is reported, not removed: 40 ms is inside the window
    expect(pulseText(flat)).toMatch(/^You held the beat steady\. Bias 40 ms late/)
  })
  it('fails on drift past the limit or a tap past the window, and says so', () => {
    const p = play(keepCards(3)[0])
    const fast = scorePulse(p, taps(p, (i, ms) => ms - (KEEP.maxDrift + 3) * i))
    expect(fast.ok).toBe(false)
    expect(pulseText(fast)).toMatch(/^The beat wandered too far\./)
    expect(scorePulse(p, taps(p, (i, ms) => ms + (i === 5 ? KEEP.window + 20 : 0))).ok).toBe(false)
  })
  it('ignores taps during the click bars, counts a missing one', () => {
    const p = play(keepCards(1)[0])
    const B = 60000 / p.bpm
    const silent = taps(p, (_, ms) => ms)
    expect(scorePulse(p, [0, B, 2 * B, ...silent, 12 * B, 13 * B]).ok).toBe(true)
    expect(scorePulse(p, silent.slice(1)).note).toBe('You tapped 3 of 4 beats.')
  })
  it('is judged when the click has returned', () => {
    const p = play(keepCards(1)[0])
    expect(endBeat(p)).toBe(8 + 4 + 4)
  })
})

describe('subdivisions', () => {
  it('level 1 to 3 are pure and the grid is two bars after a bar of click', () => {
    const per = [2, 3, 4]
    for (let l = 1; l <= 3; l++) {
      const p = play(subCards(l)[0])
      expect(p.want.length).toBe(2 * 4 * per[l - 1])
      expect(p.want[0]).toBe(4)
      expect(p.clicks.length).toBe(12)
      expect(openBeat(p)).toBe(3.5)
    }
  })
  it('mixed pairs two different kinds, swung among them, with the second eighth two thirds in', () => {
    const d = subCards(4)
    expect(new Set(d.map((c) => c.id)).size).toBe(d.length)
    expect(d.every((c) => play(c).bars[0].label !== play(c).bars[1].label)).toBe(true)
    const swung = d.map(play).find((p) => p.bars[0].label === 'swung eighths')!
    swung.bars[0].marks.slice(0, 4).forEach((m, i) => expect(m).toBeCloseTo([0, SWING, 1, 1 + SWING][i], 9))
  })
  it('removes the mean offset before judging', () => {
    const p = play(subCards(2)[0])
    expect(scorePulse(p, taps(p, (_, ms) => ms + 80)).ok).toBe(true)
    const s = scorePulse(p, taps(p, (_, ms) => ms + 80))
    expect(s.bias).toBeCloseTo(80, 5)
    expect(s.drift).toBeUndefined()
  })
  it('the window is a share of the gap to the neighbour: tight for sixteenths, never past the rhythm window', () => {
    const six = play(subCards(3).find((c) => play(c).bpm === 76)!)
    const gap = 60000 / 76 / 4
    const t = (off: number) => taps(six, (i, ms) => ms + (i === 9 ? off : 0))
    expect(scorePulse(six, t(0.3 * gap * 0.9)).ok).toBe(true) // the mean moves a little with one tap, so stay clear of the edge
    expect(scorePulse(six, t(0.7 * gap)).ok).toBe(false)
    const slow = play(subCards(1).find((c) => play(c).bpm === 60)!)
    expect(scorePulse(slow, taps(slow, (i, ms) => ms + (i === 3 ? RHYTHM.window + 40 : 0))).ok).toBe(false)
  })
  it('wrong count is a note, not a score', () => {
    const p = play(subCards(1)[0])
    expect(scorePulse(p, taps(p, (_, ms) => ms).slice(1)).note).toMatch(/^You tapped 15 of 16/)
  })
})

describe('hold a rhythm', () => {
  it('is the echo bars, tapped twice after a count-in bar, drawn as marks', () => {
    for (let l = 1; l <= 4; l++) {
      const d = holdCards(l)
      expect(d.length).toBeGreaterThan(3)
      const p = play(d[0])
      expect(p.want.length).toBe(2 * p.bars[0].marks.length)
      expect(p.want[0]).toBeGreaterThanOrEqual(4)
      expect(p.bars[0].aria).toMatch(/^Taps on 1/)
    }
  })
  it('uses the rhythm echo window: a tap past it fails, offset of the whole bar does not', () => {
    const p = play(holdCards(2)[0])
    expect(scorePulse(p, taps(p, (_, ms) => ms + 90)).ok).toBe(true)
    expect(scorePulse(p, taps(p, (i, ms) => ms + (i === 2 ? RHYTHM.window + 60 : 0))).ok).toBe(false)
  })
})

describe('the trainers', () => {
  it('each is listed once and deals its own deck', () => {
    for (const [id, levels] of [['keepbeat', 3], ['subdiv', 4], ['holdrhythm', 4]] as const) {
      expect(TRAINERS.filter((t) => t.id === id).length).toBe(1)
      expect(TRAINERS.find((t) => t.id === id)!.levels.length).toBe(levels)
      for (let l = 1; l <= levels; l++) expect(deckOf(id, l)).toEqual(pulseDeck(id, l))
    }
  })
  it('draws a dot for each wanted tap', () => {
    const p = play(subCards(2)[0])
    expect((pulseBars(p).match(/<b /g) ?? []).length).toBe(p.bars.reduce((n, b) => n + b.marks.length, 0))
    expect(pulseBars(play(keepCards(2)[0]))).toContain('pulse-bar silent')
  })
})
