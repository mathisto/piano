import { expect, it } from 'vitest'
import { restTracker } from './rest'

it('fires once after 30 minutes of practice, then counts again', () => {
  const r = restTracker()
  let now = 1000
  let fired = 0
  for (let s = 0; s < 3600; s++) {
    now += 1000
    if (r.add(1, now)) fired++
  }
  expect(fired).toBe(2)
})

it('a pause of five minutes resets the run', () => {
  const r = restTracker()
  r.add(1500, 1000)
  r.add(1, 1000 + 301_000)
  expect(r.run).toBe(1)
  expect(r.add(1700, 1000 + 302_000)).toBe(false)
})
