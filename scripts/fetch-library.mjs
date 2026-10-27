#!/usr/bin/env node
// Rebuilds public/library/ (score files + manifest.json) from scripts/library-sources.json.
//   node scripts/fetch-library.mjs
// Plain Node (>= 22.2 for zlib.crc32), no dependencies. Polite: one request per second, descriptive User-Agent.
// Every piece is checked against the allowlist, its licence is re-read from its own source page, and the
// upstream bytes must match the sha256 pinned in library-sources.json (a new piece gets pinned on first run).
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { crc32, deflateRawSync, inflateRawSync } from 'node:zlib'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = `${ROOT}scripts/library-sources.json`
const OUT = `${ROOT}public/library/`
const UA = 'piano-forte-library-fetch/0.1 (+https://pianoforte.mattkelly.io; themattkellyshow@gmail.com)'
const NC_OK = ['CC-BY-NC-4.0', 'CC-BY-NC-SA-4.0', 'CC-BY-NC-3.0', 'CC-BY-NC-SA-3.0'] // only with nc:true on the piece

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const sha = (b) => createHash('sha256').update(b).digest('hex')
const fail = (id, msg) => {
  throw new Error(`${id}: ${msg}`)
}

async function get(url) {
  await sleep(1000)
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`)
  return Buffer.from(await r.arrayBuffer())
}

const text = (s) =>
  s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

// ---- Mutopia: licence, edition, typesetter and the MIDI link all come from the piece's own page ----

function mutopiaMeta(id, html) {
  const cell = (label) => {
    const m = new RegExp(`<b>${label}:</b>\\s*([\\s\\S]*?)</td>`).exec(html)
    return m ? text(m[1]) : undefined
  }
  const copyright = /<b>Copyright:<\/b>([\s\S]*?)<\/td>/.exec(html)?.[1] ?? fail(id, 'no Copyright field')
  const cc = /creativecommons\.org\/(licenses|publicdomain)\/([a-z-]+)\/?([0-9.]*)/.exec(copyright)
  if (!cc) fail(id, 'no Creative Commons link in the Copyright field')
  const licence = cc[2] === 'publicdomain' || /Public Domain/i.test(text(copyright)) ? 'Public Domain' : `CC-${cc[2].toUpperCase()}-${cc[3]}`
  const midi = /href="(https:\/\/www\.mutopiaproject\.org\/ftp\/[^"]+\.mid)"/.exec(html)?.[1] ?? fail(id, 'no plain .mid link (zip-only piece)')
  const arranger = cell('Arranger\\(s\\)')
  return {
    licence,
    licenceUrl: `https://creativecommons.org/${cc[1]}/${cc[2]}/${cc[3] ? cc[3] + '/' : ''}`,
    lifespan: /<h4>by [^(]*(\([^)]*\))/.exec(html)?.[1],
    sourceEdition: cell('Source') ?? fail(id, 'no Source field'),
    typesetter: /<b>Maintainer:<\/b>\s*([^<]*)/.exec(html)?.[1].trim() || undefined,
    arranger: arranger && arranger !== 'n/a' ? arranger : undefined,
    midi,
  }
}

// ---- OpenScore: unzip the .mxl, drop the voice part, write a one-entry zip back ----

function unzip(buf) {
  let p = buf.length - 22
  while (p >= 0 && buf.readUInt32LE(p) !== 0x06054b50) p--
  if (p < 0) throw new Error('not a zip')
  const count = buf.readUInt16LE(p + 10)
  let c = buf.readUInt32LE(p + 16)
  const files = new Map()
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(c + 10)
    const csize = buf.readUInt32LE(c + 20)
    const nlen = buf.readUInt16LE(c + 28)
    const xlen = buf.readUInt16LE(c + 30)
    const clen = buf.readUInt16LE(c + 32)
    const local = buf.readUInt32LE(c + 42)
    const name = buf.toString('utf8', c + 46, c + 46 + nlen)
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
    const raw = buf.subarray(start, start + csize)
    files.set(name, method === 0 ? raw : inflateRawSync(raw))
    c += 46 + nlen + xlen + clen
  }
  return files
}

