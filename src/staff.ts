import type { Game } from './game'
import { settings } from './settings'
import { BOTTOM_STEP, clefFor, keyAcc, keySigSteps, spell, type Spelled } from './spell'
import { barAt, type Note } from './song'

// One staff space is S viewBox units; Bravura's em is four spaces.
const S = 10
type Clef = 'treble' | 'bass'
// Geometry (viewBox units): both staves, or one staff with room for ledger lines when a drill uses only one clef.
const GRAND = { h: 166, base: { treble: 64, bass: 134 } } // 166 leaves room for stems below the bass staff
const SOLO = { h: 104, base: { treble: 72, bass: 72 } }
const GAP = 26 // between systems in sheet view
const MID_STEP = { treble: 34, bass: 22 } // B4, D3: the middle line of each clef
const NS = 'http://www.w3.org/2000/svg'

const G = {
  gClef: '',
  fClef: '',
  whole: '',
  half: '',
  black: '',
  sharp: '',
  flat: '',
  natural: '',
  dot: '',
  flagUp: ['', ''], // 8th, 16th
  flagDown: ['', ''],
  digit: (d: number) => String.fromCharCode(0xe080 + d),
}

const VALUES = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25]
const quant = (b: number) => VALUES.reduce((a, v) => (Math.abs(v - b) < Math.abs(a - b) ? v : a))

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent: Element, text?: string) {
  const e = document.createElementNS(NS, tag)
  for (const k in attrs) e.setAttribute(k, String(attrs[k]))
  if (text !== undefined) e.textContent = text
  parent.appendChild(e)
  return e
}

const yOf = (step: number, clef: Clef, base: Record<Clef, number>) => base[clef] - (step - BOTTOM_STEP[clef]) * (S / 2)

interface Chord {
  items: Placed[]
  clef: 'treble' | 'bass'
  x: number
  dy: number // vertical offset of the system this chord sits in
  t: number
  bar: number
  beats: number
  up: boolean
  lo: number
  hi: number
}

interface Placed {
  note: Note
  sp: Spelled
  clef: 'treble' | 'bass'
  x: number
  dy: number
  head?: SVGElement
}

export class Staff {
  private svg: SVGSVGElement
  private cursor!: SVGLineElement
  private placed: Placed[] = []
  private bar0 = -1
  private count = 4 // bars per system
  private sys = 1 // systems on the page: 1, or 2 in a tall sheet view (current + next)
  private total = GRAND.h // viewBox height
  private yPad = 0 // centres a short page vertically in sheet view
  private w = 0
  private x0 = 0
  private x1 = 0
  private bw = 0
  private pad = 14
  private seen = 0
  private lastT = 0
  private base: Record<Clef, number> = GRAND.base
  private vbH = GRAND.h
  private clefs: Clef[] = ['treble', 'bass']
  private byId = new Map<number, Placed>()
  private ghosts = new Map<number, SVGGElement>() // what you are pressing, by pitch
  private awaiting = new Set<number>()

  constructor(
    private host: HTMLElement,
    private game: Game,
  ) {
    this.svg = document.createElementNS(NS, 'svg') as SVGSVGElement
    this.svg.setAttribute('role', 'img')
    this.svg.setAttribute('aria-label', 'Grand staff showing the notes about to be played')
    host.appendChild(this.svg)
    new ResizeObserver(() => this.render()).observe(host)
  }

  /** Force a rebuild (new song, settings, resize). */
  render() {
    this.bar0 = -1
    this.frame()
  }

