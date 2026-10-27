import { Midi } from '@tonejs/midi'
import { describe, expect, it } from 'vitest'
import { analyse, type Input } from '../scripts/library/pipeline'
import { encode, pickLy, unfold, withRepeats } from '../scripts/library/repeats'
import { fromMidi } from './midi-tracks'

// A LilyPond-like MIDI: 4/4, G major, one track; notes as [quarter, quarters, pitch]
const midiOf = (notes: number[][], sig = [4, 4]) => {
  const m = new Midi()
  const q = m.header.ppq
  m.header.tempos.push({ ticks: 0, bpm: 100 })
  m.header.timeSignatures.push({ ticks: 0, timeSignature: sig })
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

  it('plays D.C. al Fine: back to the start, up to the bar marked Fine', () => {
    const ly = score('c4 d e f | g a b c^"Fine" | d1^"D.C. al Fine"')
    const u = unfold(midiOf([...quarters([60, 62, 64, 65, 67, 69, 71, 72]), [8, 4, 74]]), ly)
    if ('why' in u) throw new Error(u.why)
    expect(pitches(u.bytes)).toEqual([60, 62, 64, 65, 67, 69, 71, 72, 74, 60, 62, 64, 65, 67, 69, 71, 72])
  })

  it('plays D.S. al Coda: to the segno, then from To Coda to the Coda; no repeats on the way back, last ending only', () => {
    const ly = score(`c4 d e f | \\mark \\markup { \\musicglyph #"scripts.segno" } g a b c | \\repeat volta 2 { d e f g^"To Coda" } \\alternative { { a1 } { b1^"D.S. al Coda" } } | \\mark "Coda" c1`)
    const m = midiOf([...quarters([60, 62, 64, 65]), ...quarters([67, 69, 71, 72], 4), ...quarters([74, 76, 77, 79], 8), [12, 4, 81], [16, 4, 83], [20, 4, 84]])
    const u = unfold(m, ly)
    if ('why' in u) throw new Error(u.why)
    // 60..65 | 67..72 | 74..79 (To Coda) a | 74..79 b (D.S.) | back at 67..72, 74..79 once, To Coda -> Coda c
    expect(pitches(u.bytes)).toEqual([60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 74, 76, 77, 79, 83, 67, 69, 71, 72, 74, 76, 77, 79, 84])
  })

  it('moves a D.C. written in a first ending to the last ending, and says why when there is nothing to stop at', () => {
    const ly = score('c4 d e f^"Fine" | \\repeat volta 2 { g a b c } \\alternative { { d1^"D.C. al Fine" } { e1 } }')
    const m = midiOf([...quarters([60, 62, 64, 65]), ...quarters([67, 69, 71, 72], 4), [8, 4, 74], [12, 4, 76]])
    const u = unfold(m, ly)
    if ('why' in u) throw new Error(u.why)
    expect(pitches(u.bytes)).toEqual([60, 62, 64, 65, 67, 69, 71, 72, 74, 67, 69, 71, 72, 76, 60, 62, 64, 65])
    expect(unfold(m, ly.replace('f^"Fine"', 'f'))).toMatchObject({ why: expect.stringMatching(/no Fine/) })
  })

  it('a D.C. that names another movement is not a jump here; the repeats before it still play', () => {
    const ly = score('\\repeat volta 2 { c4 d e f | g a b c } | c1^"Menuet da Capo."')
    const u = unfold(simpleMidi, ly)
    if ('why' in u) throw new Error(u.why)
    expect(pitches(u.bytes)).toEqual([60, 62, 64, 65, 67, 69, 71, 72, 60, 62, 64, 65, 67, 69, 71, 72, 72])
  })

  it('a Coda, Fine or Trio label with no D.C. or D.S. to go to is not a jump', () => {
    const u = unfold(simpleMidi, score('\\repeat volta 2 { c4 d e f | g a b c^"Coda" } | c1^"Fine"'))
    if ('why' in u) throw new Error(u.why)
    expect(pitches(u.bytes).length).toBe(17)
  })

  it('a score that applies \\unfoldRepeats has its repeats in the MIDI already: the same bytes', () => {
    const ly = `\\version "2.18.2"\nmusic = \\relative c' { \\time 4/4 \\repeat volta 2 { c4 d e f | g a b c } | c1 }\n\\score { \\applyMusic #unfold-repeats \\new Staff \\music \\midi { } }\n`
    const m = midiOf([...quarters([60, 62, 64, 65, 67, 69, 71, 72]), ...quarters([60, 62, 64, 65, 67, 69, 71, 72], 8), [16, 4, 72]])
    expect(unfold(m, ly)).toEqual({ bytes: m })
    expect(unfold(simpleMidi, ly)).toMatchObject({ why: expect.stringMatching(/not as long/) })
  })

  it('a repeat that ends mid-bar leaves a short bar at the join, which the result states as a time signature', () => {
    // 2/2: the repeat is b2 c4 d | e2, half a bar short, and the second pass goes on into f g after it
    const ly = score('\\time 2/2 c2 d4 e | f2 g4 a | \\repeat volta 2 { b2 c4 d | e2 } f4 g | a2 b4 c | d1')
    const notes = [[0, 2, 60], [2, 1, 62], [3, 1, 64], [4, 2, 65], [6, 1, 67], [7, 1, 69], [8, 2, 71], [10, 1, 72], [11, 1, 74], [12, 2, 76], [14, 1, 77], [15, 1, 79], [16, 2, 81], [18, 1, 83], [19, 1, 84], [20, 4, 86]]
    const m = midiOf(notes, [2, 2])
    const u = unfold(m, ly)
    if ('why' in u) throw new Error(u.why)
    expect(pitches(u.bytes).length).toBe(notes.length + 4)
    expect(pitches(u.bytes).slice(4, 14)).toEqual([67, 69, 71, 72, 74, 76, 71, 72, 74, 76])
    const { timeSignatures, ppq } = new Midi(ab(u.bytes)).header
    expect(timeSignatures.map((t) => [t.ticks / ppq, t.timeSignature.join('/')])).toEqual([[0, '2/2'], [12, '2/4'], [14, '2/2']])
    expect(bars(u.bytes) - bars(m)).toBe(2)
  })

  it("picks the movement's .ly whose reading matches the MIDI, closest in length (a denser one covers its onsets too)", () => {
    const dense = score(`${'c8 '.repeat(16)} c1 c1`)
    expect(pickLy(simpleMidi, [volta, dense, simple])).toBe(simple)
    expect(pickLy(simpleMidi, [volta])).toBe(volta) // none matches: the first, as before
  })

  it('an unfolded input is no longer flagged; one that cannot be unfolded still is', async () => {
    const input = (bytes: Uint8Array, ly: string): Input => ({ id: 'mutopia-1', title: 't', composer: 'X (1700–1750)', source: 'mutopia', sourceUrl: '', licenceEvidence: '', licence: 'Public Domain', licenceUrl: '', edition: '', format: 'midi', bytes, upstreamSha: '', ly })
    expect((await analyse(withRepeats(input(simpleMidi, simple)))).flags).not.toContain('repeats')
    expect((await analyse(withRepeats(input(simpleMidi, simple.replace('c1', 'c1^"D.C."'))))).flags).toContain('repeats')
  })
})
