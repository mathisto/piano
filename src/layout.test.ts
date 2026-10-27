import { describe, expect, it } from 'vitest'
import { analyze, beamBounds, densest, figure, fitZoom, inkBounds, layout, restPieces, S, splitValue, windowFor, type Cfg, type Layout, type LSlur } from './layout'
import { fromMusicXml } from './musicxml'
import { mixed, orchestral, pianoHuman, sixEight, waltz } from './notation-fixtures'
import { touchPiece } from './score-fixtures'
import { fromMidi } from './midi-tracks'
import { build, fromSpec, type Bar, type Raw, type Song } from './song'
import { STARTERS } from './starters'
import { exercise } from './technique'

const SHEET: Cfg = { view: 'sheet', px: { w: 1180, h: 560 } }
const BOTH: Cfg = { view: 'both', px: { w: 1180, h: 130 } }

type N = [p: number, q: number, dq: number, o?: { h?: 'R' | 'L'; grace?: boolean; voice?: 1 | 2; acc?: 1 | -1 }]
/** A song from absolute quarter positions: 60 bpm, so a quarter is a second. */
function song(sig: [number, number], nbars: number, notes: N[], fifths = 0, pickup = 0): Song {
  const [n, den] = sig
  const full = (n * 4) / den
  const bars: Bar[] = []
  let q = 0
  for (let i = 0; i < nbars; i++) {
    const ql = i === 0 && pickup ? pickup : full
    bars.push({ i, t0: q, t1: q + ql, n, den, ...(i === 0 && pickup ? { ql: pickup } : {}) })
    q += ql
  }
  const raw: Raw[] = notes.map(([p, at, dq, o]) => ({ t: at, d: dq * 0.95, p, v: 0.7, track: 0, h: o?.h ?? (p >= 60 ? 'R' : 'L'), q: at, dq, grace: o?.grace, acc: o?.acc }))
  return build('t', 't', raw, bars, fifths)
}
const run = (s: Song, cfg = SHEET, bar = 0, read = false) => {
  const an = analyze(s, { read })
  return layout(an, windowFor(an, bar, cfg), cfg)
}
const eighths = (p: number, from: number, n: number): N[] => Array.from({ length: n }, (_, i) => [p, from + i * 0.5, 0.5])

describe('written values', () => {
  it('reads heads, dots and flags from quarters', () => {
    expect(figure(1.5)).toEqual({ head: 2, dots: 1, flags: 0 })
    expect(figure(1 / 3, true)).toEqual({ head: 2, dots: 0, flags: 1 }) // a triplet eighth is an eighth
    expect(figure(0.75)).toEqual({ head: 2, dots: 1, flags: 1 })
  })
  it('splits an odd length into tied pieces that break at the beat', () => {
    expect(splitValue(1.5, 2.5, false)).toEqual([{ q: 1.5, v: 0.5 }, { q: 2, v: 2 }])
    expect(splitValue(0, 2, false)).toEqual([{ q: 0, v: 2 }])
  })
  it('fills a silence with rests on their own grid', () => {
    expect(restPieces(0.25, 0.75).map((r) => r.v)).toEqual([0.25, 0.5])
    expect(restPieces(1, 3).map((r) => r.v)).toEqual([1, 2])
    expect(restPieces(0, 1).map((r) => r.tup)).toEqual([false])
    expect(restPieces(0, 2 / 3).every((r) => r.tup)).toBe(true)
  })
  it('groups beams by meter', () => {
    expect(beamBounds(4, 4)).toEqual([0, 1, 2, 3])
    expect(beamBounds(6, 8)).toEqual([0, 1.5])
    expect(beamBounds(9, 8)).toEqual([0, 1.5, 3])
    expect(beamBounds(7, 8)).toEqual([0, 1, 2])
    expect(beamBounds(5, 8)).toEqual([0, 1.5])
    expect(beamBounds(3, 8)).toEqual([0])
    expect(beamBounds(5, 4)).toEqual([0, 1, 2, 3, 4])
  })
})