  /** Sets the bars per system and systems per page; returns the first bar shown. */
  private windowFor(bar: number): number {
    const { notes, bars } = this.game.song
    if (this.game.view === 'sheet') {
      // sheet view: notation at about 26 px a staff space, as many bars as fit across, the page centred.
      // A tall window fits a second system (the next one) at a readable size.
      const r = this.host.getBoundingClientRect()
      const two = GRAND.h * 2 + GAP
      this.sys = r.height / two >= 2.2 ? 2 : 1
      this.total = this.sys === 2 ? two : Math.max(GRAND.h, r.height / 2.6)
      const avail = this.total * (r.width / Math.max(r.height, 1)) - 120
      const on = new Set<number>()
      const from = Math.floor(bar / 4) * 4
      for (const x of notes) if (x.bar >= from && x.bar < from + 4) on.add(Math.round(x.t * 40))
      const perBar = 70 + 15 * (on.size / 4)
      this.count = Math.min(4, Math.max(1, Math.floor(avail / perBar)))
      return Math.floor(bar / this.count) * this.count
    }
    this.sys = 1
    const on = new Set<number>()
    let signs = false // an accidental needs room to its left, so a drill with any gets one wide bar
    const ka = keyAcc(this.game.song.fifths)
    for (const n of notes) {
      if (n.bar !== bar && n.bar !== bar + 1) continue
      on.add(Math.round(n.t * 40))
      const sp = spell(n.p, n.flat ? -2 : this.game.song.fifths)
      if (sp.acc !== ka[sp.letter]) signs = true
    }
    // two bars of reading ahead, one when the music is dense
    this.count = bar + 1 < bars.length && on.size <= 22 && !(signs && this.game.mode === 'read') ? 2 : 1
    return bar
  }

  frame() {
    const { song, t } = this.game
    const bar = Math.max(0, barAt(song.bars, Math.max(0, t)))
    const back = t < this.lastT - 0.05 // a seek or loop wrap: rebuild so played-note dimming resets
    this.lastT = t
    const start = this.game.view === 'sheet' ? Math.floor(bar / this.count) * this.count : bar
    if (start !== this.bar0 || back) {
      this.bar0 = this.windowFor(bar)
      this.build()
    }
    this.moveCursor()
    this.markAwaited()
    // dim the notes already played
    for (; this.seen < this.placed.length && this.placed[this.seen].note.t < t - 0.02; this.seen++) {
      this.placed[this.seen].head?.classList.add('past')
    }
  }

  private y(step: number, clef: Clef, dy = 0) {
    return yOf(step, clef, this.base) + dy
  }

  /** In wait mode, light the noteheads the song is waiting for. */
  private markAwaited() {
    const g = this.game
    let need = new Set<number>()
    if (g.phase === 'waiting') need = new Set(g.judge.required(g.t))
    else if (g.mode === 'read' && g.phase !== 'done') {
      const i = g.judge.nextPending()
      if (i >= 0) need = new Set(g.judge.required(g.song.notes[i].t)) // the whole next card
    }
    if (!need.size && !this.awaiting.size) return
    for (const id of this.awaiting) if (!need.has(id)) this.byId.get(id)?.head?.classList.remove('await')
    for (const id of need) if (!this.awaiting.has(id)) this.byId.get(id)?.head?.classList.add('await')
    this.awaiting = need
  }

  /** Where a moment in time sits on the page: x, and the offset of its system. */
  private posAt(t: number): { x: number; dy: number } {
    const bars = this.game.song.bars
    const b = bars[Math.min(Math.max(0, barAt(bars, t)), bars.length - 1)]
    const i = Math.min(Math.max(0, b.i - this.bar0), this.count * this.sys - 1)
    const frac = Math.min(1, Math.max(0, (t - b.t0) / (b.t1 - b.t0)))
    const col = i % this.count
    const span = this.game.mode === 'read' ? this.bw - this.pad * 2 : this.bw // drills keep their margins: cards wait, nothing sweeps
    return {
      x: this.x0 + col * this.bw + this.pad + frac * span,
      dy: this.yPad + Math.floor(i / this.count) * (this.vbH + GAP),
    }
  }