function zip(entries) {
  const local = []
  const central = []
  let off = 0
  for (const [name, data] of entries) {
    const n = Buffer.from(name)
    const def = deflateRawSync(data, { level: 9 })
    const crc = crc32(data)
    const h = Buffer.alloc(30)
    h.writeUInt32LE(0x04034b50, 0)
    h.writeUInt16LE(20, 4)
    h.writeUInt16LE(8, 8) // deflate
    h.writeUInt16LE(0x21, 12) // fixed DOS date 1980-01-01 keeps the output reproducible
    h.writeUInt32LE(crc, 14)
    h.writeUInt32LE(def.length, 18)
    h.writeUInt32LE(data.length, 22)
    h.writeUInt16LE(n.length, 26)
    const ch = Buffer.alloc(46)
    ch.writeUInt32LE(0x02014b50, 0)
    ch.writeUInt16LE(20, 4)
    ch.writeUInt16LE(20, 6)
    ch.writeUInt16LE(8, 10)
    ch.writeUInt16LE(0x21, 14)
    ch.writeUInt32LE(crc, 16)
    ch.writeUInt32LE(def.length, 20)
    ch.writeUInt32LE(data.length, 24)
    ch.writeUInt16LE(n.length, 28)
    ch.writeUInt32LE(off, 42)
    local.push(h, n, def)
    central.push(ch, n)
    off += 30 + n.length + def.length
  }
  const cd = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(cd.length, 12)
  end.writeUInt32LE(off, 16)
  return Buffer.concat([...local, cd, end])
}

function openscoreMeta(e, upstream) {
  const files = unzip(upstream)
  const root = /full-path="([^"]+)"/.exec(files.get('META-INF/container.xml')?.toString() ?? '')?.[1] ?? fail(e.id, 'no rootfile in container.xml')
  let xml = files.get(root)?.toString() ?? fail(e.id, `${root} missing in the mxl`)
  if (!/<rights>[^<]*CC0/.test(xml)) fail(e.id, 'the file does not state CC0 in <rights>')
  for (const p of e.dropParts ?? []) {
    // the importer reads tempo from the first part only, and OpenScore puts it on the voice line: move it over
    const dropped = new RegExp(`<part id="${p}">[\\s\\S]*?</part>`).exec(xml)?.[0] ?? ''
    const tempo = /<direction\b(?:(?!<\/direction>)[\s\S])*?<sound tempo="[^"]+"\/>[\s\S]*?<\/direction>/.exec(dropped.split('</measure>')[0])?.[0]
    xml = xml.replace(new RegExp(`<score-part id="${p}">[\\s\\S]*?</score-part>`), '').replace(dropped, '')
    if (tempo && !/<sound tempo=/.test(xml)) xml = xml.replace(/<note[ >]/, (n) => tempo + n)
  }
  for (const p of e.foldParts ?? []) {
    // a voice line kept as a second right hand: a part with two staves puts its first staff in the right hand
    const re = new RegExp(`(<part id="${p}">[\\s\\S]*?<attributes>(?:(?!</attributes>)[\\s\\S])*?)(</attributes>)`)
    if (!re.test(xml)) fail(e.id, `part ${p} has no attributes to fold`)
    xml = xml.replace(re, (m, a, b) => (/<staves>/.test(a) ? m : `${a}<staves>2</staves>${b}`))
  }
  if (!/<part id="/.test(xml)) fail(e.id, 'no part left after dropping')
  const edition = /<creator type="arranger">([\s\S]*?)<\/creator>/.exec(xml)?.[1]
  const container = `<?xml version="1.0" encoding="UTF-8"?>\n<container><rootfiles><rootfile full-path="${root}"/></rootfiles></container>\n`
  return {
    sourceEdition: `${edition ? text(edition) : 'OpenScore Lieder Corpus'}${e.foldParts ? '; the vocal line is folded into the right hand' : ''}`,
    bytes: zip([['META-INF/container.xml', Buffer.from(container)], [root, Buffer.from(xml)]]),
  }
}

// ---- main ----

