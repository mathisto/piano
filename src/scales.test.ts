import { describe, expect, it } from 'vitest'
import { CLEAN_RUNS, degreeName, degreeOfPitch, quizDeal, quizRecord, quizRight, derive, fourth, why, STAGES, cardsOf, fifthsOf, fingers, mastery, nextCard, parseId, passed, record, scaleSong, solid, type Card, type ScaleStats } from './scales'

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

describe('the fourth-finger rule', () => {
  it('reproduces the printed octave of every key but the two that run 4-3-2-1 twice', () => {
    for (const form of ['major', 'harmonic'] as const)
      for (let t = 0; t < 12; t++)
        for (const h of ['R', 'L'] as const) {
          const one = fingers(t, form, h, 1)
          const s = one.join('')
          const rule = derive((s.indexOf('4') % 7) + 1, h, 1).join('')
          if (!(t === 11 && h === 'L')) expect(rule, `${t} ${form} ${h}`).toBe(s)
        }
  })
  it('G sharp minor from the book: right hand 4th on the 2nd degree, left hand 4th on the 4th', () => {
    expect(derive(2, 'R', 1).join('')).toBe('34123123')
    expect(derive(4, 'L', 1).join('')).toBe('32143213')
  })
  it('C major left hand over two octaves puts the thumb, not the fifth finger, in the middle', () => {
    expect(fingers(0, 'major', 'L', 2)).toEqual([5, 4, 3, 2, 1, 3, 2, 1, 4, 3, 2, 1, 3, 2, 1])
  })
  it('B flat major right hand starts on 4 and puts a 4 at each B flat', () => {
    expect(fingers(10, 'major', 'R', 2)).toEqual([4, 1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4])
  })
  it('B major left hand runs 4-3-2-1 twice', () => {
    expect(fingers(11, 'major', 'L', 1).join('')).toBe('43214321')
    expect(fingers(11, 'major', 'L', 2)).toHaveLength(15)
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

describe('why this fingering', () => {
  it('names the degree that takes the 4th finger, as the book lists them', () => {
    expect(fourth(0, 'major', 'R')).toEqual([7])
    expect(fourth(0, 'major', 'L')).toEqual([2])
    expect(fourth(8, 'harmonic', 'R')).toEqual([2]) // G sharp minor, right hand
    expect(fourth(8, 'harmonic', 'L')).toEqual([4])
    expect(fourth(11, 'major', 'L')).toEqual([1, 5]) // B major, left hand
    expect(fourth(11, 'major', 'R')).toEqual([7])
  })
  it('names a degree in its key, spelled for the key', () => {
    expect(degreeName(11, 'major', 7)).toBe('A♯')
    expect(degreeName(8, 'harmonic', 4)).toBe('C♯')
    expect(degreeName(5, 'major', 4)).toBe('B♭')
  })
  it('explains the groups', () => {
    expect(why(0, 'major', 'R')).toMatch(/degrees 4, 5, 6 and 7.*degrees 1, 2 and 3/)
    expect(why(8, 'harmonic', 'R')).toMatch(/degrees 6, 7, 1 and 2/)
    expect(why(0, 'major', 'L')).toMatch(/degrees 2, 3, 4 and 5.*degrees 6, 7 and 1/)
  })
})

describe('the fourth-finger quiz', () => {
  it('right answers are the book degrees; B left hand takes two', () => {
    expect(quizRight({ tonic: 0, form: 'major', hand: 'R' }, 7)).toBe(true)
    expect(quizRight({ tonic: 0, form: 'major', hand: 'R' }, 4)).toBe(false)
    expect(quizRight({ tonic: 11, form: 'major', hand: 'L' }, 5)).toBe(true)
  })
  it('a pressed note is a degree of the key in any octave, or none', () => {
    expect(degreeOfPitch(11, 'major', 70)).toBe(7) // A sharp, B major
    expect(degreeOfPitch(11, 'major', 58)).toBe(7)
    expect(degreeOfPitch(0, 'major', 61)).toBe(0)
  })
  it('deals keys you miss more often, and never the same card twice running', () => {
    const stats = { 'major:3:R': { n: 6, ok: 0 } }
    const seeded = (seed = 5) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    const d = quizDeal(stats, 400, seeded())
    expect(d.filter((c) => c.tonic === 3 && c.form === 'major' && c.hand === 'R').length).toBeGreaterThan(400 / 48)
    expect(d.slice(1).every((c, i) => c.tonic !== d[i].tonic || c.form !== d[i].form || c.hand !== d[i].hand)).toBe(true)
  })
  it('records a result', () => {
    const st = quizRecord({}, { tonic: 0, form: 'major', hand: 'R' }, true)
    expect(st['major:0:R']).toEqual({ n: 1, ok: 1 })
  })
})
