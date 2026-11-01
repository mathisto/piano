import type { Bar, Note, Song } from './song'

// The opening bars of a score, and the compact form the library ships them in (docs/changes/library-c1-s1.md). The pipeline writes one sidecar file of these for the
// whole catalogue (catalog.json names it: `incipits`), the app decodes a piece's entry into a Song and hands it to the cover's engraver, so a cover for a piece that
// is not on the device is the same engraving as one drawn from its score. Pure, no DOM: the pipeline bundles this file too.

export const KEEP = 3 // bars of a score a cover keeps: the layout shows one or two, and the third stops it ending in a final barline

/** The first bars of a score and nothing else: all a cover needs, and a few notes to hold instead of a piece. */
export function incipit(song: Song): Song {
  const bars = song.bars.slice(0, KEEP)
  return { ...song, bars, notes: song.notes.filter((n) => n.bar < bars.length), end: bars[bars.length - 1]?.t1 ?? 0, chords: undefined, marks: undefined, wedges: undefined, curve: undefined, dyn: undefined }
}

/** One piece: [unit, seconds per quarter, bars, notes, key changes]. A time is a whole number of 1/unit quarters (48 holds every triplet and 64th, 240 a quintuplet, 5040 a septuplet).
 *  bars: numerator, denominator, pickup length in units (0: a full bar), per bar; their times are laid at the first bar's pace (the engraver reads a time only to order graces).
 *  notes: bar, onset, length, pitch, flags, then what the flags announce (a grace's time, a tuplet's ratio, a tie's remainder, a part), per note.
 *  keys: bar, fifths, per key change in the kept bars ([] when the score has none). x: the few times the unit does not give back to the last bit (a sum of thirds that came to
 *  0.16666666666666674): note, which (0 onset, 1 length, 2 tie), the number itself, so a cover is the same engraving to the last digit. */
export type Enc = [u: number, spq: number, bars: number[], notes: number[], keys: number[], x?: number[]]

// the flag bits of a note
const LEFT = 1, TIE = 2, VOICE = 4, GRACE = 8, ACC = 48, TUPLET = 64, REST = 128, ART = 1792, SLUR = 2048, PART = 4096
const ARTS: (Note['art'] | undefined)[] = [undefined, 'stac', 'ten', 'acc']
const ACC_BITS = new Map<number | undefined, number>([[undefined, 0], [-1, 16], [1, 32], [0, 48]])
const UNITS = [48, 240, 5040]

const ms = (x: number) => Math.round(x * 1000)

/** The facts of the catalogue that a Song needs besides the notes; the sidecar does not repeat them. */
export interface Facts {
  id: string
  title: string
  fifths: number
  lo: number
  hi: number
  mode?: 'major' | 'minor'
  meter?: string // present only when the source states it
}

export function encode(song: Song): Enc {
  const s = incipit(song)
  const times = [...s.notes.flatMap((n) => [n.qb ?? 0, n.qd ?? 0, n.qrest ?? 0]), ...s.bars.map((b) => b.ql ?? 0)]
  const u = UNITS.find((u) => times.every((q) => Math.abs(q * u - Math.round(q * u)) < 1e-6)) ?? UNITS[UNITS.length - 1]
  const k = (q: number) => Math.round(q * u)
  const bars = s.bars.flatMap((b) => [b.n, b.den, b.ql ? k(b.ql) : 0])
  const odd: number[] = []
  const notes = s.notes.flatMap((n, i) => {
    if (n.qb === undefined || n.qd === undefined) throw new Error('a note with no written position or length')
    ;[n.qb, n.qd, n.qrest ?? 0].forEach((q, w) => q && k(q) / u !== q && odd.push(i, w, q))
    const f = (n.h === 'L' ? LEFT : 0) | (n.tieNext ? TIE : 0) | (n.voice === 2 ? VOICE : 0) | (n.grace ? GRACE : 0) | ACC_BITS.get(n.acc)! | (n.tuplet ? TUPLET : 0) | (n.qrest ? REST : 0) | (ARTS.indexOf(n.art) << 8) | (n.slur ? SLUR : 0) | (n.part ? PART : 0)
    return [n.bar, k(n.qb), k(n.qd), n.p, f, ...(n.grace ? [ms(n.t - s.bars[n.bar].t0)] : []), ...(n.tuplet ? [n.tuplet.num, n.tuplet.den] : []), ...(n.qrest ? [k(n.qrest)] : []), ...(n.part ? [n.part] : [])]
  })
  const keys = s.keys?.filter((x) => x.bar < KEEP).flatMap((x) => [x.bar, x.fifths])
  const b0 = s.bars[0]
  const spq = (b0.t1 - b0.t0) / (b0.ql ?? (b0.n * 4) / b0.den) // seconds per quarter
  return [u, Math.round(spq * 1e6) / 1e6, bars, notes, keys ?? [], ...(odd.length ? [odd] : [])] as Enc
}

export function decode([u, spq, b, n, k, x]: Enc, f: Facts): Song {
  const bars: Bar[] = []
  for (let i = 0, t = 0; i < b.length; i += 3) {
    const ql = b[i + 2] ? b[i + 2] / u : (b[i] * 4) / b[i + 1]
    bars.push({ i: i / 3, t0: t, t1: (t += ql * spq), n: b[i], den: b[i + 1], ...(b[i + 2] && { ql }) })
  }
  const notes: Note[] = []
  for (let i = 0; i < n.length; ) {
    const [bar, qb, qd, p, fl] = n.slice(i, i + 5)
    i += 5
    const x = bars[bar]
    const note: Note = { id: notes.length, t: x.t0 + (qb / u) * spq, d: (qd / u) * spq, p, v: 0.6, h: fl & LEFT ? 'L' : 'R', bar, beats: qd / u, qb: qb / u, qd: qd / u }
    if (fl & TIE) note.tieNext = true
    if (fl & VOICE) note.voice = 2
    if (fl & ACC) note.acc = ([undefined, -1, 1, 0] as const)[(fl & ACC) >> 4]
    if (ARTS[(fl & ART) >> 8]) note.art = ARTS[(fl & ART) >> 8]
    if (fl & SLUR) note.slur = true
    if (fl & GRACE) {
      note.grace = true
      note.t = x.t0 + n[i++] / 1000
    }
    if (fl & TUPLET) {
      note.tuplet = { num: n[i], den: n[i + 1] }
      i += 2
    }
    if (fl & REST) note.qrest = n[i++] / u
    if (fl & PART) note.part = n[i++] // slurs run along one hand of one part
    notes.push(note)
  }
  for (let i = 0; x && i < x.length; i += 3) {
    const note = notes[x[i]]
    if (x[i + 1] === 0) note.qb = x[i + 2]
    else if (x[i + 1] === 1) note.qd = note.beats = x[i + 2]
    else note.qrest = x[i + 2]
    if (!note.grace && x[i + 1] === 0) note.t = bars[note.bar].t0 + x[i + 2] * spq
  }
  const keys = k.length ? Array.from({ length: k.length / 2 }, (_, i) => ({ bar: k[2 * i], fifths: k[2 * i + 1] })) : undefined
  return { id: f.id, title: f.title, notes, bars, end: bars[bars.length - 1]?.t1 ?? 0, fifths: f.fifths, lo: f.lo, hi: f.hi, spb: bars[0].den === 8 && bars[0].n > 3 && bars[0].n % 3 === 0 ? spq * 1.5 : spq, ...(keys && { keys }), ...((f.mode || f.meter) && { stated: { ...(f.mode && { mode: f.mode }), ...(f.meter && { meter: true as const }) } }) }
}
