// What a run leaves on the score: wrong keys, missed notes, notes early or late. One list feeds the paper, the tap popover,
// the Mark list and the paper's summary sentence, so they cannot disagree. Pure: lazy with the results, never at boot.
import type { Judge } from './judge'
import { beatAt } from './metronome'
import { barAt, type Hand, type Song } from './song'
import { noteName } from './spell'

export interface Mark {
  kind: 'wrong' | 'miss' | 'early' | 'late'
  t: number // song seconds, to put the list in reading order
  bar: number // 0-based
  beat: number // 1-based
  hand: Hand
  p: number // the pitch played, or for a miss the pitch missed
  written?: number // a wrong key: the pitch written nearest it in time (within a beat)
  ms: number // signed: negative early, positive late; 0 for a miss and for a wrong key with no written note near
  id?: number // the written note, for a miss or a note early or late
  s?: number // the wrong key's place in judge.strays
}

/** Only notes early or late by more than the Great window are marks: a clean note, and a Great one, is fine. */
export function marksOf(j: Judge, song: Song): Mark[] {
  const where = (t: number) => {
    const bar = barAt(song.bars, t)
    return { bar, beat: (beatAt(song.bars, t)?.k ?? 0) + 1 }
  }
  const out: Mark[] = []
  song.notes.forEach((n, id) => {
    const g = j.grade[id]
    if (g === 'miss') out.push({ kind: 'miss', t: n.t, ...where(n.t), hand: n.h, p: n.p, ms: 0, id })
    else if (g === 'good' || g === 'late') out.push({ kind: j.off[id] < 0 ? 'early' : 'late', t: n.t, ...where(n.t), hand: n.h, p: n.p, ms: j.off[id], id })
  })
  j.strays.forEach(({ p, t }, s) => {
    const near = song.notes
      .filter((n) => j.st[n.id] >= 0 && Math.abs(n.t - t) <= song.spb)
      .sort((a, b) => Math.abs(a.t - t) - Math.abs(b.t - t) || Math.abs(a.p - p) - Math.abs(b.p - p))[0]
    out.push({ kind: 'wrong', t, ...where(t), hand: near?.h ?? (p >= 60 ? 'R' : 'L'), p, written: near?.p, ms: near ? ((t - near.t) / j.cfg.rate) * 1000 : 0, s })
  })
  return out.sort((a, b) => a.t - b.t)
}

/** Notes struck right: the written notes less the missed; waiting, those struck right first time. */
export const rightOf = (r: { total: number; first: number; counts: { miss: number } }) => (r.first >= 0 ? Math.round(r.first * r.total) : r.total - r.counts.miss)

const HANDS = { R: 'right hand', L: 'left hand' }

/** One sentence for a mark, in the words of the page it is on: where, then what. */
export function markLine(m: Mark, song: Song): string {
  const at = `Bar ${m.bar + 1}, beat ${m.beat}, ${HANDS[m.hand]}.`
  const name = noteName(m.p, song.fifths)
  if (m.kind === 'miss') return `${at} ${name} was missed.`
  if (m.kind !== 'wrong') return `${at} ${name} was ${Math.round(Math.abs(m.ms))} ms ${m.kind}.`
  if (m.written === undefined) return `${at} Played ${name}, which is not written here.`
  if (m.written === m.p) return `${at} ${name} struck again.`
  const off = Math.abs(m.ms) >= 100 ? `, about ${(Math.abs(m.ms) / 1000).toFixed(1)} s ${m.ms < 0 ? 'early' : 'late'}` : ''
  return `${at} Played ${name} where ${noteName(m.written, song.fifths)} is written${off}.`
}

/** Bar numbers as a phrase: "bar 7", "bars 7 and 12", "bars 7, 9 and 12", and past three just how many. */
export const barList = (bars: number[]) => (bars.length > 3 ? `${bars.length} bars` : bars.length > 1 ? `bars ${bars.slice(0, -1).join(', ')} and ${bars.at(-1)}` : `bar ${bars[0]}`)

const KIND = { wrong: ['wrong key', 'wrong keys'], miss: ['missed note', 'missed notes'], early: ['note early', 'notes early'], late: ['note late', 'notes late'] } as const

/** The whole run in one sentence, for the paper's description: "2 wrong keys in bars 7 and 12, 1 missed note in bar 12." */
export function summary(ms: Mark[]): string {
  const parts = (['wrong', 'miss', 'early', 'late'] as const).flatMap((k) => {
    const of = ms.filter((m) => m.kind === k)
    const bars = [...new Set(of.map((m) => m.bar + 1))]
    return of.length ? [`${of.length} ${KIND[k][of.length === 1 ? 0 : 1]} in ${barList(bars)}`] : []
  })
  return parts.length ? `${parts.join(', ')}.` : 'No marks on the score.'
}
