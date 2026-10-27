// A pace for a score that names none, guessed from its form. Only forms that held up when checked against the 1,945 library pieces with a stated
// pace (scripts/library/formtempo-eval.mjs, docs/changes/formtempo.md) are here; for the other forms (minuet, sarabande, prelude, song ...)
// the form did not predict the pace better than a flat guess. Quarter-note bpm, whatever the meter.
import type { Song } from './song'

const FORMS: [name: string, re: RegExp, bpm: number][] = [
  ['mazurka', /mazurk/i, 140],
  ['waltz', /waltz|walzer|valse/i, 150],
  ['etude', /[eé]tude|\bstud(?:y|ies)\b/i, 138],
  ['allemande', /allemande/i, 80], // four in the library, 54 to 80
  ['bourrée', /bourr[eèé]e/i, 168], // five bourrées in the library, four of them one editor's 184: pulled toward the fifth's 160
]
export const DEFAULT_BPM = 100 // no better a guess exists: meter, era and note density did not move the error (docs/changes/formtempo.md)
export const MAX_RATE = 8 // onsets a second at the median inter-onset interval: 90% of the stated-pace pieces play at 7.7 or slower
export const MIN_BPM = 40

/** Quarter-note positions of a song's onsets, one per distinct instant (a chord is one), in order. */
export function onsetsOf(s: Song): number[] {
  const start: number[] = []
  let q = 0
  for (const b of s.bars) {
    start.push(q)
    q += b.ql ?? (b.n * 4) / b.den
  }
  return [...new Set(s.notes.filter((n) => !n.grace).map((n) => Math.round((start[n.bar] + (n.qb ?? 0)) * 48) / 48))].sort((a, b) => a - b)
}

/** Median gap between onsets, in quarters (0.5 when there are too few to tell). */
export const medianIoi = (onsets: number[]) => {
  const gaps = onsets.slice(1).map((t, i) => t - onsets[i]).sort((a, b) => a - b)
  return gaps[gaps.length >> 1] ?? 0.5
}

/** The pace to guess: the form's if the text names one that is in the table (`form` says which), else DEFAULT_BPM; either way slowed
 * until the median inter-onset gap plays at MAX_RATE a second or less, and never under MIN_BPM. */
export function formTempo(text: string, onsets: number[]): { bpm: number; form?: string } {
  const f = FORMS.find(([, re]) => re.test(text))
  const bpm = Math.max(MIN_BPM, Math.min(f?.[2] ?? DEFAULT_BPM, MAX_RATE * 60 * medianIoi(onsets)))
  return { bpm: Math.round(bpm), ...(f && { form: f[0] }) }
}
