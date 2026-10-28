// Notes shown levels: its own module so a page that only names them (results) does not pull the simplifier and the chord reader into the boot JS.
export type Level = 0 | 1 | 2 | 3 | 4
export const LEVELS: Record<Level, string> = { 0: 'Full', 1: 'Thin chords', 2: 'Melody and bass', 3: 'Melody', 4: 'Lead sheet' }
