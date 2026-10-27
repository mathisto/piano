import { STAGES as DRILL, fluentMs, mastery as drillMastery, type Stats } from './drill'
import { cardKey, cardsOf, mastery as scaleMastery, STAGES as SCALES, type ScaleStats } from './scales'
import { SYLLABUS, stateOf, type TechStats } from './syllabus'
import type { Opts } from './technique'
import { deckOf, type Trainer } from './theory'

/**
 * A generic five-level path of technical requirements, drawn from what the public graded syllabi ask at each stage:
 * scales at a tempo, contrary motion, chromatic scales, triads and their inversions, arpeggios, dominant sevenths,
 * cadences, then reading and theory. The levels are our own; no exam board is named or implied.
 * A requirement with no `check` is listed as coming: no feature trains it yet, so it never shows progress.
 */
export type Start = { kind: 'scale'; id: string } | { kind: 'read'; id: string; fast?: boolean } | { kind: 'tech'; id: string } | { kind: 'theory'; trainer: Trainer; level: number }
export interface Ctx {
  scales: ScaleStats
  drill: Stats
  tech: TechStats
  theory: Stats
  day: number
}
interface Got {
  pct: number // 0..1
  started: boolean
}
export interface Req {
  level: number
  name: string
  detail: string
  check?: (c: Ctx) => Got
  start?: Start
}
export type State = 'new' | 'learning' | 'solid' | 'coming'
export interface Row extends Omit<Req, 'check'> {
  state: State
  pct: number
}

const scale = (level: number, id: string, name: string, extra = ''): Req => {
  const st = SCALES.find((s) => s.id === id)!
  return {
    level,
    name,
    detail: `${st.blurb}${extra} At ${st.bpm} bpm.`,
    start: { kind: 'scale', id },
    check: (c) => ({ pct: scaleMastery(st, c.scales).pct, started: cardsOf(st).some((k) => (c.scales[cardKey(k)]?.n ?? 0) > 0) }),
  }
}

// `fast` asks for the Fluent tier: the same stages against fluentMs
const read = (level: number, name: string, detail: string, ids: string[], fast = false): Req => {
  const sts = DRILL.filter((s) => ids.includes(s.id))
  return {
    level,
    name,
    detail,
    start: { kind: 'read', id: sts[0].id, ...(fast && { fast }) },
    check: (c) => {
      const ms = sts.map((s) => drillMastery(s, c.drill, fast ? fluentMs(s) : s.goalMs))
      return { pct: ms.reduce((a, m) => a + (m.solid ? 1 : m.pct), 0) / ms.length, started: ms.some((m) => m.seen > 0) }
    },
  }
}

const tech = (level: number, name: string, detail: string, pick: (o: Opts) => boolean): Req => {
  const rs = SYLLABUS.filter((r) => pick(r.opts))
  return {
    level,
    name,
    detail,
    start: { kind: 'tech', id: rs[0].id },
    check: (c) => {
      const st = rs.map((r) => stateOf(c.tech, r.id, c.day))
      return { pct: st.filter((s) => s === 'solid' || s === 'due').length / rs.length, started: st.some((s) => s !== 'new') }
    },
  }
}

// ponytail: a card is solid after two answers at 80% first try or better; a deck counts as solid at 80% of its cards.
// Upgrade to the Leitner box once Theory exposes it.
const SOLID_CARDS = 0.8
const theory = (level: number, name: string, detail: string, trainer: Trainer, lv: number, only?: RegExp): Req => {
  const deck = deckOf(trainer, lv).filter((k) => !only || only.test(k.id))
  return {
    level,
    name,
    detail,
    start: { kind: 'theory', trainer, level: lv },
    check: (c) => {
      const solid = deck.filter((k) => (c.theory[k.id]?.n ?? 0) >= 2 && c.theory[k.id].clean >= 0.8).length
      return { pct: Math.min(1, solid / deck.length / SOLID_CARDS), started: deck.some((k) => c.theory[k.id]) }
    },
  }
}


