import { describe, expect, it } from 'vitest'
import { afterPass, facts, hidden, keyName, memTag, passCard, repeats, startStage, verdict, weakSpots, type PassReport } from './memory'
import { fromSpec } from './song'
import { STARTERS } from './starters'

const song = (id: string) => fromSpec(STARTERS.find((s) => s.spec.id === id)!.spec)

describe('which bars hide', () => {
  const at = (stage: number) => Array.from({ length: 8 }, (_, i) => i).filter((b) => hidden(stage, b))
  it('fades by stage: none, every 4th, every 2nd, all', () => {
    expect(at(0)).toEqual([])
    expect(at(1)).toEqual([3, 7])
    expect(at(2)).toEqual([1, 3, 5, 7])
    expect(at(3)).toHaveLength(8)
    expect(at(4)).toHaveLength(8)
  })
  it('each stage hides everything the stage before it hid', () => {
    for (let s = 1; s <= 4; s++) for (let b = 0; b < 32; b++) if (hidden(s - 1, b)) expect(hidden(s, b)).toBe(true)
  })
})

describe('stage schedule', () => {
  const ok = { clean: true, slips: 0, peeks: 0 }
  it('two clean passes in a row move up one stage and clear the stage', () => {
    const a = afterPass({ stage: 1, clean: 0 }, ok)
    expect(a).toMatchObject({ stage: 1, clean: 1, moved: 0 })
    expect(a.cleared).toBeUndefined()
    expect(afterPass(a, ok)).toEqual({ stage: 2, clean: 0, moved: 1, cleared: 1 })
  })
  it('a messy pass that is not a drop restarts the count', () => {
    expect(afterPass({ stage: 2, clean: 1 }, { clean: false, slips: 3, peeks: 0 })).toEqual({ stage: 2, clean: 0, moved: 0 })
  })
  it('more than three slips step back one stage, never below 0', () => {
    expect(afterPass({ stage: 3, clean: 1 }, { clean: false, slips: 4, peeks: 0 })).toEqual({ stage: 2, clean: 0, moved: -1 })
    expect(afterPass({ stage: 0, clean: 1 }, { clean: false, slips: 9, peeks: 0 })).toEqual({ stage: 0, clean: 0, moved: 0 })
  })
  it('a peek keeps a clean pass from counting', () => {
    expect(afterPass({ stage: 2, clean: 1 }, { ...ok, peeks: 1 })).toEqual({ stage: 2, clean: 0, moved: 0 })
  })
  it('the top stage clears but stays the top', () => {
    expect(afterPass({ stage: 4, clean: 1 }, ok)).toEqual({ stage: 4, clean: 0, moved: 0, cleared: 4 })
  })
  it('starts at the highest stage cleared, at least the floor', () => {
    expect(startStage(undefined)).toBe(0)
    expect(startStage(undefined, 1)).toBe(1)
    expect(startStage({ plays: 0, last: 0, heat: [], memStage: 3 }, 1)).toBe(3)
  })
})

describe('weak spots', () => {
  it('the worst bars, at most three, in bar order', () => {
    const heat: number[] = []
    Object.assign(heat, { 2: 1, 5: 3, 7: 0.5, 9: 2 })
    expect(weakSpots(heat)).toEqual([2, 5, 9])
    expect(weakSpots([])).toEqual([])
  })
})

describe('analyse first', () => {
  it('names the key from the signature and the last bass note', () => {
    expect(keyName(song('starter-twinkle'))).toBe('C major')
    expect(keyName(song('starter-minuet-g'))).toBe('G major') // ends on D (a half cadence): the first bass note decides
    expect(keyName(song('starter-fur-elise'))).toBe('A minor')
    expect(keyName(fromSpec({ id: 'x', title: 'x', bpm: 60, fifths: 1, rh: 'B4:1 G4:1', lh: 'R:1 E3:1' }))).toBe('E minor')
    expect(keyName(fromSpec({ id: 'x', title: 'x', bpm: 60, fifths: -2, rh: 'D5:1 F4:1', lh: 'R:2' }))).toBe('B♭ major or G minor, 2 flats')
  })
  it('finds bars with the same pitches as an earlier bar', () => {
    const s = fromSpec({ id: 'x', title: 'x', bpm: 60, fifths: 0, rh: 'C4:4 D4:4 C4:4 R:4 C4:2 C4:2', lh: 'R:20' })
    expect(repeats(s)).toEqual([2]) // bar 4 is empty, bar 5 has two Cs, not one
  })
  it('Twinkle: C major, 4/4, hands and repeats', () => {
    const f = Object.fromEntries(facts(song('starter-twinkle')))
    expect(f.Key).toBe('C major')
    expect(f.Time).toBe('4/4')
    expect(f['Right hand']).toBe('C4 to A4')
    expect(f.Repeats).toMatch(/^\d+ bars are the same as an earlier bar/)
    expect(Number(f.Bars)).toBe(song('starter-twinkle').bars.length)
  })
  it('leaves out a hand with no notes', () => {
    const f = Object.fromEntries(facts(fromSpec({ id: 'x', title: 'x', bpm: 60, fifths: 0, rh: 'C4:4', lh: 'R:4' })))
    expect(f['Left hand']).toBeUndefined()
  })
})

describe('cards', () => {
  const r = (o: Partial<PassReport>): PassReport => ({ title: 'T', from: 1, to: { stage: 1, clean: 1, moved: 0 }, slips: 0, peeks: 0, clean: true, heat: [], bars: 8, ...o })
  it('says what the pass did', () => {
    expect(verdict(r({ to: { stage: 2, clean: 0, moved: 1, cleared: 1 } }))).toMatch(/on to stage 2/)
    expect(verdict(r({ clean: false, slips: 5, to: { stage: 0, clean: 0, moved: -1 } }))).toMatch(/back to stage 0/)
    expect(verdict(r({ peeks: 1 }))).toMatch(/peek/)
    expect(verdict(r({ from: 4, to: { stage: 4, clean: 0, moved: 0, cleared: 4 } }))).toMatch(/Memorised/)
  })
  it('lists weak spots and peeks on the pass card', () => {
    const heat: number[] = []
    heat[3] = 1
    const h = passCard(r({ heat, peeks: 2 }))
    expect(h).toContain('Weak spots: bar 4')
    expect(h).toContain('<b>2</b> peeks')
    expect(h.match(/<i /g)).toHaveLength(8)
  })
  it('tags a row only once a stage is cleared', () => {
    expect(memTag(undefined)).toBe('')
    expect(memTag({ plays: 0, last: 0, heat: [], memStage: 3 })).toContain('Memorised 3/4')
  })
})
