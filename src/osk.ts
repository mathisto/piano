// The on-screen keyboard's maths: which keys, where, and which one a touch lands on. No DOM here.
import { noteName } from './spell'

export interface OKey {
  p: number
  black: boolean
  x: number // left edge, as a fraction of the keyboard's width
  w: number
}

export const WHITE_MIN = 48 // px: the narrowest white key worth a fingertip
export const BLACK_W = 0.62 // a black key's width against a white one
export const BLACK_H = 0.62 // and its length against the keyboard's height
export const LOW_MIN = 24 // C1; the top key never passes C8 (108)
const BLACKS = [1, 3, 6, 8, 10]
export const isBlack = (p: number) => BLACKS.includes(p % 12)

/** Octaves that fit `width` px at a comfortable key size: two to four. */
export const octavesFor = (width: number) => Math.min(4, Math.max(2, Math.floor(width / (7 * WHITE_MIN))))

/** The C to start on: centred on middle C, kept inside the piano. */
export const clampLow = (low: number, octaves: number) => Math.min(108 - 12 * octaves, Math.max(LOW_MIN, Math.round(low / 12) * 12))
export const defaultLow = (octaves: number) => clampLow(60 - 12 * Math.floor(octaves / 2), octaves)

/** Every key from `low` (a C) up `octaves` octaves and one more C, left to right in pitch order. */
export function layout(low: number, octaves: number): OKey[] {
  const top = low + 12 * octaves
  const n = octaves * 7 + 1 // white keys
  const keys: OKey[] = []
  let white = 0
  for (let p = low; p <= top; p++) {
    if (isBlack(p)) keys.push({ p, black: true, x: white / n - (BLACK_W / n) / 2, w: BLACK_W / n })
    else keys.push({ p, black: false, x: white++ / n, w: 1 / n })
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
