import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { PRIVACY_URL, SUPPORT_EMAIL, SUPPORT_URL } from './support'

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

it('publishes durable support contact and recovery guidance', () => {
  const html = source('support/index.html')
  expect(SUPPORT_URL).toBe('https://pianoforte.mattkelly.io/support/')
  expect(html).toContain(SUPPORT_EMAIL)
  expect(html).toContain('Backup → Export')
  expect(html).toContain('Piano Forte does not send your practice history or files')
  expect(html).not.toContain('github.com/mathisto/piano/issues')
})

it('publishes the real local, sync, network, payment and deletion boundaries', () => {
  const html = source('privacy/index.html')
  expect(PRIVACY_URL).toBe('https://pianoforte.mattkelly.io/privacy/')
  for (const fact of ['MIDI input', 'until you delete them', 'folder you choose', 'Cloudflare', 'at least 31 days', 'seven days', 'until deleted', 'Apple processes App Store purchases', 'Delete all data', SUPPORT_EMAIL]) expect(html).toContain(fact)
  expect(html).toContain('no user account')
  expect(html).toContain('does not sell personal data')
})

it('keeps both pages static and compatible with the saved appearance', () => {
  for (const path of ['support/index.html', 'privacy/index.html']) {
    const html = source(path)
    expect(html).toContain('<script src="/theme.js"></script>')
    expect(html).not.toContain('type="module"')
    expect(html).toContain('/src/legal.css')
    expect(html).toContain('Content-Security-Policy')
  }
})
