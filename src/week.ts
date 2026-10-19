export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export interface WeekDay {
  key: string
  label: string
  played: boolean // a minute or more
  today: boolean
}

/** The Monday-to-Sunday week around `d`, from a map of local date -> seconds practised. */
export function weekOf(days: Record<string, number>, d = new Date()): { days: WeekDay[]; minutes: number } {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7))
  let sec = 0
  const out = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((label, i) => {
    const key = dayKey(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i))
    sec += days[key] ?? 0
    return { key, label, played: (days[key] ?? 0) >= 60, today: key === dayKey(d) }
  })
  return { days: out, minutes: Math.floor(sec / 60) }
}

const GOALS = [30, 60, 90, 120, 180]

/** Last week's totals and a goal to suggest: one step up after meeting the goal, otherwise unchanged. */
export function lastWeek(days: Record<string, number>, goal: number, d = new Date()): { minutes: number; played: number; suggest: number } | null {
  const prev = weekOf(days, new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7))
  if (!prev.minutes) return null
  const up = GOALS.find((g) => g > goal)
  return { minutes: prev.minutes, played: prev.days.filter((x) => x.played).length, suggest: prev.minutes >= goal && up ? up : goal }
}

export interface Snapshot {
  read: Record<string, number> // mastery 0..1 per reading stage id
  tech: number // technique exercises that are solid
}

/** One line on what got better since an earlier snapshot, or null when nothing did. */
export function improved(prev: Snapshot | undefined, cur: Snapshot, names: Record<string, string>): string | null {
  if (!prev) return null
  let best: { id: string; was: number; now: number } | undefined
  for (const [id, now] of Object.entries(cur.read)) {
    const was = prev.read[id] ?? 0
    if (now - was >= 0.1 && (!best || now - was > best.now - best.was)) best = { id, was, now }
  }
  if (best) return `${names[best.id] ?? best.id}: ${Math.round(best.was * 100)}% to ${Math.round(best.now * 100)}%`
  const t = cur.tech - prev.tech
  return t > 0 ? `${t} more technique ${t === 1 ? 'exercise' : 'exercises'} solid` : null
}
