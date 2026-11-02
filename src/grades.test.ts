import { describe, expect, it } from 'vitest'
import { REQS, nextOf, path, standardLevel, type Ctx, type Level } from './grades'
import { STAGES as DRILL, cards, cardKey, record as rec, type Stats } from './drill'
import { STAGES as SCALES, cardsOf, cardKey as skey } from './scales'
import { chordCards } from './theory-cards'

const empty = (): Ctx => ({ scales: {}, drill: {}, tech: {}, theory: {}, day: 100 })

describe('grade path', () => {
  it('has five levels, no board names, and lists unbuilt requirements as coming', () => {
    const p = path(empty())
    expect(p.map((l) => l.level)).toEqual([1, 2, 3, 4, 5])
    expect(JSON.stringify(REQS)).not.toMatch(/abrsm|rcm|trinity|grade/i)
    expect(p.flatMap((l) => l.rows).filter((r) => r.state === 'coming').every((r) => r.pct === 0 && !r.start)).toBe(true)
    expect(p.every((l) => l.rows.every((r) => r.state === 'coming' || r.state === 'new'))).toBe(true)
  })

  it('starts at the first requirement and moves on when it is solid', () => {
    expect(nextOf(path(empty()))!.name).toMatch(/^Scales: the easy keys/)
    const c = empty()
    for (const k of cardsOf(SCALES[0])) c.scales[skey(k)] = { streak: 0, best: 200, n: 3 }
    const p = path(c)
    expect(p[0].rows[0].state).toBe('solid')
    expect(p[0].solid).toBe(1)
    expect(nextOf(p)!.name).toBe('Five-finger patterns')
  })

  it('a stage touched but not solid is learning', () => {
    const c = empty()
    c.scales[skey(cardsOf(SCALES[0])[0])] = { streak: 1, best: 0, n: 1 }
    expect(path(c)[0].rows[0].state).toBe('learning')
  })

  it('reading counts from drill stats', () => {
    const c = empty()
    const st: Stats = {}
    for (const s of DRILL.filter((x) => ['t-land', 't-five', 'b-land', 'b-five'].includes(x.id))) for (const k of cards(s)) for (let i = 0; i < 12; i++) rec(st, cardKey(k), true, 1000)
    c.drill = st
    expect(path(c)[0].rows.find((r) => r.name.startsWith('Reading'))!.state).toBe('solid')
  })

  it('sets Auto from the lower of the reading frontier and repertoire ceiling', () => {
    const levels = (reading: number): Level[] =>
      [1, 2, 3, 4, 5].map((level) => ({
        level,
        rows: [{ level, name: `Read ${level}`, detail: '', start: { kind: 'read', id: 'x' }, state: level < reading ? 'solid' : 'new', pct: 0 }],
        solid: level < reading ? 1 : 0,
        total: 1,
        coming: 0,
      }))
    expect(standardLevel(levels(4), [1, 2, 3])).toBe(1) // fewer than three Ready together: song level 1
    expect(standardLevel(levels(4), [3, 3, 3])).toBe(3)
    expect(standardLevel(levels(2), [4, 4, 4])).toBe(2)
    expect(standardLevel(levels(5), [5, 5, 5])).toBe(5)
  })

  it('theory counts cards answered twice, mostly first try', () => {
    const c = empty()
    const deck = chordCards(1)
    for (const k of deck) c.theory[k.id] = { n: 2, clean: 0.9, rt: 2000 }
    expect(path(c)[0].rows.find((r) => r.name === 'Triads on the white keys')!.state).toBe('solid')
    c.theory[deck[0].id] = { n: 1, clean: 1, rt: 1 }
    expect(path(c)[0].rows.find((r) => r.name === 'Triads on the white keys')!.state).toBe('solid') // 80% is enough
  })
})
