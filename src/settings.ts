import type { Opts } from './technique'
export interface Settings {
  fx: 0 | 1 | 2 // effects: off, calm, arcade
  fall: number // seconds of look-ahead on the highway
  sound: boolean // browser sound for the played notes; the keyboard's own speakers are the default
  instrument: 'piano' | 'synth' // sampled grand piano, or the small built-in synth
  volume: number
  names: boolean // note names on keys and notes
  planMin: 5 | 10 | 20 // how long a Today plan should take
  goal: number // minutes of practice a week the player is aiming at
  tech: Opts // the last Technique exercise chosen
  edges?: { soft: number; hard: number } // calibrated velocity bands (0..127); default bands when unset
  strict: 'easy' | 'standard' | 'strict' // timing windows and key-length grading together (Perform only)
  full: boolean // show all 88 keys instead of fitting the song
  view: 'both' | 'sheet' | 'falling' // sheet music only, both, or falling notes only
  offset: number // ms, from calibration
  split: number // MIDI pitch splitting hands in single-track files
  device: string // MIDI input id, '' = all
}

const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

const DEFAULTS: Settings = {
  fx: reduced ? 1 : 2,
  fall: 3,
  sound: false,
  instrument: 'piano',
  volume: 0.7,
  names: true,
  strict: 'standard',
  planMin: 10,
  goal: 60,
  tech: { pattern: 'five', tonic: 0, dyn: 'medium', hands: 'R', bpm: 72 },
  full: false,
  view: 'both',
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
    if (saved.fx > 2) saved.fx = 2 // the Max tier is gone
    if (!saved.strict && saved.hold) saved.strict = saved.hold === 'off' ? 'easy' : saved.hold === 'strict' ? 'strict' : 'standard'
    delete saved.hold
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
