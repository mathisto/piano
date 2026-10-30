import { describe, expect, it } from 'vitest'
import { dayOfKey, firstUse, guideDay, STEPS, TIP, tabNote } from './guide'
import { HELP } from './ui-sheets'

const all = STEPS.map((s) => s.key)
const states = (g: ReturnType<typeof guideDay>) => g!.rows.map((r) => r.state)

describe('guideDay', () => {
  it('day 1 offers step 1 and shows the rest as later', () => {
    const g = guideDay(100, 100, [])!
    expect(g.day).toBe(1)
    expect(states(g)).toEqual(['now', 'later', 'later', 'later', 'later', 'later', 'later'])
  })
  it('ticks what the records show, and marks earlier undone days late', () => {
    expect(states(guideDay(100, 102, ['read'])!)).toEqual(['done', 'late', 'now', 'later', 'later', 'later', 'later'])
  })
  it('a skipped day is quiet', () => {
    expect(states(guideDay(100, 101, [], [1])!)[0]).toBe('skipped')
  })
  it('day 8 still shows, with day 7 as today; day 9 never does', () => {
    expect(guideDay(100, 107, ['read'])!.day).toBe(7)
    expect(guideDay(100, 108, [])).toBeNull()
  })
  it('is gone once every day is done or skipped', () => {
    expect(guideDay(100, 103, all)).toBeNull()
    expect(guideDay(100, 103, all.slice(1), [1])).toBeNull()
  })
  it('a clock behind the first day counts as day 1', () => {
    expect(guideDay(100, 99, [])!.day).toBe(1)
  })
})

describe('firstUse', () => {
  it('is today for a new player, the earliest practice day for an existing one, and the stored day once set', () => {
    const today = dayOfKey('2026-10-27')
    expect(firstUse({}, today)).toBe(today)
    expect(firstUse({ '2026-10-01': 600, '2026-10-20': 60 }, today)).toBe(dayOfKey('2026-10-01'))
    expect(firstUse({ '2026-10-01': 600 }, today, today - 2)).toBe(today - 2)
  })
  it('dayOfKey counts days', () => {
    expect(dayOfKey('2026-10-28') - dayOfKey('2026-10-27')).toBe(1)
  })
})

describe('tabNote', () => {
  it('has no store to read in node: it still gives a note for a known tab and none for others', () => {
    expect(tabNote('Read')).toContain('Got it')
    expect(tabNote('Songs')).toBe('')
  })
  it('makes no claim the research does not support', () => {
    for (const text of [...Object.values(TIP), HELP, ...STEPS.map((s) => s.title + s.sub)]) expect(text).not.toMatch(/proven(?! best)|faster|guarantee|quickly/i)
  })
})
