import * as audio from './audio'
import { RHYTHM } from './ear'
import { type EarRun, schedule } from './ear-play'
import { settings } from './settings'
import { endBeat, openBeat, pulseText, scorePulse, type PulsePlay } from './pulse'
import type { TCard } from './theory'
import './pulse.css'

const DEMO = 8 // beats: after a miss the click and the answer are played again, up to here (the count-in bar and the first tap bar)

/** Sound a pulse card: a quarter-note click, always through the app's own click (force), and after a miss the answer clapped on it. Returns when the player may tap. A keep the beat card has no demo: its answer is the text. */
export function playPulse(e: EarRun, c: TCard, open: () => boolean, finish: (ok: boolean, rt: number) => void, demo = false): number {
  audio.unlock()
  const p = c.play as PulsePlay
  const B = 60000 / p.bpm
  const t = performance.now() + 250
  e.taps = []
  e.finish = finish
  e.t0 = t
  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__ear = { e, c }
  const evs: { at: number; fn: (after: number) => void }[] = []
  if (demo && p.mode !== 'keep') {
    for (const b of p.clicks) if (b < DEMO) evs.push({ at: t + b * B, fn: (a) => audio.click(b % 4 === 0, a, true) })
    for (const b of p.want) if (b < DEMO) evs.push({ at: t + b * B, fn: (a) => audio.clap(a) })
  } else if (!demo) for (const b of p.clicks) evs.push({ at: t + b * B, fn: (a) => audio.click(b % 4 === 0, a, true) })
  schedule(e, evs, open)
  if (demo) return (e.deaf = Infinity)
  e.judge = window.setTimeout(() => judge(e, c), t + endBeat(p) * B - performance.now())
  return (e.deaf = t + openBeat(p) * B)
}

/** A key pressed on a pulse card is a tap, any key; the keys of one chord are one tap. Keep the beat is judged when its last click has sounded; the others a moment after the last wanted tap. */
export function pulseTap(e: EarRun, c: TCard, ts: number) {
  ts -= settings.offset // as in earTap
  if (ts - (e.taps[e.taps.length - 1] ?? -1e9) < RHYTHM.merge) return
  e.taps.push(ts)
  const p = c.play as PulsePlay
  if (p.mode === 'keep') return
  if (e.taps.length > p.want.length) judge(e, c)
  else if (e.taps.length === p.want.length) {
    clearTimeout(e.judge)
    e.judge = window.setTimeout(() => judge(e, c), RHYTHM.grace)
  }
}

function judge(e: EarRun, c: TCard) {
  clearTimeout(e.judge)
  if (e.deaf === Infinity) return
  e.deaf = Infinity
  const p = c.play as PulsePlay
  const r = scorePulse(p, e.taps.map((t) => t - e.t0))
  if (!r.note) {
    e.bias.push(r.bias)
    e.spread.push(r.spread)
    if (r.drift !== undefined) e.drift.push(r.drift)
  }
  e.last = pulseText(r)
  e.finish?.(r.ok, r.spread)
}
