import { describe, expect, it } from 'vitest'
import { clampLow, defaultLow, keyAt, label, layout, shown, WHITE_MIN, whitesFor } from './osk'

describe('on-screen keys', () => {
  it('fits as many white keys as keep each one at the touch floor, from an octave to four', () => {
    expect([300, 566, 787, 1133, 1600, 4000].map(whitesFor)).toEqual([8, 12, 17, 25, 29, 29])
    // a white key is never narrower than the 44px touch floor, down to a split view's keyboard
    for (let w = 8 * WHITE_MIN; w < 1700; w++) expect(w / whitesFor(w)).toBeGreaterThanOrEqual(WHITE_MIN)
  })
  it('lays out every semitone, whites tiling the width', () => {
    const k = layout(48, 22)
    expect(k).toHaveLength(37)
    const w = k.filter((x) => !x.black)
    expect(w).toHaveLength(22)
    expect(w[0].x).toBe(0)
    expect(w[21].x + w[21].w).toBeCloseTo(1)
    expect(k.map((x) => x.p)).toEqual([...Array(37)].map((_, i) => 48 + i))
  })
  it('ends on a white key, so a part-octave keyboard has no black key hanging off its edge', () => {
    const k = layout(60, 12) // C4 to G5
    expect(k[k.length - 1]).toMatchObject({ p: 79, black: false })
    expect(k.filter((x) => !x.black)).toHaveLength(12)
    expect(Math.max(...k.map((x) => x.x + x.w))).toBeLessThanOrEqual(1)
  })
  it('centres a black key on the line between its whites', () => {
    const k = layout(60, 15)
    const cs = k[1] // C#4
    expect(cs.black).toBe(true)
    expect(cs.x + cs.w / 2).toBeCloseTo(k[0].x + k[0].w)
  })
  it('hits black keys in the upper part and whites below, and nothing outside', () => {
    const k = layout(60, 15)
    const n = 15
    expect(keyAt(k, 0.5 / n, 0.9)).toBe(60) // C, low
    expect(keyAt(k, 1 / n, 0.2)).toBe(61) // between C and D, high: C#
    expect(keyAt(k, 0.99 / n, 0.9)).toBe(60) // just left of the line, low: C
    expect(keyAt(k, 1 / n, 0.9)).toBe(62) // on it, low: D
    expect(keyAt(k, 14.5 / n, 0.5)).toBe(84)
    expect(keyAt(k, 1.2, 0.5)).toBeUndefined()
    expect(keyAt(k, 0.5, -0.1)).toBeUndefined()
  })
  it('keeps the range on the piano', () => {
    expect(clampLow(0, 22)).toBe(24)
    expect(clampLow(120, 22)).toBe(72)
    expect(clampLow(120, 12)).toBe(84) // C6 to G7: the highest twelve whites that fit under C8
    expect(clampLow(41, 15)).toBe(36)
    expect([12, 15, 22, 25, 29].map((n) => defaultLow(n))).toEqual([60, 48, 48, 48, 36])
    expect(defaultLow(12, 40)).toBe(36) // a bass drill in a split view opens on its own notes
    expect(defaultLow(12, 64)).toBe(60)
    expect(defaultLow(22, 40)).toBe(48) // a wide strip holds them anyway
  })
  it('names C keys, and white keys when asked', () => {
    expect(label(60, false)).toBe('C4')
    expect(label(62, false)).toBe('')
    expect(label(62, true)).toBe('D')
    expect(label(61, true)).toBe('')
  })
  it('shows when asked, or when there is no keyboard, only where an answer is waited for', () => {
    expect(shown(undefined, 0, true)).toBe(true)
    expect(shown(undefined, 1, true)).toBe(false)
    expect(shown(true, 1, true)).toBe(true)
    expect(shown(false, 0, true)).toBe(false)
    expect(shown(true, 0, false)).toBe(false)
  })
})
