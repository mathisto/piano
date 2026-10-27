#!/usr/bin/env node
// The big library, batch: fetch, licence check, normalise here; analyse, dedupe, emit in pipeline.ts (bundled first).
//   npm run library:build -- [--set current|mutopia|lieder|chopin] [--grades 1-4] [--limit N] [--out DIR] [--merge-with DIR]
// current: the pieces in scripts/library-sources.json (ids unchanged). mutopia: every solo keyboard piece on Mutopia.
// lieder: every OpenScore Lieder song, its vocal line folded into the right hand when that stays playable, else piano-only.
// chopin: the Chopin Institute's first editions (Humdrum **kern, CC BY 4.0), shipped as MusicXML; one edition a work.
// --merge-with: OUT also gets every piece of that (published) output, untouched, the new ones added after them; its pieces
// count as pinned here, so dedupe never ships a new duplicate of one.
// Resumable and polite: every request is cached in .cache/library/http (one request a second on a miss), so a rerun is offline
// and its output byte-identical. Output goes to .cache/library/out (never public/); the per-piece outcome to .cache/library/report-<set>.json.
import { readFileSync, writeFileSync } from 'node:fs'
import { get, lyCandidates, movements, mutopiaMeta, openscoreMeta, PIANO, refusals, scoreParts, sha, unzip, zip } from './lib.mjs'
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
const MERGE = arg('merge-with')
const grades = arg('grades')?.split('-').map(Number) // default: every grade, every piece that passes the gates
const limit = Number(arg('limit', Infinity))

const sources = JSON.parse(readFileSync(`${ROOT}scripts/library-sources.json`, 'utf8'))
// the project's allowlist (docs/library.md) plus Mutopia's own BSD-style licence; NC, ND and anything unknown are refused
const ALLOW = [...sources.allow, 'MutopiaBSD']
const licenceCheck = (x) => refusals(x, ALLOW)

