// Shared by scripts/fetch-library.mjs and scripts/library/build.mjs: polite fetch, Mutopia page reading, .mxl zip, OpenScore part surgery.
// Plain Node (>= 22.2 for zlib.crc32), no dependencies.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { crc32, deflateRawSync, inflateRawSync } from 'node:zlib'

export const UA = 'piano-forte-library-fetch/0.1 (+https://pianoforte.mattkelly.io; themattkellyshow@gmail.com)'
export const sha = (b) => createHash('sha256').update(b).digest('hex')
export const fail = (id, msg) => {
  throw new Error(`${id}: ${msg}`)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** One request per second. With `cache` (a directory), a URL is fetched once ever: the body is kept under sha256(url). */
export async function get(url, cache) {
  const f = cache && `${cache}/${sha(url)}`
  if (f && existsSync(f)) return readFileSync(f)
  await sleep(1000)
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`)
  const b = Buffer.from(await r.arrayBuffer())
  if (f) {
    mkdirSync(cache, { recursive: true })
    writeFileSync(f, b)
  }
  return b
}

const YEAR = new Date().getFullYear()
export const LAST_DEATH = YEAR - 71 // life + 70 everywhere: died 1955 or earlier in 2026
export const LAST_PUBLISHED = YEAR - 96 // US: published 1930 or earlier in 2026
// ids whose first publication by LAST_PUBLISHED was checked by hand although the composer died after it: id -> one line of evidence
// (published-by-1930.json), or id -> { year, evidenceUrl, basis } (lieder-published.json: the IMSLP work page of each song)
const json = (f) => JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8'))
export const PUBLISHED_BY = { ...json('./published-by-1930.json'), ...json('./lieder-published.json') }

/** Licence, composer death and publication year (the latest year the edition or composition date names). Empty is a pass.
 * A composer who died after LAST_PUBLISHED may have published late: refused unless the id is in published-by-1930.json or lieder-published.json (year <= LAST_PUBLISHED). */
export function refusals({ id, licence, composer, edition = '', date = '' }, allow) {
  const why = []
  if (!allow.includes(licence)) why.push(`licence ${licence}`)
  const years = /\(([^)]*)\)\s*$/.exec(composer)?.[1].match(/\d{4}/g) ?? []
  const died = years.length > 1 ? Number(years[years.length - 1]) : NaN
  if (!(died <= LAST_DEATH)) why.push(Number.isNaN(died) ? 'composer death unknown' : `composer died ${died}`)
  const pub = Math.max(0, ...[...`${edition} ${date}`.matchAll(/\b(1[5-9]\d\d|20\d\d)\b/g)].map((m) => Number(m[1])))
  if (pub > LAST_PUBLISHED) why.push(`dated ${pub}`)
  else if (died > LAST_PUBLISHED && died <= LAST_DEATH && !(PUBLISHED_BY[id] && (PUBLISHED_BY[id].year ?? 0) <= LAST_PUBLISHED)) why.push(`composer died ${died}, publication by ${LAST_PUBLISHED} unchecked`)
  return why
}

export const text = (s) =>
  s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

// ---- Mutopia: licence, edition, typesetter and the MIDI link all come from the piece's own page ----

export function mutopiaMeta(id, html) {
  const cell = (label) => {
    const m = new RegExp(`<b>${label}:</b>\\s*([\\s\\S]*?)</td>`).exec(html)
    return m ? text(m[1]) : undefined
  }
  const copyright = /<b>Copyright:<\/b>([\s\S]*?)<\/td>/.exec(html)?.[1] ?? fail(id, 'no Copyright field')
  const cc = /creativecommons\.org\/(licenses|publicdomain)\/([a-z-]+)\/?([0-9.]*)/.exec(copyright)
  let licence, licenceUrl
  if (cc) {
    licence = cc[2] === 'zero' ? 'CC0-1.0' : cc[2] === 'publicdomain' || cc[2] === 'mark' || /Public Domain/i.test(text(copyright)) ? 'Public Domain' : `CC-${cc[2].toUpperCase()}-${cc[3]}`
    licenceUrl = `https://creativecommons.org/${cc[1]}/${cc[2]}/${cc[3] ? cc[3] + '/' : ''}`
  } else if (/Mutopia\s*BSD/i.test(text(copyright))) {
    licence = 'MutopiaBSD'
    licenceUrl = 'https://www.mutopiaproject.org/legal.html'
  } else fail(id, `no licence link in the Copyright field (${text(copyright)})`)
  const arranger = cell('Arranger\\(s\\)')
  const by = /<h4>by ([^<]*)<\/h4>/.exec(html)?.[1]
  return {
    licence,
    licenceUrl,
    title: /<h2>([^<]*)<\/h2>/.exec(html)?.[1]?.trim(),
    composer: by && text(by),
    lifespan: /<h4>by [^(]*(\([^)]*\))/.exec(html)?.[1],
    instruments: cell('Instrument\\(s\\)'),
    style: cell('Style'),
    opus: cell('Opus'),
    date: cell('Date of composition'),
    sourceEdition: cell('Source') ?? fail(id, 'no Source field'),
    typesetter: /<b>Maintainer:<\/b>\s*([^<]*)/.exec(html)?.[1].trim() || undefined,
    arranger: arranger && arranger !== 'n/a' ? arranger : undefined,
    midi: /href="(https:\/\/www\.mutopiaproject\.org\/ftp\/[^"]+\.mid)"/.exec(html)?.[1],
    ly: /href="(https:\/\/www\.mutopiaproject\.org\/ftp\/[^"]+\.ly)"/.exec(html)?.[1],
    mids: /href="(https:\/\/www\.mutopiaproject\.org\/ftp\/[^"]+-mids\.zip)"/.exec(html)?.[1], // a multi-movement work: one .mid a movement
    lys: /href="(https:\/\/www\.mutopiaproject\.org\/ftp\/[^"]+-lys\.zip)"/.exec(html)?.[1],
  }
}

