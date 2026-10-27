import { Midi } from '@tonejs/midi'
import { describe, expect, it } from 'vitest'
import { analyse, type Input } from '../scripts/library/pipeline'
import { encode, lyPickup, pickLy, pickupWhy, unfold, withRepeats } from '../scripts/library/repeats'
import { inlineIncludes } from '../scripts/library/lib.mjs'
import { fromMidi } from './midi-tracks'

// A LilyPond-like MIDI: 4/4, G major, one track; notes as [quarter, quarters, pitch]
const midiOf = (notes: number[][], sig = [4, 4], later: [number, number[]][] = []) => {
  const m = new Midi()
  const q = m.header.ppq
  m.header.tempos.push({ ticks: 0, bpm: 100 })
  m.header.timeSignatures.push({ ticks: 0, timeSignature: sig })
  for (const [at, timeSignature] of later) m.header.timeSignatures.push({ ticks: at * q, timeSignature })
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

describe('the anacrusis a .ly states (lyPickup)', () => {
  // quarters of 1: a pickup of one beat, then bars of four; `ly` is its source
  const pick = [[0, 1, 60], ...quarters([62, 64, 65, 67, 69, 71, 72], 1), [8, 4, 74]]
  const lyOf = (head: string, body = 'c4 | d e f g | a b c d | e1') => `\\version "2.18.2"\n{ ${head} ${body} }\n\\score { \\new Staff { ${head} ${body} } \\midi { } }\n`
  const bar4 = (head: string) => lyPickup(midiOf(pick), lyOf(head))
  it('reads \\partial in quarters: dotted, multiplied, in any meter', () => {
    expect(bar4('\\time 4/4 \\partial 4')).toBe(1)
    expect(bar4('\\partial 4')).toBe(1) // no \\time: LilyPond's 4/4
    expect(bar4('\\partial 4 \\time 4/4')).toBe(1) // either order
    expect(lyPickup(midiOf([[0, 0.5, 60], ...quarters([62, 64, 65, 67, 69, 71, 72, 74], 0.5)]), lyOf('\\partial 8', 'c8 | d4 e f g | a b c d | e1'))).toBe(0.5)
    expect(lyPickup(midiOf([[0, 1.5, 60], ...quarters([62, 64, 65, 67, 69, 71, 72, 74], 1.5)]), lyOf('\\partial 4.', 'c4. | d4 e f g | a b c d | e1'))).toBe(1.5)
    expect(lyPickup(midiOf([[0, 0.5, 60], [0.5, 0.5, 61], [1, 0.5, 62], ...quarters([62, 64, 65, 67, 69, 71, 72, 74], 1.5)]), lyOf('\\partial 8*3', 'c8 c c | d4 e f g | a b c d | e1'))).toBe(1.5)
    const six = midiOf([[0, 0.5, 60], [0.5, 1.5, 62], [2, 1.5, 64], [3.5, 1.5, 65], [5, 1.5, 67], [6.5, 3, 69]], [6, 8])
    expect(lyPickup(six, lyOf('\\time 6/8 \\partial 8', 'c8 | d4. e | f g | a2.'))).toBe(0.5)
  })
  it('reads Timing.measurePosition and Score.measurePosition set before the first note as the part of the bar already gone', () => {
    for (const w of ['Timing', 'Score']) expect(bar4(`\\set ${w}.measurePosition = #(ly:make-moment 3 4)`)).toBe(1)
  })
  it('a pickup as long as the bar is no pickup', () => {
    expect(lyPickup(midiOf([...quarters([60, 62, 64, 65, 67, 69, 71, 72]), [8, 4, 74]]), lyOf('\\partial 1', 'c4 d e f | g a b c | d1'))).toBe(0)
  })
  it('says nothing when the .ly is not this file, or its meter is not the file\'s, or the first bar is not the whole story', () => {
    expect(lyPickup(midiOf(pick), lyOf('\\partial 4', 'c2 | d e | f g | a1'))).toBeUndefined() // another score
    expect(lyPickup(midiOf(pick), lyOf('\\partial 4', 'c4 | d e f g | a b c d | e1 | f1 | g1 | a1'))).toBeUndefined() // covers the onsets, but is longer: a sibling movement
    expect(bar4('\\time 3/4 \\partial 4')).toBeUndefined() // the MIDI is in 4/4
  })
  it('no \\partial: 0 when one meter and the bar counts agree, else nothing', () => {
    const plain = [...quarters([60, 62, 64, 65, 67, 69, 71, 72]), [8, 4, 74]]
    const ly = (body: string) => lyOf('\\time 4/4', body)
    expect(lyPickup(midiOf(plain), ly('c4 d e f | g a b c | d1'))).toBe(0)
    expect(lyPickup(midiOf(plain), ly('c4 d e f | g a b c | d1 | r1'))).toBe(0) // a bar of rests after the last note is no bar of the MIDI's
    expect(lyPickup(midiOf(plain), ly('c4 d e f | g a b c | d1 | r1 e4'))).toBeUndefined() // a note two bars on that the MIDI does not have
    expect(lyPickup(midiOf(plain), ly('c4 d e f | g a b c | d1 \\time 3/4 r2.'))).toBeUndefined() // a meter change after the first note
    expect(lyPickup(midiOf(plain), ly('c4 d e f | g a b c \\partial 4 | d1'))).toBe(0) // a \\partial later on moves the later bars, not the first
    expect(lyPickup(midiOf(plain, [3, 4]), ly('c4 d e f | g a b c | d1'))).toBeUndefined() // another meter
  })
  it('0 with a later meter change when the MIDI has it too, at the same place', () => {
    const two = [...quarters([60, 62, 64, 65, 67, 69, 71, 72]), [8, 3, 74], [11, 3, 76]]
    const ly = (body: string) => lyOf('\\time 4/4', body)
    expect(lyPickup(midiOf(two, [4, 4], [[8, [3, 4]]]), ly('c4 d e f | g a b c | \\time 3/4 d2. e'))).toBe(0)
    expect(lyPickup(midiOf(two, [4, 4], [[12, [3, 4]]]), ly('c4 d e f | g a b c | \\time 3/4 d2. e'))).toBeUndefined() // the MIDI changes elsewhere
    expect(lyPickup(midiOf(two), ly('c4 d e f | g a b c | \\time 3/4 d2. e'))).toBeUndefined() // the MIDI does not change
  })
  it('a \\partial before the first note counts even when a later one follows it (the first bar is all that is read)', () => {
    expect(lyPickup(midiOf(pick), lyOf('\\partial 4', 'c4 | d e f g | a b c d \\partial 4 | e1'))).toBe(1)
  })
  it('the catalogue entry carries it, and the bars follow', async () => {
    const e = { id: 'x', title: 'x', format: 'midi', bytes: midiOf(pick), ly: lyOf('\\partial 4') } as Input
    const a = await analyse(e)
    expect(a.pickup).toBe(1)
    expect(a.song!.bars[0].ql).toBe(1)
    expect((await analyse({ ...e, ly: undefined })).pickup).toBeUndefined() // no .ly: the detector, unchanged
    expect((await analyse({ ...e, ly: '{ c1 }' })).pickup).toBeUndefined()
  })
})

describe('what the .ly reader reads (readLy)', () => {
  // three bars of 4/4: c d e f | g a b c | d1; a reading counts when its onsets are the file's, and then says 0 (no pickup)
  const plain = midiOf([...quarters([60, 62, 64, 65, 67, 69, 71, 72]), [8, 4, 74]])
  const book = (defs: string, score: string) => `\\version "2.18.2"\n${defs}\n\\score { ${score} \\midi { } }\n`
  const read = (defs: string, score: string, midi = plain) => lyPickup(midi, book(defs, score))
  const body = (extra: string) => `x = { \\time 4/4 ${extra} c4 d e f | g a b c | d1 }`

  it('\\tag: kept or dropped by the \\keepWithTag or \\removeWithTag around it, in a variable too', () => {
    const tagged = body("\\tag #'b { r1 }")
    expect(read(tagged, '\\x')).toBeUndefined() // nothing filtered: the rest plays a bar late
    expect(read(tagged, "\\keepWithTag #'a \\x")).toBe(0)
    expect(read(tagged, "\\removeWithTag #'b \\x")).toBe(0)
    expect(read(body("\\tag #'(a b) { r1 }"), "\\keepWithTag #'a \\x")).toBeUndefined() // a tag list that has a
    expect(read(body("\\tag #'(a b) { r1 }"), "\\keepWithTag #'c \\x")).toBe(0)
    expect(read("x = { \\time 4/4 c 4 d 4 e 4 f 4 | g 4 a 4 b 4 c 4 | d 1 \\tag #'b { r1 } }", "\\keepWithTag #'a \\x")).toBe(0) // read again for the filter: a spaced duration is not read twice
  })
  it('\\parallelMusic deals its bars out to the variables', () => {
    const two = midiOf([...quarters([60, 62, 64, 65]), [0, 4, 48]])
    expect(read("\\parallelMusic #'(hi lo) { c4 d e f | c1 | }", '<< \\hi \\lo >>', two)).toBe(0)
  })
  it('a repeat that is unfolded is played in the voice that writes it, endings in turn', () => {
    // upper: c d | e2 c d | g a (the first ending once, the second ending after the second pass), lower: a whole note a pass
    const m = midiOf([[0, 1, 60], [1, 1, 62], [2, 2, 64], [4, 1, 60], [5, 1, 62], [6, 1, 67], [7, 1, 69]])
    expect(read('', "\\repeat unfold 2 { c4 d } \\alternative { { e2 } { g4 a } }", m)).toBe(0)
    expect(read('', "\\repeat volta 2 { c4 d } \\alternative { { e2 } { g4 a } }", m)).toBeUndefined() // a volta is played once: the file has the passes
    const one = midiOf([[0, 1, 60], [1, 1, 62], [2, 1, 64], [3, 1, 65], [4, 1, 60], [5, 1, 62], [6, 1, 64], [7, 1, 65], [0, 4, 48], [4, 4, 48]])
    expect(read("lo = { g1 g1 }", '\\unfoldRepeats << \\repeat volta 2 { c4 d e f } \\lo >>', one)).toBe(0) // the upper voice repeats, the lower writes both out
  })
  it('<> has no length, a property=0.5 is no pitch, a decimal is no duration', () => {
    expect(read('', '{ \\time 4/4 c4 <>^"x" d e f | g a b c | d1 }')).toBe(0)
    expect(read('', '{ \\time 4/4 \\override NoteColumn.force-hshift=0.5 \\override Y.offset = 7.75 c4 d e f | g a b c | d1 }')).toBe(0)
  })
  it('a score with neither \\layout nor \\midi is played; so are the layout-only scores of a file with no \\midi', () => {
    const ly = (score: string) => `\\version "2.18.2"\n${score}\n`
    expect(lyPickup(plain, ly('\\score { { c4 d e f | g a b c | d1 } }'))).toBe(0)
    expect(lyPickup(plain, ly('\\score { { c4 d e f | g a b c | d1 } \\layout { } }'))).toBe(0)
    expect(lyPickup(plain, ly('\\score { { c1 } \\midi { } } \\score { { c4 d e f | g a b c | d1 } \\layout { } }'))).toBeUndefined() // the \\midi one is the file's
  })
  it('a rest after the last note is no bar of the file, and a last note a bar over is', () => {
    expect(read('', '{ \\time 4/4 c4 d e f | g a b c | d1 | r1 | r1 }')).toBe(0)
    expect(read('', '{ \\time 4/4 c4 d e f | g a b c | d1 | r1 c1 }')).toBeUndefined()
  })
  it('names the cause when it says nothing', () => {
    expect(pickupWhy(plain, '{ c1 }')).toEqual({ pickup: undefined, why: expect.stringMatching(/no score|misses/) })
    expect(pickupWhy(plain, book('', '{ \\time 3/4 c4 d e f | g a b c | d1 }')).why).toMatch(/time/)
    expect(pickupWhy(plain, book('', '{ \\time 4/4 c4 d e f | g a b c | \\time 3/4 d2. }')).why).toMatch(/time signatures/)
  })
})

describe('\\include from a zip of .ly files (lib.mjs)', () => {
  const zip = (o: Record<string, string>) => new Map(Object.entries(o).map(([k, v]) => [k, Buffer.from(v)]))
  it('finds the file beside the including one, above it, or by its name alone; leaves what the zip does not hold; skips comments and cycles', () => {
    const files = zip({
      'w/main.ly': '\\include "a.ily"\n% \\include "b.ily"\n\\include "english.ly"\n\\include "deep/c.ily"\nend',
      'w/a.ily': 'A \\include "top.ily"',
      'top.ily': 'TOP',
      'w/deep/c.ily': 'C \\include "../main.ly"',
      'w/lone/b.ily': 'B',
    })
    const out = inlineIncludes(files, 'w/main.ly').split('\n').filter(Boolean)
    expect(out).toEqual(['A ', 'TOP', '% \\include "b.ily"', '\\include "english.ly"', 'C \\include "../main.ly"', 'end']) // b.ily is in a comment, english.ly is not in the zip, main.ly is already being read
  })
  it('\\includeScore "Piece" is the folder\'s global.ily as \\global and its score.ily', () => {
    const files = zip({ 'w/main.ly': '\\includeScore "P"\nend', 'w/P/global.ily': '\\time 3/4', 'w/P/score.ily': '\\score { \\global }' })
    expect(inlineIncludes(files, 'w/main.ly')).toBe('global = {\n\\time 3/4\n}\n\n\\score { \\global }\n\nend')
  })
})
