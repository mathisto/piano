import { windows } from './chords'
import type { Song } from './song'

/** Sustain pedal (MIDI CC64) against the harmony of the written piece. Pure: a song and a list of pedal events in, one plain sentence out. */

export interface PedalEv {
  t: number // song seconds at 100% tempo (the same clock as Note.t)
  down: boolean // CC64 at or above 64; below that the damper is on the strings, so it counts as up
}

export const EARLY = 0.5 // beats: a lift this long before the new chord still counts as changing with it
const LATE = 0.25 // beats, and never under LATE_MIN: the old chord may ring this long into the new one (the "legato pedal" lifts just after the new chord lands)
const LATE_MIN = 0.15 // seconds: at a quick tempo a quarter of a beat is faster than a foot
const NEAR = 0.05 // seconds: a note this close to a window's start sounds at it
const MIN_CHANGES = 2 // chord changes the pedal must touch before a sentence is worth saying

interface Change {
  t: number
  bar: number // 0-based
}

/** Where the bass moves: at each window start (half bars, or whole bars in odd metres) the lowest note sounding there that lasts a beat or more is the bass, and a change is where its pitch class differs from the one before. A bass shorter than a beat is passing. */
// ponytail: a harmony that moves over a held bass (IV 6/4 over a tonic pedal point) is not a change, and an accompaniment of short notes (Alberti) has no bass, so the coach says nothing there. Chord-label changes alongside if real pieces need them.
export function changes(song: Song): Change[] {
  const out: Change[] = []
  let prev = -1
  for (const w of windows(song)) {
    const low = Math.min(...song.notes.filter((n) => n.t <= w.a + NEAR && n.t + n.d > w.a + NEAR && n.d >= song.spb - 1e-6).map((n) => n.p))
    if (low === Infinity) continue
    if (prev >= 0 && low % 12 !== prev) out.push({ t: w.a, bar: w.bar })
    prev = low % 12
  }
  return out
}

export interface PedalReport {
  changes: number // chord changes the pedal was in play at
  blurred: number[] // bars (0-based) where the old chord was still held down when the new one sounded
}

/** Per chord change, measured from when the player struck it (`struck`: song time per note index, from the judge) or else from where it is written: lifted within [EARLY before, LATE after] is a change with the chord; down all through that window is a blur; up all through it means the pedal was not in play there and is not counted. Null when the pedal was not used or touched fewer than MIN_CHANGES. */
export function pedalReport(song: Song, ev: PedalEv[], struck: (number | undefined)[] = []): PedalReport | null {
  if (!ev.some((e) => e.down)) return null
  ev = [...ev].sort((a, b) => a.t - b.t)
  const at = (t: number) => ev.reduce((s, e) => (e.t <= t ? e.down : s), false)
  const blurred: number[] = []
  let n = 0
  for (const c of changes(song)) {
    const t = Math.min(...song.notes.flatMap((x, i) => (Math.abs(x.t - c.t) < NEAR && struck[i] !== undefined ? [struck[i]!] : [])), Infinity)
    const on = t < Infinity ? t : c.t
    const from = on - EARLY * song.spb
    const to = on + Math.max(LATE * song.spb, LATE_MIN)
    if (ev.some((e) => !e.down && e.t >= from && e.t <= to)) n++
    else if (at(from) && at(to)) (n++, blurred.push(c.bar))
  }
  return n >= MIN_CHANGES ? { changes: n, blurred } : null
}

const barList = (bars: number[]) => {
  const b = [...new Set(bars)].map((x) => x + 1)
  const head = b.slice(0, 3).join(', ')
  return `bar${b.length > 1 ? 's' : ''} ${b.length > 3 ? `${head} and ${b.length - 3} more` : head.replace(/, (\d+)$/, ' and $1')}`
}

/** One sentence, plain words: what the pedal did at the chord changes, and what to do about it. */
export function pedalLine(r: PedalReport) {
  const { changes: n, blurred } = r
  if (!blurred.length) return `Pedal: you lifted it and pressed it again with the chord every time (${n} of ${n}).`
  if (blurred.length === n) return `Pedal: it stayed down through all ${n} chord changes, so the chords ran together. Lift it just as the next chord lands, then press it again.`
  return `Pedal: you changed it with the chord ${n - blurred.length} of ${n} times; in ${barList(blurred)} the old chord was still ringing under the new one.`
}
