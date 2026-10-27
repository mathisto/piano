import { describe, expect, it } from 'vitest'
import { CLEAN_RUNS, checkNote, contraryLeft, explain, unchecked, keyName, cardKey, degreeName, degreeOfPitch, quizDeal, quizRecord, quizRight, derive, fourth, why, STAGES, cardsOf, fifthsOf, fingers, mastery, nextCard, parseId, passed, record, scaleSong, solid, type Card, type ScaleStats } from './scales'

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

const BLK = [1, 3, 6, 8, 10]
const pcs = (n: { p: number }[]) => n.map((x) => x.p % 12)
const hand = (s: ReturnType<typeof scaleSong>, h: 'R' | 'L') => s.notes.filter((n) => n.h === h)

describe('contrary motion', () => {
  it('C major, one octave: both hands leave middle C, the unison is one note, the left hand copies the right hand fingers', () => {
    const s = scaleSong(c({ hands: 'contrary' }), 60)
    expect(s.notes).toHaveLength(15 + 13) // two hands of 15, the unison at each end counted once
    expect(hand(s, 'R').map((n) => n.p)).toEqual([60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60])
    const L = hand(s, 'L')
    expect(L.map((n) => n.p)).toEqual([59, 57, 55, 53, 52, 50, 48, 50, 52, 53, 55, 57, 59])
    expect(L.map((n) => n.f)).toEqual([2, 3, 1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 2]) // B A G F E D C, and back
    expect(fingers(0, 'major', 'R', 1)).toEqual([...contraryLeft(0, 'major', 1).f].reverse())
  })
  it('the hands move apart, then back, in every major and harmonic minor key, one and two octaves', () => {
    for (const form of ['major', 'harmonic', 'melodic'] as const)
      for (let t = 0; t < 12; t++)
        for (const oct of [1, 2] as const) {
          const s = scaleSong(c({ tonic: t, form, hands: 'contrary', oct }), 60)
          const R = hand(s, 'R')
          const L = hand(s, 'L')
          const n = 7 * oct
          expect(R).toHaveLength(2 * n + 1)
          expect(L).toHaveLength(2 * n - 1)
          expect(R[n].p - R[0].p).toBe(12 * oct)
          expect(L[n - 1].p).toBe(R[0].p - 12 * oct) // the left hand's lowest note, as far below as the right hand's highest is above
          expect(R.every((x) => x.f! >= 1 && x.f! <= 5) && L.every((x) => x.f! >= 1 && x.f! <= 5)).toBe(true)
          // the left hand never puts its thumb on a black key where the table has it on a white one
          if (form !== 'melodic') expect(L.filter((x) => x.f === 1 && BLK.includes(x.p % 12))).toEqual([])
        }
  })
  it('melodic minor: the right hand rises with the raised 6th and 7th, the left hand falls on the natural minor', () => {
    const s = scaleSong(c({ tonic: 9, form: 'melodic', hands: 'contrary' }), 60)
    expect(hand(s, 'R').slice(0, 8).map((n) => n.p)).toEqual([57, 59, 60, 62, 64, 66, 68, 69])
    expect(hand(s, 'L').slice(0, 7).map((n) => n.p)).toEqual([55, 53, 52, 50, 48, 47, 45]) // down from A: G F E D C B A, the natural minor (the unison A is the right hand's)
  })
  it('where the left hand cannot copy (thumb on a black key) it keeps its own fingering; the copied ones are flagged unchecked', () => {
    expect(contraryLeft(5, 'major', 1)).toEqual({ f: fingers(5, 'major', 'L', 1), mirror: false, derived: false }) // F major
    expect(contraryLeft(0, 'major', 1).mirror).toBe(true)
    expect(unchecked(c({ hands: 'contrary' }))).toEqual([]) // C: the copy is the table fingering reversed
    expect(unchecked(c({ tonic: 1, form: 'harmonic', hands: 'contrary' }))).toEqual(['L']) // C sharp minor: a copy that is not in the table
    expect(unchecked(c({ tonic: 5, hands: 'contrary' }))).toEqual([])
  })
  it('the id reads back and its stats key extends the old one', () => {
    const s = scaleSong(c({ tonic: 2, hands: 'contrary', oct: 2 }), 72)
    expect(parseId(s.id)).toEqual({ card: c({ tonic: 2, hands: 'contrary', oct: 2 }), bpm: 72 })
    expect(cardKey(c({ hands: 'contrary' }))).toBe('major:0:contrary:1')
  })
})

