import './cover.css'
import { LEVEL_GRADE } from './catalog'
import type { Piece } from './catalog-types'
import type { Song } from './song'
import type { Starter } from './starters'
import { esc } from './util'

// The cover (design/identity/SPEC.md, "Library cover system"): a piece's own opening bars engraved on paper, in three densities of one 3:2 grid.
// Every size and ratio that sets how it looks is COVER (and cover.css); this module is small and boots with the app, and the staff code that
// draws the notes loads on first use (cover-draw.ts). The cover is decoration (aria-hidden): the row or card around it carries the name.

/** Sizes in px (pt on the iPad). `m` side margin, `mt` header top, `hf` header type, `ry` the rule's y, `tf`/`ty` title type and top, `sf` secondary type,
 *  `iy`/`ih` the incipit's top and height, `scale` px per layout unit (a staff space is 10 units, so 0.8 is 8pt): the spec's least staff space, never fitted per piece. */
export const COVER = {
  thumb: { w: 56, h: 42, m: 4, mt: 3.5, hf: 4.5, ry: 0, tf: 0, ty: 0, sf: 0, iy: 10, ih: 29, scale: 0.25 },
  card: { w: 300, h: 200, m: 20, mt: 14, hf: 7, ry: 27, tf: 17, ty: 35, sf: 9, iy: 74, ih: 104, scale: 0.5 },
  start: { w: 600, h: 400, m: 42, mt: 28, hf: 11, ry: 51, tf: 42, ty: 64, sf: 16, iy: 148, ih: 208, scale: 0.8 },
  keep: 3, // bars kept of a score: the layout shows one or two, and the third stops it ending in a final barline
  solo: 1.45, // a single line is drawn this much larger than a grand staff
  ledger: 6, // units past the notes a sliding window keeps clear
} as const
export type CoverSize = 'thumb' | 'card' | 'start'

/** What a cover says before and without a score. Everything here is a fact of the catalogue, a starter's spec or the file's name; the key's mode and the metre
 *  of a score on the device are added when it is read (`keep`), and only when the file states them. */
export interface CoverMeta {
  by?: string // the header's left: "Bach · BWV 846"
  token?: string // the thumbnail's composer
  title?: string
  sub?: string
  level?: number // 1 to 5: the difficulty rule; none for a file
  fifths?: number
  mode?: 'major' | 'minor' // only when the source says so
  meter?: string
  local?: 'MIDI' | 'MUSICXML' // an import: no composer, and "Key —" "Metre —" until the score states them
}

