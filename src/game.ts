import * as audio from './audio'
import { Pace } from './pace'
import { Quiet } from './quiet'
import { evenness, judged, type Evenness } from './even'
import { DEFAULT_EDGES, velStats, type TouchStats } from './touch'
import { Judge, type Ev, type Grade, type HoldGrade, type VelGrade } from './judge'
import { settings } from './settings'
import { barAt, type Note, type Song } from './song'

export type Mode = 'perform' | 'learn' | 'read'
export type Phase = 'ready' | 'countin' | 'playing' | 'waiting' | 'paused' | 'done'
export type HandMode = 'play' | 'listen' | 'hide'

export interface Result {
  score: number
  acc: number
  grade: string
  counts: Record<Grade, number>
  maxCombo: number
  touch: TouchStats // key velocities of the notes you struck
  even: Evenness | null // how even the loudness was, when there was a line long enough to judge
  dyn?: string // the technique exercise's dynamics, when it was one
  clean: boolean // no misses and at most one wrong note
  touchPct: number // share of notes with a velocity target struck inside it; -1 when there were none
  holds: number // share of held notes released on time, 0..1; -1 when not graded
  wrong: number
  offs: number[]
  heat: number[]
  total: number
  mode: Mode
  rate: number
}

export type GameEvent =
  | { type: 'hit'; note: Note; grade: Grade; off: number; combo: number; mult: number; vel?: VelGrade; v: number }
  | { type: 'ok'; note: Note; rt: number; clean: boolean; vel?: VelGrade; v: number } // rt: ms the song waited on this card (0 if you were ahead)
  | { type: 'miss'; note: Note }
  | { type: 'wrong'; p: number }
  | { type: 'milestone'; combo: number }
  | { type: 'press'; p: number; vel: number; t: number } // a key went down; t is song time
  | { type: 'release'; p: number }
  | { type: 'hold'; note: Note; grade: HoldGrade; f: number } // a key came up; how it compared with the written length
  | { type: 'auto'; note: Note }
  | { type: 'phase'; phase: Phase }
  | { type: 'loop'; clean: boolean }
  | { type: 'short' } // a key came up before its note had been held long enough to move on
  | { type: 'tempo'; rate: number } // the pace followed the player
  | { type: 'pass'; heat: number[] } // a stretch of practice ended; commit its trouble spots
  | { type: 'done'; result: Result }

const COUNT_IN = 4
const HOLD = { easy: 'off', standard: 'lenient', strict: 'strict' } as const
const EASE = { easy: 1.3, standard: 1, strict: 0.75 } // timing windows by strictness
const READ_LEAD = 0.4 // a reading drill is a staff, not a highway: the first card is wanted almost at once
const MILESTONES = [10, 25, 50, 100, 150, 200, 300, 400, 500]

export function letter(acc: number): string {
  return acc >= 0.97 ? 'S' : acc >= 0.9 ? 'A' : acc >= 0.8 ? 'B' : acc >= 0.7 ? 'C' : 'D'
}

export class Game {
  song!: Song
  mode: Mode = 'perform'
  phase: Phase = 'ready'
  t = 0
  rate = 1
  wait = false
  hands: Record<'R' | 'L', HandMode> = { R: 'play', L: 'play' }
  loop: { a: number; b: number } | null = null
  judge!: Judge
  pedal = false // sustain pedal is down
  held = new Map<number, number>() // pitches the player holds -> velocity
  autoUntil = new Map<number, number>() // pitches the app is playing for you -> perf ms
  heat: number[] = []
  offs: number[] = []
  showNotes = false // reading drills hide the falling notes and key names unless asked
  showNames = false
  holdAdvance = false // Learn: after the notes are struck the song waits until they have been held for their written length
  private hold?: { idx: number[]; until: number }
  hidePlayed = false // Learn: notes leave the staff as they are played, so you must read ahead
  private listeners: ((e: GameEvent) => void)[] = []
  private anchorPerf = 0
  private anchorT = 0
  private autoI = 0
  private nextClick = 0
  private stallAt = 0
  private stallBar = 0
  private lastPerf = 0
  private wrongMark = 0
  readonly pace = new Pace()
  readonly quiet = new Quiet() // goes quiet on judgement words once the playing is clean
  known = new Set<number>() // pitches already read well in the Read drills: their names fade from the bars
  autoTempo = true // Learn: loops speed up after clean passes and slow after messy ones

