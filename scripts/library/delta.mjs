// Publish what a code change moves, and nothing else: re-analyse the live catalogue at the commit before the change and at the change
// (reanalyse.mjs, no mode), then take the live entries plus each analysis field where the two runs differ. A piece whose pickup moves is
// left as published: its re-unfolded file no longer matches the published bytes, so the run read it without its first bar (datafix.md).
//   node scripts/library/delta.mjs <live> <old-run> <new-run> <out>      then LIBRARY_OUT=<out> scripts/deploy-library.sh
import { readFileSync, writeFileSync, cpSync } from 'node:fs'
import { createHash } from 'node:crypto'
const [live, old, neu, out] = process.argv.slice(2)
const rd = (d) => JSON.parse(readFileSync(`${d}/catalog.json`, 'utf8'))
const L = rd(live), O = rd(old), N = rd(neu)
const by = (c) => new Map(c.pieces.map((p) => [p.id, p]))
const o = by(O), n = by(N)
const J = JSON.stringify
let changed = 0, skipped = []
L.pieces = L.pieces.map((p) => {
  const a = o.get(p.id), b = n.get(p.id)
  if (J(a.pickup) !== J(b.pickup)) return skipped.push(p.id), p
  const r = { ...p }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (J(a[k]) !== J(b[k])) b[k] === undefined ? delete r[k] : (r[k] = b[k])
  if (J(r) !== J(p)) changed++
  return r
})
L.built = createHash('sha256').update(J([L.composers, L.licences, L.aliases ?? {}, L.pieces])).digest('hex').slice(0, 16)
cpSync(live, out, { recursive: true })
writeFileSync(`${out}/catalog.json`, J(L) + '\n')
console.log(`${changed} pieces changed, kept as published: ${skipped.join(' ')}; built ${L.built}`)
