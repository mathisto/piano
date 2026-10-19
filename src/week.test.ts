import { describe, expect, it } from 'vitest'
import { dayKey, weekOf } from './week'

describe('week', () => {
  const wed = new Date(2026, 9, 21) // Wednesday 21 Oct 2026

  it('keys days by local date', () => {
    expect(dayKey(wed)).toBe('2026-10-21')
  })

  it('lays out Monday to Sunday around the given day, with practised seconds', () => {
    const w = weekOf({ '2026-10-19': 600, '2026-10-21': 90, '2026-10-26': 5000 }, wed)
    expect(w.days.map((d) => d.key)).toEqual(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'])
    expect(w.days.map((d) => d.label)).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'])
    expect(w.days.map((d) => d.played)).toEqual([true, false, true, false, false, false, false])
    expect(w.minutes).toBe(11) // next week's seconds do not count
    expect(w.days[2].today).toBe(true)
  })

  it('counts a day as played from one minute', () => {
    expect(weekOf({ '2026-10-21': 59 }, wed).days[2].played).toBe(false)
    expect(weekOf({ '2026-10-21': 60 }, wed).days[2].played).toBe(true)
  })

  it('starts a Sunday in the week that began the Monday before', () => {
    const w = weekOf({}, new Date(2026, 9, 25))
    expect(w.days[0].key).toBe('2026-10-19')
    expect(w.days[6].today).toBe(true)
  })
})

import { lastWeek } from './week'

describe('last week', () => {
  const wed = new Date(2026, 9, 21)
  it('is null when nothing was practised', () => {
    expect(lastWeek({}, 60, wed)).toBeNull()
  })
  it('totals the week before and suggests a higher goal only after meeting it', () => {
    const days = { '2026-10-12': 1800, '2026-10-14': 2400, '2026-10-16': 600 }
    expect(lastWeek(days, 60, wed)).toEqual({ minutes: 80, played: 3, suggest: 90 })
    expect(lastWeek(days, 90, wed)).toEqual({ minutes: 80, played: 3, suggest: 90 })
  })
})

import { improved } from './week'

describe('most improved', () => {
  const names = { a: 'Treble landmarks', b: 'Bass staff' }
  it('is null without an earlier snapshot or any gain', () => {
    expect(improved(undefined, { read: { a: 0.5 }, tech: 3 }, names)).toBeNull()
    expect(improved({ read: { a: 0.5 }, tech: 3 }, { read: { a: 0.5 }, tech: 3 }, names)).toBeNull()
  })
  it('names the reading stage that gained the most', () => {
    const r = improved({ read: { a: 0.2, b: 0.5 }, tech: 3 }, { read: { a: 0.6, b: 0.55 }, tech: 3 }, names)
    expect(r).toBe('Treble landmarks: 20% to 60%')
  })
  it('counts technique exercises that became solid', () => {
    expect(improved({ read: {}, tech: 3 }, { read: {}, tech: 5 }, names)).toBe('2 more technique exercises solid')
    expect(improved({ read: {}, tech: 3 }, { read: {}, tech: 4 }, names)).toBe('1 more technique exercise solid')
  })
  it('prefers a gain of at least ten points in reading over a single exercise', () => {
    expect(improved({ read: { a: 0.2 }, tech: 3 }, { read: { a: 0.5 }, tech: 4 }, names)).toBe('Treble landmarks: 20% to 50%')
  })
})
