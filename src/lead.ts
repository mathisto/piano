import { pcName } from './chord'
import { chordAt, SHAPES, TUNE, windows } from './chords'
import type { Song, Sym } from './song'

export { chordAt, SHAPES, TUNE }

/** A chord symbol for every half bar, read from the harmony of the notes (a template match, tuned on analysed pieces: docs/changes/chordeval2.md): 'C', 'Am7', 'G/B', 'F♯dim'. Not the composer's marks. `keys` is a block chord with its bass below, for the app to play. */
// ponytail: half-bar resolution, triads and sevenths only; no ninths, suspensions or chords inside a window. Finer windows and more shapes if real pieces need them.
export function chordsOf(song: Song): Sym[] {
  const out: Sym[] = []
  for (const w of windows(song)) {
    const bar = song.bars[w.bar]
    if (bar && bar.ql !== undefined && bar.ql < (bar.n * 4) / bar.den) continue // a pickup is a melody note or two leading in, not a harmony
    const pcs = new Set(song.notes.filter((n) => n.t < w.b && n.t + n.d > w.a).map((n) => n.p % 12))
    if (pcs.size < 3) continue // two pitch classes are a figure (Für Elise's E and D sharp), not a chord
    const c = chordAt(song, w.a, w.b)
    if (!c) continue
    const { root, k, set, bass: b } = c
    out.push({ t: w.a, d: w.b - w.a, bar: w.bar, name: pcName(root, song.fifths) + SHAPES[k][0] + (b === root ? '' : `/${pcName(b, song.fifths)}`), keys: [36 + b, ...set.map((pc) => 48 + pc)] })
  }
  return out
}
