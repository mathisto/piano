import { expect, it } from 'vitest'
import { median } from './util'

it('median: the middle, the mean of the two middles, 0 for none', () => {
  expect(median([3, 1, 2])).toBe(2)
  expect(median([4, 1, 3, 2])).toBe(2.5)
  expect(median([])).toBe(0)
})
