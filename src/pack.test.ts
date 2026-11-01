import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Catalog, Piece } from './catalog-types'
import { type Ctx, nextOf, type Pack, packFragment, packFromFragment, parsePack, rows, unknown } from './pack'
import type { Progress } from './store'

const good = { pf: 1, id: 'my-pack', title: 'My pack', by: 'A teacher', about: 'Slowly.', licence: 'CC0-1.0', items: [{ piece: 'a', note: 'Hands apart.', rate: 0.7, view: { names: false, fingers: false } }, { drill: { pattern: 'scale', tonic: 7, dyn: 'medium', hands: 'both', bpm: 60 } }, { read: 't-led1' }, { scale: 's1', title: 'Easy keys' }] }
const bad = (o: object) => () => parsePack(JSON.stringify({ ...good, ...o }))
const item = (it: object) => bad({ items: [it] })
const files = readdirSync('src/packs').map((f) => parsePack(readFileSync(`src/packs/${f}`, 'utf8')))

describe('parsePack', () => {
  it('reads a pack of every kind of item', () => {
    expect(parsePack(JSON.stringify(good))).toEqual(good)
  })
  it('says what is wrong and where', () => {
    expect(() => parsePack('{oops')).toThrow('not JSON')
    expect(() => parsePack('{"version":1}')).toThrow('no "pf" version')
    expect(bad({ pf: 2 })).toThrow('version 2; this app reads version 1')
    expect(bad({ id: 'Has Spaces' })).toThrow('"id" must be lower-case')
    expect(bad({ title: '' })).toThrow('"title" must be some text')
    expect(bad({ about: 'x'.repeat(301) })).toThrow('longer than 300')
    expect(bad({ about: 'see https://example.com' })).toThrow('web address')
    expect(bad({ licence: 'MIT' })).toThrow('"licence"')
    expect(bad({ items: [] })).toThrow('at least one item')
    expect(bad({ items: Array(201).fill({ read: 't-land' }) })).toThrow('at most 200')
    expect(bad({ music: 'TVRoZA' })).toThrow('"music" is not something it can have') // a pack never carries music
    expect(item({ piece: 'a', read: 't-land' })).toThrow('Item 1 must name exactly one')
    expect(item({ piece: 'a', rate: 2 })).toThrow('Item 1: "rate" must be a number from 0.4 to 1')
    expect(item({ piece: 'a', view: { names: 'no' } })).toThrow('"view" takes true or false')
    expect(item({ piece: 'a', view: { colour: false } })).toThrow('"colour" is not something')
    expect(item({ drill: { pattern: 'trill', tonic: 0, dyn: 'medium', hands: 'R', bpm: 60 } })).toThrow('the drill\'s "pattern" must be one of five')
    expect(item({ drill: { pattern: 'scale', tonic: 1, dyn: 'medium', hands: 'R', bpm: 60 } })).toThrow('"tonic"') // C sharp is not a key the page offers
    expect(item({ drill: { pattern: 'scale', tonic: 0, dyn: 'medium', hands: 'R', bpm: 999 } })).toThrow('"bpm"')
    expect(() => parsePack('x'.repeat(70_000))).toThrow('too big')
  })
})

const piece = (id: string, o: Partial<Piece> = {}) => ({ id, title: id.toUpperCase(), grade: 2, kind: undefined, ...o }) as Piece
const cat = new Map([['a', piece('a')], ['h1', piece('h1', { kind: 'study', grade: 4 })], ['h2', piece('h2', { kind: 'study' })], ['h3', piece('h3', { kind: 'study' })]])
const prog = (o: Partial<Progress>): Progress => ({ plays: 1, last: 0, heat: [], ...o })
const ctx = (p: [string, Progress][] = []): Ctx => ({ piece: (id) => cat.get(id), prog: new Map(p), tech: {}, drill: {}, scales: {}, day: 10, dayOf: (ts) => ts })

