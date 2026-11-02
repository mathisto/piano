// The big-library pipeline (scripts/library/): every gate fires on a fixture, licences are refused, and a rerun is byte-identical.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { lilypondMidi, movements, openscoreMeta, PIANO, PUBLISHED_BY, refusals, scoreParts, sha, unzip, zip } from '../scripts/library/lib.mjs'
import { analyse, dedupe, FEATURES, GATES, judge, lyPace, merge, reach, reanalysed, retitle, run, type Input } from '../scripts/library/pipeline'
import { formOf, kindOf, periodOf } from '../scripts/library/kind'
import type { Catalog, Piece } from './catalog-types'
import { decode, incipit } from './incipit'
import { Midi } from '@tonejs/midi'
import { fromMusicXml, xmlText } from './musicxml'
import { fromSpec, type Song } from './song'

// eight clean bars of C major: a quarter-note tune over half-note bass, 16 s at 120 bpm
const base = () =>
  fromSpec({ id: 'x', title: 'x', bpm: 120, fifths: 0, rh: 'C5:1 D5:1 E5:1 F5:1 G5:1 F5:1 E5:1 D5:1 '.repeat(4), lh: 'C3:2 G3:2 '.repeat(8) })
const all = (j: ReturnType<typeof judge>) => [...j.fails, ...j.review, ...j.flags]

describe('library pipeline gates', () => {
  it('a clean piece passes every gate', () => {
    const j = judge(base(), '', true)
    expect(all(j)).toEqual([])
    expect(j.quality).toBe(100)
    expect(j.gradeWhy).toHaveLength(7)
    expect(j.grade).toBe(1)
  })

  const cases: Record<string, (s: Song) => [Song, string?, boolean?]> = {
    notes: (s) => [{ ...s, notes: s.notes.slice(0, 19) }],
    bars: (s) => [{ ...s, bars: s.bars.slice(0, 3), notes: s.notes.filter((n) => n.bar < 3) }],
    pitch: (s) => [{ ...s, hi: 110 }],
    'bar-order': (s) => [{ ...s, bars: s.bars.map((b, i) => (i === 2 ? { ...b, t0: s.bars[1].t0 } : b)) }],
    length: (s) => [{ ...s, end: 1000 }],
    'bar-length': (s) => [{ ...s, bars: s.bars.map((b, i) => (i === 3 ? { ...b, ql: 3 } : b)) }],
    key: (s) => [{ ...s, fifths: 4 }],
    'hand-share': (s) => [{ ...s, notes: s.notes.map((n) => ({ ...n, h: 'R' as const })) }],
    'hand-register': (s) => [{ ...s, notes: s.notes.map((n) => (n.h === 'L' ? { ...n, p: n.p + 36 } : n)) }],
    chord: (s) => [{ ...s, notes: [...s.notes, ...[60, 62, 64, 65, 67, 69].map((p, k) => ({ ...s.notes[0], id: 900 + k, p }))] }],
    span: (s) => [{ ...s, notes: s.notes.flatMap((n) => (n.h === 'R' ? [n, { ...n, id: n.id + 500, p: n.p - 14 }] : [n])) }],
    'no-tempo': (s) => [s, '', false],
    'tempo-estimated': (s) => [{ ...s, flags: ['tempo-estimated'] }],
    'dc-ds': (s) => [s, 'Allegro D.C. al Fine'],
    repeats: (s) => [s, '\\repeat volta 2 { c4 }'],
    tuplets: (s) => [{ ...s, notes: s.notes.map((n, i) => (i === 3 ? { ...n, tuplet: { num: 5, den: 4 } } : n)) }],
  }
  for (const [gate, make] of Object.entries(cases))
    it(`${gate} fires on its fixture`, () => {
      const [s, marks, tempo] = make(base())
      expect(all(judge(s, marks ?? '', tempo ?? true))).toContain(gate)
    })

  it('the quoted form \\repeat "volta" is flagged too', () => {
    expect(judge(base(), '\\repeat "volta" 2 { c4 }').flags).toContain('repeats')
  })

  it('a repeat LilyPond already unfolds into the MIDI is not flagged', () => {
    expect(judge(base(), '\\repeat volta 2 { c4 } \\midi { } \\unfoldRepeats').flags).not.toContain('repeats')
  })

  it('covers every gate, and a file that does not parse fails', async () => {
    expect(Object.keys(cases).sort()).toEqual([...GATES.fail, ...GATES.review, ...GATES.flag].filter((g) => g !== 'parse').sort())
    const bad = await analyse({ id: 'bad', format: 'midi', bytes: new Uint8Array([1, 2, 3]) } as Input)
    expect(bad.fails).toEqual(['parse'])
  })
})

