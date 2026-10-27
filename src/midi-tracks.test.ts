import { Midi } from '@tonejs/midi'
import { describe, expect, it } from 'vitest'
import { autoSelect, fromMidi, inspectMidi, namedHands } from './midi-tracks'
import { orchestral } from './notation-fixtures'

describe('midi tracks', () => {
  it('reports each track that has notes', () => {
    const r = inspectMidi(orchestral())
    const names = r.tracks.map((t) => t.name)
    expect(names).toEqual(['Flute', 'Harp', 'Strings A', 'Strings B', 'Strings C', 'Drums'])
    expect(r.tracks[0]).toMatchObject({ notes: 64, lo: 72, hi: 76 })
    expect(r.tracks[5].percussion).toBe(true)
    expect(r.tracks[0].mono).toBeGreaterThan(0.95)
    expect(r.tracks[2].mono).toBeLessThan(0.2)
  })

  it('reads a file of 30,000 notes at once (the mono count was a filter per onset: 28 s)', () => {
    const m = new Midi()
    const t = m.addTrack()
    for (let i = 0; i < 30000; i++) t.addNote({ midi: 60 + (i % 12), time: i * 0.05, duration: 0.04 })
    const t0 = performance.now()
    const r = inspectMidi(m.toArray().buffer as ArrayBuffer)
    expect(r.tracks[0]).toMatchObject({ notes: 30000, lo: 60, hi: 71, mono: 1 })
    expect(performance.now() - t0).toBeLessThan(5000)
  })

  it('keeps every track of a file that is already readable', () => {
    const m = new Midi()
    const t = m.addTrack()
    for (let i = 0; i < 16; i++) t.addNote({ midi: 60 + (i % 4), time: i * 0.5, duration: 0.4 })
    const r = inspectMidi(m.toArray().buffer as ArrayBuffer)
    expect(autoSelect(r)).toEqual({ tracks: [r.tracks[0].index], hands: {} })
  })

  it('picks a lead line and an accompaniment from a crowded orchestral file and skips drums and pads', () => {
    const r = inspectMidi(orchestral())
    const sel = autoSelect(r)
    const names = sel.tracks.map((i) => r.tracks.find((t) => t.index === i)!.name)
    expect(names).toEqual(['Flute', 'Harp'])
    expect(sel.hands[r.tracks[0].index]).toBe('R')
  })

  it('imports only the selected tracks and honours a stated hand', () => {
    const buf = orchestral()
    const r = inspectMidi(buf)
    const all = fromMidi(buf, 't', 'id', 60)
    const sel = autoSelect(r)
    const song = fromMidi(buf, 't', 'id', 60, sel)
    expect(song.notes.length).toBe(64 + 256)
    expect(song.notes.length).toBeLessThan(all.notes.length)
    const flute = song.notes.filter((n) => n.p >= 72 && n.p <= 76 && n.d > 0.3)
    expect(flute.every((n) => n.h === 'R')).toBe(true)
  })
})

describe('piano scores keep both hands', () => {
  it('keeps a dense two-track piano file whole', () => {
    const m = new Midi()
    for (const [name, base] of [['rh', 72], ['lh', 48]] as const) {
      const t = m.addTrack()
      t.name = name
      t.instrument.number = 0
      for (let i = 0; i < 400; i++) t.addNote({ midi: base + (i % 7), time: i * 0.125, duration: 0.1 })
    }
    const r = inspectMidi(m.toArray().buffer as ArrayBuffer)
    expect(autoSelect(r).tracks).toEqual(r.tracks.map((t) => t.index))
  })
})

describe('a tempo given by the caller', () => {
  const file = (bpms?: [number, number][]) => {
    const m = new Midi()
    bpms?.forEach(([ticks, bpm], i) => (i ? m.header.tempos.push({ ticks, bpm } as never) : m.header.setTempo(bpm)))
    m.header.update()
    const t = m.addTrack()
    for (let i = 0; i < 16; i++) t.addNote({ midi: 60 + (i % 4), ticks: i * 480, durationTicks: 400 })
    return m.toArray().buffer as ArrayBuffer
  }
  it('plays a file with no tempo event at that bpm and says it was a guess', () => {
    const plain = fromMidi(file(), 't', 'id') // 120
    const s = fromMidi(file(), 't', 'id', 60, undefined, { bpm: 60, guess: true })
    expect(s.end / plain.end).toBeCloseTo(2, 1)
    expect(s.spb).toBeCloseTo(1, 2)
    expect(s.flags).toEqual(['tempo-estimated'])
    expect(fromMidi(file(), 't', 'id', 60, undefined, { bpm: 60, guess: false }).flags).toBeUndefined() // a number the score gave: no flag
  })
  it('scales a tempo map as a whole, so a change keeps its proportion', () => {
    const was = fromMidi(file([[0, 60], [4 * 480, 120]]), 't', 'id')
    const s = fromMidi(file([[0, 60], [4 * 480, 120]]), 't', 'id', 60, undefined, { bpm: 90, guess: true })
    expect(s.end / was.end).toBeCloseTo(60 / 90, 2)
    expect(s.bars[1].t1 - s.bars[1].t0).toBeCloseTo((was.bars[1].t1 - was.bars[1].t0) * (60 / 90), 2)
  })
})

describe('hands from track names', () => {
  const file = (names: string[]) => {
    const m = new Midi()
    names.forEach((name, k) => {
      const t = m.addTrack()
      t.name = name
      for (let i = 0; i < 16; i++) t.addNote({ midi: (k ? 50 : 70) + (i % 5) + k, time: i * 0.5, duration: 0.4 })
    })
    return m.toArray().buffer as ArrayBuffer
  }
  it('pins a three-track piano file instead of splitting it at middle C', () => {
    const buf = file(['Piano RH', 'lh 1', 'Unterstimme'])
    const r = inspectMidi(buf)
    const sel = autoSelect(r)
    expect(r.tracks.map((t) => sel.hands[t.index])).toEqual(['R', 'L', 'L'])
    expect(fromMidi(buf, 't', 'id', 60, sel).flags).toEqual(['no-tempo']) // the test file has no tempo event
    expect(fromMidi(buf, 't', 'id', 60, { tracks: sel.tracks, hands: {} }).flags).toContain('three-track-midi')
  })
  it('pins nothing when a name says nothing or both hands are not there', () => {
    expect(autoSelect(inspectMidi(file(['Piano', 'rh']))).hands).toEqual({})
    expect(autoSelect(inspectMidi(file(['right', 'treble']))).hands).toEqual({})
    expect(namedHands([{ name: 'Bassoon' }, { name: 'Upright' }] as never)).toEqual({})
  })
})