describe('beams', () => {
  const sizes = (L: Layout) => L.beams.map((b) => b.chords.length)
  it('4/4: eighths beam by the beat', () => {
    expect(sizes(run(song([4, 4], 1, eighths(72, 0, 8))))).toEqual([2, 2, 2, 2])
  })
  it('3/4: by the beat', () => {
    expect(sizes(run(song([3, 4], 1, eighths(72, 0, 6))))).toEqual([2, 2, 2])
  })
  it('2/4: by the beat', () => {
    expect(sizes(run(song([2, 4], 1, eighths(72, 0, 4))))).toEqual([2, 2])
  })
  it('6/8: dotted-quarter groups', () => {
    expect(sizes(run(song([6, 8], 1, eighths(72, 0, 6))))).toEqual([3, 3])
  })
  it('7/8: 2 + 2 + 3', () => {
    expect(sizes(run(song([7, 8], 1, eighths(72, 0, 7))))).toEqual([2, 2, 3])
  })
  it('a rest breaks the beam, and every chord of a beam leans the same way', () => {
    const L = run(song([4, 4], 1, [[72, 0, 0.5], [60, 0.5, 0.5], [79, 1, 0.5], [55, 1.5, 0.5], [72, 3, 1]]))
    for (const b of L.beams) expect(new Set(b.chords.map((c) => c.up)).size).toBe(1)
    expect(L.rests.length).toBeGreaterThan(0)
  })
  it('a pickup counts its beams from the end of the notional bar', () => {
    // a pickup of one quarter in 3/4: two eighths on the last beat form one pair
    const L = run(song([3, 4], 2, [[72, 0, 0.5], [74, 0.5, 0.5], [76, 1, 1], [77, 2, 1], [79, 3, 1]], 0, 1))
    expect(L.beams.map((b) => b.chords.length)).toEqual([2])
  })
  it('flat beams for flat melodies, a slope for rising ones, stems reach the beam', () => {
    const L = run(song([4, 4], 1, [[72, 0, 0.5], [74, 0.5, 0.5], [76, 1, 0.5], [79, 1.5, 0.5]]))
    const r = L.beams[0].rows[0]
    expect(r.y2).not.toBe(r.y1)
    for (const c of L.beams[0].chords) expect(c.stem!.y2).toBeCloseTo(r.y1 + ((c.stem!.x - r.x1) / (r.x2 - 1.3 - r.x1)) * (r.y2 - r.y1), 3)
  })
})

describe('voices, chords, shared heads', () => {
  it('chords: one stem, heads a second apart step aside', () => {
    const L = run(song([4, 4], 1, [[60, 0, 1], [62, 0, 1], [64, 0, 1]]))
    const c = L.chords[0]
    expect(c.heads).toHaveLength(3)
    expect(c.stem).toBeTruthy()
    expect(new Set(c.heads.map((h) => h.x)).size).toBeLessThan(3) // the seconds share a column and stand aside
  })
  it('the same pitch at one onset in both voices is one head', () => {
    const L = run(song([4, 4], 1, [[67, 0, 3, { voice: 2 }], [67, 0, 1], [72, 1, 1], [74, 2, 1]]))
    const treble = L.chords.filter((c) => c.clef === 'treble')
    expect(treble.some((c) => c.lane === 2)).toBe(false)
    expect(treble.find((c) => c.q === 0)!.heads[0].ids).toHaveLength(2) // both notes are marked through one head
  })
  it('two voices in a hand: the upper stems up, the lower down', () => {
    const L = run(song([4, 4], 1, [[64, 0, 4, { voice: 2 }], [72, 0, 1], [74, 1, 1], [72, 2, 1], [71, 3, 1]]))
    const t = L.chords.filter((c) => c.clef === 'treble')
    expect(t.filter((c) => c.lane === 1).every((c) => c.up)).toBe(true)
    expect(t.filter((c) => c.lane === 2).length).toBeGreaterThan(0)
    expect(t.filter((c) => c.lane === 2).every((c) => !c.up)).toBe(true)
  })
})

