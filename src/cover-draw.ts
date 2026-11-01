import type { Game } from './game'
import { settings } from './settings'
import type { Song } from './song'
import { Staff } from './staff'
import { COVER, cropOf, type CoverSize } from './cover'

// The incipit, engraved by the app's own staff painter on an off-screen page and handed back as an SVG string. Nothing here lays out or draws a note:
// the same Layout and Staff that make the play screen make the cover, so a change to the engraving shows on both.

const NS = 'http://www.w3.org/2000/svg'
const fake = { mode: 'learn', view: 'both', hands: { R: 'play', L: 'play' }, parts: new Set(), t: 0, phase: 'ready', ghost: null, hidePlayed: false, modeOf: () => 'play', judge: { grade: [], st: [], nextPending: () => -1, required: () => [] } } as unknown as Game
let page: { host: HTMLElement; staff: Staff } | undefined

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

export function draw(song: Song | undefined, facts: { fifths: number; meter: string } | undefined, size: CoverSize): string {
  const c = COVER[size]
  const body = { w: c.w - 2 * c.pad, h: c.h - c.head - c.pad }
  const score = song ?? empty(facts!)
  // a first look finds the staves and the notes; the crop then says how wide a page the layout should be given, so it chooses the bars that fit.
  // Ink that makes the page taller (long stems, beams) widens it again, so the page is asked for until its width is the crop's.
  const staves = (svg: Element) => [...new Set(ys(svg, '.lines line', 'y1'))].sort((a, b) => a - b)
  let svg = render(score, body.w / body.h)
  let crop = cropOf(staves(svg), ys(svg, 'text.head', 'y'), body, c.scale)
  for (let i = 0; i < 3; i++) {
    const [, , vw, vh] = svg.getAttribute('viewBox')!.split(' ').map(Number)
    const page = Math.max(crop.w, c.span)
    if (i && Math.abs(vw - page) < 2) break
    svg = render(score, page / vh)
    crop = cropOf(staves(svg), ys(svg, 'text.head', 'y'), body, c.scale)
  }
  // a window on one staff of a grand staff shows that staff's music only: the other hand's notes at its edge would read as stray marks
  if (crop.staff === 'treble' || crop.staff === 'bass') {
    const lines = staves(svg)
    const mid = (lines[4] + lines[5]) / 2
    const other = (y: number) => (crop.staff === 'treble' ? y > mid : y < mid)
    for (const g of svg.querySelectorAll('.ch')) if (other(Number(g.querySelector('.head')?.getAttribute('y')))) g.remove()
    for (const e of svg.querySelectorAll('.rest, .beam, .tie')) {
      const b = (e as SVGGraphicsElement).getBBox()
      if (other(b.y + b.height / 2)) e.remove()
    }
  }
  for (const e of svg.querySelectorAll('.cursor, .barno, clipPath, .cname')) e.remove()
  if (!song) for (const e of svg.querySelectorAll('.rest')) e.remove() // a blank staff, not a staff of rests
  for (const e of svg.querySelectorAll('[clip-path]')) e.removeAttribute('clip-path')
  const out = document.createElementNS(NS, 'svg')
  out.setAttribute('viewBox', `0 ${crop.y.toFixed(1)} ${crop.w.toFixed(1)} ${crop.h.toFixed(1)}`)
  out.setAttribute('preserveAspectRatio', 'xMinYMin slice')
  out.setAttribute('data-staff', crop.staff)
  out.innerHTML = svg.innerHTML
  return out.outerHTML
}
