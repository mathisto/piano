// The iPad menu bar (AppDelegate.swift) hands the page keys; this keeps its list, the page's shortcuts (input.ts) and the Help sheet together.
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const swift = read('ios/App/App/AppDelegate.swift')
const input = read('src/app/input.ts')
const help = read('src/ui-sheets.ts')
const mods = (m: string) => m.replace(/[[\].\s]/g, '').split(',').sort().join('+')
const cmds = [...swift.matchAll(/key\("([^"]+)", "([^"]*)", (\[[^\]]*\]|\.\w+), "([^"]*)"\)/g)].map(([, title, key, m, page]) => ({ title, key, mods: mods(m), page }))
const tabs = swift.match(/let tabs = \[([^\]]*)\]/)![1].match(/"(\w+)"/g)!.map((t) => t.slice(1, -1).toLowerCase())
const pageKeys = new Set([...input.matchAll(/e\.key === '(.)'/g)].map((m) => m[1])) // the single-key shortcuts; Escape is the page's own back, not a menu command

it('the tab items are the page\'s seven tabs, in order, on 1 to 7', () => {
  expect(tabs).toEqual([...read('src/ui.ts').match(/\(\[('today'.*?)\] as const\)/)![1].matchAll(/'(\w+)'/g)].map((m) => m[1]))
  expect(input).toMatch(/\/\^\[1-7\]\$\/\.test\(e\.key\)/)
  expect(swift).toMatch(/key\(t, "\\\(i \+ 1\)", \.command, "\\\(i \+ 1\)"\)/) // ⌘1 to ⌘7 send 1 to 7
})

it('every menu command sends a key the page handles', () => {
  expect(cmds.length).toBeGreaterThan(8)
  for (const c of cmds) expect(pageKeys.has(c.page), `${c.title} sends "${c.page}"`).toBe(true)
})

it('every single-key shortcut of the page has a menu command, and Help lists it', () => {
  const sent = new Set(cmds.map((c) => c.page))
  for (const k of pageKeys) if (k !== '+') expect(sent.has(k), `the page's "${k}" has no menu command`).toBe(true) // + is = with shift
  for (const k of ['Space', 'V', 'B', 'N', 'M', '?']) expect(help).toContain(`<kbd>${k}</kbd>`)
})

it('no two menu commands share a shortcut, and each shortcut is its key with ⌘', () => {
  const seen = new Set<string>()
  for (const c of cmds) {
    const id = `${c.mods}+${c.key}`
    expect(seen.has(id), `${c.title} repeats ${id}`).toBe(false)
    seen.add(id)
    expect(c.mods).toContain('command')
    if (c.page.length === 1 && c.page !== ' ') expect([c.page, 'Return'].includes(c.key === '\\r' ? 'Return' : c.key), c.title).toBe(true) // the same letter as the web key
  }
})
