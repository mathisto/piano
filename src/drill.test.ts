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
        expect(c.pitches).toHaveLength(c.seq ? 4 : st.size)
        if (!c.seq) expect([...c.pitches].sort((a, b) => a - b)).toEqual(c.pitches) // a fragment is in playing order
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
    expect(dueCards(ST.find((s) => s.id === 'b-land')!, st, 99)).toBe(0) // bass cards were never seen
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

import { layout, noteCards } from './drill'

describe('melody stages', () => {
  const tune = STAGES.find((s) => s.id === 'tune-c')!

  it('deals four-note fragments, each a card of its own', () => {
    const all = cards(tune)
    expect(all.length).toBeGreaterThan(20)
    expect(all.every((c) => c.seq && c.pitches.length === 4)).toBe(true)
    expect(new Set(all.map(cardKey)).size).toBe(all.length)
  })

  it('keeps every fragment inside the scale and in the key', () => {
    const g = STAGES.find((s) => s.id === 'tune-g')!
    expect(cards(g).every((c) => c.fifths === 1 && c.pitches.every((p) => [67, 69, 71, 72, 74, 76, 78, 79].includes(p) || p > 60))).toBe(true)
  })

  it('lays a fragment on consecutive beats and a chord card on one', () => {
    const d = [cards(tune)[0], cards(STAGES.find((s) => s.id === 'triads')!)[0]]
    const l = layout(d)
    expect(l.filter((x) => x.card === 0).map((x) => x.beat)).toEqual([0, 1, 2, 3])
    expect(l.filter((x) => x.card === 1).map((x) => x.beat)).toEqual([4, 4, 4])
  })

  it('maps song notes back to their cards', () => {
    const d = [cards(tune)[0], cards(tune)[1]]
    const song = deckSong('x', 't', d)
    expect(noteCards(d, song)).toEqual([0, 0, 0, 0, 1, 1, 1, 1])
  })

  it('needs fewer sightings per fragment than a single note to count as mastered', () => {
    const st: Stats = {}
    for (const c of cards(tune)) for (let i = 0; i < 6; i++) record(st, cardKey(c), true, 1500)
    expect(mastery(tune, st).solid).toBe(true)
  })
})

import { fluentMs, stageDeck } from './drill'
import { BOTTOM_STEP } from './spell'

