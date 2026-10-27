#!/usr/bin/env node
// Lay one pipeline output over another: node scripts/library/combine.mjs <base-out> <overlay-out> <result-out>
// A piece in both takes the overlay's entry (new file, sha, bars, flags); every piece file from both is kept (files are content-addressed,
// so nothing is ever removed); LICENSES.md follows the file names; `built` is recomputed from what ships, so clients refetch.
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const [base, over, out] = process.argv.slice(2)
if (!out) throw new Error('usage: combine.mjs <base-out> <overlay-out> <result-out>')
const read = (d, f) => readFileSync(`${d}/${f}`, 'utf8')
const A = JSON.parse(read(base, 'catalog.json'))
const B = JSON.parse(read(over, 'catalog.json'))
let lic = read(base, 'LICENSES.md')
const mine = new Map(B.pieces.map((p) => [p.id, p]))
let changed = 0
A.pieces = A.pieces.map((p) => {
  const q = mine.get(p.id)
  if (!q || q.file === p.file) return p
  changed++
  lic = lic.split(p.file).join(q.file)
  return q
})
A.built = createHash('sha256').update(JSON.stringify(A.pieces)).digest('hex').slice(0, 16)
mkdirSync(`${out}/p`, { recursive: true })
for (const d of [base, over]) cpSync(`${d}/p`, `${out}/p`, { recursive: true, force: false, errorOnExist: false })
writeFileSync(`${out}/catalog.json`, JSON.stringify(A))
writeFileSync(`${out}/LICENSES.md`, lic)
console.log(`${A.pieces.length} pieces, ${changed} taken from the overlay, built ${A.built}`)
