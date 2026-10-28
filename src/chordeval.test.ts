import { describe, expect, it } from 'vitest'
import { annAt, chordOf, keyOf, parseRn, triad } from './chordeval'

// Evaluation helpers only (see chordeval.run.test.ts): the Roman-numeral reader checked on labels with known answers.
const C = (l: string, tonic = 0, minor = false) => chordOf(l, tonic, minor)

describe('chordOf', () => {
  it('reads plain numerals, inversions and sevenths in major and minor', () => {
    expect(C('I')).toEqual([0, 'M'])
    expect(C('V65')).toEqual([7, '7'])
    expect(C('ii6')).toEqual([2, 'm'])
    expect(C('ii7')).toEqual([2, 'm7'])
    expect(C('IVM7')).toEqual([5, 'maj7'])
    expect(C('V6/5')).toEqual([7, '7']) // the older slash figure
    expect(C('i', 0, true)).toEqual([0, 'm'])
    expect(C('VI', 0, true)).toEqual([8, 'M']) // the flat sixth
    expect(C('III', 9, true)).toEqual([0, 'M']) // C major in A minor
    expect(C('bVI')).toEqual([8, 'M'])
    expect(C('V[no3][add4]')).toEqual([7, 'M']) // modifiers are ignored
  })
  it('reads diminished, half-diminished and augmented as their classes; a minor leading-tone chord has its raised root', () => {
    expect(C('viio7')).toEqual([11, 'dim'])
    expect(C('viiø7')).toEqual([11, 'dim'])
    expect(C('vii/o7')).toEqual([11, 'dim'])
    expect(C('viio6', 0, true)).toEqual([11, 'dim'])
    expect(C('#viio6', 0, true)).toEqual([11, 'dim'])
    expect(C('V+')).toEqual([7, 'aug'])
  })
  it('reads secondary chords by the key they point to', () => {
    expect(C('V7/V')).toEqual([2, '7']) // D7 in C
    expect(C('viio6/5/V')).toEqual([6, 'dim']) // F# in C
    expect(C('V/vi')).toEqual([4, 'M'])
    expect(C('V/iv', 0, true)).toEqual([0, 'M']) // C in C minor: the dominant of F minor
    expect(C('V/V/V')).toEqual([9, 'M'])
  })
  it('reads the Neapolitan, the German sixth and the cadential six-four; skips Italian and French', () => {
    expect(C('N6')).toEqual([1, 'M'])
    expect(C('Ger65')).toEqual([8, '7'])
    expect(C('Cad64')).toEqual([7, 'M', 0]) // the dominant it stands for; the tonic it sounds as is the third value
    expect(C('It6')).toBeNull()
    expect(C('Fr43')).toBeNull()
    expect(C('nonsense')).toBeNull()
  })
})

describe('parseRn', () => {
  const src = `Composer: x
Time Signature: 6/8
Form: Verse 1
m0 b2 V
m1 C: I b1.67 V65/V b2 ii
m2 G: V7 || b2.5 Fr6
m3-4 = m1-2
m5 Am7 b2 I`
  const { anns, total, skipped } = parseRn(src)
  it('puts each chord at its measure and beat, the key in force, and counts what it skipped', () => {
    expect(total).toBe(8) // written labels only: a copy made by "=" is not recounted
    expect(skipped).toBe(2) // Fr6, and Am7 (a chord symbol, not a numeral)
  })
  it('measures beats in the beat of the metre (6/8: a dotted quarter) and carries the key', () => {
    expect(anns[0]).toMatchObject({ m: 0, q: 1.5, root: 7, cls: 'M', form: 'verse' }) // a pickup on beat 2
    const m1 = anns.filter((a) => a.m === 1)
    expect(m1.map((a) => [a.q, a.root])).toEqual([[0, 0], [1.005, 2], [1.5, 2]])
    expect(anns.find((a) => a.m === 2)).toMatchObject({ key: 7, root: 2, cls: '7' }) // D7 in G
  })
  it('repeats measures asked for with "="', () => {
    expect(anns.filter((a) => a.m === 3).map((a) => a.root)).toEqual([0, 2, 2])
    expect(anns.filter((a) => a.m === 4)[0].key).toBe(7)
  })
  it('keeps an unreadable label as an unknown chord, so the one before does not carry over it', () => {
    expect(annAt(anns, 4, 3)?.root).toBe(-1)
  })
  it('annAt takes the last chord at or before the moment, with a little slack for a written third of a beat', () => {
    expect(annAt(anns, 1, 0.9)?.root).toBe(0)
    expect(annAt(anns, 1, 1.0)?.root).toBe(2) // b1.67 is written for a third of the way
    expect(annAt(anns, 1, 1.0049)?.root).toBe(2)
    expect(annAt(anns, 1, 1.4)?.root).toBe(2)
    expect(annAt(anns, 0, 0)).toBeUndefined()
  })
})

describe('keyOf and triad', () => {
  it('reads key tokens', () => {
    expect(keyOf('Bb:')).toEqual([10, false])
    expect(keyOf('bb:')).toEqual([10, true])
    expect(keyOf('f#:')).toEqual([6, true])
    expect(keyOf('b3')).toBeNull()
  })
  it('sevenths count as their triad', () => {
    expect([triad('7'), triad('maj7'), triad('m7'), triad('dim')]).toEqual(['M', 'M', 'm', 'dim'])
  })
})
