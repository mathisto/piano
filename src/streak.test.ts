import { describe, expect, it } from 'vitest'
import { dayNum } from './drill'
import { dayOfKey, streak } from './streak'

const key = (d: number) => {
  const t = new Date(Date.UTC(1970, 0, 1 + d))
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`
}
const log = (...ds: number[]) => Object.fromEntries(ds.map((d) => [key(d), 600]))
const T = 20000
const run = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

describe('streak', () => {
  it('no practice is no streak', () => expect(streak({}, T)).toMatchObject({ n: 0, freezes: 0 }))
  it('counts consecutive days, today included once played', () => {
    expect(streak(log(T - 2, T - 1, T), T)).toMatchObject({ n: 3, today: true })
    expect(streak(log(T - 2, T - 1), T)).toMatchObject({ n: 2, today: false }) // today is still open
  })
  it('a few seconds is not a practised day', () => expect(streak({ [key(T)]: 20 }, T).n).toBe(0))
  it('a missed day without a freeze starts again', () => expect(streak(log(T - 4, T - 3, T - 1, T), T).n).toBe(2))
  it('seven days earn a freeze that a missed day spends, keeping the streak', () => {
    const s = streak(log(...run(T - 8, T - 2), T), T) // seven days, then T-1 missed
    expect(s).toMatchObject({ n: 8, freezes: 0, today: true })
    expect(streak(log(...run(T - 8, T - 2)), T)).toMatchObject({ n: 7, freezes: 0, saved: true })
  })
  it('a second miss with no freeze left ends it', () => expect(streak(log(...run(T - 9, T - 3), T), T).n).toBe(1))
  it('freezes cap at two', () => expect(streak(log(...run(T - 30, T)), T).freezes).toBe(2))
  it('the key of a date is the same day number whatever the hour or zone', () => {
    expect(dayOfKey('2026-10-27')).toBe(dayNum(new Date(2026, 9, 27, 0, 1)))
    expect(dayOfKey('2026-10-27')).toBe(dayNum(new Date(2026, 9, 27, 23, 59)))
    expect(dayOfKey('2026-03-29') - dayOfKey('2026-03-28')).toBe(1) // across a clock change
  })
})
