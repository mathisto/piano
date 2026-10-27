import type { Hand, Note } from './song'

export type Grade = 'perfect' | 'great' | 'good' | 'miss'
export type HoldGrade = 'held' | 'short' | 'long'
export type VelGrade = 'ok' | 'low' | 'high' // struck inside, under or over the note's velocity range
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

export type Ev =
  | { k: 'hit'; i: number; grade: Grade; off: number; combo: number; vel?: VelGrade }
  | { k: 'ok'; i: number; vel?: VelGrade } // wait-mode hit, no timing grade
  | { k: 'miss'; i: number }
  | { k: 'wrong'; p: number }
  | { k: 'hold'; i: number; grade: HoldGrade; f: number } // key released; f = share of the points kept

export interface Cfg {
  rate: number // 1 = 100% tempo
  wait: boolean
  strict: boolean // wrong notes break the combo
  hold?: Hold // grade how long keys are held; absent = off
  ease?: number // scales the timing windows: above 1 is more forgiving; absent = 1
}

const PENDING = 0
const HIT = 1
const MISSED = 2
const OFF = -1

export class Judge {
  st = new Int8Array(0)
  grade: (Grade | undefined)[] = []
  off = new Float32Array(0)
  holdGrade: (HoldGrade | undefined)[] = [] // per note, once its key has come up
  holdAt = new Float32Array(0) // song time of that release
  private vel = new Uint8Array(0) // key velocity 1..127 of each struck note, 0 when unknown
  private pts = new Float32Array(0) // points each hit note earned, so a short hold can take some back
  private down = new Map<number, number>() // pitch -> note index, for keys struck and not yet released
  holds: Record<HoldGrade, number> = { held: 0, short: 0, long: 0 }
  touch: Record<VelGrade, number> = { ok: 0, low: 0, high: 0 } // notes with a velocity target, by result
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
    this.vel = new Uint8Array(this.notes.length)
    this.holdAt = new Float32Array(this.notes.length)
    this.holdGrade = new Array(this.notes.length).fill(undefined)
    this.down.clear()
    this.holds = { held: 0, short: 0, long: 0 }
    this.touch = { ok: 0, low: 0, high: 0 }
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

  /** Velocities of the notes struck so far, for the touch statistics. */
  samples(): { v: number; h: Hand; p: number; t: number }[] {
    const out: { v: number; h: Hand; p: number; t: number }[] = []
    this.vel.forEach((v, i) => v && out.push({ v, h: this.notes[i].h, p: this.notes[i].p, t: this.notes[i].t }))
    return out
  }

  /** Key velocity 1..127 of a struck note, 0 when unknown. */
  velAt(i: number) {
    return this.vel[i]
  }

  /** Share of targeted notes struck in their velocity range; -1 when nothing was targeted. */
  get touchPct() {
    const n = this.touch.ok + this.touch.low + this.touch.high
    return n ? this.touch.ok / n : -1
  }

  private velGrade(i: number): VelGrade | undefined {
    const want = this.notes[i].want
    const v = this.vel[i]
    if (!want || !v) return undefined
    const g: VelGrade = v < want[0] ? 'low' : v > want[1] ? 'high' : 'ok'
    this.touch[g]++
    return g
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
  press(p: number, t: number, vel = 0): Ev[] {
    const w = (WIN.good * (this.cfg.ease ?? 1) * this.cfg.rate) / 1000
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
    this.vel[best] = vel ? Math.max(1, Math.round(vel * 127)) : 0
    this.hits++
    this.advance()
    const vg = this.velGrade(best)
    if (this.cfg.wait) return [{ k: 'ok', i: best, vel: vg }]

    const off = ((t - this.notes[best].t) / this.cfg.rate) * 1000
    const a = Math.abs(off) / (this.cfg.ease ?? 1)
    const grade: Grade = a <= WIN.perfect ? 'perfect' : a <= WIN.great ? 'great' : 'good'
    this.pts[best] = POINTS[grade]
    this.score += this.pts[best]
    this.down.set(p, best)
    this.combo++
    this.maxCombo = Math.max(this.maxCombo, this.combo)
    this.counts[grade]++
    this.judged++
    this.weightSum += WEIGHT[grade]
    this.grade[best] = grade
    this.off[best] = off
    return [{ k: 'hit', i: best, grade, off, combo: this.combo, vel: vg }]
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
    this.holdGrade[i] = grade
    this.holdAt[i] = t
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
    const w = (WIN.good * (this.cfg.ease ?? 1) * this.cfg.rate) / 1000
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

  /** Notes struck at this moment (within one chord's spread of `t`). */
  cluster(t: number): number[] {
    const out: number[] = []
    for (let i = 0; i < this.notes.length; i++) {
      if (this.notes[i].t > t + CLUSTER) break
      if (this.st[i] === HIT && this.notes[i].t >= t - CLUSTER) out.push(i)
    }
    return out
  }

  /** Take back hits so the notes are asked for again (a key let go too soon in Learn's hold-to-advance). */
  reopen(idx: number[]) {
    for (const i of idx) {
      if (this.st[i] !== HIT) continue
      this.st[i] = PENDING
      this.hits--
      this.vel[i] = 0
      this.down.delete(this.notes[i].p)
      this.first = Math.min(this.first, i)
    }
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
