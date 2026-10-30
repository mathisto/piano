import type { Game } from './game'
import { analyze, densest, figure, fitZoom, layout, windowFor, yOf, S, type Analysis, type Cfg, type Layout, type LChord } from './layout'
import { settings } from './settings'
import { BOTTOM_STEP, keyAcc, spell } from './spell'
import { barAt } from './song'

const NS = 'http://www.w3.org/2000/svg'
type Clef = 'treble' | 'bass'

const G = {
  gClef: '',
  fClef: '',
  head: ['', '', ''], // whole, half, black
  sharp: '',
  flat: '',
  natural: '',
  dot: '',
  rest: ['', '', '', ''], // quarter, 8th, 16th, 32nd
  restWhole: '',
  restHalf: '',
  digit: (d: number) => String.fromCharCode(0xe080 + d),
  tuplet: (d: number) => String.fromCharCode(0xe880 + d),
}
const digits = (s: string) => s.split('').map((c) => G.digit(Number(c))).join('')
// a score's marks: articulation above and below (with half its height, to centre it), dynamic letters
const ART = { stac: ['\ue4a2', '\ue4a3', 1.7], ten: ['\ue4a4', '\ue4a5', 1], acc: ['\ue4a0', '\ue4a1', 4.9] } as const
const DYN: Record<string, string> = { p: '\ue520', m: '\ue521', f: '\ue522', r: '\ue523', s: '\ue524', z: '\ue525' }

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent: Element, text?: string) {
  const e = document.createElementNS(NS, tag)
  for (const k in attrs) e.setAttribute(k, String(attrs[k]))
  if (text !== undefined) e.textContent = text
  parent.appendChild(e)
  return e
}

interface Placed {
  head: SVGElement
  grp: SVGElement // everything of the chord: dimmed as one once it has been played
  dy: number
  up: boolean
  want?: number
  x: number
  y: number
}

const MAX_H = 330 // px: the staff beside the keys never needs more; a tall portrait pane would blow a two-bar window up to fill it (a staff space is about 17 px here)

