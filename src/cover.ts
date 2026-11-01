import './cover.css'
import type { Song } from './song'
import { esc } from './util'

// The cover: a piece's own opening bars engraved on paper, with the composer and catalogue number above.
// The title stays outside, in the row or card (docs/research/urtext.md, decision 9). Everything that sets how it looks is COVER and cover.css;
// this module is small and boots with the app, and the staff code that draws the notes loads on first use (cover-draw.ts).

/** Sizes in px and the scale in px per layout unit (a staff space is 10 units); the header strip is part of the box. `span`: a page this many units wide is laid out and the
 *  box shows its left edge, so a box too narrow for a bar shows the opening cut off rather than a bar squeezed past reading. */
export const COVER = {
  lead: { w: 60, h: 40, head: 0, fs: 0, pad: 3, scale: 0.5, span: 240 }, // Today's plan row: no header, the notes only
  row: { w: 140, h: 52, head: 12, fs: 7.5, pad: 3, scale: 0.5, span: 0 }, // Songs rows
  card: { w: 272, h: 116, head: 22, fs: 10.5, pad: 6, scale: 0.62, span: 0 }, // the start card
  keep: 3, // bars kept of a score: the layout shows one or two, and the third stops it ending in a final barline
  grand: 14, // units of paper above and below a grand staff before the crop clips (a staff space is 10)
  ledger: 6, // units past the notes a sliding window keeps clear
} as const
export type CoverSize = keyof Pick<typeof COVER, 'lead' | 'row' | 'card'>

/** What a cover says before and without a score: the left of the header, and the key (as a signature) and metre where the catalogue or the score knows them. */
export interface CoverMeta {
  by?: string
  fifths?: number
  meter?: string
}

export const surname = (name: string) => name.split(' ').pop()!

/** The composer's surname and the catalogue number, as the left of a header: "Bach · BWV 846". */
export const pieceMeta = (composer: string | undefined, opus: string | undefined, facts?: { fifths: number; meter: string }): CoverMeta => ({
  by: [composer && surname(composer), opus].filter(Boolean).join(' · '),
  ...(facts?.meter && { fifths: facts.fifths, meter: facts.meter }),
})


/** The header: who wrote it and its catalogue number. The key and metre are engraved just below, so they are not repeated in words. */
export const headerOf = (m: CoverMeta) => m.by ?? ''

/** The first bars of a score and nothing else: all a cover needs, and a few notes to hold instead of a piece. */
export function incipit(song: Song): Song {
  const bars = song.bars.slice(0, COVER.keep)
  return { ...song, bars, notes: song.notes.filter((n) => n.bar < bars.length), end: bars[bars.length - 1]?.t1 ?? 0, chords: undefined, marks: undefined, wedges: undefined, curve: undefined, dyn: undefined }
}

/** The part of the layout the paper shows, in layout units, scaled to the box: a grand staff when it fits with its margins, otherwise the staff the notes are on, and
 *  a window that slides toward the notes (never off the staff) so a ledger-line opening is not cut at the staff. `lines` are the staff lines' y, `heads` the notehead y's. */
export function cropOf(lines: number[], heads: number[], body: { w: number; h: number }, scale: number) {
  const h = body.h / scale
  const two = lines.length >= 10
  const span = (a: number, b: number) => ({ top: lines[a], bot: lines[b] })
  const grand = two && lines[9] - lines[0] + 2 * COVER.grand <= h
  const mid = two ? (lines[4] + lines[5]) / 2 : 0
  const below = heads.filter((y) => y > mid).length
  const low = below > heads.length - below // more notes under the gap between the staves: the bass staff leads
  const s = grand || !two ? span(0, lines.length - 1) : low ? span(5, 9) : span(0, 4)
  let y = (s.top + s.bot) / 2 - h / 2
  const mine = grand || !two ? heads : heads.filter((y) => y > mid === low) // a window on one staff follows that staff's notes
  if (mine.length) {
    const a = Math.min(...mine) - COVER.ledger
    const b = Math.max(...mine) + COVER.ledger
    y = b - a > h ? (a + b) / 2 - h / 2 : Math.min(Math.max(y, b - h), a)
  }
  y = Math.min(Math.max(y, s.bot + 2 - h), s.top - 2) // the staff itself always stays in the window
  return { y, h, w: body.w / scale, grand, staff: grand ? 'grand' : two ? (low ? 'bass' : 'treble') : 'solo' }
}

