import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const read = (f: string) => readFileSync(f, 'utf8')

// Docs drift: a branch note nobody indexed, a DESIGN.md colour that no longer matches the stylesheet.
it('docs/README.md lists every docs/changes note, and every note it lists exists', () => {
  const readme = read('docs/README.md')
  for (const f of readdirSync('docs/changes')) expect(readme, f).toContain(`changes/${f}`)
  for (const m of readme.matchAll(/`((?:changes|research|art)\/[\w.-]+\.md)`/g)) expect(existsSync(`docs/${m[1]}`), m[1]).toBe(true)
})

it('DESIGN.md front-matter colours exist in the stylesheet or palette.ts', () => {
  const fm = read('DESIGN.md').match(/^colors:\n((?:  [\w-]+: ".*"\n)+)/m)![1]
  const hexes = [...fm.matchAll(/"#([0-9a-f]{6})"/g)].map((m) => m[1])
  expect(hexes.length).toBeGreaterThan(20)
  const src = (read('src/style.css') + read('src/palette.ts')).toLowerCase()
  for (const h of hexes) expect(src.includes(`#${h}`) || src.includes(`0x${h}`), h).toBe(true)
})

it('markdown links between docs resolve', () => {
  for (const f of ['ROADMAP.md', 'DESIGN.md', 'PRODUCT.md', ...readdirSync('docs').filter((n) => n.endsWith('.md')).map((n) => `docs/${n}`)]) {
    const dir = f.includes('/') ? 'docs/' : ''
    for (const m of read(f).matchAll(/\]\(([^)#\s]+)\)/g)) if (!/^(https?|mailto):/.test(m[1])) expect(existsSync(dir + m[1]), `${f} -> ${m[1]}`).toBe(true)
  }
})
