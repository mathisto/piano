import { describe, expect, it } from 'vitest'
import { adaptation, slope, stuck, weakNotes } from './profile'
import type { CardRow, HistoryEntry } from './store'

const h = (id: string, acc: number, i: number, ms?: number, as?: 1): HistoryEntry => ({ ts: i, kind: 'read', label: id, id, acc, ms, as })

describe('attempt-log rules', () => {
  it('steps back after two counted sessions under 70%, ignoring assisted work', () => {
    expect(adaptation([h('x', 0.6, 1), h('x', 0.65, 2)], 'x')).toBe('back')
    expect(adaptation([h('x', 0.6, 1), h('x', 0.65, 2, undefined, 1)], 'x')).toBeUndefined()
    expect(adaptation([h('x', 0.6, 1), h('x', 0.7, 2)], 'x')).toBeUndefined()
  })

  it('changes a task after five below-target sessions with no accuracy or speed gain', () => {
    const flat = [0.8, 0.78, 0.79, 0.77, 0.78].map((a, i) => h('x', a, i, 2000 + i * 10))
    expect(adaptation(flat, 'x')).toBe('change')
    expect(stuck(flat)).toEqual([{ id: 'x', label: 'x', sessions: 5 }])
    expect(adaptation([0.72, 0.74, 0.76, 0.78, 0.8].map((a, i) => h('x', a, i, 2000)), 'x')).toBeUndefined()
    expect(adaptation([0.78, 0.78, 0.78, 0.78, 0.78].map((a, i) => h('x', a, i, 2200 - i * 150)), 'x')).toBeUndefined()
    const veryLow = [0.65, 0.64, 0.63, 0.62, 0.61].map((a, i) => h('x', a, i, 2000))
    expect(adaptation(veryLow, 'x')).toBe('back')
    expect(stuck(veryLow)).toEqual([{ id: 'x', label: 'x', sessions: 5 }])
    expect(slope([1, 2, 3, 4, 5])).toBe(1)
  })
})

describe('reading error map', () => {
  const rows = (pitch: number, n: number, misses: number, got?: number): CardRow[] =>
    Array.from({ length: n }, (_, i) => ({ ts: i, k: `1:bass:${pitch}`, y: i < misses ? 0 : 1, rt: 1000, ...(i < misses && got ? { got: [got] } : {}) }))

  it('ranks a real weak note over a noisy thin one and keeps the played-for-written confusion', () => {
    const weak = weakNotes([...rows(41, 20, 10, 43), ...rows(43, 20, 2), ...rows(45, 3, 3)])
    expect(weak.map((x) => x.pitch)).toEqual([41, 43])
    expect(weak[0]).toMatchObject({ attempts: 20, misses: 10, confused: { pitch: 43, n: 10 } })
    expect(weak[0].rate).toBeGreaterThan(weak[1].rate)
  })
})