describe('the pace a Mutopia .ly names', () => {
  it('a number means the MIDI already plays it, in any of the three spellings', () => {
    for (const ly of ['\\tempo 4=96', '\\tempo "Allegro" 4 = 120', '\\set Score.tempoWholesPerMinute = #(ly:make-moment 90 4)']) expect(lyPace(ly)).toEqual({ given: true })
    expect(lyPace('% \\tempo 4=96\n\\tempo "Presto"').bpm).toBe(176) // a comment is not a tempo
  })
  it('reads the first word of a \\tempo, a header piece or meter, a markup or a script', () => {
    expect(lyPace('\\tempo "Allegro moderato"').bpm).toBe(118)
    expect(lyPace('\\header { piece = " Andante" }').bpm).toBe(84)
    expect(lyPace('\\header { meter = \\markup { \\bold "Adagio" } }').bpm).toBe(66)
    expect(lyPace('\\header { title = "x" }\n{ c4^\\markup { \\italic "Vivace" } }').bpm).toBe(152)
    expect(lyPace('{ c4_"Lento" }').bpm).toBe(52)
    expect(lyPace('\\header { piece = \\markup { \\bold "Allegro" } }', true).bpm).toBe(158) // a compound meter beats a dotted quarter
  })
  it('a markup metronome mark is a number, in quarters whatever its unit', () => {
    const mark = (note: string, n: number) => `\\markup{\\column {\\line {\\bold "Andante. ("\\note #"${note}" #1 \\bold " = ${n})"}}}`
    expect(lyPace(mark('4', 60))).toEqual({ given: false, bpm: 60, exact: true }) // not the 84 that "Andante" would guess
    expect(lyPace(mark('2', 50)).bpm).toBe(100)
    expect(lyPace(mark('4.', 112)).bpm).toBe(168)
    expect(lyPace(mark('8', 120)).bpm).toBe(60)
  })
  it('finds nothing in a title, a composer or a tagline', () => {
    expect(lyPace('\\header { title = "Allegro in C" composer = "Lento" tagline = \\markup { Free to download } }')).toEqual({ given: false })
  })

  // LilyPond's MIDI plays 60 bpm when the score gives no number
  const midi = (bpm?: number, ly?: string) => {
    const m = new Midi()
    if (bpm) m.header.setTempo(bpm)
    m.header.timeSignatures.push({ ticks: 0, timeSignature: [4, 4] } as never)
    const t = m.addTrack()
    for (let i = 0; i < 64; i++) t.addNote({ midi: 60 + (i % 7), ticks: i * 480, durationTicks: 400 })
    return { id: 'x', title: 'x', format: 'midi', bytes: new Uint8Array(m.toArray()), ly } as Input
  }
  it('a tempo word replaces the default 60 and is flagged as a guess, in the catalogue entry and not in the bytes', async () => {
    const e = midi(60, '\\header { piece = "Allegro" }')
    const a = await analyse(e)
    expect(a.tempo).toBe(132)
    expect(a.flags).toEqual(['tempo-estimated'])
    expect(a.song!.spb).toBeCloseTo(60 / 132, 3)
  })
  it('a markup metronome mark sets the tempo without the flag', async () => {
    const a = await analyse(midi(60, '\\header { piece = \\markup { \\bold "Allegro" \\note #"4" #1 " = 100" } }'))
    expect(a.tempo).toBe(100)
    expect(a.flags).toEqual([])
  })
  it('a score that names no pace gets the default 100, or its form, flagged as a guess; a number or a tempo set elsewhere is left alone', async () => {
    for (const e of [midi(60, '{ c4 }'), midi(undefined, '{ c4 }')]) {
      const a = await analyse(e)
      expect([a.tempo, a.flags]).toEqual([100, ['tempo-estimated']])
    }
    expect((await analyse({ ...midi(60, '\\header { piece = "Mazurka" }'), id: 'mutopia-9' })).tempo).toBe(140) // the form is in the .ly's header
    expect((await analyse({ ...midi(60, '{ c4 }'), title: 'Waltz in A' })).tempo).toBe(150) // or the title
    expect((await analyse({ ...midi(60, '\\header { piece = "Mazurka" }'), id: 'mutopia-9-2' })).tempo).toBe(100) // a movement of a zip whose .ly is not its own (it does not play this file): no form
    for (const e of [midi(60, '\\tempo "Allegro" 4=60'), midi(96, '\\header { piece = "Allegro" }'), midi(96, '{ c4 }'), midi(60)]) {
      const a = await analyse(e)
      expect(a.tempo).toBeUndefined()
      expect(a.flags).toEqual([])
    }
  })
})

