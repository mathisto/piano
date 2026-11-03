import { expect, it } from 'vitest'
import type { Result } from './game'
import { marksOf } from './marks'
import { Judge } from './judge'
import { settings } from './settings'
import { fromSpec } from './song'
import { STARTERS } from './starters'
import { drillResults, pacedResults, results, runResults } from './ui-results'

const r = (o: Partial<Result>): Result => ({ acc: 1, counts: { perfect: 0, great: 0, good: 0, late: 0, miss: 0 }, maxCombo: 0, touch: { n: 0 } as never, even: null, timing: null, artic: null, voice: null, pedal: null, follow: [], clean: false, touchPct: -1, holds: -1, wrong: 24, first: -1, offs: [], heat: [], total: 40, mode: 'learn', rate: 1, ...o })
const flat = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

it('a waiting run leads with the notes right first time, and keeps the percentage for Details', () => {
  const html = results(r({ first: 0.75 }), undefined)
  expect(html).toContain('<b>30 of 40</b><span class="hcap">right first time</span>')
  expect(html).toContain('Right first time <b>75%</b>')
  expect(html).not.toContain('Accuracy')
  expect(html).toContain('role="region"') // not a dialog: the dock and bar behind it stay usable
  expect(flat(html)).toContain('The song waited, so time is not measured.')
})

it('a Perform run leads with a count, then a line for each thing measured, each saying whether it counts', () => {
  const html = results(r({ mode: 'perform', acc: 0.94, counts: { perfect: 30, great: 5, good: 0, late: 0, miss: 5 }, total: 40, wrong: 2, maxCombo: 69, holds: 0.97, timing: { bias: 18, spread: 24 } as never }), undefined)
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
  const html = results(r({ mode: 'perform', counts: { perfect: 0, great: 0, good: 0, late: 0, miss: song.notes.length }, total: song.notes.length, wrong: 1, clean: false }), undefined, '', 'Songs', { song, marks })
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
  const html = results(r({ mode: 'perform', wrong: 1, counts: { perfect: 30, great: 0, good: 0, late: 0, miss: 2 }, timing: { bias: 40, spread: 20 } as never }), { by: 'fix', title: 'Loop bars 3 to 4 at 70%', sub: '' }, '', 'Songs', { song, marks, worst: { a: 2, b: 3 } })
  const t = flat(html)
  expect(t).toContain('Bars 1 to 2 and 5 to 6 had no slips.')
  expect(t).toContain('Bars 3 and 4 had all 3 slips. Bar 4, beat 1, right hand. Played E4 where F4 is written.')
  expect(html.match(/id="next"/g)).toHaveLength(1) // one action, one place: the footer's lamp
  expect(t).toContain('Continue Back to Songs Loop bars 3 to 4 at 70%') // Continue is the loop, and says so under it
  expect(t).toContain('Most notes came about 40 ms late. If they felt on the beat, calibrate Delay in Set up.')
  expect(flat(results(r({ mode: 'perform', clean: true, wrong: 0, counts: { perfect: 40, great: 0, good: 0, late: 0, miss: 0 } }), undefined, '', 'Songs', { song, marks: [] }))).not.toContain('had no slips') // a clean run says Clean
})

it('a clean run with nothing to review offers neither Review nor the Mark list', () => {
  const html = results(r({ mode: 'perform', clean: true, wrong: 0, rate: 0.7, counts: { perfect: 40, great: 0, good: 0, late: 0, miss: 0 } }), undefined)
  expect(flat(html)).toContain('Clean at 70% tempo.')
  expect(html).not.toContain('id="review"')
})

it('Touch counts on an exercise that asks for it and not on a song', () => {
  const even = { rating: 'even', inside: 0.9, n: 20, band: 8, hint: '', devs: [], } as never
  const base = { mode: 'perform', even, counts: { perfect: 40, great: 0, good: 0, late: 0, miss: 0 }, wrong: 0, clean: true } as const
  const song = (id: string) => ({ id, notes: [], bars: [], spb: 1, fifths: 0 }) as never
  settings.lv = 2
  expect(flat(results(r(base), undefined, '', 'Scales', { song: song('scale:x'), marks: [] }))).toMatch(/Touch Evenness even.*counts/)
  expect(flat(results(r(base), undefined, '', 'Songs', { song: song('lib:x'), marks: [] }))).toMatch(/Touch Evenness even.*not counted yet/)
  expect(flat(results(r({ ...base, mode: 'learn' }), undefined, '', 'Scales', { song: song('scale:x'), marks: [] }))).toMatch(/Touch Evenness even.*not counted yet/) // only a Perform run is recorded
  // at level 1 the evenness of a scale is shown, not counted (decision 5)
  settings.lv = 1
  expect(flat(results(r(base), undefined, '', 'Scales', { song: song('scale:x'), marks: [] }))).toMatch(/Touch Evenness even.*not counted yet/)
})

