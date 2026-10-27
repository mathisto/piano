import { RHYTHM, biasText, rhythmCards, scoreAt, type TapScore } from './ear'
import type { TCard } from './theory'
import { mean, plural } from './util'

/** Pulse trainers: tap a steady beat, the subdivisions of one, or a written rhythm, on any key, against a quarter-note click. Pure scheduling and scoring; the sound is in pulse-play.ts. Time is in quarter-note beats from the start of the card. */
export const PULSE_IDS = ['keepbeat', 'subdiv', 'holdrhythm'] as const
export type PulseId = (typeof PULSE_IDS)[number]
export const isPulse = (t: string): t is PulseId => (PULSE_IDS as readonly string[]).includes(t)

export interface PulseBar {
  label: string
  marks: number[] // beats into the bar, 0 to 4
  silent?: boolean // no click in this bar: the beat is the player's to keep
  aria?: string
}
export interface PulsePlay {
  kind: 'pulse'
  mode: 'keep' | 'sub' | 'hold'
  bpm: number
  clicks: number[] // beats that carry a click
  want: number[] // beats the player should tap, in order
  ask: string
  bars: PulseBar[] // the card drawn as bars
}

/** Tunables. Keep the beat: no tap in the silent bars may be further than `window` ms from the true grid (the bias is not taken out, it is measured), and the drift may not pass `maxDrift` ms a beat; under `steady` ms a beat is called steady. Subdivisions: each tap's window is `frac` of the gap to its nearest neighbour, never more than RHYTHM.window; the player's mean offset is taken out first. */
export const KEEP = { lead: 2, window: 150, maxDrift: 10, steady: 2 }
export const SUB = { frac: 0.35, bars: 2, lead: 1 }
export const SWING = 2 / 3 // swung eighths: the second one sits two thirds of the way through the beat

const range = (a: number, z: number, step: number) => Array.from({ length: Math.floor((z - a) / step) + 1 }, (_, i) => a + i * step)
const upTo = (n: number) => Array.from({ length: n }, (_, i) => i)

// ---- the cards ----
const KINDS = {
  eighths: { word: 'eighths', slots: [0, 0.5] },
  triplets: { word: 'triplets', slots: [0, 1 / 3, 2 / 3] },
  sixteenths: { word: 'sixteenths', slots: [0, 0.25, 0.5, 0.75] },
  swung: { word: 'swung eighths', slots: [0, SWING] },
}
type Kind = keyof typeof KINDS

/** Keep the beat: two bars of click to lock on to, then 1, 2 or 4 silent bars, then the click again. Level 1, 2, 3 is the length of the silence. */
export function keepCards(level: number): TCard[] {
  const silent = [1, 2, 4][level - 1]
  return range(60, 108, 4).map((bpm): TCard => {
    const from = 4 * KEEP.lead
    const back = from + 4 * silent
    const beats = (a: number, z: number) => range(a, z - 1, 1)
    const bar = (label: string, silent?: boolean): PulseBar => ({ label, silent, marks: [0, 1, 2, 3] })
    return {
      id: `pulse:keep:${silent}:${bpm}`,
      prompt: `Keep the beat through ${plural(silent, 'silent bar')}, ${bpm} beats a minute`,
      name: `keep the beat ${plural(silent, 'bar')} at ${bpm}`,
      steps: [],
      show: 'The click is back on the true beat',
      play: {
        kind: 'pulse', mode: 'keep', bpm, clicks: [...beats(0, from), ...beats(back, back + 4)], want: beats(from, back),
        ask: 'Tap the beat on any key with the click. When it stops, keep the same beat going until it comes back.',
        bars: [...upTo(KEEP.lead).map(() => bar('Click')), ...upTo(silent).map(() => bar('Silent', true)), bar('Click')],
      },
    }
  })
}

const onBeats = (slots: number[], bar: number) => upTo(4).flatMap((k) => slots.map((s) => 4 * (SUB.lead + bar) + k + s))

/** Subdivisions against a quarter-note click, after a bar of click alone. Level 1 eighths, 2 triplets, 3 sixteenths, 4 two bars of different kinds, swung eighths among them. */
export function subCards(level: number): TCard[] {
  const plans: { kinds: Kind[]; bpm: number }[] =
    level === 4
      ? (Object.keys(KINDS) as Kind[]).flatMap((a) => (Object.keys(KINDS) as Kind[]).filter((b) => b !== a).flatMap((b) => [56, 64, 72, 80].map((bpm) => ({ kinds: [a, b], bpm }))))
      : (['eighths', 'triplets', 'sixteenths'] as const).slice(level - 1, level).flatMap((k) => (k === 'eighths' ? range(60, 108, 6) : k === 'triplets' ? range(60, 96, 6) : range(52, 76, 4)).map((bpm) => ({ kinds: [k, k], bpm })))
  return plans.map(({ kinds, bpm }): TCard => {
    const words = kinds[0] === kinds[1] ? KINDS[kinds[0]].word : `${KINDS[kinds[0]].word}, then ${KINDS[kinds[1]].word}`
    return {
      id: `pulse:sub:${kinds.join('+')}:${bpm}`,
      prompt: `Tap ${words} on the click, ${bpm} beats a minute`,
      name: `${words} at ${bpm}`,
      steps: [],
      show: 'Here is the bar again, on the click',
      play: {
        kind: 'pulse', mode: 'sub', bpm, clicks: range(0, 4 * (SUB.lead + SUB.bars) - 1, 1), want: kinds.flatMap((k, b) => onBeats(KINDS[k].slots, b)),
        ask: 'The click is the quarter note. After a bar of click alone, tap the subdivision on any key, for two bars.',
        bars: kinds.map((k) => ({ label: KINDS[k].word, marks: onBeats(KINDS[k].slots, 0).map((m) => m - 4 * SUB.lead) })),
      },
    }
  })
}

