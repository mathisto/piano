import { readdirSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

// A bare .rest rule (the break toast once had one) moved every rest on the staff 227 px left.
it('no stylesheet has a bare rule for a class the staff glyphs use', () => {
  for (const f of readdirSync('src').filter((n) => n.endsWith('.css'))) {
    const css = readFileSync(`src/${f}`, 'utf8')
    expect(css.match(/^\.rest[\s{,.:]/m), f).toBeNull()
  }
})
