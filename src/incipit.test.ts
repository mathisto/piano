import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { analyse, type Input } from '../scripts/library/pipeline'
import { decode, encode, incipit } from './incipit'
import type { Note, Song } from './song'

// The sidecar's form of a piece's opening bars (src/incipit.ts) gives back every field the engraver reads.
const same = (a: Note, b: Note) => {
  for (const k of ['bar', 'p', 'h', 'tuplet', 'tieNext', 'grace', 'acc', 'art', 'slur', 'qrest', 'id'] as const)
  expect(b[k], k).toEqual(a[k])
  expect(b.part ?? 0).toBe(a.part ?? 0)
  expect(b.voice ?? 1).toBe(a.voice ?? 1) // the layout reads an absent voice as the first
  expect(b.qb).toBeCloseTo(a.qb!, 9)
  expect(b.qd).toBeCloseTo(a.qd!, 9)
}
const back = (s: Song) => decode(JSON.parse(JSON.stringify(encode(s))), { id: s.id, title: s.title, fifths: s.fifths, lo: s.lo, hi: s.hi, mode: s.stated?.mode, meter: s.stated?.meter ? '4/4' : undefined })

describe('the incipit sidecar', () => {
  const n = (o: Partial<Note>): Note => ({ id: 0, t: 0, d: 0.5, p: 60, v: 0.6, h: 'R', bar: 0, beats: 1, qb: 0, qd: 1, ...o })
  const bar = (i: number, t0: number, o = {}) => ({ i, t0, t1: t0 + 2, n: 4, den: 4, ...o })

  it('round-trips ties, triplets, a quintuplet, a second voice, graces, accidentals, articulation, a pickup and a key change', () => {
    const notes = [
      n({ qb: 0, qd: 0.5, bar: 0, p: 71, h: 'L', acc: 0 }), // a pickup bar (0.5 of 1 quarter)
      n({ qb: 0, qd: 1, bar: 1, p: 64, voice: 2, tieNext: true, part: 1 }),
      n({ qb: 0, qd: 2 / 3, bar: 1, p: 67, tuplet: { num: 3, den: 2 }, art: 'stac' }),
      n({ qb: 2 / 3, qd: 2 / 3, bar: 1, p: 68, tuplet: { num: 3, den: 2 }, acc: 1, slur: true }),
      n({ qb: 1.2, qd: 0.2, bar: 1, p: 69, tuplet: { num: 5, den: 4 }, acc: -1, art: 'ten' }),
      n({ qb: 2, qd: 0.125, bar: 1, p: 70, grace: true, t: 3.97 }),
      n({ qb: 2, qd: 1, bar: 1, p: 72, art: 'acc', qrest: 1 }),
      n({ qb: 0, qd: 4, bar: 3, p: 50 }), // past the bars a cover keeps
    ].map((x, i) => ({ ...x, id: i }))
    const song: Song = { id: 's', title: 't', notes, bars: [bar(0, 0, { t1: 0.5, ql: 1 }), bar(1, 0.5), bar(2, 2.5), bar(3, 4.5)], end: 6.5, fifths: -2, lo: 50, hi: 72, spb: 0.5, keys: [{ bar: 0, fifths: -2 }, { bar: 2, fifths: 3 }, { bar: 3, fifths: 0 }] }
    const want = incipit(song)
    const got = back(song)
    expect(got.notes).toHaveLength(want.notes.length)
    want.notes.forEach((x, i) => same(x, got.notes[i]))
    expect(got.notes.find((x) => x.grace)!.t).toBeCloseTo(3.97, 3)
    expect(got.bars.map((b) => [b.n, b.den, b.ql])).toEqual(want.bars.map((b) => [b.n, b.den, b.ql]))
    expect(got.bars.every((b, i) => b.t0 < (got.bars[i + 1]?.t0 ?? Infinity))).toBe(true) // laid in order
    expect(got.keys).toEqual([{ bar: 0, fifths: -2 }, { bar: 2, fifths: 3 }]) // the key change after the kept bars is left out
    expect(got.spb).toBeCloseTo(0.5, 5)
  })

  it('carries the stated mode and metre from the catalogue, and nothing it does not state', () => {
    const song: Song = { id: 's', title: 't', notes: [n({})], bars: [bar(0, 0)], end: 2, fifths: 0, lo: 60, hi: 60, spb: 0.5 }
    expect(decode(encode(song), { id: 's', title: 't', fifths: 0, lo: 60, hi: 60 }).stated).toBeUndefined()
    expect(decode(encode(song), { id: 's', title: 't', fifths: 0, lo: 60, hi: 60, mode: 'minor', meter: '4/4' }).stated).toEqual({ mode: 'minor', meter: true })
  })

  it('a note with no written position cannot be encoded (the pipeline then ships no incipit for it)', () => {
    expect(() => encode({ id: 's', title: 't', notes: [n({ qb: undefined })], bars: [bar(0, 0)], end: 2, fifths: 0, lo: 60, hi: 60, spb: 0.5 })).toThrow(/written/)
  })

  it('the bundled pieces (MIDI and MusicXML, tuplets and ties among them) give back their first three bars', async () => {
    const DIR = new URL('../public/library/', import.meta.url)
    const manifest = JSON.parse(readFileSync(new URL('manifest.json', DIR), 'utf8')) as Record<string, string>[]
    let seen = 0
    for (const m of manifest) {
      const a = await analyse({ id: m.id, title: m.title, format: m.format, bytes: new Uint8Array(readFileSync(new URL(m.file, DIR))) } as Input)
      if (!a.song) continue
      const want = incipit(a.song)
      const got = back(a.song)
      expect(got.notes, m.id).toHaveLength(want.notes.length)
      want.notes.forEach((x, i) => same(x, got.notes[i]))
      seen += want.notes.length
    }
    expect(seen).toBeGreaterThan(1000)
  }, 60_000)
})
