import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { builtin } from './catalog'
import { creditBlock, creditLine, type LibraryEntry } from './credits'
import { scoreFlags } from './flags'
import { autoSelect, fromMidi, inspectMidi } from './midi-tracks'
import { fromMusicXml, xmlText } from './musicxml'

const DIR = new URL('../public/library/', import.meta.url)
const manifest: LibraryEntry[] = JSON.parse(readFileSync(new URL('manifest.json', DIR), 'utf8'))
const sources: { allow: string[]; pieces: { id: string; licence: string; nc?: boolean }[] } = JSON.parse(readFileSync(new URL('../../scripts/library-sources.json', DIR), 'utf8'))
const NC = /-NC-|-NC$/
const bytes = (f: string) => readFileSync(new URL(f, DIR))
const ab = (b: Buffer) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer

describe('library manifest', () => {
  it('has pieces in the three levels, in difficulty order, with unique ids', () => {
    expect(manifest.length).toBeGreaterThanOrEqual(30)
    expect(new Set(manifest.map((m) => m.id)).size).toBe(manifest.length)
    const rank = manifest.map((m) => ['Beginner', 'Elementary', 'Intermediate'].indexOf(m.level))
    expect(rank.every((r) => r >= 0)).toBe(true)
    expect(rank).toEqual([...rank].sort((a, b) => a - b))
  })

  it('carries every credit field', () => {
    for (const m of manifest) {
      for (const k of ['id', 'title', 'composer', 'collection', 'licence', 'licenceUrl', 'licenceEvidence', 'sourceUrl', 'sourceEdition', 'file', 'sha256'] as const) {
        expect(typeof m[k] === 'string' && m[k].length > 0, `${m.id}.${k}`).toBe(true)
      }
      expect(m.composer, `${m.id} composer needs dates`).toMatch(/\(\d{4}–\d{4}\)/)
      expect(m.licenceUrl).toMatch(/^https:\/\/creativecommons\.org\//)
      expect(m.sourceUrl).toMatch(/^https:\/\//)
      expect(m.licenceEvidence).toMatch(/^https:\/\//)
      expect(m.sha256).toMatch(/^[0-9a-f]{64}$/)
      expect(m.file.endsWith(m.format === 'midi' ? '.mid' : '.mxl')).toBe(true)
      const c = builtin([m])
      expect(creditLine(c, c.pieces[0])).toContain(m.composer)
      expect(creditBlock(c, c.pieces[0])).toContain(m.licenceUrl)
      // Mutopia pieces name the person who typeset them
      if (m.collection === 'Mutopia Project') expect(m.typesetter, `${m.id} typesetter`).toBeTruthy()
    }
  })

  it('only holds allowed licences; non-commercial ones need an explicit flag', () => {
    for (const m of manifest) {
      const src = sources.pieces.find((p) => p.id === m.id)
      expect(src, `${m.id} is in library-sources.json`).toBeDefined()
      expect(m.licence).toBe(src!.licence)
      if (NC.test(m.licence)) expect(m.nc, `${m.id} is non-commercial`).toBe(true)
      else {
        expect(m.nc).toBeUndefined()
        expect(sources.allow, m.id).toContain(m.licence)
      }
    }
    expect(sources.allow.some((l) => NC.test(l))).toBe(false)
  })

  it('matches the files on disk: no strays, right size, right sha256, listed in LICENSES.md', () => {
    const onDisk = readdirSync(DIR).filter((f) => f !== 'manifest.json' && f !== 'LICENSES.md')
    expect(onDisk.sort()).toEqual(manifest.map((m) => m.file).sort())
    const lic = readFileSync(new URL('LICENSES.md', DIR), 'utf8')
    for (const m of manifest) {
      expect(existsSync(new URL(m.file, DIR))).toBe(true)
      const b = bytes(m.file)
      expect(b.length, `${m.id} size`).toBe(m.bytes)
      expect(createHash('sha256').update(b).digest('hex'), `${m.id} sha256`).toBe(m.sha256)
      expect(lic, `${m.file} in LICENSES.md`).toContain(m.file)
    }
    expect(manifest.reduce((s, m) => s + m.bytes, 0)).toBeLessThan(1_500_000)
  })

  it('parses every file with the real importers', async () => {
    for (const m of manifest) {
      const b = ab(bytes(m.file))
      const song = m.format === 'midi' ? fromMidi(b, m.title, m.id) : fromMusicXml(await xmlText(b), m.title, m.id)
      expect(song.notes.length, `${m.id} notes`).toBeGreaterThan(0)
      expect(song.bars.length, `${m.id} bars`).toBeGreaterThan(0)
      expect(song.bars.length, `${m.id} bars`).toBeLessThanOrEqual(5000)
    }
  })
})

describe('key signatures of MIDI pieces', () => {
  it('a minor piece takes its signature, not three flats fewer: C minor has three flats, A minor none', () => {
    expect(fromMidi(ab(bytes('mutopia-1613.mid')), 'x', 'x').fifths).toBe(-3)
    expect(fromMidi(ab(bytes('mutopia-1612.mid')), 'x', 'x').fifths).toBe(0)
  })
})

describe('songs with the voice folded into the right hand', () => {
  it('stay inside one hand: the middle of the chords spans an octave and a second at most, and a doubled note is one note', async () => {
    const folded = manifest.filter((m) => m.title.includes('melody and piano'))
    expect(folded.length).toBeGreaterThanOrEqual(3)
    for (const m of folded) {
      const song = fromMusicXml(await xmlText(ab(bytes(m.file))), m.title, m.id)
      const at = new Map<string, number[]>()
      for (const n of song.notes.filter((n) => n.h === 'R')) at.set(n.t.toFixed(3), [...(at.get(n.t.toFixed(3)) ?? []), n.p])
      const spans = [...at.values()].map((ps) => Math.max(...ps) - Math.min(...ps)).sort((a, b) => a - b)
      expect(spans[Math.floor(spans.length * 0.95)], `${m.id} right-hand reach`).toBeLessThanOrEqual(14)
      for (const ps of at.values()) expect(new Set(ps).size, `${m.id} duplicate note`).toBe(ps.length)
    }
  })
})

describe('importer fixes on real library files', () => {
  const midi = (f: string) => fromMidi(ab(bytes(f)), f, f)
  it('takes every key change a MIDI file states, once each, and C before a late first key', () => {
    expect(midi('mutopia-471.mid').keys).toEqual([{ bar: 0, fifths: -5 }, { bar: 27, fifths: 4 }, { bar: 75, fifths: -5 }]) // D flat, C sharp minor, D flat
    expect(midi('mutopia-463.mid').keys).toEqual([{ bar: 0, fifths: 1 }, { bar: 28, fifths: -2 }, { bar: 67, fifths: 1 }, { bar: 91, fifths: -1 }, { bar: 127, fifths: 2 }, { bar: 195, fifths: 1 }])
    const czerny = midi('mutopia-2146.mid')
    expect(czerny.fifths).toBe(0) // its first key event is C minor at bar 17; bars 1 to 16 have no flat in them
    expect(czerny.notes.filter((n) => n.bar < 16 && [3, 8, 10].includes(n.p % 12))).toHaveLength(0)
    expect(scoreFlags(midi('mutopia-471.mid'))).toEqual(['irregular-tuplet', 'key-changes'])
  })

  it('writes the short notes notation software plays before a beat as grace notes, not chord tones', () => {
    expect(midi('mutopia-2035.mid').notes.filter((n) => n.grace)).toHaveLength(100)
  })

  it('pins the hands of library MIDI files from their track names', () => {
    for (const f of ['mutopia-1806.mid', 'mutopia-2146.mid', 'mutopia-202.mid', 'mutopia-1888.mid']) {
      const r = inspectMidi(ab(bytes(f)))
      expect(Object.values(autoSelect(r).hands), f).toEqual(['R', 'L'])
    }
    expect(autoSelect(inspectMidi(ab(bytes('mutopia-61.mid')))).hands).toEqual({}) // 'one' and 'two' say nothing
  })

  it('ends Das Wandern at its Fine after the repeat, and flags its missing tempo', async () => {
    const s = fromMusicXml(await xmlText(ab(bytes('lieder-lc5004731.mxl'))), 'x', 'x')
    expect(s.bars).toHaveLength(24) // bars 1 to 20, then the introduction again to the Fine
    expect(scoreFlags(s)).toEqual(['no-tempo'])
  })
})