  private moveCursor() {
    const { bars } = this.game.song
    const last = Math.min(this.bar0 + this.count * this.sys, bars.length) - 1
    const t = Math.min(Math.max(this.game.t, bars[this.bar0].t0), bars[last].t1)
    const { x, dy } = this.posAt(t)
    const cx = Math.min(x, this.x1) - (this.game.mode === 'read' ? 16 : 0) // drills: park it just before the card
    this.cursor.setAttribute('x1', String(cx))
    this.cursor.setAttribute('x2', String(cx))
    const top = this.base[this.clefs[0]] - 4 * S
    const bottom = this.base[this.clefs[this.clefs.length - 1]]
    this.cursor.setAttribute('y1', String(dy + top - 12))
    this.cursor.setAttribute('y2', String(dy + bottom + 12))
  }

  /** Reading drills that stay in one clef get one big staff; everything else gets the grand staff. */
  private pickLayout() {
    const used = new Set(this.game.song.notes.map((n) => clefFor(n.p, n.h)))
    const solo = this.game.mode === 'read' && used.size === 1 ? [...used][0] : undefined
    this.clefs = solo ? [solo] : ['treble', 'bass']
    this.base = solo ? SOLO.base : GRAND.base
    this.vbH = solo ? SOLO.h : GRAND.h
  }

  private build() {
    const { song } = this.game
    const r = this.host.getBoundingClientRect()
    if (!r.width || !r.height) return
    this.pickLayout()
    this.pad = this.game.mode === 'read' ? 30 : 14 // drills: room left of a note for its accidental
    const { clefs, base } = this
    const top = base[clefs[0]] - 4 * S // y of the first staff's top line
    const bottom = base[clefs[clefs.length - 1]] // y of the last staff's bottom line
    const sheet = this.game.view === 'sheet'
    const total = sheet ? this.total : this.vbH * this.sys + GAP * (this.sys - 1)
    const drawn = Math.min(this.sys, Math.ceil((song.bars.length - this.bar0) / this.count))
    this.yPad = sheet ? (total - (this.vbH * drawn + GAP * (drawn - 1))) / 2 : 0
    this.w = Math.round(total * (r.width / r.height))
    const svg = this.svg
    svg.replaceChildren()
    svg.setAttribute('viewBox', `0 0 ${this.w} ${total}`)
    this.placed = []
    this.byId.clear()
    this.awaiting.clear()
    this.ghosts.clear() // the page was redrawn: the ghosts went with it
    this.seen = 0

    const fifths = song.fifths
    const first = this.bar0 === 0
    this.x0 = 14 + 40 + Math.abs(fifths) * 9 + (first ? 26 : 8)
    this.x1 = this.w - 10
    this.bw = (this.x1 - this.x0) / this.count
    // Time maps straight onto the page. Half a beat of air at each end of a bar makes the step from the
    // last beat to the next bar's first beat the same as any other, so the cursor never lurches at a barline.
    if (this.game.mode !== 'read') this.pad = this.bw / (2 * song.bars[this.bar0].n)

    for (let sy = 0; sy < this.sys; sy++) {
      const from = this.bar0 + sy * this.count
      if (from >= song.bars.length) break
      const dy = this.yPad + sy * (this.vbH + GAP)
      const lines = el('g', { class: 'lines' }, svg)
      for (const clef of clefs) {
        for (let i = 0; i < 5; i++) {
          const y = dy + base[clef] - i * S
          el('line', { x1: 8, x2: this.x1, y1: y, y2: y }, lines)
        }
      }
      el('line', { x1: 8, x2: 8, y1: dy + top, y2: dy + bottom }, lines)

      // clefs, key and time signature
      const sym = el('g', { class: 'sym' }, svg)
      for (const clef of clefs) {
        el('text', { x: 14, y: dy + (clef === 'treble' ? base.treble - S : base.bass - 3 * S), class: 'smufl' }, sym, clef === 'treble' ? G.gClef : G.fClef)
        keySigSteps(fifths, clef).forEach((step, i) =>
          el('text', { x: 14 + 38 + i * 9, y: this.y(step, clef, dy), class: 'smufl' }, sym, fifths > 0 ? G.sharp : G.flat),
        )
      }
      if (first && sy === 0) {
        const b = song.bars[0]
        const x = 14 + 40 + Math.abs(fifths) * 9
        for (const clef of clefs) {
          el('text', { x, y: dy + base[clef] - 2 * S, class: 'smufl' }, sym, String(b.n).split('').map((c) => G.digit(Number(c))).join(''))
          el('text', { x, y: dy + base[clef], class: 'smufl' }, sym, String(b.den).split('').map((c) => G.digit(Number(c))).join(''))
        }
      }

      // bar lines and bar numbers
      const bl = el('g', { class: 'bars' }, svg)
      for (let i = 0; i <= this.count; i++) {
        const bar = from + i
        if (bar > song.bars.length) break
        const x = this.x0 + i * this.bw
        for (const clef of clefs) el('line', { x1: x, x2: x, y1: dy + base[clef] - 4 * S, y2: dy + base[clef] }, bl)
        if (i < this.count && bar < song.bars.length) el('text', { x: x + 4, y: dy + top - 16, class: 'barno' }, bl, String(bar + 1))
      }
    }

    // the cursor sits behind the noteheads so it never covers what you are about to play
    this.cursor = el('line', { class: 'cursor', y1: top - 12, y2: bottom + 12 }, svg) as SVGLineElement
    this.notes()
  }

