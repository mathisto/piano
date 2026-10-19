import * as audio from './audio'
import { Judge, type Ev, type Grade, type HoldGrade } from './judge'
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
  holds: number // share of held notes released on time, 0..1; -1 when not graded
  wrong: number
  offs: number[]
  heat: number[]
  total: number
  mode: Mode
  rate: number
}

export type GameEvent =
  | { type: 'hit'; note: Note; grade: Grade; off: number; combo: number; mult: number }
  | { type: 'ok'; note: Note; rt: number; clean: boolean } // rt: ms the song waited on this card (0 if you were ahead)
  | { type: 'miss'; note: Note }
  | { type: 'wrong'; p: number }
  | { type: 'milestone'; combo: number }
  | { type: 'press'; p: number; vel: number; t: number } // a key went down; t is song time
  | { type: 'release'; p: number }
  | { type: 'hold'; note: Note; grade: HoldGrade; f: number } // a key came up; how it compared with the written length
  | { type: 'auto'; note: Note }
  | { type: 'phase'; phase: Phase }
  | { type: 'loop' }
  | { type: 'pass'; heat: number[] } // a stretch of practice ended; commit its trouble spots
  | { type: 'done'; result: Result }

const COUNT_IN = 4
const LEAD = 2.5 // song-seconds of empty highway before the first note
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
  private listeners: ((e: GameEvent) => void)[] = []
  private anchorPerf = 0
  private anchorT = 0
  private autoI = 0
  private nextClick = 0
  private stallAt = 0
  private stallBar = 0
  private lastPerf = 0
  private wrongMark = 0

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

  private cfg() {
    return { rate: this.rate, wait: this.wait, strict: this.mode === 'perform', hold: this.mode === 'perform' ? settings.hold : 'off' }
  }

  /** Back to the start (or the loop start), stopped. */
  restart() {
    this.endPass()
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
    return this.mode === 'read' ? { from: -LEAD, to: -Infinity } : { from: -COUNT_IN * spb, to: 0 }
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

    const lead = this.lead()
    const spb = this.song.spb
    while (this.nextClick * spb <= this.t && this.nextClick * spb < lead.to - 1e-6) audio.click(this.nextClick++ * spb <= lead.from + 1e-6)
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
        this.endPass()
        this.seek(this.lead().from)
        this.rescore()
        this.emit({ type: 'loop' })
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
        this.emit({ type: 'hit', note, grade: e.grade, off: e.off, combo: e.combo, mult: e.mult })
        if (MILESTONES.includes(e.combo)) this.emit({ type: 'milestone', combo: e.combo })
      } else if (e.k === 'ok') {
        const clean = this.judge.wrong === this.wrongMark
        this.wrongMark = this.judge.wrong
        const rt = this.phase === 'waiting' ? performance.now() - this.stallAt : 0
        this.emit({ type: 'ok', note: this.song.notes[e.i], rt, clean })
      } else if (e.k === 'hold') {
        this.emit({ type: 'hold', note: this.song.notes[e.i], grade: e.grade, f: e.f })
      } else if (e.k === 'miss') {
        const note = this.song.notes[e.i]
        this.bump(note.bar, 1)
        this.emit({ type: 'miss', note })
      } else {
        this.bump(this.phase === 'waiting' ? this.stallBar : barAt(this.song.bars, Math.max(0, this.t)), 0.5)
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
    this.dispatch(this.judge.press(p, this.phase === 'waiting' ? this.t : t))
    if (this.phase === 'waiting') {
      if (!this.judge.required(this.t).length) {
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
    if (this.running()) this.dispatch(this.judge.release(p, this.tAt(ts) - (settings.offset / 1000) * this.rate, this.pedal))
  }

  sustain(down: boolean) {
    this.pedal = down
  }
}
