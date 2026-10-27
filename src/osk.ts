// The on-screen keyboard's maths: which keys, where, and which one a touch lands on. No DOM here.
import { noteName } from './spell'

export interface OKey {
  p: number
  black: boolean
  x: number // left edge, as a fraction of the keyboard's width
  w: number
}

export const WHITE_MIN = 44 // px: the touch floor (44 on a coarse pointer, DESIGN.md Touch Floor Rule) for a white key's width
export const BLACK_W = 0.62 // a black key's width against a white one
export const BLACK_H = 0.62 // and its length against the keyboard's height
export const LOW_MIN = 24 // C1; the top key never passes C8 (108)
const BLACKS = [1, 3, 6, 8, 10]
export const isBlack = (p: number) => BLACKS.includes(p % 12)

/** White keys that fit `width` px at the touch floor: a little over an octave up to four. A split view gets a part-octave, not smaller keys. */
export const whitesFor = (width: number) => Math.min(29, Math.max(8, Math.floor(width / WHITE_MIN)))

/** Semitones from a C to the top of `whites` white keys. */
const span = (whites: number) => 12 * Math.floor((whites - 1) / 7) + [0, 2, 4, 5, 7, 9, 11][(whites - 1) % 7]

/** The C to start on: kept inside the piano. */
export const clampLow = (low: number, whites: number) => Math.min(Math.floor((108 - span(whites)) / 12) * 12, Math.max(LOW_MIN, Math.round(low / 12) * 12))
/** Centred on middle C: a C4 start up to a dozen whites, C3 from fifteen, C2 from twenty-nine. A part-octave keyboard (a split view, under fifteen whites) starts at the C under `lowest`, the lowest note a card can ask, when given. */
export const defaultLow = (whites: number, lowest?: number) =>
  clampLow(lowest !== undefined && whites < 15 ? Math.floor(lowest / 12) * 12 : 60 - 12 * Math.floor(whites / 14), whites)

/** Every key from `low` (a C) up through the `whites`th white key, left to right in pitch order. */
export function layout(low: number, whites: number): OKey[] {
  const keys: OKey[] = []
  let white = 0
  for (let p = low; white < whites; p++) {
    if (isBlack(p)) keys.push({ p, black: true, x: white / whites - BLACK_W / whites / 2, w: BLACK_W / whites })
    else keys.push({ p, black: false, x: white++ / whites, w: 1 / whites })
  }
  return keys
}

/** The key under a point given as fractions of the keyboard's width and height (black keys sit on top). */
export function keyAt(keys: OKey[], fx: number, fy: number): number | undefined {
  if (fx < 0 || fx >= 1 || fy < 0 || fy > 1) return undefined
  const hit = (b: boolean) => keys.find((k) => k.black === b && fx >= k.x && fx < k.x + k.w)
  return (fy < BLACK_H ? hit(true) : undefined)?.p ?? hit(false)?.p
}

/** A key's label: every C is named (C4 is middle C); with `all`, every white key. */
export const label = (p: number, all: boolean) => (p % 12 === 0 ? noteName(p) : all && !isBlack(p) ? noteName(p)[0] : '')

/** Whether the keys are on screen: the player's choice if they made one, else when no MIDI keyboard is connected; and only where a trainer waits for an answer. */
export const shown = (pref: boolean | undefined, midiInputs: number, needed: boolean) => needed && (pref ?? midiInputs === 0)