describe('ledger lines and ottava', () => {
  const high = song([4, 4], 1, [[96, 0, 1], [98, 1, 1], [100, 2, 1], [72, 3, 1]]) // C7, D7, E7
  it('notes beyond three ledger lines go under 8va, brackets above', () => {
    const L = run(high)
    expect(L.ottavas.map((o) => o.label)).toContain('8va')
    for (const c of L.chords) expect(c.ledgers.length).toBeLessThanOrEqual(3)
  })
  it('very low notes go under 8vb, bracket below', () => {
    const L = run(song([4, 4], 1, [[24, 0, 1], [26, 1, 1], [28, 2, 1], [48, 3, 1]]))
    const o = L.ottavas.find((x) => x.below)
    expect(o?.label).toBe('8vb')
    expect(o!.y).toBeGreaterThan(L.base.bass)
  })
  it('three octaves up is 15ma', () => {
    const L = run(song([4, 4], 1, [[108, 0, 1], [105, 1, 1]]))
    expect(L.ottavas.map((o) => o.label)).toContain('15ma')
  })
  it('ordinary ledger lines are counted', () => {
    const L = run(song([4, 4], 1, [[60, 0, 1], [84, 1, 1], [40, 2, 1], [36, 3, 1]]))
    const at = (q: number) => L.chords.find((c) => c.q === q)!.ledgers
    expect(at(0)).toHaveLength(1) // middle C
    expect(at(1)).toHaveLength(2) // C6: A5 and C6
    expect(at(2)).toHaveLength(1) // E2
    expect(at(3)).toHaveLength(2) // C2
  })
  it('nothing leaves the viewBox, even at the extremes', () => {
    for (const cfg of [SHEET, BOTH]) {
      const extremes: N[] = [[21, 0, 1], [108, 1, 1], [24, 2, 1], [105, 3, 1], [30, 0, 1, { h: 'L' }], [100, 3, 1, { h: 'L' }]]
      const L = run(song([4, 4], 1, extremes), cfg)
      const b = inkBounds(L)
      expect(b.minY).toBeGreaterThanOrEqual(-0.5)
      expect(b.maxY).toBeLessThanOrEqual(L.h + 0.5)
      expect(b.minX).toBeGreaterThanOrEqual(0)
      expect(b.maxX).toBeLessThanOrEqual(L.w)
    }
  })
})