describe('unchecked scale fingerings', () => {
  it('the quiz names only the hand it asked about', () => {
    expect(checkNote(c({ tonic: 3, form: 'harmonic' }), 'L')).toMatch(/^Fingering for the left hand/)
    expect(checkNote(c({ tonic: 3, form: 'harmonic' }), 'R')).toBe('')
  })
  it('say so in the explanation; a checked key does not', () => {
    expect(explain(c({ tonic: 3, form: 'harmonic' })).why.join(' ')).toMatch(/left hand is not yet checked against a book/)
    expect(explain(c()).why.join(' ')).not.toMatch(/checked/)
  })
})

describe('the chromatic scale', () => {
  const f = (t: number, h: 'R' | 'L', oct = 1) => fingers(t, 'chromatic', h, oct).join(' ')
  it('from C: the standard fingering, thumb on white keys, 3 on black, 1-2 and 2-1 at E F and B C', () => {
    expect(f(0, 'R')).toBe('1 3 1 3 1 2 3 1 3 1 3 1 2')
    expect(f(0, 'L')).toBe('1 3 1 3 2 1 3 1 3 1 3 2 1')
  })
  it('by rule from any note: black keys take 3, white keys 1 or 2, two octaves count 25', () => {
    for (let t = 0; t < 12; t++)
      for (const h of ['R', 'L'] as const) {
        const fs = fingers(t, 'chromatic', h, 2)
        expect(fs).toHaveLength(25)
        fs.forEach((x, i) => expect(BLK.includes((t + i) % 12) ? x === 3 : x === 1 || x === 2).toBe(true))
        // two white keys in a row are never both the thumb
        fs.slice(1).forEach((x, i) => expect(!(x === 1 && fs[i] === 1 && !BLK.includes((t + i) % 12) && !BLK.includes((t + i + 1) % 12))).toBe(true))
      }
  })
  it('starting on a black key: D flat right hand begins on 3', () => {
    expect(f(1, 'R').split(' ')[0]).toBe('3')
  })
  it('sharps going up, flats coming down; hands an octave apart; no key signature', () => {
    const s = scaleSong(c({ form: 'chromatic', hands: 'both', oct: 2 }), 60)
    expect(s.fifths).toBe(0)
    expect(s.notes).toHaveLength(2 * 49)
    const R = hand(s, 'R')
    expect(R.slice(0, 25).map((n) => n.p)).toEqual(Array.from({ length: 25 }, (_, i) => 60 + i))
    expect(R.slice(0, 25).filter((n) => BLK.includes(n.p % 12)).every((n) => n.acc === 1 && !n.flat)).toBe(true)
    expect(R.slice(25).filter((n) => BLK.includes(n.p % 12)).every((n) => n.acc === -1 && n.flat)).toBe(true)
    expect(hand(s, 'L')[0].p).toBe(48)
  })
  it('contrary motion: the left hand goes down from the same note', () => {
    const s = scaleSong(c({ tonic: 2, form: 'chromatic', hands: 'contrary' }), 60)
    expect(hand(s, 'L').slice(0, 3).map((n) => n.p)).toEqual([61, 60, 59]) // from D down; the unison itself belongs to the right hand
    expect(hand(s, 'R')[0].p).toBe(62)
  })
  it('names: C chromatic', () => {
    expect(keyName(1, 'chromatic')).toBe('C♯ chromatic')
  })
})