/** Paints a Layout as SVG and keeps the per-frame state (cursor, dimming, marks). The layout is rebuilt only when the window changes. */
export class Staff {
  private svg: SVGSVGElement
  private cursor!: SVGLineElement
  private curtain?: SVGRectElement
  private L?: Layout
  private an?: Analysis
  private anKey = ''
  private cfgKey = ''
  private dirty = true
  private seen = 0
  private lastT = 0
  onDense?: () => void // the player tapped the 'too dense' hint: the app steps Simplify up
  private timeline: { t: number; el: SVGElement }[] = []
  private byId = new Map<number, Placed>()
  private all: Placed[] = []
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
    this.dirty = true
    this.frame()
  }

  /** The bar that asks for the most room, and the bars on show that had to be squeezed past reading: for a Simplify control. */
  get densest(): { bar: number; columns: number; units: number; shown: number[] } | undefined {
    const d = this.an && densest(this.an)
    return d && { ...d, shown: this.L?.bars.filter((b) => b.dense).map((b) => b.i) ?? [] }
  }

  frame() {
    const { song, t } = this.game
    const bar = Math.max(0, barAt(song.bars, Math.max(0, t)))
    const back = t < this.lastT - 0.05 // a seek or loop wrap: rebuild so played-note dimming resets
    this.lastT = t
    const L = this.L
    const key = `${this.game.view}|${this.game.mode}|${song.id}`
    const out = !!L && (L.follow ? bar !== L.from : bar < L.from || bar >= L.to)
    if (this.dirty || back || out || key !== this.cfgKey) {
      this.cfgKey = key
      this.build(bar)
    }
    if (!this.L) return
    this.moveCursor()
    this.markAwaited()
    this.peek()
    this.memo()
    // dim the notes already played
    for (; this.seen < this.timeline.length && this.timeline[this.seen].t < t - 0.02; this.seen++) this.timeline[this.seen].el.classList.add('past')
  }

  /** Sight Run's reading ahead: only the next `lookahead` beats of notes show (a paced run at two beats a card sets twice its cards), the rest stay blank until the cursor nears them. 0 shows everything; below 0 covers the next beats instead (Read ahead stages). */
  lookahead = 0
  /** Read through's reading ahead: once the music moves, only the bar being played and the next `aheadBars - 1` show. 0 shows everything. */
  aheadBars = 0
  private barEls: [number, Element][] = [] // chords, beams, rests, ties and brackets by bar, for aheadBars and hideBar
  private peeked = -2
  /** Memorise: bars whose notes are hidden. Hand in a new function to change which; a rebuild applies it again. */
  hideBar?: (bar: number) => boolean
  private memFn?: (bar: number) => boolean
  private memo() {
    if (this.hideBar === this.memFn) return
    this.memFn = this.hideBar
    for (const [bar, e] of this.barEls) e.classList.toggle('mem', !!this.hideBar?.(bar))
  }
  private peek() {
    const g = this.game
    if (this.aheadBars && g.mode !== 'read') {
      const b = g.phase === 'ready' ? -1 : barAt(g.song.bars, Math.max(0, g.t))
      if (b === this.peeked) return
      this.peeked = b
      for (const [bar, e] of this.barEls) e.classList.toggle('ahead', b >= 0 && bar >= b + this.aheadBars)
      return
    }
    const n = g.mode === 'read' ? this.lookahead : 0
    const i = n ? g.judge.nextPending() : -1
    if (i === this.peeked) return
    this.peeked = i
    const t0 = i >= 0 ? g.song.notes[i].t : 0
    // a negative lookahead covers instead: once the first card is played, the next -n beats are hidden, so they must be read ahead
    const hide = (d: number) => (n > 0 ? d > n - 0.5 : t0 > 0 && d >= 0 && d < -n - 0.5 && !(d === 0 && g.song.notes[i] === this.shown))
    for (const [id, p] of this.byId) p.grp.classList.toggle('ahead', i >= 0 && hide((g.song.notes[id].t - t0) / g.song.spb)) // in beats: a deck at 60 bpm is a second a beat, a paced one is not
  }

  /** A wrong key on a covered card shows it again, so a forgotten note never strands the player (the card already counts as missed). */
  private shown?: object // the awaited note of the covered card a wrong key showed (a new song has new notes)
  uncover() {
    const i = this.game.judge.nextPending()
    if (this.lookahead >= 0 || i < 0) return
    this.shown = this.game.song.notes[i]
    this.peeked = -2
    this.peek()
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
    for (const id of this.awaiting) if (!need.has(id)) this.byId.get(id)?.head.classList.remove('await')
    for (const id of need) if (!this.awaiting.has(id)) this.byId.get(id)?.head.classList.add('await')
    this.awaiting = need
  }

  /** Where a moment in time sits on the page: x, and the offset of its system. */
  private posAt(t: number): { x: number; dy: number; sys: number } {
    const L = this.L!
    const bars = this.game.song.bars
    return L.posAt(Math.min(Math.max(t, bars[L.from].t0), bars[L.to - 1].t1))
  }

  private moveCursor() {
    const L = this.L!
    const { x, dy, sys } = this.posAt(this.game.t)
    const cx = Math.min(x, L.systems[sys].x1) - (this.game.mode === 'read' ? 16 : 0) // drills: park it just before the card
    const notes = this.svg.querySelector('.notes')
    if (this.game.hidePlayed && this.curtain && notes) {
      this.curtain.setAttribute('x', String(cx))
      this.curtain.setAttribute('width', String(Math.max(0, L.w - cx)))
      notes.setAttribute('clip-path', 'url(#ahead)')
    } else notes?.removeAttribute('clip-path')
    this.cursor.setAttribute('x1', String(cx))
    this.cursor.setAttribute('x2', String(cx))
    const top = L.base[L.clefs[0]] - 4 * S
    const bottom = L.base[L.clefs[L.clefs.length - 1]]
    this.cursor.setAttribute('y1', String(dy + top - 12))
    this.cursor.setAttribute('y2', String(dy + bottom + 12))
  }

  private cfg(r: DOMRect): Cfg {
    const sheet = this.game.view === 'sheet'
    return { view: sheet ? 'sheet' : 'both', px: { w: r.width, h: sheet ? r.height : Math.min(r.height, MAX_H) }, zoom: settings.zoom }
  }

  /** The staff size at which the whole piece shows, between `lo` and `hi`. */
  fit(lo: number, hi: number): number {
    return this.an ? fitZoom(this.an, this.cfg(this.host.getBoundingClientRect()), lo, hi) : settings.zoom
  }

  private build(bar: number) {
    const { song, mode } = this.game
    const r = this.host.getBoundingClientRect()
    this.dirty = false
    if (!r.width || !r.height) return // hidden: the resize observer calls render() when it shows
    const read = mode === 'read'
    const { hands, parts } = this.game
    const key = `${song.id}|${read}|${hands.R}|${hands.L}|${[...parts]}`
    if (!this.an || this.an.song !== song || key !== this.anKey) {
      this.an = analyze(song, { read, hide: (n) => this.game.modeOf(n) === 'hide' })
      this.anKey = key
    }
    const cfg = this.cfg(r)
    if (this.an.pages.size > 6) this.an.pages.clear() // one entry per window size seen
    this.L = layout(this.an, windowFor(this.an, bar, cfg), cfg)
    this.paint(this.L)
  }

  private paint(L: Layout) {
    const svg = this.svg
    svg.replaceChildren()
    svg.setAttribute('viewBox', `0 0 ${L.w} ${L.h}`)
    svg.style.height = this.game.view === 'sheet' ? '' : `min(100%, ${MAX_H}px)`
    this.byId.clear()
    this.barEls = []
    this.all = []
    this.timeline = []
    this.awaiting.clear()
    this.peeked = -2
    this.memFn = undefined
    this.ghosts.clear() // the page was redrawn: the ghosts went with it
    this.seen = 0
    const { base, clefs } = L
    const top = base[clefs[0]] - 4 * S
    const bottom = base[clefs[clefs.length - 1]]
    const dyOf = (sys: number) => L.systems[sys].dy
    const barOf = (sys: number, x: number) => L.bars.find((b) => b.sys === sys && x < b.xEnd)?.i ?? -1 // ties and brackets go with the bar they start in

    L.systems.forEach((sy, si) => {
      const dy = sy.dy
      const lines = el('g', { class: 'lines' }, svg)
      for (const clef of clefs) {
        for (let i = 0; i < 5; i++) el('line', { x1: 8, x2: sy.x1, y1: dy + base[clef] - i * S, y2: dy + base[clef] - i * S }, lines)
      }
      el('line', { x1: 8, x2: 8, y1: dy + top, y2: dy + bottom }, lines)

      const sym = el('g', { class: 'sym' }, svg)
      for (const s of L.signs.filter((x) => x.sys === si)) {
        const glyph = s.kind === 'gClef' ? G.gClef : s.kind === 'fClef' ? G.fClef : s.kind === 'digits' ? digits(s.text!) : G[s.kind]
        el('text', { x: s.x, y: dy + s.y, class: 'smufl' }, sym, glyph)
      }

      const bl = el('g', { class: 'bars' }, svg)
      const mine = L.bars.filter((b) => b.sys === si)
      for (const b of mine) {
        for (const clef of clefs) el('line', { x1: b.x, x2: b.x, y1: dy + base[clef] - 4 * S, y2: dy + base[clef] }, bl)
        el('text', { x: b.x + 4, y: b.numY + dy, class: 'barno' }, bl, String(b.i + 1))
        if (b.dense) {
          const t = el('text', { x: b.x + 6 + String(b.i + 1).length * 8, y: b.numY + dy, class: 'barno dense', role: 'button', tabindex: 0, 'aria-label': 'Too dense: show fewer notes' }, bl, 'Too dense: tap to thin')
          t.addEventListener('click', () => this.onDense?.())
        }
      }
      const last = mine[mine.length - 1]
      if (last) {
        const end = L.finalBar && last.i === this.game.song.bars.length - 1
        for (const clef of clefs) {
          el('line', { x1: last.xEnd, x2: last.xEnd, y1: dy + base[clef] - 4 * S, y2: dy + base[clef] }, bl)
          if (end) el('line', { x1: last.xEnd - 4.5, x2: last.xEnd - 4.5, y1: dy + base[clef] - 4 * S, y2: dy + base[clef] }, bl)
        }
        if (end) for (const clef of clefs) el('rect', { class: 'fin', x: last.xEnd - 3, y: dy + base[clef] - 4 * S - 0.7, width: 3, height: 4 * S + 1.4 }, bl)
      }
    })

    this.traces(L)
    // the cursor is the bottom layer, under the staff lines as well as the notes: a guide, never a mark on the music
    this.cursor = el('line', { class: 'cursor', y1: top - 12, y2: bottom + 12 }, svg) as SVGLineElement
    svg.prepend(this.cursor)
    const g = el('g', { class: 'notes' }, svg)
    for (const c of L.chords) this.chord(g, c, dyOf(c.sys))
    for (const b of L.beams) {
      const dy = dyOf(b.sys)
      for (const r of b.rows) this.barEls.push([b.chords[0]?.bar ?? 0, el('path', { class: 'beam', d: `M${r.x1},${r.y1 + dy} L${r.x2},${r.y2 + dy} L${r.x2},${r.y4 + dy} L${r.x1},${r.y3 + dy} Z` }, g)])
    }
    for (const r of L.rests) {
      const fi = figure(r.v, r.tup)
      const glyph = r.whole || fi.head === 0 ? G.restWhole : fi.head === 1 ? G.restHalf : G.rest[Math.min(fi.flags, 3)]
      this.barEls.push([r.bar, el('text', { class: 'smufl rest', x: r.x, y: r.y + dyOf(r.sys), 'text-anchor': 'middle' }, g, glyph)])
      if (!r.whole && fi.dots) this.barEls.push([r.bar, el('text', { class: 'smufl', x: r.x + 9, y: r.y + dyOf(r.sys) - (fi.head === 2 ? 4 : 0) }, g, G.dot)])
    }
    for (const t of L.ties) {
      const dy = dyOf(t.sys)
      const dir = t.below ? 1 : -1
      const h = Math.min(7, 3 + (t.x2 - t.x1) * 0.06)
      const m = (t.x1 + t.x2) / 2
      const y = t.y + dy
      this.barEls.push([barOf(t.sys, t.x1), el('path', { class: `tie${t.open ? ' open' : ''}`, d: `M${t.x1},${y} Q${m},${y + dir * 2 * h} ${t.x2},${y} Q${m},${y + dir * (2 * h - 2.4)} ${t.x1},${y} Z` }, g)])
    }
    for (const t of L.tuplets) {
      const dy = dyOf(t.sys)
      const m = (t.x1 + t.x2) / 2
      const y = t.y + dy
      if (t.bracket) {
        const hook = t.up ? 5 : -5
        this.barEls.push([barOf(t.sys, t.x1), el('path', { class: 'tup', d: `M${t.x1},${y + hook} L${t.x1},${y} L${m - 8},${y} M${m + 8},${y} L${t.x2},${y} L${t.x2},${y + hook}` }, g)])
      }
      this.barEls.push([barOf(t.sys, t.x1), el('text', { class: 'smufl tupn', x: m, y: y + 6, 'text-anchor': 'middle' }, g, G.tuplet(t.num))])
    }
    for (const o of L.ottavas) {
      const dy = dyOf(o.sys)
      const hook = o.below ? -6 : 6
      this.barEls.push([barOf(o.sys, o.x1), el('text', { class: 'ott', x: o.x1 - 6, y: o.y + dy + 5 }, g, o.label)])
      this.barEls.push([barOf(o.sys, o.x1), el('path', { class: 'ottl', d: `M${o.x1 + o.label.length * 7 + 2},${o.y + dy} L${o.x2},${o.y + dy} L${o.x2},${o.y + dy + hook}` }, g)])
    }
    this.marks(g, L, barOf)
    for (const c of L.syms) el('text', { class: 'cname', x: c.x, y: c.y + dyOf(c.sys) }, svg, c.name)
    this.timeline.sort((a, b) => a.t - b.t)

    this.dynamics()
    // a curtain behind the cursor: with Hide played on, notes vanish as you play them, which trains reading ahead
    const clip = el('clipPath', { id: 'ahead' }, svg)
    this.curtain = el('rect', { x: 0, y: 0, width: L.w, height: L.h }, clip) as SVGRectElement

    // marks that survive a rebuild: notes already missed this pass
    for (const [id, p] of this.byId) {
      const note = this.game.song.notes[id]
      const gr = this.game.judge.grade[id]
      if (this.game.judge.st[id] === 2) this.flag(id, p, 'miss')
      else if (note && note.t < this.game.t - 0.02) {
        p.grp.classList.add('past')
        if (gr && gr !== 'perfect') this.shape(id, p, gr)
      }
    }
  }

  /** Everything of one chord: ledger lines, stem, flag, heads, accidentals, dots. */
  private chord(parent: Element, c: LChord, dy: number) {
    const g = el('g', { class: 'ch' }, parent)
    this.barEls.push([c.bar, g])
    const small = c.grace
    for (const l of c.ledgers) el('line', { class: 'ledger', x1: l.x1, x2: l.x2, y1: l.y + dy, y2: l.y + dy }, g)
    if (c.stem) {
      el('line', { class: 'stem', x1: c.stem.x, x2: c.stem.x, y1: c.stem.y1 + dy, y2: c.stem.y2 + dy }, g)
      if (c.slash) el('line', { class: 'stem', x1: c.stem.x - 4.5, x2: c.stem.x + 4.5, y1: c.stem.y2 + dy + 10, y2: c.stem.y2 + dy + 4 }, g) // the slash
    }
    if (c.flag) el('text', { class: `smufl${small ? ' small' : ''}`, x: c.flag.x, y: c.flag.y + dy }, g, String.fromCharCode(c.flag.glyph))
    for (const h of c.heads) {
      const app = h.ids.length > 0 && h.ids.every((id) => this.game.modeOf(this.game.song.notes[id]) === 'listen') // the app plays it: dimmed
      const e = el('text', { class: `smufl head${small ? ' small' : ''}${h.cont ? ' cont' : ''}${app ? ' app' : ''}`, x: h.x, y: h.y + dy, 'text-anchor': 'middle' }, g, G.head[h.kind])
      const p: Placed = { head: e, grp: g, dy, up: h.up, want: h.want, x: h.x, y: h.y + dy }
      this.all.push(p)
      if (h === c.heads[0]) this.timeline.push({ t: h.t, el: g })
      if (!h.cont && !small) for (const id of h.ids) this.byId.set(id, p)
      if (!h.cont && !small) e.setAttribute('data-id', String(h.ids[0]))
      const f = !h.cont && !small ? this.game.song.notes[h.ids[0]]?.f : undefined // scales: the finger to use, on the side away from the stem
      if (f) el('text', { class: 'finger', x: h.x, y: h.y + dy + (h.up ? 27 : -19), 'text-anchor': 'middle' }, g, String(f))
    }
    for (const a of c.accs) el('text', { class: `smufl acc${a.grace ? ' small' : ''}`, x: a.x, y: a.y + dy, 'text-anchor': 'middle' }, g, G[a.glyph])
    for (const d of c.dots) el('text', { class: 'smufl', x: d.x, y: d.y + dy }, g, G.dot)
    if (c.art) {
      const [above, below, half] = ART[c.art.kind]
      el('text', { class: 'smufl mk', x: c.art.x, y: c.art.y + dy + (c.art.above ? half : -half), 'text-anchor': 'middle' }, g, c.art.above ? above : below)
    }
  }

  /** What a score writes about touch beyond the notes: slurs, hairpins, dynamic letters. Ink at 70%, never a hue. */
  private marks(g: Element, L: Layout, barOf: (sys: number, x: number) => number) {
    const dyOf = (sys: number) => L.systems[sys].dy
    for (const s of L.slurs) {
      const P = (x: number, y: number) => `${x},${y + dyOf(s.sys)}`
      const t = s.above ? 2.4 : -2.4 // thickest in the middle, toward the notes
      this.barEls.push([barOf(s.sys, s.x1), el('path', { class: 'mk slur', d: `M${P(s.x1, s.y1)} C${P(...s.c1)} ${P(...s.c2)} ${P(s.x2, s.y2)} C${P(s.c2[0], s.c2[1] + t)} ${P(s.c1[0], s.c1[1] + t)} ${P(s.x1, s.y1)} Z` }, g)])
    }
    for (const w of L.wedges) {
      const y = w.y + dyOf(w.sys)
      this.barEls.push([barOf(w.sys, w.x1), el('path', { class: 'mk hp', d: `M${w.x2},${y - w.w2} L${w.x1},${y - w.w1} M${w.x1},${y + w.w1} L${w.x2},${y + w.w2}` }, g)])
    }
    for (const d of L.dyns) this.barEls.push([barOf(d.sys, d.x), el('text', { class: 'smufl mk', x: d.x, y: d.y + dyOf(d.sys) + 5, 'text-anchor': 'middle' }, g, [...d.text].map((c) => DYN[c] ?? '').join(''))])
  }

  /** Technique exercises: the dynamic to aim for. Words go between the staves (above a lone staff) at the left of the system, accents sit on the notes. */
  private dynamics() {
    const dyn = this.game.song.dyn
    const L = this.L
    if (!dyn || !L || !this.all.length) return
    const g = el('g', { class: 'dyn', 'aria-hidden': 'true' }, this.svg)
    const mid = L.base.treble + (L.base.bass - 4 * S - L.base.treble) / 2 // halfway between the staves
    if (dyn === 'accent') {
      for (const p of this.all) {
        if ((p.want ?? 0) <= 60) continue
        const y = p.y + (p.up ? 15 : -15) // opposite the stem
        el('path', { d: `M${p.x - 6},${y - 4} L${p.x + 5},${y} L${p.x - 6},${y + 4}` }, g)
      }
      return
    }
    // dynamic letters are Bravura glyphs; the words are italic text
    const word = { soft: '', medium: '', hard: '', cresc: 'cresc.', decresc: 'dim.' }[dyn]
    if (!word) return
    const lone = L.clefs.length === 1 // one staff: the mark sits above it, past the bar number, not across the middle of the staff
    for (const dy of new Set(this.all.map((p) => p.dy))) {
      const sy = L.systems.find((s) => s.dy === dy)!
      el('text', { x: sy.x0 + (lone ? 30 : 4), y: dy + (lone ? L.base[L.clefs[0]] - 4 * S - 6 : (sy.aim ?? mid) + (word.length > 1 ? 1 : 5)), class: word.length > 1 ? 'wd' : 'smufl' }, g, word)
    }
  }

  /** Where a key struck at song time `t` sits on the page. */
  private place(pitch: number, t: number) {
    const L = this.L!
    const pos = this.posAt(t)
    const sp = spell(pitch, this.an?.bars[Math.min(Math.max(L.from, barAt(this.game.song.bars, t)), L.to - 1)]?.fifths ?? this.game.song.fifths)
    const want: Clef = pitch >= 60 ? 'treble' : 'bass'
    const clef = L.clefs.includes(want) ? want : L.clefs[0] // a one-clef drill has only its own staff
    const step = Math.min(BOTTOM_STEP[clef] + 8 + 14, Math.max(BOTTOM_STEP[clef] - 14, sp.step)) // further out would leave the page
    return { pos, sp, clef, step, y: yOf(step, clef, L.base) + pos.dy }
  }

  /** Ghost: a dim dot where each key went down last time, behind the heads, so early or late shows beside the note. */
  private traces(L: Layout) {
    const gh = this.game.ghost
    const bars = this.game.song.bars
    if (!gh) return
    const g = el('g', { class: 'traces', 'aria-hidden': 'true' }, this.svg)
    gh.t.forEach((t, j) => {
      if (t < bars[L.from].t0 || t >= bars[L.to - 1].t1) return
      const { pos, y } = this.place(gh.p[j], t)
      el('circle', { cx: pos.x, cy: y, r: 3 }, g)
    })
  }

  /** A hollow dashed notehead where you pressed a key: not part of the score, but the note you played. */
  ghost(pitch: number, t: number) {
    const L = this.L
    const { bars } = this.game.song
    if (!L || !bars.length) return
    this.ghosts.get(pitch)?.remove()
    const { pos, sp, clef, step, y } = this.place(pitch, t)
    const g = el('g', { class: 'ghost' }, this.svg) as SVGGElement
    g.style.transform = `translate(${pos.x}px, ${y}px)`
    g.setAttribute('aria-hidden', 'true')
    const bottom = BOTTOM_STEP[clef]
    const off = (st: number) => yOf(st, clef, L.base) + pos.dy - y
    for (let st = bottom - 2; st >= step; st -= 2) el('line', { x1: -11, x2: 11, y1: off(st), y2: off(st) }, g)
    for (let st = bottom + 10; st <= step; st += 2) el('line', { x1: -11, x2: 11, y1: off(st), y2: off(st) }, g)
    el('ellipse', { rx: 6.4, ry: 4.7, transform: 'rotate(-20)' }, g)
    if (sp.acc !== keyAcc(this.an?.bars[L.from]?.fifths ?? this.game.song.fifths)[sp.letter]) el('text', { class: 'smufl', x: -16, y: 0, 'text-anchor': 'middle' }, g, sp.acc > 0 ? G.sharp : sp.acc < 0 ? G.flat : G.natural)
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
  grade(noteId: number, grade: string | null, off: number, touch?: string) {
    const p = this.byId.get(noteId)
    const L = this.L
    if (!p || !L) return
    const staffTop = p.dy + L.base[L.clefs[0]] - 4 * S - 12
    // clear of the highest ink on the page (beams, stems, ledger lines), but inside the view
    const ink = (this.svg.querySelector('.notes') as SVGGraphicsElement | null)?.getBBox().y ?? staffTop
    const y = Math.max(16, Math.min(staffTop, ink - 10))
    const word = grade ? (grade === 'perfect' ? 'Perfect' : grade === 'great' ? 'Great' : grade === 'late' ? 'Late' : 'Good') : ''
    const arrow = !grade || grade === 'perfect' || grade === 'late' ? '' : off < 0 ? ' ‹' : ' ›' // early or late
    const t = el('text', { class: 'gr', 'data-g': grade ?? (touch === 'touch ✓' ? 'perfect' : 'good'), x: p.x, y }, this.svg, [word + arrow, touch].filter(Boolean).join(' · '))
    t.setAttribute('aria-hidden', 'true')
    t.addEventListener('animationend', () => t.remove())
  }

  private flag(id: number, p: Placed, cls: string) {
    p.head.classList.add(cls)
    if (cls === 'miss') {
      if (p.head.parentElement?.querySelector(`.miss-mark[data-id="${id}"]`)) return
      const y = p.y + 12
      const m = el('path', { class: 'miss-mark', 'data-id': id, d: `M${p.x - 4},${y + 5} L${p.x + 4},${y + 5} L${p.x},${y - 2} Z` }, p.head.parentElement!)
      m.setAttribute('aria-hidden', 'true')
    }
  }

  /** A small shape under a note that was Great, Good or Late, so the grade outlives its colour. */
  private shape(id: number, p: Placed, grade: string) {
    if (p.head.parentElement?.querySelector(`.gshape[data-id="${id}"]`)) return
    const { x } = p
    const y = p.y + 13
    const d = grade !== 'great' ? `M${x},${y - 3} L${x + 3},${y} L${x},${y + 3} L${x - 3},${y} Z` : `M${x - 2.6},${y} a2.6,2.6 0 1,0 5.2,0 a2.6,2.6 0 1,0 -5.2,0`
    const m = el('path', { class: `gshape ${grade}`, 'data-id': id, d }, p.head.parentElement!)
    m.setAttribute('aria-hidden', 'true')
  }

  /** Struck louder or softer than the notes around it: a small triangle over the head (louder) or under it (softer), in ink, so no colour is spent. */
  dev(noteId: number, d: number) {
    const p = this.byId.get(noteId)
    if (!p || p.head.parentElement?.querySelector(`.devmark[data-id="${noteId}"]`)) return
    const { x } = p
    const y = d > 0 ? p.y - 15 : p.y + 15
    const up = d > 0
    const m = el('path', { class: 'devmark', 'data-id': noteId, d: up ? `M${x - 3.5},${y + 2.5} L${x + 3.5},${y + 2.5} L${x},${y - 3} Z` : `M${x - 3.5},${y - 2.5} L${x + 3.5},${y - 2.5} L${x},${y + 3} Z` }, p.head.parentElement!)
    m.setAttribute('aria-hidden', 'true')
  }

  /** A note whose key came up early gets a red outline; a note held through gets nothing. */
  cut(noteId: number) {
    this.byId.get(noteId)?.head.classList.add('short')
  }

  /** A key held past its written end: an orange outline, the counterpart of the red one for letting go early. */
  over(noteId: number) {
    this.byId.get(noteId)?.head.classList.add('over')
  }

  mark(noteId: number, cls: string) {
    const p = this.byId.get(noteId)
    if (!p) return
    if (cls === 'miss') return this.flag(noteId, p, 'miss')
    const h = p.head
    h.classList.remove('hit-perfect', 'hit-great', 'hit-good', 'hit-ok')
    void h.getBoundingClientRect()
    h.classList.add(cls)
    if (cls !== 'hit-perfect' && cls !== 'hit-ok') this.shape(noteId, p, cls.slice(4))
  }
}
