// The practice reminder's rule (horizon decision 29; the iPad app only, src/native-app.ts schedules what this returns).
import { MIN_SEC } from './streak'
import { dayKey } from './week'

const DAYS = 3 // the days ahead that get a note; the next background trip schedules three more, so an app left unopened for three days falls silent

/** When the reminder fires: at `at` (minutes after midnight) on each of the next three days that has not passed, and that has no practice yet. Off (undefined) or out of range: none. */
export function reminders(at: number | undefined, days: Record<string, number>, now = new Date()): Date[] {
  if (at === undefined || !Number.isInteger(at) || at < 0 || at >= 1440) return []
  const out: Date[] = []
  for (let i = 0; out.length < DAYS && i < 14; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 0, at) // local time, so a change of clocks cannot shift it
    if (d > now && (days[dayKey(d)] ?? 0) < MIN_SEC) out.push(d)
  }
  return out
}

/** What is next, never what is at risk: no streak, no loss. `next` is the next Read stage, as Today names it. */
export const reminderText = (min: number, next?: string) => `${min} minutes? ${next ? `Next up: ${next}.` : 'Your plan is ready.'}`