/** A -mids.zip: one .mid a movement, in LilyPond's order (name.mid, name-1.mid, ...), four-hand versions left out; titled by a
 * dance name in the file name, else Movement k. */
export function movements(zipped, base) {
  const key = (stem) => (/-\d+$/.test(stem) ? stem : `${stem}-0`)
  return [...unzip(zipped)]
    .filter(([f]) => f.endsWith('.mid') && !/four-?hands/i.test(f))
    .map(([f, b]) => [f.split('/').pop().slice(0, -4), b])
    .sort((a, b) => key(a[0]).localeCompare(key(b[0]), 'en', { numeric: true }))
    .map(([stem, b], k) => {
      const at = stem.toLowerCase().indexOf(base.toLowerCase())
      const name = (at >= 0 ? stem.slice(at + base.length) : stem).replace(/^[-_]+/, '') // french-suite-5-gigue: Gigue
      const word = /^[a-z]+([-_][a-z]+)*$/i.test(name) && !/^all$/i.test(name)
      return { stem, bytes: b, name: word ? name[0].toUpperCase() + name.slice(1).replace(/[-_]/g, ' ') : `Movement ${k + 1}` }
    })
}

/** A .ly with its `\include "file"` lines replaced by that file's text, found the way LilyPond finds it: next to the including
 * file, else up the directories above (a work zip keeps its .ily files in a folder or beside the .ly), else by name alone.
 * What the zip does not hold (english.ly, a font) stays as it is. A file is not put in twice on one path (a cycle). */
export function inlineIncludes(files, name, seen = []) {
  const dir = (f) => f.slice(0, f.lastIndexOf('/') + 1)
  const find = (inc) => {
    for (let d = dir(name); ; d = dir(d.slice(0, -1))) {
      if (files.has(d + inc)) return d + inc
      if (!d) break
    }
    const base = inc.split('/').pop()
    const same = [...files.keys()].filter((f) => f.split('/').pop() === base)
    return same.length === 1 ? same[0] : undefined
  }
  const put = (inc, pre, m) => {
    const f = find(inc)
    return f && !seen.includes(f) && files.get(f).length ? `${pre}\n${inlineIncludes(files, f, [...seen, name])}\n` : m
  }
  return files
    .get(name)
    .toString()
    .replace(/^([^%\n]*?)\\include\s+"([^"]+)"/gm, (m, pre, inc) => put(inc, pre, m))
    .replace(/^([^%\n]*?)\\includeScore\s+"([^"]+)"/gm, (m, pre, inc) => `${put(`${inc}/global.ily`, 'global = {', '')}}\n` + put(`${inc}/score.ily`, pre, m)) // Royer's Premier livre: a piece's folder holds global.ily (the \global the score uses) and score.ily
}

/** A movement's .ly candidates for pickLy (repeats.ts): the -lys.zip file of the same name first, the zip's others (their includes
 * read from the zip), the work's. */
