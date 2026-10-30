import { byApp, voiceOf } from './accomp'
import * as audio from './audio'
import { grid, ticks } from './metronome'
import { Pace } from './pace'
import { Quiet } from './quiet'
import { evenness, judged, type Evenness } from './even'
import { pedalLine, pedalReport, type PedalEv } from './pedal'
import { articulation, fixedAt, melodyHand, songLines, timing, voicing, type Artic, type Press, type Timing, type Voicing } from './coach'
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
  timing: Timing | null // spread of the gaps and the lean off the beat, for runs that did not wait
  artic: Artic | null // legato joins or staccato lengths, when the piece asks for one
  voice: Voicing | null // right hand over left, for melody-over-accompaniment and two-hand songs
  fixed?: number // the one velocity every note came in at (Fixed key touch)
  pedal: string | null // the sustain pedal against the chord changes, when the pedal was used
  follow: string[] // a song: how its written dynamics and articulation were followed, at most two lines
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
  | { type: 'hit'; note: Note; grade: Grade; off: number; combo: number; vel?: VelGrade; v: number }
  | { type: 'ok'; note: Note; rt: number; clean: boolean; vel?: VelGrade; v: number } // rt: ms the song waited on this card (0 if you were ahead)
  | { type: 'miss'; note: Note }
  | { type: 'wrong'; p: number }
  | { type: 'press'; p: number; vel: number; t: number } // a key went down; t is song time
  | { type: 'release'; p: number }
  | { type: 'hold'; note: Note; grade: HoldGrade; f: number } // a key came up; how it compared with the written length
  | { type: 'phase'; phase: Phase }
  | { type: 'loop'; clean: boolean }
  | { type: 'short' } // a key came up before its note had been held long enough to move on
  | { type: 'tempo'; rate: number } // the pace followed the player
  | { type: 'pass'; heat: number[] } // a stretch of practice ended; commit its trouble spots
  | { type: 'done'; result: Result }

const HOLD = { easy: 'off', standard: 'lenient', strict: 'strict' } as const
const EASE = { easy: 1.3, standard: 1, strict: 0.75 } // timing windows by strictness
const LOOK = 0.25 // seconds: clicks and the app's notes go to the audio clock this far ahead, so a slow frame cannot make them late
export const CALIBRATION = 'calibration' // the song id of the latency calibration (src/app/calibration.ts)
const CALIBRATION_EASE = 3 // its window is +/-375 ms: a setup 150 ms late must still leave a sample to measure
const PACED_EASE = 1.6 // a reader a beat behind the eyes is late, not wrong: a paced run takes a note within 200 ms of the beat
const READ_LEAD = 0.4 // a reading drill is a staff, not a highway: the first card is wanted almost at once

export function letter(acc: number): string {
  return acc >= 0.97 ? 'S' : acc >= 0.9 ? 'A' : acc >= 0.8 ? 'B' : acc >= 0.7 ? 'C' : 'D'
}

export class Game {
  song!: Song
  mode: Mode = 'perform'
  paced = false // a reading drill kept to a metronome: a count-in, the click, notes judged on the beat, and the run does not wait
  phase: Phase = 'ready'
  t = 0
  rate = 1
  wait = false
  hands: Record<'R' | 'L', HandMode> = { R: 'play', L: 'play' }
  you: Record<'R' | 'L', HandMode> = { R: 'play', L: 'play' } // the start card's 'You play': Perform goes back to it
  parts = new Set<number>() // source parts the app plays for you (Note.part): a song's voice, a duet's other player
  loop: { a: number; b: number } | null = null
  judge!: Judge
  pedal = false // sustain pedal is down
  pedals: PedalEv[] = [] // its changes this run, in song time
  held = new Map<number, number>() // pitches the player holds -> velocity
  autoUntil = new Map<number, [number, number]>() // pitches the app is playing for you -> perf ms from, until
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
  private compI = 0
  private nextClick = 0
  private nextMetro = 0 // song time up to which the metronome has handed clicks to the audio clock
  private stallAt = 0
  private stallBar = 0
  private lastPerf = 0
  private wrongMark = 0
  presses: Press[] = [] // key down and up times of struck notes, for legato and staccato
  private downAt = new Map<number, { i: number; at: number }>()
  readonly pace = new Pace()
  readonly quiet = new Quiet() // goes quiet on judgement words once the playing is clean
  known = new Set<number>() // pitches already read well in the Read drills: their names fade from the bars
  autoTempo = true // Learn: loops speed up after clean passes and slow after messy ones
  ghost: { p: number[]; t: number[]; d: number[]; h: ('R' | 'L')[] } | null = null // Ghost: the last take's keys, drawn faintly on the staff and lanes (src/app/take-ui.ts)

