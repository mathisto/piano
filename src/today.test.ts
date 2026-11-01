import { expect, it, vi } from 'vitest'
vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} })
const { guideDay } = await import('./guide')
const { nextUp } = await import('./next')
const { planOf } = await import('./plan')
const { todayRows, todayView } = await import('./ui-views')
type D = Parameters<typeof todayView>[1]

const d: D = {
  last: { id: 'starter-twinkle', title: 'Twinkle', sub: 'Best 80%', first: false, cover: '' },
  read: { id: 't-land', name: 'Treble landmarks', pct: 0.2, line: '3 of 9 notes seen' },
  tech: 'Five-finger', techDue: false, techId: 'five', week: { days: [], minutes: 0 }, goal: 60, planMin: 10, streak: { n: 0, freezes: 0, today: false, saved: false }, done: [],
}
const draw = (x: D) => {
  const rows = todayRows(x)
  const now = x.guide?.rows.find((r) => r.state === 'now')?.step
  const lamp = nextUp({ rows, plan: planOf(x.planMin, rows.map((r) => r.key)).map((r) => r.key), done: x.done, guide: now && { key: 'guide', title: now.title, sub: now.sub } })
  const el = { innerHTML: '' } as HTMLElement
  todayView(el, x, lamp)
  return el.innerHTML
}
const primaries = (html: string) => html.match(/class="btn primary"[^>]*>/g) ?? []

it('the plan: the lamp on its first row not done, every other row quiet', () => {
  const html = draw({ ...d, done: ['warm'] })
  expect(primaries(html)).toHaveLength(1)
  expect(primaries(html)[0]).toContain('data-today="read"')
  expect(primaries(html)[0]).toContain('data-by="plan"')
})

it('the plan done: one line, a longer plan to choose, and the lamp on what comes next (never a Today without one)', () => {
  const html = draw({ ...d, done: ['warm', 'read', 'piece'] })
  expect(html).toContain(`<p class="plan-done">Today's plan is done.<button class="btn ghost" data-plan="20">Make it 20 min</button></p>`)
  expect(html).toMatch(/class="prow upnext".*<b><span class="pn">Twinkle<\/span> <span class="tag next">Next<\/span><\/b><span>Best 80%<\/span>/)
  expect(primaries(html)).toEqual([expect.stringContaining('data-by="piece"')])
  expect(draw({ ...d, planMin: 45, done: ['warm', 'scale', 'read', 'run', 'sight', 'piece'] })).not.toContain('Make it') // the longest plan
  // something due comes before the piece
  expect(primaries(draw({ ...d, read: { ...d.read, due: 12, line: '12 cards due' }, done: ['warm', 'read', 'piece'] }))[0]).toContain('data-by="due"')
})

it('the first week: the day step takes the lamp, the plan rows go quiet, a later step can be started too', () => {
  const html = draw({ ...d, guide: guideDay(100, 100, []) })
  expect(primaries(html)).toEqual([expect.stringContaining('data-today="guide" data-go="read" data-by="guide"')])
  expect(html).toMatch(/gstep later.*?<button class="btn ghost" data-today="guide" data-go="scale"/)
  expect(html).not.toMatch(/gstep later[^]*?data-guide="skip" data-n="2"/)
})

it("a clean run's pace step is the piece's row next time, and its Continue starts there", () => {
  const html = draw({ ...d, last: { ...d.last, pace: { kind: 'faster', rate: 0.75, label: 'Try 75% tempo' } } })
  expect(html).toMatch(/<span>Try 75% tempo · about \d+ min<\/span>.*data-today="continue" data-id="starter-twinkle" data-rate="0.75"/)
})