/** Hold a rhythm: a written bar (the same bars as the rhythm echo, shown instead of played), tapped twice through against the click. */
export function holdCards(level: number): TCard[] {
  return rhythmCards(level).map((c): TCard => {
    const onsets = (c.play as { onsets: number[] }).onsets
    const marks = onsets.map((o) => o / 2)
    const at = (b: number) => marks.map((m) => 4 * (SUB.lead + b) + m)
    return {
      id: `pulse:hold:${onsets.join('')}`,
      prompt: 'Tap this rhythm against the click',
      name: c.name,
      steps: [],
      show: 'Here is the bar again, on the click',
      play: {
        kind: 'pulse', mode: 'hold', bpm: RHYTHM.bpm, clicks: range(0, 4 * (SUB.lead + 2) - 1, 1), want: [...at(0), ...at(1)],
        ask: 'Tap the marks on any key against the click: a bar of click alone, then the rhythm twice through.',
        bars: [{ label: 'Tap here', marks, aria: `Taps on ${marks.map((m) => `${Math.floor(m) + 1}${m % 1 ? ' and' : ''}`).join(', ')}` }],
      },
    }
  })
}

export const pulseDeck = (t: PulseId, level: number) => (t === 'keepbeat' ? keepCards(level) : t === 'subdiv' ? subCards(level) : holdCards(level))

// ---- scoring ----
export interface PulseScore extends TapScore {
  drift?: number // keep the beat: ms a beat, negative is speeding up
}

/** Beats from the start of the card to the end of the card's last sound or tap. */
export const endBeat = (p: PulsePlay) => Math.max(p.clicks[p.clicks.length - 1] + 1, p.want[p.want.length - 1] + 0.5)
/** Beats from the start of the card to when the keyboard opens. A keep the beat card hears taps from the first click. */
export const openBeat = (p: PulsePlay) => (p.mode === 'keep' ? 0 : p.want[0] - 0.5)

/** Score taps (ms from the start of the card). Only taps within half a gap of the wanted ones count. Keep the beat measures the taps against the true grid: bias (the offset on the first silent beat), drift (the slope of the offset over the beats) and spread (what is left around that line). The other two take the mean offset out first. */
export function scorePulse(p: PulsePlay, taps: number[]): PulseScore {
  const B = 60000 / p.bpm
  const at = p.want.map((b) => b * B)
  const gaps = at.slice(1).map((a, i) => a - at[i])
  const h = Math.min(B / 2, Math.min(...gaps) / 2)
  const mine = taps.filter((t) => t >= at[0] - h && t <= at[at.length - 1] + h)
  if (p.mode === 'hold') return scoreAt(at, mine, RHYTHM.window)
  if (p.mode === 'sub') return scoreAt(at, mine, at.map((_, i) => Math.min(RHYTHM.window, SUB.frac * Math.min(gaps[i] ?? Infinity, gaps[i - 1] ?? Infinity))))
  if (mine.length !== at.length) return { ok: false, bias: 0, spread: 0, note: `You tapped ${mine.length} of ${at.length} beats.` }
  const err = mine.map((t, i) => t - at[i])
  const [mx, me] = [mean(p.want), mean(err)]
  const drift = err.reduce((s, e, i) => s + (p.want[i] - mx) * (e - me), 0) / p.want.reduce((s, x) => s + (x - mx) ** 2, 0)
  const rest = err.map((e, i) => e - me - drift * (p.want[i] - mx))
  const spread = Math.sqrt(rest.reduce((s, r) => s + r * r, 0) / Math.max(1, err.length - 2))
  return { ok: err.every((e) => Math.abs(e) <= KEEP.window) && Math.abs(drift) <= KEEP.maxDrift, bias: me + drift * (p.want[0] - mx), spread, drift }
}

/** In plain words: "You sped up by 6 ms a beat. Bias 12 ms late, spread 15 ms." */
export function pulseText(s: PulseScore): string {
  if (s.note) return s.note
  if (s.drift === undefined) return `${s.ok ? '' : 'Too uneven. '}${biasText(s.bias, s.spread)}.`
  const d = Math.round(Math.abs(s.drift))
  const drift = Math.abs(s.drift) < KEEP.steady ? 'You held the beat steady.' : `You ${s.drift < 0 ? 'sped up' : 'slowed down'} by ${d} ms a beat.`
  return `${s.ok ? '' : 'The beat wandered too far. '}${drift} ${biasText(s.bias, s.spread)}.`
}

// ---- the card, as markup ----
/** The card drawn as bars: a dot where a tap is wanted, hollow where the beat is yours to keep. */
export function pulseBars(p: PulsePlay) {
  const bars = p.bars.map((b) => `<figure class="pulse-bar${b.silent ? ' silent' : ''}"><div role="img" aria-label="${b.aria ?? `${b.label}: ${plural(b.marks.length, 'tap')}`}">${b.marks.map((m) => `<b style="--m:${(m / 4).toFixed(4)}"></b>`).join('')}</div><figcaption>${b.label}</figcaption></figure>`).join('')
  return `<div class="pulse${p.mode === 'keep' ? '' : ' wide'}">${bars}</div>`
}