describe('ties, rests, tuplets, graces', () => {
  it('a note over the barline draws a tied head and an arc', () => {
    // a half note starting on beat 4 of bar 1 runs into bar 2
    const L = run(song([4, 4], 2, [[72, 3, 2], [74, 5, 1]]))
    const cont = L.chords.filter((c) => c.heads.some((h) => h.cont))
    expect(cont).toHaveLength(1)
    expect(L.ties).toHaveLength(1)
    const t = L.ties[0]
    expect(t.x2).toBeGreaterThan(t.x1)
    expect(t.open).toBeUndefined()
    expect(cont[0].heads[0].x).toBeGreaterThan(t.x1)
  })
  it('a tie that reaches the next page ends in an open arc, and arrives as one', () => {
    // two crowded bars: one per page; a note ties from the end of the first into the second
    const notes: N[] = []
    for (let b = 0; b < 2; b++) for (let i = 0; i < 30; i++) notes.push([[72, 74, 76, 77, 79][i % 5], b * 4 + i / 8, 0.125])
    notes.push([84, 3.5, 1.5])
    const an = analyze(song([4, 4], 2, notes))
    const first = layout(an, windowFor(an, 0, SHEET), SHEET)
    expect(first.to).toBe(1)
    expect(first.ties.filter((t) => t.open === 'right')).toHaveLength(1)
    const second = layout(an, windowFor(an, 1, SHEET), SHEET)
    expect(second.ties.filter((t) => t.open === 'left')).toHaveLength(1)
  })
  it('a gap becomes rests on the right grid; an empty staff in use gets a bar rest', () => {
    const L = run(song([4, 4], 2, [[72, 0, 1], [72, 2, 2], [74, 4, 4]]))
    const t = L.rests.filter((r) => r.clef === 'treble')
    expect(t.map((r) => r.v)).toContain(1) // beat 2
    expect(L.rests.filter((r) => r.clef === 'bass' && r.whole)).toHaveLength(0) // the left hand is not on the page at all
    const L2 = run(song([4, 4], 2, [[72, 0, 4], [48, 4, 4]]))
    expect(L2.rests.filter((r) => r.whole && r.clef === 'bass' && r.bar === 0)).toHaveLength(1)
    expect(L2.rests.filter((r) => r.whole && r.clef === 'treble' && r.bar === 1)).toHaveLength(1)
  })
  it('a triplet of eighths gets one bracket spanning its three heads', () => {
    const t = 1 / 3
    const L = run(song([4, 4], 1, [[72, 0, 1], [74, 1, t], [76, 1 + t, t], [77, 1 + 2 * t, t], [79, 2, 2]]))
    expect(L.tuplets).toHaveLength(1)
    const heads = L.chords.filter((c) => c.q > 0.9 && c.q < 2).map((c) => c.x)
    expect(heads).toHaveLength(3)
    expect(L.tuplets[0].x1).toBeLessThanOrEqual(Math.min(...heads))
    expect(L.tuplets[0].x2).toBeGreaterThanOrEqual(Math.max(...heads))
    expect(L.tuplets[0].bracket).toBe(false) // beamed: the number alone
  })
  it('a quarter-note triplet over two beats is bracketed', () => {
    const t = 2 / 3
    const L = run(song([4, 4], 1, [[72, 0, 2], [74, 2, t], [76, 2 + t, t], [77, 2 + 2 * t, t]]))
    expect(L.tuplets.some((x) => x.bracket)).toBe(true)
  })
  it('grace notes are small heads with a slash, left of their note, taking no time', () => {
    const L = run(song([4, 4], 1, [[71, 0, 0.125, { grace: true }], [72, 0, 1], [74, 1, 3]]))
    const g = L.chords.find((c) => c.grace)!
    const main = L.chords.find((c) => !c.grace && c.q === 0)!
    expect(g.x).toBeLessThan(main.x - 6)
    expect(g.stem).toBeTruthy()
    expect(g.flag).toBeTruthy()
  })
})

describe('signatures and bars', () => {
  it('shows a time signature where it changes and a key signature where the key does', () => {
    const s = song([4, 4], 4, [[72, 0, 4], [72, 4, 4], [72, 8, 4], [72, 12, 4]])
    s.bars[2] = { ...s.bars[2], n: 3, den: 4, t1: s.bars[2].t0 + 3 }
    s.bars[3] = { ...s.bars[3], t0: s.bars[2].t1, t1: s.bars[2].t1 + 3, n: 3, den: 4 }
    s.keys = [{ bar: 0, fifths: 0 }, { bar: 2, fifths: 2 }]
    const L = run(s)
    expect(L.signs.filter((x) => x.kind === 'digits').length).toBeGreaterThan(4) // header pair per staff plus the change
    expect(L.signs.filter((x) => x.kind === 'sharp').length).toBeGreaterThanOrEqual(4) // two sharps in each clef
  })
  it('a pickup bar is drawn at its real, shorter width', () => {
    const s = song([4, 4], 3, [[72, 0, 1], [74, 1, 4], [76, 5, 4]], 0, 1)
    const L = run(s)
    const w = (i: number) => L.bars[i].xEnd - L.bars[i].x
    expect(w(0)).toBeLessThan(w(1) * 0.6)
  })
  it('spells through the note\'s own accidental', () => {
    // C sharp in a D minor passage (F major signature)
    const an = analyze(song([4, 4], 1, [[62, 0, 1], [61, 1, 1, { acc: 1 }], [61, 2, 1, { acc: 1 }]], -1))
    const g = (q: number) => an.bars[0].chords.find((x) => x.q === q)!.notes[0]
    expect(g(1).glyph).toBe('sharp')
    expect(g(2).glyph).toBeUndefined() // still in force this bar
  })
})

