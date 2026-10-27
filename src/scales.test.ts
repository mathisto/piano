import { describe, expect, it } from 'vitest'
import { CLEAN_RUNS, STAGES, cardsOf, fifthsOf, fingers, mastery, nextCard, parseId, passed, record, scaleSong, solid, type Card, type ScaleStats } from './scales'

const c = (o: Partial<Card> = {}): Card => ({ tonic: 0, form: 'major', hands: 'R', oct: 1, ...o })

describe('fingering', () => {
  it('C major right hand: 1 2 3 1 2 3 4 5, and two octaves repeat the pattern', () => {
    expect(fingers(0, 'major', 'R', 1)).toEqual([1, 2, 3, 1, 2, 3, 4, 5])
    expect(fingers(0, 'major', 'R', 2)).toEqual([1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 5])
  })
  it('F major puts the fourth finger on B flat, once an octave', () => {
    expect(fingers(5, 'major', 'R', 2).filter((f) => f === 4)).toHaveLength(3) // 4th finger twice per octave pair plus the top
    expect(fingers(5, 'major', 'R', 1)).toEqual([1, 2, 3, 4, 1, 2, 3, 4])
  })
  it('B major left hand starts on the fourth finger', () => {
    expect(fingers(11, 'major', 'L', 1)[0]).toBe(4)
  })
  it('every key has a right and a left hand string of eight fingers 1 to 5', () => {
    for (const form of ['major', 'harmonic'] as const)
      for (let t = 0; t < 12; t++)
        for (const h of ['R', 'L'] as const) {
          const f = fingers(t, form, h, 1)
          expect(f).toHaveLength(8)
          expect(f.every((x) => x >= 1 && x <= 5)).toBe(true)
        }
  })
})

describe('the scale as a song', () => {
  it('C major, one octave, right hand: 15 notes up and back from middle C, fingered', () => {
    const s = scaleSong(c(), 60)
    expect(s.notes).toHaveLength(15)
    expect(s.notes.map((n) => n.p)).toEqual([60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60])
    expect(s.notes.map((n) => n.f)).toEqual([1, 2, 3, 1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 2, 1])
  })
  it('hands together: the left hand sits an octave below', () => {
    const s = scaleSong(c({ hands: 'both' }), 60)
    expect(s.notes).toHaveLength(30)
    expect(Math.min(...s.notes.map((n) => n.p))).toBe(48)
  })
  it('two octaves go up to the second C', () => {
    expect(Math.max(...scaleSong(c({ oct: 2 }), 60).notes.map((n) => n.p))).toBe(84)
  })
  it('harmonic minor raises the seventh; melodic comes down as the natural minor', () => {
    expect(scaleSong(c({ tonic: 9, form: 'harmonic' }), 60).notes.slice(0, 8).map((n) => n.p)).toEqual([69, 71, 72, 74, 76, 77, 80, 81])
    const mel = scaleSong(c({ tonic: 9, form: 'melodic' }), 60).notes.map((n) => n.p)
    expect(mel.slice(0, 8)).toEqual([69, 71, 72, 74, 76, 78, 80, 81])
    expect(mel.slice(8, 11)).toEqual([79, 77, 76]) // G, F, E natural coming down
  })
  it('carries the key signature and an id that reads back', () => {
    const s = scaleSong(c({ tonic: 2, hands: 'both', oct: 2 }), 72)
    expect(s.fifths).toBe(2)
    expect(parseId(s.id)).toEqual({ card: c({ tonic: 2, hands: 'both', oct: 2 }), bpm: 72 })
    expect(s.dyn).toBe('even')
  })
  it('key signatures: A minor none, E flat minor six flats, G sharp minor five sharps', () => {
    expect([fifthsOf(9, 'harmonic'), fifthsOf(3, 'harmonic'), fifthsOf(8, 'harmonic'), fifthsOf(1, 'major')]).toEqual([0, -6, 5, -5])
  })
})

describe('the curriculum', () => {
  it('each stage deals its keys across its combinations', () => {
    expect(cardsOf(STAGES[0])).toHaveLength(10)
    expect(cardsOf(STAGES[4])).toHaveLength(24)
  })
  it('three clean runs in a row make a scale solid at that tempo, a bad run restarts the count', () => {
    const st: ScaleStats = {}
    const card = c()
    for (let i = 0; i < CLEAN_RUNS - 1; i++) record(st, card, 60, true)
    expect(solid(st, card, 60)).toBe(false)
    record(st, card, 60, false)
    for (let i = 0; i < CLEAN_RUNS; i++) record(st, card, 60, true)
    expect(solid(st, card, 60)).toBe(true)
    expect(solid(st, card, 66)).toBe(false)
  })
  it('the next scale is the first that is not solid; mastery counts the solid ones', () => {
    const st: ScaleStats = {}
    const first = cardsOf(STAGES[0])[0]
    for (let i = 0; i < CLEAN_RUNS; i++) record(st, first, 60, true)
    expect(nextCard(STAGES[0], st)).toEqual(cardsOf(STAGES[0])[1])
    expect(mastery(STAGES[0], st).done).toBe(1)
  })
  it('a run counts when clean, in time and not uneven', () => {
    expect(passed({ clean: true, acc: 0.95, even: null })).toBe(true)
    expect(passed({ clean: true, acc: 0.95, even: { rating: 'uneven' } })).toBe(false)
    expect(passed({ clean: true, acc: 0.6, even: null })).toBe(false)
    expect(passed({ clean: false, acc: 0.99, even: null })).toBe(false)
  })
})
