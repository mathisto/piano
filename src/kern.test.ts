import { describe, expect, it } from 'vitest'
import { fromKern, kernToMusicXml } from './kern'
import type { Song } from './song'

const k = (...lines: string[]) => lines.join('\n')
/** A bar's notes as 'onset:pitch hand', sorted; graces left out. */
const at = (s: Song, bar: number) => s.notes.filter((n) => n.bar === bar && !n.grace).map((n) => `${+n.qb!.toFixed(3)}:${n.p}${n.h}`).sort()

describe('kern: a hand-written score', () => {
  const src = k(
    '!!!COM: Test',
    '**kern\t**kern\t**dynam',
    '*staff2\t*staff1\t*',
    '*clefF4\t*clefG2\t*',
    '*k[b-]\t*k[b-]\t*',
    '*M3/4\t*M3/4\t*',
    '*MM120\t*MM120\t*',
    '4C\t8cc#L\tf',
    '.\t8b-J\t.',
    '=1\t=1\t=1',
    '2.C 2.G\t[4.e\t.',
    '.\t8e]\t.',
    '.\t12aL\t.',
    '.\t16qbb\t.',
    '.\t12ccc\t.',
    '.\t12ddJ\t.',
    '=2\t=2\t=2',
    '4r\t4dd\t.',
    '.\t.\t.', // a null line where both notes end: it lasts nothing
    '4c\t4gg#\t.',
    '4D\t4ryy\t.',
    '==\t==\t==',
    '*-\t*-\t*-',
  )
  const s = fromKern(src, 'Fixture', 'fx')

  it('reads pitch by case and repetition, accidentals, a pickup, chords, rests and the null line', () => {
    expect(s.fifths).toBe(-1)
    expect(s.spb).toBe(0.5)
    expect(s.bars.map((b) => b.ql)).toEqual([1, 3, 3])
    expect(at(s, 0)).toEqual(['0.5:70R', '0:48L', '0:73R'])
    expect(at(s, 1)).toEqual(['0:48L', '0:55L', '0:64R', '2.333:84R', '2.667:74R', '2:69R'])
    expect(at(s, 2)).toEqual(['0:74R', '1:60L', '1:80R', '2:50L'])
  })

  it('joins ties, keeps grace notes and triplets, reads **dynam as velocity', () => {
    expect(s.notes.filter((n) => n.p === 64).map((n) => n.qd)).toEqual([2]) // [4.e 8e] is one note
    expect(s.notes.filter((n) => n.grace).map((n) => n.p)).toEqual([83])
    expect(s.notes.filter((n) => n.tuplet).map((n) => n.p)).toEqual([69, 84, 74])
    expect(s.notes[0].v).toBe(0.78) // f
    expect(kernToMusicXml(src).xml).toMatch(/<measure number="1" implicit="yes">.*<staves>2<\/staves>/)
  })
})

