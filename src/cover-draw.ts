import type { Game } from './game'
import type { Layout } from './layout'
import { settings } from './settings'
import type { Song } from './song'
import { Staff } from './staff'
import { COVER, cropOf, type CoverSize } from './cover'

// The incipit, engraved by the app's own staff painter on an off-screen page and handed back as an SVG string. Nothing here lays out or draws a note:
// the same Layout and Staff that make the play screen make the cover, so a change to the engraving shows on both. What this file adds is the spec's fitting
// rule: bars as the layout chooses them at the cover's staff size, and where a bar is too dense for the width, a cut at the last complete beat.

const NS = 'http://www.w3.org/2000/svg'
const fake = { mode: 'learn', view: 'both', hands: { R: 'play', L: 'play' }, parts: new Set(), t: 0, phase: 'ready', ghost: null, hidePlayed: false, modeOf: () => 'play', judge: { grade: [], st: [], nextPending: () => -1, required: () => [] } } as unknown as Game
let page: { host: HTMLElement; staff: Staff } | undefined
const inner = (s: Staff) => s as unknown as { L: Layout; paint(L: Layout): void } // the laid-out page, and the painter that draws a layout (a `paintLayout(L)` on Staff would replace this)

/** `facts` stands in for the score when there is none: an empty staff with the clefs, the key signature and the time signature the catalogue gives. */
function empty(f: { fifths: number; meter: string }): Song {
  const [n, den] = /^(\d+)\/(\d+)$/.test(f.meter) ? f.meter.split('/').map(Number) : [4, 4]
  const ql = (n * 4) / den
  const bars = Array.from({ length: 8 }, (_, i) => ({ i, t0: i * ql, t1: (i + 1) * ql, n, den })) // eight, so the window never ends the piece
  return { id: 'cover-empty', title: '', notes: [], bars, end: 8 * ql, fifths: f.fifths, lo: 60, hi: 72, spb: 1 }
}

function render(song: Song, aspect: number) {
  if (!page) {
    const host = document.createElement('div')
    host.setAttribute('aria-hidden', 'true')
    host.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden;pointer-events:none'
    document.body.append(host)
    page = { host, staff: new Staff(host, fake) }
  }
  const { host, staff } = page
  const g = fake as unknown as { song: Song }
  g.song = song
  host.style.width = `${Math.round(166 * aspect)}px`
  host.style.height = '166px'
  const zoom = settings.zoom
  settings.zoom = 1 // the player's own staff size is not the cover's
  try {
    staff.render()
  } finally {
    settings.zoom = zoom
  }
  return host.querySelector('svg')!
}

const ys = (svg: Element, sel: string, attr: string) => [...svg.querySelectorAll(sel)].map((e) => Number(e.getAttribute(attr)))
const staves = (svg: Element) => [...new Set(ys(svg, '.lines line', 'y1'))].sort((a, b) => a - b)

/** A page `w` layout units wide. Ink that makes the page taller (long stems, beams) widens it again, so the page is asked for until its width is `w`. */
function fit(score: Song, w: number) {
  let svg = render(score, w / 166)
  for (let i = 0; i < 3; i++) {
    const [, , vw, vh] = svg.getAttribute('viewBox')!.split(' ').map(Number)
    if (Math.abs(vw - w) < 2) break
    svg = render(score, w / vh)
  }
  return svg
}

const beatOf = (n: number, den: number) => (den === 8 && n > 3 && n % 3 === 0 ? 1.5 : 4 / den) // quarters: a dotted quarter in 6/8, 9/8, 12/8

