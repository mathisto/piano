import { describe, expect, it } from 'vitest'
import { Quiet, knownPitches } from './quiet'
import type { Stats } from './drill'

describe('quiet feedback', () => {
  it('stays talkative until a run of good notes, then only speaks up for the rest', () => {
    const q = new Quiet()
    for (let i = 0; i < 7; i++) q.note(true)
    expect(q.hushed).toBe(false)
    q.note(true)
    expect(q.hushed).toBe(true)
  })

  it('a slip brings the words back', () => {
    const q = new Quiet()
    for (let i = 0; i < 9; i++) q.note(true)
    q.note(false)
    expect(q.hushed).toBe(false)
  })

  it('starts over', () => {
    const q = new Quiet()
    for (let i = 0; i < 9; i++) q.note(true)
    q.reset()
    expect(q.hushed).toBe(false)
  })
})

describe('known pitches', () => {
  const stats: Stats = {
    '1:treble:60': { n: 14, clean: 0.95, rt: 1200 },
    '1:treble:62': { n: 14, clean: 0.5, rt: 1200 },
    '1:bass:48': { n: 5, clean: 1, rt: 900 },
    '2:treble:60': { n: 30, clean: 1, rt: 900 }, // an interval card says nothing about one note
  }
  it('counts a pitch once its single-note card is seen enough, clean and quick', () => {
    expect([...knownPitches(stats)]).toEqual([60])
  })
})
