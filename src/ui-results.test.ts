import { expect, it } from 'vitest'
import type { Result } from './game'
import { marksOf } from './marks'
import { Judge } from './judge'
import { fromSpec } from './song'
import { STARTERS } from './starters'
import { results } from './ui-results'

const r = (o: Partial<Result>): Result => ({ acc: 1, counts: { perfect: 0, great: 0, good: 0, late: 0, miss: 0 }, maxCombo: 0, touch: { n: 0 } as never, even: null, timing: null, artic: null, voice: null, pedal: null, follow: [], clean: false, touchPct: -1, holds: -1, wrong: 24, first: -1, offs: [], heat: [], total: 40, mode: 'learn', rate: 1, ...o })
const flat = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

it('a waiting run leads with the notes right first time, and keeps the percentage for Details', () => {
  const html = results(r({ first: 0.75 }), null)
  expect(html).toContain('<b>30 of 40</b><span class="hcap">right first time</span>')
  expect(html).toContain('Right first time <b>75%</b>')
  expect(html).not.toContain('Accuracy')
  expect(html).toContain('role="region"') // not a dialog: the dock and bar behind it stay usable
  expect(flat(html)).toContain('The song waited, so time is not measured.')
})

it('a Perform run leads with a count, then a line for each thing measured, each saying whether it counts', () => {
  const html = results(r({ mode: 'perform', acc: 0.94, counts: { perfect: 30, great: 5, good: 0, late: 0, miss: 5 }, total: 40, wrong: 2, maxCombo: 69, holds: 0.97, timing: { bias: 18, spread: 24 } as never }), null)
  expect(html).toContain('<b>35 of 40</b><span class="hcap">notes right</span>')
  const t = flat(html)
  expect(t).toContain('Notes 2 wrong keys · 5 missed counts') // the figure says how many were right
  expect(t).toContain('Time 35 of 35 on the beat · about 18 ms late on average, steady within ±24 ms counts')
  expect(t).toContain('Holds 97% released on time not counted yet')
  expect(t).toContain('Accuracy 94% · most in a row 69') // the percentage lives in Details
  expect(html).not.toMatch(/big-grade">\s*94/)
})

it('the headline says where the slips were, and the lines name the bars', () => {
  const song = fromSpec(STARTERS[0].spec)
  const j = new Judge(song.notes, { rate: 1, wait: false, strict: true, beat: song.spb }, () => true)
  j.press(song.notes[0].p + 1, song.notes[0].t + 0.02)
  j.tick(Infinity)
  const marks = marksOf(j, song)
  const html = results(r({ mode: 'perform', counts: { perfect: 0, great: 0, good: 0, late: 0, miss: song.notes.length }, total: song.notes.length, wrong: 1, clean: false }), null, '', 'Songs', { song, marks })
  const t = flat(html)
  expect(t).toContain('Not clean yet: 19 slips in 5 bars.')
  expect(t).toContain('1 wrong key (bar 1)')
  expect(html).toContain('id="review"') // the paper has marks to review
  expect(html).toContain('Mark list')
  expect(html).toMatch(/data-m="0"[^>]*>Bar 1, beat 1, right hand\. /)
  expect(html).toContain('id="again" aria-label="Again"') // Again is the restart icon
  expect(html).toContain('id="toLib">Back to Songs')
})

it('says what went right, and why the lamp loops the bars it does', () => {
  const song = { id: 'lib:x', notes: [], bars: Array(6).fill({}), spb: 1, fifths: 0 } as never
  const m = (bar: number, kind: 'wrong' | 'miss') => ({ kind, t: bar, bar, beat: 1, hand: 'R', p: 64, written: kind === 'wrong' ? 65 : undefined, ms: 0 }) as const
  const marks = [m(2, 'miss'), m(3, 'wrong'), m(3, 'miss')]
  const html = results(r({ mode: 'perform', wrong: 1, counts: { perfect: 30, great: 0, good: 0, late: 0, miss: 2 }, timing: { bias: 40, spread: 20 } as never }), { kind: 'loop', rate: 0.7, label: 'Loop bars 3 to 4 at 70%' }, '', 'Songs', { song, marks, worst: { a: 2, b: 3 } })
  const t = flat(html)
  expect(t).toContain('Bars 1 to 2 and 5 to 6 had no slips.')
  expect(t).toContain('Bars 3 and 4 had all 3 slips. Bar 4, beat 1, right hand. Played E4 where F4 is written.')
  expect(html.match(/id="next"/g)).toHaveLength(1) // one action, one place: the footer's lamp
  expect(t).toContain('Most notes came about 40 ms late. If they felt on the beat, calibrate Delay in Set up.')
  expect(flat(results(r({ mode: 'perform', clean: true, wrong: 0, counts: { perfect: 40, great: 0, good: 0, late: 0, miss: 0 } }), null, '', 'Songs', { song, marks: [] }))).not.toContain('had no slips') // a clean run says Clean
})

it('a clean run with nothing to review offers neither Review nor the Mark list', () => {
  const html = results(r({ mode: 'perform', clean: true, wrong: 0, rate: 0.7, counts: { perfect: 40, great: 0, good: 0, late: 0, miss: 0 } }), null)
  expect(flat(html)).toContain('Clean at 70% tempo.')
  expect(html).not.toContain('id="review"')
})

it('Touch counts on an exercise that asks for it and not on a song', () => {
  const even = { rating: 'even', inside: 0.9, n: 20, band: 8, hint: '', devs: [], } as never
  const base = { mode: 'perform', even, counts: { perfect: 40, great: 0, good: 0, late: 0, miss: 0 }, wrong: 0, clean: true } as const
  const song = (id: string) => ({ id, notes: [], bars: [], spb: 1, fifths: 0 }) as never
  expect(flat(results(r(base), null, '', 'Scales', { song: song('scale:x'), marks: [] }))).toMatch(/Touch Evenness even.*counts/)
  expect(flat(results(r(base), null, '', 'Songs', { song: song('lib:x'), marks: [] }))).toMatch(/Touch Evenness even.*not counted yet/)
})
