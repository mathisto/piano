import type { Game } from './game'
import { grid } from './metronome'
import { settings } from './settings'
import type { Bar } from './song'

/** The silent pulse (Settings > Pulse; docs/changes/beatpulse.md): the metronome's beat seen, not heard. A beat is read from its
 * approach (a bouncing ball times nearly as well as a click, a flash far worse: Hove et al. 2013), so it swells into the beat, peaks on
 * it and fades after. Ink, never the lamp. Three looks on trial, one to keep. */
export type Pulse = 'off' | 'staff' | 'edge' | 'lines'

const RISE = 0.45 // beats of swell into a beat, easing in as a fall speeds up
const FALL = 0.25 // beats of fade after it
const BEAT = 0.6 // a beat's strength against a full bar's downbeat

/** How strongly a beat shows `d` beats before it (d > 0) or after it (d < 0), 0..1. */
export const swell = (d: number) => (d >= 0 ? (d < RISE ? (1 - d / RISE) ** 2 : 0) : -d < FALL ? (1 + d / FALL) ** 2 : 0)

/** Where song time `t` sits between beats: `d0` beats since the last one and `d1` to the next (in this bar's beats), and their strengths (1 on a full bar's downbeat, else BEAT). Null outside the song. */
export function between(bars: Bar[], t: number) {
  const i = bars.findIndex((x) => x.t1 > t)
  const b = bars[i]
  if (!b || t < b.t0) return null
  const { count, dt, at } = grid(b)
  const k = Math.max(0, Math.floor((t - at) / dt + 1e-9))
  const last = k + 1 >= count // the next beat is the next bar's first
  const next = bars[i + 1]
  return { d0: (t - at) / dt - k, d1: ((last ? b.t1 : at + (k + 1) * dt) - t) / dt, w0: k === 0 && !b.ql ? 1 : BEAT, w1: last && next && !next.ql ? 1 : BEAT }
}

/** The pulse's strength at song time `t`, 0..1: the beat behind fading, the beat ahead swelling. */
export function pulse(bars: Bar[], t: number) {
  const p = between(bars, t)
  return p ? Math.max(swell(-p.d0) * p.w0, swell(p.d1) * p.w1) : 0
}

/** The look to draw now: what Settings > Pulse says while the metronome keeps time and the song moves (not while Wait for me holds it, nor in a count-in, which has its numerals). */
export const look = (g: Game): Pulse =>
  g.phase === 'playing' && (settings.metro !== 'off' || g.paced) && (g.mode !== 'read' || g.paced) && !g.calib ? settings.pulse : 'off'
