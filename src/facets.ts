import { gradeOf } from './catalog'
import type { Catalog, Form, Period } from './catalog-types'

// The Songs page's facets (docs/research/library-and-profile.md, 5.2 and 5.6, option C; the home shelves of option D will be saved selections over this).
// Pure: a selection in, the pieces that match and the count behind every value out. Lazy with the library view; never in catalog.ts, which is boot.

export type FacetId = 'lane' | 'grade' | 'len' | 'key' | 'period' | 'form' | 'composer'
export type Value = string | number
/** What is chosen. `lane` is always there: 'all' lifts it. */
export type Sel = Partial<Record<FacetId, Value>> & { lane: Lane }
export type Lane = 'all' | 'piece' | 'accomp' | 'study'

export const LANES: [Lane, string][] = [['all', 'All'], ['piece', 'Pieces'], ['accomp', 'Songs with voice'], ['study', 'Studies']]
export const LENGTHS = ['Under 1 min', '1 to 2 min', '2 to 4 min', 'Over 4 min']
export const KEYS = ['No sharps or flats', '1 sharp or flat', '2 sharps or flats', '3 or more']
export const PERIODS: [Period, string][] = [['baroque', 'Baroque'], ['classical', 'Classical'], ['romantic', 'Romantic'], ['modern', 'Modern']]
export const FORMS: [Form, string][] = [
  ['dance', 'Dances'], ['prelude', 'Preludes'], ['fugue', 'Fugues'], ['invention', 'Inventions'], ['sonata', 'Sonatas and sonatinas'], ['variations', 'Variations'], ['suite', 'Suites'], ['nocturne', 'Nocturnes'],
  ['ballade', 'Ballades'], ['impromptu', 'Impromptus'], ['scherzo', 'Scherzos'], ['rondo', 'Rondos'], ['march', 'Marches'], ['song', 'Songs and melodies'], ['toccata', 'Toccatas and fantasies'], ['character', 'Character pieces'], ['study', 'Études'],
]
export const NOTES: Record<Lane, string> = {
  all: '',
  piece: '',
  accomp: 'The piano part of songs, written under a voice. Good for reading through, and for accompanying a singer.',
  study: 'Studies and technique collections, such as Hanon. They are exercises, not pieces to learn, so they are never offered as your next piece.',
}

/** The value of each facet for each piece, in catalogue order: one pass, kept for as long as the catalogue is. */
const memo = new WeakMap<Catalog['pieces'], Partial<Record<FacetId, Value>>[]>()
export function values(cat: Catalog): Partial<Record<FacetId, Value>>[] {
  let v = memo.get(cat.pieces)
  if (!v) {
    v = cat.pieces.map((p) => ({
      lane: p.kind === 'accomp' || p.kind === 'study' ? p.kind : 'piece', // a fragment is a piece, marked in its row
      grade: gradeOf(p),
      ...(p.sec && { len: p.sec < 60 ? 0 : p.sec < 120 ? 1 : p.sec < 240 ? 2 : 3 }),
      ...(p.bars && { key: Math.min(3, Math.abs(p.fifths)) }),
      ...(cat.composers[p.composer]?.period && { period: cat.composers[p.composer].period }),
      ...(p.form && { form: p.form }),
      composer: p.composer,
    }))
    memo.set(cat.pieces, v)
  }
  return v
}

const FACETS: FacetId[] = ['lane', 'grade', 'len', 'key', 'period', 'form', 'composer']

/** Whether a piece's values meet the selection, leaving out `skip` (to count what another value of that facet would give). */
export function meets(v: Partial<Record<FacetId, Value>>, sel: Sel, skip?: FacetId) {
  return FACETS.every((f) => f === skip || sel[f] === undefined || (f === 'lane' && sel.lane === 'all') || v[f] === sel[f])
}

/** For one facet: how many of `hits` each of its values would leave under the rest of the selection. */
export function counts(vs: ReturnType<typeof values>, hits: number[], sel: Sel, facet: FacetId) {
  const m = new Map<Value, number>()
  for (const i of hits) if (meets(vs[i], sel, facet) && vs[i][facet] !== undefined) m.set(vs[i][facet]!, (m.get(vs[i][facet]!) ?? 0) + 1)
  return m
}

/** The facets chosen besides the lane, in the order they read: "Baroque at Level 1". */
export const active = (sel: Sel) => FACETS.filter((f) => f !== 'lane' && sel[f] !== undefined)

/** A value in words. */
export function label(f: FacetId, v: Value, cat: Catalog): string {
  switch (f) {
    case 'lane': return LANES.find(([l]) => l === v)![1]
    case 'grade': return `Level ${v}`
    case 'len': return LENGTHS[v as number]
    case 'key': return KEYS[v as number]
    case 'period': return PERIODS.find(([p]) => p === v)![1]
    case 'form': return FORMS.find(([p]) => p === v)![1]
    case 'composer': return cat.composers[v as number]?.name ?? ''
  }
}

/** What a zero result can offer: each way to take one thing away (a chosen facet, or the lane) and the pieces that would then show, most first. `hits` is the search without any facet. */
export function ways(vs: ReturnType<typeof values>, hits: number[], sel: Sel) {
  const out: { facet: FacetId; gain: number }[] = []
  for (const f of [...active(sel), ...(sel.lane === 'all' ? [] : (['lane'] as const))]) {
    const gain = hits.filter((i) => meets(vs[i], sel, f)).length
    if (gain) out.push({ facet: f, gain })
  }
  return out.sort((a, b) => b.gain - a.gain)
}
