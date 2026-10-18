import { Application, Container, Graphics, Sprite, Text, Texture } from 'pixi.js'
import type { Game } from './game'
import type { Grade } from './judge'
import { C } from './palette'
import { settings } from './settings'
import { noteName } from './spell'

const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)')

interface K {
  p: number
  x: number
  w: number
  black: boolean
}

interface Spark {
  s: Sprite
  vx: number
  vy: number
  life: number
  max: number
  grow?: number // glows scale from `from` to `grow` instead of flying
  from?: number
}

const BLACK = new Set([1, 3, 6, 8, 10])
const isBlack = (p: number) => BLACK.has(p % 12)
const gradeColor: Record<Grade, number> = { perfect: C.perfect, great: C.great, good: C.good, miss: C.bad }

function radial(size: number, stops: [number, string][]): Texture {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  for (const [o, col] of stops) r.addColorStop(o, col)
  g.fillStyle = r
  g.fillRect(0, 0, size, size)
  return Texture.from(c)
}

export class Highway {
  app!: Application
  keys = new Map<number, K>()
  whites: K[] = []
  W = 0
  H = 0 // highway height; the keyboard sits below it
  kbH = 0
  private lanes = new Graphics()
  private grid = new Graphics()
  private flash = new Graphics()
  private notes = new Graphics()
  private rec = new Graphics()
  private kb = new Graphics()
  private fxLayer = new Container()
  private labels = new Container()
  private glowTex!: Texture
  private sparkTex!: Texture
  private bgGlow!: Sprite
  private sparks: Spark[] = []
  private flashes = new Map<number, { at: number; color: number; power: number }>()
  private wrongs = new Map<number, number>()
  private keyHue = new Map<number, number>()
  private labelTex = new Map<string, Texture>()
  private labelPool: Sprite[] = []
  private clock = 0
  onFrame = () => {}

  constructor(
    private host: HTMLElement,
    private game: Game,
  ) {}

