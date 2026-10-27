import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { choices, chooserHtml, partsOf, voiceOf, yourPart } from './accomp'
import * as audio from './audio'
import { Game } from './game'
import { fromMusicXml, xmlText } from './musicxml'
import { Midi } from '@tonejs/midi'
import { fromMidi } from './midi-tracks'
import { fromSpec, type Song } from './song'

vi.mock('./audio', () => ({ preload: vi.fn(), noteOn: vi.fn(), noteOff: vi.fn(), click: vi.fn(), unlock: vi.fn() }))

// bundled OpenScore songs with the voice folded into the piano's right hand: in lc6917116 the piano doubles every sung note, in lc4976849 it does not
async function lied(id = 'lc6917116'): Promise<Song> {
  const b = readFileSync(`public/library/lieder-${id}.mxl`)
  return fromMusicXml(await xmlText(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer), id, `lieder-${id}`)
}
const duo = () => fromSpec({ id: 'd', title: 'd', bpm: 120, fifths: 0, rh: 'C5:1 D5:1 E5:1 F5:1 G5:4', lh: 'C3:2 G3:2 C3:4' })
const esc = (s: string) => s

/** Runs a Perform pass to the end in one frame; how many notes the app played and how many were judged. */
function perform(song: Song, pick?: { hands: Game['hands']; parts: number[] }) {
  const g = new Game()
  g.load(song, 'perform')
  if (pick) g.accomp(pick.hands, pick.parts)
  vi.mocked(audio.noteOn).mockClear()
  g.toggle()
  let total = -1
  g.on((e) => e.type === 'done' && (total = e.result.total))
  g.frame(performance.now() + (song.end + 10) * 1000)
  g.frame(performance.now() + (song.end + 12) * 1000)
  return { app: vi.mocked(audio.noteOn).mock.calls.length, total, g }
}

