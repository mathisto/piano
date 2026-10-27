import { expect, it } from 'vitest'
import { showSetup } from './settings'

const base = { seen: false, saved: false, automated: false, forced: false }
it('Set up shows on a true first launch only', () => {
  expect(showSetup(base)).toBe(true)
  expect(showSetup({ ...base, seen: true })).toBe(false)
  expect(showSetup({ ...base, saved: true })).toBe(false) // a returning player
  expect(showSetup({ ...base, automated: true })).toBe(false) // smoke and other drivers
  expect(showSetup({ ...base, automated: true, forced: true })).toBe(true) // ?setup, for the one check that wants it
})