const bin = `${CACHE}/bin/pipeline.mjs`
const { run, merge, pickLy, kernToMusicXml } = await import(bin).catch(() => {
  throw new Error(`${bin} missing: run npx vite build --config scripts/library/vite.config.mjs first (npm run library:build does)`)
})
const rows = [] // pieces refused before analysis: { id, stage, why }
const inputs = []
const refuse = (id, stage, why) => void rows.push({ id, stage, why: [].concat(why) })
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
  const why = licenceCheck({ id, licence: m.licence, composer: m.composer ?? '', edition: m.sourceEdition, date: m.date })
  if (pin && pin.licence !== m.licence) why.push(`page says ${m.licence}, sources say ${pin.licence}`)
  if (pin && !pin.composer.endsWith(m.lifespan ?? '?')) why.push(`composer dates ${m.lifespan} differ from the sources`)
  if (why.length) return refuse(id, 'licence', why)
  if (!m.midi && !m.mids) return refuse(id, 'fetch', 'no MIDI file')
  let files // [id, title, midi, ly]
  try {
    const ly = m.ly && (await get(m.ly, HTTP).catch(() => undefined))?.toString()
    if (m.midi) files = [[id, pin?.title ?? m.title, await get(m.midi, HTTP), ly]]
    else {
      // multi-movement: mutopia-N-k, each with the .ly of the -lys.zip (or the work's) whose reading matches its MIDI
      const lys = m.lys ? [...unzip(await get(m.lys, HTTP))] : []
      const base = m.mids.split('/').pop().slice(0, -'-mids.zip'.length)
      files = movements(await get(m.mids, HTTP), base).map((v, k) => [
        `${id}-${k + 1}`,
        `${m.title}: ${v.name}`,
        v.bytes,
        pickLy(v.bytes, lyCandidates(lys, v.stem, ly)), // the one whose reading matches the MIDI (BWV 827: -2.mid is the third score)
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

const raw = (path) => `https://raw.githubusercontent.com/OpenScore/Lieder/main/${path.split('/').map(encodeURIComponent).join('/')}`

/** One song as an Input (or refused): e.foldParts and e.dropParts as in scripts/library-sources.json. */
async function lieder(e) {
  const path = e.path.split('/').map(encodeURIComponent).join('/')
  let up
  try {
    up = await get(raw(e.path), HTTP)
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
  const why = licenceCheck({ id: e.id, licence: 'CC0-1.0', composer: e.composer, edition: m.sourceEdition })
  if (why.length) return refuse(e.id, 'licence', why)
  const url = `https://github.com/OpenScore/Lieder/blob/main/${path}`
  return {
    id: e.id,
    title: e.title,
    composer: e.composer,
    source: 'openscore-lieder',
    sourceUrl: url,
    licenceEvidence: url, // the <rights> element of the file itself
    licence: 'CC0-1.0',
    licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    edition: m.sourceEdition.replace(/; the vocal line is folded into the right hand$/, ''), // the voice-folded flag says it (as src/catalog.ts builtin())
    format: 'musicxml',
    bytes: new Uint8Array(m.bytes),
    upstreamSha: sha(up),
    ...(e.foldParts ? { voice: 'folded' } : e.dropParts?.length && { voice: 'dropped' }),
  }
}

// 'Die schöne Müllerin, D. 795' + '01_Das_Wandern' -> 'Das Wandern, D. 795 No. 1'
const CATNO = /\b(Op\.|D\.|WoO|H\.|S\.|K\.|VWV|TrV|FWV)\s?\d+[a-z]?/
const words = (s) => s.replace(/_/g, ' ').replace(/\b(Op\.|D\.|H\.|S\.|K\.)(?=\d)/g, '$1 ')
function liederTitle(set, song) {
  const no = /^(\d+)[a-z]?_/.exec(song)?.[1]
  const name = words(song.replace(/^\d+[a-z]?_/, ''))
  const cat = CATNO.exec(words(set))?.[0]
  return cat && !CATNO.test(name) ? `${name}, ${cat}${no ? ` No. ${Number(no)}` : ''}` : name
}

/** Every song in the corpus: the piano part plus the one vocal line folded into the right hand, with the piano-only version
 * as its fallback (pipeline.ts ships that when the fold fails its gate). Duets, choirs and odd piano parts are refused or go piano-only. */
async function liederSet() {
  const tree = JSON.parse(await get('https://api.github.com/repos/OpenScore/Lieder/git/trees/main?recursive=1', HTTP))
  // composers.yaml: '<wikidata id>:' blocks of '  key: value' lines; path is the composer's folder under scores/
  const yaml = (await get(raw('data/composers.yaml'), HTTP)).toString()
  const people = new Map(yaml.split(/\n(?=\d+:)/).map((b) => Object.fromEntries([...b.matchAll(/^ {2}(\w+): (.*)$/gm)].map((m) => [m[1], m[2].trim()]))).map((f) => [f.path, f]))
  for (const e of sources.pieces.filter((e) => e.src === 'openscore-lieder')) {
    const x = await lieder(e) // the bundled five, as curated
    if (x) inputs.push(x)
  }
  const songs = tree.tree.filter((x) => x.path.endsWith('.mxl'))
  console.log(`index: ${songs.length} songs`)
  for (const { path } of songs) {
    const [, who, set, song, file] = path.split('/')
    const id = `lieder-${file.slice(0, -4)}`
    if (pins.has(id)) continue
    let up, parts
    try {
      up = await get(raw(path), HTTP)
      parts = scoreParts(up)
    } catch (err) {
      refuse(id, 'fetch', err.message)
      continue
    }
    const piano = parts.filter((p) => PIANO.test(p.name))
    const sings = (p) => p.lyrics && !/flute|fl[öo]te|viol|bratsche|cello|clarinet|klarinette|horn|oboe|harp\b|organ|orgue|guitar/i.test(p.name)
    const voices = parts.filter((p) => !PIANO.test(p.name) && sings(p))
    const others = parts.filter((p) => !PIANO.test(p.name) && !sings(p)) // a flute or viola obbligato: neither melody nor piano
    if (piano.length !== 1) {
      refuse(id, 'normalise', `${piano.length} piano parts (${parts.map((p) => p.name || p.id).join(', ')})`)
      continue
    }
    if (others.length) {
      refuse(id, 'normalise', `instrument part ${others.map((p) => p.name || p.id).join(', ')}`)
      continue
    }
    if (piano[0].staves !== 2) {
      refuse(id, 'normalise', `piano part on ${piano[0].staves} staff`)
      continue
    }
    const c = people.get(who)
    const t = liederTitle(set, song)
    const composer = c ? `${c.name} (${c.born ?? ''}–${c.died ?? ''})` : words(who)
    const solo = await lieder({ id, path, title: `${t}: piano part`, composer, dropParts: voices.map((v) => v.id) })
    if (!solo) continue
    const v = voices[0]
    const no = voices.length !== 1 ? `${voices.length} vocal parts (${voices.map((p) => p.name || p.id).join(', ')})` : v.staves !== 1 ? `the voice is on ${v.staves} staves` : ''
    if (no) {
      inputs.push(voices.length ? { ...solo, why: `voice dropped: ${no}` } : solo) // no voice: a piano piece as it is
      continue
    }
    try {
      const sung = openscoreMeta({ id, foldParts: [v.id], dropParts: [] }, up)
      inputs.push({ ...solo, title: `${t}: melody and piano`, bytes: new Uint8Array(sung.bytes), voice: 'folded', alt: solo })
    } catch (err) {
      inputs.push({ ...solo, why: `voice dropped: ${err.message}` })
    }
  }
}

const CHOPIN = 'pl-wnifc/humdrum-chopin-first-editions'
const craw = (path) => `https://raw.githubusercontent.com/${CHOPIN}/main/${path}`
// several first editions of one work: dedupe keeps the best by the gates, and on a tie (Input.rank) the first impression
// before a later issue (Rink-Grabowski '1' before '1a', '1b'), then Paris (Chopin read the proofs of most French editions),
// Leipzig or Berlin (engraved from their own manuscripts), London (Wessel mostly reprinted Paris), the rest (Vienna, Warsaw)
const CITY = { Paris: 0, Leipzig: 1, Berlin: 1, London: 2 }
// Op. 74, the 17 Polish songs in the order of Fontana's edition (Gebethner, 1859): the Polish title and the English one of en.wikipedia.org/wiki/Polish_songs_(Chopin).
// The three first editions in the set (Warsaw, Berlin, London) number the songs alike, by the file number; the 17th was not in them.
const SONGS = ['Życzenie (A Maiden’s Wish)', 'Wiosna (Spring)', 'Smutna rzeka (Troubled Waters)', 'Hulanka (Drinking Song)', 'Gdzie lubi (A Fickle Maid)', 'Precz z moich oczu (Remembrance)', 'Poseł (The Messenger)', 'Śliczny chłopiec (Handsome Lad)', 'Melodia (Melody)', 'Wojak (The Warrior)', 'Dwojaki koniec (The Double-End)', 'Moja pieszczotka (My Darling)', 'Nie ma czego trzeba (I Want What I Have Not)', 'Pierścień (The Ring)', 'Narzeczony (The Bridegroom’s Return)', 'Piosnka litewska (Lithuanian Song)']
const DIGITAL = 'digital edition © The Fryderyk Chopin Institute (nifc.pl), chopinscores.org'

/** Every Humdrum file of the Chopin Institute's first editions, converted to MusicXML (src/kern.ts) and shipped as .mxl.
 * The pieces already published count as pinned (--merge-with): the Chopin ones go into dedupe too, so a first edition of
 * a work the library already has is dropped, not shipped twice. */
async function chopinSet() {
  const lic = (await get(craw('LICENSE.txt'), HTTP)).toString()
  if (!/creativecommons\.org\/licenses\/by\/4\.0/.test(lic) || /NonCommercial|NoDerivatives/i.test(lic)) throw new Error(`${CHOPIN}: LICENSE.txt does not grant CC BY 4.0, refusing the set`)
  const rights = lic.split('\n').slice(0, 5).join('; ') // the licence asks for its first five lines as the acknowledgement
  const tree = JSON.parse(await get(`https://api.github.com/repos/${CHOPIN}/git/trees/main?recursive=1`, HTTP))
  const krn = tree.tree.filter((x) => /^kern\/.+\.krn$/.test(x.path))
  console.log(`index: ${krn.length} kern files`)
  const read = []
  for (const { path } of krn) {
    const file = path.slice(5, -4)
    const id = `chopin-${file}`
    if (/-(piano|piano-primo|piano-secondo|violino|violin|violoncello)$/.test(file)) {
      refuse(id, 'normalise', 'one part of a chamber or four-hand work')
      continue
    }
    let src, k
    try {
      src = await get(craw(path), HTTP)
    } catch (e) {
      refuse(id, 'fetch', e.message)
      continue
    }
    try {
      k = kernToMusicXml(src.toString(), rights)
    } catch (e) {
      refuse(id, 'normalise', e.message)
      continue
    }
    const lost = (k.skipped['token without one pitch'] ?? 0) + (k.skipped['token without a duration'] ?? 0)
    if (lost > k.notes / 100) {
      refuse(id, 'normalise', `${lost} unreadable tokens for ${k.notes} notes`)
      continue
    }
    if (!/chop/i.test(k.refs.COM ?? '')) { // 'Chopipn' is in two Op. 74 files
      refuse(id, 'licence', `composer ${k.refs.COM}`)
      continue
    }
    read.push({ id, file, path, src, k })
  }
  const cut = (s) => s?.replace(/\|/g, '').replace(/\s+/g, ' ').trim()
  const work = (r) => cut(r.k.refs['rism-title'])?.replace(/ op\. (\S+?), no\.? ?(\d+)$/i, ', Op. $1 No. $2').replace(/ op\. (\S+)$/i, ', Op. $1')
  const edition = (r) => r.file.replace(/-\d+[a-z-]*$/, '') // 058-1-BH-003 -> 058-1-BH
  for (const r of read) {
    const R = r.k.refs
    const w = work(r)
    const shared = w && read.filter((x) => edition(x) === edition(r) && work(x) === w).length > 1 // movements of one sonata or concerto
    const n = r.k.sung && Number(/-(\d+)$/.exec(r.file)?.[1])
    if (r.k.sung && !(n >= 1 && n <= SONGS.length && r.file.startsWith('074-'))) {
      refuse(r.id, 'normalise', 'a song outside Op. 74: no title for it')
      continue
    }
    const title = n ? `${SONGS[n - 1]}, Op. 74 No. ${n}` : w ? (shared ? `${w}: Movement ${Number(/-(\d+)[a-z-]*$/.exec(r.file)?.[1] ?? R.OMV)}` : w) : `${cut(R.OTL)?.replace(/[.,\s]+$/, '') ?? r.file}${R.OPS && !/op\./i.test(R.OTL ?? '') ? `, ${cut(R.OPS).replace(/\.$/, '')}` : ''}`
    const opus = cut(R['rism-opus'])?.replace(/^op\. (\S+?)(?:, no\.? ?(\d+))?$/i, (_, o, n) => `Op. ${o}${n ? `, No. ${n}` : ''}`) ?? cut(R.OPS)?.replace(/\.$/, '')
    const composer = 'Frédéric Chopin (1810–1849)'
    const ed = `First edition: ${[R.PPR, R.PPP].filter(Boolean).join(', ')}${R.PTL ? ` (${cut(R.PTL)})` : ''}; ${DIGITAL}`
    const why = licenceCheck({ id: r.id, licence: 'CC-BY-4.0', composer, edition: ed })
    if (why.length) {
      refuse(r.id, 'licence', why)
      continue
    }
    const [, sub = ''] = /-\d+([a-z]*)-[A-Za-z]+(?:-|$)/.exec(r.file) ?? []
    const container = '<?xml version="1.0" encoding="UTF-8"?>\n<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>\n'
    const url = `https://github.com/${CHOPIN}/blob/main/${r.path}`
    const mxl = (xml) => new Uint8Array(zip([['META-INF/container.xml', Buffer.from(container)], ['score.xml', Buffer.from(xml)]]))
    const solo = {
      id: r.id,
      title,
      composer,
      ...(opus && { opus: n ? `Op. 74, No. ${n}` : opus }),
      source: 'chopin',
      sourceUrl: url,
      licenceEvidence: `https://github.com/${CHOPIN}/blob/main/LICENSE.txt`,
      licence: 'CC-BY-4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
      edition: ed,
      typesetter: R.ENC?.replace(/; /g, ', ') ?? 'Fryderyk Chopin Institute', // the encoders; source and edition name the Institute
      format: 'musicxml',
      bytes: mxl(r.k.xml),
      upstreamSha: sha(r.src),
      rank: (sub ? 10 : 0) + (n && R.PPP === 'Warsaw' ? -1 : (CITY[R.PPP] ?? 3)), // a song: the Polish text, Gebethner's, before the translations
    }
    // a song as in liederSet: the voice folded into the right hand (title ': melody and piano'), its piano-only version as the fallback
    if (!n) inputs.push(solo)
    else {
      const alone = { ...solo, title: `${title}: piano part`, voice: 'dropped' }
      inputs.push({ ...solo, title: `${title}: melody and piano`, bytes: mxl(r.k.sung), voice: 'folded', alt: alone })
    }
  }
  if (!MERGE) return
  // the published Chopin pieces, pinned, so a first edition of the same work is a duplicate of one of them
  const base = JSON.parse(readFileSync(`${MERGE}/catalog.json`, 'utf8'))
  for (const p of base.pieces.filter((p) => /chopin/i.test(base.composers[p.composer].name))) {
    const c = base.composers[p.composer]
    const l = base.licences[p.licence]
    inputs.push({ ...p, composer: `${c.name} (${c.born ?? ''}–${c.died})`, licence: l.id, licenceUrl: l.url, bytes: new Uint8Array(readFileSync(`${MERGE}/${p.file}`)), upstreamSha: p.sha256 })
  }
}

const t0 = Date.now()
let level = {}
if (SET === 'current') {
  for (const e of sources.pieces) {
    level[e.id] = e.level
    if (e.src === 'mutopia') await mutopia(e.piece, e)
    else {
      const x = await lieder(e)
      if (x) inputs.push(x)
    }
  }
} else if (SET === 'lieder') await liederSet()
else if (SET === 'chopin') await chopinSet()
else {
  const index = await mutopiaIndex(HTTP)
  const solo = index.filter((r) => soloKeyboard(r.instruments))
  console.log(`index: ${index.length} keyboard-tagged, ${solo.length} solo keyboard`)
  for (const r of index) if (!solo.includes(r)) refuse(`mutopia-${r.id}`, 'normalise', `not solo keyboard: ${r.instruments}`)
  for (const r of solo) await mutopia(r.id, pins.get(`mutopia-${r.id}`))
}

const overrides = JSON.parse(readFileSync(`${ROOT}scripts/library/overrides.json`, 'utf8'))
const shipped = MERGE ? JSON.parse(readFileSync(`${MERGE}/catalog.json`, 'utf8')).pieces.map((p) => p.id) : []
const done = await run(inputs, OUT, { overrides, grades, limit, pinned: [...pins.keys(), ...shipped] })
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
  for (const lv of Object.keys(rank)) console.log(lv, count(done.filter((r) => level[r.id] === lv && r.grade).map((r) => r.grade)).sort())
}
if (MERGE) {
  const added = merge(MERGE, OUT)
  const n = JSON.parse(readFileSync(`${OUT}/catalog.json`, 'utf8')).pieces.length
  console.log(`merged with ${MERGE}: ${n - added.length} kept, ${added.length} added, ${done.filter((r) => r.stage === 'shipped').length - added.length} skipped (id already there)`)
}
console.log(`${inputs.length} analysed, ${done.filter((r) => r.stage === 'shipped').length} shipped to ${OUT}, ${((Date.now() - t0) / 1000).toFixed(0)} s`)
