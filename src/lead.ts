import { pcName } from './chord'
import { chordIn, windows } from './pedal'
import type { Song, Sym } from './song'

// Triads and sevenths, simplest first (a tie goes to the earlier one, and a seventh must sound to beat its triad).
const SHAPES: [string, number[]][] = [
  ['', [0, 4, 7]],
  ['m', [0, 3, 7]],
  ['7', [0, 4, 7, 10]],
  ['maj7', [0, 4, 7, 11]],
  ['m7', [0, 3, 7, 10]],
  ['dim', [0, 3, 6]],
]
const SEVENTH = 0.3 // what a seventh must add to the fit over the triad: a passing note does not make one
const BASS_SHARE = 0.4 // a note is the bass when it sounds this share of the window

/** A chord symbol for every half bar, read from the harmony of the notes (pedal.ts's template match): 'C', 'Am7', 'G/B', 'F♯dim'. Not the composer's marks. `keys` is a block chord with its bass below, for the app to play. */
// ponytail: half-bar resolution, triads and sevenths only; no ninths, suspensions or chords inside a window. Finer windows and more shapes if real pieces need them.
export function chordsOf(song: Song): Sym[] {
  const out: Sym[] = []
  for (const w of windows(song)) {
    const c = chordIn(song, w.a, w.b, SHAPES.map((s) => s[1]), SEVENTH)
    if (!c) continue
    const [root, k] = c
    const set = SHAPES[k][1].map((i) => (root + i) % 12)
    const low = Math.min(...song.notes.filter((n) => Math.min(w.b, n.t + n.d) - Math.max(w.a, n.t) >= BASS_SHARE * (w.b - w.a)).map((n) => n.p)) % 12
    const b = set.includes(low) ? low : root // a bass outside the chord is a passing note, not an inversion (NaN, no bass, is root too)
    out.push({ t: w.a, d: w.b - w.a, bar: w.bar, name: pcName(root, song.fifths) + SHAPES[k][0] + (b === root ? '' : `/${pcName(b, song.fifths)}`), keys: [36 + b, ...set.map((pc) => 48 + pc)] })
  }
  return out
}
