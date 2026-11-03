#!/usr/bin/env node
// Compare two published outputs: node scripts/library/catalog-diff.mjs <old-out> <new-out> [--all] [--titles scripts/library/titles.json]
// Identity (the old ids first and in order, tables only extended, aliases, LICENSES.md, every old p/ file kept) must match; pieces added after the old ones are
// counted by book, and a title, opus, form or kind may differ only for an id in the titles file (retitle.mjs); a piece may take a new content-addressed file
// (file, bytes, sha256 together: repeats played out) and those are listed apart; every other differing field is listed by field with its
// count and, per piece, old -> new (first 6 without --all). Exit 1 when identity does not hold.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const [A, B] = process.argv.slice(2)
const all = process.argv.includes('--all')
const tf = process.argv.includes('--titles') ? process.argv[process.argv.indexOf('--titles') + 1] : new URL('titles.json', import.meta.url).pathname
const titled = new Set(existsSync(tf) ? Object.keys(JSON.parse(readFileSync(tf, 'utf8'))) : [])
const read = (d) => JSON.parse(readFileSync(`${d}/catalog.json`, 'utf8'))
const [a, b] = [read(A), read(B)]
const j = JSON.stringify
const bad = []
const same = (what, x, y) => j(x) === j(y) || bad.push(what)
const head = (xs, n) => xs.slice(0, n)
same('piece ids or order (the old ones first)', a.pieces.map((p) => p.id), head(b.pieces, a.pieces.length).map((p) => p.id))
const bare = (cs) => cs.map(({ period, ...c }) => c) // a composer's period is new (kind.ts); the rest must match
same('composers (the old ones first)', bare(a.composers), bare(head(b.composers, a.composers.length)))
same('licences (the old ones first)', a.licences, head(b.licences, a.licences.length))
for (const [k, v] of Object.entries(a.aliases ?? {})) if (b.aliases?.[k] !== v) bad.push(`alias ${k} changed`)
const added = b.pieces.slice(a.pieces.length)
const B_ = new Map(b.pieces.map((p) => [p.id, p]))
const diffs = {}
for (const p of a.pieces) {
  const q = B_.get(p.id)
  if (!q) continue
  for (const k of new Set([...Object.keys(p), ...Object.keys(q)])) if (j(p[k]) !== j(q[k])) (diffs[k] ??= []).push(`${p.id}: ${j(p[k])} -> ${j(q[k])}`)
}
const fresh = a.pieces.filter((p) => B_.get(p.id)?.file !== p.file).map((p) => p.id) // a new file: all three fields move, the new one must exist and hash
for (const k of ['file', 'sha256']) if ((diffs[k]?.length ?? 0) !== fresh.length) bad.push(`${k} differs in ${diffs[k]?.length ?? 0} pieces but ${fresh.length} have a new file`)
if (diffs.bytes?.some((row) => !fresh.includes(row.split(':')[0]))) bad.push('bytes differs without a new file') // changed content may keep the same byte length
for (const k of ['title', 'opus'])
  if (diffs[k]?.some((s) => !titled.has(s.split(':')[0]))) bad.push(`${k} differs for pieces that are not in the titles file`) // kind and form follow a title or a composer rule: listed below
for (const k of ['composer', 'licence', 'source', 'edition', 'sourceUrl', 'licenceEvidence', 'tags', 'format'])
  if (diffs[k]) bad.push(`${k} differs in ${diffs[k].length} pieces`)
