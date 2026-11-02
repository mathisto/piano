// One "what next" (docs/research/practice-path.md 4.1): a short cascade over the pickers the app already has, behind Today's
// lamp, each page head's Start and Continue on every results card (whose buttons are drawn here too). Pure: the caller gathers the snapshot (app/today.ts). Lazy, never at boot.
// ponytail: a cascade, not a weighted score; the drop-back, plateau and strand-lag rules (phase 4) slot in before `path`.

import type { Row } from './grades'
import type { Stage as DrillStage } from './drill'
import { icon } from './icons'
import { adaptation } from './profile'
import { cardsOf, nextCard, scaleSong, type ScaleStats, type Stage as ScaleStage } from './scales'
import type { HistoryEntry } from './store'
import { SYLLABUS, type Recipe } from './syllabus'
import type { Trainer } from './theory-cards'
import { esc } from './util'

/** The step that chose a unit; it goes on the history row it leads to (`by`), with `own` for the player's own pick. `next` is a page's own next unit, when nothing else applied. */
export type By = 'fix' | 'guide' | 'plan' | 'due' | 'back' | 'change' | 'lag' | 'path' | 'piece' | 'next'
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
  log?: HistoryEntry[] // counted sessions: phase 4's rules read these, but never write them
  adapt?: { id: string; strand: Strand; back?: Unit; change?: Unit }[] // an easier step and a different task for a practised unit
  lag?: (Unit & { level: number })[] // learning units, one per strand; the lowest level gets the free slot
  after?: { clean: boolean; fix?: Unit; offers: number } // the run just finished, its fix (the loop of its worst bars), and how often that was offered today
}

interface Phase4Input {
  reqs: Row[]
  units: Unit[]
  rows: { stage: DrillStage }[]
  next: { stage: DrillStage }
  tech: Recipe
  scale: ScaleStage
  scales: ScaleStats
  theory?: { trainer: Trainer; level: number }
  last: { id: string; title: string; plays: number; ready: boolean; level?: number }
  worst: { a: number; b: number } | null
  history: HistoryEntry[]
}

