import { expect, it } from 'vitest'
import { worstBars } from './util'

it('worst bars stay inside a piece that has shrunk since its trouble was kept', () => {
  expect(worstBars([0, 2, 3], 10)).toEqual({ a: 1, b: 2 })
  expect(worstBars([0, 1, 0, 0, 0, 0, 0, 0, 0, 9, 9], 8)).toEqual({ a: 0, b: 1 }) // bars 9 and 10 are gone
  expect(worstBars([0, 0, 0, 0, 0, 0, 0, 0, 0, 9], 8)).toBeNull()
  expect(worstBars([0, 0, 4], 3)).toEqual({ a: 1, b: 2 })
})