// LICENSES.md: every old row (old file names swapped for the new) is still there, but the rows of retitled pieces; the composer cell is not compared
// (an older run named it from the folder, catalog.json's table is the truth) and the rows that moved are counted
const cells = (l) => l.split(' | ')
const noWho = (l) => cells(l).filter((_, i) => i !== 2).join(' | ')
const rows = (t) => t.split('\n').filter((l) => l.startsWith('| `'))
const newRows = rows(readFileSync(`${B}/LICENSES.md`, 'utf8'))
const keys = new Set(newRows.map(noWho))
const swapped = a.pieces.reduce((t, p) => t.replaceAll(`\`${p.file}\``, `\`${B_.get(p.id)?.file}\``), readFileSync(`${A}/LICENSES.md`, 'utf8'))
const titledFiles = a.pieces.filter((p) => titled.has(p.id)).map((p) => `| \`${B_.get(p.id)?.file}\``)
const stale = rows(swapped).filter((l) => !a.pieces.some((p) => l.startsWith(`| \`${B_.get(p.id)?.file}\``))) // a row for a file no piece of the old catalogue has
const lostRows = rows(swapped).filter((l) => !stale.includes(l) && !keys.has(noWho(l)) && !titledFiles.some((f) => l.startsWith(f)))
if (lostRows.length) bad.push(`LICENSES.md lost ${lostRows.length} rows, e.g. ${lostRows[0].slice(0, 80)}`)
const whoMoved = rows(swapped).filter((l) => !newRows.includes(l) && keys.has(noWho(l))).length
console.log(`LICENSES.md: ${newRows.length} rows, ${whoMoved} with another composer cell than before (the folder name then, catalog.json's table now), ${stale.length} stale rows of the old file dropped`)
const files = (d) => readdirSync(`${d}/p`).sort()
const gone = files(A).filter((f) => !files(B).includes(f))
if (gone.length) bad.push(`p/ files removed: ${gone.join(' ')}`)
for (const f of files(B)) if (createHash('sha256').update(readFileSync(`${B}/p/${f}`)).digest('hex').slice(0, 16) !== f.split('.')[0]) bad.push(`p/${f}: content does not match its name`)
for (const p of b.pieces) if (createHash('sha256').update(readFileSync(`${B}/${p.file}`)).digest('hex') !== p.sha256) bad.push(`${p.id}: file does not match sha256`)
console.log(`pieces ${a.pieces.length} -> ${b.pieces.length}, files ${files(A).length} -> ${files(B).length}, built ${a.built} -> ${b.built}`)
console.log(`${fresh.length} pieces with a new file: ${fresh.map((id) => id.replace('mutopia-', '')).join(' ')}`)
delete diffs.file; delete diffs.bytes; delete diffs.sha256
const ids = new Set(Object.entries(diffs).flatMap(([, v]) => v.map((s) => s.split(':')[0])))
console.log(`${ids.size} old pieces differ in:`)
for (const [k, v] of Object.entries(diffs).sort((x, y) => y[1].length - x[1].length)) {
  console.log(`  ${k}: ${v.length}`)
  for (const s of all ? v : v.slice(0, 6)) console.log(`      ${s}`)
}
// the added pieces, by book (composer and opus, else the title before its number)
const book = (p) => `${b.composers[p.composer].name}, ${p.opus?.replace(/,? No\.? ?\d+.*$/, '') || p.title.replace(/[:,]? ?(Lesson|No\.|Movement|Nr\.) ?\d+.*$/, '')}`
const books = Object.entries(added.reduce((m, p) => ((m[book(p)] = (m[book(p)] ?? 0) + 1), m), {})).sort((x, y) => y[1] - x[1])
console.log(`${added.length} pieces added, in ${books.length} books:`)
for (const [k, n] of books.slice(0, all ? Infinity : 60)) console.log(`  ${n}\t${k}`)
// what the new catalogue carries that the old did not: a count of each, and the sidecar
const count = (xs) => Object.entries(xs.reduce((m, x) => ((m[x ?? 'none'] = (m[x ?? 'none'] ?? 0) + 1), m), {})).sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k} ${n}`).join(', ')
console.log(`mode stated ${b.pieces.filter((p) => p.mode).length}, meter stated ${b.pieces.filter((p) => p.meter).length} of ${b.pieces.length}`)
console.log(`kind: ${count(b.pieces.map((p) => p.kind ?? 'piece'))}`)
console.log(`form: ${count(b.pieces.map((p) => p.form))}`)
console.log(`period (by composer): ${count(b.composers.map((c) => c.period))}; by piece: ${count(b.pieces.map((p) => b.composers[p.composer].period))}`)
if (b.incipits) {
  const side = JSON.parse(readFileSync(`${B}/${b.incipits}`, 'utf8')).p
  const raw = readFileSync(`${B}/${b.incipits}`)
  const none = b.pieces.filter((p) => !side[p.id]).map((p) => p.id)
  console.log(`incipits ${b.incipits}: ${Object.keys(side).length} pieces, ${raw.length} bytes, ${gzipSync(raw).length} gzipped${none.length ? `; NONE for ${none.join(' ')}` : ''}`)
  if (none.length) bad.push(`no incipit for ${none.length} pieces`)
} else bad.push('catalog.json names no incipits sidecar')
console.log(`catalog.json ${statSync(`${A}/catalog.json`).size} -> ${statSync(`${B}/catalog.json`).size} bytes, gzipped ${gzipSync(readFileSync(`${A}/catalog.json`)).length} -> ${gzipSync(readFileSync(`${B}/catalog.json`)).length}`)
console.log(bad.length ? `IDENTITY BROKEN:\n  ${bad.join('\n  ')}` : 'identity holds: ids, order, tables, aliases, LICENSES.md, every old p/ file, and every file, bytes and sha256 but the new files above')
process.exit(bad.length ? 1 : 0)
