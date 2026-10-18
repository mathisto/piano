export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const NAT_PC = [0, 2, 4, 5, 7, 9, 11]
const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6] // F C G D A E B (letter indices)
const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3] // B E A D G C F

export interface Spelled {
  letter: number // 0..6 = C..B
  acc: -1 | 0 | 1
  oct: number // scientific pitch octave (middle C = C4)
  step: number // diatonic step: oct * 7 + letter
}

/** Accidental each letter carries in the key signature. */
export function keyAcc(fifths: number): number[] {
  const a = [0, 0, 0, 0, 0, 0, 0]
  if (fifths > 0) for (let i = 0; i < fifths; i++) a[SHARP_ORDER[i]] = 1
  else for (let i = 0; i < -fifths; i++) a[FLAT_ORDER[i]] = -1
  return a
}

export function spell(midi: number, fifths: number): Spelled {
  const pc = midi % 12
  const ka = keyAcc(fifths)
  let letter = NAT_PC.findIndex((n, i) => (((n + ka[i]) % 12) + 12) % 12 === pc)
  let acc = letter >= 0 ? ka[letter] : 0
  if (letter < 0 && NAT_PC.includes(pc)) letter = NAT_PC.indexOf(pc) // a white key the key signature alters: natural
  else if (letter < 0) {
    // chromatic note: sharp it in sharp keys, flat it in flat keys
    const up = fifths >= 0
    const l = NAT_PC.findIndex((n) => (n + (up ? 1 : -1) + 12) % 12 === pc)
    letter = l
    acc = up ? 1 : -1
  }
  const oct = (midi - acc - NAT_PC[letter]) / 12 - 1
  return { letter, acc: acc as -1 | 0 | 1, oct, step: oct * 7 + letter }
}

export function noteName(midi: number, fifths = 0): string {
  const s = spell(midi, fifths)
  return `${LETTERS[s.letter]}${s.acc > 0 ? '♯' : s.acc < 0 ? '♭' : ''}${s.oct}`
}

/** Diatonic step of the bottom line of each clef (E4 treble, G2 bass). */
export const BOTTOM_STEP = { treble: 4 * 7 + 2, bass: 2 * 7 + 4 }

/** Key signature glyph positions as diatonic steps: [letter, octave] pairs per clef. */
const SHARP_POS = {
  treble: [[3, 5], [0, 5], [4, 5], [1, 5], [5, 4], [2, 5], [6, 4]],
  bass: [[3, 3], [0, 3], [4, 3], [1, 3], [5, 2], [2, 3], [6, 2]],
}
const FLAT_POS = {
  treble: [[6, 4], [2, 5], [5, 4], [1, 5], [4, 4], [0, 5], [3, 4]],
  bass: [[6, 2], [2, 3], [5, 2], [1, 3], [4, 2], [0, 3], [3, 2]],
}

export function keySigSteps(fifths: number, clef: 'treble' | 'bass'): number[] {
  const pos = fifths >= 0 ? SHARP_POS[clef] : FLAT_POS[clef]
  return pos.slice(0, Math.abs(fifths)).map(([l, o]) => o * 7 + l)
}

/** Treble at 64+ (E4 up), bass at 55 and below, the hand decides the middle. */
export function clefFor(midi: number, hand: 'R' | 'L'): 'treble' | 'bass' {
  if (midi >= 64) return 'treble'
  if (midi <= 55) return 'bass'
  return hand === 'R' ? 'treble' : 'bass'
}
