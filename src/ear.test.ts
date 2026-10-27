import { describe, expect, it } from 'vitest'
import { RHYTHM, beatMs, biasText, degreeCards, grid, intervalCards, playCards, rhythmCards, scoreTaps } from './ear'
import { check, deckOf } from './theory'

const pc = (n: number) => ((n % 12) + 12) % 12

describe('play it back', () => {
  it('deals the same phrases every time, 2 to 5 notes, one step per note', () => {
    for (let l = 1; l <= 6; l++) {
      const a = playCards(l)
      expect(a.map((c) => c.id)).toEqual(playCards(l).map((c) => c.id))
      expect(a.length).toBeGreaterThan(30)
      for (const c of a) expect(c.steps.length).toBeGreaterThanOrEqual(2), expect(c.steps.length).toBeLessThanOrEqual(5)
    }
  })
  it('the answer is the notes that sound, in order, in any octave', () => {
    const c = playCards(3)[0]
    const ps = (c.play as { ev: { p: number[] }[] }).ev.map((e) => e.p[0])
    ps.forEach((p, i) => expect(check(c.steps[i], [p + 12])).toBe(true))
    expect(check(c.steps[0], [ps[0] + 1])).toBe(false)
  })
  it('level 1 moves by step in C major; level 2 adds thirds; level 3 has leaps', () => {
    const jumps = (l: number) => playCards(l).flatMap((c) => { const e = (c.play as { ev: { p: number[] }[] }).ev.map((x) => x.p[0]); return e.slice(1).map((p, i) => Math.abs(p - e[i])) })
    expect(Math.max(...jumps(1))).toBeLessThanOrEqual(2)
    expect(Math.max(...jumps(2))).toBeLessThanOrEqual(4)
    expect(Math.max(...jumps(3))).toBeGreaterThan(5)
    for (const c of playCards(1)) for (const s of c.steps) expect([0, 2, 4, 5, 7, 9, 11]).toContain(s.pcs[0])
  })
  it('level 5 is minor; level 6 has a note off the scale in every phrase', () => {
    expect(playCards(5).every((c) => c.prompt.includes('minor'))).toBe(true)
    for (const c of playCards(6)) {
      const tonic = Number(c.id.split(':')[3])
      expect(c.steps.some((s) => ![0, 2, 4, 5, 7, 9, 11].includes((s.pcs[0] - tonic + 12) % 12))).toBe(true)
    }
  })
})

describe('intervals', () => {
  it('the answer is the second note, the upper one when together', () => {
    const cs = intervalCards(1)
    const up = cs.find((c) => c.id === 'ear:iv:4:up:0')!
    expect(check(up.steps[0], [76])).toBe(true) // E
    const down = cs.find((c) => c.id === 'ear:iv:3:down:4')!
    expect(check(down.steps[0], [61])).toBe(true) // E down a minor 3rd is C♯
    const both = cs.find((c) => c.id === 'ear:iv:2:both:0')!
    expect((both.play as { ev: { p: number[] }[] }).ev[0].p).toEqual([60, 62])
    expect(check(both.steps[0], [74])).toBe(true)
  })
  it('levels hold their interval sets, and the octave must be the octave', () => {
    const ns = (l: number) => new Set(intervalCards(l).map((c) => c.id.split(':')[2]))
    expect([...ns(2)].sort()).toEqual(['5', '7'])
    expect([...ns(4)]).toEqual(['12'])
    expect(ns(5).size).toBe(12)
    const oct = intervalCards(4).find((c) => c.id === 'ear:iv:12:up:0')!
    expect(check(oct.steps[0], [72])).toBe(true)
    expect(check(oct.steps[0], [60])).toBe(false) // the same note is not the octave
  })
})

