// Theory: the trainers, ear and rhythm cards, played on the keyboard.
import { record, type Stats } from '../drill'
import { type EarRun, earNote, earTap, earView, newEar, playCard, stopEar } from '../ear-play'
import { isPulse } from '../pulse'
import { playPulse, pulseTap } from '../pulse-play'
import * as store from '../store'
import { check as checkAnswer, deal as dealTheory, deckOf, type Trainer, TRAINERS, untimed } from '../theory'
import { $, type TheoryRunView, theoryView } from '../ui'
import { dayKey } from '../week'
import { median } from './state'
import { practised } from './stage'

interface TheoryRun extends Omit<TheoryRunView, 'missed' | 'medianMs'> {
  level: number
  at: number
  rts: number[]
  missed: Set<string>
  buf: number[]
  timer: number
  ears: EarRun
}
let theory: TheoryRun | undefined
export const currentTheory = () => theory // e2e: the Theory session in progress, to answer its cards
let theoryStats: Stats = {}
export const theoryLevels = Object.fromEntries(TRAINERS.map((t) => [t.id, 1])) as Record<Trainer, number>

export function showTheory() {
  theoryView($('#theory'), theoryLevels, theory && { ...theory, missed: [...theory.missed], medianMs: median(theory.rts), ear: earView(theory.ears) })
}

export async function startTheory(trainer: Trainer) {
  theoryStats = await store.getTheory()
  const level = theoryLevels[trainer]
  if (theory) stopEar(theory.ears)
  theory = { trainer, level, cards: dealTheory(deckOf(trainer, level), theoryStats, 15), i: 0, step: 0, ok: 0, streak: 0, best: 0, at: performance.now(), rts: [], missed: new Set(), buf: [], timer: 0, ears: newEar() }
  showTheory()
  promptTheory()
}

/** An ear or rhythm card sounds its prompt (the app's own piano and click, whatever the Sound setting); the keyboard is deaf until it ends. After a miss, only the answer is played again. */
function promptTheory(demo = false) {
  const t = theory
  const c = t?.cards[t.i]
  if (!t || !c?.play) return
  t.step = 0
  t.buf = []
  t.at = (c.play.kind === 'pulse' ? playPulse : playCard)(t.ears, c, () => $('#theory').classList.contains('on'), finishTheory, demo)
}

export const theoryOpen = () => $('#theory').classList.contains('on') && !!theory && theory.i < theory.cards.length && !theory.answered

/** A key played on a Theory card: single-note answers are judged at once, chords when the hand has settled. */
export function theoryNote(p: number, ts: number) {
  const t = theory!
  if (ts < t.ears.deaf) return // a prompt is playing
  const c = t.cards[t.i]
  if (c.play?.kind === 'rhythm') return earTap(t.ears, c, ts) // any key is a tap
  if (c.play?.kind === 'pulse') return pulseTap(t.ears, c, ts)
  if (c.play?.kind === 'qa') return earNote(t.ears, p, ts) // the answer is judged when its two bars end
  t.buf.push(p)
  const step = c.steps[t.step]
  clearTimeout(t.timer)
  if (t.buf.length >= step.pcs.length) judgeTheory()
  else t.timer = window.setTimeout(judgeTheory, 600)
}

function judgeTheory() {
  const t = theory
  if (!t || t.answered) return
  clearTimeout(t.timer)
  const c = t.cards[t.i]
  const ok = checkAnswer(c.steps[t.step], t.buf)
  t.buf = []
  if (ok && t.step + 1 < c.steps.length) {
    t.step++
    return showTheory()
  }
  finishTheory(ok, performance.now() - t.at)
}

function finishTheory(ok: boolean, rt: number) {
  const t = theory
  if (!t || t.answered) return
  const c = t.cards[t.i]
  record(theoryStats, c.id, ok, rt)
  practised(Math.min(30, rt / 1000)) // Theory has no song on the stage, so its time is counted here
  void store.saveTheory(theoryStats)
  t.rts.push(rt)
  t.answered = ok ? 'ok' : 'miss'
  if (ok) {
    t.ok++
    t.streak++
    t.best = Math.max(t.best, t.streak)
    setTimeout(() => theory === t && nextTheory(), c.play ? 1200 : 700) // not if Stop or another trainer came first
  } else {
    t.streak = 0
    t.missed.add(c.name ?? c.prompt)
    promptTheory(true)
  }
  showTheory()
}

function nextTheory() {
  const t = theory
  if (!t) return
  t.i++
  t.step = 0
  t.answered = undefined
  t.at = performance.now()
  if (t.i === t.cards.length) void store.markPlan(dayKey(), 'theory')
  if (t.i === t.cards.length) void store.logHistory({ ts: Date.now(), kind: 'theory', label: TRAINERS.find((x) => x.id === t.trainer)!.name, acc: t.ok / t.cards.length, ms: untimed(t.trainer) || isPulse(t.trainer) ? undefined : median(t.rts) })
  promptTheory()
  showTheory()
}

$('#theory').addEventListener('change', (e) => {
  const s = e.target as HTMLSelectElement
  if (s.dataset.tlevel) theoryLevels[s.dataset.tlevel as Trainer] = Number(s.value)
})
$('#theory').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button')
  if (!b) return
  if (b.dataset.trainer) void startTheory(b.dataset.trainer as Trainer)
  else if (b.id === 'thNext') nextTheory()
  else if (b.id === 'thReplay' && theory) {
    theory.ears.replays++
    promptTheory()
    showTheory()
  } else if (b.id === 'thMenu') {
    if (theory) stopEar(theory.ears)
    theory = undefined
    showTheory()
  } else if (b.id === 'thAgain' && theory) void startTheory(theory.trainer)
})
