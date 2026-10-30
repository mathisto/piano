import { describe, expect, it } from 'vitest'
import { check, deal, deckOf } from './theory'
import { chordCards, cadenceCards, degreeCards, intervalCards, keyCards, type TCard } from './theory-cards'

const card = (cs: TCard[], id: string) => cs.find((c) => c.id === id)!

describe('chords', () => {
  it('level 1 is major and minor on the white keys only', () => {
    const cs = chordCards(1)
    expect(cs).toHaveLength(14)
    expect(card(cs, 'chord:maj:7:0').steps[0].pcs).toEqual([7, 11, 2])
  })
  it('level 3 asks for inversions with the right lowest note', () => {
    const c = card(chordCards(3), 'chord:min:9:1') // A minor, first inversion: C lowest
    expect(c.prompt).toBe('A minor, first inversion')
    expect(c.steps[0].bass).toBe(0)
    expect(check(c.steps[0], [60, 64, 69])).toBe(true) // C E A
    expect(check(c.steps[0], [57, 60, 64])).toBe(false) // A C E: root position
  })
  it('a chord needs exactly its notes: an extra or missing one is wrong, doubling and octave are free', () => {
    const c = card(chordCards(2), 'chord:maj:0:0').steps[0]
    expect(check(c, [60, 64, 67])).toBe(true)
    expect(check(c, [48, 64, 67, 72])).toBe(true)
    expect(check(c, [60, 64])).toBe(false)
    expect(check(c, [60, 64, 67, 70])).toBe(false)
  })
  it('sevenths have four notes', () => {
    expect(card(chordCards(4), 'chord:dom7:7:0').steps[0].pcs).toEqual([7, 11, 2, 5])
  })
})

describe('key signatures', () => {
  it('three flats is E flat major, and its flats are B E A', () => {
    expect(card(keyCards(), 'key:sig:-3').steps[0].pcs).toEqual([3, 7, 10])
    expect(card(keyCards(), 'key:acc:-3').steps[0].pcs).toEqual([10, 3, 8])
  })
  it('two sharps is D major, and its sharps are F C', () => {
    expect(card(keyCards(), 'key:sig:2').steps[0].pcs).toEqual([2, 6, 9])
    expect(card(keyCards(), 'key:acc:2').steps[0].pcs).toEqual([6, 1])
  })
})

describe('intervals and degrees', () => {
  it('a major 3rd above E flat is G; a perfect 5th below C is F', () => {
    expect(card(intervalCards(), 'iv:4:1:3').steps[0].pcs).toEqual([7])
    expect(card(intervalCards(), 'iv:7:-1:0').steps[0].pcs).toEqual([5])
  })
  it('degree 5 of E flat major is B flat', () => {
    expect(card(degreeCards(), 'deg:3:5').steps[0].pcs).toEqual([10])
  })
})

describe('cadences', () => {
  it('I–IV–V–I in G is G, C, D, G chords', () => {
    const c = card(cadenceCards(1), 'cad:I–IV–V–I:7')
    expect(c.steps.map((s) => s.pcs[0])).toEqual([7, 0, 2, 7])
    expect(c.steps[0].pcs).toEqual([7, 11, 2])
  })
  it('ii–V–I in C has a minor ii', () => {
    expect(card(cadenceCards(2), 'cad:ii–V–I:0').steps[0].pcs).toEqual([2, 5, 9])
  })
})

describe('dealing', () => {
  it('deals what you miss more often and never the same card twice', () => {
    const deck = deckOf('degrees', 1)
    const seeded = (seed = 9) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    const stats = { 'deg:3:5': { n: 5, clean: 0, rt: 8000, due: 0 } }
    const d = deal(deck, stats, 500, seeded(), 100)
    expect(d.filter((c) => c.id === 'deg:3:5').length).toBeGreaterThan((500 / deck.length) * 2)
    expect(d.slice(1).every((c, i) => c.id !== d[i].id)).toBe(true)
  })
})
