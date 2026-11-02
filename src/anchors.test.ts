import { execFileSync } from 'node:child_process'
import { expect, it } from 'vitest'

it('keeps the G1 owner-review anchor table valid', () => {
  expect(execFileSync(process.execPath, ['scripts/library/anchors.mjs'], { encoding: 'utf8' })).toMatch(/^100 anchors; Henle 1:/)
})