describe('arpeggios', () => {
  const FORMS = ['arpMajor', 'arpMinor', 'dom7', 'dim7'] as const
  const per = { arpMajor: 3, arpMinor: 3, dom7: 4, dim7: 4 }
  it('every root, hand and octave count: the right number of notes, fingers 1 to 5, thumb on black only where no other rule fits', () => {
    for (const form of FORMS)
      for (let t = 0; t < 12; t++)
        for (const oct of [1, 2] as const)
          for (const h of ['R', 'L'] as const) {
            const fs = fingers(t, form, h, oct)
            expect(fs).toHaveLength(per[form] * oct + 1)
            expect(fs.every((x) => x >= 1 && x <= 5)).toBe(true)
            const pcsUp = fs.map((_, i) => (t + [0, 4, 7, 10][i % per[form]]) % 12) // only used for major/dom7 below
            if ((form === 'arpMajor' && t !== 6) || form === 'dom7') expect(fs.filter((x, i) => x === 1 && BLK.includes(pcsUp[i]))).toEqual([]) // no thumb on a black key, except F sharp major, which is black from root to fifth
            if (h === 'L') expect(fs[0]).not.toBe(1) // the left hand does not start on its thumb
          }
  })
  it('white-key shapes: C major right hand 1 2 3 1 2 3 5, left hand 5 4 2 1 2 4 5 (one octave 5 4 2 1)', () => {
    expect(fingers(0, 'arpMajor', 'R', 2)).toEqual([1, 2, 3, 1, 2, 3, 5])
    expect(fingers(0, 'arpMajor', 'L', 2)).toEqual([5, 4, 2, 1, 2, 4, 5])
    expect(fingers(0, 'arpMajor', 'L', 1)).toEqual([5, 4, 2, 1])
    expect(fingers(7, 'dom7', 'R', 1)).toEqual([1, 2, 3, 4, 5])
  })
  it('black-key roots avoid the thumb: D flat major right hand puts a long finger on D flat and A flat', () => {
    const fs = fingers(1, 'arpMajor', 'R', 1)
    expect(fs[0]).not.toBe(1)
    expect(fs[1]).toBe(1) // F, the white key between them
  })
  it('the song: 13 notes for two octaves of a triad, up and down; 17 for a seventh', () => {
    expect(scaleSong(c({ form: 'arpMajor', oct: 2 }), 60).notes.map((n) => n.p)).toEqual([60, 64, 67, 72, 76, 79, 84, 79, 76, 72, 67, 64, 60])
    expect(scaleSong(c({ form: 'dom7', oct: 2 }), 60).notes).toHaveLength(17)
    expect(scaleSong(c({ form: 'dim7' }), 60).notes.map((n) => n.p)).toEqual([60, 63, 66, 69, 72, 69, 66, 63, 60])
    expect(scaleSong(c({ form: 'arpMinor', tonic: 9 }), 60).notes.slice(0, 4).map((n) => n.p)).toEqual([69, 72, 76, 81])
  })
  it('every arpeggio is unchecked, in both hands, and says so', () => {
    for (const form of FORMS) expect(unchecked(c({ form, tonic: 4, hands: 'both' }))).toEqual(['R', 'L'])
    expect(explain(c({ form: 'arpMajor' })).why.join(' ')).toMatch(/thumb/)
    expect(explain(c({ form: 'arpMajor' })).why.join(' ')).toMatch(/rule-derived, not yet checked against a book/)
    expect(explain(c({ form: 'arpMajor' })).why.join(' ')).not.toMatch(/standard fingering/)
  })
  it('keys: key signatures and names', () => {
    expect(fifthsOf(0, 'dom7')).toBe(-1) // C7 is the dominant of F
    expect(fifthsOf(9, 'arpMinor')).toBe(0)
    expect(keyName(0, 'dom7')).toBe('C dominant 7th arpeggio')
    expect(keyName(3, 'arpMajor')).toBe('E♭ major arpeggio')
  })
})

describe('stages and stats still fit the old ones', () => {
  it('the first six stages are as they were; the new ones come after', () => {
    expect(STAGES.slice(0, 6).map((s) => s.id)).toEqual(['s1', 's2', 's3', 's4', 's5', 's6'])
    expect(STAGES.slice(6).map((s) => s.id)).toEqual(['s7', 's8', 's9', 's10', 's11', 's12', 's13'])
    expect(cardsOf(STAGES[4])).toHaveLength(24)
  })
  it('old stats keep their key and meaning; a new kind of scale just adds a key', () => {
    const old: ScaleStats = { 'major:0:R:1': { streak: 1, best: 60, n: 4 } }
    expect(solid(old, c(), 60)).toBe(true)
    record(old, c({ form: 'chromatic', hands: 'contrary' }), 60, true)
    expect(Object.keys(old).sort()).toEqual(['chromatic:0:contrary:1', 'major:0:R:1'])
    expect(old['major:0:R:1']).toEqual({ streak: 1, best: 60, n: 4 })
  })
  it('every card of every stage plays: ids read back and notes are in range', () => {
    for (const st of STAGES)
      for (const card of cardsOf(st)) {
        const s = scaleSong(card, st.bpm)
        expect(parseId(s.id)?.card).toEqual(card)
        expect(s.notes.length).toBeGreaterThan(5)
        expect(s.lo).toBeGreaterThanOrEqual(21)
        expect(s.hi).toBeLessThanOrEqual(108)
        expect(s.notes.every((n) => n.f! >= 1 && n.f! <= 5)).toBe(true)
      }
  })
})