describe('LilyPond source from a repository', () => {
  it('the MIDI of a score is kept by the sha256 of its source, so a rerun needs no binary; no cache and no binary says so', () => {
    const ly = '\\version "2.24.0" { c4 d e f }'
    expect(() => lilypondMidi(ly, undefined, '/nonexistent/lilypond')).toThrow(/no lilypond binary/)
    const cache = mkdtempSync(`${tmpdir()}/lib-ly-`)
    writeFileSync(`${cache}/${sha(ly)}-2.26.0.mid`, 'MThd')
    expect(lilypondMidi(ly, cache, '/nonexistent/lilypond').toString()).toBe('MThd')
    expect(() => lilypondMidi(`${ly} `, cache, '/nonexistent/lilypond')).toThrow(/no lilypond binary/) // another source, another key
  })
})

describe('pdmx-pick: study books out of the PDMX table', () => {
  const COLS = ['path', 'metadata', 'mxl', 'license', 'license_conflict', 'title', 'subtitle', 'composer_name', 'artist_name', 'song_length.bars']
  const row = (id: number, title: string, o: { lic?: string; conflict?: string; sub?: string; bars?: number } = {}) =>
    [`./data/${id}.json`, `./metadata/${id % 10}/${id}.json`, `./mxl/${id}.mxl`, o.lic ?? 'cc-zero', o.conflict ?? 'False', title, o.sub ?? 'NA', 'whoever', 'NA', o.bars ?? 24].map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(',')
  const pick = (rows: string[]) => {
    const d = mkdtempSync(`${tmpdir()}/lib-pdmx-`)
    writeFileSync(`${d}/PDMX.csv`, [COLS.join(','), ...rows].join('\n') + '\n')
    execFileSync('node', ['scripts/library/pdmx-pick.mjs', `${d}/PDMX.csv`, `${d}/picks.json`], { stdio: 'pipe' })
    return (JSON.parse(readFileSync(`${d}/picks.json`, 'utf8')).picks as { id: string; book: string; n: number; composer: string; licence: string }[]).map((p) => `${p.id} ${p.book} ${p.n} ${p.licence}`)
  }
  it('takes a numbered title, a CC0 or Public Domain Mark with no conflict, and the book table names the composer', () => {
    const got = pick([
      row(101, 'Lemoine: Études enfantines op. 37 no. 3'),
      row(102, 'Lemoine: Études enfantines op. 37 no. 4', { lic: 'publicdomain' }),
      row(103, 'Lemoine: Études enfantines op. 37 no. 5', { conflict: 'True' }), // PDMX's own licence conflict
      row(104, 'Lemoine: Études enfantines op. 37 no. 6', { lic: 'cc-by' }), // not a licence the table keeps
      row(105, 'Lemoine: Études enfantines op. 37 no. 7 training'), // not the book's title shape
      row(106, 'Lemoine: Études enfantines op. 37 no. 8', { bars: 2 }), // a scrap
      row(107, 'Something else entirely'),
    ])
    expect(got).toEqual(['pdmx-101 Études enfantines 3 CC0-1.0', 'pdmx-102 Études enfantines 4 Public Domain'])
  })
  it('a subtitle that names another opus or number means the title is mislabelled; uploaders who disagree about a number are outvoted', () => {
    const got = pick([
      row(201, 'Czerny - School Of Velocity - Op. 299 No. 1', { bars: 22 }),
      row(202, 'School Of Velocity op. 299 no.1 Czerny', { bars: 22 }),
      row(203, 'Czerny - The School of Velocity (Op.299) - no. 1', { sub: 'Op. 299 No. 10', bars: 44 }), // mislabelled
      row(204, 'The School Of Velocity - 1', { bars: 44 }), // disagrees with the two typesets of 22 bars
      row(205, 'Czerny - The School of Velocity (Op.299) - no. 8', { sub: 'Op. 266', bars: 110 }),
      row(206, 'Czerny - The School of Velocity (Op.299) - no. 2', { bars: 21 }),
      row(207, 'Czerny - The School of Velocity (Op.299) - no. 3', { bars: 24 }),
      row(208, 'Czerny - School Of Velocity - Op. 299 No. 3', { bars: 60 }), // two for No. 3, far apart: neither stays
    ])
    expect(got).toEqual(['pdmx-201 The School of Velocity 1 CC0-1.0', 'pdmx-202 The School of Velocity 1 CC0-1.0', 'pdmx-206 The School of Velocity 2 CC0-1.0'])
  })
})

