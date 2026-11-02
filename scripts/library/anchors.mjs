#!/usr/bin/env node
// Validate the G1 owner-review anchors. Pass a catalog.json to also check exact live identities.
import { readFileSync } from 'node:fs'

const read = (file) => JSON.parse(readFileSync(file, 'utf8'))
const data = read(new URL('./anchors.json', import.meta.url))
const fail = (message) => { throw new Error(message) }
const ids = new Set()
const levels = new Map()

if (data.anchors.length < 60 || data.anchors.length > 200) fail(`expected 60–200 anchors, got ${data.anchors.length}`)
for (const a of data.anchors) {
  if (ids.has(a.id)) fail(`duplicate anchor ${a.id}`)
  if (!data.sources[a.source]) fail(`${a.id}: unknown source ${a.source}`)
  if (!Number.isInteger(a.lvl) || a.lvl < 1 || a.lvl > 9) fail(`${a.id}: bad Henle level ${a.lvl}`)
  if (!a.composer || !a.title || !a.henle) fail(`${a.id}: incomplete identity`)
  if (a.abrsm !== undefined && (!Number.isInteger(a.abrsm) || a.abrsm < 1 || a.abrsm > 8 || !a.abrsmPage)) fail(`${a.id}: bad ABRSM placement`)
  ids.add(a.id)
  levels.set(a.lvl, (levels.get(a.lvl) ?? 0) + 1)
}
for (const edge of [1, 9]) if (!levels.has(edge)) fail(`no Henle ${edge} anchor`)

const catalogFile = process.argv[2]
if (catalogFile) {
  const catalog = read(catalogFile)
  const pieces = new Map(catalog.pieces.map((p) => [p.id, p]))
  for (const a of data.anchors) {
    const p = pieces.get(a.id)
    if (!p) fail(`${a.id}: absent from ${catalogFile}`)
    const composer = catalog.composers[p.composer]?.name
    if (composer !== a.composer || p.title !== a.title) fail(`${a.id}: catalogue identity changed to ${composer} — ${p.title}`)
    if (['accompaniment', 'fragment', 'study'].includes(p.kind)) fail(`${a.id}: ${p.kind} cannot anchor the piece ladder`)
  }
}

const spread = [...levels].sort((a, b) => a[0] - b[0]).map(([n, count]) => `${n}:${count}`).join(' ')
const abrsm = data.anchors.filter((a) => a.abrsm).length
console.log(`${data.anchors.length} anchors; Henle ${spread}; ABRSM ${abrsm}${catalogFile ? `; catalogue ${data.anchors.length}/${data.anchors.length}` : ''}`)
