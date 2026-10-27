#!/usr/bin/env node
// What the .ly reader (repeats.ts) makes of each Mutopia piece of a published catalogue: how many get a pickup, and for the rest the
// cause, grouped (a table). The same .ly the pipeline would see (reanalyse.mjs: the cached .ly, the movement's pickLy, the volta read as unfold).
//   npx vite build --config scripts/library/vite.config.mjs && node scripts/library/ly-coverage.mjs [--from DIR] [--ids] [--id mutopia-N]
// --ids: list the ids of each cause. --id: for one piece, the reading against its MIDI (misses, lengths) and the first onsets it has no note at.
import { readFileSync } from 'node:fs'
import { sha, sourceOf } from './lib.mjs'

const ROOT = new URL('../..', import.meta.url).pathname
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d)
const FROM = arg('from', `${ROOT}.cache/library/out`)
const { pickLy, pickupWhy, reading, withRepeats } = await import(`${ROOT}.cache/library/bin/pipeline.mjs`)
const pins = new Set(JSON.parse(readFileSync(`${ROOT}scripts/library-sources.json`, 'utf8')).pieces.map((e) => e.id))
const cat = JSON.parse(readFileSync(`${FROM}/catalog.json`, 'utf8'))
const only = arg('id')
const table = {}
const moved = [] // the catalogue has a pickup and the reader now says something else
for (const p of cat.pieces) {
  if (p.source !== 'mutopia' || (only && p.id !== only)) continue
  const bytes = new Uint8Array(readFileSync(`${FROM}/${p.file}`))
  const { ly, midi } = await sourceOf(p.id, pickLy, `${ROOT}.cache/library/http`)
  let l = ly
  let matched = false
  let pickup
  if (ly) {
    const w = pins.has(p.id) ? { ly } : withRepeats({ bytes: new Uint8Array(midi), ly })
    const same = !w.bytes || sha(w.bytes) === p.sha256
    l = same ? w.ly : ly
    matched = same && !!w.matched
    pickup = w.pickup
  }
  const r = pickup !== undefined ? { pickup } : ly ? pickupWhy(bytes, l, matched) : { why: 'no .ly in the cache' }
  if (only) console.log(p.id, p.title, JSON.stringify(r), ly && JSON.stringify(reading(bytes, l), (k, v) => (typeof v === 'number' ? +v.toFixed(4) : v)))
  if (p.pickup !== undefined && p.pickup !== r.pickup) moved.push(`${p.id.slice(8)} ${p.pickup} -> ${r.pickup ?? r.why}`)
  ;(table[r.why?.replace(/\d+ of \d+/, 'N of M') ?? 'pickup read'] ??= []).push(p.id.slice(8))
}
if (!only)
  for (const [k, v] of Object.entries(table).sort((a, b) => b[1].length - a[1].length)) console.log(String(v.length).padStart(4), k, process.argv.includes('--ids') ? v.join(' ') : '')
if (moved.length) console.log(`published pickup not reproduced (${moved.length}):\n  ${moved.join('\n  ')}`)