  /** Which panes to show. Reading drills always need the staff. */
  get view(): 'both' | 'sheet' | 'falling' {
    return this.mode === 'read' ? 'both' : settings.view
  }

  on(fn: (e: GameEvent) => void) {
    this.listeners.push(fn)
  }

  private emit(e: GameEvent) {
    for (const fn of this.listeners) fn(e)
  }

  load(song: Song, mode: Mode = 'perform') {
    this.song = song
    this.heat = []
    this.setMode(mode)
  }

  setMode(mode: Mode) {
    this.mode = mode
    if (mode === 'perform') {
      this.rate = 1
      this.wait = false
      this.loop = null
      this.hands = { R: 'play', L: 'play' }
    } else {
      this.wait = true
      if (mode === 'read') {
        this.rate = 1
        this.loop = null
        this.hands = { R: 'play', L: 'play' }
      }
    }
    this.restart()
  }

  private scored = (n: Note) =>
    this.hands[n.h] === 'play' && n.t >= this.t - 0.05 && (!this.loop || (n.t >= this.loop.a && n.t < this.loop.b))

  cfg() {
    const perform = this.mode === 'perform'
    return { rate: this.rate, wait: this.wait, strict: perform, hold: perform ? (this.song.artic === 'staccato' ? 'strict' : this.song.artic === 'legato' && settings.strict === 'easy' ? 'lenient' : HOLD[settings.strict]) : 'off', ease: EASE[settings.strict] }
  }

  /** Back to the start (or the loop start), stopped. */
  restart() {
    this.endPass()
    this.pace.reset()
    this.quiet.reset()
    this.offs = []
    this.held.clear()
    this.seek(this.lead().from)
    this.rescore()
    this.setPhase('ready', true)
  }

  /** The count-in: four beats before the song, two before a loop, none in Read (the card waits for you). */
  private lead(): { from: number; to: number } {
    const spb = this.song.spb
    if (this.loop) return { from: this.loop.a - 2 * spb, to: this.loop.a }
    return this.mode === 'read' ? { from: -READ_LEAD, to: -Infinity } : { from: -COUNT_IN * spb, to: 0 }
  }

  /** Beats of count-in left, 4 down to 1, or 0 when not counting. */
  get count() {
    const { to } = this.lead()
    return this.running() && this.t < to ? Math.min(COUNT_IN, Math.max(1, Math.ceil((to - this.t) / this.song.spb - 1e-6))) : 0
  }

  /** Re-score after a setting change without leaving the song. */
  private rescore() {
    this.judge = new Judge(this.song.notes, this.cfg(), this.scored)
    this.wrongMark = 0
    this.autoI = this.song.notes.findIndex((n) => n.t >= this.t)
    if (this.autoI < 0) this.autoI = this.song.notes.length
  }

  /** Hand the trouble bars from this pass to whoever saves them, then start a fresh tally. */
  endPass() {
    if (this.heat.some((h) => h > 0)) this.emit({ type: 'pass', heat: this.heat.slice() })
    this.heat = []
  }

  private setPhase(p: Phase, force = false) {
    if (this.phase === p && !force) return
    if (p !== 'waiting') this.hold = undefined
    this.phase = p
    this.emit({ type: 'phase', phase: p })
  }

  private running() {
    return this.phase === 'countin' || this.phase === 'playing'
  }

  private anchor(perf: number) {
    this.anchorPerf = perf
    this.anchorT = this.t
  }

  private tAt(perf: number) {
    return this.running() ? this.anchorT + ((perf - this.anchorPerf) / 1000) * this.rate : this.t
  }

  seek(t: number) {
    this.t = t
    this.anchor(performance.now())
    this.nextClick = Math.ceil((t - 1e-6) / this.song.spb)
  }

  /** Jump while playing or paused (the scrubber): everything before `t` stops counting. */
  jump(t: number) {
    this.seek(t)
    this.rescore()
    if (this.phase === 'waiting') this.setPhase('playing')
  }

  private sync() {
    const now = performance.now()
    if (this.running()) this.t = this.tAt(now)
    this.anchor(now)
  }

