import type { Hand, Note, Song } from './song'

export type Level = 0 | 1 | 2 | 3
export const LEVELS: Record<Level, string> = { 0: 'Full', 1: 'Both hands', 2: 'Melody and bass', 3: 'Melody' }

const CLUSTER = 0.03 // seconds: onsets this close are one chord
const GRACE = 0.08 // seconds: shorter than this is an ornament
const COMFORT = 16

/** Notes starting in the busiest bar, 95th percentile over the song. */
export function notesPerBar(s: Song): number {
  const per = new Array(s.bars.length).fill(0)
  for (const n of s.notes) per[n.bar]++
  const sorted = [...per].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length * 0.95)] ?? 0
}

/** Cluster the notes of one hand by onset. */
function clusters(notes: Note[]): Note[][] {
  const out: Note[][] = []
  for (const n of [...notes].sort((a, b) => a.t - b.t || a.p - b.p)) {
    const last = out[out.length - 1]
    if (last && n.t - last[0].t < CLUSTER) last.push(n)
    else out.push([n])
  }
  return out
}

const hand = (notes: Note[], h: Hand) => notes.filter((n) => n.h === h)

/**
 * A readable version of a song for a learner: 1 keeps both hands with at most three notes in a chord, 2 keeps the top line
 * and the bass, 3 keeps the top line. The notes keep their timing and notation fields; the original song is not changed.
 */
export function simplify(s: Song, level: Level): Song {
  if (level === 0) return s
  const live = s.notes.filter((n) => n.d >= GRACE && !n.grace)
  let keep: Note[]
  if (level === 1) {
    keep = []
    for (const h of ['R', 'L'] as const)
      for (const c of clusters(hand(live, h))) {
        if (c.length <= 3) keep.push(...c)
        else keep.push(c[0], c[c.length - 1], c[Math.floor(c.length / 2)]) // lowest, highest and one in the middle
      }
  } else {
    keep = clusters(hand(live, 'R')).map((c) => c[c.length - 1]) // the top line
    if (level === 2) keep.push(...clusters(hand(live, 'L')).map((c) => c[0])) // the bass
  }
  const notes = keep.sort((a, b) => a.t - b.t || a.p - b.p).map((n, id) => ({ ...n, id }))
  return { ...s, notes, lo: notes.reduce((m, n) => Math.min(m, n.p), 127), hi: notes.reduce((m, n) => Math.max(m, n.p), 0) }
}

/** The mildest level at which the busiest bars fit the staff. */
export function autoLevel(s: Song): Level {
  for (const l of [0, 1, 2] as const) if (notesPerBar(simplify(s, l)) <= COMFORT) return l
  return 3
}