describe('spacing and the time map', () => {
  it('sparse music keeps the old even spacing and the playhead steps equally across barlines', () => {
    const s = song([4, 4], 4, Array.from({ length: 16 }, (_, i) => [72, i, 1] as N))
    const L = run(s, BOTH)
    const x = (t: number) => L.posAt(t).x
    const step = x(1) - x(0)
    for (const t of [0, 1, 2, 3, 4, 5]) if (L.to > Math.floor((t + 1) / 4)) expect(x(t + 1) - x(t)).toBeCloseTo(step, 3)
  })
  it('keeps every gap at 14 units or more, or says the bar is too dense', () => {
    const fixtures: Song[] = [
      fromMidi(pianoHuman().buf, 'h', 'h'),
      fromMidi(waltz().buf, 'w', 'w'),
      fromMidi(sixEight().buf, 's', 's'),
      fromMidi(mixed().buf, 'm', 'm'),
      fromMidi(orchestral(), 'o', 'o'),
    ]
    for (const s of fixtures) {
      const an = analyze(s)
      for (const cfg of [SHEET, BOTH]) {
        for (let b = 0; b < an.bars.length; b += 2) {
          const L = layout(an, windowFor(an, b, cfg), cfg)
          for (const bar of L.bars) expect(bar.minGap >= 13.9 || bar.dense, `${s.title} bar ${bar.i} ${cfg.view}: ${bar.minGap}`).toBe(true)
          const ink = inkBounds(L)
          expect(ink.minY).toBeGreaterThanOrEqual(-0.5)
          expect(ink.maxY).toBeLessThanOrEqual(L.h + 0.5)
          expect(ink.maxX).toBeLessThanOrEqual(L.w + 0.5)
        }
      }
    }
  })
  it('the time to x map is monotone, whatever the spacing', () => {
    const s = fromMidi(pianoHuman().buf, 'h', 'h')
    const an = analyze(s)
    const L = layout(an, windowFor(an, 4, SHEET), SHEET)
    let last = -1
    const t0 = s.bars[L.from].t0
    const t1 = s.bars[L.to - 1].t1
    for (let k = 0; k <= 400; k++) {
      const p = L.posAt(t0 + ((t1 - t0) * k) / 400)
      if (p.sys === 0 || L.systems.length === 1) expect(p.x).toBeGreaterThanOrEqual(last - 1e-6)
      last = p.x
    }
  })
  it('a dense bar widens its bar and the page turns into one bar per system', () => {
    const notes: N[] = Array.from({ length: 32 }, (_, i) => [[72, 74, 76, 77, 79][i % 5], i / 8, 0.125] as N)
    const an = analyze(song([4, 4], 2, notes))
    const w = windowFor(an, 0, SHEET)
    expect(w.systems[0].to - w.systems[0].from).toBe(1)
    const L = layout(an, w, SHEET)
    expect(L.bars[0].xEnd - L.bars[0].x).toBeGreaterThan(32 * 13)
    expect(L.bars[0].minGap).toBeGreaterThanOrEqual(13.9)
  })
  it('a bar too dense even zoomed out is flagged, and still stays on the page', () => {
    const notes: N[] = Array.from({ length: 120 }, (_, i) => [[72, 74, 76, 77, 79][i % 5], i / 30, 1 / 32] as N)
    const an = analyze(song([4, 4], 1, notes))
    const L = layout(an, windowFor(an, 0, SHEET), SHEET)
    expect(L.bars[0].dense).toBe(true)
    const ink = inkBounds(L)
    expect(ink.maxX).toBeLessThanOrEqual(L.w + 0.5)
    expect(densest(an)!.bar).toBe(0)
  })
  it('page windows are stable: the bars of a page never overlap the next', () => {
    const an = analyze(fromMidi(pianoHuman().buf, 'h', 'h'))
    let prev = -1
    for (let b = 0; b < an.bars.length; b++) {
      const w = windowFor(an, b, SHEET)
      expect(w.from).toBeLessThanOrEqual(b)
      expect(w.to).toBeGreaterThan(b)
      if (w.from !== prev) prev = w.from
    }
  })
})

describe('drills', () => {
  it('cards keep equal bars and their margins', () => {
    const s = song([4, 4], 2, [[60, 0, 1], [62, 1, 1], [64, 2, 1], [65, 3, 1], [67, 4, 1]])
    const L = run(s, BOTH, 0, true)
    expect(L.bars).toHaveLength(2)
    expect(L.bars[0].xEnd - L.bars[0].x).toBeCloseTo(L.bars[1].xEnd - L.bars[1].x, 6)
    expect(L.rests).toHaveLength(0)
  })
})

