import type { Note } from './song'

export type Grade = 'perfect' | 'great' | 'good' | 'miss'
export type HoldGrade = 'held' | 'short' | 'long'
export type Hold = 'off' | 'lenient' | 'strict'

// How far from the written end a release may land: the larger of a floor in seconds and a share of the note.
const SLACK = { lenient: { floor: 0.35, share: 0.3 }, strict: { floor: 0.12, share: 0.15 } }
const HOLD_FLOOR = 0.5 // a cut-short note still keeps half its points
const LONG_KEEP = 0.75

// Real-time windows in ms, either side of the note. Tune by feel.
export const WIN = { perfect: 45, great: 80, good: 125 }
export const WEIGHT: Record<Grade, number> = { perfect: 1, great: 0.8, good: 0.5, miss: 0 }
const POINTS = { perfect: 100, great: 80, good: 50 }
const WAIT_EARLY = 0.6 // wait mode accepts a note this many song-seconds early
const CLUSTER = 0.03 // notes this close together count as one chord when waiting

export const multiplier = (combo: number) => (combo >= 50 ? 4 : combo >= 25 ? 3 : combo >= 10 ? 2 : 1)

export type Ev =
  | { k: 'hit'; i: number; grade: Grade; off: number; combo: number; mult: number }
  | { k: 'ok'; i: number } // wait-mode hit, no timing grade
  | { k: 'miss'; i: number }
  | { k: 'wrong'; p: number }
  | { k: 'hold'; i: number; grade: HoldGrade; f: number } // key released; f = share of the points kept

export interface Cfg {
  rate: number // 1 = 100% tempo
  wait: boolean
  strict: boolean // wrong notes break the combo
  hold?: Hold // grade how long keys are held; absent = off
}

const PENDING = 0
const HIT = 1
const MISSED = 2
const OFF = -1

export class Judge {
  st = new Int8Array(0)
  grade: (Grade | undefined)[] = []
  off = new Float32Array(0)
  private pts = new Float32Array(0) // points each hit note earned, so a short hold can take some back
  private down = new Map<number, number>() // pitch -> note index, for keys struck and not yet released
  holds: Record<HoldGrade, number> = { held: 0, short: 0, long: 0 }
  score = 0
  combo = 0
  maxCombo = 0
  wrong = 0
  total = 0
  hits = 0 // notes cleared, with or without a timing grade
  judged = 0
  weightSum = 0
  counts: Record<Grade, number> = { perfect: 0, great: 0, good: 0, miss: 0 }
  private first = 0

  constructor(
    private notes: Note[],
    public cfg: Cfg,
    scored: (n: Note) => boolean,
  ) {
    this.init(scored)
  }

  init(scored: (n: Note) => boolean) {
    this.st = new Int8Array(this.notes.length)
    this.grade = new Array(this.notes.length).fill(undefined)
    this.off = new Float32Array(this.notes.length)
    this.pts = new Float32Array(this.notes.length)
    this.down.clear()
    this.holds = { held: 0, short: 0, long: 0 }
    this.total = 0
    this.notes.forEach((n, i) => {
      const ok = scored(n)
      this.st[i] = ok ? PENDING : OFF
      if (ok) this.total++
    })
    this.score = this.combo = this.maxCombo = this.wrong = this.judged = this.hits = this.weightSum = 0
    this.counts = { perfect: 0, great: 0, good: 0, miss: 0 }
    this.first = 0
    this.advance()
  }

  get accuracy() {
    return this.judged ? this.weightSum / this.judged : 1
  }

  /** Share of judged holds that were on time; 1 before any. */
  get holdPct() {
    const n = this.holds.held + this.holds.short + this.holds.long
    return n ? this.holds.held / n : 1
  }

  private advance() {
    while (this.first < this.notes.length && this.st[this.first] !== PENDING) this.first++
  }