  private notes() {
    const { song } = this.game
    const hidden = (n: Note) => this.game.hands[n.h] === 'hide'
    const end = Math.min(this.bar0 + this.count * this.sys, song.bars.length)
    const inWin = song.notes.filter((n) => n.bar >= this.bar0 && n.bar < end && !hidden(n))
    const acc = new Map<string, number>() // `${bar}:${clef}:${step}` -> accidental in force
    const ka = keyAcc(song.fifths)

    // chords: same onset, same staff
    const groups = new Map<string, Placed[]>()
    for (const n of inWin) {
      const clef = clefFor(n.p, n.h)
      const key = `${Math.round(n.t * 100)}:${clef}`
      const pos = this.posAt(n.t)
      const p: Placed = { note: n, sp: spell(n.p, n.flat ? -2 : song.fifths), clef, x: pos.x, dy: pos.dy }
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(p)
    }
    const chords: Chord[] = [...groups.values()].map((items) => {
      items.sort((a, b) => a.sp.step - b.sp.step)
      const clef = items[0].clef
      const mean = items.reduce((s, p) => s + p.sp.step, 0) / items.length
      return {
        items,
        clef,
        x: items[0].x,
        dy: items[0].dy,
        t: items[0].note.t,
        bar: items[0].note.bar,
        beats: quant(Math.min(...items.map((p) => p.note.beats))),
        up: mean < MID_STEP[clef],
        lo: items[0].sp.step,
        hi: items[items.length - 1].sp.step,
      }
    })

    // beam runs of eighths and sixteenths inside one beat, with no rest between
    const runs: Chord[][] = []
    for (const clef of ['treble', 'bass'] as const) {
      let run: Chord[] = []
      const flush = () => {
        if (run.length > 1) runs.push(run)
        run = []
      }
      for (const c of chords.filter((x) => x.clef === clef)) {
        const b = song.bars[c.bar]
        const q = (b.t1 - b.t0) / ((b.n * 4) / b.den)
        const beat = q * (b.den === 8 && b.n % 3 === 0 ? 1.5 : 4 / b.den)
        const idx = Math.floor((c.t - b.t0) / beat + 1e-6)
        const last = run[run.length - 1]
        const same = last && last.bar === c.bar && Math.floor((last.t - b.t0) / beat + 1e-6) === idx
        const touching = last && Math.abs(c.t - (last.t + last.beats * q)) < 0.06 * q
        if (c.beats > 0.5 || !same || !touching) flush()
        if (c.beats <= 0.5) run.push(c)
      }
      flush()
    }
    const beamed = new Map<Chord, Chord[]>()
    for (const run of runs) {
      const steps = run.flatMap((c) => c.items.map((p) => p.sp.step))
      const up = steps.reduce((a, b) => a + b, 0) / steps.length < MID_STEP[run[0].clef]
      for (const c of run) {
        c.up = up
        beamed.set(c, run)
      }
    }

    const g = el('g', { class: 'notes' }, this.svg)
    for (const c of chords.sort((a, b) => a.t - b.t)) {
      const { clef, up, x, beats, items: chord } = c
      const head = beats >= 4 ? G.whole : beats >= 2 ? G.half : G.black
      const bottom = BOTTOM_STEP[clef]
      for (let s = bottom - 2; s >= c.lo; s -= 2) {
        el('line', { class: 'ledger', x1: x - 11, x2: x + 11, y1: this.y(s, clef, c.dy), y2: this.y(s, clef, c.dy) }, g)
      }
      for (let s = bottom + 10; s <= c.hi; s += 2) {
        el('line', { class: 'ledger', x1: x - 11, x2: x + 11, y1: this.y(s, clef, c.dy), y2: this.y(s, clef, c.dy) }, g)
      }

      // stem: to its own length, or to the shared beam line
      if (beats < 4) {
        const sx = up ? x + 5.4 : x - 5.4
        const yLo = this.y(c.lo, clef, c.dy)
        const yHi = this.y(c.hi, clef, c.dy)
        const run = beamed.get(c)
        const reach = run
          ? up
            ? Math.min(...run.map((r) => this.y(r.hi, clef, r.dy))) - 3.5 * S
            : Math.max(...run.map((r) => this.y(r.lo, clef, r.dy))) + 3.5 * S
          : up
            ? yHi - 3.5 * S
            : yLo + 3.5 * S
        el('line', { class: 'stem', x1: sx, x2: sx, y1: up ? yLo : yHi, y2: reach }, g)
        if (!run && beats <= 0.75) el('text', { class: 'smufl', x: sx - 0.3, y: reach }, g, (up ? G.flagUp : G.flagDown)[beats <= 0.25 ? 1 : 0])
        if (run && c === run[0]) this.beams(g, run, up, reach)
      }

      // heads (displace seconds), accidentals, dots
      let lastAccStep = -99
      let accCol = 0
      const order = up ? chord : [...chord].reverse()
      let prev: Placed | undefined
      for (const p of order) {
        const second = prev && Math.abs(p.sp.step - prev.sp.step) === 1 && prev.head?.getAttribute('data-dx') === '0'
        const dx = second ? (up ? 11.4 : -11.4) : 0
        const y = this.y(p.sp.step, clef, c.dy)
        const h = el('text', { class: 'smufl head', x: x + dx, y, 'text-anchor': 'middle', 'data-dx': dx ? 1 : 0, 'data-id': p.note.id }, g, head)
        p.head = h
        prev = p
        if (beats === 1.5 || beats === 3 || beats === 0.75) el('text', { class: 'smufl', x: x + 10 + Math.max(0, dx), y: y - (p.sp.step % 2 === bottom % 2 ? S / 2 : 0) }, g, G.dot)

        const k = `${p.note.bar}:${clef}:${p.sp.step}`
        const inForce = acc.get(k) ?? ka[p.sp.letter]
        if (p.sp.acc !== inForce) {
          if (Math.abs(p.sp.step - lastAccStep) < 6) accCol++
          else accCol = 0
          lastAccStep = p.sp.step
          el('text', { class: 'smufl acc', x: x - 15 - accCol * 8 - (dx < 0 ? 11 : 0), y, 'text-anchor': 'middle' }, g, p.sp.acc > 0 ? G.sharp : p.sp.acc < 0 ? G.flat : G.natural)
          acc.set(k, p.sp.acc)
        }
      }
      for (const p of chord) {
        this.placed.push(p)
        this.byId.set(p.note.id, p)
      }
    }
    this.placed.sort((a, b) => a.note.t - b.note.t)
    // marks that survive a rebuild: notes already missed this pass
    for (const p of this.placed) {
      const i = p.note.id
      const gr = this.game.judge.grade[i]
      if (this.game.judge.st[i] === 2) this.flag(p, 'miss')
      else if (p.note.t < this.game.t - 0.02) {
        p.head?.classList.add('past')
        if (gr === 'great' || gr === 'good') this.shape(p, gr)
      }
    }
  }

