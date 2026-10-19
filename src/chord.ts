import { LETTERS, spell } from './spell'

// Chord shapes as pitch-class offsets from the root, most common first.
const SHAPES: [string, number[]][] = [
  ['', [0, 4, 7]],
  ['m', [0, 3, 7]],
  ['7', [0, 4, 7, 10]],
  ['maj7', [0, 4, 7, 11]],
  ['m7', [0, 3, 7, 10]],
  ['dim', [0, 3, 6]],
  ['aug', [0, 4, 8]],
  ['sus4', [0, 5, 7]],
  ['sus2', [0, 2, 7]],
  ['m7♭5', [0, 3, 6, 10]],
  ['dim7', [0, 3, 6, 9]],
  ['6', [0, 4, 7, 9]],
  ['m6', [0, 3, 7, 9]],
  ['5', [0, 7]],
]

const INTERVALS = ['unison', 'minor second', 'major second', 'minor third', 'major third', 'fourth', 'tritone', 'fifth', 'minor sixth', 'major sixth', 'minor seventh', 'major seventh', 'octave']

/** A pitch class written as a letter name, spelled for the key (sharps in sharp keys, flats in flat keys). */
export function pcName(pc: number, fifths: number): string {
  const sp = spell(60 + pc, fifths)
  return LETTERS[sp.letter] + (sp.acc > 0 ? '♯' : sp.acc < 0 ? '♭' : '')
}

export interface Chord {
  name: string // 'C', 'Am7', 'C/E', 'fifth', 'E4'
  detail: string // the notes, lowest first
}

/** What a set of held keys is. Chords by shape (any inversion), two notes by interval, one note by name. */
export function nameChord(held: number[], fifths = 0): Chord | null {
  const ps = [...new Set(held)].sort((a, b) => a - b)
  if (!ps.length) return null
  const names = ps.map((p) => {
    const sp = spell(p, fifths)
    return `${LETTERS[sp.letter]}${sp.acc > 0 ? '♯' : sp.acc < 0 ? '♭' : ''}${sp.oct}`
  })
  const detail = names.join(' ')
  if (ps.length === 1) return { name: names[0], detail: '' }
  const pcs = [...new Set(ps.map((p) => p % 12))]
  if (ps.length === 2) {
    const semis = ps[1] - ps[0]
    return { name: INTERVALS[Math.min(semis, 12)] ?? `${semis} semitones`, detail }
  }
  const bass = ps[0] % 12
  // the bass as root wins; otherwise the first shape that fits an inversion
  const order = [bass, ...pcs.filter((x) => x !== bass)]
  for (const root of order) {
    for (const [suffix, shape] of SHAPES) {
      const set = shape.map((i) => (root + i) % 12)
      if (set.length === pcs.length && set.every((x) => pcs.includes(x))) {
        const slash = root === bass ? '' : `/${pcName(bass, fifths)}`
        return { name: pcName(root, fifths) + suffix + slash, detail }
      }
    }
  }
  return { name: pcs.map((x) => pcName(x, fifths)).join(' '), detail: '' }
}
