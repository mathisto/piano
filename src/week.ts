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
  const out = 'MTWTFSS'.split('').map((label, i) => {
    const key = dayKey(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i))
    sec += days[key] ?? 0
    return { key, label, played: (days[key] ?? 0) >= 60, today: key === dayKey(d) }
  })
  return { days: out, minutes: Math.floor(sec / 60) }
}
