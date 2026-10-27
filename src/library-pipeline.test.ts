// The big-library pipeline (scripts/library/): every gate fires on a fixture, licences are refused, and a rerun is byte-identical.
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { movements, openscoreMeta, PIANO, PUBLISHED_BY, refusals, scoreParts, unzip, zip } from '../scripts/library/lib.mjs'
import { analyse, GATES, judge, merge, reach, run, type Input } from '../scripts/library/pipeline'
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
    'dc-ds': (s) => [s, 'Allegro D.C. al Fine'],
    repeats: (s) => [s, '\\repeat volta 2 { c4 }'],
    tuplets: (s) => [{ ...s, notes: s.notes.map((n, i) => (i === 3 ? { ...n, tuplet: { num: 5, den: 4 } } : n)) }],
  }
  for (const [gate, make] of Object.entries(cases))
    it(`${gate} fires on its fixture`, () => {
      const [s, marks, tempo] = make(base())
      expect(all(judge(s, marks ?? '', tempo ?? true))).toContain(gate)
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
    for (const [id, why] of Object.entries(PUBLISHED_BY)) expect(Math.min(...(why as string).match(/\b1[5-9]\d\d\b/g)!.map(Number)), id).toBeLessThanOrEqual(1930)
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
