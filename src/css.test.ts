import { readdirSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

// A bare .rest rule (the break toast once had one) moved every rest on the staff 227 px left.
it('no stylesheet has a bare rule for a class the staff glyphs use', () => {
  for (const f of readdirSync('src').filter((n) => n.endsWith('.css'))) {
    const css = readFileSync(`src/${f}`, 'utf8')
    expect(css.match(/^\.rest[\s{,.:]/m), f).toBeNull()
  }
})

it('mastery cells are 44px wide on a coarse pointer', () => {
  expect(readFileSync('src/style.css', 'utf8')).toMatch(/pointer: coarse\)\s*\{\s*\.cell\s*\{\s*width:\s*44px/)
})

const rules = (f: string) => [...readFileSync(`src/${f}`, 'utf8').matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }))

// The Memorise strip is a grid row above the staff (`auto var(--rows)`): a view that sets the template directly drops it into the wrong row.
it('every play-screen row template is a --rows value', () => {
  for (const f of readdirSync('src').filter((n) => n.endsWith('.css')))
    for (const r of rules(f).filter((r) => /^#play\b/.test(r.sel) && !r.sel.includes('#memBar') && /grid-template-rows/.test(r.body)))
      expect(r.body, `${f}: ${r.sel}`).toMatch(/grid-template-rows:\s*var\(--rows\)/)
})

// It once floated at the staff's top right, over the bar number and the high notes.
it('the Memorise strip does not float over the staff', () => {
  for (const r of rules('memory.css').filter((r) => /(^|,)\s*\.mem-bar\s*$/.test(r.sel))) expect(r.body).not.toMatch(/position:\s*(absolute|fixed)/)
})
