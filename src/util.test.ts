import { describe, expect, it } from 'vitest'
import { focusKey, median, worstBars } from './util'

it('median: the middle, the mean of the two middles, 0 for none', () => {
  expect(median([3, 1, 2])).toBe(2)
  expect(median([4, 1, 3, 2])).toBe(2.5)
  expect(median([])).toBe(0)
})

it('worst bars stay inside a piece that has shrunk since its trouble was kept', () => {
  expect(worstBars([0, 2, 3], 10)).toEqual({ a: 1, b: 2 })
  expect(worstBars([0, 1, 0, 0, 0, 0, 0, 0, 0, 9, 9], 8)).toEqual({ a: 0, b: 1 }) // bars 9 and 10 are gone
  expect(worstBars([0, 0, 0, 0, 0, 0, 0, 0, 0, 9], 8)).toBeNull()
  expect(worstBars([0, 0, 4], 3)).toEqual({ a: 1, b: 2 })
})

describe('focusKey', () => {
  it('finds a control by id first, else a radio by name and value', () => {
    expect(focusKey({ id: 'rClef', name: 'x', value: 'y' })).toBe('[id="rClef"]')
    expect(focusKey({ id: '', name: 'level', value: '2' })).toBe('[name="level"][value="2"]')
    expect(focusKey({ id: '', name: '', value: '' })).toBe('')
  })
  it('quotes what it cannot trust', () => {
    expect(focusKey({ name: 'you', value: 'a "b" \\c' })).toBe('[name="you"][value="a \\"b\\" \\\\c"]')
  })
})