  /** Play, or pause, or restart after a finish. */
  toggle() {
    audio.unlock()
    if (this.phase === 'done') this.restart()
    if (this.phase === 'ready' || this.phase === 'paused') {
      this.lastPerf = performance.now()
      this.anchor(this.lastPerf)
      this.setPhase(this.t < this.lead().to ? 'countin' : 'playing')
    } else {
      this.setPhase('paused')
    }
  }

  setRate(r: number) {
    this.sync()
    this.rate = Math.min(1.25, Math.max(0.25, r))
    this.judge.cfg.rate = this.rate
  }

  setWait(on: boolean) {
    this.wait = on
    this.judge.cfg.wait = on
    if (!on && this.phase === 'waiting') {
      this.sync()
      this.setPhase('playing')
    }
  }

  setHand(h: 'R' | 'L', m: HandMode) {
    this.hands[h] = m
    this.rescore()
  }

  setLoop(l: { a: number; b: number } | null) {
    this.loop = l
    this.pace.reset()
    if (l) this.seek(this.lead().from)
    this.rescore()
    if (this.phase === 'waiting') this.setPhase('playing')
  }

  /** Called every animation frame. */
  frame(perf: number) {
    this.lastPerf = perf
    const dt = this.running() ? ((perf - this.anchorPerf) / 1000) * this.rate : 0
    if (this.running()) this.t = this.anchorT + dt
    for (const [p, until] of this.autoUntil) if (until < perf) this.autoUntil.delete(p)
    if (!this.running() && this.phase !== 'waiting') return
    if (this.hold && perf >= this.hold.until) {
      this.hold = undefined
      this.anchor(perf)
      this.setPhase('playing')
    }

    const lead = this.lead()
    const spb = this.song.spb
    const look = 0.1 * this.rate // beats go to the audio clock a tenth of a second early, so a click is not late by up to a frame
    while (this.nextClick * spb <= this.t + look && this.nextClick * spb < lead.to - 1e-6) {
      const at = this.nextClick * spb
      audio.click(at <= lead.from + 1e-6, Math.max(0, (at - this.t) / this.rate))
      this.nextClick++
    }
    if (this.phase === 'countin' && this.t >= lead.to) this.setPhase('playing')

    // listen-hand notes play themselves
    while (this.autoI < this.song.notes.length && this.song.notes[this.autoI].t <= this.t) {
      const n = this.song.notes[this.autoI++]
      if (this.hands[n.h] !== 'listen') continue
      audio.noteOn(n.p, n.v, true) // Listen always sounds: the app is the one playing this hand
      const ms = (n.d / this.rate) * 1000
      this.autoUntil.set(n.p, perf + ms)
      setTimeout(() => audio.noteOff(n.p), ms)
      this.emit({ type: 'auto', note: n })
    }

    if (this.phase === 'playing') {
      this.dispatch(this.judge.tick(this.t))
      if (this.wait) {
        const req = this.judge.required(this.t)
        if (req.length) {
          const n = this.song.notes[req[0]]
          this.t = Math.min(this.t, n.t)
          this.stallAt = perf
          this.stallBar = n.bar
          this.setPhase('waiting')
          return
        }
      }
      if (this.loop && this.t >= this.loop.b) {
        const j = this.judge
        const clean = j.total > 0 && j.counts.miss === 0 && j.wrong <= 1
        this.endPass()
        this.seek(this.lead().from)
        this.rescore()
        this.emit({ type: 'loop', clean })
        const next = this.mode === 'learn' && this.autoTempo ? this.pace.pass(clean, this.rate) : undefined
        if (next !== undefined) {
          this.setRate(next)
          this.emit({ type: 'tempo', rate: next })
        }
        return
      }
      const last = this.song.notes[this.song.notes.length - 1]
      if (!this.loop && this.t > (last ? last.t + last.d : 0) + 0.5) this.finish()
    }
  }

