import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import * as audio from './audio'
import { Game } from './game'
import { chordsOf } from './lead'
import { layout, analyze, windowFor } from './layout'
import { fromMusicXml, xmlText } from './musicxml'
import { settings } from './settings'
import { canLead, simplify } from './simplify'
import { build, type Bar, type Raw } from './song'

vi.mock('./audio', () => ({ preload: vi.fn(), noteOn: vi.fn(), noteOff: vi.fn(), click: vi.fn(), unlock: vi.fn() }))

// 120 bpm, 4/4: a half bar is 1 s. One entry per half bar: the pitches that sound all through it.
const piece = (halves: number[][], fifths = 0) => {
  const raw: Raw[] = halves.flatMap((ps, i) => ps.map((p) => ({ t: i, d: 0.95, p, v: 0.7, track: 0, h: p < 55 ? ('L' as const) : ('R' as const) })))
  const bars: Bar[] = Array.from({ length: Math.ceil(halves.length / 2) }, (_, i) => ({ i, t0: i * 2, t1: i * 2 + 2, n: 4, den: 4 }))
  return build('t', 't', raw, bars, fifths)
}
const names = (halves: number[][], fifths = 0) => chordsOf(piece(halves, fifths)).map((c) => c.name)

describe('chordsOf', () => {
  it('names triads, sevenths and a diminished chord by their root', () => {
    expect(names([[48, 52, 55], [45, 48, 52], [43, 47, 50, 53], [48, 52, 55, 59], [45, 48, 52, 55], [54, 57, 60]], 0)).toEqual(['C', 'Am', 'G7', 'Cmaj7', 'Am7', 'F♯dim'])
  })
  it('writes a slash bass for an inversion and not for a bass that is outside the chord', () => {
    expect(names([[47, 55, 62], [40, 60, 64, 67], [49, 60, 64, 67]])).toEqual(['G/B', 'C/E', 'C']) // the last bass, C#, is a passing note under C
  })
  it('spells flats in a flat key', () => {
    expect(names([[46, 50, 53], [51, 55, 58]], -2)).toEqual(['B♭', 'E♭'])
  })
  it('a passing note does not turn a triad into a seventh', () => {
    const raw: Raw[] = [48, 52, 55].map((p) => ({ t: 0, d: 1.9, p, v: 0.7, track: 0, h: 'L' as const }))
    raw.push({ t: 1, d: 0.2, p: 71, v: 0.7, track: 0, h: 'R' })
    expect(chordsOf(build('p', 'p', raw, [{ i: 0, t0: 0, t1: 2, n: 4, den: 4 }], 0)).map((c) => c.name)).toEqual(['C', 'C'])
  })
  it('gives the app a block chord with its bass below', () => {
    expect(chordsOf(piece([[43, 47, 50], [48, 52, 55]]))[0]).toMatchObject({ t: 0, d: 1, bar: 0, keys: [43, 55, 59, 50] }) // G: bass G2, then G3 B3 D3
  })
})

describe('Lead sheet level', () => {
  const s = piece([[48, 52, 55, 72], [43, 47, 50, 74], [48, 52, 55, 76], [43, 47, 50, 72]])
  it('keeps the top line and adds the chords; the left hand goes', () => {
    const l = simplify(s, 4)
    expect(l.notes.map((n) => n.p)).toEqual([72, 74, 76, 72])
    expect(l.chords?.map((c) => c.name)).toEqual(['C', 'G', 'C', 'G'])
    expect(simplify(s, 3).chords).toBeUndefined()
    expect(canLead(s)).toBe(true)
    expect(canLead(simplify(s, 3))).toBe(false)
  })
  it('draws a symbol where the chord changes, above the staff', () => {
    const song = simplify(piece([[48, 52, 55, 72], [48, 52, 55, 74], [43, 47, 50, 72], [43, 47, 50, 71]]), 4)
    const an = analyze(song)
    const cfg = { view: 'sheet' as const, px: { w: 900, h: 400 }, zoom: 1 }
    const L = layout(an, windowFor(an, 0, cfg), cfg)
    expect(L.syms.map((x) => x.name)).toEqual(['C', 'G'])
    expect(L.syms.every((x) => x.y < L.base[L.clefs[0]] - 4 * 10)).toBe(true) // above the staff
  })
  it('the app plays the chords on the half bars only when asked', () => {
    const song = simplify(piece([[48, 52, 55, 72], [43, 47, 50, 74]]), 4)
    const g = new Game()
    g.load(song, 'perform')
    const run = (comp: boolean) => {
      settings.comp = comp
      g.load(song, 'perform')
      vi.mocked(audio.noteOn).mockClear()
      g.toggle()
      g.frame(performance.now() + 5000)
      return vi.mocked(audio.noteOn).mock.calls.map((c) => c[0])
    }
    expect(run(false)).toEqual([])
    expect(run(true)).toEqual([36, 48, 52, 55, 43, 55, 59, 50])
  })
})

describe('on a Lied with a voice part', () => {
  it('the melody is the voice line, and the chords come from the piano', async () => {
    const b = readFileSync('public/library/lieder-lc4976849.mxl')
    const full = await fromMusicXml(await xmlText(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer), 'x', 'lieder-lc4976849')
    const l = simplify(full, 4)
    const sung = full.notes.filter((n) => n.part === 0 || n.also === 0).length
    expect(sung).toBeGreaterThan(20)
    expect(l.notes.length).toBe(sung)
    expect(l.notes.every((n) => n.part === undefined)).toBe(true) // one line: no 'You play' parts to choose
    expect(l.chords!.length).toBeGreaterThan(10)
  })
})
