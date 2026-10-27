#!/usr/bin/env node
// Re-analyse a published catalogue with the current pipeline, keeping every id, file and sha256: the published bytes (and for Mutopia
// MIDI the cached .ly) go back through run(), and only the analysis fields of each entry are replaced (flags, bpm, tempo, grade, ...).
// A from-scratch build cannot do this: dedupe, merge order and the unfold of repeats pick other files for some pieces (docs/changes/rebuild.md).
//   npx vite build --config scripts/library/vite.config.mjs && node scripts/library/reanalyse.mjs [--from DIR] [--out DIR]
// --from: the published output (catalog.json, LICENSES.md, p/), read only. --out: catalog.json, LICENSES.md and a copy of p/ (deploy-library.sh's LIBRARY_OUT).
// Offline: .ly pages and zips come from .cache/library/http (a miss is fetched, one request a second).
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { sha, sourceOf } from './lib.mjs'

const ROOT = new URL('../..', import.meta.url).pathname
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d)
const FROM = arg('from', `${ROOT}.cache/library/out`)
const OUT = arg('out', `${ROOT}.cache/library/out-rebuilt`)
const { pickLy, run, withRepeats } = await import(`${ROOT}.cache/library/bin/pipeline.mjs`)
const pins = new Set(JSON.parse(readFileSync(`${ROOT}scripts/library-sources.json`, 'utf8')).pieces.map((e) => e.id))
const overrides = JSON.parse(readFileSync(`${ROOT}scripts/library/overrides.json`, 'utf8'))

// what analyse()/judge()/run() derive from the score; everything else (title, composer, licence, file, sha256, tags with the style) stays as published
const ANALYSIS = new Set(['fifths', 'keys', 'meter', 'bars', 'sec', 'bpm', 'notes', 'lo', 'hi', 'tracks', 'pick', 'tempo', 'grade', 'gradeWhy', 'gradeOverride', 'quality', 'flags'])
const cat = JSON.parse(readFileSync(`${FROM}/catalog.json`, 'utf8'))
const tmp = mkdtempSync(`${tmpdir()}/reanalyse-`)
const lost = []
const skewed = [] // a fresh build would ship other bytes for these (kept as published, .ly read as it comes)
const pieces = []
for (const p of cat.pieces) {
  const c = cat.composers[p.composer]
  const l = cat.licences[p.licence]
  const e = {
    id: p.id, title: p.title, composer: `${c.name} (${c.born ?? ''}–${c.died})`, ...(p.opus && { opus: p.opus }), source: p.source,
    sourceUrl: p.sourceUrl, licenceEvidence: p.licenceEvidence, licence: l.id, licenceUrl: l.url, edition: p.edition,
    ...(p.typesetter && { typesetter: p.typesetter }), ...(p.arranger && { arranger: p.arranger }), format: p.format,
    bytes: new Uint8Array(readFileSync(`${FROM}/${p.file}`)), upstreamSha: p.sha256,
    ...(p.flags.includes('voice-folded') && { voice: 'folded' }), ...(p.flags.includes('voice-dropped') && { voice: 'dropped' }),
  }
  if (p.source === 'mutopia') {
    // what build.mjs does: unfold the volta repeats of the original MIDI (never a bundled piece's) and read the .ly's volta as unfold. When that
    // gives the published bytes, the analysis sees what a fresh build sees; when it does not (the BWV 827 movements, published before pickLy), the .ly stays as it is
    const { ly, midi } = await sourceOf(p.id, pickLy, `${ROOT}.cache/library/http`)
    const w = pins.has(p.id) ? { ly } : withRepeats({ bytes: new Uint8Array(midi), ly })
    const same = !w.bytes || sha(w.bytes) === p.sha256
    e.ly = same ? w.ly : ly
    if (!same) skewed.push(p.id)
  }
  // pinned alone: no dedupe partner, no unfold, shipped at any grade (the published bytes stay)
  await run([e], tmp, { overrides, pinned: [p.id] })
  const q = JSON.parse(readFileSync(`${tmp}/catalog.json`, 'utf8')).pieces[0]
  if (!q || q.sha256 !== p.sha256) {
    lost.push(p.id)
    pieces.push(p)
    continue
  }
  const r = {}
  for (const k of Object.keys(q)) r[k] = ANALYSIS.has(k) ? q[k] : p[k]
  for (const k of Object.keys(p)) if (!(k in r) && !ANALYSIS.has(k)) r[k] = p[k]
  pieces.push(r)
}
cat.pieces = pieces
if (skewed.length) console.log(`fresh build would ship other bytes: ${skewed.join(' ')}`)
if (lost.length) console.log(`NOT re-analysed (dropped by the gates or sha mismatch), kept as published: ${lost.join(' ')}`)
cat.built = sha(JSON.stringify([cat.composers, cat.licences, cat.aliases ?? {}, cat.pieces])).slice(0, 16) // the app refetches on a new built
mkdirSync(OUT, { recursive: true })
cpSync(`${FROM}/p`, `${OUT}/p`, { recursive: true })
cpSync(`${FROM}/LICENSES.md`, `${OUT}/LICENSES.md`)
writeFileSync(`${OUT}/catalog.json`, JSON.stringify(cat) + '\n')
console.log(`${cat.pieces.length} pieces to ${OUT}, built ${cat.built}`)
