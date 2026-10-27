import * as audio from './audio'
import { RHYTHM, beatMs, biasText, scoreTaps, type EarView } from './ear'
import type { TCard } from './theory'
import './ear.css'

/** The sound and the clock of an ear card, and the taps of a rhythm card. One of these per Theory session. */
export interface EarRun {
  replays: number
  deaf: number // performance.now() before which the keyboard is ignored: a prompt is playing
  t0: number // when the player's bar starts, for rhythm
  taps: number[]
  bias: number[] // per rhythm card, the mean offset from the click
  spread: number[]
  last: string // the verdict on the last rhythm
  timer: number
  judge: number
  finish?: (ok: boolean, rt: number) => void
}
export const newEar = (): EarRun => ({ replays: 0, deaf: 0, t0: 0, taps: [], bias: [], spread: [], last: '', timer: 0, judge: 0 })

export function stopEar(e: EarRun) {
  clearInterval(e.timer)
  clearTimeout(e.judge)
}

const LOOK = 30 // ms: an event is handed over this far ahead, and clicks and claps carry their exact moment to the audio clock

/** Run timed events on a 10 ms tick. Stops when the Theory tab is left. */
function schedule(e: EarRun, evs: { at: number; fn: (after: number) => void }[], open: () => boolean) {
  stopEar(e)
  const list = [...evs].sort((a, b) => a.at - b.at)
  e.timer = window.setInterval(() => {
    if (!open()) return stopEar(e)
    const now = performance.now()
    while (list.length && list[0].at <= now + LOOK) {
      const ev = list.shift()!
      ev.fn(Math.max(0, ev.at - now) / 1000)
    }
    if (!list.length) clearInterval(e.timer)
  }, 10)
}

/** Sound the card: always through the app's own piano (force), whatever the Sound setting, because these prompts are the exercise. Returns when the player may answer. A rhythm card plays its bar on a click and then holds a second, silent-but-clicked bar for the taps. */
export function playCard(e: EarRun, c: TCard, open: () => boolean, finish: (ok: boolean, rt: number) => void, demoOnly = false): number {
  audio.unlock()
  const p = c.play!
  const t = performance.now() + 250
  const evs: { at: number; fn: (after: number) => void }[] = []
  e.taps = []
  e.finish = finish
  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__ear = { e, c }
  if (p.kind === 'notes') {
    for (const n of p.ev)
      for (const x of n.p) {
        evs.push({ at: t + n.at, fn: () => audio.noteOn(x, 0.7, true) })
        evs.push({ at: t + n.at + n.dur, fn: () => audio.noteOff(x) })
      }
    schedule(e, evs, open)
    return (e.deaf = t + Math.max(...p.ev.map((n) => n.at + n.dur)) + 250)
  }
  const B = beatMs()
  for (let k = 0; k < (demoOnly ? 4 : 8); k++) evs.push({ at: t + k * B, fn: (a) => audio.click(k % 4 === 0, a, true) })
  for (const o of p.onsets) evs.push({ at: t + (o * B) / 2, fn: (a) => audio.clap(a) })
  schedule(e, evs, open)
  e.t0 = t + 4 * B
  e.deaf = demoOnly ? Infinity : e.t0 - B / 2
  if (!demoOnly) e.judge = window.setTimeout(() => judge(e, c), e.t0 + 4.5 * B - performance.now())
  return e.deaf
}

/** A key pressed on a rhythm card is a tap, any key; the keys of one chord are one tap. The bar is judged a moment after the last tap, or when it ends. */
export function earTap(e: EarRun, c: TCard, ts: number) {
  if (ts - (e.taps[e.taps.length - 1] ?? -1e9) < RHYTHM.merge) return
  e.taps.push(ts)
  const n = (c.play as { onsets: number[] }).onsets.length
  if (e.taps.length > n) judge(e, c)
  else if (e.taps.length === n) {
    clearTimeout(e.judge)
    e.judge = window.setTimeout(() => judge(e, c), RHYTHM.grace)
  }
}

function judge(e: EarRun, c: TCard) {
  clearTimeout(e.judge)
  if (e.deaf === Infinity) return
  e.deaf = Infinity
  const r = scoreTaps((c.play as { onsets: number[] }).onsets, e.taps.map((t) => t - e.t0))
  if (!r.note) {
    e.bias.push(r.bias)
    e.spread.push(r.spread)
  }
  e.last = r.note ?? `${r.ok ? '' : 'Too uneven. '}${biasText(r.bias, r.spread)}.`
  e.finish?.(r.ok, r.spread)
}

const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length

export function earView(e: EarRun): EarView {
  const parts = []
  if (e.spread.length) parts.push(`Over the session: ${biasText(mean(e.bias), mean(e.spread))}. Bias is where your whole bar sat against the click; spread is how uneven the taps were inside it.`)
  if (e.replays) parts.push(`Replays: ${e.replays}.`)
  return { replays: e.replays, last: e.last, summary: parts.join(' ') }
}
