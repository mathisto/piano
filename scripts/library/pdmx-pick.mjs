#!/usr/bin/env node
// Pick study books and easy repertoire out of PDMX (Zenodo 15571083, CC BY 4.0: 250,000 MuseScore.com scores their uploaders marked Public Domain or CC0):
//   node scripts/library/pdmx-pick.mjs <PDMX.csv> [out.json]      (default: scripts/library/pdmx-picks.json)
// Nothing here is trusted because a label says so: a row must have no licence conflict (PDMX's own check), a licence of 'publicdomain' or 'cc-zero', a composer who
// died by 1930 (fixed by the BOOKS table, not read from the uploader's free-text composer), and a title that names the book's opus and a number, with no
// other opus or number in the subtitle. Where several uploaders typeset the same number, all stay: dedupe in pipeline.ts keeps the best by its gates and drops
// the others as duplicates. A book is added by adding a line to BOOKS. The scores themselves come from mxl.tar.gz (build.mjs --set pdmx reads them).
import { readFileSync, writeFileSync } from 'node:fs'

const [csvPath, outPath = new URL('pdmx-picks.json', import.meta.url).pathname] = process.argv.slice(2)
if (!csvPath) throw new Error('usage: pdmx-pick.mjs <PDMX.csv> [out.json]')

// re: matches the uploader's title, capturing the number (and for Schumann the name); opus: the opus every other number in the subtitle must agree with
const N = '(\\d+)'
const BOOKS = [
  { key: 'lemoine-37', composer: 'Henry Lemoine (1786–1854)', book: 'Études enfantines', opus: 37, re: new RegExp(`^Lemoine: .tudes enfantines op\\. 37 no\\. ${N}$`, 'i') },
  { key: 'duvernoy-176', composer: 'Jean-Baptiste Duvernoy (1802–1880)', book: 'Elementary Studies', opus: 176, re: new RegExp(`^Elementary Studies \\(op 176\\) Etude ${N} by`, 'i') },
  { key: 'czerny-299', composer: 'Carl Czerny (1791–1857)', book: 'The School of Velocity', opus: 299, re: new RegExp(`(?:school of velocity|op ?299)[^\\d]*?(?:op\\.? ?299)?[^\\d]*?(?:no\\.?|nr\\.?|-)?\\s*${N}\\s*$`, 'i') },
  { key: 'czerny-740', composer: 'Carl Czerny (1791–1857)', book: 'The Art of Finger Dexterity', opus: 740, re: new RegExp(`Finger Dexterity \\(Op\\. 740\\) - No\\. ${N}$`, 'i') },
  { key: 'czerny-740b', composer: 'Carl Czerny (1791–1857)', book: 'The Art of Finger Dexterity', opus: 740, re: new RegExp(`Etude in .* Op\\. 740 no\\. ${N}$`, 'i') },
  { key: 'czerny-139', composer: 'Carl Czerny (1791–1857)', book: 'One Hundred Progressive Studies', opus: 139, re: new RegExp(`Czerny Op\\. 139 No\\. ${N}$`, 'i') },
  { key: 'czerny-300', composer: 'Carl Czerny (1791–1857)', book: 'The Art of Preluding', opus: 300, re: new RegExp(`Art of Preluding \\(Op\\. 300 - N ?${N}\\)`, 'i') },
  { key: 'czerny-399', composer: 'Carl Czerny (1791–1857)', book: 'The School of the Left Hand', opus: 399, re: new RegExp(`Schule der linken Hand Op\\.399 No\\.${N}$`, 'i') },
  { key: 'czerny-599', composer: 'Carl Czerny (1791–1857)', book: 'Practical Method for Beginners', opus: 599, re: new RegExp(`Op\\.? ?599 n\\.? ?${N}$`, 'i') },
  { key: 'czerny-599b', composer: 'Carl Czerny (1791–1857)', book: 'Practical Method for Beginners', opus: 599, re: new RegExp(`Exercise n\\. ${N} from Op\\. 599`, 'i') },
  { key: 'czerny-849', composer: 'Carl Czerny (1791–1857)', book: 'Thirty New Studies in Technics', opus: 849, re: new RegExp(`^Etude in .* No\\. ${N}$`, 'i'), sub: /Op\. 849 No\. (\d+)/ },
  { key: 'bertini-29', composer: 'Henri Bertini (1798–1876)', book: 'Twenty-Four Études', opus: 29, re: new RegExp(`Bertini Etude Op\\.29 No\\.${N} `, 'i') },
  { key: 'schumann-68', composer: 'Robert Schumann (1810–1856)', book: 'Album for the Young', opus: 68, re: new RegExp(`Album for the Young Op\\. 68 No\\. ${N} (.+)$`, 'i'), name: true },
  { key: 'diabelli-168', composer: 'Anton Diabelli (1781–1858)', book: 'Sonatina in F', opus: 168, re: new RegExp(`Sonatina in F major op\\. 168 no\\. ${N} - 1st movement`, 'i') },
]
// Op. 68 in one language (the Mutopia titles in titles.json use the same names); the uploaders' own spellings differ
const NAMES68 = { 15: 'Spring Song', 17: 'Little Morning Wanderer', 19: 'Little Romance' }
const LICENCE = { publicdomain: ['Public Domain', 'https://creativecommons.org/publicdomain/mark/1.0/'], 'cc-zero': ['CC0-1.0', 'https://creativecommons.org/publicdomain/zero/1.0/'] }

