import { expect, it } from 'vitest'
import type { Piece } from './catalog-types'
import { COVER, cropOf, exerciseMeta, fileMeta, incipit, keyName, leftOf, pieceMeta, rightOf, starterMeta, titleFit } from './cover'
import { exercise } from './technique'
import { scaleSong } from './scales'
import { fromSpec } from './song'
import { STARTERS } from './starters'

const grand = [24, 34, 44, 54, 64, 94, 104, 114, 124, 134] // GRAND's staff lines
const solo = [32, 42, 52, 62, 72]
const thumb = { w: COVER.thumb.w - 2 * COVER.thumb.m, h: COVER.thumb.ih }
const piece = (o: Partial<Piece>) => ({ id: 'x', title: 'Prelude in C', opus: 'BWV 846', fifths: 0, meter: '4/4', bars: 35, grade: 3, ...o }) as Piece

it('the header names the composer and catalogue left, the key and metre right', () => {
  const m = pieceMeta(piece({ mode: 'major' }), 'Johann Sebastian Bach')
  expect(leftOf(m)).toBe('Bach · BWV 846')
  expect(rightOf(m.mode && keyName(m.fifths!, m.mode), m.meter)).toBe('C major · 4/4')
  expect(leftOf(pieceMeta(piece({ opus: undefined }), 'Ludwig van Beethoven'))).toBe('Beethoven')
})

it('names a key only when the source states its mode, in the right spelling', () => {
  expect(keyName(-2, 'major')).toBe('B♭ major')
  expect(keyName(3, 'minor')).toBe('F♯ minor')
  expect(keyName(-4, 'minor')).toBe('F minor')
  const m = pieceMeta(piece({ fifths: -2 }), 'Bach') // the catalogue has the signature, not the mode: the signature is engraved, the key is not claimed
  expect(m.mode).toBeUndefined()
  expect(rightOf(undefined, m.meter)).toBe('4/4')
  expect(rightOf(undefined, undefined)).toBe('')
  expect(starterMeta(STARTERS.find((s) => s.spec.id === 'starter-greensleeves')!).mode).toBe('minor') // an arrangement's own spec states it
})

it('a score states its mode in the MIDI key event, the MusicXML <mode> or the starter spec, and an estimate states nothing', () => {
  const s = fromSpec({ id: 'x', title: 'x', bpm: 60, fifths: 1, mode: 'minor', rh: 'E4:4', lh: 'R:4' })
  expect(s.stated).toEqual({ mode: 'minor', meter: true })
  expect(fromSpec({ id: 'y', title: 'y', bpm: 60, fifths: 0, rh: 'C4:4', lh: 'R:4' }).stated?.mode).toBeUndefined()
})

it('a local import says what it is and "Key —", "Metre —" for what the file does not state', () => {
  const m = fileMeta('midi', '', new Date(2026, 10, 1).getTime())
  expect(leftOf(m)).toBe('LOCAL IMPORT · MIDI')
  expect(m.title).toBe('Untitled MIDI')
  expect(fileMeta('xml', '  ', 0).title).toBe('Untitled score')
  expect(leftOf(fileMeta('xml', 'Sonatina', 0))).toBe('LOCAL IMPORT · MUSICXML')
  expect(fileMeta('midi', 'Sonatina', 0).title).toBe('Sonatina')
  expect(m.sub).toBe(new Date(2026, 10, 1).toLocaleDateString(undefined, { dateStyle: 'long' })) // the localized import date
  expect(m.level).toBeUndefined() // a file has no difficulty rule
  expect(rightOf(undefined, undefined, true)).toBe('KEY — · METRE —')
  expect(rightOf('A minor', undefined, true)).toBe('A minor · METRE —')
  expect(rightOf(undefined, '3/4', true)).toBe('KEY — · 3/4')
})

