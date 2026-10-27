// The big-library pipeline (scripts/library/): every gate fires on a fixture, licences are refused, and a rerun is byte-identical.
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { movements, refusals, zip } from '../scripts/library/lib.mjs'
import { analyse, GATES, judge, run, type Input } from '../scripts/library/pipeline'
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
