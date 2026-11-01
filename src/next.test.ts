import { expect, it } from 'vitest'
import { nextUp, type Snap, type Unit } from './next'

const u = (key: string, due?: number): Unit => ({ key, title: key, sub: `why ${key}`, due })
const piece = u('piece')
const fix = u('loop')
// a first visit with nothing played: the plan's rows, the starter piece, nothing due
const empty: Snap = { rows: [u('warm'), u('read'), piece], plan: ['warm', 'read', 'piece'], done: [] }
const allDone = { ...empty, done: ['warm', 'read', 'piece'] }

it('a run that was not clean: the fix, offered three times at most, then the day goes on', () => {
  for (const offers of [0, 1, 2]) expect(nextUp({ ...empty, after: { clean: false, fix, offers } })).toMatchObject({ key: 'loop', by: 'fix' })
  expect(nextUp({ ...empty, after: { clean: false, fix, offers: 3 } })).toMatchObject({ key: 'warm', by: 'plan' })
})

it('a clean run moves on to the day, whatever its fix', () => {
  expect(nextUp({ ...empty, after: { clean: true, fix, offers: 0 } })).toMatchObject({ key: 'warm', by: 'plan' })
  expect(nextUp({ ...empty, after: { clean: false, offers: 0 } })).toMatchObject({ key: 'warm', by: 'plan' }) // nothing to loop
})

it('the first week: its step for today comes before the plan', () => {
  expect(nextUp({ ...empty, guide: u('guide') })).toMatchObject({ key: 'guide', by: 'guide' })
  expect(nextUp({ ...empty, guide: u('guide'), after: { clean: false, fix, offers: 0 } }).by).toBe('fix')
})

it("the plan's first row not ticked, in the plan's order", () => {
  expect(nextUp({ ...empty, done: ['warm'] })).toMatchObject({ key: 'read', by: 'plan' })
})

it('the plan done: the most due, then the Path, then the piece', () => {
  const rows = [u('warm', 1), u('read', 12), u('review', 3), u('path'), piece]
  expect(nextUp({ ...allDone, rows })).toMatchObject({ key: 'read', by: 'due', sub: 'why read' })
  expect(nextUp({ ...allDone, rows: [u('path'), piece], path: 'path' })).toMatchObject({ key: 'path', by: 'path' })
  expect(nextUp({ ...allDone, path: 'scale' })).toMatchObject({ key: 'piece', by: 'piece' }) // a Path step with no row of its own today
})

it('never empty: an empty profile with every step done still names the piece, with its reason', () => {
  const n = nextUp({ rows: [piece], plan: [], done: [] })
  expect(n).toMatchObject({ key: 'piece', by: 'piece', sub: 'why piece' })
  for (const s of [empty, allDone, { ...allDone, after: { clean: false, fix, offers: 9 } }]) expect(nextUp(s).by).toBeTruthy()
})