describe('multi-movement zip', () => {
  it("orders LilyPond's name.mid, name-1.mid, ... and titles dances by name, leaving four-hand versions out", () => {
    const z = (names: string[]) => zip(names.map((n) => [n, Buffer.from(n)]))
    const names = (base: string, files: string[]) => movements(z(files), base).map((m: { name: string; stem: string }) => `${m.stem}=${m.name}`)
    expect(names('son', ['son-2.mid', 'son-10.mid', 'son.mid', 'son-1.mid', 'son.ly', 'son-four-hands.mid'])).toEqual(['son=Movement 1', 'son-1=Movement 2', 'son-2=Movement 3', 'son-10=Movement 4'])
    expect(names('french-suite-5', ['french-suite-5-gigue.mid', 'french-suite-5-allemande.mid', 'x/il-vecchio-castello.mid'])).toEqual([
      'french-suite-5-allemande=Allemande',
      'french-suite-5-gigue=Gigue',
      'il-vecchio-castello=Il vecchio castello',
    ])
  })
})

describe('licence check', () => {
  const allow = ['Public Domain', 'CC-BY-4.0', 'CC-BY-SA-3.0']
  const ok = { licence: 'Public Domain', composer: 'J. S. Bach (1685–1750)', edition: 'Bach-Gesellschaft (1894)' }
  it('passes a public-domain piece and refuses NC, a late death, an unknown death and a late edition', () => {
    expect(refusals(ok, allow)).toEqual([])
    expect(refusals({ ...ok, licence: 'CC-BY-NC-4.0' }, allow)).toEqual(['licence CC-BY-NC-4.0'])
    expect(refusals({ ...ok, composer: 'B. Bartók (1881–1960)' }, allow)).toEqual(['composer died 1960'])
    expect(refusals({ ...ok, composer: 'Anonymous' }, allow)).toEqual(['composer death unknown'])
    expect(refusals({ ...ok, edition: 'Dover, 1998' }, allow)).toEqual(['dated 1998'])
  })
  it('holds a composer who died after 1930 until the id is allow-listed with evidence; the held Lieder stay out', () => {
    const late = { ...ok, composer: 'Richard Strauss (1864–1949)' }
    const hold = JSON.parse(readFileSync(new URL('../scripts/library/hold-lieder.json', import.meta.url), 'utf8')).ids
    expect(refusals({ ...late, id: hold[0] }, allow)).toEqual([`composer died 1949, publication by ${new Date().getFullYear() - 96} unchecked`])
    expect(refusals({ ...late, id: 'mutopia-2162' }, allow)).toEqual([])
    for (const id of hold) expect(PUBLISHED_BY[id], id).toBeUndefined()
    for (const [id, why] of Object.entries(PUBLISHED_BY)) {
      if (typeof why === 'string') expect(Math.min(...why.match(/\b1[5-9]\d\d\b/g)!.map(Number)), id).toBeLessThanOrEqual(1930)
      else {
        const { year, evidenceUrl } = why as { year: number; evidenceUrl: string }
        expect(year, id).toBeLessThanOrEqual(1930)
        expect(evidenceUrl, id).toMatch(/^https:\/\/imslp\.org\/wiki\/\S+$/)
        expect(refusals({ ...late, id }, allow), id).toEqual([])
      }
    }
    expect(refusals({ ...late, id: 'lieder-x' }, allow)).toHaveLength(1)
  })
})

