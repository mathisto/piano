import { dayNum, type NoteStat, type Stats } from './drill'

/** Theory trainers answered on the keyboard: a prompt, and a played answer checked as sets of pitch classes. */
export type Trainer = 'chords' | 'keys' | 'intervals' | 'cadences' | 'degrees'

export interface Step {
  pcs: number[] // the pitch classes the answer is made of, in any octave and any order
  bass?: number // the lowest note must be this pitch class (an inversion)
}
export interface TCard {
  id: string // the spaced-review key
  prompt: string
  steps: Step[] // one for most cards, several for a cadence
  show: string // the answer in words, for a miss
}

export const NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']
const pc = (n: number) => ((n % 12) + 12) % 12
const names = (pcs: number[]) => pcs.map((p) => NAMES[p]).join(' ')

const QUAL: Record<string, [string, number[]]> = {
  maj: ['major', [0, 4, 7]],
  min: ['minor', [0, 3, 7]],
  dim: ['diminished', [0, 3, 6]],
  aug: ['augmented', [0, 4, 8]],
  maj7: ['major 7th', [0, 4, 7, 11]],
  dom7: ['dominant 7th', [0, 4, 7, 10]],
  min7: ['minor 7th', [0, 3, 7, 10]],
  hdim7: ['half-diminished 7th', [0, 3, 6, 10]],
}
const INV = ['root position', 'first inversion', 'second inversion', 'third inversion']
const WHITE_ROOTS = [0, 2, 4, 5, 7, 9, 11]

/** Chord symbols played with the hand: 1 major and minor on white-key roots, 2 every root, 3 adds diminished, augmented and inversions, 4 sevenths. */
export function chordCards(level: number): TCard[] {
  const quals = level === 1 || level === 2 ? ['maj', 'min'] : level === 3 ? ['maj', 'min', 'dim', 'aug'] : ['maj7', 'dom7', 'min7', 'hdim7']
  const out: TCard[] = []
  for (const root of level === 1 ? WHITE_ROOTS : NAMES.map((_, i) => i))
    for (const q of quals) {
      const [label, iv] = QUAL[q]
      const pcs = iv.map((i) => pc(root + i))
      for (let inv = 0; inv < (level >= 3 ? iv.length : 1); inv++)
        out.push({ id: `chord:${q}:${root}:${inv}`, prompt: `${NAMES[root]} ${label}${inv ? `, ${INV[inv]}` : ''}`, steps: [{ pcs, bass: inv ? pcs[inv] : undefined }], show: `${names(pcs)}${inv ? `, with ${NAMES[pcs[inv]]} lowest` : ''}` })
    }
  return out
}

const SHARPS = [6, 1, 8, 3, 10, 5, 0] // F C G D A E B, as pitch classes
const FLATS = [10, 3, 8, 1, 6, 11, 4] // B E A D G C F
const MAJOR_TONIC = (fifths: number) => pc(fifths * 7)

/** Key signatures: from the signature to the key's chord, and from the key to its sharps or flats. */
export function keyCards(): TCard[] {
  const out: TCard[] = []
  for (let f = -6; f <= 6; f++) {
    if (f === 0) continue
    const n = Math.abs(f)
    const word = `${n} ${f > 0 ? (n === 1 ? 'sharp' : 'sharps') : n === 1 ? 'flat' : 'flats'}`
    const tonic = MAJOR_TONIC(f)
    const triad = [tonic, pc(tonic + 4), pc(tonic + 7)]
    out.push({ id: `key:sig:${f}`, prompt: `${word}: play the major chord of that key`, steps: [{ pcs: triad }], show: `${NAMES[tonic]} major: ${names(triad)}` })
    const acc = (f > 0 ? SHARPS : FLATS).slice(0, n)
    out.push({ id: `key:acc:${f}`, prompt: `${NAMES[tonic]} major: play its ${f > 0 ? 'sharps' : 'flats'}, in any order`, steps: [{ pcs: acc }], show: `${names(acc)}` })
  }
  return out
}

