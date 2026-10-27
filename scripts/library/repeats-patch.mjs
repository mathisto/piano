#!/usr/bin/env node
// Patch a published catalogue in place of a full rebuild: every shipped Mutopia piece flagged `repeats` (pinned ones aside) is
// run through the pipeline again, whose repeats hook (repeats.ts) plays its volta repeats out. A piece that unfolds keeps its id
// and gets the new file, sha, bytes, bars, sec and analysis; the rest stay as they were, with the reason printed. Same pieces.
//   npx vite build --config scripts/library/vite.config.mjs && node scripts/library/repeats-patch.mjs [--from DIR] [--out DIR]
// --from: the published output (catalog.json, LICENSES.md, p/), read only. --out: the changed pieces' new files, catalog.json,
// LICENSES.md. The .ly sources are fetched like build.mjs does (cached in .cache/library/http, one request a second on a miss).
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { get, movements, mutopiaMeta, sha, unzip } from './lib.mjs'

const ROOT = new URL('../..', import.meta.url).pathname
const HTTP = `${ROOT}.cache/library/http`
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d)
const FROM = arg('from', `${ROOT}.cache/library/out`)
const OUT = arg('out', `${ROOT}.cache/library/out-repeats`)
const { run, unfold } = await import(`${ROOT}.cache/library/bin/pipeline.mjs`)

const cat = JSON.parse(readFileSync(`${FROM}/catalog.json`, 'utf8'))
const pins = new Set(JSON.parse(readFileSync(`${ROOT}scripts/library-sources.json`, 'utf8')).pieces.map((e) => e.id))
const overrides = JSON.parse(readFileSync(`${ROOT}scripts/library/overrides.json`, 'utf8'))
const page = (n) => `https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=${n}`

// the .ly build.mjs reads: the piece's, or for movement k of a -mids.zip work the -lys.zip file of the same name, else the work's
async function lyOf(id) {
  const [, n, k] = id.split('-')
  const m = mutopiaMeta(id, (await get(page(n), HTTP)).toString())
  const ly = m.ly && (await get(m.ly, HTTP)).toString()
  if (!k) return ly
  const lys = m.lys ? [...unzip(await get(m.lys, HTTP))] : []
  const v = movements(await get(m.mids, HTTP), m.mids.split('/').pop().slice(0, -'-mids.zip'.length))[k - 1]
  return lys.find(([f]) => f.split('/').pop() === `${v.stem}.ly`)?.[1].toString() ?? ly
}

const before = cat.pieces.map((p) => p.sha256)
const flagged = cat.pieces.filter((p) => p.source === 'mutopia' && p.flags.includes('repeats') && !pins.has(p.id))
const inputs = []
for (const p of flagged) {
  const c = cat.composers[p.composer]
  inputs.push({
    id: p.id,
    title: p.title,
    composer: `${c.name} (${c.born ?? ''}–${c.died})`,
    ...(p.opus && { opus: p.opus }),
    source: p.source,
    sourceUrl: p.sourceUrl,
    licenceEvidence: p.licenceEvidence,
    licence: cat.licences[p.licence].id,
    licenceUrl: cat.licences[p.licence].url,
    edition: p.edition,
    format: p.format,
    bytes: new Uint8Array(readFileSync(`${FROM}/${p.file}`)),
    upstreamSha: p.sha256,
    ly: await lyOf(p.id),
  })
}

const tmp = mkdtempSync(`${tmpdir()}/repeats-`)
const rows = await run(inputs, tmp, { overrides })
const fresh = new Map(JSON.parse(readFileSync(`${tmp}/catalog.json`, 'utf8')).pieces.map((p) => [p.id, p]))
mkdirSync(`${OUT}/p`, { recursive: true })
let licences = readFileSync(`${FROM}/LICENSES.md`, 'utf8')
const why = {}
const FIELDS = ['bars', 'sec', 'bpm', 'notes', 'lo', 'hi', 'fifths', 'keys', 'meter', 'tracks', 'pick', 'grade', 'gradeWhy', 'quality', 'flags', 'file', 'bytes', 'sha256']
cat.pieces = cat.pieces.map((p) => {
  const q = fresh.get(p.id)
  const e = inputs.find((x) => x.id === p.id)
  if (!e) return p
  if (!q || q.flags.includes('repeats')) {
    ;(why[unfold(e.bytes, e.ly ?? '').why ?? `not shipped by the rerun (${rows.find((r) => r.id === p.id)?.why.join(', ')})`] ??= []).push(p.id)
    return p
  }
  if (q.sha256 === p.sha256) (why['flag dropped, file unchanged: nothing to play twice (its MIDI score has no volta, or only volta 1)'] ??= []).push(p.id)
  else {
    cpSync(`${tmp}/${q.file}`, `${OUT}/${q.file}`)
    licences = licences.replaceAll(`\`${p.file}\``, `\`${q.file}\``)
    console.log(`${p.id} ${p.title}: bars ${p.bars} -> ${q.bars}, ${p.sec} -> ${q.sec} s, notes ${p.notes} -> ${q.notes}, grade ${p.grade} -> ${q.grade}`)
  }
  const r = { ...p }
  for (const k of FIELDS) delete r[k]
  for (const k of FIELDS) if (k in q) r[k] = q[k]
  return r
})
cat.built = sha(JSON.stringify([cat.composers, cat.licences, cat.aliases ?? {}, cat.pieces])).slice(0, 16) // the app refetches on a new built
writeFileSync(`${OUT}/catalog.json`, JSON.stringify(cat) + '\n')
writeFileSync(`${OUT}/LICENSES.md`, licences)
console.log(`${flagged.length} flagged (pinned aside), ${cat.pieces.filter((p, i) => p.sha256 !== before[i]).length} unfolded:`)
for (const [w, ids] of Object.entries(why)) console.log(`  ${ids.length} ${w}: ${ids.join(' ')}`)