describe('where you are in a pack', () => {
  it('resolves each item by its own rule, shows no level for a study, and greys an id it does not know', () => {
    const p = parsePack(JSON.stringify({ ...good, items: [{ piece: 'a' }, { piece: 'h1' }, { piece: 'gone', note: 'Later.' }, { read: 'no-such-stage' }, { read: 't-land' }] }))
    const rs = rows(p, ctx([['lib:a', prog({ days: [3, 4] })]]))
    expect(rs.map((r) => [r.title, r.state, r.word, r.level])).toEqual([['A', 'done', 'Ready', 2], ['H1', 'new', '', undefined], ['gone', 'missing', 'Not in the library yet', undefined], ['no-such-stage', 'missing', 'Not in this version of the app', undefined], ['Treble landmarks', 'new', '', undefined]])
    expect(nextOf(p, rs, ctx()).next?.title).toBe('H1')
    expect(unknown(p, (id) => cat.has(id))).toEqual([2, 3])
  })
  it('a warm-up offers today the ones played longest ago, then says when today is done', () => {
    const p: Pack = { pf: 1, id: 'w', title: 'W', by: 'X', warmup: 2, items: [{ piece: 'h1' }, { piece: 'h2' }, { piece: 'h3' }] }
    const day = (c: Ctx) => nextOf(p, rows(p, c), c)
    expect(day(ctx()).today.map((r) => r.i)).toEqual([0, 1])
    const c = ctx([['lib:h1', prog({ last: 9 })], ['lib:h2', prog({ last: 10 })]]) // h1 yesterday, h2 today
    expect(day(c).today.map((r) => r.i)).toEqual([1, 2])
    expect(day(c).next?.i).toBe(2)
    expect(day(ctx([['lib:h1', prog({ last: 10 })], ['lib:h2', prog({ last: 10 })]])).next).toBeUndefined() // both done today: nothing left, never the whole book
  })
})

describe('links', () => {
  it('carry the whole pack in the fragment and back, short enough for a message', async () => {
    const f = await packFragment(good as Pack)
    expect(f).toMatch(/^pack=[\w-]+$/)
    expect(f.length).toBeLessThan(400)
    expect(await packFromFragment(`#${f}`)).toEqual(good)
    for (const p of files) expect(await packFromFragment(await packFragment(p))).toEqual(p)
  })
  it('say plainly when a link is damaged, and check what they carry as a file', async () => {
    await expect(packFromFragment('pack=@@@')).rejects.toThrow('damaged')
    await expect(packFromFragment('pack=AAAA')).rejects.toThrow('damaged')
    const f = await packFragment({ ...good, pf: 2 } as unknown as Pack)
    await expect(packFromFragment(f)).rejects.toThrow('version 2')
  })
})

describe('the packs that come with the app', () => {
  const file = process.env.LIBRARY_CATALOG ?? '.cache/library/out-c1/catalog.json'
  const bundled = new Set((JSON.parse(readFileSync('public/library/manifest.json', 'utf8')) as { id: string }[]).map((m) => m.id))
  it('parse, have ids of their own, and name only Read and Scales stages that exist', () => {
    expect(files.map((p) => p.id).sort()).toEqual(['anna-magdalena', 'burgmuller-op100', 'clementi-op42', 'czerny-op821', 'czerny-op840', 'hanon-warmup', 'schumann-op68'])
    for (const p of files) expect(unknown(p, () => true), p.id).toEqual([])
    expect(files.find((p) => p.id === 'hanon-warmup')).toMatchObject({ kind: 'study', warmup: 2 }) // decision 26: two a day
  })
  it('name only pieces in the catalogue', () => {
    if (!existsSync(file)) return void expect(files.some((p) => p.items.some((i) => bundled.has(i.piece!)))).toBe(true) // no corpus catalogue here: only the bundled ids can be checked
    const c = JSON.parse(readFileSync(file, 'utf8')) as Catalog
    const ids = new Set([...c.pieces.map((p) => p.id), ...Object.keys(c.aliases ?? {})])
    for (const p of files) expect(unknown(p, (id) => ids.has(id)), p.id).toEqual([])
  })
})
