import { barQ, beatQ, type Bar } from './song'

export type Metro = 'off' | 'beat' | 'eighths'
export const METROS: Metro[] = ['off', 'beat', 'eighths']
export interface Tick {
  t: number // song seconds at 100% tempo
  kind: 'down' | 'beat' | 'sub'
}


/** Beats in a bar, how many seconds each lasts, and where the first one falls (a pickup's beats count back from its end, so half a beat of pickup is an off-beat). The bar's own t0..t1 is the truth, so tempo changes come free. */
export function grid(b: Bar) {
  const q = beatQ(b)
  const count = Math.max(1, Math.ceil(barQ(b) / q - 1e-6))
  const dt = ((b.t1 - b.t0) / barQ(b)) * q
  return { count, dt, subs: Math.max(1, Math.round(q * 2)), at: b.ql ? b.t1 - count * dt : b.t0 }
}

/** The clicks with a <= t < z, in order: accent on a full bar's first beat, with the eighths between beats when asked (three to a dotted-quarter beat). A pickup bar has no downbeat. */
export function ticks(bars: Bar[], a: number, z: number, eighths: boolean): Tick[] {
  const out: Tick[] = []
  for (const b of bars) {
    if (b.t1 <= a) continue
    if (b.t0 >= z) break
    const { count, dt, subs, at } = grid(b)
    for (let k = 0; k < count; k++) {
      for (let j = 0; j < (eighths ? subs : 1); j++) {
        const t = at + k * dt + (j * dt) / subs
        if (t >= Math.max(a, b.t0) - 1e-9 && t < z - 1e-9) out.push({ t, kind: j ? 'sub' : k === 0 && !b.ql ? 'down' : 'beat' })
      }
    }
  }
  return out
}

/** Which beat of its bar song time `t` is in (0-based), and how many beats the bar has. Null outside the song. */
export function beatAt(bars: Bar[], t: number): { k: number; n: number } | null {
  const b = bars.find((x) => x.t1 > t)
  if (!b || t < b.t0) return null
  const { count, dt, at } = grid(b)
  return { k: Math.min(count - 1, Math.floor((t - at) / dt + 1e-9)), n: count }
}