export const REQS: Req[] = [
  scale(1, 's1', 'Scales: the easy keys'),
  tech(1, 'Five-finger patterns', 'C position, each hand and then together.', (o) => o.pattern === 'five' && o.dyn === 'medium'),
  tech(1, 'Steady rhythm', 'Quarter and half notes against the pulse.', (o) => o.pattern === 'rhythm' && o.level === 1),
  read(1, 'Reading: the five-finger notes', 'Treble and bass, C to G.', ['t-land', 't-five', 'b-land', 'b-five']),
  theory(1, 'Triads on the white keys', 'Major and minor, played from the chord name.', 'chords', 1),
  theory(1, 'Cadence I–IV–V–I', 'Played in every major key.', 'cadences', 1),

  scale(2, 's2', 'Scales: two octaves, hands together'),
  tech(2, 'Contrary motion', 'Both hands out from the tonic and back, C major.', (o) => o.pattern === 'contrary'),
  tech(2, 'Arpeggios, major', 'Broken chords over the octave.', (o) => o.pattern === 'arp' && !o.minor),
  read(2, 'Reading: the octave and the staff', 'Treble and bass, an octave out from the landmarks.', ['t-oct', 't-anch', 't-staff', 'b-oct', 'b-anch', 'b-staff']),
  read(2, 'Reading: G and F major', 'One sharp, one flat in the key signature.', ['keys-g', 'keys-f']),
  theory(2, 'Triads in every key', 'Major and minor from any root.', 'chords', 2),

  scale(3, 's3', 'Scales: D, A, E and the minors'),
  tech(3, 'Arpeggios, minor', 'A minor broken chords.', (o) => o.pattern === 'arp' && !!o.minor),
  tech(3, 'Minor scales', 'A, E and D minor, hand by hand.', (o) => o.pattern === 'scale' && !!o.minor),
  scale(3, 's9', 'Scales: the chromatic scale'),
  theory(3, 'Triads with inversions', 'Major and minor, root position and the two inversions.', 'chords', 3, /^chord:(maj|min):\d+:[12]$/),
  theory(3, 'Intervals, second to fifth', 'Play the note above or below.', 'intervals', 1, /^iv:(1|2|3|4|5|7):/),
  read(3, 'Reading: four-note tunes and accidentals', 'Short lines in C, G and F; sharps and flats.', ['tune-c', 'tune-g', 'tune-f', 'sharps', 'flats']),
  read(3, 'Reading: ledger lines and switching clefs', 'One and two ledger lines in each clef, then cards that change clef every time.', ['t-led1', 't-led2', 'b-led1', 'b-led2', 'mixed']),
  read(3, 'Reading: A and D minor', 'The minor key signatures, with the raised seventh.', ['keys-am', 'keys-dm']),
  theory(3, 'Cadence ii–V–I', 'Adds the dominant preparation.', 'cadences', 2),

  scale(4, 's4', 'Scales: the black-key keys'),
  scale(4, 's7', 'Scales: contrary motion'),
  scale(4, 's10', 'Scales: chromatic from every note'),
  theory(4, 'Dominant sevenths', 'The chord on the fifth, played from its name.', 'chords', 4, /^chord:dom7:/),
  theory(4, 'Cadences, all four', 'Adds I–V–vi–IV and I–vi–IV–V.', 'cadences', 3),
  theory(4, 'Key signatures', 'The chord of a signature, and the sharps or flats of a key.', 'keys', 1),
  read(4, 'Reading: the whole grand staff', 'Both clefs, intervals and triads.', ['grand', 'ints', 'triads', 'b-low', 't-high']),
  read(4, 'Reading: two and three sharps or flats', 'D, B♭, A and E♭ major.', ['keys-d', 'keys-bb', 'keys-a', 'keys-eb']),

  scale(5, 's5', 'Scales: all 24 keys together'),
  scale(5, 's6', 'Scales: up to speed'),
  scale(5, 's11', 'Scales: triad arpeggios'),
  scale(5, 's12', 'Scales: arpeggios in all keys'),
  scale(5, 's13', 'Scales: seventh arpeggios'),
  theory(5, 'Seventh chords', 'Major, dominant, minor and half-diminished sevenths.', 'chords', 4),
  theory(5, 'Intervals, all', 'Every interval above and below, any note.', 'intervals', 1),
  theory(5, 'Scale degrees', 'The 2nd to 7th note of any major key.', 'degrees', 1),
  read(5, 'Reading: octave signs and reading ahead', 'Notes under 8va and 8vb, and tunes whose next notes vanish.', ['oct8', 'tune-a1', 'tune-a2']),
  read(5, 'Reading at speed', 'The staff in both clefs, fluent: every note first try in about 1.5 s.', ['t-staff', 'b-staff', 'mixed'], true),
]

export function rowOf(r: Req, c: Ctx): Row {
  const { check, ...rest } = r
  if (!check) return { ...rest, state: 'coming', pct: 0 }
  const g = check(c)
  return { ...rest, pct: g.pct, state: g.pct >= 1 ? 'solid' : g.started ? 'learning' : 'new' }
}

export interface Level {
  level: number
  rows: Row[]
  solid: number
  total: number // requirements a feature exists for
  coming: number
  next?: Row // first one not solid yet
}

export function path(c: Ctx): Level[] {
  return [1, 2, 3, 4, 5].map((level) => {
    const rows = REQS.filter((r) => r.level === level).map((r) => rowOf(r, c))
    const live = rows.filter((r) => r.state !== 'coming')
    return { level, rows, solid: live.filter((r) => r.state === 'solid').length, total: live.length, coming: rows.length - live.length, next: live.find((r) => r.state !== 'solid') }
  })
}

/** The level to work on: the first with a requirement left. */
export const nextOf = (p: Level[]) => p.find((l) => l.next)?.next
