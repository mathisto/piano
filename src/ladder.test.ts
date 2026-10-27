import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Catalog } from './catalog-types'
import { ladderState } from './ladder'
import { LADDER } from './ladder-data'
import type { Progress } from './store'

const prog = (o: Partial<Progress>): Progress => ({ plays: 0, last: 0, heat: [], ...o })
const info = (id: string) => (id === 'gone' ? undefined : { title: id, composer: 'X' })
const rungs = [
  { level: 1, id: 'a', why: '' },
  { level: 1, id: 'b', why: '' },
  { level: 1, id: 'gone', why: '' },
  { level: 2, id: 'c', why: '' },
]

describe('ladderState', () => {
  it('is new, learning once played, ready on two clean days', () => {
    const p = new Map([
      ['lib:a', prog({ plays: 3, days: [5] })],
      ['lib:b', prog({ plays: 4, days: [5, 6] })],
    ])
    const l = ladderState(rungs, p, info)
    expect(l.map((x) => x.pieces.map((y) => y.state))).toEqual([['learning', 'ready'], ['new'], [], [], []])
    expect(l.map((x) => x.ready)).toEqual([1, 0, 0, 0, 0])
  })
  it('leaves out a piece the catalogue does not know', () => {
    expect(ladderState(rungs, new Map(), info)[0].pieces.map((p) => p.id)).toEqual(['a', 'b'])
  })
})

describe('the ladder data', () => {
  const file = process.env.LIBRARY_CATALOG ?? '.cache/library/out-final/catalog.json'
  const bundled = new Set((JSON.parse(readFileSync('public/library/manifest.json', 'utf8')) as { id: string }[]).map((m) => m.id))
  it('has 2 to 4 distinct pieces on every level', () => {
    for (const l of [1, 2, 3, 4, 5]) expect([2, 3, 4]).toContain(LADDER.filter((r) => r.level === l).length)
    expect(new Set(LADDER.map((r) => r.id)).size).toBe(LADDER.length)
  })
  it('names pieces that exist, and climbs in catalogue grade', () => {
    if (!existsSync(file)) return void expect(LADDER.filter((r) => bundled.has(r.id)).length).toBeGreaterThan(0) // no corpus catalogue here: only the bundled ids can be checked
    const cat = JSON.parse(readFileSync(file, 'utf8')) as Catalog
    const grade = new Map(cat.pieces.map((p) => [p.id, p.gradeOverride ?? p.grade]))
    for (const r of LADDER) expect(grade.has(r.id) || bundled.has(r.id), r.id).toBe(true)
    const gs = [1, 2, 3, 4, 5].map((l) => LADDER.filter((r) => r.level === l).map((r) => grade.get(r.id)!))
    gs.forEach((g, i) => g.forEach((x) => expect(Math.abs(x - (i + 1)), `level ${i + 1}`).toBeLessThanOrEqual(1)))
    gs.slice(1).forEach((g, i) => expect(Math.min(...g), `level ${i + 2}`).toBeGreaterThanOrEqual(Math.min(...gs[i])))
  })
})
