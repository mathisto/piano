// Evidence across the three takes the app keeps. Lazy with take-ui, never part of boot.
import { KEEP, type Take } from './take'
import type { Song } from './song'

export function repeatedTiming(song: Pick<Song, 'notes' | 'bars'>, takes: Take[]): string | undefined {
  const recent = takes.filter((k) => k.n === song.notes.length && !k.wait).slice(0, KEEP)
  if (recent.length < 2) return undefined
  const seen = new Map<string, { bar: number; late: boolean; n: number; size: number }>()
  for (const k of recent) {
    const by = song.bars.map(() => [] as number[])
    k.i.forEach((i, j) => i >= 0 && by[song.notes[i].bar].push((k.t[j] - song.notes[i].t * 1000) / k.rate))
    by.forEach((xs, bar) => {
      if (!xs.length) return
      const mean = xs.reduce((a, b) => a + b, 0) / xs.length
      if (Math.abs(mean) < 30) return
      const key = `${bar}:${mean > 0}`
      const old = seen.get(key)
      seen.set(key, { bar, late: mean > 0, n: (old?.n ?? 0) + 1, size: (old?.size ?? 0) + Math.abs(mean) })
    })
  }
  const hit = [...seen.values()].filter((x) => x.n >= 2).sort((a, b) => b.n - a.n || b.size / b.n - a.size / a.n || a.bar - b.bar)[0]
  if (!hit) return undefined
  return `Bar ${hit.bar + 1} was ${hit.late ? 'late' : 'early'} in ${hit.n === recent.length ? `all ${recent.length}` : `${hit.n} of your ${recent.length}`} recent runs.`
}
