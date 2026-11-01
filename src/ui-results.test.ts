import { expect, it } from 'vitest'
import type { Result } from './game'
import { results } from './ui-results'

const r = (o: Partial<Result>): Result => ({ acc: 1, counts: { perfect: 0, great: 0, good: 0, late: 0, miss: 0 }, maxCombo: 0, touch: { n: 0 } as never, even: null, timing: null, artic: null, voice: null, pedal: null, follow: [], clean: false, touchPct: -1, holds: -1, wrong: 24, first: -1, offs: [], heat: [], total: 40, mode: 'learn', rate: 1, ...o })

it('a waiting run leads with the notes right first time, not an accuracy that is always 100%', () => {
  const html = results(r({ first: 0.76 }), null)
  expect(html).toContain('76%<span class="hcap">first time right</span>')
  expect(html).not.toContain('accuracy')
  expect(html).toContain('role="region"') // not a dialog: the dock and bar behind it stay usable
})

it('a Perform run says what the hero does not, and keeps each count with its word', () => {
  const html = results(r({ mode: 'perform', acc: 0.94, counts: { perfect: 30, great: 5, good: 0, late: 0, miss: 5 }, wrong: 0, maxCombo: 69, holds: 0.97 }), null)
  expect(html).toContain('94%<span class="hcap">accuracy</span>')
  expect(html).toContain('<span class="nw"><b>5</b> missed</span> · <span class="nw"><b>0</b> wrong</span> · <span class="nw">most in a row <b>69</b></span>')
  expect(html).toContain('held <b>97%</b>')
})
