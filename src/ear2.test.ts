import { describe, expect, it } from 'vitest'
import { beatMs } from './ear'
import { chordEarCards, checkQA, qaCards } from './ear2'
import { check } from './theory'

const pc = (n: number) => ((n % 12) + 12) % 12
type Ev = { p: number[]; at: number; dur: number }[]
const ev = (c: { play?: unknown }) => (c.play as { ev: Ev }).ev

describe('chord ear', () => {
  it('deals the same cards every time, five levels', () => {
    for (let l = 1; l <= 5; l++) {
      expect(chordEarCards(l).map((c) => c.id)).toEqual(chordEarCards(l).map((c) => c.id))
      expect(chordEarCards(l).length).toBeGreaterThan(5)
    }
    expect(new Set(chordEarCards(1).map((c) => c.id.split(':')[5]))).toEqual(new Set(['0'])) // root position on C
  })
  it('sounds arpeggiated, then blocked, and the answer is what sounds', () => {
    for (let l = 1; l <= 5; l++)
      for (const c of chordEarCards(l)) {
        const e = ev(c)
        if (l === 4) continue
        const blocked = e[e.length - 1].p
        expect(e.length).toBe(blocked.length + 1)
        expect(e.slice(0, -1).map((x) => x.p[0])).toEqual(blocked) // low to high
        expect(check(c.steps[0], blocked)).toBe(true)
        expect(check(c.steps[0], blocked.map((p) => p + 12))).toBe(true)
        expect(e[e.length - 1].at).toBeGreaterThan(e[e.length - 2].at + 400) // after the last arpeggio note
      }
  })
  it('the root alone is accepted, except in inversions', () => {
    const c = chordEarCards(2).find((x) => x.id.startsWith('ear:chord:2:min:9:'))! // A minor
    expect(check(c.steps[0], [57])).toBe(true)
    expect(check(c.steps[0], [60])).toBe(false)
    expect(check(chordEarCards(3)[0].steps[0], [chordEarCards(3)[0].steps[0].pcs[0]])).toBe(false)
  })
  it('inversions: the sounding lowest note is the answer, and a root-position voicing misses', () => {
    for (const c of chordEarCards(3)) {
      const blocked = ev(c).slice(-1)[0].p
      expect(pc(Math.min(...blocked))).toBe(c.steps[0].bass)
      expect(check(c.steps[0], [blocked[1], blocked[2], blocked[0] + 12])).toBe(false) // same notes, another note lowest
    }
  })
  it('progressions: four chords, each a triad, one step per chord; dominant 7ths have four notes', () => {
    const p = chordEarCards(4)
    expect(p.length).toBe(24)
    for (const c of p) {
      expect(c.steps.length).toBe(4)
      ev(c).forEach((e, i) => expect(check(c.steps[i], e.p)).toBe(true))
    }
    for (const c of chordEarCards(5)) expect(c.steps[0].pcs.length).toBe(4)
  })
})

describe('question and answer phrases', () => {
  it('deal the same phrases every time: two bars, 5 to 8 notes, stepwise, in the key, ending where the card says', () => {
    for (let l = 1; l <= 4; l++) {
      const a = qaCards(l)
      expect(a.map((c) => c.id)).toEqual(qaCards(l).map((c) => c.id))
      expect(a.length).toBe(60)
      for (const c of a) {
        const q = c.play as { ev: Ev; cells: number[]; tonic: number; minor: boolean; end: string }
        const ps = q.ev.map((e) => e.p[0])
        expect(ps.length).toBeGreaterThanOrEqual(5)
        expect(ps.length).toBeLessThanOrEqual(8)
        const sc = (q.minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]).map((s) => pc(q.tonic + s))
        for (const p of ps) expect(sc).toContain(pc(p))
        for (let i = 1; i < ps.length; i++) expect(Math.abs(ps[i] - ps[i - 1])).toBeLessThanOrEqual(4) // steps, a third at most
        // the app's phrase answers the other way round: its end is the player's start of the argument
        expect(pc(ps[ps.length - 1])).toBe(pc(q.tonic + (q.end === 'tonic' ? 7 : 0)))
        expect(q.cells[0]).toBe(0)
        expect(q.ev[q.ev.length - 1].at + q.ev[q.ev.length - 1].dur).toBeLessThanOrEqual(8 * beatMs())
      }
    }
  })
  it('level 1 is C major only; level 3 is minor; level 4 asks for the rhythm', () => {
    expect(new Set(qaCards(1).map((c) => (c.play as { tonic: number }).tonic))).toEqual(new Set([0]))
    expect(qaCards(3).every((c) => (c.play as { minor: boolean }).minor)).toBe(true)
    expect(qaCards(4).every((c) => (c.play as { echo: boolean }).echo)).toBe(true)
    expect(qaCards(2).some((c) => (c.play as { echo: boolean }).echo)).toBe(false)
  })
})

describe('checking an answer', () => {
  const B = beatMs() / 2
  const q = { tonic: 0, minor: false, end: 'tonic' as const, cells: [0, 2, 4, 6, 8], echo: false }
  const at = (cells: number[], ps: number[], off = 0, jit = 0) => cells.map((c, i) => ({ p: ps[i], t: c * B + off + (i % 2 ? jit : -jit) }))
  const good = at([0, 2, 3, 6, 8, 12], [67, 65, 64, 62, 64, 60])
  it('holds when there are 4 notes, all in key, ending on the tonic, on the pulse', () => {
    const r = checkQA(q, good)
    expect(r.ok).toBe(true)
    expect(r.broke).toEqual([])
    expect(r.text).toMatch(/^Held: 6 notes, all in the key, ended on C, pulse held\./)
  })
  it('a constant lateness is bias, not a miss; uneven taps are', () => {
    expect(checkQA(q, at([0, 2, 3, 6, 8, 12], [67, 65, 64, 62, 64, 60], 90)).ok).toBe(true)
    const r = checkQA(q, at([0, 2, 3, 6, 8, 12], [67, 65, 64, 62, 64, 60], 0, 150))
    expect(r.ok).toBe(false)
    expect(r.broke).toEqual(['pulse wandered'])
  })
  it('says which part did not hold', () => {
    expect(checkQA(q, good.slice(0, 3)).broke[0]).toMatch(/3 notes/)
    expect(checkQA(q, at([0, 2, 4, 6], [67, 65, 61, 60])).broke).toEqual(['D♭ not in the key'])
    expect(checkQA(q, at([0, 2, 4, 6], [60, 62, 64, 67])).broke).toEqual(['did not end on C'])
    expect(checkQA({ ...q, end: 'dominant' }, at([0, 2, 4, 6], [60, 62, 64, 67])).ok).toBe(true)
    expect(checkQA(q, []).ok).toBe(false)
  })
  it('the keys of one chord are one onset but each pitch is checked', () => {
    const n = [...good, { p: 61, t: good[5].t + 10 }]
    const r = checkQA(q, n)
    expect(r.held).toContain('6 notes')
    expect(r.broke).toContain('D♭ not in the key')
  })
  it('echo the rhythm: the same onsets on the grid', () => {
    const e = { ...q, echo: true, cells: [0, 2, 3, 6, 8, 12] }
    expect(checkQA(e, good).ok).toBe(true)
    expect(checkQA(e, at([0, 2, 4, 6, 8, 12], [67, 65, 64, 62, 64, 60])).broke).toEqual(['rhythm differed from the phrase'])
  })
})
