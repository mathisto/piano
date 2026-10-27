import type { Bar } from './song'

export type Metro = 'off' | 'beat' | 'eighths'
export const METROS: Metro[] = ['off', 'beat', 'eighths']
export interface Tick {
  t: number // song seconds at 100% tempo
  kind: 'down' | 'beat' | 'sub'
}

/** A beat in quarters: the denominator's note, but a dotted quarter in 6/8, 9/8 and 12/8. */
const beatQ = (b: Bar) => (b.den === 8 && b.n % 3 === 0 && b.n > 3 ? 1.5 : 4 / b.den)
const barQ = (b: Bar) => b.ql ?? (b.n * 4) / b.den

/** Beats in a bar and how many seconds each lasts. The bar's own t0..t1 is the truth, so tempo changes come free. */
function grid(b: Bar) {
  const q = beatQ(b)
  return { count: Math.max(1, Math.ceil(barQ(b) / q - 1e-6)), dt: ((b.t1 - b.t0) / barQ(b)) * q, subs: Math.max(1, Math.round(q * 2)) }
}

/** The clicks with a <= t < z, in order: accent on a full bar's first beat, with the eighths between beats when asked (three to a dotted-quarter beat). A pickup bar has no downbeat. */
export function ticks(bars: Bar[], a: number, z: number, eighths: boolean): Tick[] {
  const out: Tick[] = []
  for (const b of bars) {
    if (b.t1 <= a) continue
    if (b.t0 >= z) break
    const { count, dt, subs } = grid(b)
    for (let k = 0; k < count; k++) {
      for (let j = 0; j < (eighths ? subs : 1); j++) {
        const t = b.t0 + k * dt + (j * dt) / subs
        if (t >= a - 1e-9 && t < z - 1e-9) out.push({ t, kind: j ? 'sub' : k === 0 && !b.ql ? 'down' : 'beat' })
      }
    }
  }
  return out
}

/** Which beat of its bar song time `t` is in (0-based), and how many beats the bar has. Null outside the song. */
export function beatAt(bars: Bar[], t: number): { k: number; n: number } | null {
  const b = bars.find((x) => x.t1 > t)
  if (!b || t < b.t0) return null
  const { count, dt } = grid(b)
  return { k: Math.min(count - 1, Math.floor((t - b.t0) / dt + 1e-9)), n: count }
}
