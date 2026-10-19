import { describe, expect, it } from 'vitest'
import { nameChord } from './chord'

const n = (...p: number[]) => nameChord(p)?.name

describe('chord naming', () => {
  it('names triads in any inversion', () => {
    expect(n(60, 64, 67)).toBe('C')
    expect(n(64, 67, 72)).toBe('C/E') // first inversion
    expect(n(67, 72, 76)).toBe('C/G') // second inversion
    expect(n(57, 60, 64)).toBe('Am')
    expect(n(62, 65, 69)).toBe('Dm')
    expect(n(59, 62, 65)).toBe('B' + 'dim')
    expect(n(60, 64, 68)).toBe('Caug')
  })
  it('names sevenths, sus and sixths', () => {
    expect(n(55, 59, 62, 65)).toBe('G7')
    expect(n(60, 64, 67, 71)).toBe('Cmaj7')
    expect(n(62, 65, 69, 72)).toBe('Dm7')
    expect(n(60, 65, 67)).toBe('Csus4')
    expect(n(60, 64, 67, 69)).toBe('C6')
  })
  it('names intervals and single notes, and spells flats in flat keys', () => {
    expect(n(60, 67)).toBe('fifth')
    expect(n(60, 64)).toBe('major third')
    expect(n(60, 72)).toBe('octave')
    expect(n(61)).toBe('C♯4')
    expect(nameChord([61], -2)?.name).toBe('D♭4')
    expect(nameChord([58, 62, 65], -2)?.name).toBe('B♭') // B flat major in a flat key
    expect(nameChord([58, 62, 65], 0)?.name).toBe('A♯')
  })
  it('falls back to the notes when nothing fits, and to null when nothing is held', () => {
    expect(n(60, 61, 62, 63)).toBe('C C♯ D D♯')
    expect(nameChord([])).toBeNull()
  })
})
