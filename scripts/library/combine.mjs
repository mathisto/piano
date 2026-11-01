#!/usr/bin/env node
// Lay one pipeline output over another: node scripts/library/combine.mjs <base-out> <overlay-out> <result-out>
// A piece in both takes the overlay's entry (new file, sha, bars, flags) when its file or flags differ; every piece file from both is kept (files are content-addressed,
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
  if (!q || (q.file === p.file && q.flags.join() === p.flags.join())) return p // same file and flags: nothing to take (a stale flag dropped in place is taken)
  changed++
  lic = lic.split(p.file).join(q.file)
  return q
})
// the sidecars: the base's entries, the overlay's over them for the pieces taken from it
const side = (d, c) => (c.incipits ? JSON.parse(read(d, c.incipits)).p : {})
const [bi, oi] = [side(base, A), side(over, B)]
const incipits = Object.fromEntries(A.pieces.map((p) => [p.id, (p === mine.get(p.id) ? oi[p.id] : undefined) ?? bi[p.id] ?? oi[p.id]]).filter((e) => e[1]))
const body = JSON.stringify({ v: 1, p: incipits })
A.incipits = `i/${createHash('sha256').update(body).digest('hex').slice(0, 16)}.json`
mkdirSync(`${out}/i`, { recursive: true })
writeFileSync(`${out}/${A.incipits}`, body)
A.built = createHash('sha256').update(JSON.stringify([A.composers, A.licences, A.aliases ?? {}, A.pieces, A.incipits])).digest('hex').slice(0, 16) // as reanalyse.mjs: a change to the tables alone is a new built too
mkdirSync(`${out}/p`, { recursive: true })
for (const d of [base, over]) cpSync(`${d}/p`, `${out}/p`, { recursive: true, force: false, errorOnExist: false })
writeFileSync(`${out}/catalog.json`, JSON.stringify(A))
writeFileSync(`${out}/LICENSES.md`, lic)
console.log(`${A.pieces.length} pieces, ${changed} taken from the overlay, built ${A.built}`)
