#!/usr/bin/env node
// The big library, batch: fetch, licence check, normalise here; analyse, dedupe, emit in pipeline.ts (bundled first).
//   npm run library:build -- [--set current|mutopia] [--grades 1-4] [--limit 500] [--out DIR]
// current: the pieces in scripts/library-sources.json (ids unchanged). mutopia: every solo keyboard piece on Mutopia.
// Resumable and polite: every request is cached in .cache/library/http (one request a second on a miss), so a rerun is offline
// and its output byte-identical. Output goes to .cache/library/out (never public/); the per-piece outcome to .cache/library/report-<set>.json.
import { readFileSync, writeFileSync } from 'node:fs'
import { get, movements, mutopiaMeta, openscoreMeta, refusals, sha, unzip } from './lib.mjs'
import { mutopiaIndex, soloKeyboard } from './mutopia-index.mjs'

const ROOT = new URL('../..', import.meta.url).pathname
const CACHE = `${ROOT}.cache/library`
const HTTP = `${CACHE}/http`
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const SET = arg('set', 'mutopia')
const OUT = arg('out', `${CACHE}/out`)
const grades = arg('grades', SET === 'mutopia' ? '1-4' : undefined)?.split('-').map(Number)
const limit = Number(arg('limit', SET === 'mutopia' ? 500 : Infinity))

const sources = JSON.parse(readFileSync(`${ROOT}scripts/library-sources.json`, 'utf8'))
// the project's allowlist (docs/library.md) plus Mutopia's own BSD-style licence; NC, ND and anything unknown are refused
const ALLOW = [...sources.allow, 'MutopiaBSD']
const licenceCheck = (x) => refusals(x, ALLOW)

const rows = [] // pieces refused before analysis: { id, stage, why }
const inputs = []
const refuse = (id, stage, why) => rows.push({ id, stage, why: [].concat(why) })
const page = (n) => `https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=${n}`
// the pieces already in public/library: in the mutopia set they keep their curated title, sha256 pin and id (dedupe never drops them)
const pins = new Map(sources.pieces.map((e) => [e.id, e]))

async function mutopia(n, pin) {
  const id = `mutopia-${n}`
  let m
  try {
    m = mutopiaMeta(id, (await get(page(n), HTTP)).toString())
  } catch (e) {
    return refuse(id, 'fetch', e.message)
  }
  const why = licenceCheck({ licence: m.licence, composer: m.composer ?? '', edition: m.sourceEdition, date: m.date })
  if (pin && pin.licence !== m.licence) why.push(`page says ${m.licence}, sources say ${pin.licence}`)
  if (pin && !pin.composer.endsWith(m.lifespan ?? '?')) why.push(`composer dates ${m.lifespan} differ from the sources`)
  if (why.length) return refuse(id, 'licence', why)
  if (!m.midi && !m.mids) return refuse(id, 'fetch', 'no MIDI file')
  let files // [id, title, midi, ly]
  try {
    const ly = m.ly && (await get(m.ly, HTTP).catch(() => undefined))?.toString()
    if (m.midi) files = [[id, pin?.title ?? m.title, await get(m.midi, HTTP), ly]]
    else {
      // multi-movement: mutopia-N-k, each with its own .ly when the -lys.zip has one of the same name, else the whole work's
      const lys = m.lys ? [...unzip(await get(m.lys, HTTP))] : []
      const base = m.mids.split('/').pop().slice(0, -'-mids.zip'.length)
      files = movements(await get(m.mids, HTTP), base).map((v, k) => [
        `${id}-${k + 1}`,
        `${m.title}: ${v.name}`,
        v.bytes,
        lys.find(([f]) => f.split('/').pop() === `${v.stem}.ly`)?.[1].toString() ?? ly,
      ])
    }
  } catch (e) {
    return refuse(id, 'fetch', e.message)
  }
  for (const [fid, title, midi, ly] of files) {
    if (pin?.sha256 && pin.sha256 !== sha(midi)) return refuse(id, 'fetch', 'upstream changed (sha256 pin)')
    inputs.push({
      id: fid,
      title,
      composer: pin?.composer ?? m.composer,
      ...(m.opus && !/^(not known|n\/a|none)$/i.test(m.opus) && { opus: m.opus }),
      source: 'mutopia',
      sourceUrl: page(n),
      licenceEvidence: page(n),
      licence: m.licence,
      licenceUrl: m.licenceUrl,
      edition: m.sourceEdition,
      ...(m.typesetter && { typesetter: m.typesetter }),
      ...(m.arranger && { arranger: m.arranger }),
      ...(m.style && { style: m.style }),
      format: 'midi',
      bytes: new Uint8Array(midi),
      upstreamSha: sha(midi),
      ...(ly && { ly }),
    })
  }
}