  /** A flat beam across the run's stem tips; a second beam (or a stub) for sixteenths. */
  private beams(g: Element, run: Chord[], up: boolean, y: number) {
    const sx = (c: Chord) => (up ? c.x + 5.4 : c.x - 5.4)
    const T = 5
    const row = (a: number, b: number, off: number) =>
      el('rect', { class: 'beam', x: Math.min(a, b), y: (up ? y : y - T) + (up ? off : -off), width: Math.abs(b - a) + 1.3, height: T }, g)
    row(sx(run[0]), sx(run[run.length - 1]), 0)
    for (let i = 0; i < run.length; i++) {
      if (run[i].beats > 0.25) continue
      const next = run[i + 1]
      const prev = run[i - 1]
      if (next && next.beats <= 0.25) row(sx(run[i]), sx(next), 7.5)
      else if (!(prev && prev.beats <= 0.25)) {
        const d = next ? 7 : -7
        row(sx(run[i]), sx(run[i]) + d, 7.5)
      }
    }
  }

  private flag(p: Placed, cls: string) {
    if (!p.head) return
    p.head.classList.add(cls)
    if (cls === 'miss') {
      if (settings.fx >= 2 && !matchMedia('(prefers-reduced-motion: reduce)').matches) p.head.classList.add('thud') // a short drop
      const y = Number(p.head.getAttribute('y')) + 12
      const x = Number(p.head.getAttribute('x'))
      const m = el('path', { class: 'miss-mark', d: `M${x - 4},${y + 5} L${x + 4},${y + 5} L${x},${y - 2} Z` }, p.head.parentElement!)
      m.setAttribute('aria-hidden', 'true')
    }
  }

