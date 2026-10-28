// Boot JS by module: node scripts/bootmods.mjs [n]  (same chunk walk as src/bundle.test.ts; sizes are rendered lengths)
import { build } from 'vite'
const out = await build({ logLevel: 'silent', build: { write: false } })
const chunks = new Map(out.output.filter((c) => c.type === 'chunk').map((c) => [c.fileName, c]))
const boot = new Set([[...chunks.values()].find((c) => c.isEntry)])
for (const c of boot) for (const f of c.imports) boot.add(chunks.get(f))
const rows = []
let tot = 0
for (const c of boot) { tot += c.code.length; for (const id of c.moduleIds) rows.push([c.modules[id]?.renderedLength ?? 0, id.replace(/^.*?(node_modules\/|src\/)/, '$1'), c.fileName]) }
rows.sort((a, b) => b[0] - a[0])
console.log('boot total', tot, 'chunks', [...boot].map((c) => c.fileName + ':' + c.code.length).join(' '))
for (const r of rows.slice(0, +process.argv[2] || 60)) console.log(String(r[0]).padStart(7), r[1])
