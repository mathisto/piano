import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

const read = (file: string) => readFileSync(file)
const size = (file: string) => {
  const b = read(file)
  expect(b.subarray(1, 4).toString()).toBe('PNG')
  return [b.readUInt32BE(16), b.readUInt32BE(20)]
}
const sha = (file: string) => createHash('sha256').update(read(file)).digest('hex')

test('the web manifest is a stable standalone app rooted at Piano Forte', () => {
  const manifest = JSON.parse(read('public/manifest.json').toString())
  expect(manifest).toEqual({
    id: '/',
    name: 'Piano Forte',
    short_name: 'Piano Forte',
    description: 'A calm piano practice room for real keyboards and your own music. No account, ads or subscription.',
    lang: 'en',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fbf8f1',
    theme_color: '#0c0e12',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  })
  expect(read('index.html').toString()).toContain('<link rel="manifest" href="/manifest.json" />')
})

test('both install icons are the generated maskable identity assets', () => {
  for (const n of [192, 512]) {
    expect(size(`public/icon-${n}.png`)).toEqual([n, n])
    expect(sha(`public/icon-${n}.png`)).toBe(sha(`design/identity/output/web-maskable-${n}.png`))
  }
})