/** RFC 4180 rows of a large CSV, as arrays; quoted fields may hold commas, quotes ("") and newlines. */
function* rows(text) {
  let row = []
  let i = 0
  const n = text.length
  while (i < n) {
    let field
    if (text[i] === '"') {
      let j = i + 1
      field = ''
      for (;;) {
        const q = text.indexOf('"', j)
        field += text.slice(j, q)
        if (text[q + 1] === '"') (field += '"'), (j = q + 2)
        else {
          i = q + 1
          break
        }
      }
    } else {
      let j = i
      while (j < n && text[j] !== ',' && text[j] !== '\n' && text[j] !== '\r') j++
      field = text.slice(i, j)
      i = j
    }
    row.push(field)
    if (text[i] === ',') i++
    else {
      if (text[i] === '\r') i++
      if (text[i] === '\n') i++
      yield row
      row = []
    }
  }
}

// hand picks: single scores outside the numbered books; the title and composer are set here, the uploader's free text is not used
const HAND = [
  { title: /^8\. Waltz Childrens Album Tchaikovsky$/, composer: 'Pyotr Ilyich Tchaikovsky (1840–1893)', opus: 'Op. 39', n: 8, as: 'Waltz, Op. 39 No. 8' },
  { title: /^Anh\.? 132[: ]+Menuet/, composer: 'Johann Sebastian Bach (1685–1750)', opus: 'BWV Anh. 132', as: 'Menuet in D minor, BWV Anh. 132' },
  { title: /^01- Marche in D Major C\.P\.E\. Bach$/, composer: 'C. P. E. Bach (1714–1788)', opus: 'BWV Anh. 122', as: 'March in D major, BWV Anh. 122' },
  { title: /^03- Marche in Gmajor C\.P\.E\. Bach$/, composer: 'C. P. E. Bach (1714–1788)', opus: 'BWV Anh. 124', as: 'March in G major, BWV Anh. 124' },
  { title: /^04-Polonaise in G minor C\.P\.E\. Bach$/, composer: 'C. P. E. Bach (1714–1788)', opus: 'BWV Anh. 125', as: 'Polonaise in G minor, BWV Anh. 125' },
]
const it = rows(readFileSync(csvPath, 'utf8'))
const head = it.next().value
const col = Object.fromEntries(head.map((h, i) => [h, i]))
const picks = []
const seen = new Map() // book + number -> how many uploaders
for (const r of it) {
  const lic = r[col.license]
  if (!(lic in LICENCE) || r[col.license_conflict] !== 'False') continue
  const title = r[col.title]
  const sub = r[col.subtitle]
  const h = HAND.find((x) => x.title.test(title))
  if (h) {
    const score = Number(/(\d+)\.json$/.exec(r[col.metadata])[1])
    picks.push({ id: `pdmx-${score}`, score, mxl: r[col.mxl].replace(/^\.\//, ''), composer: h.composer, as: h.as, opus: h.opus, licence: LICENCE[lic][0], licenceUrl: LICENCE[lic][1], uploaded: title, bars: Number(r[col['song_length.bars']]) })
    continue
  }
  for (const b of BOOKS) {
    const m = b.re.exec(title)
    if (!m) continue
    const n = Number(m[1])
    // the subtitle may name the opus and number again: any other opus or number there means the title is mislabelled (a "no. 1" whose subtitle says No. 10)
    const sop = /Op\.? ?(\d+)/i.exec(sub)?.[1]
    const sno = (b.sub ? b.sub.exec(sub) : /\bNo\.? ?(\d+)/i.exec(sub))?.[1]
    if ((sop && Number(sop) !== b.opus) || (sno && Number(sno) !== n)) continue
    if (Number(r[col['song_length.bars']]) < 4) continue
    const score = Number(/(\d+)\.json$/.exec(r[col.metadata])[1])
    const k = `${b.key.replace(/b$/, '')}-${n}`
    seen.set(k, (seen.get(k) ?? 0) + 1)
    picks.push({
      id: `pdmx-${score}`,
      score,
      mxl: r[col.mxl].replace(/^\.\//, ''),
      composer: b.composer,
      book: b.book,
      opus: `Op. ${b.opus}`,
      n,
      ...(b.name && { name: NAMES68[n] ?? m[2].replace(/\s+/g, ' ').trim() }),
      licence: LICENCE[lic][0],
      licenceUrl: LICENCE[lic][1],
      uploaded: title,
      bars: Number(r[col['song_length.bars']]),
    })
    break
  }
}
// uploaders who disagree about a number: the bar counts that sit with the majority stay (three typesets of 22 bars outvote one of 44); with two that disagree, neither
const key = (x) => `${x.book}/${x.n}`
const groups = Map.groupBy(picks.filter((x) => x.n), key)
const odd = new Set()
for (const g of groups.values()) {
  if (g.length < 2) continue
  const near = (a) => g.filter((x) => Math.abs(x.bars - a.bars) <= 0.2 * a.bars)
  const best = g.reduce((m, x) => (near(x).length > near(m).length ? x : m))
  for (const x of g) if (!near(best).includes(x) || (near(best).length === 1 && g.length === 2)) odd.add(x.id)
}
const kept = picks.filter((x) => !odd.has(x.id))
console.log(`${odd.size} dropped where uploaders disagree: ${[...odd].join(' ')}`)
picks.length = 0
picks.push(...kept)
writeFileSync(outPath, JSON.stringify({ record: 'https://zenodo.org/records/15571083', picks }, null, 1) + '\n')
console.log(`${picks.length} picks (${seen.size} numbers) from ${BOOKS.length} books -> ${outPath}`)
