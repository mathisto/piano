import { dayNum } from './drill'

/** A day counts as practised from this many seconds (the week strip uses the same line). */
export const MIN_SEC = 60
export const EARN_EVERY = 7 // a freeze for each week of practised days in a row
export const MAX_FREEZES = 2

/** The local day number of a 'YYYY-MM-DD' key, via dayNum at local noon so DST and time zones cannot shift it. */
export const dayOfKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return dayNum(new Date(y, m - 1, d, 12))
}

export interface Streak {
  n: number // practised days in the current streak
  freezes: number // banked
  today: boolean // today already counts
  saved: boolean // a freeze covered yesterday
}

/**
 * Replays the practice log day by day, so nothing but the log is stored. A practised day adds one; every seventh earns a
 * freeze (at most two); a missed day spends a freeze and keeps the streak, or ends it when there is none. Today is not
 * judged until it is over, so an unpractised today never breaks anything.
 */
export function streak(days: Record<string, number>, today = dayNum()): Streak {
  const played = new Set(Object.entries(days).filter(([, s]) => s >= MIN_SEC).map(([k]) => dayOfKey(k)))
  const first = Math.min(...played)
  let n = 0
  let freezes = 0
  let saved = false
  for (let d = first; d <= today; d++) {
    if (played.has(d)) {
      n++
      if (n % EARN_EVERY === 0) freezes = Math.min(MAX_FREEZES, freezes + 1)
    } else if (d < today && n) {
      if (freezes) freezes--
      else n = 0
      saved = n > 0 && d === today - 1
    }
  }
  return { n, freezes, today: played.has(today), saved }
}
