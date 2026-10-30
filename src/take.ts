// A take: one Perform or Learn run of a piece as you played it, kept to listen back to, to compare with last time,
// and to show as a ghost on the next run. Plain arrays of small integers, so IndexedDB stores a few bytes a note.
import { barAt, type Hand, type Song } from './song'

export interface Take {
  ts: number
  mode: 'perform' | 'learn'
  rate: number // tempo, 1 = as written
  wait: boolean // the song waited for you: its timing says nothing
  acc: number // the run's accuracy and cleanness, as the results card showed them
  clean: boolean
  n: number // notes in the piece when recorded: another arrangement (Notes shown) cannot be compared note by note
  p: number[] // per key struck, in order: pitch
  v: number[] // velocity 1..127
  t: number[] // key down, song ms
  d: number[] // held, song ms
  i: number[] // the written note it played, -1 for a wrong note
  miss: number[] // written notes not played
  ped?: number[] // song ms of each sustain pedal change, down first, then up, alternating (takes from before 2026-10-30 have none)
}

export const KEEP = 3 // takes kept per piece
export const MAX_KEYS = 4000 // a take stops recording past this many keys: about 60 KB in the worst case

export const newTake = (mode: Take['mode'], rate: number, wait: boolean, n: number): Take => ({ ts: Date.now(), mode, rate, wait, acc: 0, clean: false, n, p: [], v: [], t: [], d: [], i: [], miss: [] })

/** The previous take as faint marks for the next run: where each key went down and for how long, in song seconds, in time order. */
export function ghostOf(k: Take, song: Pick<Song, 'notes'>): { p: number[]; t: number[]; d: number[]; h: Hand[] } {
  const order = k.t.map((_, j) => j).sort((a, b) => k.t[a] - k.t[b])
  const same = k.n === song.notes.length
  return {
    p: order.map((j) => k.p[j]),
    t: order.map((j) => k.t[j] / 1000),
    d: order.map((j) => k.d[j] / 1000),
    h: order.map((j) => (same && k.i[j] >= 0 ? song.notes[k.i[j]].h : k.p[j] < 60 ? 'L' : 'R')),
  }
}

export interface BarStat {
  acc: number | null // right keys over right keys, missed notes and wrong keys; null when nothing was played or due
  off: number | null // mean ms early (-) or late (+) of the right keys, at the speed you played; null when none, or the song waited
}

/** Per bar, this run against last time, plus the whole piece. Null when the two were recorded from different arrangements. */
export function compareTakes(song: Pick<Song, 'notes' | 'bars'>, now: Take, last: Take): { bars: [BarStat, BarStat][]; all: [BarStat, BarStat] } | null {
  if (now.n !== song.notes.length || last.n !== song.notes.length) return null
  const a = stats(song, now)
  const b = stats(song, last)
  return { bars: a.bars.map((s, i) => [s, b.bars[i]]), all: [a.all, b.all] }
}

function stats({ notes, bars }: Pick<Song, 'notes' | 'bars'>, k: Take) {
  const n = bars.length + 1 // the last slot is the whole piece
  const right = new Array(n).fill(0)
  const bad = new Array(n).fill(0)
  const off = new Array(n).fill(0)
  const add = (bar: number, ok: boolean, ms = 0) => {
    for (const x of [bar, n - 1]) {
      if (ok) (right[x]++, (off[x] += ms))
      else bad[x]++
    }
  }
  k.i.forEach((i, j) => (i >= 0 ? add(notes[i].bar, true, (k.t[j] - notes[i].t * 1000) / k.rate) : add(barAt(bars, k.t[j] / 1000), false)))
  for (const i of k.miss) add(notes[i].bar, false)
  const at = (x: number): BarStat => ({ acc: right[x] + bad[x] ? right[x] / (right[x] + bad[x]) : null, off: right[x] && !k.wait ? off[x] / right[x] : null })
  return { bars: bars.map((_, x) => at(x)), all: at(n - 1) }
}