describe('scale degrees', () => {
  it('a cadence then the degree; the answer is its pitch class', () => {
    const c = degreeCards(3).find((x) => x.id === 'ear:deg:7:5')! // degree 5 of G
    const ev = (c.play as { ev: { p: number[] }[] }).ev
    expect(ev).toHaveLength(5)
    expect(pc(ev[4].p[0])).toBe(2)
    expect(check(c.steps[0], [62])).toBe(true)
    expect(c.show).toBe('Degree 5 of G major: D')
    expect(c.prompt).not.toMatch(/5|G/) // the prompt must not give the answer away
  })
  it('level 1 is degrees 1, 3 and 5 in three keys', () => expect(degreeCards(1)).toHaveLength(9))
})

describe('rhythm cards', () => {
  const on = (l: number) => rhythmCards(l).map((c) => (c.play as { onsets: number[] }).onsets)
  it('level 1 is quarters and halves: five bars', () => {
    expect(on(1)).toHaveLength(5)
    expect(on(1).every((o) => o.every((x) => x % 2 === 0))).toBe(true)
  })
  it('level 2 has eighths, level 3 a dotted quarter, level 4 syncopation', () => {
    expect(on(2).every((o) => o.some((x) => x % 2 === 1))).toBe(true)
    expect(on(3).every((o) => o.some((x, i) => o[i + 1] - x === 3))).toBe(true)
    expect(on(4).length).toBeGreaterThan(10)
    expect(on(4).every((o) => o.some((x, i) => x % 2 === 1 && o[i + 1] !== x + 1 && x !== 7))).toBe(true)
  })
  it('every bar starts on the downbeat and fits the bar', () => {
    for (let l = 1; l <= 4; l++) for (const o of on(l)) expect(o[0]).toBe(0), expect(Math.max(...o)).toBeLessThan(8)
  })
  it('draws the bar as cells', () => expect(grid([0, 2, 3, 6])).toBe('x· xx ·· x·'))
  it('is reachable through the trainer list', () => expect(deckOf('rhythm', 1)).toHaveLength(5))
})

describe('scoring taps', () => {
  const B = beatMs()
  const onsets = [0, 2, 4, 6] // four quarters
  const grid4 = onsets.map((o) => (o * B) / 2)
  it('a perfect bar has no bias and no spread', () => {
    const r = scoreTaps(onsets, grid4)
    expect(r.ok).toBe(true)
    expect(Math.abs(r.bias)).toBeLessThan(1e-9)
    expect(r.spread).toBeCloseTo(0)
  })
  it('a steady lag is bias, not error: the bar still passes', () => {
    const r = scoreTaps(onsets, grid4.map((t) => t + 90))
    expect(r.bias).toBeCloseTo(90)
    expect(r.spread).toBeCloseTo(0)
    expect(r.ok).toBe(true)
  })
  it('uneven taps are spread: one tap far from the rest fails', () => {
    const r = scoreTaps(onsets, grid4.map((t, i) => t + (i === 2 ? 200 : 0)))
    expect(r.spread).toBeGreaterThan(80)
    expect(r.ok).toBe(false)
  })
  it('the same spread passes inside the window and fails outside it', () => {
    const wobble = grid4.map((t, i) => t + (i % 2 ? 60 : -60))
    expect(scoreTaps(onsets, wobble).ok).toBe(true)
    expect(scoreTaps(onsets, wobble, 40).ok).toBe(false)
  })
  it('a bar a whole beat out is off the click even if even', () => {
    expect(scoreTaps(onsets, grid4.map((t) => t + RHYTHM.maxBias + 50)).ok).toBe(false)
  })
  it('too few or too many taps is a miss, with a count', () => {
    expect(scoreTaps(onsets, grid4.slice(0, 3))).toMatchObject({ ok: false, note: 'You tapped 3 of 4.' })
    expect(scoreTaps(onsets, [...grid4, 3000]).ok).toBe(false)
  })
  it('names bias and spread apart', () => {
    expect(biasText(12.4, 18.2)).toBe('Bias 12 ms late, spread 18 ms')
    expect(biasText(-30, 5)).toBe('Bias 30 ms early, spread 5 ms')
    expect(biasText(2, 5)).toBe('Bias none, spread 5 ms')
  })
})