  /** A hollow dashed notehead where you pressed a key: not part of the score, but the note you played. */
  ghost(pitch: number, t: number) {
    const { bars, fifths } = this.game.song
    if (!bars.length || !this.clefs.length) return
    this.ghosts.get(pitch)?.remove()
    const last = Math.min(this.bar0 + this.count * this.sys, bars.length) - 1
    const pos = this.posAt(Math.min(Math.max(t, bars[this.bar0].t0), bars[last].t1))
    const sp = spell(pitch, fifths)
    const want: Clef = pitch >= 60 ? 'treble' : 'bass'
    const clef = this.clefs.includes(want) ? want : this.clefs[0] // a one-clef drill has only its own staff
    const y = this.y(sp.step, clef, pos.dy)
    const g = el('g', { class: 'ghost' }, this.svg) as SVGGElement
    g.style.transform = `translate(${pos.x}px, ${y}px)`
    g.setAttribute('aria-hidden', 'true')
    const bottom = BOTTOM_STEP[clef]
    const off = (step: number) => this.y(step, clef, pos.dy) - y
    for (let st = bottom - 2; st >= sp.step; st -= 2) el('line', { x1: -11, x2: 11, y1: off(st), y2: off(st) }, g)
    for (let st = bottom + 10; st <= sp.step; st += 2) el('line', { x1: -11, x2: 11, y1: off(st), y2: off(st) }, g)
    el('ellipse', { rx: 6.4, ry: 4.7, transform: 'rotate(-20)' }, g)
    if (sp.acc !== keyAcc(fifths)[sp.letter]) el('text', { class: 'smufl', x: -16, y: 0, 'text-anchor': 'middle' }, g, sp.acc > 0 ? G.sharp : sp.acc < 0 ? G.flat : G.natural)
    this.ghosts.set(pitch, g)
    if (this.ghosts.size > 12) this.ghosts.get(this.ghosts.keys().next().value as number)?.remove()
  }