describe('zoom: the player sizes the staff', () => {
  const quarters = (bars: number): N[] => Array.from({ length: bars * 4 }, (_, i) => [60 + (i % 5), i, 1])
  const s = song([4, 4], 24, quarters(24))
  const win = (cfg: Cfg, bar = 0) => windowFor(analyze(s), bar, cfg)
  const bars = (w: { systems: { from: number; to: number }[] }) => w.systems.reduce((n, x) => n + x.to - x.from, 0)

  it('zoom 1 is the default size, as if no zoom were set', () => {
    expect(win({ ...SHEET, zoom: 1 })).toEqual(win(SHEET))
    expect(win({ ...BOTH, zoom: 1 })).toEqual(win(BOTH))
  })
  it('zooming out shows more bars, and a second line once two fit', () => {
    const tall: Cfg = { view: 'sheet', px: { w: 1180, h: 560 } }
    const at = (zoom: number) => win({ ...tall, zoom })
    expect(at(1).systems).toHaveLength(1)
    expect(bars(at(0.6))).toBeGreaterThan(bars(at(1)))
    expect(at(0.45).systems.length).toBeGreaterThan(1)
  })
  it('zooming in again drops back to one line', () => {
    const tall: Cfg = { view: 'sheet', px: { w: 1180, h: 900 } }
    expect(win({ ...tall, zoom: 1 }).systems.length).toBeGreaterThan(1)
    expect(win({ ...tall, zoom: 1.6 }).systems).toHaveLength(1)
  })
  it('the follow window zooms out from the bar being played', () => {
    const w = win({ view: 'both', px: { w: 1180, h: 600 }, zoom: 0.4 }, 5)
    expect(w.from).toBe(5)
    expect(bars(w)).toBeGreaterThan(2)
    expect(w.systems.length).toBeGreaterThan(1)
  })
  it('never draws the staff too small to read, however far it is zoomed out', () => {
    const w = win({ view: 'both', px: { w: 1180, h: 130 }, zoom: 0.25 })
    expect(w.nominal).toBeLessThanOrEqual(130 + 1) // under one pixel per viewBox unit would be smaller than that
  })
})

describe('fit the whole piece', () => {
  const s = song([4, 4], 16, Array.from({ length: 16 * 4 }, (_, i) => [60 + (i % 5), i, 1] as N))
  const an = analyze(s)
  const cfg: Cfg = { view: 'sheet', px: { w: 1180, h: 560 } }
  const shown = (zoom: number) => windowFor(an, 0, { ...cfg, zoom }).to
  it('is the biggest size that still shows every bar', () => {
    const z = fitZoom(an, cfg, 0.26, 1)
    expect(shown(z)).toBe(16)
    expect(z === 1 || shown(z + 0.02) < 16).toBe(true)
  })
  it('stops at the smallest size when the piece cannot fit', () => {
    const long = analyze(song([4, 4], 400, Array.from({ length: 1600 }, (_, i) => [60 + (i % 5), i, 1] as N)))
    expect(fitZoom(long, cfg, 0.26, 1)).toBe(0.26)
  })
})

describe('zoom in a drill', () => {
  it('shows more cards ahead when zoomed out', () => {
    const s = song([4, 4], 12, Array.from({ length: 12 * 4 }, (_, i) => [64 + (i % 3), i, 1] as N))
    const an = analyze(s, { read: true })
    const cards = (zoom: number) => windowFor(an, 0, { view: 'both', px: { w: 1180, h: 400 }, zoom }).systems.reduce((n, x) => n + x.to - x.from, 0)
    expect(cards(0.5)).toBeGreaterThan(cards(1))
  })
})

