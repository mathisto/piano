import { INTERVALS } from './drill'
import { exercise, type Opts } from './technique'

export interface Recipe {
  id: string // the exercise's own song id
  label: string
  opts: Opts
}

export interface TechRun {
  runs: number
  streak: number // good runs in a row
  box: number // review box, 0..4
  due?: number // local day number when it is next due
  best: number // best accuracy, 0..1
}
export type TechStats = Record<string, TechRun>

const R = (o: Partial<Opts> & Pick<Opts, 'pattern'>): Recipe => {
  const opts: Opts = { tonic: 0, dyn: 'medium', hands: 'R', bpm: 72, ...o }
  return { id: exercise(opts).id, label: exercise(opts).title, opts }
}

// Simple to broad, in the order the syllabi take them: five-finger shapes, C then G, D, F scales a hand at a time,
// hands together, contrary motion, arpeggios, dynamics, then the other keys, minor, touch and rhythm.
export const SYLLABUS: Recipe[] = [
  R({ pattern: 'five' }),
  R({ pattern: 'five', hands: 'L' }),
  R({ pattern: 'five', hands: 'both' }),
  R({ pattern: 'rhythm', level: 1, bpm: 72 }),
  R({ pattern: 'scale' }),
  R({ pattern: 'scale', hands: 'L' }),
  R({ pattern: 'scale', hands: 'both', bpm: 60 }),
  R({ pattern: 'five', dyn: 'soft' }),
  R({ pattern: 'five', dyn: 'hard' }),
  R({ pattern: 'scale', tonic: 7 }),
  R({ pattern: 'scale', tonic: 5 }),
  R({ pattern: 'scale', tonic: 2 }),
  R({ pattern: 'contrary', hands: 'both', bpm: 60 }),
  R({ pattern: 'arp' }),
  R({ pattern: 'arp', hands: 'both', bpm: 60 }),
  R({ pattern: 'scale', dyn: 'cresc' }),
  R({ pattern: 'scale', dyn: 'decresc' }),
  R({ pattern: 'rhythm', level: 2, bpm: 72 }),
  R({ pattern: 'scale', dyn: 'even' }),
  R({ pattern: 'scale', tonic: 9 }),
  R({ pattern: 'scale', tonic: 9, minor: true }),
  R({ pattern: 'scale', tonic: 4, minor: true }),
  R({ pattern: 'scale', tonic: 2, minor: true }),
  R({ pattern: 'arp', tonic: 9, minor: true }),
  R({ pattern: 'scale', artic: 'legato' }),
  R({ pattern: 'scale', artic: 'staccato' }),
  R({ pattern: 'scale', dyn: 'accent' }),
  R({ pattern: 'scale', dyn: 'balance', hands: 'both', bpm: 60 }),
  R({ pattern: 'scale', tonic: 10 }),
  R({ pattern: 'scale', tonic: 3 }),
  R({ pattern: 'rhythm', level: 3, bpm: 72 }),
]

const GOOD_ACC = 0.85
const GOOD_TOUCH = 0.7 // when a run asked for velocity targets
const SOLID = 2 // good runs in a row

export function applyRun(stats: TechStats, id: string, r: { acc: number; touchPct: number }, day: number): TechStats {
  const s = stats[id] ?? { runs: 0, streak: 0, box: 0, best: 0 }
  const good = r.acc >= GOOD_ACC && (r.touchPct < 0 || r.touchPct >= GOOD_TOUCH)
  const box = Math.min(INTERVALS.length - 1, Math.max(0, s.box + (good ? 1 : -1)))
  stats[id] = { runs: s.runs + 1, streak: good ? s.streak + 1 : 0, box, due: day + INTERVALS[box], best: Math.max(s.best, r.acc) }
  return stats
}

export type TechState = 'new' | 'learning' | 'solid' | 'due'

export function stateOf(stats: TechStats, id: string, day: number): TechState {
  const s = stats[id]
  if (!s) return 'new'
  if (s.streak < SOLID) return 'learning'
  return s.due !== undefined && s.due <= day ? 'due' : 'solid'
}

/** Review first, then the first exercise that is not solid yet, then the first one (everything is solid). */
export function nextRecipe(stats: TechStats, day: number): { recipe: Recipe; reason: 'due' | 'next' } {
  const due = SYLLABUS.find((r) => stateOf(stats, r.id, day) === 'due')
  if (due) return { recipe: due, reason: 'due' }
  return { recipe: SYLLABUS.find((r) => stateOf(stats, r.id, day) !== 'solid') ?? SYLLABUS[0], reason: 'next' }
}
