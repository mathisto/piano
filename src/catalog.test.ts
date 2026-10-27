import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { builtin, fetchCatalog, index, merge, net, pieceBytes, search, sha256, tokens, type IO } from './catalog'
import { synthetic } from './catalog-fixture'
import type { Catalog } from './catalog-types'
import type { LibraryEntry } from './credits'

const manifest: LibraryEntry[] = JSON.parse(readFileSync(new URL('../public/library/manifest.json', import.meta.url), 'utf8'))
const base = builtin(manifest)
const titles = (c: Catalog, ids: number[]) => ids.map((i) => c.pieces[i].title)

describe('the built-in catalogue', () => {
  it('keeps every bundled id, so progress (lib:<id>) carries over, and maps the levels to grades 1 to 3', () => {
    expect(base.pieces.map((p) => p.id)).toEqual(manifest.map((m) => m.id))
    expect(base.pieces.map((p) => p.grade)).toEqual(manifest.map((m) => ({ Beginner: 1, Elementary: 2, Intermediate: 3 })[m.level]))
    expect(base.composers.find((c) => c.name === 'J. S. Bach')).toEqual({ name: 'J. S. Bach', born: 1685, died: 1750 })
  })

  it('merges under a network catalogue: its pieces win, bundled ones it lacks stay, re-indexed', () => {
    const net = synthetic(3)
    const m = merge({ ...net, pieces: [...net.pieces, { ...base.pieces[0], composer: 0, licence: 0 }] }, base)
    expect(m.pieces).toHaveLength(3 + base.pieces.length)
    const bach = m.pieces.find((p) => p.id === base.pieces[1].id)!
    expect(m.composers[bach.composer].name).toBe('J. S. Bach')
    expect(m.licences[bach.licence].id).toBe('Public Domain')
    expect(merge({ ...net, aliases: { [base.pieces[0].id]: 'syn-0' } }, base).pieces.some((p) => p.id === base.pieces[0].id)).toBe(false)
  })
})

describe('search', () => {
  const ix = index(base)

  it('folds diacritics and splits numbers from letters', () => {
    expect(tokens('Dvořák Op.46 No.1')).toEqual(['dvorak', 'op', '46', 'no', '1'])
    expect(tokens('Écossaise')).toEqual(['ecossaise'])
  })

  it('matches word prefixes over title, composer, opus and tags; every word must match', () => {
    expect(titles(base, search(ix, 'minu bach')).every((t) => /Minuet/.test(t))).toBe(true)
    expect(search(ix, 'minu bach').length).toBeGreaterThanOrEqual(3)
    expect(search(ix, 'bach zzz')).toEqual([])
    expect(titles(base, search(ix, 'hochlandisches'))).toEqual(['Hochländisches Wiegenlied, Op. 25 No. 14: melody and piano'])
    expect(search(ix, '').length).toBe(base.pieces.length)
    expect(search(ix, 'beginner').length).toBe(manifest.filter((m) => m.level === 'Beginner').length)
  })

  it('ranks a title word above a composer word, and an exact word above a prefix', () => {
    const c = synthetic(0)
    c.pieces = [
      { ...synthetic(1).pieces[0], id: 'a', title: 'Sonatina', composer: 13, opus: undefined, tags: [] }, // Mozart
      { ...synthetic(1).pieces[0], id: 'b', title: 'Mozart variations', composer: 1, opus: undefined, tags: [] },
      { ...synthetic(1).pieces[0], id: 'c', title: 'Waltz', composer: 0, opus: 'Op. 39', tags: [] },
      { ...synthetic(1).pieces[0], id: 'd', title: 'Waltz', composer: 0, opus: 'Op. 3', tags: [] },
    ]
    const x = index(c)
    expect(search(x, 'mozart').map((i) => c.pieces[i].id)).toEqual(['b', 'a'])
    expect(search(x, 'op 3').map((i) => c.pieces[i].id)).toEqual(['d', 'c'])
  })

  it('filters by grade and composer', () => {
    expect(search(ix, '', { grade: 1 }).every((i) => base.pieces[i].grade === 1)).toBe(true)
    const schumann = base.composers.findIndex((c) => c.name === 'Robert Schumann')
    expect(search(ix, '', { composer: schumann }).length).toBeGreaterThan(0)
    expect(search(ix, '', { composer: schumann }).every((i) => base.pieces[i].composer === schumann)).toBe(true)
  })

  it('browses easiest first', () => {
    const g = search(ix, '').map((i) => base.pieces[i].grade)
    expect(g).toEqual([...g].sort((a, b) => a - b))
  })

  it('searches 5,000 pieces in under 50 ms', () => {
    const big = index(synthetic(5000))
    for (const q of ['wal', 'chopin noct', 'op 12', 'ecos', 'zzz']) {
      const t = performance.now()
      search(big, q, q === 'wal' ? { grade: 3 } : {})
      expect(performance.now() - t, q).toBeLessThan(50)
    }
    expect(search(big, 'dvorak').length).toBeGreaterThan(100)
  })
})