describe('kern: structure', () => {
  it('splits and joins spines into voices of one hand, plays out the expansion list and joins the short bars it makes', () => {
    const s = fromKern(
      k('**kern\t**kern', '*>[A,A,B]\t*>[A,A,B]', '*M2/4\t*M2/4', '*>A\t*>A', '4C\t4c', '=1\t=1', '*\t*^', '4D\t4d\t4f', '4E\t4e\t4g', '*\t*v\t*v', '=2\t=2', '4F\t4a', '=:|!|:\t=:|!|:', '*>B\t*>B', '4G\t4b', '=3\t=3', '2C\t2cc', '==\t=='),
      'x',
      'x',
    )
    expect(s.bars.map((b) => b.ql)).toEqual([1, 2, 2, 2, 2, 2]) // A's last bar and the next pickup make one bar
    expect(s.notes).toHaveLength(24) // A twice (10 notes), B once (4)
    expect(s.notes.filter((n) => n.p === 65 || n.p === 67).every((n) => n.h === 'R')).toBe(true)
  })

  it('without an expansion list, barline repeats go into the score and the importer plays them', () => {
    const s = fromKern(k('**kern\t**kern', '*M2/4\t*M2/4', '=1\t=1', '2C\t2c', '=2:|!\t=2:|!', '2D\t2d', '==\t=='), 'x', 'x')
    expect(s.bars).toHaveLength(3)
    expect(s.notes.map((n) => n.p)).toEqual([48, 60, 48, 60, 50, 62])
  })

  it('one spine is one staff, split between the hands at middle C', () => {
    const r = kernToMusicXml(k('**kern', '*M4/4', '4c', '4C', '4e', '4G', '=='))
    expect(r.xml).not.toMatch(/<staves>/)
    expect(fromKern(k('**kern', '*M4/4', '4c', '4C', '4e', '4G', '=='), 'x', 'x').notes.map((n) => n.h)).toEqual(['R', 'L', 'R', 'L'])
  })

  it('refuses what it cannot place, and counts a token it cannot read, keeping its time', () => {
    expect(() => kernToMusicXml(k('**kern\t**kern\t**kern', '4c\t4c\t4c'))).toThrow(/3 \*\*kern spines/)
    expect(() => kernToMusicXml(k('**kern\t**kern', '4c'))).toThrow(/1 tokens for 2 spines/)
    expect(() => kernToMusicXml(k('**kern\t**kern', '*x\t*x'))).toThrow(/\*x is not supported/)
    expect(() => kernToMusicXml(k('**kern', '*>[A,Z]', '*>A', '4c', '=='))).toThrow(/label Z has no bars/)
    const r = kernToMusicXml(k('**kern\t**kern', '*M2/4\t*M2/4', '4C\t4cd', '4D\t4e', '==\t=='))
    expect(r.skipped).toEqual({ 'token without one pitch': 1 })
    expect(at(fromKern(k('**kern\t**kern', '*M2/4\t*M2/4', '4C\t4cd', '4D\t4e', '==\t=='), 'x', 'x'), 0)).toEqual(['0:48L', '1:50L', '1:64R'])
  })
})

// Chopin Institute first editions (CC BY 4.0, The Fryderyk Chopin Institute, chopinscores.org): the opening bars, verbatim
// but for comments and the instrument line; the Mazurka without its *>[A,A,B,B,C] list, whose B and C fall outside the excerpt.
const PRELUDE_20 = [
  "**kern\t**kern\t**dynam",
  "*part1\t*part1\t*part1",
  "*staff2\t*staff1\t*",
  "*clefF4\t*clefG2\t*",
  "*k[b-e-a-]\t*k[b-e-a-]\t*",
  "*c:\t*c:\t*",
  "*M4/4\t*M4/4\t*",
  "*met(c)\t*met(c)\t*",
  "=1\t=1\t=1",
  "*^\t*\t*",
  "2ryy\t4C 4CC\t(>4g 4e- 4c 4G<\tff",
  ".\t4FF 4FFF\t4a- 4e- 4c 4A-<\t.",
  "4Bn 4G\t4GG 4GGG\t8.gL 8.e-\t.",
  ".\t.\t16fJk 16d\t.",
  "4ryy\t4C 4GG 4CC\t4e- 4c 4G< 4E-<)\t.",
  "=2\t=2\t=2\t=2",
  "2ryy\t4AA- 4AAA-\t(>4e- 4c 4A-< 4E-<\t.",
  ".\t4DD-X 4DDD-X\t4f 4d-X 4A-< 4F<\t.",
  "4G 4E- 4D-X\t4EE- 4EEE-\t8.e-L 8.c\t.",
  ".\t.\t16d-Jk 16B-\t.",
  "4ryy\t4AA- 4AAA-\t4c< 4A-< 4E-< 4C<)\t.",
].join("\n") // kern/028-1-BH-020.krn, bars 1 and 2
const MAZURKA_6_1 = [
  "**kern\t**kern\t**dynam",
  "*part1\t*part1\t*part1",
  "*staff2\t*staff1\t*",
  "*clefF4\t*clefG2\t*",
  "*k[f#c#g#]\t*k[f#c#g#]\t*",
  "*f#:\t*f#:\t*",
  "*M3/4\t*M3/4\t*",
  "*MM132\t*MM132\t*",
  "*>A\t*>A\t*",
  "4r\t([4f#^>\tp",
  "=1\t=1\t=1",
  "*ped\t*\t*",
  "4CC#\t(<12f#L]\t.",
  ".\t12g#\t.",
  ".\t12f#J)\t.",
  "4B 4C#\t8e#XL\t<",
  "*Xped\t*\t*",
  ".\t8f#\t.",
  "4B 4E#X 4C#\t8.g#\t[",
  ".\t16dnJk)\t.",
  "=2\t=2\t=2",
  "*\t*^\t*",
  "*ped\t*\t*\t*",
  "4FF#\t8c#'<L\t2ryy\t.",
  ".\t16r\t.\t.",
  ".\t(16f#Jk\t.\t.",
  "*Xped\t*\t*\t*",
  "4c# 4F#\t4a`<)\t.\t<",
  "4c# 4F#\t4a^>\t[4f#\t.",
  "=3\t=3\t=3\t=3",
  "*ped\t*\t*\t*",
  "4EE\t(>12aL\t4f#]\t<",
  ".\t12b\t.\t.",
  ".\t12aJ)\t.\t.",
  "4B 4E\t8g#L\t4e\t.",
  "*Xped\t*\t*\t*",
  ".\t8a\t.\t.",
  "[4E\t8.b\t[4d\t.",
  ".\t16f#Jk\t.\t[[",
  "=4\t=4\t=4\t=4",
  "*ped\t*\t*\t*",
  "4E] 4AA\t8e^<L\t4d]\t.",
  ".\t16r\t.\t<",
  ".\t16aJk\t.\t.",
  "*Xped\t*\t*\t*",
  "4A\t4cc#'> 4c#\t4c#\t[[",
  "4e 4A\t4cc#^>\t4ryy\t.",
  "*\t*v\t*v\t*",
].join("\n") // kern/006-1-KI-001.krn, the pickup and bars 1 to 4

