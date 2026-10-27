import { expect, test } from 'vitest'
import { cacheFor, route, shellCache } from './sw'

const O = 'https://pianoforte.mattkelly.io'
const r = (path: string, nav = false, origin = O) => route(new URL(path, origin), O, nav)

test('what is cached and how', () => {
  expect(r('/', true)).toBe('nav')
  expect(r('/assets/index-BgCh5TlO.js')).toBe('cache-first')
  expect(r('/corpus/p/0123456789abcdef.mxl')).toBe('cache-first')
  expect(r('/samples/salamander/C4.mp3')).toBe('cache-first')
  expect(r('/corpus/catalog.json')).toBe('revalidate')
  expect(r('/art/x.jpg')).toBe('revalidate')
  expect(r('/library/lieder-lc4976849.mxl')).toBe('revalidate')
})

test('never trapped on an old build, never off-origin', () => {
  expect(r('/sw.js')).toBe('network')
  expect(r('/version.txt')).toBe('network')
  expect(r('/index.html', true)).toBe('network') // only the root is the cached shell
  expect(r('/corpus/LICENSES.md', true)).toBe('network') // a navigation to a file must not replace the cached index
  expect(r('/assets/a.js', false, 'https://other.example')).toBe('network')
})

test('build files go with their version, the rest outlives it', () => {
  expect(cacheFor('/assets/a.js', 'v1')).toBe(shellCache('v1'))
  expect(cacheFor('/assets/a.js', 'v2')).not.toBe(cacheFor('/assets/a.js', 'v1'))
  expect(cacheFor('/corpus/p/x.mid', 'v1')).toBe(cacheFor('/corpus/p/x.mid', 'v2'))
})
