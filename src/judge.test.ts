import { describe, expect, it } from 'vitest'
import { Judge, multiplier } from './judge'
import type { Note } from './song'

const n = (id: number, t: number, p: number): Note => ({ id, t, d: 0.3, p, v: 0.7, h: 'R', bar: 0, beats: 1 })
const all = () => true
const mk = (notes: Note[], cfg = {}) => new Judge(notes, { rate: 1, wait: false, strict: true, ...cfg }, all)

describe('judge', () => {
  it('grades by distance from the note', () => {
    const j = mk([n(0, 1, 60), n(1, 2, 62), n(2, 3, 64)])
    expect(j.press(60, 1.03)[0]).toMatchObject({ k: 'hit', grade: 'perfect' })
    expect(j.press(62, 2.07)[0]).toMatchObject({ k: 'hit', grade: 'great' })
    expect(j.press(64, 2.9)[0]).toMatchObject({ k: 'hit', grade: 'good', off: expect.closeTo(-100, 5) })
  })

  it('reports early as negative and late as positive ms', () => {
    const j = mk([n(0, 1, 60)])
    expect((j.press(60, 0.95)[0] as { off: number }).off).toBeCloseTo(-50)
  })

  it('treats a press outside every window as a wrong note and breaks the combo when strict', () => {
    const j = mk([n(0, 1, 60), n(1, 5, 62)])
    j.press(60, 1)
    expect(j.combo).toBe(1)
    expect(j.press(62, 2)).toEqual([{ k: 'wrong', p: 62 }])
    expect(j.combo).toBe(0)
  })

  it('leaves the combo alone on a wrong note when not strict', () => {
    const j = mk([n(0, 1, 60), n(1, 5, 62)], { strict: false })
    j.press(60, 1)
    j.press(70, 2)
    expect(j.combo).toBe(1)
  })

  it('misses notes that slide past the window, once', () => {
    const j = mk([n(0, 1, 60)])
    expect(j.tick(1.1)).toEqual([])
    expect(j.tick(1.2)).toEqual([{ k: 'miss', i: 0 }])
    expect(j.tick(2)).toEqual([])
    expect(j.counts.miss).toBe(1)
    expect(j.done).toBe(true)
  })

  it('matches each chord note independently', () => {
    const j = mk([n(0, 1, 60), n(1, 1, 64), n(2, 1, 67)])
    j.press(64, 1.01)
    j.press(60, 1.02)
    j.press(67, 1.03)
    expect(j.counts.perfect).toBe(3)
  })

  it('does not let one press clear two notes of the same pitch', () => {
    const j = mk([n(0, 1, 60), n(1, 1.1, 60)])
    j.press(60, 1.05)
    expect(j.counts.perfect + j.counts.great + j.counts.good).toBe(1)
    expect(j.press(60, 1.06)[0]).toMatchObject({ k: 'hit' })
  })

  it('steps the multiplier at 10, 25, 50 combo', () => {
    expect([0, 9, 10, 24, 25, 49, 50].map(multiplier)).toEqual([1, 1, 2, 2, 3, 3, 4])
    const j = mk(Array.from({ length: 12 }, (_, i) => n(i, i, 60)))
    for (let i = 0; i < 12; i++) j.press(60, i)
    expect(j.score).toBe(10 * 100 + 2 * 200)
  })

  it('scales windows with tempo: half speed doubles the song-time window', () => {
    const j = mk([n(0, 1, 60)], { rate: 0.5 })
    // 100 ms real = 50 ms song time at 50%: still perfect-ish range for good, not perfect
    expect(j.press(60, 1.05)[0]).toMatchObject({ grade: 'good' })
  })

  it('wait mode: no misses, accepts early presses, no timing grade', () => {
    const j = mk([n(0, 1, 60), n(1, 1, 64)], { wait: true })
    expect(j.tick(9)).toEqual([])
    expect(j.required(1)).toEqual([0, 1])
    expect(j.press(60, 0.5)).toEqual([{ k: 'ok', i: 0 }])
    expect(j.required(1)).toEqual([1])
    expect(j.press(61, 1)).toEqual([{ k: 'wrong', p: 61 }])
    j.press(64, 1)
    expect(j.required(1)).toEqual([])
  })

  it('only scores notes the predicate allows', () => {
    const j = new Judge([n(0, 1, 60), n(1, 2, 62)], { rate: 1, wait: false, strict: true }, (x) => x.p === 62)
    expect(j.total).toBe(1)
    expect(j.press(60, 1)[0]).toMatchObject({ k: 'wrong' })
  })
})

