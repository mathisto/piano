// Accompaniment practice: you play one part and the app plays the rest at the tempo, like a pianist with a singer.
// Accompanying experience predicts sight-reading skill (Lehmann and Ericsson 1996). Pure: which part is whose, the card's chooser.
import type { HandMode } from './game'
import type { Hand, Note, Song } from './song'

export interface Choice {
  id: string
  label: string
  hands: Record<Hand, HandMode>
  parts: number[] // source parts the app plays
}

const BOTH: Record<Hand, HandMode> = { R: 'play', L: 'play' }
const MAX_PARTS = 4 // past this a chooser is a list nobody reads; hands still work

/** The app plays a note when every part that wrote it is the app's: a voice the piano doubles is still yours at the piano. */
export const byApp = (n: Note, parts: Set<number>) => n.part !== undefined && parts.has(n.part) && (n.also === undefined || parts.has(n.also))

const VOICE = /(?<!\p{L})(voice|vocals?|singstimme|gesang|stimme|canto|chant|soprano|sopran|mezzo|alto|contralto|tenor|baritone|bariton|bass|basso)(?!\p{L})/iu

/** The instrument that sings a note when the app plays it: strings for a part named like a voice (a folded Lied's voice line), else the setting's. */
export const voiceOf = (song: Song, n: Note): string | undefined => (n.part !== undefined && VOICE.test(song.parts?.[n.part] ?? '') ? 'strings' : undefined)

/** Source parts with notes, in score order. */
export function partsOf(song: Song): number[] {
  return [...new Set(song.notes.flatMap((n) => [n.part, n.also].filter((p) => p !== undefined)))].sort((a, b) => a - b)
}

export const partName = (song: Song, p: number) => song.parts?.[p]?.trim() || `Part ${p + 1}`

/** What you can play while the app plays the rest. Empty when there is only one thing to play. */
export function choices(song: Song): Choice[] {
  const ps = partsOf(song)
  if (ps.length >= 2 && ps.length <= MAX_PARTS) {
    const each = ps.map((p) => ({ id: `part${p}`, label: partName(song, p), hands: BOTH, parts: ps.filter((q) => q !== p) }))
    const some = each.filter((c) => song.notes.some((n) => byApp(n, new Set(c.parts)))) // a voice the piano doubles leaves the app nothing to play
    if (some.length) return [{ id: 'all', label: 'Everything', hands: BOTH, parts: [] }, ...some]
  }
  if (!song.notes.some((n) => n.h === 'R') || !song.notes.some((n) => n.h === 'L')) return []
  return [
    { id: 'all', label: 'Both hands', hands: BOTH, parts: [] },
    { id: 'R', label: 'Right hand', hands: { R: 'play', L: 'listen' }, parts: [] },
    { id: 'L', label: 'Left hand', hands: { R: 'listen', L: 'play' }, parts: [] },
  ]
}

const same = (c: Choice, hands: Record<Hand, HandMode>, parts: Set<number>) =>
  c.hands.R === hands.R && c.hands.L === hands.L && c.parts.length === parts.size && c.parts.every((p) => parts.has(p))

/** The choice the game is set to, if any (Learn's hand switches can leave it). */
export const chosen = (cs: Choice[], hands: Record<Hand, HandMode>, parts: Set<number>) => cs.find((c) => same(c, hands, parts))

/** Who plays what, in words ('the voice part', 'the left hand'); null when you play everything. */
export function yourPart(song: Song, hands: Record<Hand, HandMode>, parts: Set<number>): { you: string; app: string } | null {
  const ps = partsOf(song)
  const prose = (p: number) => `the ${partName(song, p).toLowerCase()} part`
  const mine = parts.size ? ps.filter((p) => !parts.has(p)).map(prose) : []
  const theirs = ps.filter((p) => parts.has(p)).map(prose)
  const has = (h: Hand) => song.notes.some((n) => n.h === h)
  const handName = (h: Hand) => (h === 'R' ? 'the right hand' : 'the left hand')
  const yours = (['R', 'L'] as const).filter((h) => hands[h] === 'play' && has(h))
  const app = (['R', 'L'] as const).filter((h) => hands[h] === 'listen' && has(h))
  const oneHand = yours.length === 1 && has('R') && has('L') // a one-hand piece played whole is the piece, not a part of it
  if (!theirs.length && !oneHand) return null
  return {
    you: [...mine, ...(oneHand ? [handName(yours[0])] : [])].join(', '),
    app: [...theirs, ...app.map(handName)].join(' and '), // '' when the rest is hidden, not played
  }
}

/** The start card's 'You play' row: a segmented choice and one line on what the app does. */
export function chooserHtml(song: Song, hands: Record<Hand, HandMode>, parts: Set<number>, esc: (s: string) => string): string {
  const cs = choices(song)
  if (!cs.length) return ''
  const on = chosen(cs, hands, parts)
  const who = yourPart(song, hands, parts)
  const hint = who?.app ? `<span class="hint">The app plays ${esc(who.app)}. Only your part is judged.</span>` : ''
  return `<div class="accomp"><span class="cap">You play</span><div class="seg" role="radiogroup" aria-label="You play">${cs
    .map((c) => `<label><input type="radio" name="you" value="${c.id}"${on === c ? ' checked' : ''}><span>${esc(c.label)}</span></label>`)
    .join('')}</div>${hint}</div>`
}