it('an exercise the app made names its kind, key and metre, not a local import', () => {
  const t = exercise({ pattern: 'five', tonic: 9, minor: true, dyn: 'even', hands: 'R', bpm: 80 })
  const m = exerciseMeta(t.id, t)
  expect([leftOf(m), m.mode, m.meter]).toEqual(['Technique', 'minor', '4/4'])
  expect(keyName(m.fifths!, m.mode!)).toBe('A minor')
  const sc = scaleSong({ form: 'major', tonic: 7, hands: 'R', oct: 1 }, 60)
  expect([leftOf(exerciseMeta(sc.id, sc)), exerciseMeta(sc.id, sc).mode]).toEqual(['Scale', 'major'])
  expect(exerciseMeta('scale:chromatic:0:R:1:60', sc).mode).toBeUndefined() // a chromatic run has no key to name
  const r = exercise({ pattern: 'rhythm', tonic: 0, dyn: 'even', hands: 'R', bpm: 80, level: 1 })
  expect(exerciseMeta(r.id, r).mode).toBeUndefined()
})

it('difficulty is the catalogue grade, or the starter level mapped to 1-5', () => {
  expect(pieceMeta(piece({ grade: 4 }), 'Bach').level).toBe(4)
  expect(pieceMeta(piece({ grade: 4, gradeOverride: 2 }), 'Bach').level).toBe(2)
  expect(STARTERS.map((s) => starterMeta(s).level)).toEqual([1, 1, 1, 2, 2, 2, 3, 3])
})

it('a library piece moves its movement to the secondary line, a starter its level', () => {
  const m = pieceMeta(piece({ title: 'Sonatina in C, Op. 20 No. 1: Allegro' }), 'Kuhlau')
  expect([m.title, m.sub]).toEqual(['Sonatina in C, Op. 20 No. 1', 'Allegro'])
  expect(starterMeta(STARTERS[1]).sub).toBe('Beginner')
})

it('a long title shrinks to two lines, never below 70% of the spec size, and drops the secondary line when it takes both', () => {
  expect(titleFit('Ode to Joy', 'card')).toEqual({ px: 17, one: true })
  const long = titleFit('Fantasia in F minor for piano four hands, a very long title indeed', 'card')
  expect(long.px).toBeLessThan(17)
  expect(long.px).toBeGreaterThanOrEqual(17 * 0.7 - 0.1)
  expect(long.one).toBe(false)
})

it('the card and start card are 3:2 (the spec lists the thumbnail as 56 x 42, which is 4:3), with the spec least staff sizes (a staff space is 10 layout units)', () => {
  for (const c of [COVER.card, COVER.start]) expect(c.w / c.h).toBeCloseTo(1.5, 5)
  expect([COVER.thumb.w, COVER.thumb.h]).toEqual([56, 42])
  expect([COVER.thumb, COVER.card, COVER.start].map((c) => c.scale * 10)).toEqual([2.5, 5, 8])
  expect(COVER.start.iy + COVER.start.ih).toBeLessThan(COVER.start.h * 0.9) // the incipit's box: the lower 52% of the height, above the margin
  expect(COVER.start.ih / COVER.start.h).toBeCloseTo(0.52, 2)
})

it('keeps only the opening bars of a score', () => {
  const s = fromSpec({ id: 'x', title: 'x', bpm: 60, fifths: 0, rh: 'C4:4 D4:4 E4:4 F4:4 G4:4', lh: 'R:20' })
  const i = incipit(s)
  expect(i.bars).toHaveLength(COVER.keep)
  expect(i.notes.every((n) => n.bar < COVER.keep)).toBe(true)
})

it('the window shows the whole grand staff, slides to ledger-line notes and never leaves the staff', () => {
  const home = cropOf(grand, [70, 80], thumb, COVER.thumb.scale)
  expect(home.staff).toBe('grand')
  expect(home.y).toBeLessThanOrEqual(24 - 2)
  expect(home.y + home.h).toBeGreaterThanOrEqual(134 + 2)
  const high = cropOf(grand, [-20, -10, 30], thumb, COVER.thumb.scale) // ledger lines above the treble staff: the window goes up, with the staff's top still in it
  expect(high.y).toBeLessThan(home.y)
  expect(high.y).toBeLessThanOrEqual(24 - 2)
  const card = cropOf(grand, [], { w: 260, h: COVER.card.ih }, COVER.card.scale)
  expect(card.y).toBeLessThan(24)
  expect(card.y + card.h).toBeGreaterThan(134)
  const one = cropOf(solo, [100], { w: 260, h: COVER.card.ih }, COVER.card.scale * COVER.solo) // a notes-far-below single line: the staff stays in view
  expect(one.staff).toBe('solo')
  expect(one.y + one.h).toBeGreaterThanOrEqual(72 + 2)
})
