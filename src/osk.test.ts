import { describe, expect, it } from 'vitest'
import { clampLow, defaultLow, keyAt, label, layout, octavesFor, shown } from './osk'

describe('on-screen keys', () => {
  it('fits two to four octaves to the width', () => {
    expect([320, 820, 1180, 1600, 4000].map(octavesFor)).toEqual([2, 2, 3, 4, 4])
  })
  it('lays out every semitone, whites tiling the width', () => {
    const k = layout(48, 3)
    expect(k).toHaveLength(37)
    const w = k.filter((x) => !x.black)
    expect(w).toHaveLength(22)
    expect(w[0].x).toBe(0)
    expect(w[21].x + w[21].w).toBeCloseTo(1)
    expect(k.map((x) => x.p)).toEqual([...Array(37)].map((_, i) => 48 + i))
  })
  it('centres a black key on the line between its whites', () => {
    const k = layout(60, 2)
    const cs = k[1] // C#4
    expect(cs.black).toBe(true)
    expect(cs.x + cs.w / 2).toBeCloseTo(k[0].x + k[0].w)
  })
  it('hits black keys in the upper part and whites below, and nothing outside', () => {
    const k = layout(60, 2)
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
    expect(clampLow(0, 3)).toBe(24)
    expect(clampLow(120, 3)).toBe(72)
    expect(clampLow(41, 2)).toBe(36)
    expect([2, 3, 4].map(defaultLow)).toEqual([48, 48, 36])
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
