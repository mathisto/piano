import { dayNum, type Stats } from './drill'
import { TRAINERS, deckOf, type Trainer } from './theory'

export type PlanMin = 5 | 10 | 20 | 30 | 45
export const PLAN_LENGTHS: PlanMin[] = [5, 10, 20, 30, 45]

/**
 * The day as blocks of minutes: warm-up (Technique, Scales), reading and theory, the piece, then review (a piece due,
 * the worst bars, a reading stage due). A slot lists alternatives, the first one that exists wins.
 */
const PLANS: Record<PlanMin, [string, number][]> = {
  5: [['warm', 2], ['read', 3]],
  10: [['warm', 2], ['read', 2], ['piece', 6]],
  20: [['warm', 4], ['theory|read', 3], ['sight', 4], ['piece', 6], ['again|fix|review', 3]],
  30: [['warm', 3], ['scale', 3], ['read', 5], ['sight', 4], ['piece', 10], ['fix', 2], ['again|theory|path|review', 3]],
  45: [['warm', 5], ['scale', 5], ['read', 5], ['theory|path|run', 3], ['sight', 5], ['piece', 15], ['fix', 3], ['again|review', 4]],
}

/** The rows of a plan from the steps that exist today; minutes of a slot with nothing to offer go to the piece. */
export function planOf(len: PlanMin, have: Iterable<string>): { key: string; min: number }[] {
  const ok = new Set(have)
  let spare = 0
  const rows: { key: string; min: number }[] = []
  for (const [slot, min] of PLANS[len]) {
    const key = slot.split('|').find((k) => ok.has(k))
    if (key) rows.push({ key, min })
    else spare += min
  }
  const piece = rows.find((r) => r.key === 'piece')
  if (piece) piece.min += spare
  return rows
}

/** The Theory trainer and level with the most cards due for review, if any. */
export function theoryDue(stats: Stats, today = dayNum()): { trainer: Trainer; level: number; name: string; due: number } | undefined {
  let best: ReturnType<typeof theoryDue>
  if (!Object.values(stats).some((s) => (s.due ?? Infinity) <= today)) return best // nothing due: no deck to build (it ran at every boot)
  for (const t of TRAINERS)
    for (let level = 1; level <= Math.max(1, t.levels.length); level++) {
      const due = deckOf(t.id, level).filter((c) => (stats[c.id]?.due ?? Infinity) <= today).length
      if (due > (best?.due ?? 0)) best = { trainer: t.id, level, name: t.name, due }
    }
  return best
}