const keyId = (id: string) => id.replace(/^lib:/, '')

const kept = new Map<string, Song>() // the opening bars of every score seen this session, by id
const done = new Map<string, string>() // the drawn incipit, by id and size; a blank staff is shared by every piece with the same signature
const doneKey = (id: string, size: string, f?: { fifths: number; meter: string }) => (f ? `stub|${f.fifths}|${f.meter}|${size}` : `${keyId(id)}|${size}`)

/** The paper, with its header and room for the incipit. `id` names the score to draw (a starter's, a stored file's, `lib:<id>`). `blank`: when there is no score
 *  to draw from, draw an empty staff with the signatures the catalogue gives (a library piece not on the device), rather than leave bare paper. */
export function coverHtml(id: string, size: CoverSize, m: CoverMeta, blank = false) {
  const c = COVER[size]
  const bw = c.w - 2 * c.pad
  const bh = c.h - c.head - c.pad
  const style = `--cw:${c.w}px;--ch:${c.h}px;--hh:${c.head}px;--fs:${c.fs}px;--bw:${bw}px;--bh:${bh}px;--pad:${c.pad}px`
  const f = blank && m.fifths !== undefined && m.meter ? { fifths: m.fifths, meter: m.meter } : undefined
  const hit = done.get(doneKey(id, size)) ?? (f && done.get(doneKey(id, size, f))) // already drawn once: in the page at once, no empty paper to flash
  return `<div class="cover cv-${size}" data-cv="${esc(id)}"${f ? ` data-f="${f.fifths}" data-m="${esc(f.meter)}"` : ''}${hit ? ' data-drawn' : ''} style="${style}" aria-hidden="true">${c.head ? `<div class="cv-h">${esc(headerOf(m))}</div>` : ''}<div class="cv-b">${hit ?? ''}</div></div>`
}

// ---- drawing, lazily ----

let line: Promise<unknown> = Promise.resolve() // one cover at a time: a library page is a queue of parses, not a burst

/** Remember a score's opening bars, so its cover can be drawn wherever it is shown without parsing the piece again. */
export const keep = (id: string, song: Song) => void kept.set(keyId(id), incipit(song))

/** A score changed (its tracks were re-chosen): draw it again next time. */
export function forget(id: string) {
  kept.delete(keyId(id))
  for (const k of done.keys()) if (k.startsWith(`${keyId(id)}|`)) done.delete(k)
}

/** Draw the covers under `root` as they scroll into view. `load` fetches a score that is on the device but not yet kept (a library piece). */
export function drawCovers(root: ParentNode, load?: (id: string) => Promise<Song | undefined>) {
  const seen = new IntersectionObserver(
    (es) => {
      for (const e of es.filter((e) => e.isIntersecting)) {
        seen.unobserve(e.target)
        line = line.then(() => paint(e.target as HTMLElement, load)).catch(() => {}) // a score that will not parse leaves its paper bare
      }
    },
    { rootMargin: '200px' },
  )
  for (const el of root.querySelectorAll<HTMLElement>('.cover[data-cv]:not([data-drawn])')) seen.observe(el)
}

/** Draw one cover now, from the score if it is kept (or `load` finds it), else from the catalogue's key and metre if the cover asked for a blank staff. */
export async function paint(el: HTMLElement, load?: (id: string) => Promise<Song | undefined>) {
  if (!el.isConnected) return
  const id = el.dataset.cv!
  const size = ([...el.classList].find((c) => c.startsWith('cv-'))?.slice(3) ?? 'row') as CoverSize
  if (!kept.has(keyId(id)) && load) {
    const full = await load(id).catch(() => undefined)
    if (full) keep(id, full)
  }
  const song = kept.get(keyId(id))
  const f = el.dataset.f !== undefined ? { fifths: Number(el.dataset.f), meter: el.dataset.m! } : undefined
  if (!song && !f) return // nothing to draw from yet: the paper and its header stand
  const key = doneKey(id, size, song ? undefined : f)
  let svg = done.get(key)
  if (svg === undefined) {
    const { draw } = await import('./cover-draw')
    done.set(key, (svg = draw(song, f, size)))
  }
  if (!el.isConnected) return
  el.querySelector('.cv-b')!.innerHTML = svg
  el.setAttribute('data-drawn', '')
}