  async init() {
    this.app = new Application()
    await this.app.init({
      resizeTo: this.host,
      background: C.ground,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    })
    this.host.appendChild(this.app.canvas)
    this.app.canvas.setAttribute('aria-hidden', 'true')
    this.glowTex = radial(128, [[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,.45)'], [1, 'rgba(255,255,255,0)']])
    this.sparkTex = radial(32, [[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,.6)'], [1, 'rgba(255,255,255,0)']])
    this.bgGlow = new Sprite(this.glowTex)
    this.bgGlow.blendMode = 'add'
    this.bgGlow.tint = C.lamp
    this.bgGlow.alpha = 0
    this.fxLayer.blendMode = 'add'
    this.app.stage.addChild(this.bgGlow, this.lanes, this.grid, this.flash, this.notes, this.kb, this.rec, this.fxLayer, this.labels)
    this.app.renderer.on('resize', () => this.layout())
    new ResizeObserver(() => this.app.resize()).observe(this.host)
    this.layout()
    this.app.ticker.add((t) => this.draw(t.deltaMS))
  }

  /** The effects level, capped to Calm while the OS asks for reduced motion. */
  private effects(): 0 | 1 | 2 | 3 {
    return reducedMotion && reducedMotion.matches ? (Math.min(settings.fx, 1) as 0 | 1) : settings.fx
  }

  /** Pick the visible key range and place every key. Call on resize and song change. */
  layout() {
    const song = this.game.song
    if (!song || !this.app) return
    this.W = this.app.screen.width
    const fullH = this.app.screen.height
    let lo = 21
    let hi = 108
    if (!settings.full) {
      lo = song.lo - 2
      hi = song.hi + 2
      while (hi - lo < 35) {
        lo--
        hi++
      }
      while (isBlack(lo)) lo--
      while (isBlack(hi)) hi++
      lo = Math.max(21, lo)
      hi = Math.min(108, hi)
    }
    this.whites = []
    this.keys.clear()
    let n = 0
    for (let p = lo; p <= hi; p++) if (!isBlack(p)) n++
    const ww = Math.min(this.W / n, 76)
    const x0 = (this.W - ww * n) / 2
    let i = 0
    for (let p = lo; p <= hi; p++) {
      if (isBlack(p)) continue
      const k = { p, x: x0 + i * ww, w: ww, black: false }
      this.keys.set(p, k)
      this.whites.push(k)
      i++
    }
    const bw = ww * 0.62
    for (let p = lo; p <= hi; p++) {
      if (!isBlack(p)) continue
      const left = this.keys.get(p - 1)
      if (left) this.keys.set(p, { p, x: left.x + ww - bw / 2, w: bw, black: true })
    }
    // sheet view gives the stage to the keyboard alone; otherwise the highway needs most of it
    this.kbH = this.game.view === 'sheet' ? Math.max(fullH - 8, 60) : Math.min(Math.max(ww * 4.2, 92), fullH * 0.24)
    this.H = fullH - this.kbH

    this.lanes.clear()
    this.whites.forEach((k, j) => {
      this.lanes.rect(k.x, 0, k.w, this.H).fill(j % 2 ? C.laneB : C.laneA)
      if (k.p % 12 === 0) this.lanes.rect(k.x, 0, 1.5, this.H).fill({ color: C.grid, alpha: 0.7 })
    })
    this.bgGlow.width = this.W * 1.4
    this.bgGlow.height = fullH * 1.2
    this.bgGlow.position.set(-this.W * 0.2, -fullH * 0.1)
    this.labelTex.clear()
  }

  get recY() {
    return this.H
  }

  center(p: number): number {
    const k = this.keys.get(p)
    return k ? k.x + k.w / 2 : -100
  }

  /** Called by the UI for each game event. */
  hit(p: number, grade: Grade | 'ok', hand: 'R' | 'L') {
    const k = this.keys.get(p)
    if (!k) return
    const color = grade === 'ok' ? C[hand] : gradeColor[grade]
    this.keyHue.set(p, C[hand])
    const fx = this.game.view === 'sheet' ? 0 : this.effects() // sheet view stays calm: the staff carries the feedback
    this.flashes.set(p, { at: this.clock, color: C[hand], power: grade === 'perfect' ? 1 : 0.7 })
    if (fx === 0) return
    this.glow(k.x + k.w / 2, this.H, color, 1.1 + (grade === 'perfect' ? 0.5 : 0))
    if (fx >= 2) this.burst(k.x + k.w / 2, this.H, color, fx === 3 ? 18 : 9)
  }

  /** The key under a point on the canvas (black keys sit on top), if it is over the keyboard. */
  keyAt(x: number, y: number): { p: number; vel: number } | undefined {
    const top = this.H + 4
    if (y < top || y > this.app.screen.height) return undefined
    const blackH = this.kbH * 0.6
    let hit: K | undefined
    if (y < top + blackH) hit = [...this.keys.values()].find((k) => k.black && x >= k.x && x < k.x + k.w)
    hit ??= this.whites.find((k) => x >= k.x && x < k.x + k.w)
    if (!hit) return undefined
    const kh = hit.black ? blackH : this.kbH - 4
    return { p: hit.p, vel: 0.4 + 0.5 * Math.min(1, Math.max(0, (y - top) / kh)) } // lower on the key plays louder
  }

  wrong(p: number) {
    this.wrongs.set(p, this.clock)
  }

  private glow(x: number, y: number, color: number, scale: number) {
    const s = new Sprite(this.glowTex)
    s.anchor.set(0.5)
    s.tint = color
    s.position.set(x, y)
    const base = (Math.max(this.W / Math.max(this.whites.length, 1), 24) / 128) * 2 * scale
    s.scale.set(base)
    this.fxLayer.addChild(s)
    this.sparks.push({ s, vx: 0, vy: 0, life: 0.38, max: 0.38, grow: base * 1.9, from: base })
  }

  private burst(x: number, y: number, color: number, n: number) {
    for (let i = 0; i < n; i++) {
      const s = new Sprite(this.sparkTex)
      s.anchor.set(0.5)
      s.tint = color
      s.scale.set(0.25 + Math.random() * 0.35)
      s.position.set(x + (Math.random() - 0.5) * 10, y)
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.8
      const v = 120 + Math.random() * 260
      this.fxLayer.addChild(s)
      this.sparks.push({ s, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5, max: 0.5 })
    }
  }

  private label(text: string, color: number, size: number): Sprite {
    const key = text
    let tex = this.labelTex.get(key)
    if (!tex) {
      const t = new Text({ text, style: { fontFamily: 'Barlow Condensed', fontWeight: '700', fontSize: 28, fill: 0xffffff } })
      tex = this.app.renderer.generateTexture({ target: t, resolution: 2 })
      this.labelTex.set(key, tex)
      t.destroy()
    }
    const s = this.labelPool[this.labelUsed] ?? this.labelPool[this.labelPool.push(new Sprite()) - 1]
    if (!s.parent) this.labels.addChild(s)
    this.labelUsed++
    s.texture = tex
    s.tint = color
    s.anchor.set(0.5)
    s.scale.set(size / 28)
    s.visible = true
    return s
  }
  private labelUsed = 0

  draw(dtMs: number) {
    const g = this.game
    if (!g.song || !this.W) return
    this.onFrame()
    const dt = dtMs / 1000
    this.clock += dt
    const T = g.t
    const H = this.H
    const look = settings.fall
    const pps = H / look
    const fx = this.effects()
    const hide = (g.mode === 'read' && !g.showNotes) || g.view === 'sheet' // reading drills and sheet view: no falling notes
    const names = g.mode === 'read' ? g.showNames : settings.names

    // ----- bar and beat lines
    const gr = this.grid
    gr.clear()
    const bars = g.song.bars
    for (let b = hide ? bars.length : Math.max(0, bars.findIndex((x) => x.t1 > T - 0.1)); b < bars.length && bars[b].t0 < T + look; b++) {
      const bar = bars[b]
      const beats = (bar.n * 4) / bar.den
      for (let k = 0; k < beats; k++) {
        const t = bar.t0 + (k * (bar.t1 - bar.t0)) / beats
        const y = H - (t - T) * pps
        if (y < 0 || y > H) continue
        gr.rect(0, y, this.W, k === 0 ? 2 : 1).fill({ color: C.grid, alpha: k === 0 ? 0.55 : 0.16 })
      }
    }

    // ----- lane tint for held / just-hit keys
    const fl = this.flash
    fl.clear()
    const lanePulse = (k: K, color: number, a: number) => {
      const h = H * 0.42
      for (let s = 0; s < 14; s++) fl.rect(k.x, H - h * ((s + 1) / 14), k.w, h / 14 + 0.5).fill({ color, alpha: (a * (14 - s)) / 14 / 1.7 })
    }
    for (const p of g.held.keys()) {
      const k = this.keys.get(p)
      if (k) lanePulse(k, this.keyHue.get(p) ?? C.held, 0.5)
    }
    for (const [p, f] of this.flashes) {
      const age = this.clock - f.at
      if (age > 0.9) {
        this.flashes.delete(p)
        continue
      }
      const k = this.keys.get(p)
      if (k && fx > 0) lanePulse(k, f.color, f.power * (1 - age / 0.9) ** 1.5)
    }

    // ----- notes
    const ng = this.notes
    ng.clear()
    this.labelUsed = 0
    const notes = g.song.notes
    let i0 = 0
    {
      let lo = 0
      let hi = notes.length
      const from = T - 10
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (notes[mid].t < from) lo = mid + 1
        else hi = mid
      }
      i0 = lo
    }
    const waiting = g.phase === 'waiting'
    const need = new Set<number>()
    const pulse = 0.55 + 0.45 * Math.sin(this.clock * 7)
    for (let i = hide ? notes.length : i0; i < notes.length; i++) {
      const n = notes[i]
      if (n.t > T + look) break
      const mode = g.hands[n.h]
      if (mode === 'hide') continue
      const k = this.keys.get(n.p)
      if (!k) continue
      const st = g.judge.st[i]
      const yb = H - (n.t - T) * pps
      const h = Math.max(n.d * pps * 0.96, 16)
      const yt = yb - h
      if (yt > this.app.screen.height) continue
      const hit = st === 1
      const y2 = hit ? Math.min(yb, H) : yb
      if (y2 - yt < 2) continue
      const col = C[n.h]
      const left = n.h === 'L'
      let a = 1
      if (mode === 'listen') a = 0.4
      else if (st === -1) a = 0.2
      else if (st === 2) a = 0.3
      const inset = k.black ? 1.5 : 3
      const x = k.x + inset
      const w = k.w - inset * 2
      const body = hit ? C.ink : col
      if (left) {
        ng.roundRect(x, yt, w, y2 - yt, 5).fill({ color: col, alpha: 0.42 * a })
        ng.roundRect(x + 1, yt + 1, w - 2, y2 - yt - 2, 4).stroke({ width: 2, color: hit ? C.ink : C.LEdge, alpha: a })
      } else {
        ng.roundRect(x, yt, w, y2 - yt, 5).fill({ color: body, alpha: 0.92 * a })
        if (!hit && y2 - yt > 12) ng.roundRect(x + 3, yt + 3, w - 6, y2 - yt - 11, 3).fill({ color: C.ink, alpha: 0.22 * a })
      }
      // the bright edge marks the moment to play
      if (!hit) ng.rect(x + 2, y2 - 5, w - 4, 3).fill({ color: C.ink, alpha: 0.85 * a })
      if (waiting && st === 0 && n.t <= T + 0.03) {
        ng.roundRect(x - 3, yt - 3, w + 6, y2 - yt + 6, 7).stroke({ width: 2.5, color: C.lamp, alpha: pulse })
        need.add(n.p)
      }
      if (names && y2 - yt >= 20 && w >= 20 && y2 > 0 && y2 <= H + 2 && st !== 1) {
        const s = this.label(noteName(n.p, g.song.fifths).replace(/\d/, ''), left ? col : C.ground, Math.min(18, w * 0.62))
        s.position.set(x + w / 2, y2 - 16)
        s.alpha = a
      }
    }
    for (let j = this.labelUsed; j < this.labelPool.length; j++) this.labelPool[j].visible = false

    // ----- receptor line with a lamp over every white key
    const rc = this.rec
    rc.clear()
    rc.rect(0, H - 16, this.W, 32).fill({ color: C.lamp, alpha: 0.1 })
    rc.rect(0, H - 8, this.W, 16).fill({ color: C.lamp, alpha: 0.2 })
    rc.rect(0, H - 4, this.W, 8).fill({ color: C.receptor, alpha: 1 })
    for (const k of this.whites) {
      const lit = g.held.has(k.p) || this.flashes.has(k.p) || need.has(k.p)
      rc.circle(k.x + k.w / 2, H, lit ? 5.5 : 3.2).fill({ color: lit ? C.lamp : C.muted, alpha: lit ? 1 : 0.9 })
    }

    // ----- keyboard
    const kb = this.kb
    kb.clear()
    const top = H + 4
    const draw = (k: K) => {
      const down = g.held.has(k.p)
      const auto = (g.autoUntil.get(k.p) ?? 0) > performance.now()
      const ghost = need.has(k.p)
      const kh = k.black ? this.kbH * 0.6 : this.kbH - 4
      let fill: number = k.black ? C.keyBlack : C.keyWhite
      const tint = this.keyHue.get(k.p) ?? C.held
      if (down) fill = mix(fill, tint, 0.78 * (0.5 + 0.5 * (g.held.get(k.p) ?? 0.7)))
      else if (auto) fill = mix(fill, C.R, 0.4)
      else if (ghost) fill = mix(fill, C.lamp, 0.35 + 0.3 * pulse)
      kb.roundRect(k.x + 1, top - 4, k.w - 2, kh + 4, 4).fill(fill)
      kb.roundRect(k.x + 1, top - 4, k.w - 2, kh + 4, 4).stroke({ width: 1, color: C.keyEdge })
      const wr = this.wrongs.get(k.p)
      if (wr !== undefined) {
        const age = this.clock - wr
        if (age > 0.4) this.wrongs.delete(k.p)
        else {
          const cx = k.x + k.w / 2
          const cy = top + kh * 0.45
          const r = Math.min(k.w * 0.28, 11)
          kb.moveTo(cx - r, cy - r).lineTo(cx + r, cy + r).moveTo(cx + r, cy - r).lineTo(cx - r, cy + r)
          kb.stroke({ width: 3.5, color: C.bad, alpha: 1 - age / 0.4 })
        }
      }
    }
    for (const k of this.whites) draw(k)
    for (const k of this.keys.values()) if (k.black) draw(k)
    if (names) {
      for (const k of this.whites) {
        const c = k.p % 12 === 0
        const s = this.label(c ? `C${Math.floor(k.p / 12) - 1}` : noteName(k.p, 0).replace(/\d/, ''), c ? C.ground : C.muted, Math.min(16, k.w * 0.5))
        s.position.set(k.x + k.w / 2, H + this.kbH - 16)
        s.alpha = 1
      }
    }
    for (let j = this.labelUsed; j < this.labelPool.length; j++) this.labelPool[j].visible = false

    // ----- ambient lamp glow grows with the multiplier (slow breathing, never a strobe)
    const mult = g.judge.combo >= 50 ? 3 : g.judge.combo >= 25 ? 2 : g.judge.combo >= 10 ? 1 : 0
    const target = fx >= 2 ? mult * 0.045 * (0.85 + 0.15 * Math.sin(this.clock * Math.PI)) : 0
    this.bgGlow.alpha += (target - this.bgGlow.alpha) * Math.min(1, dt * 3)

    // ----- sparks and glows
    for (let j = this.sparks.length - 1; j >= 0; j--) {
      const p = this.sparks[j]
      p.life -= dt
      if (p.life <= 0) {
        p.s.destroy()
        this.sparks.splice(j, 1)
        continue
      }
      const u = 1 - p.life / p.max
      if (p.grow !== undefined && p.from !== undefined) {
        p.s.scale.set(p.from + (p.grow - p.from) * (1 - (1 - u) ** 3))
        p.s.alpha = 0.85 * (1 - u)
      } else {
        p.vy += 520 * dt
        p.s.x += p.vx * dt
        p.s.y += p.vy * dt
        p.s.alpha = 1 - u
      }
    }
  }
}

function mix(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t)
}