describe('accompaniment', () => {
  const BOTH = { R: 'play', L: 'play' } as const

  it('keeps the folded voice identifiable while it stays in the right hand', async () => {
    const s = await lied()
    expect(s.parts).toEqual(['Voice', 'Piano'])
    expect(partsOf(s)).toEqual([0, 1])
    const voice = s.notes.filter((n) => n.part === 0)
    expect(voice).toHaveLength(168)
    expect(voice.every((n) => n.h === 'R' && n.also === 1)).toBe(true) // the piano doubles the tune: both parts wrote these
  })

  it('the voice of a doubled song: the app plays the piano, at the tempo, and judges only the tune', async () => {
    const s = await lied()
    expect(choices(s).map((c) => [c.id, c.label, c.parts])).toEqual([['all', 'Everything', []], ['part0', 'Voice', [1]]]) // the piano alone would leave the app nothing
    const { app, total } = perform(s, { hands: BOTH, parts: [1] })
    expect([app, total]).toEqual([s.notes.length - 168, 168])
  })

  it('the piano part: the app sings the melody, only the notes the piano does not double', async () => {
    const s = await lied('lc4976849')
    expect(choices(s).map((c) => c.label)).toEqual(['Everything', 'Voice', 'Piano'])
    const solo = s.notes.filter((n) => n.part === 0 && n.also === undefined).length
    expect(solo).toBeGreaterThan(20)
    const { app, total } = perform(s, { hands: BOTH, parts: [0] })
    expect([app, total]).toEqual([solo, s.notes.length - solo])
    const html = chooserHtml(s, BOTH, new Set([0]), esc)
    expect(html).toContain('value="part1" checked')
    expect(html).toContain('The app plays the voice part. Only your part is judged.')
    expect(chooserHtml(s, BOTH, new Set(), esc)).not.toContain('hint')
    expect(yourPart(s, BOTH, new Set())).toBeNull()
    expect(yourPart(s, BOTH, new Set([0]))).toEqual({ you: 'the piano part', app: 'the voice part' })
  })

  it('the app sings a voice-named part on strings and plays the rest on the setting\'s instrument', async () => {
    const s = await lied('lc4976849')
    const as = () => vi.mocked(audio.noteOn).mock.calls.map((c) => c[3])
    expect(voiceOf(s, s.notes.find((n) => n.part === 0)!)).toBe('strings')
    expect(voiceOf(s, s.notes.find((n) => n.part === 1)!)).toBeUndefined()
    perform(s, { hands: BOTH, parts: [0] }) // the app plays the voice
    expect(as().length).toBeGreaterThan(20)
    expect(as().every((a) => a === 'strings')).toBe(true)
    expect(audio.preload).toHaveBeenCalledWith('strings')
    perform(s, { hands: BOTH, parts: [1] }) // the app plays the piano
    expect(as().every((a) => a === undefined)).toBe(true)
    const named = (name: string) => voiceOf({ parts: [name] } as Song, { part: 0 } as never)
    expect(['Voice', 'Singstimme', 'Gesang', 'Canto', 'Soprano', 'Alto', 'Tenor', 'Bass', 'Voice 1'].map(named)).toEqual(Array(9).fill('strings'))
    expect(['Piano', 'Klavier', 'Altos saxophone', 'Violin'].map(named)).toEqual(Array(4).fill(undefined))
    expect(voiceOf(duo(), duo().notes[0])).toBeUndefined() // a two-hand piece has no parts
  })

  it('a one-hand piece played whole is a run of the piece, not your part of it', () => {
    const solo = fromSpec({ id: 's', title: 's', bpm: 120, fifths: 0, rh: 'C5:1 D5:1 E5:2', lh: 'R:4' })
    expect(yourPart(solo, BOTH, new Set())).toBeNull()
    expect(yourPart(duo(), { R: 'play', L: 'listen' }, new Set())).toEqual({ you: 'the right hand', app: 'the left hand' })
  })

  it('a two-hand piece: Right hand in one tap, the left is played for you; Perform keeps it, a new song clears it', () => {
    const d = duo()
    const right = choices(d).find((c) => c.id === 'R')!
    expect(choices(d).map((c) => c.label)).toEqual(['Both hands', 'Right hand', 'Left hand'])
    const { app, total, g } = perform(d, right)
    const lh = d.notes.filter((n) => n.h === 'L').length
    expect(app).toBe(lh)
    expect(total).toBe(d.notes.length - lh)
    g.setMode('learn')
    g.setMode('perform')
    expect(g.hands).toEqual({ R: 'play', L: 'listen' })
    g.load(d)
    expect([g.hands, g.parts.size]).toEqual([{ R: 'play', L: 'play' }, 0])
  })

  it('a MIDI file of three tracks: each track is a part, named from the file', () => {
    const m = new Midi()
    ;['Flute', 'Piano RH', 'Piano LH'].forEach((name, k) => {
      const t = m.addTrack()
      t.name = name
      for (let i = 0; i < 8; i++) t.addNote({ midi: [79, 67, 48][k] + (i % 3), time: i * 0.5, duration: 0.4 })
    })
    const s = fromMidi(m.toArray().buffer as ArrayBuffer, 'm', 'm')
    expect(choices(s).map((c) => c.label)).toEqual(['Everything', 'Flute', 'Piano RH', 'Piano LH'])
    expect(perform(s, choices(s)[1]).app).toBe(16)
    expect(choices(fromMidi(m.toArray().buffer as ArrayBuffer, 'm', 'm', 60, { tracks: [1, 2], hands: {} })).map((c) => c.label)).toEqual(['Both hands', 'Right hand', 'Left hand']) // two tracks are hands
  })

  it('nothing to choose for one hand alone', () => {
    expect(choices(fromSpec({ id: 'r', title: 'r', bpm: 100, fifths: 0, rh: 'C4:1 D4:1', lh: 'R:2' }))).toEqual([])
  })
})