describe('the piece loader', () => {
  const bytes = new TextEncoder().encode('MThd fake').buffer as ArrayBuffer
  const other = new TextEncoder().encode('tampered').buffer as ArrayBuffer
  const io = (kept: unknown, files: Record<string, ArrayBuffer | 'fail' | 404>) => {
    const asked: string[] = []
    const saved: Record<string, unknown> = {}
    const f: IO = {
      get: async () => kept,
      set: async (k, v) => void (saved[k] = v),
      fetch: (async (url: string) => {
        asked.push(url)
        const b = files[url]
        if (b === 'fail' || b === undefined) throw new Error('offline')
        if (b === 404) return { ok: false, status: 404 }
        return { ok: false, status: 0, arrayBuffer: async () => b } // the iPad's bundled-file status
      }) as unknown as typeof fetch,
    }
    return { f, asked, saved }
  }

  it('takes IndexedDB, then the bundle, then the corpus, keeping only what came from the corpus', async () => {
    const p = { ...base.pieces[0], sha256: await sha256(bytes), file: 'p/abc.mid' }
    const corpus = new URL('p/abc.mid', 'https://pianoforte.mattkelly.io/corpus/').href
    let t = io(bytes, {})
    expect(await pieceBytes(p, t.f, 'bundle.mid')).toBe(bytes)
    expect(t.asked).toEqual([])

    t = io(undefined, { 'bundle.mid': bytes })
    expect(await pieceBytes(p, t.f, 'bundle.mid')).toBe(bytes)
    expect(t.asked).toEqual(['bundle.mid'])
    expect(t.saved).toEqual({})

    t = io(undefined, { 'bundle.mid': 404, [corpus]: bytes })
    expect(await pieceBytes(p, t.f, 'bundle.mid')).toBe(bytes)
    expect(t.asked).toEqual(['bundle.mid', corpus])
    expect(t.saved[`libfile:${p.id}`]).toBe(bytes)

    t = io(undefined, { [corpus]: 'fail' })
    await expect(pieceBytes(p, t.f, undefined)).rejects.toThrow(/could not be loaded/)
  })

  it('rejects a file whose sha256 is wrong, wherever it came from', async () => {
    const p = { ...base.pieces[0], sha256: await sha256(bytes), file: 'p/abc.mid' }
    const corpus = new URL('p/abc.mid', 'https://pianoforte.mattkelly.io/corpus/').href
    const t = io(other, { 'bundle.mid': other, [corpus]: bytes })
    expect(await pieceBytes(p, t.f, 'bundle.mid')).toBe(bytes) // stale cache and a bad bundle copy are skipped
    const bad = io(undefined, { [corpus]: other })
    await expect(pieceBytes(p, bad.f, undefined)).rejects.toThrow()
    expect(bad.saved).toEqual({})
  })
})

describe('fetchCatalog', () => {
  const reply = (body: unknown, ok = true) => (async () => ({ ok, json: async () => body })) as unknown as typeof fetch
  it('takes a well-formed newer catalogue and nothing else', async () => {
    const c = synthetic(2)
    expect((await fetchCatalog('', reply(c)))?.pieces).toHaveLength(2)
    expect(await fetchCatalog('synthetic', reply(c))).toBeUndefined() // unchanged
    expect(await fetchCatalog('', reply({ v: 2, pieces: [] }))).toBeUndefined()
    expect(await fetchCatalog('', reply(c, false))).toBeUndefined()
    expect(await fetchCatalog('', (async () => Promise.reject(new Error('offline'))) as unknown as typeof fetch)).toBeUndefined()
  })

  it('says whether the corpus answered: unchanged is fine, offline, 404 and damaged are not', async () => {
    const c = synthetic(2)
    await fetchCatalog('synthetic', reply(c))
    expect(net.ok).toBe(true)
    await fetchCatalog('', reply(c, false))
    expect(net.ok).toBe(false)
    await fetchCatalog('', reply({ v: 1, pieces: 'x' }))
    expect(net.ok).toBe(false)
    await fetchCatalog('', (async () => Promise.reject(new Error('offline'))) as unknown as typeof fetch)
    expect(net.ok).toBe(false)
  })
})
