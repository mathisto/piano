import type { Stats } from './drill'

const RUN = 8 // good notes in a row before the praise goes quiet

/** In Learn and Technique the judgement words go quiet once you are playing cleanly: only slips are spoken. */
export class Quiet {
  private good = 0

  note(good: boolean) {
    this.good = good ? this.good + 1 : 0
  }

  get hushed() {
    return this.good >= RUN
  }

  reset() {
    this.good = 0
  }
}

const NEED = 12 // sightings, as in drill mastery

/** Pitches whose single-note reading card is seen enough, clean and quick: their names can fade from the keys and notes. */
export function knownPitches(stats: Stats): Set<number> {
  const out = new Set<number>()
  for (const [k, s] of Object.entries(stats)) {
    const [size, , p] = k.split(':')
    if (size === '1' && s.n >= NEED && s.clean >= 0.85 && s.rt <= 3000) out.add(Number(p))
  }
  return out
}
