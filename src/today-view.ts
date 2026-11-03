// Today's rows and page: what the plan can offer, each with what starts it, and the one lamp nextUp() chose. Lazy, its own chunk:
// Today does not share a failed load with the other pages' views.
import { guideCard } from './guide'
import type { Start } from './grades'
import { icon } from './icons'
import type { Unit } from './next'
import { PLAN_LENGTHS, planOf } from './plan'
import { head, meter, type TodayData, weekBlock } from './ui'
import { esc } from './util'

/** A piece's name inside a sentence, set in the music face like the Songs rows. */
export const pn = (t: string) => `<span class="pn">${esc(t)}</span>`

/** A Today row: the plan's grammar (title over its reason) and what starts it, `go`, the button's data (app/today.ts launch). */
export interface TodayRow extends Unit {
  min: number
  mid?: string
  go: Record<string, string>
  verb: string
  ic?: string
  cover?: string // a piece row's thumbnail, as HTML
}
const start = (s: Start) => ({ today: 'start', start: JSON.stringify(s) })
const btn = (c: string, r: TodayRow, by: string) => `<button class="btn${c}" data-row${Object.entries({ ...r.go, by }).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('')}>${icon(r.ic ?? 'play')}${r.verb}</button>`

/** Every row Today can offer, whether or not the plan has room for it today. */
export function todayRows(d: TodayData): TodayRow[] {
  const mrow = (pct: number) => `<div class="mrow">${meter(pct, false, 'Mastery')}<b>${Math.round(pct * 100)}%</b></div>`
  const pace = d.last.pace
  const rows: (TodayRow | false | undefined)[] = [
    { key: 'warm', min: 2, title: d.tech, sub: d.techDue && !d.done.includes('warm') ? 'Exercise, due for review' : 'Exercise, next in the syllabus', due: d.techDue && !d.done.includes('warm') ? 1 : 0, go: { today: 'tech', id: d.techId }, verb: 'Start' },
    { key: 'read', min: 3, title: d.read.name, sub: d.read.line, due: d.read.due, mid: mrow(d.read.pct), go: { today: 'read', id: d.read.id }, verb: 'Practise' },
    { key: 'piece', min: 5, title: d.last.title, h: pn(d.last.title), sub: pace?.label ?? d.last.sub, go: { today: 'continue', id: d.last.id, ...(pace?.rate && { rate: String(pace.rate) }), ...(pace?.kind === 'nowait' && { nowait: '1' }) }, verb: d.last.first ? 'Start' : 'Continue' },
    d.sight && { key: 'sight', min: 4, title: d.sight.title, h: pn(d.sight.title), sub: d.sight.sub, go: { today: 'sight', id: d.sight.id }, verb: 'Read through', cover: d.sight.cover },
    d.again && { key: 'again', min: 5, title: d.again.title, h: pn(d.again.title), sub: d.again.sub, due: 1, go: { today: 'continue', id: d.again.id }, verb: 'Review', cover: d.again.cover },
    d.fix && { key: 'fix', min: 4, title: `Bars ${d.fix.a + 1} to ${d.fix.b + 1} of ${d.fix.title}`, h: `Bars ${d.fix.a + 1} to ${d.fix.b + 1} of ${pn(d.fix.title)}`, sub: 'Slow loop at 70%', go: { today: 'fix', id: d.fix.id, a: String(d.fix.a), b: String(d.fix.b) }, verb: 'Loop', ic: 'loop' },
    d.scale && { key: 'scale', min: 3, title: d.scale.title, sub: d.scale.sub, mid: mrow(d.scale.pct), go: start(d.scale.start), verb: 'Start' },
    d.theory && { key: 'theory', min: 3, title: d.theory.title, sub: d.theory.sub, due: d.theory.due, go: start(d.theory.start), verb: 'Start' },
    d.path && { key: 'path', min: 3, title: d.path.title, sub: d.path.sub, go: start(d.path.start), verb: 'Start' },
    { key: 'run', min: 3, title: 'Sight run', sub: d.run, go: { today: 'run' }, verb: 'Start' },
    d.review && { key: 'review', min: 6, title: d.review.name, sub: d.review.line, due: d.review.due, go: { today: 'read', id: d.review.id }, verb: 'Practise' },
  ]
  return rows.filter((r): r is TodayRow => !!r)
}

/** The day as a short list in practice order; nothing is locked and each row stands alone. `lamp`: what nextUp() chose (next.ts), the one primary. */
export function todayView(el: HTMLElement, d: TodayData, lamp: { key: string; by: string }) {
  if (el.parentElement) el.parentElement.onclick = (e) => {
    const t = e.target as HTMLElement
    if (!t.closest('button,a,label')) t.closest('.open')?.querySelector<HTMLButtonElement>('[data-row]')?.click()
  }
  const all = todayRows(d)
  const plan = planOf(d.planMin, all.map((r) => r.key)).map(({ key, min }) => ({ ...all.find((r) => r.key === key)!, min }))
  const todo = plan.filter((r) => !d.done.includes(r.key))
  const row = (r: TodayRow, cls: string, o: { done?: boolean; up?: boolean; by?: string } = {}) =>
    `<div class="prow open${o.done ? ' done' : o.up ? ' upnext' : ''}"><span class="plead">${o.done ? icon('check') : ''}</span>${r.key === 'piece' ? d.last.cover : (r.cover ?? '')}<div class="pwho"><b>${r.h ?? esc(r.title)}${o.up ? ' <span class="tag next">Next</span>' : ''}</b><span>${esc(r.sub)}${o.done || o.up ? '' : ` · about ${r.min} min`}</span></div>${r.mid ?? ''}<div class="pact">${btn(cls, r, o.by ?? 'plan')}</div></div>`
  const longer = PLAN_LENGTHS.find((m) => m > d.planMin)
  const up = all.find((r) => r.key === lamp.key)
  // what is still to do comes first, in practice order, the lamp on the first unless the first week's step has it. Once all is done the
  // plan is one line, and the lamp moves to what comes next (UX-25): there is never a Today without one.
  const rows = todo.length
    ? [...todo.map((r, i) => row(r, !i && lamp.by === 'plan' ? ' primary' : ' ghost')), ...plan.filter((r) => d.done.includes(r.key)).map((r) => row(r, ' ghost', { done: true }))].join('')
    : `<p class="plan-done">Today's plan is done.${longer ? `<button class="btn ghost" data-plan="${longer}">Make it ${longer} min</button>` : ''}</p>${up && lamp.by !== 'guide' ? row(up, ' primary', { up: true, by: lamp.by }) : ''}`
  el.innerHTML = `
    ${head('Today', `<span class="plan-cap">Plan</span><div class="seg" role="radiogroup" aria-label="Plan length">${PLAN_LENGTHS.map((m) => `<label><input type="radio" name="planMin" value="${m}"${d.planMin === m ? ' checked' : ''}><span>${m} min</span></label>`).join('')}</div>`)}
    ${d.guide ? guideCard(d.guide) : ''}
    ${d.recap ? `<section class="tcard recap" aria-label="Last week"><span>Last week: <b>${d.recap.minutes} min</b> on ${d.recap.played} ${d.recap.played === 1 ? 'day' : 'days'}.${d.recap.better ? ` Most improved: ${esc(d.recap.better)}.` : ''}</span>${d.recap.suggest > d.goal ? `<button class="btn ghost" data-goal="${d.recap.suggest}">Aim for ${d.recap.suggest} min</button>` : ''}</section>` : ''}
    <section class="tcard span" aria-label="This week">${weekBlock(d.week, d.goal, d.streak)}</section>
    <div class="plan">${rows}</div>`
}
