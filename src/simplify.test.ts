import { describe, expect, it } from 'vitest'
import { autoLevel, simplify, notesPerBar } from './simplify'
import { build, type Bar, type Hand, type Raw } from './song'

const bars = (n: number): Bar[] => Array.from({ length: n }, (_, i) => ({ i, t0: i * 4, t1: (i + 1) * 4, n: 4, den: 4 }))
const song = (raw: { t: number; p: number; h: Hand; d?: number; grace?: boolean }[], nb = 2) =>
  build('s', 't', raw.map((r): Raw => ({ t: r.t, d: r.d ?? 0.5, p: r.p, v: 0.7, track: 0, h: r.h, grace: r.grace })), bars(nb), 0)

// two beats: a right-hand chord (E G C) over a left-hand chord (C2 G2 C3), then a lone melody note
const dense = song([
  { t: 0, p: 64, h: 'R' }, { t: 0, p: 67, h: 'R' }, { t: 0, p: 72, h: 'R' },
  { t: 0, p: 36, h: 'L' }, { t: 0, p: 43, h: 'L' }, { t: 0, p: 48, h: 'L' },
  { t: 1, p: 74, h: 'R' },
])

describe('simplify', () => {
  it('level 0 returns the song as it is', () => {
    expect(simplify(dense, 0)).toBe(dense)
  })

  it('level 1 caps a chord at three notes per hand and keeps its outer notes', () => {
    const four = song([60, 64, 67, 72].map((p) => ({ t: 0, p, h: 'R' as Hand })))
    const s = simplify(four, 1)
    expect(s.notes.map((n) => n.p).sort()).toEqual([60, 67, 72].sort())
  })

  it('level 2 keeps the top note of the right hand and the lowest of the left', () => {
    const s = simplify(dense, 2)
    expect(s.notes.filter((n) => n.h === 'R').map((n) => n.p)).toEqual([72, 74])
    expect(s.notes.filter((n) => n.h === 'L').map((n) => n.p)).toEqual([36])
  })

  it('level 3 keeps only the right-hand line', () => {
    const s = simplify(dense, 3)
    expect(s.notes.every((n) => n.h === 'R')).toBe(true)
    expect(s.notes.map((n) => n.p)).toEqual([72, 74])
  })

  it('renumbers the notes, keeps the bars and never mutates the original', () => {
    const s = simplify(dense, 2)
    expect(s.notes.map((n) => n.id)).toEqual([0, 1, 2])
    expect(s.bars).toBe(dense.bars)
    expect(dense.notes).toHaveLength(7)
    expect(s.lo).toBe(36)
    expect(s.hi).toBe(74)
  })

  it('drops grace notes from level 1 up, and keeps short notes that are not ornaments', () => {
    const s = simplify(song([{ t: 0, p: 60, h: 'R', d: 0.05, grace: true }, { t: 0.1, p: 62, h: 'R' }]), 1)
    expect(s.notes.map((n) => n.p)).toEqual([62])
    const fast = song([{ t: 0, p: 60, h: 'R', d: 0.06 }, { t: 0.125, p: 62, h: 'R', d: 0.06 }, { t: 0.25, p: 64, h: 'R', d: 0.06 }]) // staccato sixteenths at a quick tempo
    for (const l of [1, 2, 3] as const) expect(simplify(fast, l).notes.map((n) => n.p)).toEqual([60, 62, 64])
  })
})

describe('auto level', () => {
  it('leaves a readable song at full', () => {
    expect(autoLevel(song([{ t: 0, p: 60, h: 'R' }, { t: 1, p: 62, h: 'R' }]))).toBe(0)
  })

  it('steps up until the busiest bars are comfortable', () => {
    const raw: { t: number; p: number; h: Hand }[] = []
    for (let b = 0; b < 4; b++) for (let i = 0; i < 8; i++) for (const p of [48, 52, 55, 60, 64]) raw.push({ t: b * 4 + i * 0.5, p, h: i % 2 ? 'R' : 'L' })
    const s = song(raw, 4)
    expect(notesPerBar(s)).toBeGreaterThan(16)
    const lvl = autoLevel(s)
    expect(lvl).toBeGreaterThan(0)
    expect(notesPerBar(simplify(s, lvl))).toBeLessThanOrEqual(16)
  })
})
