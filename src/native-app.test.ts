import { expect, it, vi } from 'vitest'
import { offsetOf } from './native-app'

it('the clock offset comes from the quickest round trip', () => {
  expect(offsetOf([])).toBeUndefined()
  expect(offsetOf([[100, 40, 110], [200, 142, 202], [300, 230, 306]])).toBe(59) // the 2 ms trip: (200 + 202) / 2 - 142
})

it('hands the plugin over in a wrapper: a promise resolved with the bare proxy never settles', async () => {
  vi.resetModules()
  const proxy = new Proxy({}, { get: () => () => new Promise(() => {}) }) // like Capacitor's: every property is a method, `then` included
  vi.doMock('@capacitor/core', () => ({ registerPlugin: () => proxy }))
  vi.stubGlobal('document', { addEventListener: () => {} })
  const { connect } = await import('./native-app')
  const got = await Promise.race([import('./native-app').then(() => connect(new Map(), () => {})), new Promise((r) => setTimeout(() => r('stuck'), 100))])
  expect((got as { n?: unknown }).n).toBe(proxy) // 'stuck' has no n
  vi.unstubAllGlobals()
})