/** Build phase 4's candidates behind the lazy recommendation boundary, not in boot. */
export function phase4(x: Phase4Input): Pick<Snap, 'log' | 'adapt' | 'lag'> {
  const learning: NonNullable<Snap['lag']> = x.reqs.filter((r) => r.state === 'learning' && r.start).flatMap((r) => {
    const u = x.units.find((u) => u.strand === r.start!.kind)
    return u ? [{ ...u, level: r.level }] : []
  })
  const lag = [...new Map([...learning].reverse().map((u) => [u.strand, u])).values()]
  const piece = x.units.find((u) => u.key === 'piece')
  if (piece && x.last.plays && !x.last.ready && x.last.level) lag.push({ ...piece, level: x.last.level })
  const readAt = x.rows.findIndex((r) => r.stage.id === x.next.stage.id)
  const readBack = readAt > 0 ? x.rows[readAt - 1].stage : undefined
  const techAt = SYLLABUS.findIndex((r) => r.id === x.tech.id)
  const techBack = techAt > 0 ? SYLLABUS[techAt - 1] : undefined
  const rhythm = SYLLABUS.find((r) => r.opts.pattern === 'rhythm')!
  const sc = nextCard(x.scale, x.scales)
  const scaleId = scaleSong(sc, x.scale.bpm).id
  const otherScale = cardsOf(x.scale).find((c) => scaleSong(c, x.scale.bpm).id !== scaleId)
  const otherTheory = x.reqs.map((r) => r.start).find((s) => s?.kind === 'theory' && (!x.theory || s.trainer !== x.theory.trainer))
  const adapt: NonNullable<Snap['adapt']> = [
    { id: `drill:${x.next.stage.id}`, strand: 'read', ...(readBack && { back: { key: `back:read:${readBack.id}`, title: readBack.name, sub: readBack.blurb, go: { today: 'read', id: readBack.id }, strand: 'read' as const } }), change: { key: 'change:read', title: 'Review weak notes', sub: 'A mixed set from notes you have missed', go: { today: 'read', id: 'review' }, strand: 'read' } },
    { id: x.tech.id, strand: 'tech', ...(techBack && { back: { key: `back:tech:${techBack.id}`, title: techBack.label, sub: 'The preceding technique exercise', go: { today: 'tech', id: techBack.id }, strand: 'tech' as const } }), change: { key: `change:tech:${rhythm.id}`, title: rhythm.label, sub: 'A rhythm task before returning', go: { today: 'tech', id: rhythm.id }, strand: 'tech' } },
    { id: scaleId, strand: 'scale', back: scaleUnit(sc, Math.max(40, Math.round(x.scale.bpm * 0.8)), 'back', 'The same scale at a slower tempo'), ...(otherScale && { change: scaleUnit(otherScale, x.scale.bpm, 'change', 'A different key in this stage') }) },
    ...(x.theory ? [{ id: `theory:${x.theory.trainer}:${x.theory.level}`, strand: 'theory' as const, ...(x.theory.level > 1 && { back: { key: `back:theory:${x.theory.trainer}`, title: 'Earlier theory cards', sub: 'The previous level of this trainer', go: { today: 'start', start: JSON.stringify({ kind: 'theory', trainer: x.theory.trainer, level: x.theory.level - 1 }) }, strand: 'theory' as const } }), ...(otherTheory?.kind === 'theory' && { change: { key: `change:theory:${otherTheory.trainer}`, title: 'A different theory task', sub: 'Switch trainers before returning', go: { today: 'start', start: JSON.stringify(otherTheory) }, strand: 'theory' as const } }) }] : []),
    ...(x.last.plays ? [{ id: `song:${x.last.id}`, strand: 'song' as const, back: { key: `back:song:${x.last.id}`, title: x.last.title, sub: 'A full pass at 70% tempo', go: { today: 'continue', id: x.last.id, rate: '0.7' }, strand: 'song' as const }, ...(x.worst && { change: { key: `change:song:${x.last.id}`, title: `Bars ${x.worst.a + 1} to ${x.worst.b + 1} of ${x.last.title}`, sub: 'Isolate the hardest bars at 70%', go: { today: 'fix', id: x.last.id, a: String(x.worst.a), b: String(x.worst.b) }, strand: 'song' as const } }) }] : []),
  ]
  return { log: x.history, adapt, lag }
}

const scaleUnit = (card: Parameters<typeof scaleSong>[0], bpm: number, kind: 'back' | 'change', sub: string): Unit => {
  const song = scaleSong(card, bpm)
  return { key: `${kind}:scale:${song.id}`, title: song.title, sub, go: { today: 'scale', id: song.id }, strand: 'scale' }
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
  const recent = [...(s.adapt ?? [])]
    .filter((x) => !strand || x.strand === strand)
    .sort((a, b) => Math.max(...(s.log ?? []).filter((r) => r.id === b.id).map((r) => r.ts), 0) - Math.max(...(s.log ?? []).filter((r) => r.id === a.id).map((r) => r.ts), 0))
  const changed = (rule: 'back' | 'change') => {
    const hit = recent.find((x) => {
      if (adaptation(s.log ?? [], x.id, rule) !== rule || !x[rule]) return false
      const trigger = Math.max(...(s.log ?? []).filter((r) => r.id === x.id && !r.as).map((r) => r.ts), 0)
      return !(s.log ?? []).some((r) => r.by === rule && r.ts > trigger)
    })
    const u = hit?.[rule]
    return u && { ...u, strand: hit!.strand, sub: rule === 'back' ? 'Two recent sessions under 70%; take one step back.' : 'Five sessions without a gain; change the task.' }
  }
  const lag = [...(s.lag ?? [])].filter((u) => mine(u)).sort((a, b) => a.level - b.level)[0]
  const steps: [Unit | undefined, By][] = [
    [a && !a.clean && a.offers < 3 ? mine(a.fix) : undefined, 'fix'],
    [mine(s.guide), 'guide'],
    [row(s.plan.find((k) => !s.done.includes(k) && row(k))), 'plan'],
    [[...rows].sort((x, y) => (y.due ?? 0) - (x.due ?? 0)).find((r) => r.due), 'due'],
    [changed('back'), 'back'],
    [changed('change'), 'change'],
    [lag && { ...lag, sub: `Your furthest-behind learning strand, level ${lag.level}.` }, 'lag'],
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