describe('curriculum fill', () => {
  const stage = (id: string) => STAGES.find((s) => s.id === id)!
  // the stages before the fill: their ids and cards are stored progress
  const OLD = ['t-land', 't-five', 't-oct', 't-staff', 't-high', 'b-land', 'b-five', 'b-oct', 'b-staff', 'b-low', 'grand', 'sharps', 'flats', 'keys-g', 'keys-f', 'tune-c', 'tune-g', 'tune-f', 'tune-b', 'ints', 'triads']
  const NEW = STAGES.filter((s) => !OLD.includes(s.id))
  const ledgers = (p: number, c: ReturnType<typeof cards>[number]) => {
    const clef = clefFor(p, c.hand)
    const sp = spell(p, c.flat ? -2 : c.fifths ?? 0, c.sharp ? 1 : undefined)
    const bottom = BOTTOM_STEP[clef]
    return Math.max(0, Math.floor((sp.step - (bottom + 8)) / 2), Math.floor((bottom - sp.step) / 2))
  }
  const most = (id: string) => Math.max(...cards(stage(id)).map((c) => ledgers(c.pitches[0], c)))

  it('keeps every old stage id and its cards', () => {
    expect(OLD.every((id) => STAGES.some((s) => s.id === id))).toBe(true)
    expect(cards(stage('t-high')).map(cardKey)).toEqual(whites(60, 84).map((p) => `1:treble:${p}`))
    expect(new Set(STAGES.map((s) => s.id)).size).toBe(STAGES.length)
  })

  it('ledger stages hold one, then two ledger lines; anchors no more than two; octave signs need four or more', () => {
    expect([most('t-led1'), most('b-led1')]).toEqual([1, 1])
    expect([most('t-led2'), most('b-led2')]).toEqual([2, 2])
    expect([most('t-anch'), most('b-anch')]).toEqual([2, 2])
    for (const st of NEW.filter((s) => s.id !== 'oct8')) expect(most(st.id), st.id).toBeLessThanOrEqual(2)
    // past three ledger lines the layout writes 8va or 8vb, so every card here is read under one
    expect(cards(stage('oct8')).every((c) => ledgers(c.pitches[0], c) >= 4)).toBe(true)
  })

  it('pins each card to its hand and clef, inside the keyboard', () => {
    for (const st of NEW) for (const c of cards(st)) expect(c.pitches.every((p) => p >= 21 && p <= 108), st.id).toBe(true)
    expect(cards(stage('t-led2')).every((c) => c.hand === 'R' && clefFor(c.pitches[0], c.hand) === 'treble')).toBe(true)
    expect(cards(stage('b-led1')).every((c) => c.hand === 'L' && clefFor(c.pitches[0], c.hand) === 'bass')).toBe(true)
    expect(cards(stage('oct8')).map((c) => c.hand)).toEqual(['L', 'L', 'L', 'L', 'R', 'R', 'R', 'R', 'R'])
  })

  it('a switching set alternates treble and bass card by card', () => {
    let i = 3
    const rnd = () => ((i = (i * 9301 + 49297) % 233280) / 233280)
    const d = stageDeck(stage('mixed'), {}, 3000, 24, rnd)
    expect(d).toHaveLength(24)
    for (let k = 1; k < d.length; k++) expect(clefFor(d[k].pitches[0], d[k].hand)).not.toBe(clefFor(d[k - 1].pitches[0], d[k - 1].hand))
  })

  it('reads keys and minors with the right signs', () => {
    expect(cards(stage('keys-d')).every((c) => c.fifths === 2 && [2, 4, 6, 7, 9, 11, 1].includes(c.pitches[0] % 12))).toBe(true)
    expect(cards(stage('keys-am')).map((c) => c.pitches[0] % 12)).toEqual(expect.arrayContaining([7, 8])) // G and G sharp
    const dm = cards(stage('keys-dm'))
    const song = deckSong('x', 'x', dm, -1)
    const cs = song.notes.filter((n) => n.p % 12 === 1)
    expect(cs).toHaveLength(2)
    expect(cs.map((n) => spell(n.p, song.fifths, n.acc))).toEqual(cs.map(() => expect.objectContaining({ letter: 0, acc: 1 }))) // C sharp, not D flat
    expect(spell(70, -1).acc).toBe(-1) // B flat comes from the signature
  })

  it('old stats leave new stages at 0, or unsolid where they share notes with the reach stages', () => {
    const st: Stats = {}
    for (const id of OLD) for (const c of cards(stage(id))) for (let k = 0; k < 12; k++) record(st, cardKey(c), true, 1000)
    for (const id of OLD) expect(mastery(stage(id), st).solid, id).toBe(true)
    for (const id of ['mixed', 'oct8', 'tune-a1', 'tune-a2', 'keys-d', 'keys-bb', 'keys-a', 'keys-eb']) expect(mastery(stage(id), st).pct, id).toBe(0)
    // the anchors are the reach stages' own notes: the same card is the same skill wherever it is dealt
    for (const s of NEW.filter((s) => !s.id.endsWith('-anch'))) expect(mastery(s, st).solid, s.id).toBe(false)
  })

  it('names a weak tune without garbage', () => {
    const k = cardKey(cards(stage('tune-g'))[0])
    expect(weakest({ [k]: { n: 5, clean: 0.2, rt: 4000 } }, 1)[0].name).toBe('tune from G4, key of G')
  })
})

describe('the Fluent tier', () => {
  it('tightens the goal to 1.5 s a card, never under 1.2 s', () => {
    for (const st of STAGES) {
      expect(fluentMs(st), st.id).toBeGreaterThanOrEqual(1200)
      expect(fluentMs(st), st.id).toBeLessThan(st.goalMs)
    }
    expect(fluentMs(STAGES[0])).toBe(1500)
  })

  it('a stage is Solid at its goal before it is Fluent, from the same stats', () => {
    const st = STAGES[0]
    const stats: Stats = {}
    for (const c of cards(st)) for (let i = 0; i < 12; i++) record(stats, cardKey(c), true, 2000)
    expect(mastery(st, stats)).toEqual(mastery(st, stats, st.goalMs)) // old callers see no change
    expect(mastery(st, stats).solid).toBe(true)
    const f = mastery(st, stats, fluentMs(st))
    expect(f.solid).toBe(false)
    expect(f.pct).toBeCloseTo(1500 / 2000, 2)
    for (const c of cards(st)) for (let i = 0; i < 12; i++) record(stats, cardKey(c), true, 1000)
    expect(mastery(st, stats, fluentMs(st)).solid).toBe(true)
  })
})
