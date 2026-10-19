import { LOOPS } from './instrument-loops'

export interface Root {
  name: string // file name without the extension
  midi: number
  loop?: [number, number] // seconds into the file; sustained instruments hold their note by looping this
}
export interface Instrument {
  id: string
  label: string
  base?: string // folder under samples/; none = the built-in synth
  roots: Root[]
  release: number // seconds the damper takes on key-up
  gain: number // trim so the instruments sit at about the same loudness
  dyn: number // 0..1: how much hitting harder is louder and brighter (an organ barely cares)
  layers?: number // recordings per note at different strengths, NAME-0 (soft) up; blended by how hard the key is hit
}

const NAMES: [string, number][] = [['C', 0], ['Ds', 3], ['Fs', 6], ['A', 9]]
const ladder = (from: number, to: number): Root[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i).flatMap((o) => NAMES.map(([n, pc]): Root => ({ name: `${n}${o}`, midi: 12 * (o + 1) + pc })))

/** Salamander Grand Piano V3 (scripts/make-piano.py): a soft, a medium and a hard recording every third semitone, A0 to C8. */
const PIANO_ROOTS: Root[] = [{ name: 'A0', midi: 21 }, ...ladder(1, 7), { name: 'C8', midi: 108 }]
/** MuseScore_General renderings (scripts/make-sounds.py): every third semitone, C2 to C7. */
const GM_ROOTS: Root[] = [...ladder(2, 6), { name: 'C7', midi: 96 }]
const gm = (id: string, label: string, release: number, gain: number, dyn: number): Instrument => ({
  id,
  label,
  base: id,
  roots: GM_ROOTS.map((r, i) => (LOOPS[id] ? { ...r, loop: LOOPS[id][i] } : r)),
  release,
  gain,
  dyn,
})

export const INSTRUMENTS: Instrument[] = [
  { id: 'piano', label: 'Grand piano', base: 'salamander', roots: PIANO_ROOTS, release: 0.3, gain: 1, dyn: 0, layers: 3 },
  gm('ep', 'Electric piano', 0.25, 1, 1),
  gm('organ', 'Church organ', 0.12, 0.5, 0.5),
  gm('harp', 'Harp', 0.5, 1, 1),
  gm('strings', 'Strings', 0.45, 0.55, 0.7),
  gm('musicbox', 'Music box', 0.8, 0.9, 0.5),
  { id: 'synth', label: 'Synth', roots: [], release: 0.3, gain: 1, dyn: 1 },
]

export const PIANO = INSTRUMENTS[0]
export const instrument = (id: string): Instrument => INSTRUMENTS.find((i) => i.id === id) ?? PIANO

/** A saved or unknown id becomes a real one: 'piano' and 'synth' from before the registry still work, anything else is the piano. */
export const instrumentId = (v: unknown): string => INSTRUMENTS.find((i) => i.id === v)?.id ?? 'piano'
