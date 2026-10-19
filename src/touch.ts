import type { Hand } from './song'

export type Band = 'soft' | 'medium' | 'hard'

/** Edges on the 0..127 scale: `soft` is the top of soft, `hard` the bottom of hard. */
export interface Edges {
  soft: number
  hard: number
}

export const DEFAULT_EDGES: Edges = { soft: 45, hard: 86 }

export const band = (v: number, e: Edges = DEFAULT_EDGES): Band => (v <= e.soft ? 'soft' : v < e.hard ? 'medium' : 'hard')

export interface TouchStats {
  n: number
  mean: number
  sd: number
  hist: number[] // eight bins of 16
  hands: Record<Hand, { n: number; mean: number }>
  bands: Record<Band, number>
}

/** Summary of the key velocities (0..127) behind a run. */
export function velStats(samples: { v: number; h: Hand }[], e: Edges = DEFAULT_EDGES): TouchStats {
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
  return { n, mean, sd: n ? Math.sqrt(samples.reduce((a, s) => a + (s.v - mean) ** 2, 0) / n) : 0, hist, hands: { R: hand('R'), L: hand('L') }, bands }
}
