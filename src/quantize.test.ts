import { Midi } from '@tonejs/midi'
import { describe, expect, it } from 'vitest'
import { figure } from './layout'
import { scoreFlags } from './flags'
import { measure, mixed, oddTuplets, orchestral, pianoHuman, ritard, sixEight, waltz, PPQ, type Fixture, type Metrics } from './notation-fixtures'
import { notate, quantize, tiedSegments } from './quantize'
import { fromMusicXml } from './musicxml'
import { fromMidi } from './midi-tracks'
import { estimateFifths, fromSpec, type Note, type Song } from './song'
import { spell, spellWindow } from './spell'

const barQ = (s: Song, i: number) => s.bars[i].ql ?? (s.bars[i].n * 4) / s.bars[i].den
/** Absolute written onset in quarters. */
const absQ = (s: Song, n: Note) => s.bars.slice(0, n.bar).reduce((a, _, i) => a + barQ(s, i), 0) + n.qb!

const imp = (f: Fixture | ArrayBuffer) => fromMidi('buf' in f ? f.buf : f, 't', 'id', 60)

/** Share of notes written where the player meant them (graces excluded). Notes align with truth by (tick, pitch). */
function accuracy(s: Song, f: Fixture) {
  const truth = [...f.truth].sort((a, b) => a.tick - b.tick || a.p - b.p)
  expect(s.notes).toHaveLength(truth.length)
  const main = truth.map((t, i) => ({ t, n: s.notes[i] })).filter((x) => !x.t.grace)
  return {
    hit: main.filter((x) => Math.abs(absQ(s, x.n) - x.t.at - (s.bars[0].ql ?? 0) * 0) < 1e-3).length / main.length,
    graces: [s.notes.filter((n) => n.grace).length, truth.filter((t) => t.grace).length],
    chords: [new Set(main.map((x) => `${x.n.h}:${absQ(s, x.n).toFixed(3)}`)).size, new Set(main.map((x) => `${x.n.h}:${x.t.at.toFixed(3)}`)).size],
  }
}

/** Per hand and voice, a note's written value must end by the next onset in that voice, and by the barline unless tied. */
function overlaps(s: Song) {
  let bad = 0
  const key = (n: Note) => `${n.h}:${n.voice}`
  const lists = new Map<string, number[]>()
  for (const n of s.notes) if (!n.grace) lists.set(key(n), [...(lists.get(key(n)) ?? []), absQ(s, n)])
  for (const n of s.notes) {
    if (n.grace) continue
    const at = absQ(s, n)
    const next = lists.get(key(n))!.filter((x) => x > at + 1e-6).sort((a, b) => a - b)[0] ?? Infinity
    if (at + n.qd! > next + 1e-6) bad++
    if (n.qb! + n.qd! > barQ(s, n.bar) + 1e-6 && !n.tieNext) bad++
  }
  return bad
}

function report(name: string, before: Metrics | undefined, s: Song) {
  const m = measure(s, true)
  console.info(`${name}: crossing ${before?.crossing ?? '-'} -> ${m.crossing}, overfull ${before ? `${before.overfull}/${before.chords}` : '-'} -> ${m.overfull}/${m.chords} (${(m.overfullPct * 100).toFixed(1)}%)`)
  return m
}