describe('library pipeline run', () => {
  const DIR = new URL('../public/library/', import.meta.url)
  const pick = ['mutopia-75', 'mutopia-202', 'mutopia-1612', 'lieder-lc6180725']
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', DIR), 'utf8')).filter((m: { id: string }) => pick.includes(m.id))
  const inputs: Input[] = manifest.map((m: Record<string, string>) => ({
    id: m.id,
    title: m.title,
    composer: m.composer,
    source: m.id.startsWith('mutopia') ? 'mutopia' : 'openscore-lieder',
    sourceUrl: m.sourceUrl,
    licenceEvidence: m.licenceEvidence,
    licence: m.licence,
    licenceUrl: m.licenceUrl,
    edition: m.sourceEdition,
    format: m.format,
    bytes: new Uint8Array(readFileSync(new URL(m.file, DIR))),
    upstreamSha: m.sha256,
  }))
  // the same Minuet again under another id: a duplicate
  inputs.push({ ...inputs.find((i) => i.id === 'mutopia-75')!, id: 'mutopia-9999' })

  it('keeps ids, drops the duplicate, and a second run is byte-identical', async () => {
    const [a, b] = [mkdtempSync(`${tmpdir()}/lib-a-`), mkdtempSync(`${tmpdir()}/lib-b-`)]
    const rows = await run(inputs, a)
    await run([...inputs].reverse(), b)
    expect(rows.find((r) => r.id === 'mutopia-9999')).toMatchObject({ stage: 'dedupe', why: ['duplicate of mutopia-75'] })
    const cat = JSON.parse(readFileSync(`${a}/catalog.json`, 'utf8'))
    expect(cat.pieces.map((p: { id: string }) => p.id)).toEqual(['lieder-lc6180725', 'mutopia-75', 'mutopia-202', 'mutopia-1612'])
    const files = (d: string) => ['catalog.json', 'LICENSES.md', ...readdirSync(`${d}/p`).map((f) => `p/${f}`)].sort()
    expect(files(b)).toEqual(files(a))
    for (const f of files(a)) expect(readFileSync(`${b}/${f}`).equals(readFileSync(`${a}/${f}`)), f).toBe(true)
    expect(cat.aliases).toEqual({ 'mutopia-9999': 'mutopia-75' })
  })

  it('a pinned (already shipped) piece wins dedupe, keeps no alias, and ships first under the limit', async () => {
    const d = mkdtempSync(`${tmpdir()}/lib-p-`)
    const rows = await run(inputs, d, { pinned: ['mutopia-9999', 'mutopia-202'], limit: 2 })
    expect(rows.find((r) => r.id === 'mutopia-75')).toMatchObject({ stage: 'dedupe', why: ['duplicate of mutopia-9999'] })
    const cat = JSON.parse(readFileSync(`${d}/catalog.json`, 'utf8'))
    expect(cat.pieces.map((p: { id: string }) => p.id)).toEqual(['mutopia-202', 'mutopia-9999'])
    expect(cat.aliases).toEqual({ 'mutopia-75': 'mutopia-9999' })
  })
})

describe('lieder: the voice folded into the right hand', () => {
  const DIR = new URL('../public/library/', import.meta.url)
  const OUT = new URL('../.cache/library/out-lieder/', import.meta.url) // npm run library:build -- --set lieder (not committed)
  const song = async (b: Uint8Array) => fromMusicXml(await xmlText(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer), 'x', 'x')
  // a folded .mxl and the same song with its voice part dropped
  const pair = (b: Buffer) => {
    const voices = scoreParts(b).filter((p: { name: string }) => !PIANO.test(p.name)).map((p: { id: string }) => p.id)
    return [new Uint8Array(b), new Uint8Array(openscoreMeta({ id: 'x', dropParts: voices }, b).bytes)]
  }
  const input = (id: string, bytes: Uint8Array, title: string): Input => ({
    id, title, composer: 'Franz Schubert (1797–1828)', source: 'openscore-lieder', sourceUrl: 'https://x', licenceEvidence: 'https://x', licence: 'CC0-1.0',
    licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', edition: 'x', format: 'musicxml', bytes, upstreamSha: id,
  })
  const folded = (dir: URL, files: string[]) => files.map((f) => pair(readFileSync(new URL(f, dir))))
  const check = async (pairs: Uint8Array[][]) => {
    expect(pairs.length).toBeGreaterThanOrEqual(3)
    for (const [sung, solo] of pairs) {
      const [s, p] = [await song(sung), await song(solo)]
      expect(reach(s).ok).toBe(true)
      expect(s.notes.filter((n) => n.h === 'R').length).toBeGreaterThan(p.notes.filter((n) => n.h === 'R').length) // the melody is there
    }
  }

  it('the bundled folded songs pass the fold gate and carry more right-hand notes than piano-only', async () => {
    await check(folded(DIR, ['lieder-lc5701612.mxl', 'lieder-lc4976849.mxl', 'lieder-lc6180725.mxl']))
  })

  it.skipIf(!existsSync(OUT))('so do the first three folded songs the lieder run shipped', async () => {
    const cat = JSON.parse(readFileSync(new URL('catalog.json', OUT), 'utf8'))
    const ps = cat.pieces.filter((p: { flags: string[]; id: string }) => p.flags.includes('voice-folded') && !['lieder-lc5701612', 'lieder-lc4976849', 'lieder-lc6917116', 'lieder-lc6180725'].includes(p.id))
    await check(folded(OUT, ps.slice(0, 3).map((p: { file: string }) => p.file)))
  })

  it('ships a song folded when it passes, piano-only when the voice sits out of reach; merging keeps the base untouched', async () => {
    const [sung, solo] = pair(readFileSync(new URL('lieder-lc6180725.mxl', DIR)))
    // the same song with its vocal line two octaves down: out of one hand's reach
    const files = unzip(Buffer.from(sung))
    const [root] = [...files.keys()].filter((f: string) => !f.startsWith('META-INF'))
    const voice = scoreParts(Buffer.from(sung)).find((p: { name: string }) => !PIANO.test(p.name)).id
    const xml = files.get(root).toString().replace(new RegExp(`<part id="${voice}">[\\s\\S]*?</part>`), (part: string) => part.replace(/<octave>(\d)<\/octave>/g, (_: string, o: string) => `<octave>${+o - 2}</octave>`))
    const low = new Uint8Array(zip([...files].map(([f, b]) => [f, f === root ? Buffer.from(xml) : b])))
    const alt = (id: string) => ({ ...input(id, solo, 'x: piano part'), voice: 'dropped' as const, composer: 'Carl Loewe (1796–1869)' }) // not a duplicate of lieder-a
    const d = mkdtempSync(`${tmpdir()}/lib-l-`)
    const rows = await run([
      { ...input('lieder-a', sung, 'x: melody and piano'), voice: 'folded', alt: alt('lieder-a') },
      { ...input('lieder-b', low, 'x: melody and piano'), voice: 'folded', alt: alt('lieder-b'), composer: 'Carl Loewe (1796–1869)' },
    ], d)
    const cat = JSON.parse(readFileSync(`${d}/catalog.json`, 'utf8'))
    expect(cat.pieces.map((p: { title: string; flags: string[] }) => [p.title, p.flags.filter((f) => f.startsWith('voice'))])).toEqual([
      ['x: melody and piano', ['voice-folded']],
      ['x: piano part', ['voice-dropped']],
    ])
    expect(rows.find((r) => r.id === 'lieder-b')!.why[0]).toMatch(/^voice dropped: folded right-hand reach \d+/)

    const base = mkdtempSync(`${tmpdir()}/lib-m-`)
    await run([input('lieder-a', sung, 'kept')], base)
    const before = readFileSync(`${base}/catalog.json`, 'utf8')
    expect(merge(base, d)).toEqual(['lieder-b'])
    const m = JSON.parse(readFileSync(`${d}/catalog.json`, 'utf8'))
    expect(m.pieces[0]).toEqual(JSON.parse(before).pieces[0]) // the base piece as it was, not this run's
    expect(m.pieces.map((p: { id: string }) => p.id)).toEqual(['lieder-a', 'lieder-b'])
    expect(readdirSync(`${d}/p`).sort()).toEqual(m.pieces.map((p: { file: string }) => p.file.slice(2)).sort())
  })
})