describe('holds', () => {
  const nd = (id: number, t: number, p: number, d: number, h: 'R' | 'L' = 'R'): Note => ({ ...n(id, t, p), d, h })
  const hold = (notes: Note[], hold: 'off' | 'lenient' | 'strict' = 'lenient') => mk(notes, { hold })

  it('is silent when holds are off, in wait mode, or the key was never struck', () => {
    const a = hold([nd(0, 1, 60, 1)], 'off')
    a.press(60, 1)
    expect(a.release(60, 1.1, false)).toEqual([])
    const b = mk([nd(0, 1, 60, 1)], { hold: 'strict', wait: true })
    b.press(60, 1)
    expect(b.release(60, 1.1, false)).toEqual([])
    expect(hold([nd(0, 1, 60, 1)]).release(60, 2, false)).toEqual([])
  })

  it('accepts a release near the written end', () => {
    const j = hold([nd(0, 1, 60, 1)])
    j.press(60, 1)
    expect(j.release(60, 1.85, false)[0]).toMatchObject({ k: 'hold', i: 0, grade: 'held' })
    expect(j.holds.held).toBe(1)
    expect(j.holdPct).toBe(1)
  })

  it('takes points back for a short release, never below half, and leaves the combo alone', () => {
    const j = hold([nd(0, 1, 60, 2)])
    j.press(60, 1)
    expect(j.score).toBe(100)
    expect(j.release(60, 1.1, false)[0]).toMatchObject({ grade: 'short' })
    expect(j.score).toBe(50)
    expect(j.combo).toBe(1)
    expect(j.holdPct).toBe(0)
  })

  it('caps the target at the next onset in the same hand', () => {
    const j = hold([nd(0, 1, 60, 3), nd(1, 2, 62, 1)])
    j.press(60, 1)
    expect(j.release(60, 1.95, false)[0]).toMatchObject({ grade: 'held' })
  })

  it('does not punish a long hold when lenient, but does when strict', () => {
    const l = hold([nd(0, 1, 60, 0.5)])
    l.press(60, 1)
    expect(l.release(60, 3, false)[0]).toMatchObject({ grade: 'held' })
    const s = hold([nd(0, 1, 60, 0.5)], 'strict')
    s.press(60, 1)
    expect(s.release(60, 3, false)[0]).toMatchObject({ grade: 'long' })
    expect(s.score).toBeLessThan(100)
  })

  it('excuses an early release while the sustain pedal is down', () => {
    const j = hold([nd(0, 1, 60, 2)])
    j.press(60, 1)
    expect(j.release(60, 1.1, true)[0]).toMatchObject({ grade: 'held' })
    expect(j.score).toBe(100)
  })

  it('is stricter about the same shortfall than lenient', () => {
    const run = (m: 'lenient' | 'strict') => {
      const j = hold([nd(0, 1, 60, 1)], m)
      j.press(60, 1)
      return j.release(60, 1.7, false)[0]
    }
    expect(run('lenient')).toMatchObject({ grade: 'held' })
    expect(run('strict')).toMatchObject({ grade: 'short' })
  })
})

describe('velocity', () => {
  it('keeps the velocity of each struck note on the 0..127 scale and skips unknown ones', () => {
    const j = mk([n(0, 1, 60), n(1, 2, 62), n(2, 3, 64)])
    j.press(60, 1, 0.5)
    j.press(62, 2) // from the screen keys: no real velocity
    j.press(64, 3, 1)
    expect(j.samples()).toEqual([
      { v: 64, h: 'R', p: 60 },
      { v: 127, h: 'R', p: 64 },
    ])
  })

  it('keeps wait-mode hits too', () => {
    const j = mk([n(0, 1, 60)], { wait: true })
    j.press(60, 0.9, 0.25)
    expect(j.samples()).toEqual([{ v: 32, h: 'R', p: 60 }])
  })
})

describe('touch targets', () => {
  const w = (id: number, t: number, want: [number, number]): Note => ({ ...n(id, t, 60 + id), want })

  it('grades each struck note against its velocity range', () => {
    const j = mk([w(0, 1, [20, 50]), w(1, 2, [20, 50]), w(2, 3, [20, 50])])
    expect(j.press(60, 1, 40 / 127)[0]).toMatchObject({ k: 'hit', vel: 'ok' })
    expect(j.press(61, 2, 10 / 127)[0]).toMatchObject({ vel: 'low' })
    expect(j.press(62, 3, 90 / 127)[0]).toMatchObject({ vel: 'high' })
    expect(j.touch).toEqual({ ok: 1, low: 1, high: 1 })
    expect(j.touchPct).toBeCloseTo(1 / 3)
  })

  it('leaves notes without a target, and presses without a velocity, ungraded', () => {
    const j = mk([n(0, 1, 60), w(1, 2, [20, 50])])
    expect((j.press(60, 1, 0.9)[0] as { vel?: string }).vel).toBeUndefined()
    expect((j.press(61, 2)[0] as { vel?: string }).vel).toBeUndefined()
    expect(j.touchPct).toBe(-1)
  })

  it('also grades wait-mode hits', () => {
    const j = mk([w(0, 1, [20, 50])], { wait: true })
    expect(j.press(60, 1, 100 / 127)[0]).toMatchObject({ k: 'ok', vel: 'high' })
  })
})

describe('strictness windows', () => {
  const at = (ease: number, ms: number) => mk([n(0, 1, 60)], { ease }).press(60, 1 + ms / 1000)[0]

  it('widens or narrows every timing window together', () => {
    expect(at(1, 55)).toMatchObject({ grade: 'great' })
    expect(at(1.3, 55)).toMatchObject({ grade: 'perfect' })
    expect(at(1, 40)).toMatchObject({ grade: 'perfect' })
    expect(at(0.75, 40)).toMatchObject({ grade: 'great' })
  })

  it('moves the edge of the good window too', () => {
    expect(at(1, 140)).toMatchObject({ k: 'wrong' })
    expect(at(1.3, 140)).toMatchObject({ k: 'hit', grade: 'good' })
  })
})
