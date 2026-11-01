// One "what next" (docs/research/practice-path.md 4.1): a short cascade over the pickers the app already has, behind Today's
// lamp and Continue on every results card (whose button is drawn here too). Pure: the caller gathers the snapshot (app/today.ts). Lazy, never at boot.
// ponytail: a cascade, not a weighted score; the drop-back, plateau and strand-lag rules (phase 4) slot in before `path`.

import { icon } from './icons'
import { esc } from './util'

/** The step that chose a unit; it goes on the history row it leads to (`by`), with `own` for the player's own pick. */
export type By = 'fix' | 'guide' | 'plan' | 'due' | 'path' | 'piece'

/** Something to do: a Today row (its key and words), or the fix after a run. `go` is what starts it (the Today button's data). */
export interface Unit {
  key: string
  title: string
  sub: string // the reason line, always shown
  h?: string // the title as HTML, a piece's name in the music face
  due?: number // cards or items due for review
  go?: Record<string, string>
}

export interface Snap {
  rows: Unit[] // every candidate Today has; one of them is the piece, key 'piece'
  plan: string[] // the day's plan, keys in practice order
  done: string[] // the plan keys ticked today
  guide?: Unit // the first week's step for today, while it is undone
  path?: string // the key of the row that does the Path's next requirement
  after?: { clean: boolean; fix?: Unit; offers: number } // the run just finished, its fix (the loop of its worst bars), and how often that was offered today
}

/** The first that applies: the fix after a run that was not clean (three offers at most), the first week's step, the plan's next row,
 *  the most due, the Path's next requirement, the piece. Never nothing: there is always a piece (the starters ship with the app). */
export function nextUp(s: Snap): Unit & { by: By } {
  const row = (k?: string) => s.rows.find((r) => r.key === k)
  const a = s.after
  const steps: [Unit | undefined, By][] = [
    [a && !a.clean && a.offers < 3 ? a.fix : undefined, 'fix'],
    [s.guide, 'guide'],
    [row(s.plan.find((k) => !s.done.includes(k))), 'plan'],
    [[...s.rows].sort((x, y) => (y.due ?? 0) - (x.due ?? 0)).find((r) => r.due), 'due'],
    [row(s.path), 'path'],
    [row('piece') ?? s.rows[0], 'piece'],
  ]
  const [u, by] = steps.find(([u]) => u)!
  return { ...u!, by }
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
