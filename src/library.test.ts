import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { creditBlock, creditLine, type LibraryEntry } from './credits'
import { fromMusicXml, xmlText } from './musicxml'
import { fromMidi } from './song'

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
      expect(creditLine(m)).toContain(m.composer)
      expect(creditBlock(m)).toContain(m.licenceUrl)
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
