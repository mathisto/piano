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