describe('a bar where one staff is silent', () => {
  it('gets one whole-bar rest in that staff only, centred in its bar', () => {
    // the Five-finger warm-up: right hand in bars 1-3, left hand in bars 3-5
    const L = run(fromSpec(STARTERS[0].spec))
    expect(L.rests.map((r) => `${r.clef}${r.bar}${r.whole ? 'w' : ''}`).sort()).toEqual(['bass0w', 'bass1w', 'treble3w'])
    for (const r of L.rests) {
      const b = L.bars.find((x) => x.i === r.bar)!
      expect(r.x).toBeCloseTo((b.x + b.xEnd) / 2, 5)
      expect(r.y).toBeLessThan(L.base[r.clef]) // inside its own staff
      expect(r.y).toBeGreaterThan(L.base[r.clef] - 40)
    }
  })
})

describe('score marks', () => {
  const touch = fromMusicXml(touchPiece(), 'Touch', 'id')
  const WIDE: Cfg = { view: 'sheet', px: { w: 1180, h: 560 }, zoom: 0.5 } // eight bars to a line
  /** The slur's curve at x: its control points sit at a third and two thirds, so x is linear in t. */
  const curveY = (s: LSlur, x: number) => {
    const t = (x - s.x1) / (s.x2 - s.x1)
    return (1 - t) ** 3 * s.y1 + 3 * (1 - t) ** 2 * t * s.c1[1] + 3 * (1 - t) * t ** 2 * s.c2[1] + t ** 3 * s.y2
  }
  const offLines = (L: Layout, y: number) => {
    const k = (L.base.treble - y) / S
    return k < 0 || k > 4 || Math.abs(k - Math.round(k)) > 0.2
  }

  it('staccato and accents sit away from the stem, in a space, clear of the head and the ledger lines', () => {
    for (const bar of [0, 8]) {
      const L = run(touch, SHEET, bar)
      const marked = L.chords.filter((c) => c.art)
      expect(marked.map((c) => c.art!.kind)).toEqual(bar ? ['acc', 'acc', 'acc', 'acc'] : Array(8).fill('stac'))
      for (const c of marked) {
        const a = c.art!
        expect(a.above).toBe(!c.up)
        const h = a.above ? c.heads[c.heads.length - 1] : c.heads[0]
        expect((h.y - a.y) * (a.above ? 1 : -1)).toBeGreaterThanOrEqual(S)
        expect(offLines(L, a.y)).toBe(true)
        for (const l of c.ledgers) expect(Math.abs(l.y - a.y)).toBeGreaterThan(3)
      }
    }
  })

  it('a mark goes past a finger number', () => {
    const s = song([4, 4], 1, [[64, 0, 1], [72, 1, 1]])
    for (const n of s.notes) Object.assign(n, { f: 3, art: 'ten' })
    for (const c of run(s).chords) expect(Math.abs(c.art!.y - c.heads[0].y)).toBeGreaterThanOrEqual(36)
  })

  it('a slur runs from the first to the last note of its run, under the heads when the stems point up, clear of the heads between', () => {
    const L = run(touch, SHEET, 0)
    expect(L.slurs).toHaveLength(1)
    const s = L.slurs[0]
    const under = L.chords.filter((c) => c.bar === 2 || c.bar === 3)
    expect([s.x1, s.x2]).toEqual([under[0].x, under[under.length - 1].x])
    expect(s.above).toBe(false)
    for (const c of under.slice(1, -1)) expect(curveY(s, c.x)).toBeGreaterThan(c.heads[0].y + 5)
  })

  it('a slur cut by the window or a line break stays open at the system edge', () => {
    const L = run(touch, BOTH, 3) // the slur started in bar 3, off the page
    expect(L.slurs).toHaveLength(1)
    expect(L.slurs[0].x1).toBeLessThan(L.chords[0].x - 10)
    const long = song([4, 4], 8, Array.from({ length: 32 }, (_, i): N => [72, i, 1]))
    long.notes.forEach((n, i) => (n.slur = i < 31))
    const P = run(long, { view: 'sheet', px: { w: 820, h: 1180 } })
    expect(P.systems.length).toBeGreaterThan(1)
    expect(P.slurs.map((x) => x.sys)).toEqual(P.systems.map((_, i) => i))
    P.slurs.forEach((x, i) => {
      expect(x.x1).toBeGreaterThanOrEqual(i ? P.systems[i].x0 - 20 : P.chords[0].x)
      expect(x.x2).toBeLessThanOrEqual(P.systems[i].x1)
    })
  })

  it('a hairpin opens toward its end under a lone staff, clear of the notes', () => {
    const L = run(touch, WIDE, 4)
    expect(L.dyns.map((d) => d.text)).toEqual(['p', 'f'])
    expect(L.wedges).toHaveLength(1)
    const w = L.wedges[0]
    expect(w.w1).toBe(0)
    expect(w.w2).toBeGreaterThan(4)
    const under = L.chords.filter((c) => c.x >= w.x1 && c.x <= w.x2)
    expect(under.length).toBeGreaterThan(10)
    for (const c of under) expect(w.y - w.w2).toBeGreaterThan(Math.max(...c.heads.map((h) => h.y), c.stem?.y2 ?? 0))
    const ink = inkBounds(L)
    expect(ink.maxY).toBeLessThanOrEqual(L.h)
  })

  it('a hairpin cut by the window keeps its opening where it was cut', () => {
    const L = run(touch, BOTH, 5)
    expect(L.wedges).toHaveLength(1)
    expect(L.wedges[0].w1).toBeGreaterThan(0)
    expect(L.wedges[0].w2).toBeGreaterThan(L.wedges[0].w1)
  })

  it('on the grand staff, letters and hairpins go between the staves; a hairpin clears the letters at its ends', () => {
    const s = song([4, 4], 2, [[72, 0, 1], [74, 1, 1], [76, 2, 1], [77, 3, 1], [48, 0, 2], [43, 2, 2], [72, 4, 4], [48, 4, 4]])
    s.marks = [{ t: 0, text: 'mf' }, { t: 4, text: 'p' }]
    s.wedges = [{ t0: 0, t1: 3, up: false }]
    const L = run(s)
    expect(L.clefs).toEqual(['treble', 'bass'])
    for (const y of [L.dyns[0].y, L.wedges[0].y]) {
      expect(y).toBeGreaterThan(L.base.treble)
      expect(y).toBeLessThan(L.base.bass - 4 * S)
    }
    expect(L.wedges[0].x1).toBeGreaterThan(L.dyns[0].x + 15)
    expect(L.wedges[0].x2).toBeLessThan(L.dyns[1].x - 7)
    expect([L.wedges[0].w1, L.wedges[0].w2]).toEqual([6, 0])
  })

  it('a file with no marks draws none', () => {
    const L = run(song([4, 4], 2, eighths(72, 0, 16)))
    expect([L.slurs, L.wedges, L.dyns, L.chords.filter((c) => c.art)].map((x) => x.length)).toEqual([0, 0, 0, 0])
  })

  it('a letter sits clear of the heads of a stacked chord above it', () => {
    const s = song([4, 4], 1, [[60, 0, 4], [64, 0, 4], [67, 0, 4], [48, 0, 4]]) // C-E-G over a low C: the lowest head is the ledger line under the treble staff
    s.marks = [{ t: 0, text: 'mf' }]
    const L = run(s)
    expect(L.dyns[0].y - 13).toBeGreaterThanOrEqual(Math.max(...L.chords.flatMap((c) => (c.clef === 'treble' ? c.heads.map((h) => h.y) : []))) + 5)
  })

  it("a technique exercise's aim-for dynamic clears the chords of the Pedal exercise in every key", () => {
    for (let tonic = 0; tonic < 12; tonic++) {
      for (const minor of [false, true]) {
        const L = run(exercise({ pattern: 'pedal', tonic, minor, dyn: 'medium', hands: 'both', bpm: 72 }), { view: 'sheet', px: { w: 820, h: 1180 } })
        for (const [si, sy] of L.systems.entries()) {
          const heads = L.chords.filter((c) => c.sys === si && c.clef === 'treble' && c.x - 8 <= sy.x0 + 44).flatMap((c) => c.heads.map((h) => h.y))
          expect(sy.aim! - 13, `tonic ${tonic}${minor ? 'm' : ''}`).toBeGreaterThanOrEqual(Math.max(...heads) + 5)
        }
      }
    }
  })
})
