import type { Song } from './song'

/** Sustain pedal (MIDI CC64) against the harmony of the written piece. Pure: a song and a list of pedal events in, one plain sentence out. */

export interface PedalEv {
  t: number // song seconds at 100% tempo (the same clock as Note.t)
  down: boolean // CC64 at or above 64; below that the damper is on the strings, so it counts as up
}

export const EARLY = 0.5 // beats: a lift this long before the new chord still counts as changing with it
export const LATE = 0.25 // beats: the old chord may ring this long into the new one (the "legato pedal" lifts just after the new chord lands)
export const MIN_CHANGES = 2 // chord changes the pedal must touch before a sentence is worth saying

// Chord templates as pitch-class offsets from the root, simplest first (a tie goes to the earlier one).
const SHAPES = [[0, 4, 7], [0, 3, 7], [0, 4, 7, 10], [0, 3, 6]]

interface Change {
  t: number
  bar: number // 0-based
}

/** The best-fitting chord for the notes sounding in [a, b): template match on pitch classes weighted by how long each sounds. Null for silence. */
function chordIn(song: Song, a: number, b: number): string | null {
  const w = new Array<number>(12).fill(0)
  for (const n of song.notes) {
    const len = Math.min(b, n.t + n.d) - Math.max(a, n.t)
    if (len > 0) w[n.p % 12] += len
  }
  const sum = w.reduce((x, y) => x + y, 0)
  if (!sum) return null
  let best = ''
  let top = -Infinity
  for (let r = 0; r < 12; r++)
    SHAPES.forEach((s, k) => {
      const set = s.map((i) => (r + i) % 12)
      const inside = set.reduce((x, pc) => x + w[pc], 0)
      const missing = set.filter((pc) => !w[pc]).length
      const score = (inside - (sum - inside)) / sum - 0.15 * missing
      if (score > top + 1e-9) [top, best] = [score, `${r}:${k}`]
    })
  return best
}

/** Where the harmony moves: bars are cut in halves (or left whole in odd metres), each half is given a chord, and a change is where the chord differs from the one before. */
// ponytail: half-bar resolution; a chord that changes on beat 2 or 3 is missed, and a melody-only passage can read as chords that are not there. Finer windows or bass-led detection if real pieces need it.
export function changes(song: Song): Change[] {
  const out: Change[] = []
  let prev: string | null = null
  for (const b of song.bars) {
    const cuts = b.n % 2 === 0 && b.n >= 4 ? [b.t0, (b.t0 + b.t1) / 2, b.t1] : [b.t0, b.t1]
    for (let i = 0; i + 1 < cuts.length; i++) {
      const c = chordIn(song, cuts[i], cuts[i + 1])
      if (c === null) continue
      if (prev !== null && c !== prev) out.push({ t: cuts[i], bar: b.i })
      prev = c
    }
  }
  return out
}

export interface PedalReport {
  changes: number // chord changes the pedal was in play at
  blurred: number[] // bars (0-based) where the old chord was still held down when the new one sounded
}

/** Per chord change: lifted within [EARLY before, LATE after] is a change with the chord; down all through that window is a blur; up all through it means the pedal was not in play there and is not counted. Null when the pedal was not used or touched fewer than MIN_CHANGES. */
export function pedalReport(song: Song, ev: PedalEv[]): PedalReport | null {
  if (!ev.some((e) => e.down)) return null
  ev = [...ev].sort((a, b) => a.t - b.t)
  const at = (t: number) => ev.reduce((s, e) => (e.t <= t ? e.down : s), false)
  const blurred: number[] = []
  let n = 0
  for (const c of changes(song)) {
    const from = c.t - EARLY * song.spb
    const to = c.t + LATE * song.spb
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
