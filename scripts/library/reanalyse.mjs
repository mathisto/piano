#!/usr/bin/env node
// Re-analyse a published catalogue with the current pipeline, keeping every id, file and sha256: the published bytes (and for Mutopia
// MIDI the cached .ly) go back through run(), and only the analysis fields of each entry are replaced (flags, bpm, tempo, pickup, grade, ...).
// A from-scratch build cannot do this: dedupe, merge order and the unfold of repeats pick other files for some pieces (docs/changes/rebuild.md).
//   npx vite build --config scripts/library/vite.config.mjs && node scripts/library/reanalyse.mjs [--from DIR] [--out DIR] [--pickup-only | --ly-only]
// --pickup-only: analyse every piece twice, with and without the .ly's pickup, and put only the difference into the published entry (the
// pickup, and what a different first bar moves: bars, sec, keys, flags, grade ...); other ways today's pipeline differs from what was published stay out.
// --ly-only: the same, for everything the .ly reader gives (pickup and pace, Input.noPickup + noPace): a piece whose published file is still the
// original MIDI also has its repeats played out where the reader now can (a new content-addressed file, as repeats-patch.mjs makes it, and its
// repeats / dc-ds flags from that run); a piece with no volta, or already unfolded, keeps its file and its repeat flags.
// --formtempo-only: the same, for the form guess of formtempo.ts: the piece with and without it (Input.noFormTempo), only the difference goes into the published entry.
// --flag NAME: re-analyse only the pieces carrying that flag; every other piece stays byte for byte as published (formtempo.md: --flag no-tempo).
// --from: the published output (catalog.json, LICENSES.md, p/), read only. --out: catalog.json, LICENSES.md and a copy of p/ (deploy-library.sh's LIBRARY_OUT).
// Offline: .ly pages and zips come from .cache/library/http (a miss is fetched, one request a second).
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { sha, sourceOf } from './lib.mjs'

const ROOT = new URL('../..', import.meta.url).pathname
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d)
const FROM = arg('from', `${ROOT}.cache/library/out`)
const OUT = arg('out', `${ROOT}.cache/library/out-rebuilt`)
const { pickLy, plays, run, withRepeats } = await import(`${ROOT}.cache/library/bin/pipeline.mjs`)
const pins = new Set(JSON.parse(readFileSync(`${ROOT}scripts/library-sources.json`, 'utf8')).pieces.map((e) => e.id))
const lyOnly = process.argv.includes('--ly-only')
const without = process.argv.includes('--pickup-only') ? { noPickup: true } : lyOnly ? { noPickup: true, noPace: true } : process.argv.includes('--formtempo-only') ? { noFormTempo: true } : undefined
const flag = arg('flag')
const overrides = JSON.parse(readFileSync(`${ROOT}scripts/library/overrides.json`, 'utf8'))