  /** `t` is song time, already corrected for the calibration offset. */
  press(p: number, t: number): Ev[] {
    const w = (WIN.good * this.cfg.rate) / 1000
    let best = -1
    let bestD = Infinity
    for (let i = this.first; i < this.notes.length; i++) {
      const n = this.notes[i]
      if (n.t > t + (this.cfg.wait ? WAIT_EARLY : w)) break
      if (this.st[i] !== PENDING || n.p !== p) continue
      const d = Math.abs(n.t - t)
      if (this.cfg.wait) {
        best = i // earliest pending of this pitch
        break
      }
      if (d <= w && d < bestD) {
        best = i
        bestD = d
      }
    }
    if (best < 0) return this.stray(p)

    this.st[best] = HIT
    this.hits++
    this.advance()
    if (this.cfg.wait) return [{ k: 'ok', i: best }]

    const off = ((t - this.notes[best].t) / this.cfg.rate) * 1000
    const a = Math.abs(off)
    const grade: Grade = a <= WIN.perfect ? 'perfect' : a <= WIN.great ? 'great' : 'good'
    const mult = multiplier(this.combo)
    this.pts[best] = POINTS[grade] * mult
    this.score += this.pts[best]
    this.down.set(p, best)
    this.combo++
    this.maxCombo = Math.max(this.maxCombo, this.combo)
    this.counts[grade]++
    this.judged++
    this.weightSum += WEIGHT[grade]
    this.grade[best] = grade
    this.off[best] = off
    return [{ k: 'hit', i: best, grade, off, combo: this.combo, mult }]
  }

  /** A key came up at song time `t`. Grades it against the note's written end; the sustain pedal excuses an early release. */
  release(p: number, t: number, pedal: boolean): Ev[] {
    const i = this.down.get(p)
    this.down.delete(p)
    const mode = this.cfg.hold
    if (i === undefined || !mode || mode === 'off' || this.cfg.wait) return []
    const n = this.notes[i]
    let end = n.t + n.d
    for (let k = i + 1; k < this.notes.length; k++) {
      const m = this.notes[k]
      if (m.t > end) break
      if (m.h === n.h && m.t > n.t + 0.02) {
        end = m.t
        break
      }
    }
    const dur = end - n.t
    const { floor, share } = SLACK[mode]
    const tol = Math.max(floor * this.cfg.rate, share * dur)
    let grade: HoldGrade = 'held'
    let f = 1
    if (t < end - tol && !pedal) {
      grade = 'short'
      f = Math.max(HOLD_FLOOR, 1 - (end - t) / dur)
    } else if (mode === 'strict' && t > end + tol) {
      grade = 'long'
      f = LONG_KEEP
    }
    this.score -= this.pts[i] * (1 - f)
    this.holds[grade]++
    return [{ k: 'hold', i, grade, f }]
  }

  private stray(p: number): Ev[] {
    this.wrong++
    if (this.cfg.strict) this.combo = 0
    return [{ k: 'wrong', p }]
  }

  /** Mark notes that slid past their window. No-op while waiting: the clock stalls instead. */
  tick(t: number): Ev[] {
    if (this.cfg.wait) return []
    const w = (WIN.good * this.cfg.rate) / 1000
    const out: Ev[] = []
    for (let i = this.first; i < this.notes.length; i++) {
      if (this.notes[i].t + w >= t) break
      if (this.st[i] !== PENDING) continue
      this.st[i] = MISSED
      this.combo = 0
      this.counts.miss++
      this.judged++
      this.grade[i] = 'miss'
      out.push({ k: 'miss', i })
    }
    this.advance()
    return out
  }

  /** Pending notes the clock must wait for at song time `t` (wait mode). */
  required(t: number): number[] {
    const out: number[] = []
    for (let i = this.first; i < this.notes.length; i++) {
      const n = this.notes[i]
      if (n.t > t + CLUSTER) break
      if (this.st[i] === PENDING) out.push(i)
    }
    return out
  }

  /** Earliest pending note, for the ghost keys in wait mode. */
  nextPending(): number {
    return this.first < this.notes.length ? this.first : -1
  }

  get done() {
    return this.first >= this.notes.length
  }
}