describe('quantize: a human piano arrangement', () => {
  const f = pianoHuman()
  const s = imp(f)
  it('writes no note across a barline untied and no value over the next onset', () => {
    expect(measure(s, true).crossing).toBe(0)
    expect(overlaps(s)).toBe(0)
    expect(measure(s, true).overfullPct).toBeLessThan(0.05)
    report('piano', undefined, s)
  })
  it('puts onsets where they were meant, merges rolled chords and flags the grace note', () => {
    const a = accuracy(s, f)
    console.info('piano accuracy', a)
    expect(a.hit).toBeGreaterThan(0.98)
    expect(Math.abs(a.chords[0] - a.chords[1]) / a.chords[1]).toBeLessThan(0.01)
    expect(a.graces[0]).toBe(a.graces[1])
  })
  it('marks the triplets', () => {
    const trip = s.notes.filter((n) => n.bar >= 8 && n.bar < 12 && n.h === 'L')
    expect(trip.filter((n) => n.tuplet).length / trip.length).toBeGreaterThan(0.6)
    expect(s.notes.filter((n) => n.bar < 4 && n.h === 'L').some((n) => n.tuplet)).toBe(false)
  })
  it('keeps the performance fields as they were', () => {
    expect(s.notes.every((n) => n.beats > 0 && n.d > 0 && n.bar >= 0 && n.bar < s.bars.length)).toBe(true)
    const early = s.notes.filter((n) => n.bar > 0 && n.qb === 0 && n.t < s.bars[n.bar].t0)
    expect(early.length).toBeGreaterThan(0) // played early, written on the downbeat of the bar it belongs to
  })
  it('is idempotent', () => {
    const again = (buf: ArrayBuffer) => {
      const m = new Midi(buf)
      const notes = m.tracks[0].notes.map((n) => ({ tick: n.ticks, dtick: n.durationTicks, p: n.midi, hand: n.midi >= 60 ? ('R' as const) : ('L' as const) }))
      const o = { ppq: PPQ, sigs: m.header.timeSignatures.map((x) => ({ tick: x.ticks, n: x.timeSignature[0], den: x.timeSignature[1] })), tempos: m.header.tempos.map((t) => ({ tick: t.ticks, bpm: t.bpm })) }
      const one = quantize(notes, o)
      const keep = notes.map((_, i) => i).filter((i) => !one.grace[i]) // a grace note is flagged, not placed
      const two = quantize(keep.map((i) => ({ ...notes[i], tick: Math.round(one.q[i] * PPQ) })), o)
      return [keep.map((i) => one.q[i]), two.q, one.bars, two.bars]
    }
    for (const buf of [f.buf, waltz(25).buf, sixEight(20).buf, ritard(25).buf]) {
      const [one, two, bars1, bars2] = again(buf)
      expect(two).toEqual(one)
      expect(bars2).toEqual(bars1)
    }
  })
})

describe('quantize: tempo changes', () => {
  it('keeps exact ticks exact through accelerando and ritardando', () => {
    const f = ritard()
    const s = imp(f)
    expect(accuracy(s, f).hit).toBe(1)
    expect(s.bars.slice(0, 12).every((_, i) => barQ(s, i) === 4)).toBe(true)
    expect(measure(s, true).crossing).toBe(0)
    expect(overlaps(s)).toBe(0)
    report('ritard', undefined, s)
  })
  it('and survives human timing on top', () => {
    const f = ritard(25)
    const s = imp(f)
    const a = accuracy(s, f)
    console.info('ritard jitter accuracy', a)
    expect(a.hit).toBeGreaterThan(0.95)
    expect(measure(s, true).crossing).toBe(0)
    expect(overlaps(s)).toBe(0)
  })
})

describe('quantize: time signature changes', () => {
  it('follows 3/4 into 4/4 and a tempo change without drift', () => {
    for (const j of [0, 25]) {
      const f = mixed(j)
      const s = imp(f)
      expect(s.bars.slice(0, 8).map((b) => [b.n, barQ(s, b.i)])).toEqual([[3, 3], [3, 3], [3, 3], [3, 3], [4, 4], [4, 4], [4, 4], [4, 4]])
      expect(accuracy(s, f).hit).toBeGreaterThan(0.98)
      expect(overlaps(s)).toBe(0)
    }
  })
})

