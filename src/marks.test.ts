import { expect, it } from 'vitest'
import { Judge } from './judge'
import { markLine, marksOf, summary } from './marks'
import { fromSpec } from './song'
import { STARTERS } from './starters'

// five-finger piece, 60 bpm so a beat is a second: a note is written every second, C D E F G for the right hand
const song = fromSpec(STARTERS[0].spec)
const run = () => {
  const j = new Judge(song.notes, { rate: 1, wait: false, strict: true, beat: song.spb }, () => true)
  return j
}

it('lists wrong keys, missed notes and notes early or late, in reading order, with bar, beat, hand and the written note', () => {
  const j = run()
  const [a, b, c] = song.notes
  j.press(a.p, a.t + 0.002) // perfect: no mark
  j.press(b.p, b.t - 0.1) // 100 ms early: good
  j.press(c.p + 1, c.t + 0.02) // the wrong key beside the note written there
  j.tick(Infinity) // the rest, and c, are missed
  const ms = marksOf(j, song)
  expect(ms.map((m) => m.kind).slice(0, 3)).toEqual(['early', 'miss', 'wrong'])
  expect(ms[0]).toMatchObject({ bar: b.bar, hand: b.h, p: b.p, id: 1 })
  expect(ms[0].ms).toBeCloseTo(-100, 0)
  const w = ms.find((m) => m.kind === 'wrong')!
  expect(w).toMatchObject({ p: c.p + 1, written: c.p, s: 0, bar: c.bar })
  expect(w.ms).toBeCloseTo(20, 0)
  expect(ms.filter((m) => m.kind === 'miss')).toHaveLength(song.notes.length - 2) // c and everything after
  expect(ms.every((m, i) => i === 0 || ms[i - 1].t <= m.t)).toBe(true)
})

it('says each mark in a sentence and the run in another', () => {
  const j = run()
  const [a, b] = song.notes
  j.press(a.p + 1, a.t + 0.45) // half a beat after the first note: nearer the second, whose pitch it is not
  j.press(b.p, b.t + 0.3) // late
  j.tick(Infinity)
  const ms = marksOf(j, song)
  expect(markLine(ms.find((m) => m.kind === 'wrong')!, song)).toBe('Bar 1, beat 1, right hand. Played C♯4 where D4 is written, about 0.4 s early.')
  expect(markLine(ms.find((m) => m.kind === 'late')!, song)).toMatch(/ was \d+ ms late\.$/)
  expect(summary(ms)).toMatch(/^1 wrong key in bar 1, \d+ missed notes in \d+ bars, 1 note late in bar 1\.$/)
  expect(summary([])).toBe('No marks on the score.')
})