async function lieder(e) {
  const path = e.path.split('/').map(encodeURIComponent).join('/')
  let up
  try {
    up = await get(`https://raw.githubusercontent.com/OpenScore/Lieder/main/${path}`, HTTP)
  } catch (err) {
    return refuse(e.id, 'fetch', err.message)
  }
  if (e.sha256 && e.sha256 !== sha(up)) return refuse(e.id, 'fetch', 'upstream changed (sha256 pin)')
  let m
  try {
    m = openscoreMeta(e, up) // refuses a file whose <rights> do not say CC0; drops the non-piano parts
  } catch (err) {
    return refuse(e.id, 'licence', err.message)
  }
  const why = licenceCheck({ licence: 'CC0-1.0', composer: e.composer, edition: m.sourceEdition })
  if (why.length) return refuse(e.id, 'licence', why)
  const url = `https://github.com/OpenScore/Lieder/blob/main/${path}`
  inputs.push({
    id: e.id,
    title: e.title,
    composer: e.composer,
    source: 'openscore-lieder',
    sourceUrl: url,
    licenceEvidence: url, // the <rights> element of the file itself
    licence: 'CC0-1.0',
    licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    edition: m.sourceEdition,
    format: 'musicxml',
    bytes: new Uint8Array(m.bytes),
    upstreamSha: sha(up),
  })
}

const t0 = Date.now()
let level = {}
if (SET === 'current') {
  for (const e of sources.pieces) {
    level[e.id] = e.level
    if (e.src === 'mutopia') await mutopia(e.piece, e)
    else await lieder(e)
  }
} else {
  const index = await mutopiaIndex(HTTP)
  const solo = index.filter((r) => soloKeyboard(r.instruments))
  console.log(`index: ${index.length} keyboard-tagged, ${solo.length} solo keyboard`)
  for (const r of index) if (!solo.includes(r)) refuse(`mutopia-${r.id}`, 'normalise', `not solo keyboard: ${r.instruments}`)
  for (const r of solo) await mutopia(r.id, pins.get(`mutopia-${r.id}`))
}

const bin = `${CACHE}/bin/pipeline.mjs`
const { run } = await import(bin).catch(() => {
  throw new Error(`${bin} missing: run npx vite build --config scripts/library/vite.config.mjs first (npm run library:build does)`)
})
const overrides = JSON.parse(readFileSync(`${ROOT}scripts/library/overrides.json`, 'utf8'))
const done = await run(inputs, OUT, { overrides, grades, limit, pinned: [...pins.keys()] })
const all = [...rows, ...done].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
writeFileSync(`${CACHE}/report-${SET}.json`, JSON.stringify(all, null, 1) + '\n')

// summary
const count = (xs) => Object.entries(xs.reduce((o, k) => ((o[k] = (o[k] ?? 0) + 1), o), {})).sort((a, b) => b[1] - a[1])
console.log('stage', count(all.map((r) => r.stage)))
console.log('reasons', count(all.filter((r) => r.stage !== 'shipped').flatMap((r) => r.why.map((w) => `${r.stage}: ${w.replace(/duplicate of .*|not solo keyboard: .*|grade \d/, (s) => s.split(/ (of|keyboard:) /)[0])}`))))
console.log('grades (analysed, no fails)', count(done.filter((r) => r.grade).map((r) => r.grade)).sort())
if (SET === 'current') {
  const rank = { Beginner: 1, Elementary: 2, Intermediate: 3 }
  const xs = done.filter((r) => r.grade && level[r.id]).map((r) => [rank[level[r.id]], r.d])
  const ranks = (v) => v.map((x) => (v.filter((y) => y < x).length + (v.filter((y) => y === x).length + 1) / 2))
  const [a, b] = [ranks(xs.map((x) => x[0])), ranks(xs.map((x) => x[1]))]
  const mean = (v) => v.reduce((s, x) => s + x, 0) / v.length
  const [ma, mb] = [mean(a), mean(b)]
  const cov = a.reduce((s, x, i) => s + (x - ma) * (b[i] - mb), 0)
  const rho = cov / Math.sqrt(a.reduce((s, x) => s + (x - ma) ** 2, 0) * b.reduce((s, x) => s + (x - mb) ** 2, 0))
  console.log(`Spearman(hand level, D) over ${xs.length} pieces: ${rho.toFixed(2)}`)
  for (const [lv, k] of Object.entries(rank)) console.log(lv, count(done.filter((r) => level[r.id] === lv && r.grade).map((r) => r.grade)).sort())
}
console.log(`${inputs.length} analysed, ${done.filter((r) => r.stage === 'shipped').length} shipped to ${OUT}, ${((Date.now() - t0) / 1000).toFixed(0)} s`)