  /** The latency calibration: a wide window, the click on whatever the settings say, and presses taken as they come (offset 0) without touching the saved offset. */
  get calib() {
    return this.song?.id === CALIBRATION
  }

  /** The calibration offset in ms: what presses are corrected by. */
  get offset() {
    return this.calib ? 0 : settings.offset
  }

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

  load(song: Song, mode: Mode = 'perform', paced = false) {
    this.paced = paced
    this.song = song
    this.you = { R: 'play', L: 'play' }
    this.parts = new Set()
    this.heat = []
    this.setMode(mode)
  }

  setMode(mode: Mode) {
    this.mode = mode
    if (mode === 'perform') {
      this.rate = 1
      this.wait = false
      this.loop = null
      this.hands = { ...this.you }
    } else {
      this.wait = true
      if (mode === 'read') {
        this.rate = 1
        this.loop = null
        this.wait = !this.paced
        this.hands = { R: 'play', L: 'play' }
      }
    }
    this.restart()
  }

  /** Play, listen (the app plays it) or hide, for one note: its part first, then its hand. */
  modeOf(n: Note): HandMode {
    return byApp(n, this.parts) ? 'listen' : this.hands[n.h]
  }

  /** You play part of the piece and the app plays the rest at the tempo (it waits only in Learn with Wait on). Kept until the next song. */
  accomp(hands: Record<'R' | 'L', HandMode>, parts: number[]) {
    this.you = { ...hands }
    this.hands = { ...hands }
    this.parts = new Set(parts)
    if (this.song.notes.some((n) => this.modeOf(n) === 'listen' && voiceOf(this.song, n))) void audio.preload('strings') // the app is about to sing
    this.rescore()
  }

  private scored = (n: Note) =>
    this.modeOf(n) === 'play' && n.t >= this.t - 0.05 && (!this.loop || (n.t >= this.loop.a && n.t < this.loop.b))