describe('dedupe: editions of one song', () => {
  const item = (id: string, voice: 'folded' | 'dropped' | undefined, fp: string[], quality: number) =>
    ({ e: { id, title: 'Hulanka (Drinking Song), Op. 74 No. 4', composer: 'Frédéric Chopin (1810–1849)', sourceUrl: id, voice } as Input, a: { fails: [], quality, fp: new Set(fp) } }) as unknown as Parameters<typeof dedupe>[0][number]

  it('are one song though one folds and the other falls back to piano-only (their top lines differ); two plain pieces are not', () => {
    const song = dedupe([item('g', 'folded', ['a', 'b', 'c'], 100), item('sam', 'dropped', ['x', 'y', 'z'], 90)])
    expect(song.keep.map((x) => x.e.id)).toEqual(['g'])
    expect(song.dropped).toEqual([{ id: 'sam', dupOf: 'g' }])
    expect(dedupe([item('g', undefined, ['a', 'b', 'c'], 100), item('sam', undefined, ['x', 'y', 'z'], 90)]).keep).toHaveLength(2)
  })
})

describe('catalogue fields: mode, a stated metre, kind, form, period, the grade features and the incipit sidecar', () => {
  const tune = (n: number) => Array.from({ length: n }, (_, i) => ['C5', 'D5', 'E5', 'G5', 'F5', 'E5', 'D5', 'C5'][(i * 3 + (i >> 2)) % 8])
  const xml = (o: { mode?: string; time?: boolean; bars?: number; same?: boolean }) => {
    const bars = o.bars ?? 20
    const ms = Array.from({ length: bars }, (_, m) => {
      const t = o.same ? ['C5', 'E5', 'G5', 'E5'] : tune(bars * 4).slice(m * 4, m * 4 + 4)
      const head = m ? '' : `<attributes><divisions>1</divisions><key><fifths>-3</fifths>${o.mode ? `<mode>${o.mode}</mode>` : ''}</key>${o.time === false ? '' : '<time><beats>4</beats><beat-type>4</beat-type></time>'}</attributes><direction><sound tempo="100"/></direction>`
      return `<measure number="${m + 1}">${head}${t.map((p) => `<note><pitch><step>${p[0]}</step><octave>${p[1]}</octave></pitch><duration>1</duration></note>`).join('')}</measure>`
    })
    return `<?xml version="1.0"?><score-partwise><part-list><score-part id="P1"/></part-list><part id="P1">${ms.join('')}</part></score-partwise>`
  }
  const input = (id: string, bytes: string, o: Partial<Input> = {}): Input => ({ id, title: 'Minuet in C minor', composer: 'J. S. Bach (1685–1750)', source: 'mutopia', sourceUrl: id, licenceEvidence: 'x', licence: 'Public Domain', licenceUrl: 'u', edition: 'e', format: 'musicxml', bytes: new TextEncoder().encode(bytes), upstreamSha: id, ...o })
  const built = async (xs: Input[]) => {
    const d = mkdtempSync(`${tmpdir()}/lib-c1-`)
    await run(xs, d, { overrides: {} })
    return { d, cat: JSON.parse(readFileSync(`${d}/catalog.json`, 'utf8')) as Catalog }
  }

  it('a <mode> in the score is in the catalogue and survives a re-analysis; no <mode> and no <time> write neither field', async () => {
    const { cat } = await built([input('a', xml({ mode: 'minor' })), input('b', xml({ time: false }), { title: 'Melody' })])
    const [a, b] = cat.pieces
    expect([a.mode, a.meter, b.mode, b.meter]).toEqual(['minor', '4/4', undefined, undefined])
    const published = { ...a, mode: undefined, kind: undefined, form: undefined } as unknown as Piece // a catalogue from before the field
    const r = reanalysed(published, a)
    expect([r.mode, r.form]).toEqual(['minor', 'dance'])
    expect(r.title).toBe(a.title) // everything else stays as published
    expect(reanalysed({ ...b, meter: '4/4' }, b).meter).toBeUndefined() // a metre the source does not state is taken away again
  })

  it('a MIDI with no time-signature event states no metre', async () => {
    const m = new Midi()
    const t = m.addTrack()
    for (let i = 0; i < 64; i++) t.addNote({ midi: 60 + [0, 2, 4, 7, 5, 4, 2, 0][i % 8] + (i >> 4), time: i * 0.6, duration: 0.5 })
    const { cat } = await built([input('m', '', { format: 'midi', bytes: new Uint8Array(m.toArray()) })])
    expect(cat.pieces[0].meter).toBeUndefined()
  })

  it('kind: a Lied is accomp, a piece tagged technique a study, under 16 bars or 10 seconds a fragment, the rest unmarked', async () => {
    const k = (o: Partial<Parameters<typeof kindOf>[0]>) => kindOf({ source: 'mutopia', tags: [], bars: 40, sec: 90, ...o })
    expect(k({})).toBeUndefined()
    expect(k({ source: 'openscore-lieder', bars: 10 })).toBe('accomp')
    expect(k({ tags: ['technique'] })).toBe('study')
    expect(k({ tags: ['technique'], bars: 8 })).toBe('study') // a study of eight bars is still a study
    expect(k({ bars: 15 })).toBe('fragment')
    expect(k({ sec: 9 })).toBe('fragment')
    expect(k({ tags: ['baroque', 'ties'] })).toBeUndefined()
    expect([k({ title: '50 Melodische Übungsstücke, No. 2' }), k({ title: 'Melodic Study, Op. 840 No. 1' }), k({ title: 'Étude, Op. 10 No. 3' })]).toEqual(['study', 'study', undefined]) // Czerny's Op. 840 is a study book; a Chopin étude stays a piece
    // through run(): the style of a Mutopia piece is a tag, and the length is the score's
    const { cat } = await built([input('study', xml({}), { title: 'Exercise 1', style: 'Technique' }), input('tune', xml({}), { title: 'Melody' }), input('short', xml({ bars: 8 }), { title: 'Scrap' })])
    expect(cat.pieces.map((p) => [p.id, p.kind])).toEqual([['short', 'fragment'], ['study', 'study'], ['tune', undefined]])
  })

  it('kind: a composer of teaching books is a study whatever the Mutopia style says; Burgmuller is repertoire', () => {
    const k = (composer: string) => kindOf({ source: 'mutopia', tags: ['romantic'], bars: 40, sec: 90, composer })
    expect([k('C. Czerny (1791–1857)'), k('F. Köhler (1820–1886)'), k('C. L. Hanon (1819–1900)'), k('J. F. F. Burgmüller (1806–1874)'), k('R. Schumann (1810–1856)')]).toEqual(['study', 'study', 'study', undefined, undefined])
  })

  it('retitle: new titles and opus for the listed ids, form and kind worked out again, nothing else moves, a stale id throws', async () => {
    const { d, cat } = await built([input('a', xml({}), { title: 'Movement 1', composer: 'C. Czerny (1791–1857)', opus: 'junk' }), input('b', xml({ same: true }), { title: 'Melody' })])
    expect([cat.pieces[0].form, cat.pieces[0].kind]).toEqual([undefined, 'study']) // run() applies the composer rule too
    const out = mkdtempSync(`${tmpdir()}/lib-retitle-`)
    const changed = retitle(d, out, { a: { title: 'Prelude in C major', opus: 'Op. 42' } })
    const after = JSON.parse(readFileSync(`${out}/catalog.json`, 'utf8')) as Catalog
    const [a, b] = after.pieces
    expect([a.title, a.opus, a.form, a.kind]).toEqual(['Prelude in C major', 'Op. 42', 'prelude', 'study'])
    expect(changed).toEqual(['a'])
    expect({ ...b }).toEqual({ ...cat.pieces[1] }) // an unlisted piece stays as it was
    expect([a.file, a.sha256]).toEqual([cat.pieces[0].file, cat.pieces[0].sha256])
    expect(readdirSync(`${out}/p`)).toEqual(readdirSync(`${d}/p`))
    expect(after.built).not.toBe(cat.built)
    expect(readFileSync(`${out}/LICENSES.md`, 'utf8')).toContain('Prelude in C major')
    expect(() => retitle(d, out, { nope: 'x' })).toThrow(/nope/)
    expect(retitle(d, out, { a: 'Plain' })).toEqual(['a']) // a title alone keeps the piece's own opus
    expect(JSON.parse(readFileSync(`${out}/catalog.json`, 'utf8')).pieces[0].opus).toBe('junk')
  })

  it('period comes from the birth year; form from the title', () => {
    expect([1685, 1732, 1770, 1810, 1862, 1873].map((born) => periodOf({ born, died: born + 60 }))).toEqual(['baroque', 'classical', 'classical', 'romantic', 'modern', 'modern'])
    expect(periodOf({ died: 1750 })).toBe('baroque') // no birth year: the death year less 60
    const f = (t: string) => formOf(t)
    expect([f('Minuet in G'), f('Das Wohltemperierte Clavier I, Fuga I'), f('Prelude and Fugue in C'), f('Sonatina in C, Op. 36 No. 1: Allegro'), f('Étude Op. 10 No. 3'), f('Nocturne in E-flat'), f('Lieder ohne Worte'), f('Untitled')]).toEqual(['dance', 'fugue', 'prelude', 'sonata', 'study', 'nocturne', 'song', undefined])
  })

  it('the raw features behind the grade are kept, and are the capped terms before capping', async () => {
    const j = judge(base(), '', true)
    expect(j.feat).toHaveLength(FEATURES.length)
    expect(j.feat[4]).toBe(base().hi - base().lo) // the range
    expect(Math.min(3, j.feat[0] / 2)).toBeCloseTo(j.gradeWhy[0], 2)
    const { d, cat } = await built([input('a', xml({}))])
    const f = JSON.parse(readFileSync(`${d}/features.json`, 'utf8'))
    expect(f.names).toEqual(FEATURES)
    expect(Object.keys(f.p)).toEqual([cat.pieces[0].id])
  })

  it('writes the incipit sidecar, content-addressed and named in the catalogue, with every piece in it, byte-identical on a second run', async () => {
    const xs = [input('a', xml({ mode: 'minor' })), input('b', xml({}), { title: 'Melody' })]
    const [x, y] = [await built(xs), await built([...xs].reverse())]
    expect(x.cat.incipits).toMatch(/^i\/[0-9a-f]{16}\.json$/)
    expect(x.cat.incipits).toBe(y.cat.incipits)
    const side = JSON.parse(readFileSync(`${x.d}/${x.cat.incipits}`, 'utf8'))
    expect(Object.keys(side.p)).toEqual(['a', 'b'])
    const song = (await analyse(xs[0])).song!
    const got = decode(side.p.a, { id: 'a', title: 'x', fifths: song.fifths, lo: song.lo, hi: song.hi })
    expect(got.notes.map((n) => [n.bar, n.p])).toEqual(incipit(song).notes.map((n) => [n.bar, n.p]))
    expect(readFileSync(`${y.d}/${y.cat.incipits}`).equals(readFileSync(`${x.d}/${x.cat.incipits}`))).toBe(true)
  })
})
