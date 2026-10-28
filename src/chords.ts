import type { Song } from './song'

// The chord match shared by the Lead sheet (lead.ts) and the pedal coach (pedal.ts): what chord a window of a piece sounds like.

/** The windows a chord is read in: each bar cut in halves, or left whole in odd metres. */
export function* windows(song: Song): Generator<{ bar: number; a: number; b: number }> {
  for (const bar of song.bars) {
    const cuts = bar.n % 2 === 0 && bar.n >= 4 ? [bar.t0, (bar.t0 + bar.t1) / 2, bar.t1] : [bar.t0, bar.t1]
    for (let i = 0; i + 1 < cuts.length; i++) yield { bar: bar.i, a: cuts[i], b: cuts[i + 1] }
  }
}

// Triads and sevenths, simplest first (a tie goes to the earlier one, and a seventh must sound to beat its triad).
export const SHAPES: [string, number[]][] = [
  ['', [0, 4, 7]],
  ['m', [0, 3, 7]],
  ['7', [0, 4, 7, 10]],
  ['maj7', [0, 4, 7, 11]],
  ['m7', [0, 3, 7, 10]],
  ['dim', [0, 3, 6]],
]
// What the match is tuned by, each term measured on the held-out half of 256 analysed pieces (docs/changes/chordeval2.md).
export const TUNE: Record<string, number> = {
  missing: 0.15, // per chord tone that does not sound at all
  seventh: 0.05, // what a seventh must add to the fit over the triad: a passing note does not make one
  maj7: 0.3, // and a major seventh, rare in the corpus, this much more (a shape's name keys its extra cost)
  m7: 0.3, // and a minor seventh
  strong: 2, // extra weight on a note struck as the window opens, if it lasts or is the lowest (a passing tone is rarely on the beat)
  root: 0.1, // bonus for the chord whose root is the lowest note sounding as the window opens
  dia: 0.1, // bonus for a chord that stays inside the key signature's scale (and the raised seventh of its relative minor)
}
const BASS_SHARE = 0.4 // a note is the bass when it sounds this share of the window
const NEAR = 0.05 // seconds: a note starting this close to the window start is on its first beat
const BIG = 0.25 // ...and counts as struck there only if it lasts this share of the window: a short note on the beat is an ornament, not the chord

/** The chord of one window [a, b): root pitch class, the index into SHAPES, the shape's pitch classes and the bass pitch class (the root unless a lower chord tone sounds most of the window). Null for silence. `notes` are those sounding in the window, for a caller that has them. */
export function chordAt(song: Song, a: number, b: number, t = TUNE, notes = song.notes) {
  const L = b - a
  const live = notes.map((n) => ({ p: n.p, len: Math.min(b, n.t + n.d) - Math.max(a, n.t), on: Math.abs(n.t - a) < NEAR, open: n.t < a + NEAR })).filter((n) => n.len > 0)
  const low = Math.min(...live.filter((n) => n.open).map((n) => n.p)) // the lowest note sounding as the window opens
  const bass = Math.min(...live.filter((n) => n.len >= BASS_SHARE * L).map((n) => n.p)) // the lowest sounding most of it
  const w = new Array<number>(12).fill(0)
  for (const n of live) w[n.p % 12] += (n.len / L) * (1 + (n.on && (n.len >= BIG * L || n.p === low) ? t.strong : 0))
  const sum = w.reduce((x, y) => x + y, 0)
  if (!sum) return null
  const tonic = (song.fifths * 7 + 84) % 12
  const scale = [0, 2, 4, 5, 7, 8, 9, 11].map((i) => (tonic + i) % 12)
  let top = -Infinity
  let best: [number, number] = [0, 0]
  for (let r = 0; r < 12; r++)
    SHAPES.forEach(([name, s], k) => {
      const set = s.map((i) => (r + i) % 12)
      const inside = set.reduce((x, pc) => x + w[pc], 0)
      const missing = set.filter((pc) => !w[pc]).length
      const score = (2 * inside - sum) / sum - t.missing * missing - t.seventh * (set.length - 3) - (t[name] || 0) + (r === low % 12 ? t.root : 0) + (set.every((pc) => scale.includes(pc)) ? t.dia : 0)
      if (score > top + 1e-9) [top, best] = [score, [r, k]]
    })
  const [root, k] = best
  const set = SHAPES[k][1].map((i) => (root + i) % 12)
  return { root, k, set, bass: set.includes(bass % 12) ? bass % 12 : root } // a bass outside the chord is a passing note, not an inversion (no bass, NaN, is root too)
}