export function lyCandidates(lys, stem, ly) {
  const files = new Map(lys)
  const named = (f) => +(f.split('/').pop() === `${stem}.ly`)
  return [...[...files.keys()].filter((f) => f.endsWith('.ly')).sort((a, b) => named(b) - named(a)).map((f) => inlineIncludes(files, f)), ...(ly ? [ly] : [])]
}

// ---- .mxl zip, read and written (fixed dates, so the output is reproducible) ----

export function unzip(buf) {
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

export function zip(entries) {
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

// ---- OpenScore / any MusicXML: keep the piano, drop or fold the rest, write a one-entry .mxl back ----

export const PIANO = /piano|pianoforte|klavier|keyboard|cembalo|harpsichord/i

/** The parts of an .mxl: id, name, the staves its first measure declares (1 when it says nothing), whether it has lyrics. */
export function scoreParts(upstream) {
  const files = unzip(upstream)
  const root = /full-path="([^"]+)"/.exec(files.get('META-INF/container.xml')?.toString() ?? '')?.[1]
  const xml = files.get(root)?.toString() ?? ''
  return [...xml.matchAll(/<score-part id="([^"]+)">([\s\S]*?)<\/score-part>/g)].map(([, id, body]) => {
    const part = new RegExp(`<part id="${id}">[\\s\\S]*?</part>`).exec(xml)?.[0] ?? ''
    return {
      id,
      name: text(/<part-name[^>]*>([^<]*)/.exec(body)?.[1] ?? ''),
      staves: Number(/<staves>(\d+)/.exec(part.split('</measure>')[0])?.[1] ?? 1),
      lyrics: /<lyric\b/.test(part),
    }
  })
}

/** e.dropParts and e.foldParts name parts by id; without them every part whose name is not a keyboard is dropped. */
export function openscoreMeta(e, upstream) {
  const files = unzip(upstream)
  const root = /full-path="([^"]+)"/.exec(files.get('META-INF/container.xml')?.toString() ?? '')?.[1] ?? fail(e.id, 'no rootfile in container.xml')
  let xml = files.get(root)?.toString() ?? fail(e.id, `${root} missing in the mxl`)
  if (!/<rights>[^<]*CC0/.test(xml)) fail(e.id, 'the file does not state CC0 in <rights>')
  const drop =
    e.dropParts ??
    (e.foldParts
      ? []
      : [...xml.matchAll(/<score-part id="([^"]+)">([\s\S]*?)<\/score-part>/g)].filter(([, , body]) => !PIANO.test(/<part-name[^>]*>([^<]*)/.exec(body)?.[1] ?? '')).map(([, id]) => id))
  for (const p of drop) {
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
    composer: /<creator type="composer">([\s\S]*?)<\/creator>/.exec(xml)?.[1],
    sourceEdition: `${edition ? text(edition) : 'OpenScore Lieder Corpus'}${e.foldParts ? '; the vocal line is folded into the right hand' : ''}`,
    bytes: zip([['META-INF/container.xml', Buffer.from(container)], [root, Buffer.from(xml)]]),
  }
}

/** The .ly of a Mutopia piece with one MIDI: the page's link, else (43 pieces have only a -lys.zip) the .ly of the zip that pickLy matches. */
export async function pieceLy(m, midi, pickLy, http) {
  if (m.ly) return (await get(m.ly, http).catch(() => undefined))?.toString()
  if (m.lys) return pickLy(midi, lyCandidates([...unzip(await get(m.lys, http))], '', undefined))
}

/** What build.mjs reads for a shipped Mutopia id, before any unfolding: the MIDI bytes and the .ly (the piece's, or for movement k
 * of a -mids.zip work the one pickLy matches to its MIDI). */
export async function sourceOf(id, pickLy, http) {
  const [, n, k] = id.split('-')
  const m = mutopiaMeta(id, (await get(`https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=${n}`, http)).toString())
  if (!k) {
    const midi = m.midi && (await get(m.midi, http))
    return { ly: midi && (await pieceLy(m, midi, pickLy, http)), midi }
  }
  const ly = m.ly && (await get(m.ly, http)).toString()
  const lys = m.lys ? [...unzip(await get(m.lys, http))] : []
  const v = movements(await get(m.mids, http), m.mids.split('/').pop().slice(0, -'-mids.zip'.length))[k - 1]
  return { ly: pickLy(v.bytes, lyCandidates(lys, v.stem, ly)), midi: v.bytes }
}
