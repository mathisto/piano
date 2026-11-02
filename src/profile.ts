// Rules over the attempt log: shared by nextUp() and Progress. Pure and lazy; no store or DOM.
import type { CardRow, HistoryEntry } from './store'
import { get, keys } from './kv'

const TARGET = 0.85

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2 : 0
}

/** Median pairwise slope: a short, outlier-resistant trend over equally spaced sessions. */
export const slope = (xs: number[]) => median(xs.flatMap((a, i) => xs.slice(i + 1).map((b, j) => (b - a) / (j + 1))))

const sessions = (log: HistoryEntry[], id: string) => log.filter((r) => r.id === id && !r.as).sort((a, b) => a.ts - b.ts)

export type Adaptation = 'back' | 'change' | undefined

/** The first rule that applies: two low sessions step back; five stalled sessions change the task. */
export function adaptation(log: HistoryEntry[], id: string, only?: Exclude<Adaptation, undefined>): Adaptation {
  const rows = sessions(log, id)
  const two = rows.slice(-2)
  if (only !== 'change' && two.length === 2 && two.every((r) => r.acc < 0.7)) return 'back'
  if (only === 'back') return undefined
  const five = rows.slice(-5)
  if (five.length < 5 || five.reduce((n, r) => n + r.acc, 0) / five.length >= TARGET || slope(five.map((r) => r.acc)) > 0) return undefined
  const timed = five.map((r) => r.ms).filter((x): x is number => !!x)
  return timed.length === 5 && slope(timed.map(Math.log)) < 0 ? undefined : 'change'
}

export interface Stuck {
  id: string
  label: string
  sessions: number
}

/** Units stalled now, newest first. Uses the same rule as nextUp(). */
export function stuck(log: HistoryEntry[]): Stuck[] {
  const ids = [...new Set(log.flatMap((r) => (r.id ? [r.id] : [])))]
  return ids
    .filter((id) => adaptation(log, id, 'change') === 'change')
    .map((id) => {
      const rows = sessions(log, id)
      return { id, label: rows.at(-1)!.label, sessions: Math.min(5, rows.length), ts: rows.at(-1)!.ts }
    })
    .sort((a, b) => b.ts - a.ts)
    .map(({ ts: _, ...x }) => x)
}

export interface WeakNote {
  clef: 'treble' | 'bass'
  pitch: number
  attempts: number
  misses: number
  rate: number // shrunk miss rate, 0..1
  confused?: { pitch: number; n: number }
}

/** Card attempts are kept in monthly shards; Progress joins them only when opened. */
export async function getCards(): Promise<CardRow[]> {
  const ks = (await keys()).map(String).filter((k) => k.startsWith('log:cards:')).sort()
  return (await Promise.all(ks.map((k) => get<CardRow[]>(k)))).flatMap((r) => r ?? []).sort((a, b) => a.ts - b.ts)
}

/** Reading misses shrunk toward the player's mean; thin notes stay hidden until ten attempts. */
export function weakNotes(rows: CardRow[]): WeakNote[] {
  const one = rows.flatMap((r) => {
    const m = /^1:(treble|bass):(\d+)/.exec(r.k)
    return m ? [{ row: r, clef: m[1] as WeakNote['clef'], pitch: Number(m[2]) }] : []
  })
  const error = one.length ? one.filter((x) => !x.row.y).length / one.length : 0
  const keys = [...new Set(one.map((x) => `${x.clef}:${x.pitch}`))]
  return keys
    .map((key) => {
      const [clef, p] = key.split(':') as [WeakNote['clef'], string]
      const pitch = Number(p)
      const xs = one.filter((x) => x.clef === clef && x.pitch === pitch)
      const misses = xs.filter((x) => !x.row.y).length
      const got = new Map<number, number>()
      for (const x of xs) for (const q of x.row.got ?? []) if (q !== pitch) got.set(q, (got.get(q) ?? 0) + 1)
      const confused = [...got].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]
      return { clef, pitch, attempts: xs.length, misses, rate: (misses + 8 * error) / (xs.length + 8), ...(confused && { confused: { pitch: confused[0], n: confused[1] } }) }
    })
    .filter((x) => x.attempts >= 10)
    .sort((a, b) => b.rate - a.rate || b.attempts - a.attempts || a.pitch - b.pitch)
}
