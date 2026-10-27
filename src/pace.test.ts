import { describe, expect, it } from 'vitest'
import { nextStep, Pace } from './pace'
import { cool } from './store'

describe('pace', () => {
  it('raises the tempo 5% after three clean passes in a row', () => {
    const p = new Pace()
    expect(p.pass(true, 0.7)).toBeUndefined()
    expect(p.pass(true, 0.7)).toBeUndefined()
    expect(p.pass(true, 0.7)).toBeCloseTo(0.75)
  })

  it('lowers it 10% after two messy passes in a row', () => {
    const p = new Pace()
    expect(p.pass(false, 0.8)).toBeUndefined()
    expect(p.pass(false, 0.8)).toBeCloseTo(0.7)
  })

  it('a clean pass breaks a messy run and the other way round', () => {
    const p = new Pace()
    p.pass(true, 0.7)
    p.pass(true, 0.7)
    expect(p.pass(false, 0.7)).toBeUndefined()
    expect(p.pass(true, 0.7)).toBeUndefined()
    expect(p.pass(true, 0.7)).toBeUndefined()
    expect(p.pass(true, 0.7)).toBeCloseTo(0.75)
  })

  it('stays within 25% and full tempo', () => {
    const slow = new Pace()
    slow.pass(false, 0.25)
    expect(slow.pass(false, 0.25)).toBeUndefined()
    const fast = new Pace()
    fast.pass(true, 1)
    fast.pass(true, 1)
    expect(fast.pass(true, 1)).toBeUndefined()
  })

  it('forgets the streaks when told to', () => {
    const p = new Pace()
    p.pass(true, 0.7)
    p.pass(true, 0.7)
    p.reset()
    expect(p.pass(true, 0.7)).toBeUndefined()
  })
})

describe('next step after a run', () => {
  const clean = { clean: true, wait: true, rate: 1, worst: null }
  it('suggests dropping the wait after a clean pass with it on', () => {
    expect(nextStep(clean)).toMatchObject({ kind: 'nowait' })
  })
  it('climbs the ladder when the run was clean without waiting', () => {
    expect(nextStep({ ...clean, wait: false, rate: 0.5 })).toMatchObject({ kind: 'faster', rate: 0.75 })
    expect(nextStep({ ...clean, wait: false, rate: 0.75 })).toMatchObject({ kind: 'faster', rate: 1 })
    expect(nextStep({ ...clean, wait: false, rate: 0.3 })).toMatchObject({ kind: 'faster', rate: 0.5 })
  })
  it('suggests nothing more after a clean full-tempo run without waiting', () => {
    expect(nextStep({ ...clean, wait: false, rate: 1 })).toBeNull()
  })
  it('loops the worst bars slowly after a messy run', () => {
    expect(nextStep({ clean: false, wait: false, rate: 1, worst: { a: 4, b: 5 } })).toMatchObject({ kind: 'loop', rate: 0.7 })
    expect(nextStep({ clean: false, wait: false, rate: 0.5, worst: { a: 4, b: 5 } })).toMatchObject({ kind: 'loop', rate: 0.5 })
  })
  it('has nothing to say about a messy run with no trouble spot', () => {
    expect(nextStep({ clean: false, wait: false, rate: 1, worst: null })).toBeNull()
  })
})

describe('trouble spots cool out', () => {
  it('one missed note is gone after four clean sessions, so no loop is offered for it', () => {
    let heat = cool([], [0, 1])
    for (let i = 0; i < 3; i++) heat = cool(heat, [])
    expect(heat[1]).toBeGreaterThan(0)
    expect(cool(heat, [])).toEqual([0, 0])
  })
  it('a clean run never offers the loop, whatever the heat', () => {
    expect(nextStep({ clean: true, wait: false, rate: 1, worst: { a: 0, b: 1 } })).toBeNull()
  })
})
