import { Midi } from '@tonejs/midi'
import { describe, expect, it } from 'vitest'
import { autoSelect, inspectMidi } from './midi-tracks'
import { fromMidi } from './song'

/** A small orchestral-style file: a melody, a harp arpeggio, a held pad, and drums. */
function orchestral(): ArrayBuffer {
  const m = new Midi()
  m.header.setTempo(120)
  const add = (name: string, program: number, channel: number, f: (t: ReturnType<Midi['addTrack']>) => void) => {
    const t = m.addTrack()
    t.name = name
    t.channel = channel
    t.instrument.number = program
    f(t)
  }
  add('Flute', 73, 0, (t) => {
    for (let i = 0; i < 64; i++) t.addNote({ midi: 72 + (i % 5), time: i * 0.5, duration: 0.45, velocity: 0.7 })
  })
  add('Harp', 46, 1, (t) => {
    for (let i = 0; i < 256; i++) t.addNote({ midi: 48 + [0, 4, 7, 12][i % 4] + (i % 8 > 3 ? 12 : 0), time: i * 0.125, duration: 0.12, velocity: 0.5 })
  })
  for (const [k, name] of ['Strings A', 'Strings B', 'Strings C'].entries())
    add(name, 48, 2 + k, (t) => {
      for (let i = 0; i < 16; i++) for (const p of [40, 47, 52, 55, 59]) t.addNote({ midi: p + k, time: i * 2, duration: 2, velocity: 0.6 })
    })
  add('Drums', 0, 9, (t) => {
    for (let i = 0; i < 64; i++) t.addNote({ midi: 36, time: i * 0.5, duration: 0.1, velocity: 0.8 })
  })
  return m.toArray().buffer as ArrayBuffer
}

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
