import { dayNum, type NoteStat, type Stats } from './drill'
import { isPulse, pulseDeck } from './pulse'
import { chordEarCards, qaCards } from './ear2'
import { degreeCards as earDegrees, intervalCards as earIntervals, playCards, rhythmCards } from './ear'
import { keyDeck, pc, type Step, type TCard, type Trainer } from './theory-cards'

export const TRAINERS: { id: Trainer; name: string; blurb: string; levels: string[] }[] = [
  { id: 'chords', name: 'Chords', blurb: 'A chord name; play it. Triads first, then every root, then inversions, then sevenths.', levels: ['Major and minor on the white keys', 'Major and minor in every key', 'Diminished, augmented and inversions', 'Seventh chords'] },
  { id: 'keys', name: 'Key signatures', blurb: 'Given a signature, play the key\'s chord; given a key, play its sharps or flats.', levels: [] },
  { id: 'intervals', name: 'Intervals', blurb: 'Play the note an interval above or below a given note.', levels: [] },
  { id: 'cadences', name: 'Cadences', blurb: 'Play a progression in a key, a chord at a time.', levels: ['I–IV–V–I', 'Adds ii–V–I', 'Adds I–V–vi–IV and I–vi–IV–V'] },
  { id: 'degrees', name: 'Scale degrees', blurb: 'Play the 2nd to 7th note of a major scale. The same degrees fix the fingering.', levels: [] },
  { id: 'earplay', name: 'Ear: play it back', blurb: 'Hear 2 to 5 notes in a key; play them back in order, in any octave.', levels: ['Steps in C major', 'Steps and thirds', 'Leaps up to an octave', 'Other major keys', 'Minor keys', 'A note off the scale'] },
  { id: 'earint', name: 'Ear: intervals', blurb: 'Hear two notes, up, down or together; play the second one.', levels: ['2nds and 3rds', '4ths and 5ths', '6ths and 7ths', 'Octaves', 'All intervals'] },
  { id: 'eardeg', name: 'Ear: scale degrees', blurb: 'A short cadence sets the key; then one note to play back. A miss tells you its degree.', levels: ['Degrees 1, 3 and 5 in C, G and F', 'All seven degrees in C, G and F', 'All seven degrees in every key'] },
  { id: 'rhythm', name: 'Rhythm echo', blurb: 'Tap back a bar heard on a click. Shows how far you sit from the click, apart from how even you are.', levels: ['Quarters and halves', 'Adds eighths', 'Adds dotted rhythms', 'Syncopation'] },
  { id: 'keepbeat', name: 'Keep the beat', blurb: 'A click, then silence: keep tapping the beat. Shows whether you sped up or slowed down.', levels: ['1 silent bar', '2 silent bars', '4 silent bars'] },
  { id: 'subdiv', name: 'Subdivisions', blurb: 'Tap eighths, triplets, sixteenths or swung eighths on any key against a quarter-note click.', levels: ['Eighths', 'Triplets', 'Sixteenths', 'Mixed, with swung eighths'] },
  { id: 'holdrhythm', name: 'Hold a rhythm against the beat', blurb: 'A bar is written as marks on a grid; tap it twice through against a steady click.', levels: ['Quarters and halves', 'Adds eighths', 'Adds dotted rhythms', 'Syncopation'] },
  { id: 'earchord', name: 'Ear: chords', blurb: 'Hear a chord or a short progression, arpeggiated and then blocked; play it back, or just its root.', levels: ['Major or minor on C', 'Major or minor on any root', 'Inversions: which note is lowest', 'I–IV–V–I and I–V–vi–IV in a key', 'Dominant 7ths'] },
  { id: 'earqa', name: 'Ear: question and answer', blurb: 'Answer a two-bar phrase on the click. Judged on form only: the key, the last note, the pulse.', levels: ['C major', 'Any major key', 'Minor keys', 'Echo the rhythm'] },
]

/** Trainers whose cards are judged on timing or form, not speed: no median time. */
export const untimed = (t: Trainer) => t === 'rhythm' || t === 'earqa'

export const deckOf = (t: Trainer, level: number): TCard[] =>
  isPulse(t) ? pulseDeck(t, level) : t === 'earchord' ? chordEarCards(level) : t === 'earqa' ? qaCards(level) : t === 'earplay' ? playCards(level) : t === 'earint' ? earIntervals(level) : t === 'eardeg' ? earDegrees(level) : t === 'rhythm' ? rhythmCards(level) : keyDeck(t, level)

/** Is a played gesture the answer? The same pitch classes, none extra, and the right lowest note when an inversion is asked. */
export function check(step: Step, played: number[]): boolean {
  if (!played.length) return false
  const got = new Set(played.map(pc))
  if (step.root !== undefined && got.size === 1 && got.has(step.root)) return true
  if (got.size !== step.pcs.length || !step.pcs.every((p) => got.has(p))) return false
  if (step.abs !== undefined && !played.every((p) => p === step.abs)) return false
  return step.bass === undefined || pc(Math.min(...played)) === step.bass
}

/** How much a card is wanted: unseen and shaky and due cards more, never the one just asked. */
const want = (s: NoteStat | undefined, today: number) => (s ? 1 + 4 * (1 - s.clean) + Math.min(2, s.rt / 6000) + (s.due !== undefined && s.due <= today ? 2 : 0) : 3)

export function deal(deck: TCard[], stats: Stats, n: number, rnd: () => number = Math.random, today = dayNum()): TCard[] {
  const out: TCard[] = []
  for (let i = 0; i < n; i++) {
    const cand = deck.filter((c) => c.id !== out[i - 1]?.id)
    const w = cand.map((c) => want(stats[c.id], today))
    let r = rnd() * w.reduce((a, b) => a + b, 0)
    let pick = cand[cand.length - 1]
    for (let k = 0; k < cand.length; k++) {
      r -= w[k]
      if (r <= 0) {
        pick = cand[k]
        break
      }
    }
    out.push(pick)
  }
  return out
}