// what analyse()/judge()/run() derive from the score; everything else (title, composer, licence, file, sha256, tags with the style) stays as published
const ANALYSIS = new Set(['fifths', 'keys', 'meter', 'bars', 'sec', 'bpm', 'notes', 'lo', 'hi', 'tracks', 'pick', 'tempo', 'pickup', 'grade', 'gradeWhy', 'gradeOverride', 'quality', 'flags'])
// what a piece that gets a new file takes from the run that made it (repeats-patch.mjs: FIELDS)
const NEWFILE = [...ANALYSIS].filter((k) => k !== 'gradeOverride').concat(['file', 'bytes', 'sha256'])
const cat = JSON.parse(readFileSync(`${FROM}/catalog.json`, 'utf8'))
const tmp = mkdtempSync(`${tmpdir()}/reanalyse-`)
const lost = []
const kept = new Map() // the new files
const unfolded = [] // [published id, new file name, old file name]
const skewed = [] // a fresh build would ship other bytes for these (kept as published, .ly read as it comes)
const pieces = []
for (const p of cat.pieces) {
  if (flag && !p.flags.includes(flag)) {
    pieces.push(p)
    continue
  }
  const c = cat.composers[p.composer]
  const l = cat.licences[p.licence]
  let unpinned // the same piece through run() unpinned (--ly-only, a piece still at its original MIDI)
  const e = {
    id: p.id, title: p.title, composer: `${c.name} (${c.born ?? ''}–${c.died})`, ...(p.opus && { opus: p.opus }), source: p.source,
    sourceUrl: p.sourceUrl, licenceEvidence: p.licenceEvidence, licence: l.id, licenceUrl: l.url, edition: p.edition,
    ...(p.typesetter && { typesetter: p.typesetter }), ...(p.arranger && { arranger: p.arranger }), format: p.format,
    bytes: new Uint8Array(readFileSync(`${FROM}/${p.file}`)), upstreamSha: p.sha256,
    ...(p.flags.includes('voice-folded') && { voice: 'folded' }), ...(p.flags.includes('voice-dropped') && { voice: 'dropped' }),
  }
  // --ly-only: a movement's pace stays as published. Its .ly is its book's (a megabyte with every movement's \tempo in it), and lyPace reads text, not the score
  // that plays this file; the pickup and the repeats are read from that score, so those move
  const movement = lyOnly && /^mutopia-\d+-\d+$/.test(p.id)
  if (movement) e.pace = p.tempo !== undefined ? { given: false, bpm: p.tempo, exact: !p.flags.includes('tempo-estimated') } : p.flags.includes('no-tempo') ? { given: false } : { given: true }
  if (p.source === 'mutopia') {
    // what build.mjs does: unfold the volta repeats of the original MIDI (never a bundled piece's) and read the .ly's volta as unfold. When that
    // gives the published bytes, the analysis sees what a fresh build sees; when it does not (the BWV 827 movements, published before pickLy), the .ly stays as it is
    const { ly, midi } = await sourceOf(p.id, pickLy, `${ROOT}.cache/library/http`)
    const w = pins.has(p.id) ? { ly } : withRepeats({ bytes: new Uint8Array(midi), ly })
    const same = !w.bytes || sha(w.bytes) === p.sha256
    e.ly = same ? w.ly : ly
    e.matched = same && !!w.matched // as build.mjs has it: the .ly was read against the original MIDI before the unfold
    if (w.pickup !== undefined) e.pickup = w.pickup // ... and so was the first bar
    if (!same) skewed.push(p.id)
    if (lyOnly && ly && !pins.has(p.id) && sha(new Uint8Array(midi)) === p.sha256 && plays(e.bytes, ly)) {
      // still the original MIDI, and this .ly is its score: through run() as a build does it, which plays the repeats out where the reader can (repeats-patch.mjs)
      await run([{ ...e, ly, matched: undefined, pickup: undefined }], tmp, { overrides })
      unpinned = JSON.parse(readFileSync(`${tmp}/catalog.json`, 'utf8')).pieces[0]
    }
  }
  if (unpinned && unpinned.sha256 !== p.sha256 && !unpinned.flags.includes('repeats')) {
    unfolded.push([p.id, unpinned.file, p.file])
    kept.set(unpinned.file, readFileSync(`${tmp}/${unpinned.file}`)) // run() clears its p/ for the next piece
    const r = { ...p }
    for (const k of NEWFILE) delete r[k]
    for (const k of NEWFILE) if (k in unpinned) r[k] = unpinned[k]
    pieces.push(r)
    continue
  }
  // pinned alone: no dedupe partner, no unfold, shipped at any grade (the published bytes stay)
  await run([e], tmp, { overrides, pinned: [p.id] })
  const q = JSON.parse(readFileSync(`${tmp}/catalog.json`, 'utf8')).pieces[0]
  if (!q || q.sha256 !== p.sha256) {
    lost.push(p.id)
    pieces.push(p)
    continue
  }
  let r = {}
  if (without) {
    await run([{ ...e, ...without }], tmp, { overrides, pinned: [p.id] })
    const b = JSON.parse(readFileSync(`${tmp}/catalog.json`, 'utf8')).pieces[0]
    r = { ...p }
    for (const k of new Set([...Object.keys(q), ...Object.keys(b)])) if (k !== 'tags' && JSON.stringify(q[k]) !== JSON.stringify(b[k])) q[k] === undefined ? delete r[k] : (r[k] = q[k])
    // flags and quality move by the difference only: a flag today's pipeline sets or drops for other reasons (repeats, tuplets ...) stays as published
    r.flags = [...p.flags.filter((f) => !b.flags.includes(f) || q.flags.includes(f)), ...q.flags.filter((f) => !b.flags.includes(f) && !p.flags.includes(f))]
    // the pace flags are the .ly's own: a no-tempo it takes away, a tempo-estimated it adds, whatever the published flags were
    for (const f of lyOnly && !movement ? ['no-tempo', 'tempo-estimated'] : []) if (r.flags.includes(f) !== q.flags.includes(f)) r.flags = q.flags.includes(f) ? [...r.flags, f] : r.flags.filter((x) => x !== f)
    // quality is 100 - 10 per review item - 3 per flag: the difference in review items (from q and b), and the flags r has against p
    r.quality = p.quality + q.quality - b.quality + 3 * (q.flags.length - b.flags.length) - 3 * (r.flags.length - p.flags.length)
    // a piece at its original MIDI has the repeat flags that run() gives (volta and D.C. marks in a .ly it could not read before)
    for (const f of unpinned && !/^mutopia-\d+-\d+$/.test(p.id) ? ['repeats', 'dc-ds'] : []) { // (a movement's .ly may be its whole book's text: the marks in it are not this file's)
      const [had, has] = [r.flags.includes(f), unpinned.flags.includes(f)]
      if (had !== has) (r.flags = has ? [...r.flags, f] : r.flags.filter((x) => x !== f)), (r.quality += has ? -3 : 3)
    }
  } else {
    for (const k of Object.keys(q)) r[k] = ANALYSIS.has(k) ? q[k] : p[k]
    for (const k of Object.keys(p)) if (!(k in r) && !ANALYSIS.has(k)) r[k] = p[k]
  }
  pieces.push(r)
}
cat.pieces = pieces
if (skewed.length) console.log(`fresh build would ship other bytes: ${skewed.join(' ')}`)
if (lost.length) console.log(`NOT re-analysed (dropped by the gates or sha mismatch), kept as published: ${lost.join(' ')}`)
cat.built = sha(JSON.stringify([cat.composers, cat.licences, cat.aliases ?? {}, cat.pieces])).slice(0, 16) // the app refetches on a new built
mkdirSync(OUT, { recursive: true })
cpSync(`${FROM}/p`, `${OUT}/p`, { recursive: true })
let licences = readFileSync(`${FROM}/LICENSES.md`, 'utf8')
for (const [, now, was] of unfolded) {
  writeFileSync(`${OUT}/${now}`, kept.get(now))
  licences = licences.replaceAll(`\`${was}\``, `\`${now}\``)
}
writeFileSync(`${OUT}/LICENSES.md`, licences)
writeFileSync(`${OUT}/catalog.json`, JSON.stringify(cat) + '\n')
if (unfolded.length) console.log(`repeats played out, new files: ${unfolded.map(([id]) => id).join(' ')}`)
console.log(`${cat.pieces.length} pieces to ${OUT}, built ${cat.built}`)
