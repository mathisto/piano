import { instrumentId } from './instruments'
import type { Coach } from './even'
import type { Metro } from './metronome'
import type { Opts } from './technique'
import type { PlanMin } from './plan'
export type KeyTouch = 'Light' | 'Medium' | 'Heavy' | 'Fixed' | 'Unknown'
export const KEY_TOUCH: KeyTouch[] = ['Unknown', 'Light', 'Medium', 'Heavy', 'Fixed']

export interface Settings {
  fx: 0 | 1 // effects: off, calm
  fall: number // seconds of look-ahead on the highway
  sound: boolean // browser sound for the played notes; the keyboard's own speakers are the default
  instrument: string // an id from instruments.ts: grand piano (default), other sampled instruments, or the small built-in synth
  volume: number
  click: number // count-in and metronome click level, 0 = silent count-in
  metro: Metro // practice metronome: off, on the beat, or with eighths between
  names: boolean // note names on keys and notes
  asWritten: boolean // aim for the dynamics a MIDI file carries, mapped onto your own soft and hard
  fade: boolean // hide the name of a note on the bars once the Read drills show you know it
  planMin: PlanMin // how long a Today plan should take
  goal: number // minutes of practice a week the player is aiming at
  tech: Opts // the last Technique exercise chosen
  edges?: { soft: number; hard: number } // calibrated velocity bands (0..127); default bands when unset
  coach: Coach // how closely touch evenness is judged: off, or a tolerance of about 12, 8 or 5 on the default bands
  marks: boolean // always show the live evenness marks: no fading once the touch is even, no quiet test runs
  keyTouch: KeyTouch // the keyboard's own key touch setting, logged with each touch entry; Fixed makes evenness unmeasurable
  strict: 'easy' | 'standard' | 'strict' // timing windows and key-length grading together (Perform only)
  full: boolean // show all 88 keys instead of fitting the song
  view: 'both' | 'sheet' | 'falling' // sheet music only, both, or falling notes only: set by dragging the divider to an end
  pane: number // the staff's share of the room when both show, 0..1
  zoom: number // staff size: 1 is the default, below it the staff is smaller and shows more bars
  zpos: [number, number] // where the staff size buttons sit in the staff, 0 to 1 across and down; 1, 1 is the bottom right corner
  offset: number // ms, from calibration
  split: number // MIDI pitch splitting hands in single-track files
  device: string // MIDI input id, '' = all
  readBest?: number // Read through: the fastest tempo of a clean read-through, so the next one does not start faster
  osk?: boolean // on-screen keys under Theory and the Quiz: unset follows whether a MIDI keyboard is connected
  oskNames?: boolean // a letter on every white key of the on-screen keys, not just the Cs
  readAhead?: boolean // Read through: only the next two bars show once the music moves
}

const DEFAULTS: Settings = {
  fx: 1,
  fall: 3,
  sound: false,
  instrument: 'piano',
  volume: 0.7,
  click: 0.6,
  metro: 'off',
  names: true,
  fade: true,
  asWritten: false,
  strict: 'standard',
  coach: 'gentle',
  marks: false,
  keyTouch: 'Unknown',
  planMin: 10,
  goal: 60,
  tech: { pattern: 'five', tonic: 0, dyn: 'medium', hands: 'R', bpm: 72 },
  full: false,
  view: 'both',
  pane: 0.4,
  zoom: 1,
  zpos: [1, 1],
  offset: 0,
  split: 60,
  device: '',
}

const KEY = 'piano.settings'

function load(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    if (saved.staff === false && !saved.view) saved.view = 'falling' // from the old "Show the staff" switch
    delete saved.staff
    if (saved.fx > 1) saved.fx = 1 // the Arcade tier is gone
    if (!saved.strict && saved.hold) saved.strict = saved.hold === 'off' ? 'easy' : saved.hold === 'strict' ? 'strict' : 'standard'
    delete saved.hold
    saved.instrument = instrumentId(saved.instrument)
    delete saved.chord
    return { ...DEFAULTS, ...saved }
  } catch {
    return { ...DEFAULTS }
  }
}

export const settings: Settings = load()

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    /* private mode: settings last for the session */
  }
}

/** The first-run Set up sheet: once, never over saved settings, never under automation (`?setup` forces it). */
export const showSetup = (o: { seen: boolean; saved: boolean; automated: boolean; forced: boolean }) => o.forced || !(o.seen || o.saved || o.automated)