describe('clean sources get the same fields', () => {
  it('reads a spec song: positions, values, triplets', () => {
    const s = fromSpec({ id: 't', title: 't', bpm: 120, fifths: 0, rh: 'C5:1 D5:0.5 E5:0.5 F5:1 G5:0.3333333 A5:0.3333333 B5:0.3333334 C6:4', lh: 'C3+G3:4 C3+G3:4' })
    const rh = s.notes.filter((n) => n.h === 'R')
    expect(rh.map((n) => [n.bar, +n.qb!.toFixed(3), +n.qd!.toFixed(3), !!n.tuplet])).toEqual([[0, 0, 1, false], [0, 1, 0.5, false], [0, 1.5, 0.5, false], [0, 2, 1, false], [0, 3, 0.333, true], [0, 3.333, 0.333, true], [0, 3.667, 0.333, true], [1, 0, 4, false]])
    expect(s.notes.find((n) => n.p === 79)).toMatchObject({ bar: 0, voice: 1 })
  })
  it('reads MusicXML, tying a note across the barline and marking a triplet', () => {
    const xml = `<?xml version="1.0"?><score-partwise version="3.1"><part-list><score-part id="P1"/></part-list><part id="P1">
 <measure number="1"><attributes><divisions>3</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
  <note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration></note>
  <note><pitch><step>D</step><octave>5</octave></pitch><duration>1</duration></note>
  <note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration></note>
  <note><pitch><step>F</step><octave>5</octave></pitch><duration>3</duration></note>
  <note><pitch><step>G</step><octave>5</octave></pitch><duration>3</duration></note>
  <note><pitch><step>A</step><octave>5</octave></pitch><duration>3</duration><tie type="start"/></note></measure>
 <measure number="2"><note><pitch><step>A</step><octave>5</octave></pitch><duration>6</duration><tie type="stop"/></note><note><rest/><duration>6</duration></note></measure></part></score-partwise>`
    const s = fromMusicXml(xml, 't', 'id')
    expect(s.notes.slice(0, 3).map((n) => [n.qb, !!n.tuplet])).toEqual([[0, true], [1 / 3, true], [2 / 3, true]])
    const a = s.notes.find((n) => n.p === 81)!
    expect(a).toMatchObject({ bar: 0, qb: 3, qd: 1, tieNext: true, voice: 1 })
    expect(a.qrest).toBeCloseTo(2, 5) // a quarter and then a half note: 3 quarters in all
  })
})

describe('quantize: pickup bars', () => {
  it('finds a one-beat pickup in 3/4 and puts the barlines on the downbeat', () => {
    for (const j of [0, 25]) {
      const f = waltz(j)
      const s = imp(f)
      expect(s.bars[0].ql).toBe(1)
      expect(s.bars[0]).toMatchObject({ n: 3, den: 4 })
      expect(barQ(s, 1)).toBe(3)
      expect(accuracy(s, f).hit).toBeGreaterThan(0.95)
      expect(measure(s, true).crossing).toBe(0)
      expect(s.spb).toBeCloseTo(60 / 96, 3) // the click is the quarter, not a stretched pickup bar
    }
  })
  it('finds an eighth-note pickup in 6/8', () => {
    for (const j of [0, 20]) {
      const f = sixEight(j)
      const s = imp(f)
      expect(s.bars[0].ql).toBe(0.5)
      expect(barQ(s, 1)).toBe(3)
      expect(accuracy(s, f).hit).toBeGreaterThan(0.95)
      expect(measure(s, true).crossing).toBe(0)
    }
  })
  it('leaves a file alone whose barlines are already right', () => {
    const s = imp(waltz(0, true))
    expect(s.bars[0].ql).toBeUndefined()
    expect(barQ(s, 0)).toBe(3)
  })
})

describe('quantize: an orchestral file', () => {
  const s = imp(orchestral())
  it('is exact on exact ticks, with the pads in their own voice', () => {
    expect(measure(s, true).crossing).toBe(0)
    expect(overlaps(s)).toBe(0)
    expect(s.notes.filter((n) => n.voice === 2).length).toBeGreaterThan(0)
    expect(s.notes.filter((n) => n.voice === 2).every((n) => n.qd === 4)).toBe(true)
    expect(measure(s, true).overfullPct).toBeLessThan(0.05)
    report('orchestral', undefined, s)
  })
})

