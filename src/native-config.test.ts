import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const plist = readFileSync(new URL('../ios/App/App/Info.plist', import.meta.url), 'utf8')

it('declares every imported document type as a viewer', () => {
  expect([...plist.matchAll(/<key>CFBundleTypeRole<\/key>\s*<string>Viewer<\/string>/g)]).toHaveLength(3)
})