export const surname = (name: string) => name.split(' ').pop()!
const SHARPS = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯']
const FLATS = ['C', 'F', 'B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭']
const MINOR_SHARPS = ['A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'A♯']
const MINOR_FLATS = ['A', 'D', 'G', 'C', 'F', 'B♭', 'E♭', 'A♭']

/** "B♭ major": the signature's tonic for a mode the source states. */
export const keyName = (fifths: number, mode: 'major' | 'minor') => {
  const [up, down] = mode === 'major' ? [SHARPS, FLATS] : [MINOR_SHARPS, MINOR_FLATS]
  return `${(fifths >= 0 ? up : down)[Math.abs(fifths)] ?? up[0]} ${mode}`
}

const first = (s: string) => s.replace(/^After /, '').split(/[,·]/)[0].trim()
const sub = (title: string): [string, string] => {
  const i = title.indexOf(': ') // "Sonatina in C, Op. 20 No. 1: Allegro": the movement or the part is the secondary line
  return i > 0 ? [title.slice(0, i), title.slice(i + 2)] : [title, '']
}

/** A library piece: the composer's surname and catalogue number, the grade, and what the catalogue knows of the score. */
export const pieceMeta = (p: Piece, composer: string | undefined): CoverMeta => {
  const [title, secondary] = sub(p.title)
  return {
    by: [composer && surname(composer), p.opus].filter(Boolean).join(' · '),
    token: composer && surname(composer),
    title,
    sub: secondary,
    level: p.gradeOverride ?? p.grade,
    ...(p.bars && { fifths: p.fifths, meter: p.meter, ...(p.mode && { mode: p.mode }) }),
  }
}

export const starterMeta = (s: Starter): CoverMeta => ({
  by: s.by,
  token: first(s.by),
  title: s.spec.title,
  sub: s.level,
  level: LEVEL_GRADE[s.level] ?? 1,
  fifths: s.spec.fifths,
  mode: s.spec.mode,
  meter: (s.spec.sig ?? [4, 4]).join('/'),
})

/** A file you imported: the spec's missing-metadata rule. `added` is its import date. */
export const fileMeta = (kind: 'xml' | 'midi' | undefined, title: string, added?: number): CoverMeta => {
  const local = kind === 'xml' ? 'MUSICXML' : 'MIDI'
  return { local, title: title.trim() || (kind === 'xml' ? 'Untitled score' : 'Untitled MIDI'), sub: added ? new Date(added).toLocaleDateString(undefined, { dateStyle: 'long' }) : '', token: local }
}

/** The header's right. A key is named only when the source states its mode; an import says "Key —" and "Metre —" for what it does not. */
export const rightOf = (key: string | undefined, meter: string | undefined, local?: boolean) =>
  local ? `${key ?? 'KEY —'} · ${meter ?? 'METRE —'}` : [key, meter].filter(Boolean).join(' · ')

export const leftOf = (m: CoverMeta) => (m.local ? `LOCAL IMPORT · ${m.local}` : (m.by ?? ''))

/** The first bars of a score and nothing else: all a cover needs, and a few notes to hold instead of a piece. */
export function incipit(song: Song): Song {
  const bars = song.bars.slice(0, COVER.keep)
  return { ...song, bars, notes: song.notes.filter((n) => n.bar < bars.length), end: bars[bars.length - 1]?.t1 ?? 0, chords: undefined, marks: undefined, wedges: undefined, curve: undefined, dyn: undefined }
}

/** The part of the layout the paper shows, in layout units, scaled to the box: the whole grand staff (or the one staff of a single line), centred, sliding toward
 *  the notes when their ledger lines reach past it, though never so far that the staff leaves the window. `lines` are the staff lines' y, `heads` the notehead y's. */
export function cropOf(lines: number[], heads: number[], body: { w: number; h: number }, scale: number) {
  const h = body.h / scale
  const [top, bot] = [lines[0], lines[lines.length - 1]]
  let y = (top + bot) / 2 - h / 2
  if (heads.length) {
    const a = Math.min(...heads) - COVER.ledger
    const b = Math.max(...heads) + COVER.ledger
    y = b - a > h ? (a + b) / 2 - h / 2 : Math.min(Math.max(y, b - h), a)
  }
  y = Math.min(Math.max(y, bot + 2 - h), top - 2)
  return { y, h, w: body.w / scale, staff: lines.length >= 10 ? 'grand' : 'solo' }
}

/** The title's type size: the spec's, shrunk for a title that would need more than two lines (cards never ellipsize), and whether the secondary line fits under it. */
export function titleFit(title: string, size: CoverSize) {
  const c = COVER[size]
  const room = c.w - 2 * c.m
  const em = Math.min(1, Math.max(0.7, (2 * room * 0.9) / (title.length * 0.44 * c.tf)))
  return { px: Math.round(c.tf * em * 10) / 10, one: title.length * 0.44 * c.tf * em <= room }
}

const keyId = (id: string) => id.replace(/^lib:/, '')

/** The cover facts of each file on the device, for the start card (set when the Songs rows are built). */
export const metaOf = new Map<string, CoverMeta>()
const kept = new Map<string, Song>() // the opening bars of every score seen this session, by id
const said = new Map<string, { key?: string; meter?: string }>() // what each of those scores states of its key and metre
const done = new Map<string, string>() // the drawn incipit, by id and size; a blank staff is shared by every piece with the same signature
const doneKey = (id: string, size: string, f?: { fifths: number; meter: string }) => (f ? `stub|${f.fifths}|${f.meter}|${size}` : `${keyId(id)}|${size}`)

/** The paper, with its header, title block and difficulty rule as the size calls for, and room for the incipit. `id` names the score to draw (a starter's, a stored
 *  file's, `lib:<id>`). `blank`: when there is no score to draw from, draw an empty staff with the signatures the catalogue gives (a library piece not on the device). */
export function coverHtml(id: string, size: CoverSize, m: CoverMeta, blank = false) {
  const c = COVER[size]
  const s = said.get(keyId(id))
  const key = m.mode !== undefined && m.fifths !== undefined ? keyName(m.fifths, m.mode) : s?.key
  const meter = m.meter && !m.local ? m.meter : s?.meter
  const f = blank && m.fifths !== undefined && m.meter ? { fifths: m.fifths, meter: m.meter } : undefined
  const hit = done.get(doneKey(id, size)) ?? (f && done.get(doneKey(id, size, f))) // already drawn once: in the page at once, no empty paper to flash
  const t = c.tf && m.title !== undefined ? titleFit(m.title, size) : undefined
  const full = size !== 'thumb'
  const style = `--cw:${c.w}px;--ch:${c.h}px;--m:${c.m}px;--mt:${c.mt}px;--hf:${c.hf}px;--ry:${c.ry}px;--tf:${t?.px ?? c.tf}px;--ty:${c.ty}px;--sf:${c.sf}px;--iy:${c.iy}px;--ih:${c.ih}px`
  const header = full
    ? `<div class="cv-h"><em>${esc(leftOf(m))}</em><em class="cv-k" data-k="${esc(key ?? '')}" data-mt="${esc(meter ?? '')}"${m.local ? ' data-loc' : ''}>${esc(rightOf(key, meter, !!m.local))}</em></div><i class="cv-rule"></i>`
    : `<div class="cv-h"><em>${esc(m.token ?? '')}</em></div>`
  const title = full && m.title !== undefined ? `<div class="cv-t"><strong>${esc(m.title)}</strong>${m.sub && t?.one ? `<small>${esc(m.sub)}</small>` : ''}</div>` : ''
  const level = full && m.level ? `<div class="cv-d">${[1, 2, 3, 4, 5].map((i) => `<i${i <= m.level! ? ' class="on"' : ''}></i>`).join('')}</div>` : ''
  return `<div class="cover cv-${size}" data-cv="${esc(id)}"${f ? ` data-f="${f.fifths}" data-m="${esc(f.meter)}"` : ''}${hit ? ' data-drawn' : ''} style="${style}" aria-hidden="true">${header}${title}<div class="cv-b">${hit ?? ''}</div>${level}</div>`
}

// ---- drawing, lazily ----

let line: Promise<unknown> = Promise.resolve() // one cover at a time: a library page is a queue of parses, not a burst

/** Remember a score's opening bars, and what the file itself says of its key and metre, so its cover can be drawn wherever it is shown without parsing the piece again. */
export function keep(id: string, song: Song) {
  const b = song.bars[0]
  kept.set(keyId(id), incipit(song))
  said.set(keyId(id), { key: song.stated?.mode ? keyName(song.fifths, song.stated.mode) : undefined, meter: song.stated?.meter && b ? `${b.n}/${b.den}` : undefined })
}

/** A score changed (its tracks were re-chosen): draw it again next time. */
export function forget(id: string) {
  kept.delete(keyId(id))
  said.delete(keyId(id))
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
  const size = ([...el.classList].find((c) => c.startsWith('cv-'))?.slice(3) ?? 'thumb') as CoverSize
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
  const k = el.querySelector<HTMLElement>('.cv-k') // a score that states its key or metre says so in the header
  const s = said.get(keyId(id))
  if (k && s) k.textContent = rightOf(k.dataset.k || s.key, k.dataset.mt || s.meter, 'loc' in k.dataset)
  el.setAttribute('data-drawn', '')
}