/** Where the notes must stop to fit `limit` units: the first onset that is left out, or undefined when all fit. Never inside a beat or a beam, so what is shown is whole beats. */
function cutOf(L: Layout, limit: number, song: Song) {
  const at = new Map<string, { bar: number; q: number; x: number }>()
  for (const o of [...L.chords, ...L.rests]) {
    const k = `${o.bar}:${o.q}`
    at.set(k, { bar: o.bar, q: o.q, x: Math.min(at.get(k)?.x ?? Infinity, o.x) })
  }
  const on = [...at.values()].sort((a, b) => a.bar - b.bar || a.q - b.q)
  const out = on.findIndex((o) => o.x + 12 > limit) // 12: half a head, a dot or a stem's flag
  if (out < 0) return undefined
  const before = (o: { bar: number; q: number }, c: { bar: number; q: number }) => o.bar < c.bar || (o.bar === c.bar && o.q < c.q - 1e-6)
  for (let j = Math.min(out, on.length - 1); j >= 1; j--) {
    const c = on[j]
    const b = song.bars[c.bar]
    const beat = b ? beatOf(b.n, b.den) : 1
    const onBeat = Math.abs(c.q / beat - Math.round(c.q / beat)) < 1e-3
    const splits = L.beams.some((m) => m.chords.some((h) => before(h, c)) && m.chords.some((h) => !before(h, c)))
    if (onBeat && !splits) return c
  }
  return on.length > 1 ? on[1] : undefined // not even one whole beat fits: the first onset alone
}

/** Leave out everything from the onset `c` on, and the barline after a bar that is cut short. */
function prune(L: Layout, c: { bar: number; q: number; x: number }) {
  const before = (o: { bar: number; q: number }) => o.bar < c.bar || (o.bar === c.bar && o.q < c.q - 1e-6)
  L.chords = L.chords.filter(before)
  L.rests = L.rests.filter(before)
  L.beams = L.beams.filter((m) => m.chords.every(before))
  L.ties = L.ties.filter((t) => t.x2 < c.x)
  L.tuplets = L.tuplets.filter((t) => t.x2 < c.x)
  L.slurs = []
  L.wedges = []
  L.dyns = []
  L.syms = []
  L.bars = L.bars.filter((b) => (c.q > 0 ? b.i <= c.bar : b.i < c.bar))
  if (c.q > 0) L.bars[L.bars.length - 1].xEnd = 1e5 // a bar cut short is open: no barline
}

export function draw(song: Song | undefined, facts: { fifths: number; meter: string } | undefined, size: CoverSize): string {
  const c = COVER[size]
  const body = { w: c.w - 2 * c.m, h: c.ih }
  const score = song ?? empty(facts!)
  let svg = fit(score, body.w / c.scale)
  const solo = staves(svg).length < 10
  const scale = c.scale * (solo ? COVER.solo : 1) // a single line is drawn larger: it has no second staff to share the height with
  const W = body.w / scale
  if (solo) svg = fit(score, W)
  const staff = page!.staff
  // a bar too dense for the width (squeezed, or its columns closer than 16 units, past reading at this size) is laid out wider, at a readable spacing,
  // and the notes are then cut where the box ends: fewer beats, never a squeezed bar
  const tight = () => inner(staff).L.bars[0]?.dense || inner(staff).L.bars[0]?.minGap < 16
  for (const k of [1.3, 1.7, 2.2, 3]) {
    if (!tight()) break
    svg = fit(score, W * k)
  }
  if (song) {
    const cut = cutOf(inner(staff).L, W - 3, score)
    if (cut) {
      prune(inner(staff).L, cut)
      inner(staff).paint(inner(staff).L)
      svg = page!.host.querySelector('svg')!
    }
  }
  const crop = cropOf(staves(svg), ys(svg, 'text.head', 'y'), body, scale)
  for (const e of svg.querySelectorAll('.cursor, .barno, clipPath, .cname')) e.remove()
  if (!song) for (const e of svg.querySelectorAll('.rest')) e.remove() // a blank staff, not a staff of rests
  for (const e of svg.querySelectorAll('[clip-path]')) e.removeAttribute('clip-path')
  const out = document.createElementNS(NS, 'svg')
  out.setAttribute('viewBox', `0 ${crop.y.toFixed(1)} ${W.toFixed(1)} ${crop.h.toFixed(1)}`)
  out.setAttribute('preserveAspectRatio', 'xMinYMin slice')
  out.setAttribute('data-staff', crop.staff)
  out.innerHTML = svg.innerHTML
  return out.outerHTML
}