it('Continue after a clean run names where it goes; the tempo step waits in More; Again is the restart icon, Back the ghost', () => {
  const go = { by: 'plan', title: 'Review: Bass landmarks', sub: '12 cards due' }
  const html = results(r({ mode: 'learn', clean: true, wrong: 0, rate: 0.5 }), go, '', 'Today', { song: fromSpec(STARTERS[0].spec), marks: [], step: { kind: 'faster', rate: 0.75, label: 'Try 75% tempo' } })
  expect(html).toMatch(/<button class="btn primary" id="next" aria-describedby="nextTo">.*Continue<\/button>/)
  expect(html).toContain('<p class="dest" id="nextTo">Review: Bass landmarks · 12 cards due</p>')
  expect(html).toMatch(/id="resMenu" hidden><button class="btn ghost" id="pace">Try 75% tempo<\/button>/)
  expect(html).toContain('<button class="btn icon" id="again" aria-label="Again"')
  expect(html).toContain('<button class="btn ghost" id="toLib">Back to Today</button>')
  // no Continue (its code did not load): Again is the lamp
  expect(results(r({ clean: true }), undefined)).toContain('<button class="btn icon primary" id="again"')
})

it('the reading and Sight run cards lead with Continue too; Again is the restart icon', () => {
  const go = { by: 'due', title: 'Theory: chords', sub: '4 cards due for review' }
  const progress = { before: 0.2, after: 0.4, solid: false, nextName: 'x', fast: false, goalMs: 2000 }
  const d = { stage: 'Treble landmarks', cards: 12, clean: 0.8, medianMs: 1200, weakest: [], progress }
  const drill = drillResults(d, go)
  expect(drill).toMatch(/id="next"[^>]*>.*Continue<\/button>\s*<button class="btn icon" id="nextSet" aria-label="Another set"/)
  expect(drill).toContain('Theory: chords · 4 cards due for review')
  expect(drillResults({ ...d, progress: { ...progress, solid: true } }, go)).toContain('<button class="btn" id="nextSet">Next stage</button>')
  const run = runResults({ spec: { clef: 'treble', lo: 60, hi: 72, size: 1, fifths: 0 } as never, arc: { cards: 10, clean: 8, best: 5 } as never, medianMs: 900, record: false, notes: [], weakest: [] }, go)
  expect(run).toMatch(/id="next".*Continue<\/button><button class="btn icon" id="runAgain" aria-label="Again"/)
})

it('reading results lead with plain counts, compare like-for-like accuracy, and never expose cards', () => {
  const drill = drillResults({ stage: 'Treble landmarks', cards: 26, clean: 24 / 26, medianMs: 1200, weakest: [], comparison: { previous: 20 / 26, best: true } })
  expect(flat(drill)).toContain('24 of 26 right first try Personal best First-try accuracy up 15 points from last time.')
  expect(flat(drill)).not.toMatch(/\bcards?\b/i)

  const run = runResults({ spec: { clef: 'treble', lo: 60, hi: 72, size: 1, fifths: 0 } as never, arc: { cards: 26, clean: 24, best: 8 } as never, medianMs: 900, record: true, notes: [], weakest: [], comparison: { previous: 24 / 26, best: false } })
  expect(flat(run)).toContain('24 of 26 right first try First-try accuracy matched last time.')
  expect(flat(run)).not.toMatch(/\bcards?\b/i)

  const paced = pacedResults({ spec: { clef: 'treble', lo: 60, hi: 72, size: 1, fifths: 0, pace: 50, every: 1 } as never, n: 26, hit: 24, cells: Array(24).fill(true).concat(false, false), missed: ['B4'], timing: null, wrong: 0, note: 'Next time: 50 bpm.', comparison: { previous: 20 / 26, best: true } })
  expect(flat(paced)).toContain('24 of 26 on the beat Personal best On-beat accuracy up 15 points from last time.')
  expect(flat(paced)).not.toMatch(/\bcards?\b/i)
})
