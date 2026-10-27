import type { Hand } from './song'
import { mean } from './util'

export type Band = 'soft' | 'medium' | 'hard'

/** Edges on the 0..127 scale: `soft` is the top of soft, `hard` the bottom of hard. */
export interface Edges {
  soft: number
  hard: number
}

export const DEFAULT_EDGES: Edges = { soft: 45, hard: 86 }

export const band = (v: number, e: Edges = DEFAULT_EDGES): Band => (v <= e.soft ? 'soft' : v < e.hard ? 'medium' : 'hard')

export type Region = 'low' | 'mid' | 'high'

export interface TouchStats {
  n: number
  mean: number
  sd: number
  hist: number[] // eight bins of 16
  hands: Record<Hand, { n: number; mean: number }>
  bands: Record<Band, number>
  regions: Record<Region, { n: number; mean: number }> // by where on the keyboard: below E3, to B4, above
}

/** Summary of the key velocities (0..127) behind a run. */
export const region = (p: number): Region => (p < 52 ? 'low' : p < 72 ? 'mid' : 'high')

export function velStats(samples: { v: number; h: Hand; p?: number }[], e: Edges = DEFAULT_EDGES): TouchStats {
  const n = samples.length
  const mean = n ? samples.reduce((a, s) => a + s.v, 0) / n : 0
  const hand = (h: Hand) => {
    const x = samples.filter((s) => s.h === h)
    return { n: x.length, mean: x.length ? x.reduce((a, s) => a + s.v, 0) / x.length : 0 }
  }
  const hist = new Array(8).fill(0)
  const bands: Record<Band, number> = { soft: 0, medium: 0, hard: 0 }
  for (const s of samples) {
    hist[Math.min(7, s.v >> 4)]++
    bands[band(s.v, e)]++
  }
  const reg = (r: Region) => {
    const x = samples.filter((s) => s.p !== undefined && region(s.p) === r)
    return { n: x.length, mean: x.length ? x.reduce((a, s) => a + s.v, 0) / x.length : 0 }
  }
  return { n, mean, regions: { low: reg('low'), mid: reg('mid'), high: reg('high') }, sd: n ? Math.sqrt(samples.reduce((a, s) => a + (s.v - mean) ** 2, 0) / n) : 0, hist, hands: { R: hand('R'), L: hand('L') }, bands }
}

const GAP = 12 // each band's average must sit at least this far above the last, or the player did not vary

/** Edges from a run of deliberately soft, medium and hard notes; null if the three did not differ enough. */
export function calibrate(soft: number[], med: number[], hard: number[]): Edges | null {
  if (!soft.length || !med.length || !hard.length) return null
  const [s, m, h] = [mean(soft), mean(med), mean(hard)]
  if (m - s < GAP || h - m < GAP) return null
  return { soft: Math.round((s + m) / 2), hard: Math.round((m + h) / 2) }
}

/**
 * Velocity targets from a file's own dynamics, mapped onto the player's range: the softest written note aims for the middle
 * of the player's soft band and the loudest for the middle of hard. Null when the file has no real dynamics to follow.
 */
export function writtenTargets(notes: { v: number }[], e: Edges = DEFAULT_EDGES): [number, number][] | null {
  const vs = notes.map((n) => n.v)
  const lo = Math.min(...vs)
  const hi = Math.max(...vs)
  if (!notes.length || hi - lo < 0.12) return null
  const from = (1 + e.soft) / 2
  const to = (e.hard + 127) / 2
  return notes.map((n) => {
    const c = from + ((n.v - lo) / (hi - lo)) * (to - from)
    return [Math.max(1, Math.round(c - 16)), Math.min(127, Math.round(c + 16))]
  })
}
