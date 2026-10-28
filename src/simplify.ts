import { voiceOf } from './accomp'
import type { Level } from './levels'
import type { Hand, Note, Song, Sym } from './song'

export { LEVELS } from './levels'
export type { Level }

/** Chord symbols need a harmony to read: a piece with a left hand. */
export const canLead = (s: Song) => s.notes.some((n) => n.h === 'L')
const sung = (s: Song, n: Note) => !!voiceOf(s, n) || (n.also !== undefined && !!voiceOf(s, { ...n, part: n.also }))

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
 * and the bass, 3 keeps the top line, 4 keeps the melody (a voice part when the score has one, else the top line) and adds chord symbols read from the harmony. The notes keep their timing and notation fields; the original song is not changed.
 */
export function simplify(s: Song, level: Level, chordsOf?: (s: Song) => Sym[]): Song {
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
    const voice = level === 4 ? live.filter((n) => sung(s, n)) : []
    keep = voice.length >= 8 ? voice : clusters(hand(live, 'R')).map((c) => c[c.length - 1]) // the sung line, or the top line
    if (level === 2) keep.push(...clusters(hand(live, 'L')).map((c) => c[0])) // the bass
  }
  const notes = keep.sort((a, b) => a.t - b.t || a.p - b.p).map((n, id) => ({ ...n, id, ...(level === 4 && { part: undefined, also: undefined }) })) // a lead sheet is one line: no parts to choose between
  return { ...s, notes, lo: notes.reduce((m, n) => Math.min(m, n.p), 127), hi: notes.reduce((m, n) => Math.max(m, n.p), 0), ...(level === 4 && chordsOf && { chords: chordsOf(s) }) }
}

/** The mildest level at which the busiest bars fit the staff. */
export function autoLevel(s: Song): Level {
  for (const l of [0, 1, 2] as const) if (notesPerBar(simplify(s, l)) <= COMFORT) return l
  return 3
}

