// The state the features share. Features import this and the pure modules; main imports the features.
// An ES module cannot assign another module's `let`, so each shared variable has a one-line setter.
import type { Dock } from '../dock'
import { STAGES, type Card, type Stage, type Stats } from '../drill'
import { Game, type Result } from '../game'
import type { Highway } from '../highway'
import { DEFAULT_RUN, type RunSpec, type Tally } from '../run'
import type { Level } from '../simplify'
import { fromSpec, type Song } from '../song'
import type { Staff } from '../staff'
import { STARTERS } from '../starters'
import { $, skeleton } from '../ui'

skeleton($('#app')) // first: every feature wires its listeners to this DOM as it loads

export const game = new Game()
export const starters = STARTERS.map((s) => fromSpec(s.spec))
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

export type Section = 'today' | 'songs' | 'read' | 'scales' | 'theory' | 'technique' | 'progress'

// A reading drill in progress: one card per beat, tracked card by card.
export interface Drill {
  stage: Stage | 'review'
  title: string
  goal: number
  cards: Card[]
  left: number[] // notes still to play on each card
  agg: { clean: boolean; rt: number }[]
  noteCard: number[] // note id -> card index
  done: number
  streak: number
  cleanN: number
  rts: number[]
  before: number
  fast?: boolean // the Fluent tier: the same stage against fluentMs
  run?: RunCtx
}
// Sight Run: one setup, dealt a set of cards at a time until you finish.
export interface RunCtx {
  base: RunSpec // as set up
  spec: RunSpec // as dealt: the range grows when widening is on
  arc: Tally
  prev?: Card
  turn: number
  sets: number
  setCards: number
  setClean: number
  setRts: number[]
  seen: Map<number, { n: number; miss: number; ms: number }>
  rts: number[]
  done: boolean
}

export let highway!: Highway
export let staff!: Staff
export let dock!: Dock
export let current: { song: Song; base: Song; level: Level; heat: number[]; credit?: string } | undefined
export let calibrating: { prevOffset: number } | undefined
export let played = false
export let run: RunCtx | undefined
export let runSpec: RunSpec = { ...DEFAULT_RUN }
export let drill: Drill | undefined
export let drillStats: Stats = {}
// a read-through in progress: look-through seconds left, the timer counting them, the tempo, and why this piece was offered
export let rt: { left: number; timer: number; rate: number; why: string; zoom?: number } | undefined
// a memorise session: the stage, clean passes in a row, this pass's notes right, slips and peeks, and the bar a peek shows
export let mem: { stage: number; clean: number; right: number; slips: number; peeks: number; peek: number; timer: number } | undefined

export const setHighway = (v: Highway) => (highway = v)
export const setStaff = (v: Staff) => (staff = v)
export const setDock = (v: Dock) => (dock = v)
export const setCurrent = (v: typeof current) => (current = v)
export const setCalibrating = (v: typeof calibrating) => (calibrating = v)
export const setPlayed = (v: boolean) => (played = v)
export const setRun = (v: typeof run) => (run = v)
export const setRunSpec = (v: RunSpec) => (runSpec = v)
export const setDrill = (v: typeof drill) => (drill = v)
export const setDrillStats = (v: Stats) => (drillStats = v)
export const setRt = (v: typeof rt) => (rt = v)
export const setMem = (v: typeof mem) => (mem = v)

/** Calls up the import graph, to a module that imports this one's importers. The owner fills each in as it loads. */
export const hooks = {} as {
  showSection(name: Section, err?: string): Promise<void>
  openDrawer(): void
  closeDrawer(): boolean
  rtEnd(): void
  rtPhase(): void
  memEnd(): void
  memStage(stage: number): void
  drillOk(noteId: number, rt: number, clean: boolean): void
  onDone(r: Result): Promise<void>
}

export const stageById = (id: string) => STAGES.find((s) => s.id === id)

export const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)

export function median(xs: number[]) {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[s.length >> 1]
}

export function worstBars(heat: number[], bars = game.song.bars.length): { a: number; b: number } | null {
  let best = 0
  let at = -1
  for (let i = 0; i < heat.length; i++) {
    const s = (heat[i] ?? 0) + (heat[i + 1] ?? 0)
    if (s > best) {
      best = s
      at = i
    }
  }
  if (at < 0) return null
  return { a: at, b: Math.min(bars - 1, at + 1) }
}

export function say(msg: string) {
  $('#live').textContent = msg
}

export function resOpen(on: boolean) {
  $('#res').hidden = !on
  $('#play').classList.toggle('resopen', on)
}
