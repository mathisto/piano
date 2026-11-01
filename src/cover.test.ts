import { expect, it } from 'vitest'
import { COVER, cropOf, headerOf, incipit, keyText, pieceMeta } from './cover'
import { fromSpec } from './song'

const body = { w: 134, h: 38 }
const grand = [24, 34, 44, 54, 64, 94, 104, 114, 124, 134] // GRAND's staff lines
const solo = [32, 42, 52, 62, 72]

it('the header names the composer and catalogue number, and the key as the major and minor its signature serves', () => {
  expect(headerOf(pieceMeta('Johann Sebastian Bach', 'BWV 846', { fifths: 0, meter: '4/4' }))).toEqual({ l: 'Bach · BWV 846', r: 'C / Am · 4/4' })
  expect(headerOf(pieceMeta('Ludwig van Beethoven', undefined))).toEqual({ l: 'Beethoven', r: '' }) // no facts: nothing is invented
  expect(headerOf({ by: 'MIDI', fifths: -3, meter: '3/4' }).r).toBe('E♭ / Cm · 3/4')
  expect(keyText(2)).toBe('D / Bm')
  expect(keyText(9)).toBe('')
})

it('keeps only the opening bars of a score', () => {
  const s = fromSpec({ id: 'x', title: 'x', bpm: 60, fifths: 0, rh: 'C4:4 D4:4 E4:4 F4:4 G4:4', lh: 'R:20' })
  const i = incipit(s)
  expect(i.bars).toHaveLength(COVER.keep)
  expect(i.notes.every((n) => n.bar < COVER.keep)).toBe(true)
})

it('a small box shows the staff the notes are on, a tall one the grand staff, and the window slides to the notes but never off the staff', () => {
  const small = cropOf(grand, [70, 80], body, 0.5) // treble staff leads on a tie
  expect(small.staff).toBe('treble')
  expect(small.y).toBeLessThanOrEqual(24 - 2)
  expect(cropOf(grand, [110, 120, 128], body, 0.5).staff).toBe('bass')
  expect(cropOf(grand, [], { w: 260, h: 88 }, 0.62).staff).toBe('grand')
  const high = cropOf(grand, [-20, -10, 30], body, 0.5) // ledger lines above the treble staff: the window goes up, with the staff's top still in it
  expect(high.y).toBeLessThan(small.y)
  expect(high.y).toBeLessThanOrEqual(24 - 2)
  expect(high.y + high.h).toBeGreaterThan(64)
  const one = cropOf(solo, [100], body, 0.5) // a notes-far-below solo staff: the staff stays in view
  expect(one.staff).toBe('solo')
  expect(one.y + one.h).toBeGreaterThanOrEqual(72 + 2)
})
