const BREAK_AFTER = 30 * 60 // seconds of playing in a row
export const GAP = 5 * 60 // a pause this long counts as a break already taken

/**
 * Tracks continuous practice. `add` takes seconds just practised and the clock in ms; it returns true once when
 * the run reaches 30 minutes, then starts counting again. The reminder is a nudge, not a medical claim.
 */
export function restTracker(after = BREAK_AFTER, gap = GAP) {
  let run = 0
  let at = 0
  return {
    add(sec: number, now: number): boolean {
      if (at && now - at > gap * 1000) run = 0
      at = now
      run += sec
      if (run < after) return false
      run = 0
      return true
    },
    get run() {
      return run
    },
  }
}
