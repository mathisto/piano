import { describe, expect, it } from 'vitest'
import { PLAN_LENGTHS, planOf, theoryDue } from './plan'
import { record } from './drill'
import { chordCards } from './theory-cards'

const ALL = ['warm', 'scale', 'read', 'run', 'theory', 'path', 'piece', 'again', 'fix', 'review']
const sum = (rows: { min: number }[]) => rows.reduce((a, r) => a + r.min, 0)

describe('planOf', () => {
  it('every length adds up to its minutes when everything exists', () => {
    for (const m of PLAN_LENGTHS) expect(sum(planOf(m, ALL))).toBe(m)
  })
  it('the old lengths still start with warm-up and reading', () => {
    expect(planOf(5, ALL).map((r) => r.key)).toEqual(['warm', 'read'])
    expect(planOf(10, ALL).map((r) => r.key)).toEqual(['warm', 'read', 'piece'])
  })
  it('blocks by time: 30 has a scale and a fix, 45 adds theory and a longer piece', () => {
    expect(planOf(30, ALL).map((r) => r.key)).toEqual(['warm', 'scale', 'read', 'piece', 'fix', 'again'])
    expect(planOf(45, ALL).find((r) => r.key === 'piece')!.min).toBe(20)
    expect(planOf(45, ALL).map((r) => r.key)).toContain('theory')
  })
  it('a missing step hands its minutes to the piece and a total still holds', () => {
    const rows = planOf(45, ['warm', 'scale', 'read', 'piece'])
    expect(sum(rows)).toBe(45)
    expect(rows.map((r) => r.key)).toEqual(['warm', 'scale', 'read', 'piece'])
  })
  it('falls back through alternatives', () => {
    expect(planOf(20, ['warm', 'read', 'piece', 'fix']).map((r) => r.key)).toEqual(['warm', 'read', 'piece', 'fix'])
  })
})

describe('theoryDue', () => {
  it('none until a card is due, then the deck it is in', async () => {
    expect(await theoryDue({}, 100)).toBeUndefined()
    const st = {}
    record(st, chordCards(4)[0].id, true, 1000, 90) // due day 91
    expect(await theoryDue(st, 100)).toMatchObject({ trainer: 'chords', level: 4, due: 1 })
    expect(await theoryDue(st, 90)).toBeUndefined()
  })
  it('a due key outside every deck is still none', async () => {
    expect(await theoryDue({ 'no-such-card': { due: 1 } } as never, 100)).toBeUndefined()
  })
})
