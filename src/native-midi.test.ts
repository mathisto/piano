import { expect, it } from 'vitest'
import { offsetOf } from './native-midi'

it('the clock offset comes from the quickest round trip', () => {
  expect(offsetOf([])).toBeUndefined()
  expect(offsetOf([[100, 40, 110], [200, 142, 202], [300, 230, 306]])).toBe(59) // the 2 ms trip: (200 + 202) / 2 - 142
})
