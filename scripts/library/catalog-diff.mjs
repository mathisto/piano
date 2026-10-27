#!/usr/bin/env node
// Compare two published outputs: node scripts/library/catalog-diff.mjs <old-out> <new-out> [--all]
// Identity (ids and order, file, bytes, sha256, tables, aliases, p/ contents) must match; then every differing field is listed by field
// with its count and, per piece, old -> new (first 6 without --all). Exit 1 when identity does not hold.
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'

const [A, B] = process.argv.slice(2)
const all = process.argv.includes('--all')
const read = (d) => JSON.parse(readFileSync(`${d}/catalog.json`, 'utf8'))
const [a, b] = [read(A), read(B)]
const j = JSON.stringify
const bad = []
const same = (what, x, y) => j(x) === j(y) || bad.push(what)
same('piece ids or order', a.pieces.map((p) => p.id), b.pieces.map((p) => p.id))
same('composers', a.composers, b.composers)
same('licences', a.licences, b.licences)
same('aliases', a.aliases, b.aliases)
same('LICENSES.md', readFileSync(`${A}/LICENSES.md`, 'utf8'), readFileSync(`${B}/LICENSES.md`, 'utf8'))
const B_ = new Map(b.pieces.map((p) => [p.id, p]))
const diffs = {}
for (const p of a.pieces) {
  const q = B_.get(p.id)
  if (!q) continue
  for (const k of new Set([...Object.keys(p), ...Object.keys(q)])) if (j(p[k]) !== j(q[k])) (diffs[k] ??= []).push(`${p.id}: ${j(p[k])} -> ${j(q[k])}`)
}
for (const k of ['file', 'bytes', 'sha256', 'title', 'composer', 'licence', 'source', 'edition', 'sourceUrl', 'licenceEvidence', 'tags', 'format'])
  if (diffs[k]) bad.push(`${k} differs in ${diffs[k].length} pieces`)
const files = (d) => readdirSync(`${d}/p`).sort()
same('p/ file names', files(A), files(B))
for (const f of files(B)) if (createHash('sha256').update(readFileSync(`${B}/p/${f}`)).digest('hex').slice(0, 16) !== f.split('.')[0]) bad.push(`p/${f}: content does not match its name`)
for (const p of b.pieces) if (createHash('sha256').update(readFileSync(`${B}/${p.file}`)).digest('hex') !== p.sha256) bad.push(`${p.id}: file does not match sha256`)
console.log(`pieces ${a.pieces.length} -> ${b.pieces.length}, files ${files(A).length} -> ${files(B).length}, built ${a.built} -> ${b.built}`)
const ids = new Set(Object.entries(diffs).flatMap(([, v]) => v.map((s) => s.split(':')[0])))
console.log(`${ids.size} pieces differ in:`)
for (const [k, v] of Object.entries(diffs).sort((x, y) => y[1].length - x[1].length)) {
  console.log(`  ${k}: ${v.length}`)
  for (const s of all ? v : v.slice(0, 6)) console.log(`      ${s}`)
}
console.log(bad.length ? `IDENTITY BROKEN:\n  ${bad.join('\n  ')}` : 'identity holds: ids, order, files, bytes, sha256, tables, aliases, LICENSES.md, p/ unchanged')
process.exit(bad.length ? 1 : 0)