describe('notate', () => {
  const bars = [0, 4, 8].map((q0) => ({ q0, ql: 4 }))
  it('ties a note that rings past the barline, once, and cuts it per bar', () => {
    const [n] = notate([{ q: 2, dq: 7, hand: 'R' }], bars)
    expect(n).toMatchObject({ bar: 0, qb: 2, qd: 2, tieNext: true, qrest: 5 })
    expect(tiedSegments(n, [4, 4, 4]).map((x) => [x.bar, x.qb, x.qd, x.tiePrev, x.tieNext])).toEqual([[0, 2, 2, false, true], [1, 0, 4, true, true], [2, 0, 1, true, false]])
  })
  it('does not tie a release that is a little late', () => {
    expect(notate([{ q: 3, dq: 1.15, hand: 'R' }, { q: 4, dq: 1, hand: 'R' }], bars)[0].tieNext).toBeUndefined()
  })
  it('clips to the next onset and snaps', () => {
    const o = notate([{ q: 0, dq: 3.9, hand: 'L' }, { q: 0.25, dq: 3.7, hand: 'L' }, { q: 0.5, dq: 3.4, hand: 'L' }], bars)
    expect(o.map((x) => x.qd)).toEqual([0.25, 0.25, 3.5])
  })
  it('marks triplets by position and by value', () => {
    const o = notate([{ q: 0, dq: 1 / 3, hand: 'R' }, { q: 1 / 3, dq: 1 / 3, hand: 'R' }, { q: 2 / 3, dq: 1 / 3, hand: 'R' }, { q: 1, dq: 1, hand: 'R' }], bars)
    expect(o.map((x) => !!x.tuplet)).toEqual([true, true, true, false])
    expect(o[0].qd).toBeCloseTo(1 / 3)
  })
  it('moves a long note under a moving line to voice 2 and leaves pedal overlaps in voice 1', () => {
    const held = notate([{ q: 0, dq: 4, hand: 'L' }, { q: 0, dq: 0.5, hand: 'L' }, { q: 1, dq: 0.5, hand: 'L' }, { q: 2, dq: 0.5, hand: 'L' }], bars)
    expect(held.map((x) => x.voice)).toEqual([2, 1, 1, 1])
    expect(held[0].qd).toBe(4)
    const pedal = notate([0, 1, 2, 3].map((q) => ({ q, dq: 4 - q, hand: 'L' as const })), bars)
    expect(pedal.map((x) => x.voice)).toEqual([1, 1, 1, 1])
    expect(pedal.map((x) => x.qd)).toEqual([1, 1, 1, 1])
  })
})

describe('grace notes and chords', () => {
  const o = { ppq: PPQ, sigs: [{ tick: 0, n: 4, den: 4 }], tempos: [{ tick: 0, bpm: 120 }] }
  it('flags a very short note before another, and keeps a staccato note alone', () => {
    const r = quantize([{ tick: 440, dtick: 30, p: 70, hand: 'R' }, { tick: 480, dtick: 400, p: 72, hand: 'R' }, { tick: 1920, dtick: 30, p: 60, hand: 'R' }], o)
    expect(r.grace).toEqual([true, false, false])
    expect(r.q).toEqual([1, 1, 4])
  })
  it('rolls a chord into one onset at a fast and a slow tempo', () => {
    for (const bpm of [60, 160]) {
      const roll = Math.round(((0.03 * bpm) / 60) * PPQ)
      const r = quantize([0, 1, 2].map((k) => ({ tick: 960 + k * (roll >> 1), dtick: 400, p: 60 + k, hand: 'R' as const })), { ...o, tempos: [{ tick: 0, bpm }] })
      expect(new Set(r.q).size).toBe(1)
    }
  })
})