  private finish() {
    const j = this.judge
    const result: Result = {
      score: j.score,
      acc: j.accuracy,
      grade: letter(j.accuracy),
      counts: { ...j.counts },
      maxCombo: j.maxCombo,
      touch: velStats(j.samples(), settings.edges),
      even: settings.coach === 'off' || this.mode === 'read' || !judged(this.song.id, this.song.dyn) ? null : evenness(j.samples(), settings.edges ?? DEFAULT_EDGES, settings.coach),
      touchPct: j.touchPct,
      clean: j.counts.miss === 0 && j.wrong <= 1,
      dyn: this.song.dyn,
      holds: j.cfg.hold && j.cfg.hold !== 'off' ? j.holdPct : -1,
      wrong: j.wrong,
      offs: this.offs.slice(),
      heat: this.heat.slice(),
      total: j.total,
      mode: this.mode,
      rate: this.rate,
    }
    this.heat = []
    this.setPhase('done')
    this.emit({ type: 'done', result })
  }

  private bump(bar: number, w: number) {
    this.heat[bar] = (this.heat[bar] ?? 0) + w
  }

  private dispatch(evs: Ev[]) {
    for (const e of evs) {
      if (e.k === 'hit') {
        const note = this.song.notes[e.i]
        this.offs.push(e.off)
        this.quiet.note((e.grade === 'perfect' || e.grade === 'great') && e.vel !== 'low' && e.vel !== 'high')
        this.emit({ type: 'hit', note, grade: e.grade, off: e.off, combo: e.combo, mult: e.mult, vel: e.vel, v: this.judge.velAt(e.i) })
        if (MILESTONES.includes(e.combo)) this.emit({ type: 'milestone', combo: e.combo })
      } else if (e.k === 'ok') {
        const clean = this.judge.wrong === this.wrongMark
        this.wrongMark = this.judge.wrong
        const rt = this.phase === 'waiting' ? performance.now() - this.stallAt : 0
        this.quiet.note(clean && e.vel !== 'low' && e.vel !== 'high')
        this.emit({ type: 'ok', note: this.song.notes[e.i], rt, clean, vel: e.vel, v: this.judge.velAt(e.i) })
      } else if (e.k === 'hold') {
        this.emit({ type: 'hold', note: this.song.notes[e.i], grade: e.grade, f: e.f })
      } else if (e.k === 'miss') {
        const note = this.song.notes[e.i]
        this.quiet.note(false)
        this.bump(note.bar, 1)
        this.emit({ type: 'miss', note })
      } else {
        this.bump(this.phase === 'waiting' ? this.stallBar : barAt(this.song.bars, Math.max(0, this.t)), 0.5)
        this.quiet.note(false)
        this.emit({ type: 'wrong', p: e.p })
      }
    }
  }

  /** A note-on from the keyboard. `ts` is the MIDI event's performance.now() timestamp. */
  press(p: number, vel: number, ts: number, virtual = false) {
    this.held.set(p, vel)
    if (settings.sound || virtual) audio.noteOn(p, vel, true) // the screen and computer keys have no speaker of their own
    const live = this.running() || this.phase === 'waiting'
    const t = live ? this.tAt(ts) - (settings.offset / 1000) * this.rate : this.t
    this.emit({ type: 'press', p, vel, t: this.phase === 'waiting' ? this.t : t })
    if (!live) return
    this.dispatch(this.judge.press(p, this.phase === 'waiting' ? this.t : t, virtual ? 0 : vel))
    if (this.phase === 'waiting') {
      if (!this.judge.required(this.t).length) {
        if (this.holdAdvance && this.mode === 'learn') {
          const idx = this.judge.cluster(this.t)
          const d = Math.max(0, ...idx.map((i) => this.song.notes[i].d))
          this.hold = { idx, until: performance.now() + Math.min(4000, ((d * 0.8) / this.rate) * 1000) }
          return
        }
        if (this.lastPerf - this.stallAt > 2500) this.bump(this.stallBar, 1)
        this.anchor(performance.now())
        this.setPhase('playing')
      }
    }
  }

  release(p: number, ts: number, virtual = false) {
    this.held.delete(p)
    if (settings.sound || virtual) audio.noteOff(p)
    this.emit({ type: 'release', p })
    if (this.hold && performance.now() < this.hold.until && this.hold.idx.some((i) => this.song.notes[i].p === p)) {
      this.judge.reopen(this.hold.idx)
      this.hold = undefined
      this.emit({ type: 'short' })
    }
    if (this.running()) this.dispatch(this.judge.release(p, this.tAt(ts) - (settings.offset / 1000) * this.rate, this.pedal))
  }

  sustain(down: boolean) {
    this.pedal = down
  }
}