const cfg = JSON.parse(readFileSync(SRC, 'utf8'))
const manifest = []
let pinned = false
for (const e of cfg.pieces) {
  const ok = cfg.allow.includes(e.licence) || (e.nc === true && NC_OK.includes(e.licence))
  if (!ok) fail(e.id, `licence ${e.licence} is not allowed${NC_OK.includes(e.licence) ? ' (set nc:true to allow)' : ''}`)
  let meta, upstream, ext, format, page
  if (e.src === 'mutopia') {
    page = `https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=${e.piece}`
    meta = mutopiaMeta(e.id, (await get(page)).toString())
    if (meta.licence !== e.licence) fail(e.id, `page says ${meta.licence}, sources say ${e.licence}`)
    const years = /\([^)]*\)/.exec(e.composer)?.[0]
    if (meta.lifespan !== years) fail(e.id, `composer dates ${years} do not match the page ${meta.lifespan}`)
    upstream = await get(meta.midi)
    ext = 'mid'
    format = 'midi'
  } else if (e.src === 'openscore-lieder') {
    page = `https://github.com/OpenScore/Lieder/blob/main/${e.path.split('/').map(encodeURIComponent).join('/')}`
    upstream = await get(`https://raw.githubusercontent.com/OpenScore/Lieder/main/${e.path.split('/').map(encodeURIComponent).join('/')}`)
    ext = 'mxl'
    format = 'musicxml'
  } else fail(e.id, `unknown src ${e.src}`)

  if (!e.sha256) {
    e.sha256 = sha(upstream)
    pinned = true
  } else if (e.sha256 !== sha(upstream)) fail(e.id, 'upstream file changed (sha256 mismatch). Re-verify the licence, then clear sha256 to re-pin.')

  let bytes = upstream
  if (e.src === 'openscore-lieder') {
    const m = openscoreMeta(e, upstream)
    bytes = m.bytes
    meta = {
      licence: 'CC0-1.0',
      licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      sourceEdition: m.sourceEdition,
    }
  }
  const file = `${e.id}.${ext}`
  writeFileSync(OUT + file, bytes)
  manifest.push({
    id: e.id,
    title: e.title,
    composer: e.composer,
    collection: e.src === 'mutopia' ? 'Mutopia Project' : 'OpenScore Lieder Corpus',
    ...(meta.arranger && { arranger: meta.arranger }),
    ...(meta.typesetter && { typesetter: meta.typesetter }),
    licence: meta.licence,
    licenceUrl: meta.licenceUrl,
    licenceEvidence: e.src === 'mutopia' ? page : 'https://github.com/OpenScore/Lieder/blob/main/LICENSE.txt',
    sourceUrl: page,
    sourceEdition: meta.sourceEdition,
    format,
    file,
    level: e.level,
    bytes: bytes.length,
    sha256: sha(bytes),
    ...(e.nc && { nc: true }),
  })
  console.log(`${e.id}  ${meta.licence}  ${bytes.length} B  ${e.title}`)
}

const keep = new Set([...manifest.map((m) => m.file), 'LICENSES.md', 'manifest.json'])
for (const f of readdirSync(OUT)) if (!keep.has(f)) rmSync(OUT + f) // a piece removed from the sources goes away
const lname = (l) => l.replace(/^CC-/, 'CC ').replace(/-(\d+(\.\d+)?)$/, ' $1')
const row = (m) =>
  `| \`${m.file}\` | ${m.title} | ${m.composer} | [${lname(m.licence)}](${m.licenceUrl}) | ${m.sourceEdition.replace(/\|/g, '/')} | ${[m.collection, m.typesetter && `typeset by ${m.typesetter}`, m.arranger && `arr. ${m.arranger}`].filter(Boolean).join(', ')} | [source](${m.sourceUrl}) |`
const sa = manifest.filter((m) => /-SA-/.test(m.licence))
writeFileSync(
  OUT + 'LICENSES.md',
  `# Licences of the score files in this folder

Generated by \`scripts/fetch-library.mjs\` from \`scripts/library-sources.json\`. Do not edit by hand.

These files are **data**, not code. The app's source code is MIT-licensed; each score below stays under the licence shown for it. Files marked CC BY-SA must stay under that licence, including any converted or edited copy. The licence was read from each piece's own source page (or, for OpenScore, from the \`<rights>\` element of the file); see \`docs/library.md\` for the policy.

| File | Title | Composer | Licence | Source edition | Credit | Source page |
|---|---|---|---|---|---|---|
${manifest.map(row).join('\n')}

${sa.length ? `## Share-alike (CC BY-SA)\n\n${sa.map((m) => `- \`${m.file}\`: ${lname(m.licence)}, ${m.composer}, ${m.title}`).join('\n')}\n\nThese must be redistributed under the same licence, with the credit above.\n\n` : ''}Mutopia pieces are provided "as is" by volunteers (https://www.mutopiaproject.org/legal.html). OpenScore Lieder files are CC0 and the project asks for a credit (https://github.com/OpenScore/Lieder). OpenScore files here carry the piano part; where a title says melody and piano, the vocal line is folded into the right hand, otherwise the voice line was removed.
`,
)
writeFileSync(OUT + 'manifest.json', JSON.stringify(manifest, null, 1) + '\n')
if (pinned) writeFileSync(SRC, JSON.stringify(cfg, null, 1) + '\n')
console.log(`${manifest.length} pieces, ${manifest.reduce((s, m) => s + m.bytes, 0)} bytes${pinned ? ' (new sha256 pins written to library-sources.json)' : ''}`)
