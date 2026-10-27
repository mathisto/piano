#!/usr/bin/env node
// Is a pickup patch only about the pieces where the notes and the .ly disagree? For each piece that got a `pickup`: what the detector
// finds on the published bytes alone (no .ly) against what the .ly states, and whether the entry changed beyond the new field.
//   node scripts/library/pickup-check.mjs --old LIVE --new PATCHED   (needs .cache/library/bin/pipeline.mjs)
import { readFileSync } from 'node:fs'

const ROOT = new URL('../..', import.meta.url).pathname
const arg = (k) => process.argv[process.argv.indexOf(`--${k}`) + 1]
const { analyse } = await import(`${ROOT}.cache/library/bin/pipeline.mjs`)
const read = (d) => JSON.parse(readFileSync(`${d}/catalog.json`, 'utf8'))
const [old, cat] = [arg('old'), arg('new')].map(read)
const j = JSON.stringify
const was = new Map(old.pieces.map((p) => [p.id, p]))
const kinds = {}
const note = (k, id) => (kinds[k] ??= []).push(id)
for (const p of cat.pieces) {
  if (p.pickup === undefined) continue
  const q = was.get(p.id)
  const c = cat.composers[p.composer]
  const a = await analyse({ id: p.id, title: p.title, format: 'midi', bytes: new Uint8Array(readFileSync(`${arg('old')}/${p.file}`)), composer: c.name })
  const det = a.song.bars[0].ql ?? 0
  const kind = p.pickup === det ? (p.pickup ? 'agree: pickup' : 'agree: none') : p.pickup === 0 ? 'false pickup removed' : det === 0 ? 'pickup gained' : 'wrong length corrected'
  note(kind, p.id)
  const moved = Object.keys({ ...p, ...q }).filter((k) => k !== 'pickup' && j(p[k]) !== j(q[k]))
  if (p.pickup === det && moved.length) note('AGREE BUT CHANGED', `${p.id} (${moved})`)
  if (p.pickup !== det && !moved.includes('bars') && !moved.includes('sec')) note('differs, layout same', p.id)
}
for (const [k, v] of Object.entries(kinds)) console.log(`${k}: ${v.length}${v.length < 25 ? `  ${v.join(' ')}` : ''}`)
