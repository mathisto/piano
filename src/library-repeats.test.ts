import { Midi } from '@tonejs/midi'
import { describe, expect, it } from 'vitest'
import { analyse, type Input } from '../scripts/library/pipeline'
import { encode, unfold, withRepeats } from '../scripts/library/repeats'
import { fromMidi } from './song'

// A LilyPond-like MIDI: 4/4, G major, one track; notes as [quarter, quarters, pitch]
const midiOf = (notes: number[][]) => {
  const m = new Midi()
  const q = m.header.ppq
  m.header.tempos.push({ ticks: 0, bpm: 100 })
  m.header.timeSignatures.push({ ticks: 0, timeSignature: [4, 4] })
  m.header.keySignatures.push({ ticks: 0, key: 'G', scale: 'major' })
  const t = m.addTrack()
  for (const [at, d, p] of notes) t.addNote({ midi: p, ticks: at * q, durationTicks: d * q, velocity: 0.8 })
  return encode(m)
}
const ab = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer
const pitches = (u: Uint8Array) => new Midi(ab(u)).tracks[0].notes.map((n) => n.midi)
const bars = (u: Uint8Array) => fromMidi(ab(u), '', '').bars.length
const score = (music: string) => `\\version "2.18.2"\nmusic = \\relative c' { \\time 4/4 ${music} }\n\\score { \\new Staff \\music \\layout { } \\midi { } }\n`

const quarters = (ps: number[], from = 0) => ps.map((p, i) => [from + i, 1, p])
const simple = score('\\repeat volta 2 { c4 d e f | g a b c } | c1')
const simpleMidi = midiOf([...quarters([60, 62, 64, 65, 67, 69, 71, 72]), [8, 4, 72]])
const volta = score('\\repeat volta 2 { c4 d e f } \\alternative { { g1 } { a1 } } c1')
const voltaMidi = midiOf([...quarters([60, 62, 64, 65]), [4, 4, 67], [8, 4, 69], [12, 4, 72]])

describe('unfolding LilyPond volta repeats in the MIDI (scripts/library/repeats.ts)', () => {
  it('plays a simple repeat twice: the repeated bars appear twice, later notes move on', () => {
    const u = unfold(simpleMidi, simple)
    if ('why' in u) throw new Error(u.why)
    expect(pitches(u.bytes)).toEqual([60, 62, 64, 65, 67, 69, 71, 72, 60, 62, 64, 65, 67, 69, 71, 72, 72])
    expect(bars(u.bytes) - bars(simpleMidi)).toBe(2)
    const m = new Midi(ab(u.bytes))
    expect(m.header.keySignatures.map((k) => k.key)).toEqual(['G'])
    expect(m.header.tempos.map((t) => Math.round(t.bpm))).toEqual([100])
  })

  it('takes the first ending on the first pass and the second on the second', () => {
    const u = unfold(voltaMidi, volta)
    if ('why' in u) throw new Error(u.why)
    expect(pitches(u.bytes)).toEqual([60, 62, 64, 65, 67, 60, 62, 64, 65, 69, 72])
    expect(bars(u.bytes) - bars(voltaMidi)).toBe(1)
  })

  it('leaves nested repeats, D.C. and a reading that does not fit the MIDI alone', () => {
    const nested = score('\\repeat volta 2 { c4 d e f \\repeat volta 2 { g a b c } } c1')
    expect(unfold(simpleMidi, nested)).toEqual({ why: 'nested repeats' })
    expect(unfold(simpleMidi, simple.replace('c1', 'c1^"D.C. al Fine"'))).toMatchObject({ why: expect.stringMatching(/D\.C\./) })
    expect(unfold(simpleMidi, volta)).toMatchObject({ why: expect.stringMatching(/misses/) })
    const e = { bytes: simpleMidi, ly: nested }
    expect(withRepeats(e)).toBe(e)
  })

  it('an unfolded input is no longer flagged; one that cannot be unfolded still is', async () => {
    const input = (bytes: Uint8Array, ly: string): Input => ({ id: 'mutopia-1', title: 't', composer: 'X (1700–1750)', source: 'mutopia', sourceUrl: '', licenceEvidence: '', licence: 'Public Domain', licenceUrl: '', edition: '', format: 'midi', bytes, upstreamSha: '', ly })
    expect((await analyse(withRepeats(input(simpleMidi, simple)))).flags).not.toContain('repeats')
    expect((await analyse(withRepeats(input(simpleMidi, simple.replace('c1', 'c1^"D.C."'))))).flags).toContain('repeats')
  })
})
