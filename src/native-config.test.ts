import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const plist = readFileSync(new URL('../ios/App/App/Info.plist', import.meta.url), 'utf8')

it('declares every imported document type as a viewer', () => {
  expect([...plist.matchAll(/<key>CFBundleTypeRole<\/key>\s*<string>Viewer<\/string>/g)]).toHaveLength(3)
})

it('owns the Page to Hand pack type and no Piano Forte pack type', () => {
  expect(plist).toContain('<string>io.mattkelly.pagetohand.pack</string>')
  expect(plist).toContain('<string>pthpack</string>')
  expect(plist).toContain('<string>application/vnd.page-to-hand.pack+json</string>')
  expect(plist).not.toMatch(/pfpack|piano-forte\.pack|piano\.pack/)
})
