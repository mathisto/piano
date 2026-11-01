// Help for a new learner: the first-week card on Today, and the "connect your keyboard" line (the Help sheet's text is in ui-sheets.ts).
import './guide.css'
import { icon } from './icons'
import { native } from './native-midi'
import { settings } from './settings'

export type Go = 'read' | 'scale' | 'theory' | 'sight' | 'tech' | 'mem' | 'progress'
export interface Step {
  n: number
  key: string // the plan record that ticks it ('mem' and 'progress' are kept here, not in the plan)
  title: string
  sub: string
  go: Go
}

/** Seven days from the app's real features. Order is a suggestion; nothing is locked. */
export const STEPS: Step[] = [
  { n: 1, key: 'read', title: 'Set up, then Read: Treble landmarks', sub: 'Check Set up in Settings, then meet three anchor notes: middle C, the G line, high C.', go: 'read' },
  { n: 2, key: 'scale', title: 'Scales: C major, right hand', sub: 'The numbers on the staff are the fingers.', go: 'scale' },
  { n: 3, key: 'theory', title: 'Theory: triads on the white keys', sub: 'Play the chord each card names.', go: 'theory' },
  { n: 4, key: 'sight', title: 'Read through an easy piece', sub: 'One pass without stopping.', go: 'sight' },
  { n: 5, key: 'warm', title: 'Technique: five-finger, even touch', sub: 'Five notes, each as loud as the last.', go: 'tech' },
  { n: 6, key: 'mem', title: 'Memorise a short piece', sub: 'The score fades bar by bar.', go: 'mem' },
  { n: 7, key: 'progress', title: 'Review, and look at Progress', sub: 'See what you practised this week.', go: 'progress' },
]

export type RowState = 'done' | 'skipped' | 'now' | 'late' | 'later'
export interface Guide {
  day: number // 1..7: which day's step is today's
  rows: { step: Step; state: RowState }[]
}

/** Local day number of a 'YYYY-MM-DD' key (same scale as dayNum in drill.ts). */
export const dayOfKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000)
}

/** The first week as of `today`, or null: before it starts, after day 8, or once every day is done or skipped. */
export function guideDay(first: number, today: number, done: Iterable<string>, skipped: number[] = []): Guide | null {
  const day = Math.max(1, today - first + 1)
  if (day > 8) return null
  const d = new Set(done)
  const now = Math.min(day, 7)
  const rows = STEPS.map((step) => ({ step, state: (d.has(step.key) ? 'done' : skipped.includes(step.n) ? 'skipped' : step.n > now ? 'later' : step.n === now ? 'now' : 'late') as RowState }))
  return rows.every((r) => r.state === 'done' || r.state === 'skipped') ? null : { day: now, rows }
}

// ---------- what is remembered on this device ----------

interface State {
  first?: number // the local day number of first use
  off?: boolean // hidden by the player
  skip: number[]
  did: string[] // 'progress': Progress was opened
}
const KEY = 'piano.guide'

export function guideState(): State {
  try {
    return { skip: [], did: [], ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return { skip: [], did: [] }
  }
}
export function guideSave(patch: Partial<State>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...guideState(), ...patch }))
  } catch {
    /* private mode: the card comes back next visit */
  }
}
/** Progress was opened: the last day's step. */
export const guideDid = (k: string) => {
  const s = guideState()
  if (!s.did.includes(k)) guideSave({ did: [...s.did, k] })
}

/** The day of first use: the stored one, else the earliest practice day (so an existing player is past day 8), else today. */
export function firstUse(days: Record<string, number>, today: number, stored?: number): number {
  if (stored !== undefined) return stored
  const past = Object.keys(days).map(dayOfKey)
  return Math.min(today, ...past)
}

export function guideCard(g: Guide): string {
  const rows = g.rows
    .map(({ step: s, state }) => {
      const lead = state === 'done' ? icon('check') : `<span class="gn">${s.n}</span>`
      // the day's step is the lamp of Today while it is undone (next.ts); every other step can be started too, a later one included: nothing is locked
      const act =
        state === 'done' ? ''
        : state === 'skipped' ? '<span class="gsk">Skipped</span>'
        : `<button class="btn${state === 'now' ? ' primary' : ' ghost'}" data-today="guide" data-go="${s.go}" data-by="guide">${icon('play')}Start</button>${state === 'later' ? '' : `<button class="link" data-guide="skip" data-n="${s.n}">Skip</button>`}`
      return `<li class="gstep ${state}"><span class="plead">${lead}</span><div class="pwho"><b>${s.title}</b>${state === 'now' || state === 'late' ? `<span>${s.sub}</span>` : ''}</div><div class="gact">${act}</div></li>`
    })
    .join('')
  return `<section class="tcard guide" aria-label="Start here">
    <header><div><h2>Start here</h2><p>Day ${g.day} of 7, in any order.</p></div><button class="btn ghost" data-guide="hide">Hide</button></header>
    <ol>${rows}</ol></section>`
}

/** The one instruction for the no-keyboard state, wherever it is said. */
export const PLUG = native ? 'Plug in a USB keyboard, or tap the keyboard button at the top right to connect over Bluetooth.' : 'Plug in a USB keyboard and switch it on, then choose Connect.'

/** Shown while no MIDI keyboard is connected, with the switch for the on-screen keys (app/osk-ui.ts); banner.ts hides it when one is and shows it again if it goes. */
export const keyboardLine = (connected: boolean) =>
  `<div class="kbline"${connected ? ' hidden' : ''}><span><b>No keyboard.</b> ${PLUG} Or play the on-screen keys${globalThis.matchMedia?.('(pointer: coarse)').matches ? '' : ', or the computer keys <kbd>A</kbd> to <kbd>;</kbd>'}.</span><span class="row-actions"><label class="switch"><input type="checkbox" data-osk-sw${(settings.osk ?? !connected) ? ' checked' : ''}><i></i>On-screen keys</label><button class="btn" data-connect>Connect</button></span></div>`
