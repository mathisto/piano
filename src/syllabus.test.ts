import { describe, expect, it } from 'vitest'
import { applyRun, nextRecipe, SYLLABUS, stateOf, type TechStats } from './syllabus'
import { exercise } from './technique'

describe('technique syllabus', () => {
  it('has unique recipes that all generate songs', () => {
    expect(new Set(SYLLABUS.map((r) => r.id)).size).toBe(SYLLABUS.length)
    for (const r of SYLLABUS) expect(exercise(r.opts).notes.length, r.id).toBeGreaterThan(0)
  })

  it('has a distinct name for every exercise', () => {
    expect(new Set(SYLLABUS.map((r) => r.label)).size).toBe(SYLLABUS.length)
  })

  it('recipe ids are the exercise ids, so a finished run finds its recipe', () => {
    for (const r of SYLLABUS) expect(exercise(r.opts).id).toBe(r.id)
  })

  it('goes from simple to broad: five-finger first, rhythm and minor keys later', () => {
    expect(SYLLABUS[0].opts.pattern).toBe('five')
    expect(SYLLABUS.findIndex((r) => r.opts.minor)).toBeGreaterThan(SYLLABUS.findIndex((r) => r.opts.pattern === 'scale'))
  })

  const good = { acc: 0.95, touchPct: 0.9 }
  it('counts a run as good from 85% accuracy and, when touch was graded, 70% in range', () => {
    const s: TechStats = {}
    applyRun(s, 'x', { acc: 0.9, touchPct: 0.6 }, 0)
    expect(s.x.streak).toBe(0)
    applyRun(s, 'x', { acc: 0.9, touchPct: -1 }, 0)
    expect(s.x.streak).toBe(1)
  })

  it('is solid after two good runs in a row, and a bad run resets that', () => {
    const s: TechStats = {}
    applyRun(s, 'x', good, 0)
    expect(stateOf(s, 'x', 0)).toBe('learning')
    applyRun(s, 'x', good, 0)
    expect(stateOf(s, 'x', 0)).toBe('solid')
    applyRun(s, 'x', { acc: 0.5, touchPct: 0.1 }, 0)
    expect(stateOf(s, 'x', 0)).toBe('learning')
  })

  it('schedules a solid exercise for review and calls it due when the day comes', () => {
    const s: TechStats = {}
    applyRun(s, 'x', good, 0)
    applyRun(s, 'x', good, 0)
    expect(stateOf(s, 'x', 1)).toBe('solid')
    expect(stateOf(s, 'x', 40)).toBe('due')
    expect(stateOf(s, 'never', 0)).toBe('new')
  })

  it('points at due review first, then the first exercise that is not solid yet', () => {
    const s: TechStats = {}
    expect(nextRecipe(s, 0).reason).toBe('next')
    expect(nextRecipe(s, 0).recipe).toBe(SYLLABUS[0])
    applyRun(s, SYLLABUS[0].id, good, 0)
    applyRun(s, SYLLABUS[0].id, good, 0)
    expect(nextRecipe(s, 0).recipe).toBe(SYLLABUS[1])
    expect(nextRecipe(s, 99)).toMatchObject({ reason: 'due', recipe: SYLLABUS[0] })
  })
})
