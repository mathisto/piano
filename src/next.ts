// One "what next" (docs/research/practice-path.md 4.1): a short cascade over the pickers the app already has, behind Today's
// lamp, each page head's Start and Continue on every results card (whose buttons are drawn here too). Pure: the caller gathers the snapshot (app/today.ts). Lazy, never at boot.
// ponytail: a cascade, not a weighted score; the drop-back, plateau and strand-lag rules (phase 4) slot in before `path`.

import type { Row } from './grades'
import { icon } from './icons'
import { esc } from './util'

/** The step that chose a unit; it goes on the history row it leads to (`by`), with `own` for the player's own pick. `next` is a page's own next unit, when nothing else applied. */
export type By = 'fix' | 'guide' | 'plan' | 'due' | 'path' | 'piece' | 'next'
/** A section of practice: the kind of history row a unit leads to, and the page whose head starts it. */
export type Strand = 'read' | 'run' | 'scale' | 'tech' | 'theory' | 'song'

/** Something to do: a Today row (its key and words), or the fix after a run. `go` is what starts it (the Today button's data). */
export interface Unit {
  key: string
  title: string
  sub: string // the reason line, always shown
  h?: string // the title as HTML, a piece's name in the music face
  due?: number // cards or items due for review
  go?: Record<string, string>
  strand?: Strand
}

export interface Snap {
  rows: Unit[] // every candidate Today has; one of them is the piece, key 'piece'
  plan: string[] // the day's plan, keys in practice order
  done: string[] // the plan keys ticked today
  guide?: Unit // the first week's step for today, while it is undone
  path?: string // the key of the row that does the Path's next requirement
  reqs?: Row[] // the Path's requirements: a page's Start takes its strand's first one not solid yet
  after?: { clean: boolean; fix?: Unit; offers: number } // the run just finished, its fix (the loop of its worst bars), and how often that was offered today
}

/** The first that applies: the fix after a run that was not clean (three offers at most), the first week's step, the plan's next row,
 *  the most due, the Path's next requirement, the piece. Never nothing: there is always a piece (the starters ship with the app).
 *  With a `strand` (a page head's Start) every step keeps to that strand, the Path step is that strand's own frontier, and the last is
 *  the strand's first row; a strand Today has no row for (Theory with nothing due) can come back empty, and its page picks for itself. */
export function nextUp(s: Snap): Unit & { by: By }
export function nextUp(s: Snap, strand: Strand): (Unit & { by: By }) | undefined
export function nextUp(s: Snap, strand?: Strand) {
  const mine = (u?: Unit) => (u && (!strand || u.strand === strand) ? u : undefined)
  const rows = s.rows.filter((r) => mine(r))
  const row = (k?: string) => rows.find((r) => r.key === k)
  const a = s.after
  const steps: [Unit | undefined, By][] = [
    [a && !a.clean && a.offers < 3 ? mine(a.fix) : undefined, 'fix'],
    [mine(s.guide), 'guide'],
    [row(s.plan.find((k) => !s.done.includes(k) && row(k))), 'plan'],
    [[...rows].sort((x, y) => (y.due ?? 0) - (x.due ?? 0)).find((r) => r.due), 'due'],
    [strand ? frontier(s.reqs, strand) : row(s.path), 'path'],
    strand ? [rows[0], 'next'] : [row('piece') ?? s.rows[0], 'piece'],
  ]
  const hit = steps.find(([u]) => u)
  return hit && { ...hit[0]!, by: hit[1] }
}

/** The Path's first requirement in a strand that is not solid yet, as a unit that starts it. */
function frontier(reqs: Row[] = [], strand: Strand): Unit | undefined {
  const r = reqs.find((x) => x.start?.kind === strand && x.state !== 'solid' && x.state !== 'coming')
  return r && { key: `path:${strand}`, title: r.name, sub: `Next on your Path, level ${r.level}`, go: { today: 'start', start: JSON.stringify(r.start) }, strand }
}

/** What a page head's Start starts: a unit, or the page's own pick, in words, with what starts it. */
export type Lit = Pick<Unit, 'title' | 'sub' | 'h'> & { start(): void }
/** A page head's Start, the page's one lamp (practice path phase 3): the button and, beside it, what it starts and why, as on a results card.
 *  Every other lamp and Next tag on the page steps down. Nothing to start: the page keeps its own. */
export function lamp(el: HTMLElement, u?: Lit) {
  if (!u) return
  for (const b of el.querySelectorAll('.btn.primary')) b.classList.replace('primary', b.closest('tr, .prow') ? 'ghost' : 'btn') // a row's action goes ghost, a form's Start plain
  el.querySelectorAll('.tag.next').forEach((t) => t.remove())
  const id = `${el.id}Start` // every page stays in the document: an id of its own, so the line describes its own button
  el.querySelector('.lib-head')!.insertAdjacentHTML('beforeend', `<div class="hstart"><button class="btn primary" id="${id}" aria-describedby="${id}To">${icon('play')}Start</button><p class="dest" id="${id}To">${u.h ?? esc(u.title)} · ${esc(u.sub)}</p></div>`)
  el.querySelector<HTMLButtonElement>(`#${id}`)!.onclick = () => u.start()
}

/** What Continue starts, as a results card names it: its words, and the rule that chose it. */
export type Cont = Pick<Unit, 'title' | 'sub' | 'h'> & { by: string }

/** Continue, the one lamp of every results card, and where it goes, in a line under the actions (practice path phase 2). */
export const cont = (u: Cont | undefined, id = 'next') =>
  u
    ? [
        `<button class="btn primary" id="${id}" aria-describedby="${id}To">${icon(u.by === 'fix' ? 'loop' : 'play')}Continue</button>`,
        `<p class="dest" id="${id}To">${u.by === 'fix' ? esc(u.title) : `${u.h ?? esc(u.title)} · ${esc(u.sub)}`}</p>`,
      ]
    : ['', '']
