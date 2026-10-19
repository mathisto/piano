import { describe, expect, it } from 'vitest'
import { STAGES, cardKey, cards, deck, deckSong, mastery, nextStage, record, reviewPool, weakest, whites, type Stats } from './drill'
import { clefFor, spell } from './spell'

describe('accidentals and keys', () => {
  const stage = (id: string) => STAGES.find((s) => s.id === id)!

  it('writes black keys as sharps in one stage and flats in the other, and keeps their stats apart', () => {
    const sharps = cards(stage('sharps'))
    const flats = cards(stage('flats'))
    expect(sharps).toHaveLength(13)
    expect(sharps.some((c) => c.flat)).toBe(false)
    expect(flats.filter((c) => c.flat).map((c) => c.pitches[0])).toEqual([61, 63, 66, 68, 70])
    const fs = sharps.find((c) => c.pitches[0] === 66)!
    const gb = flats.find((c) => c.pitches[0] === 66)!
    expect(cardKey(fs)).not.toBe(cardKey(gb))
    // white keys are one skill whichever stage deals them
    expect(cardKey(sharps.find((c) => c.pitches[0] === 62)!)).toBe(cardKey(flats.find((c) => c.pitches[0] === 62)!))
  })

  it('reads key stages in their own key and keeps them out of a mixed set in C', () => {
    const g = cards(stage('keys-g'))
    expect(g.map((c) => c.pitches[0])).toEqual([67, 69, 71, 72, 74, 76, 78, 79])
    expect(g.every((c) => c.fifths === 1)).toBe(true)
    const stats: Stats = {}
    for (const c of g) record(stats, cardKey(c), true, 1000)
    expect(reviewPool(stats)).toHaveLength(0)
    expect(weakest({ [cardKey(g[6])]: { n: 5, clean: 0.2, rt: 4000 } }, 1)[0].name).toMatch(/F♯5, treble clef, key of G/)
  })

  it('carries spelling into the drill song', () => {
    const f = deckSong('x', 'x', cards(stage('flats')).filter((c) => c.flat).slice(0, 4))
    expect(f.notes.every((n) => n.flat)).toBe(true)
    expect(spell(61, f.notes[0].flat ? -2 : f.fifths)).toMatchObject({ letter: 1, acc: -1 }) // D flat
    const k = deckSong('y', 'y', cards(stage('keys-f')).slice(0, 4), -1)
    expect(k.fifths).toBe(-1)
    expect(spell(70, k.fifths)).toMatchObject({ letter: 6, acc: -1 }) // B flat, no sign needed: it is in the key
  })
})

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

import { dayNum, dueCards, focus, INTERVALS, record as rec, weight as w, STAGES as ST, cards as cs, cardKey as ck } from './drill'

describe('review schedule', () => {
  it('moves a card up a box on a clean answer and down one on a miss', () => {
    const st: Stats = {}
    rec(st, 'k', true, 1000, 10)
    expect(st.k).toMatchObject({ box: 1, due: 10 + INTERVALS[1] })
    rec(st, 'k', true, 1000, 12)
    expect(st.k).toMatchObject({ box: 2, due: 12 + INTERVALS[2] })
    rec(st, 'k', false, 3000, 14)
    expect(st.k).toMatchObject({ box: 1, due: 14 + INTERVALS[1] })
    rec(st, 'k', false, 3000, 15)
    rec(st, 'k', false, 3000, 15)
    expect(st.k.box).toBe(0)
  })

  it('caps at the last interval', () => {
    const st: Stats = {}
    for (let i = 0; i < 9; i++) rec(st, 'k', true, 900, 0)
    expect(st.k.box).toBe(INTERVALS.length - 1)
  })

  it('counts cards due today, never ones not yet seen', () => {
    const stage = ST[0]
    const st: Stats = {}
    for (const c of cs(stage)) rec(st, ck(c), true, 900, 0)
    expect(dueCards(stage, st, 0)).toBe(0)
    expect(dueCards(stage, st, INTERVALS[1])).toBe(cs(stage).length)
    expect(dueCards(ST[5], st, 99)).toBe(0) // bass cards were never seen
  })

  it('deals due cards more often', () => {
    const stage = ST[0]
    const c = cs(stage)[0]
    const st: Stats = {}
    rec(st, ck(c), true, 900, 0)
    for (let i = 0; i < 6; i++) rec(st, ck(c), true, 900, 0)
    const fresh = w(st, c, stage.goalMs, 0)
    expect(w(st, c, stage.goalMs, 400)).toBeGreaterThan(fresh)
  })

  it('points the plan at due review before new material', () => {
    const st: Stats = {}
    for (const stage of ST.slice(0, 2)) for (const c of cs(stage)) for (let i = 0; i < 12; i++) rec(st, ck(c), true, 1000, 0)
    expect(focus(st, 0).reason).toBe('next')
    expect(focus(st, 100)).toMatchObject({ reason: 'due', stage: ST[0] })
  })

  it('numbers local days', () => {
    expect(dayNum(new Date(2026, 9, 19, 23, 59))).toBe(dayNum(new Date(2026, 9, 19, 0, 1)))
    expect(dayNum(new Date(2026, 9, 20))).toBe(dayNum(new Date(2026, 9, 19)) + 1)
  })
})