const IV: [string, number][] = [['minor 2nd', 1], ['major 2nd', 2], ['minor 3rd', 3], ['major 3rd', 4], ['perfect 4th', 5], ['perfect 5th', 7], ['minor 6th', 8], ['major 6th', 9], ['minor 7th', 10], ['major 7th', 11]]

/** Spell and play: the note an interval above or below a given note. */
export function intervalCards(): TCard[] {
  const out: TCard[] = []
  for (let root = 0; root < 12; root++)
    for (const [name, n] of IV)
      for (const dir of [1, -1]) {
        const target = pc(root + dir * n)
        out.push({ id: `iv:${n}:${dir}:${root}`, prompt: `Play a ${name} ${dir > 0 ? 'above' : 'below'} ${NAMES[root]}`, steps: [{ pcs: [target] }], show: NAMES[target] })
      }
  return out
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11]
const TRIAD_Q = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']
const ROMAN = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
const PROGRESSIONS: [string, number[]][] = [['I–IV–V–I', [0, 3, 4, 0]], ['I–V–vi–IV', [0, 4, 5, 3]], ['ii–V–I', [1, 4, 0]], ['I–vi–IV–V', [0, 5, 3, 4]]]

/** A chord progression in a major key, played one chord after another. Level 1 is I–IV–V–I; 2 adds ii–V–I; 3 adds I–V–vi–IV and I–vi–IV–V. */
export function cadenceCards(level: number): TCard[] {
  const out: TCard[] = []
  for (const [label, degs] of PROGRESSIONS.slice(0, level === 1 ? 1 : level === 2 ? 3 : 4)) {
    for (let tonic = 0; tonic < 12; tonic++) {
      const steps = degs.map((d) => {
        const root = pc(tonic + MAJOR[d])
        return { pcs: QUAL[TRIAD_Q[d]][1].map((i) => pc(root + i)) }
      })
      out.push({ id: `cad:${label}:${tonic}`, prompt: `${label} in ${NAMES[tonic]} major`, steps, show: degs.map((d, i) => `${ROMAN[d]} = ${names(steps[i].pcs)}`).join(' · ') })
    }
  }
  return out
}

/** Scale degrees: play the Nth note of a major key. */
export function degreeCards(): TCard[] {
  const out: TCard[] = []
  for (let tonic = 0; tonic < 12; tonic++)
    for (let d = 2; d <= 7; d++) {
      const target = pc(tonic + MAJOR[d - 1])
      out.push({ id: `deg:${tonic}:${d}`, prompt: `Play degree ${d} of ${NAMES[tonic]} major`, steps: [{ pcs: [target] }], show: NAMES[target] })
    }
  return out
}

export const TRAINERS: { id: Trainer; name: string; blurb: string; levels: string[] }[] = [
  { id: 'chords', name: 'Chords', blurb: 'A chord name; play it. Triads first, then every root, then inversions, then sevenths.', levels: ['Major and minor on the white keys', 'Major and minor in every key', 'Diminished, augmented and inversions', 'Seventh chords'] },
  { id: 'keys', name: 'Key signatures', blurb: 'Given a signature, play the key\'s chord; given a key, play its sharps or flats.', levels: [] },
  { id: 'intervals', name: 'Intervals', blurb: 'Play the note an interval above or below a given note.', levels: [] },
  { id: 'cadences', name: 'Cadences', blurb: 'Play a progression in a key, a chord at a time.', levels: ['I–IV–V–I', 'Adds ii–V–I', 'Adds I–V–vi–IV and I–vi–IV–V'] },
  { id: 'degrees', name: 'Scale degrees', blurb: 'Play the 2nd to 7th note of a major scale. The same degrees fix the fingering.', levels: [] },
]

export const deckOf = (t: Trainer, level: number): TCard[] =>
  t === 'chords' ? chordCards(level) : t === 'keys' ? keyCards() : t === 'intervals' ? intervalCards() : t === 'cadences' ? cadenceCards(level) : degreeCards()

/** Is a played gesture the answer? The same pitch classes, none extra, and the right lowest note when an inversion is asked. */
export function check(step: Step, played: number[]): boolean {
  if (!played.length) return false
  const got = new Set(played.map(pc))
  if (got.size !== step.pcs.length || !step.pcs.every((p) => got.has(p))) return false
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
