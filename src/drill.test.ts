import { describe, expect, it } from 'vitest'
import { STAGES, cardKey, cards, deck, deckSong, mastery, nextStage, record, weakest, whites, type Stats } from './drill'
import { clefFor } from './spell'

describe('drill', () => {
  it('lists white keys', () => {
    expect(whites(60, 72)).toEqual([60, 62, 64, 65, 67, 69, 71, 72])
  })

  it('deals every stage a non-empty card set with the right sizes', () => {
    for (const st of STAGES) {
      const cs = cards(st)
      expect(cs.length, st.id).toBeGreaterThan(0)
      for (const c of cs) {
        expect(c.pitches).toHaveLength(st.size)
        expect([...c.pitches].sort((a, b) => a - b)).toEqual(c.pitches)
      }
    }
    // triads are thirds on white keys: C E G, D F A
    const t = cards(STAGES.find((s) => s.id === 'triads')!)
    expect(t[0].pitches).toEqual([60, 64, 67])
    expect(t[1].pitches).toEqual([62, 65, 69])
  })

  it('keeps each card on the staff its stage names', () => {
    for (const st of STAGES.filter((s) => s.id.startsWith('t-'))) for (const c of cards(st)) expect(clefFor(c.pitches[0], c.hand)).toBe('treble')
    for (const st of STAGES.filter((s) => s.id.startsWith('b-'))) for (const c of cards(st)) expect(clefFor(c.pitches[0], c.hand)).toBe('bass')
  })

  it('never repeats a card back to back and favours weak cards', () => {
    const pool = cards(STAGES[1])
    const stats: Stats = {}
    for (const c of pool) for (let k = 0; k < 4; k++) record(stats, cardKey(c), true, 800)
    record(stats, cardKey(pool[2]), false, 5000)
    record(stats, cardKey(pool[2]), false, 5000)
    let i = 0
    const rnd = () => ((i = (i * 9301 + 49297) % 233280) / 233280)
    const d = deck(pool, stats, 2500, 400, rnd)
    for (let k = 1; k < d.length; k++) expect(d[k]).not.toBe(d[k - 1])
    const weak = d.filter((c) => c === pool[2]).length
    const other = d.filter((c) => c === pool[0]).length
    expect(weak).toBeGreaterThan(other * 1.5)
  })

  it('measures mastery from first-try accuracy and speed', () => {
    const st = STAGES[0]
    const stats: Stats = {}
    expect(mastery(st, stats)).toMatchObject({ pct: 0, solid: false })
    for (const c of cards(st)) for (let i = 0; i < 12; i++) record(stats, cardKey(c), true, 1200)
    expect(mastery(st, stats)).toMatchObject({ pct: 1, solid: true })
    expect(nextStage(stats).id).toBe('t-five')
    for (const c of cards(st)) for (let i = 0; i < 6; i++) record(stats, cardKey(c), true, 9000)
    expect(mastery(st, stats).solid).toBe(false)
    expect(weakest(stats, 1)).toHaveLength(1)
  })

  it('turns a deck into a one-card-per-beat song with the right hands', () => {
    const d = [{ pitches: [60], hand: 'L' as const }, { pitches: [64, 67], hand: 'R' as const }, { pitches: [48], hand: 'L' as const }, { pitches: [72], hand: 'R' as const }, { pitches: [60], hand: 'R' as const }]
    const s = deckSong('x', 'x', d)
    expect(s.bars).toHaveLength(2)
    expect(s.notes).toHaveLength(6)
    expect(s.notes[0]).toMatchObject({ p: 60, h: 'L', t: 0, bar: 0 })
    expect(s.notes.at(-1)).toMatchObject({ bar: 1 })
  })
})