describe('kern: Chopin first editions', () => {
  it('Prelude Op. 28 No. 20: chords in both hands, a split left hand, octaves by repeated letters', () => {
    const s = fromKern(PRELUDE_20, 'Prelude', 'p20')
    expect(s.fifths).toBe(-3)
    expect(s.bars.map((b) => `${b.n}/${b.den}`)).toEqual(['4/4', '4/4'])
    expect(at(s, 0)).toEqual(
      ['0:48L', '0:36L', '0:67R', '0:63R', '0:60R', '0:55R', '1:41L', '1:29L', '1:68R', '1:63R', '1:60R', '1:56R', '2:59L', '2:55L', '2:43L', '2:31L', '2:67R', '2:63R', '2.75:65R', '2.75:62R', '3:48L', '3:43L', '3:36L', '3:63R', '3:60R', '3:55R', '3:51R'].sort(),
    )
    expect(at(s, 1)).toHaveLength(27)
    expect(s.flags).toContain('no-tempo')
  })

  it('Mazurka Op. 6 No. 1: the pickup, a tie over the barline, triplets, a split right hand, p', () => {
    const s = fromKern(MAZURKA_6_1, 'Mazurka', 'm61')
    expect(s.fifths).toBe(3)
    expect(s.spb).toBeCloseTo(60 / 132)
    expect(s.bars.map((b) => b.ql)).toEqual([1, 3, 3, 3, 3])
    expect(at(s, 0)).toEqual(['0:66R'])
    expect(at(s, 1)).toEqual(['0.333:68R', '0.667:66R', '0:37L', '1.5:66R', '1:49L', '1:59L', '1:65R', '2.75:62R', '2:49L', '2:53L', '2:59L', '2:68R'])
    expect(s.notes[0]).toMatchObject({ p: 66, v: 0.35, tieNext: true }) // tied into bar 1, so bar 1 starts no F sharp
    expect(at(s, 2)).toContain('2:66R') // the second voice of the split right hand
    expect(at(s, 3)).not.toContain('0:66R') // ... tied on, not struck again
  })
})