  /** The key came up without being scored (or after it was): fade the ghost. */
  ghostEnd(pitch: number) {
    const g = this.ghosts.get(pitch)
    if (!g) return
    this.ghosts.delete(pitch)
    g.classList.add('gone')
    setTimeout(() => g.remove(), 260)
  }

  /** The press matched a written note: the ghost slides onto it and flashes the grade. */
  ghostHit(pitch: number, noteId: number, grade: string) {
    const g = this.ghosts.get(pitch)
    if (!g) return
    this.ghosts.delete(pitch)
    const head = this.byId.get(noteId)?.head
    if (head) g.style.transform = `translate(${head.getAttribute('x')}px, ${head.getAttribute('y')}px)`
    g.dataset.g = grade
    g.classList.add('snap')
    setTimeout(() => g.remove(), 520)
  }

  /** A press with no note to match: the ghost goes red, with an X, and shakes. */
  ghostBad(pitch: number) {
    const g = this.ghosts.get(pitch)
    if (!g) return
    this.ghosts.delete(pitch)
    el('path', { d: 'M-3.6,-3.6 L3.6,3.6 M3.6,-3.6 L-3.6,3.6', class: 'x' }, g)
    g.classList.add('bad')
    setTimeout(() => g.remove(), 760)
  }

  /** The grade as a word above the note, for staff-only view where there is no highway to show it. */
  grade(noteId: number, grade: string, off: number) {
    const p = this.byId.get(noteId)
    if (!p?.head) return
    const staffTop = p.dy + this.base[this.clefs[0]] - 4 * S - 12
    // clear of the highest ink on the page (beams, stems, ledger lines), but inside the view
    const ink = (this.svg.querySelector('.notes') as SVGGraphicsElement | null)?.getBBox().y ?? staffTop
    const y = Math.max(16, Math.min(staffTop, ink - 10))
    const word = grade === 'perfect' ? 'Perfect' : grade === 'great' ? 'Great' : 'Good'
    const arrow = grade === 'perfect' ? '' : off < 0 ? ' ‹' : ' ›' // early or late
    const t = el('text', { class: 'gr', 'data-g': grade, x: Number(p.head.getAttribute('x')), y }, this.svg, word + arrow)
    t.setAttribute('aria-hidden', 'true')
    t.addEventListener('animationend', () => t.remove())
  }

  /** A small shape under a note that was Great or Good, so the grade outlives its colour. */
  private shape(p: Placed, grade: string) {
    if (!p.head || p.head.parentElement?.querySelector(`.gshape[data-id="${p.note.id}"]`)) return
    const x = Number(p.head.getAttribute('x'))
    const y = Number(p.head.getAttribute('y')) + 13
    const d = grade === 'good' ? `M${x},${y - 3} L${x + 3},${y} L${x},${y + 3} L${x - 3},${y} Z` : `M${x - 2.6},${y} a2.6,2.6 0 1,0 5.2,0 a2.6,2.6 0 1,0 -5.2,0`
    const m = el('path', { class: `gshape ${grade}`, 'data-id': p.note.id, d }, p.head.parentElement!)
    m.setAttribute('aria-hidden', 'true')
  }

  /** Ignite a note on the staff: it flares in its grade colour, then settles back to ink. */
  /** A note whose key came up early gets a red outline; a note held through gets nothing. */
  cut(noteId: number) {
    this.byId.get(noteId)?.head?.classList.add('short')
  }

  mark(noteId: number, cls: string) {
    const p = this.byId.get(noteId)
    if (!p) return
    if (cls === 'miss') return this.flag(p, 'miss')
    const h = p.head
    if (!h) return
    h.classList.remove('hit-perfect', 'hit-great', 'hit-good', 'hit-ok')
    void h.getBoundingClientRect()
    h.classList.add(cls)
    if (cls === 'hit-great' || cls === 'hit-good') this.shape(p, cls.slice(4))
  }
}