  cfg() {
    const perform = this.mode === 'perform'
    return { rate: this.rate, wait: this.wait, strict: perform, hold: perform ? (this.song.artic === 'staccato' ? 'strict' : this.song.artic === 'legato' && settings.strict === 'easy' ? 'lenient' : HOLD[settings.strict]) : 'off', ease: this.calib ? CALIBRATION_EASE : this.paced ? PACED_EASE : EASE[settings.strict] }
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

  /** The count-in, from `from` to `to` a click every `dt`, on the beat grid of the bar it leads into (metronome.ts), so a tempo change is counted at the new tempo. Two beats into a loop. Into the song, a bar (two of a two-beat metre) counted back from the first full bar, so a pickup comes in on its own beat, and a bar more when the pickup would leave under half of it. None in Read: the card waits for you. */
  private lead(): { from: number; to: number; dt: number } {
    if (this.mode === 'read' && !this.paced) return { from: -READ_LEAD, to: -Infinity, dt: 1 }
    const bars = this.song.bars
    const to = this.loop ? this.loop.a : 0
    const b = this.loop ? bars[barAt(bars, to)] : (bars.find((x) => !x.ql) ?? bars[0])
    const { count, dt } = grid(b)
    const n = (this.loop ? 2 : count < 3 ? 2 * count : count) * dt
    const from = (b.ql ? b.t1 : b.t0) - n
    return { from: to - from < n / 2 ? from - n : from, to, dt }
  }

  /** Clicks of count-in left, counting down to 1, or 0 when not counting. */
  get count() {
    const { from, to, dt } = this.lead()
    if (!this.running() || this.t >= to) return 0
    const n = Math.ceil((to - from) / dt - 1e-6)
    return Math.max(1, Math.min(n, n - Math.floor((this.t - from) / dt + 1e-6)))
  }

  /** Re-score after a setting change without leaving the song. */
  private rescore() {
    this.judge = new Judge(this.song.notes, this.cfg(), this.scored)
    this.presses = []
    this.pedals = this.pedal ? [{ t: -1e9, down: true }] : []
    this.downAt.clear()
    this.wrongMark = 0
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

  /** Move the clock. What was handed to the audio clock ahead of the old time is stopped, and is handed again from the new one. */
  seek(t: number) {
    this.t = t
    this.anchor(performance.now())
    audio.hush()
    const { from, dt } = this.lead()
    this.nextClick = Math.max(0, Math.ceil((t - from) / dt - 1e-6))
    this.nextMetro = t
    this.autoI = this.song.notes.findIndex((n) => n.t >= t)
    if (this.autoI < 0) this.autoI = this.song.notes.length
    this.compI = this.song.chords?.findIndex((c) => c.t >= t) ?? -1
    if (this.compI < 0) this.compI = this.song.chords?.length ?? 0
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
      this.seek(this.tAt(performance.now())) // the clicks and notes already handed ahead stop with it
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
    for (const [p, [, until]] of this.autoUntil) if (until < perf) this.autoUntil.delete(p)
    if (!this.running() && this.phase !== 'waiting') return
    if (this.hold && perf >= this.hold.until) {
      this.hold = undefined
      this.anchor(perf)
      this.setPhase('playing')
    }

    const lead = this.lead()
    const look = LOOK * this.rate
    for (let at = lead.from + this.nextClick * lead.dt; at <= this.t + look && at < lead.to - 1e-6; at = lead.from + ++this.nextClick * lead.dt)
      audio.click(this.nextClick === 0, Math.max(0, (at - this.t) / this.rate), this.calib) // the first click of the count is the accented one
    if (this.phase === 'countin' && this.t >= lead.to) this.setPhase('playing')
    const end = this.horizon(look)
    this.metronome(lead.to, end)

    // the notes the app plays for you (a Listen hand, a part, the chords) go to the audio clock like the clicks, each with its length
    const at = (t: number, d: number) => ({ after: Math.max(0, (t - this.t) / this.rate), dur: d / this.rate })
    while (this.autoI < this.song.notes.length && this.song.notes[this.autoI].t < end) {
      const n = this.song.notes[this.autoI++]
      if (this.modeOf(n) !== 'listen') continue
      const a = at(n.t, n.d)
      audio.noteOn(n.p, n.v, true, voiceOf(this.song, n), a) // Listen always sounds: the app is the one playing this hand
      const from = perf + a.after * 1000
      const was = this.autoUntil.get(n.p) // the same key again: lit from the first one on
      this.autoUntil.set(n.p, [was && was[1] >= from - 50 ? was[0] : from, from + a.dur * 1000])
    }
    for (const ch = this.song.chords; ch && this.compI < ch.length && ch[this.compI].t < end; ) {
      const c = ch[this.compI++]
      if (settings.comp) for (const p of c.keys) audio.noteOn(p, 0.45, true, undefined, at(c.t, c.d * 0.9)) // like Listen: the app is the one playing
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

  /** Song time up to which sound may go to the audio clock: `look` ahead, never past the loop end, nor past the note a wait is about to stall on (that beat, and the app's notes with it, then sound as you play it). */
  private horizon(look: number) {
    let end = this.t + look
    if (this.loop) end = Math.min(end, this.loop.b)
    const i = this.wait ? this.judge.nextPending() : -1
    return i >= 0 ? Math.min(end, this.song.notes[i].t) : end
  }

  /** The practice metronome: every beat of the song from the count-in's end, scheduled from the song position like the count-in. */
  private metronome(from: number, end: number) {
    if ((this.mode === 'read' && !this.paced) || !this.running()) return
    if (settings.metro !== 'off' || this.paced || this.calib) {
      for (const k of ticks(this.song.bars, Math.max(this.nextMetro, from), end, !this.paced && settings.metro === 'eighths'))
        audio.click(k.kind === 'down', Math.max(0, (k.t - this.t) / this.rate), true, k.kind === 'sub' ? 0.5 : 1)
    }
    this.nextMetro = Math.max(this.nextMetro, end)
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
      timing: this.mode === 'read' ? null : timing(this.song.notes.flatMap((n, i) => (j.grade[i] && j.grade[i] !== 'miss' ? [{ t: n.t, p: n.p, h: n.h, off: j.off[i] }] : []))),
      artic: this.mode === 'read' || !(this.song.artic ?? (this.song.id.startsWith('scale:') && 'legato')) ? null : articulation(this.song.artic ?? 'legato', this.song.notes, this.presses, this.rate),
      voice: this.mode === 'read' || (judged(this.song.id) && this.song.dyn !== 'balance') ? null : voicing(j.samples(), settings.edges ?? DEFAULT_EDGES, this.song.dyn === 'balance' ? 'R' : melodyHand(this.song.notes)),
      fixed: fixedAt(j.samples().map((x) => x.v)),
      pedal: settings.coach === 'off' || this.mode === 'read' || this.wait || this.loop ? null : ((r) => r && pedalLine(r))(pedalReport(this.song, this.pedals)),
      follow: settings.coach === 'off' || this.mode === 'read' || this.wait || judged(this.song.id) ? [] : songLines(this.song, this.presses, j.samples(), settings.edges ?? DEFAULT_EDGES, settings.coach, this.rate),
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
        this.emit({ type: 'hit', note, grade: e.grade, off: e.off, combo: e.combo, vel: e.vel, v: this.judge.velAt(e.i) })
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
    const t = live ? this.tAt(ts) - (this.offset / 1000) * this.rate : this.t
    this.emit({ type: 'press', p, vel, t: this.phase === 'waiting' ? this.t : t })
    if (!live) return
    const evs = this.judge.press(p, this.phase === 'waiting' ? this.t : t, virtual ? 0 : vel)
    for (const e of evs) if (e.k === 'hit' || e.k === 'ok') this.downAt.set(p, { i: e.i, at: ts })
    this.dispatch(evs)
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
    if (settings.sound || virtual) audio.keyUp(p)
    this.emit({ type: 'release', p })
    const k = this.downAt.get(p)
    if (k) this.presses.push({ i: k.i, down: k.at, up: ts })
    this.downAt.delete(p)
    if (this.hold && performance.now() < this.hold.until && this.hold.idx.some((i) => this.song.notes[i].p === p)) {
      this.judge.reopen(this.hold.idx)
      this.hold = undefined
      this.emit({ type: 'short' })
    }
    if (this.running()) this.dispatch(this.judge.release(p, this.tAt(ts) - (this.offset / 1000) * this.rate, this.pedal))
  }

  /** CC64 crossed the half-way mark. Kept as song time (the held clock when paused) so the coach can set it against the chords. */
  sustain(down: boolean, ts = performance.now()) {
    if (down === this.pedal) return
    this.pedal = down
    audio.sustain(down)
    this.pedals.push({ t: this.tAt(ts) - (this.offset / 1000) * this.rate, down })
  }
}
