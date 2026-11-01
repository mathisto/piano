import { expect, it } from 'vitest'
import type { Catalog, Piece } from './catalog-types'
import { active, counts, label, meets, values, ways, type Sel } from './facets'

const piece = (id: string, o: Partial<Piece>, c = 0): Piece => ({ id, title: id, composer: c, fifths: 0, meter: '4/4', bars: 20, sec: 90, bpm: 90, notes: 100, lo: 40, hi: 80, tracks: 2, grade: 2, gradeWhy: [], tags: [], source: 'mutopia', sourceUrl: '', licenceEvidence: '', licence: 0, edition: '', quality: 100, flags: [], format: 'midi', file: '', bytes: 0, sha256: '', ...o })
const cat: Catalog = {
  v: 1,
  built: 'x',
  composers: [{ name: 'J. S. Bach', born: 1685, died: 1750, period: 'baroque' }, { name: 'Robert Schumann', born: 1810, died: 1856, period: 'romantic' }, { name: 'Charles Hanon', born: 1819, died: 1900, period: 'romantic' }],
  licences: [{ id: 'PD', url: '' }],
  pieces: [
    piece('minuet', { grade: 1, sec: 50, form: 'dance' }),
    piece('fugue', { grade: 3, sec: 200, fifths: -2, form: 'fugue' }),
    piece('album', { grade: 1, sec: 70 }, 1),
    piece('lied', { grade: 1, kind: 'accomp', fifths: 3 }, 1),
    piece('hanon1', { grade: 1, kind: 'study', sec: 40 }, 2),
    piece('hanon2', { grade: 2, kind: 'study', sec: 40 }, 2),
    piece('scrap', { grade: 1, kind: 'fragment', bars: 8 }),
  ],
}
const vs = values(cat)
const all = cat.pieces.map((_, i) => i)
const of = (sel: Sel) => all.filter((i) => meets(vs[i], sel)).map((i) => cat.pieces[i].id)

it('a fragment is a piece; a Lied and a study have lanes of their own; all lifts the lane', () => {
  expect(of({ lane: 'piece' })).toEqual(['minuet', 'fugue', 'album', 'scrap'])
  expect(of({ lane: 'accomp' })).toEqual(['lied'])
  expect(of({ lane: 'study' })).toEqual(['hanon1', 'hanon2'])
  expect(of({ lane: 'all' })).toHaveLength(7)
})

it('values: length bands, key by signature size, the composer\'s period, the form', () => {
  expect([vs[0].len, vs[1].len, vs[2].len, vs[4].len]).toEqual([0, 2, 1, 0])
  expect([vs[0].key, vs[1].key, vs[3].key]).toEqual([0, 2, 3])
  expect([vs[0].period, vs[2].period]).toEqual(['baroque', 'romantic'])
  expect([vs[0].form, vs[2].form]).toEqual(['dance', undefined])
})

it('a count is what the value would leave under every other choice, and not under its own', () => {
  const sel: Sel = { lane: 'piece', period: 'baroque' }
  expect([...counts(vs, all, sel, 'period')]).toEqual([['baroque', 3], ['romantic', 1]]) // the period itself is left out of its own count
  expect([...counts(vs, all, sel, 'grade')].sort()).toEqual([[1, 2], [3, 1]]) // the grades of the Baroque pieces
  expect([...counts(vs, all, { lane: 'all' }, 'lane')].sort()).toEqual([['accomp', 1], ['piece', 4], ['study', 2]])
})

it('a zero result names what was asked and offers each removal that brings pieces back, with the count it says', () => {
  const sel: Sel = { lane: 'piece', period: 'romantic', grade: 3 }
  expect(of(sel)).toEqual([])
  expect(active(sel).map((f) => label(f, sel[f]!, cat))).toEqual(['Level 3', 'Romantic'])
  const w = ways(vs, all, sel)
  expect(w.map((x) => x.facet).sort()).toEqual(['grade', 'period']) // the lane would bring back nothing, so it is not offered
  for (const { facet, gain } of w) {
    const rest = { ...sel }
    delete rest[facet]
    expect(of(rest)).toHaveLength(gain)
  }
  expect(w.map((x) => x.gain)).toEqual([1, 1]) // Level 3 dropped: the album; Romantic dropped: the fugue
})
