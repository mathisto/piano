import { describe, expect, it } from 'vitest'
import { barList, pickPiece, playerLevel, slipped, startRate, summaryCard, type Piece } from './readthrough'
import type { Progress } from './store'

const P: Piece[] = [
  { id: 'warm', title: 'Warm-up', level: 'First notes' },
  { id: 'b1', title: 'B one', level: 'Beginner' },
  { id: 'b2', title: 'B two', level: 'Beginner' },
  { id: 'e1', title: 'E one', level: 'Elementary' },
  { id: 'i1', title: 'I one', level: 'Intermediate' },
]
const prog = (o: Record<string, Partial<Progress>>) => new Map(Object.entries(o).map(([k, v]) => [k, { plays: 0, last: 1, heat: [], ...v } as Progress]))

describe('read-through picker', () => {
  it('counts the hardest piece with a result or a clean run as your level; Beginner before that', () => {
    expect(playerLevel(P, new Map())).toBe(1)
    expect(playerLevel(P, prog({ i1: {} }))).toBe(1) // opened only
    expect(playerLevel(P, prog({ e1: { best: { score: 1, acc: 0.8, grade: 'B' } }, b1: { days: [3] } }))).toBe(2)
  })

  it('offers a new piece two levels under yours', () => {
    const r = pickPiece(P, prog({ i1: { days: [1] } }))!
    expect(r.piece.id).toBe('b1')
    expect(r.fresh).toBe(true)
    expect(r.why).toMatch(/You play Intermediate pieces.*new Beginner piece/)
  })

  it('skips pieces already played, then the nearest easier level, then harder ones', () => {
    expect(pickPiece(P, new Map())!.piece.id).toBe('b1') // nothing played: Beginner, not the warm-up
    const played = prog({ i1: { days: [1] }, b1: {}, b2: {} })
    expect(pickPiece(P, played)!.piece.id).toBe('warm')
    expect(pickPiece(P, prog({ i1: { days: [1] }, b1: {}, b2: {}, warm: {} }))!.piece.id).toBe('e1')
  })

  it('goes back to the piece played longest ago when nothing is new, and never offers the one just read', () => {
    const all = prog({ warm: { last: 5 }, b1: { last: 9 }, b2: { last: 2 }, e1: { last: 1 }, i1: { last: 3 } })
    const r = pickPiece(P, all)!
    expect(r.fresh).toBe(false)
    expect(r.piece.id).toBe('b2') // a Beginner player reads Beginner pieces: the warm-up is not a piece
    expect(pickPiece(P, all, 'b2')!.piece.id).toBe('b1')
    expect(pickPiece([], new Map())).toBeUndefined()
  })

  it('starts at 70% tempo, or your fastest clean read-through when that is slower', () => {
    expect(startRate()).toBe(0.7)
    expect(startRate(0.5)).toBe(0.5)
    expect(startRate(0.9)).toBe(0.7)
  })

  it('lists the bars that slipped', () => {
    expect(slipped([0, 1, 0, 0.5])).toEqual([1, 3])
    expect(barList([])).toBe('')
    expect(barList([2])).toBe('3')
    expect(barList([2, 6, 7])).toBe('3, 7 and 8')
  })

  it('draws a slipped bar taller, even when the heat array has holes', () => {
    const heat: number[] = []
    heat[2] = 4
    const html = summaryCard({ title: 'x', acc: 0.5, rate: 0.7, caught: 1, total: 2, wrong: 0, heat, bars: 4, worst: { a: 2, b: 3 } })
    expect(html).toContain('class="hot" style="--h:1.00"')
    expect(html).not.toContain('NaN')
    expect(html).toContain('Slipped in bar 3.')
  })
})
