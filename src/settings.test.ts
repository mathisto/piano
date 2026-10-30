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

it('saved settings of the wrong kind fall back to their defaults, the rest are kept', async () => {
  const { vi } = await import('vitest')
  const saved = JSON.stringify({ zoom: 'big', zpos: [0, 0], pane: null, planMin: 99, view: 'sheet', volume: 0.3 })
  vi.stubGlobal('localStorage', { getItem: () => saved, setItem: () => {} })
  vi.resetModules()
  const { settings } = await import('./settings')
  expect(settings).not.toHaveProperty('zpos') // the staff size buttons moved into the dock's menu
  expect(settings).toMatchObject({ zoom: 1, pane: 0.4, planMin: 10, view: 'sheet', volume: 0.3 })
  vi.unstubAllGlobals()
})
