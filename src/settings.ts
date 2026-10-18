export interface Settings {
  fx: 0 | 1 | 2 | 3 // effects: off, calm, arcade, max
  fall: number // seconds of look-ahead on the highway
  sound: boolean // browser piano; the keyboard's own speakers are the default
  volume: number
  names: boolean // note names on keys and notes
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
  volume: 0.7,
  names: true,
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
