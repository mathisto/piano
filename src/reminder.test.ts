import { expect, it } from 'vitest'
import { reminders, reminderText } from './reminder'

const at = (h: number, m = 0) => h * 60 + m
const now = new Date(2026, 10, 1, 9, 30) // 1 Nov 2026, 09:30
const fmt = (ds: Date[]) => ds.map((d) => `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`)

it('is off when unset or out of range', () => {
  expect(reminders(undefined, {}, now)).toEqual([])
  expect(reminders(-1, {}, now)).toEqual([])
  expect(reminders(1440, {}, now)).toEqual([])
  expect(reminders(7.5, {}, now)).toEqual([])
})

it('comes at the chosen time, on three days, today first while it is still ahead', () => {
  expect(fmt(reminders(at(19), {}, now))).toEqual(['11/1 19:00', '11/2 19:00', '11/3 19:00'])
})

it('starts tomorrow once today\'s time has passed', () => {
  expect(fmt(reminders(at(8, 15), {}, now))).toEqual(['11/2 8:15', '11/3 8:15', '11/4 8:15'])
  expect(fmt(reminders(at(9, 30), {}, now))).toEqual(['11/2 9:30', '11/3 9:30', '11/4 9:30'])
})

it('skips a day already practised, a minute or more, and the three then fall on the next days', () => {
  expect(fmt(reminders(at(19), { '2026-11-01': 60 }, now))).toEqual(['11/2 19:00', '11/3 19:00', '11/4 19:00'])
  expect(fmt(reminders(at(19), { '2026-11-01': 59 }, now))[0]).toBe('11/1 19:00') // not yet a practised day (src/streak.ts MIN_SEC)
})

it('crosses a month end, and a change of clocks does not move the time', () => {
  expect(fmt(reminders(at(19), {}, new Date(2026, 9, 30, 20, 0)))).toEqual(['10/31 19:00', '11/1 19:00', '11/2 19:00'])
  expect(fmt(reminders(at(7), {}, new Date(2026, 10, 1, 8, 0)))).toEqual(['11/2 7:00', '11/3 7:00', '11/4 7:00']) // US clocks went back on 1 Nov 2026
})

it('speaks of what is next, never of the streak', () => {
  expect(reminderText(10, 'Bass landmarks')).toBe('10 minutes? Next up: Bass landmarks.')
  expect(reminderText(5)).not.toMatch(/streak|lose|miss|break/i)
})