describe('spelling and key', () => {
  const at = (n: number) => Array.from({ length: n }, (_, i) => i)
  const acc = (ps: number[], fifths: number, i: number) => spellWindow(ps, at(ps.length), fifths)[i]
  it('writes C sharp in D minor, F sharp in G minor and B flat in C major the way a musician does', () => {
    const dm = [62, 64, 65, 67, 69, 70, 73, 74] // D E F G A Bb C# D
    expect(acc(dm, -1, 6)).toBe(1)
    expect(spell(73, -1, acc(dm, -1, 6)).letter).toBe(0) // C
    expect(spell(73, -1, acc(dm, -1, 6)).acc).toBe(1)
    expect(acc(dm, -1, 5)).toBe(-1)
    const gm = [67, 69, 70, 72, 74, 75, 78, 79] // G A Bb C D Eb F# G
    expect(acc(gm, -2, 6)).toBe(1)
    expect(spell(78, -2, 1)).toMatchObject({ letter: 3, acc: 1 })
    expect(acc(gm, -2, 5)).toBe(-1)
    const c = [60, 62, 64, 65, 67, 69, 70, 72] // C D E F G A Bb C
    expect(acc(c, 0, 6)).toBe(-1)
    expect(spell(70, 0, -1)).toMatchObject({ letter: 6, acc: -1 })
  })
  it('follows a modulation', () => {
    const dm = [62, 64, 65, 67, 69, 70, 73, 74]
    const fs = [66, 68, 70, 71, 73, 75, 78, 78]
    const ps = [...dm, ...dm, ...dm, ...fs, ...fs, ...fs, ...fs]
    const a = spellWindow(ps, ps.map((_, i) => i), -1)
    expect([a[5], a[6]]).toEqual([-1, 1]) // B flat, C sharp
    expect([a[40 + 2], a[40 + 5]]).toEqual([1, 1]) // A sharp, D sharp, once the passage is in F sharp major
  })
  it('keeps the default for a note with no context, as drills and chord names expect', () => {
    expect(spell(61, 0).acc).toBe(1)
    expect(spell(61, -2).acc).toBe(-1)
  })
  it('estimates a key by onsets, so one long note cannot decide it', () => {
    const scale = [62, 64, 66, 67, 69, 71, 73, 74].map((p) => ({ p, d: 1 }))
    expect(estimateFifths([...scale, { p: 66, d: 20 }])).toBe(2)
    expect(estimateFifths([...scale, { p: 70, d: 20 }])).toBe(2)
  })
  it('reports key changes of a modulating piece and none for a steady one', () => {
    const m = new Midi()
    const t = m.addTrack()
    const scale = (root: number, bar0: number) => {
      for (let b = 0; b < 8; b++) [0, 2, 4, 5, 7, 9, 11, 12].forEach((x, i) => t.addNote({ midi: root + x, ticks: (bar0 + b) * 4 * PPQ + i * 240, durationTicks: 200 }))
    }
    scale(62, 0)
    scale(66, 8)
    const s = fromMidi(m.toArray().buffer as ArrayBuffer, 't', 'id')
    expect(s.keys?.map((k) => k.fifths)).toEqual([2, 6])
    expect(s.keys?.[1].bar).toBeGreaterThanOrEqual(6)
    const steady = new Midi()
    const st = steady.addTrack()
    for (let i = 0; i < 64; i++) st.addNote({ midi: 60 + [0, 2, 4, 5, 7, 9, 11, 12][i % 8], ticks: i * 240, durationTicks: 200 })
    expect(fromMidi(steady.toArray().buffer as ArrayBuffer, 't', 'id').keys).toBeUndefined()
  })
})

describe('quantize: odd tuplets in an exact file', () => {
  const s = imp(oddTuplets())
  it('writes quintuplets and septuplets with their ratio and value, and the short note before a beat as a grace', () => {
    const at = (bar: number, q: number) => s.notes.filter((n) => n.bar === bar && !n.grace && Math.abs(n.qb! - q) < 1e-3 && n.h === 'R')[0]
    for (const bar of [0, 1, 2, 3]) {
      for (let i = 0; i < 5; i++) expect(at(bar, i / 5)).toMatchObject({ tuplet: { num: 5, den: 4 }, qd: expect.closeTo(0.2, 3) })
      for (let i = 0; i < 7; i++) expect(at(bar, 2 + i / 7)).toMatchObject({ tuplet: { num: 7, den: 4 }, qd: expect.closeTo(1 / 7, 3) })
      expect(at(bar, 1).tuplet).toBeUndefined()
    }
    expect(s.notes.filter((n) => n.grace).map((n) => [n.p, n.bar, n.qb])).toEqual([[81, 1, 1]])
    expect(scoreFlags(s)).toContain('irregular-tuplet')
    expect(figure(0.2, '5:4')).toEqual(figure(0.25)) // drawn as sixteenths under a 5
  })
})
