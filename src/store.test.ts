import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { HistoryEntry } from './store'

// IndexedDB as a map whose every call takes a turn of the event loop, so writes that overlap really interleave
const db = new Map<string, unknown>()
const tick = () => new Promise((r) => setTimeout(r, 1))
vi.mock('idb-keyval', () => ({
  get: async (k: string) => (await tick(), structuredClone(db.get(k))),
  set: async (k: string, v: unknown) => (await tick(), void db.set(k, structuredClone(v))),
  del: async (k: string) => void db.delete(k),
  keys: async () => [...db.keys()],
}))
const ls = new Map<string, string>()
vi.stubGlobal('localStorage', { getItem: (k: string) => ls.get(k) ?? null, setItem: (k: string, v: string) => ls.set(k, v), removeItem: (k: string) => ls.delete(k) })

const store = await import('./store')
const backup = await import('./backup')
beforeEach(() => db.clear())

describe('writes that read first', () => {
  it('two overlapping plan ticks keep both', async () => {
    await Promise.all([store.markPlan('d', 'read'), store.markPlan('d', 'run')])
    expect(db.get('plan:d')).toEqual(['read', 'run'])
  })

  it('two overlapping log entries, practice minutes and takes keep both', async () => {
    await Promise.all([store.logHistory({ ts: 1, kind: 'read', label: 'a', acc: 1 }), store.logHistory({ ts: 2, kind: 'run', label: 'b', acc: 1 })])
    await Promise.all([store.addPractice('d', 30), store.addPractice('d', 40)])
    const take = (ts: number) => ({ ts, mode: 'perform', rate: 1, wait: false, acc: 1, clean: true, n: 1, p: [], v: [], t: [] }) as never
    await Promise.all([store.addTake('x', take(1)), store.addTake('x', take(2))])
    expect((db.get('history:log') as unknown[]).length).toBe(2)
    expect(db.get('practice:days')).toEqual({ d: 70 })
    expect((db.get('take:x') as { ts: number }[]).map((t) => t.ts)).toEqual([2, 1])
  })
})

describe('progress heat and the bar count', () => {
  it('drops heat kept for a piece that has since shrunk, and trims to the bars there are', async () => {
    await store.commit('a', [0, 0, 0, 0, 0, 0, 0, 0, 0, 5], 10)
    expect((await store.getProgress('a', 10)).heat[9]).toBe(5)
    expect((await store.getProgress('a', 8)).heat).toEqual([]) // stale: not shown, not looped
    const p = await store.commit('a', [1], 8)
    expect(p.bars).toBe(8)
    expect(p.heat).toEqual([1])
    expect((await store.commit('a', [0, 0, 0, 0, 0, 0, 0, 0, 0, 9], 8)).heat.length).toBeLessThanOrEqual(8)
  })
})

describe('export and import', () => {
  const song = { id: 'abc', title: 'Mine', bytes: Uint8Array.from(readFileSync(new URL('../public/library/mutopia-2080.mid', import.meta.url))).buffer, added: 5, kind: 'midi' as const, pick: { tracks: [1], hands: {} } }

  it('carries imported songs, and an import merges instead of overwriting', async () => {
    db.set('song:abc', song)
    db.set('plan:d', ['read'])
    db.set('practice:days', { d: 60, e: 10 })
    db.set('history:log', [{ ts: 1, kind: 'read', label: 'a', acc: 1 }])
    db.set('drill:stats', { c4: { n: 10, clean: 0.9, rt: 900 }, d4: { n: 1, clean: 0, rt: 3000 } })
    db.set('prog:x', { plays: 4, last: 100, heat: [1], best: { score: 9, acc: 0.95, grade: 'A' }, memStage: 2, memDay: 3 })
    const file = await backup.exportAll()

    // this browser moves on after the export
    db.clear()
    db.set('plan:d', ['run'])
    db.set('practice:days', { d: 90 })
    db.set('history:log', [{ ts: 1, kind: 'read', label: 'a', acc: 1 }, { ts: 2, kind: 'run', label: 'b', acc: 1 }])
    db.set('drill:stats', { c4: { n: 3, clean: 0.5, rt: 1000 }, d4: { n: 6, clean: 0.8, rt: 1200 } })
    db.set('prog:x', { plays: 2, last: 200, heat: [0, 3], best: { score: 5, acc: 0.7, grade: 'C' } })
    await backup.importAll(file)

    expect(db.get('plan:d')).toEqual(['run', 'read'])
    expect(db.get('practice:days')).toEqual({ d: 90, e: 10 })
    expect((db.get('history:log') as { ts: number }[]).map((h) => h.ts)).toEqual([1, 2])
    expect(db.get('drill:stats')).toEqual({ c4: { n: 10, clean: 0.9, rt: 900 }, d4: { n: 6, clean: 0.8, rt: 1200 } }) // the card seen more often
    expect(db.get('prog:x')).toMatchObject({ plays: 4, last: 200, heat: [0, 3], best: { acc: 0.95 }, memStage: 2 })
    const s = db.get('song:abc') as typeof song
    expect(new Uint8Array(s.bytes)).toEqual(new Uint8Array(song.bytes))
    expect(s.pick).toEqual(song.pick)
    expect(JSON.parse(db.get('backup:last') as string).practice).toEqual({ d: 90 }) // what was here before the import
  })

  it('carries packs: an imported pack and when each was opened, merged, and Clear all data takes them', async () => {
    const mine = { pth: 1, id: 'mine', title: 'Mine', by: 'Me', items: [{ read: 't-land' }] }
    db.set('pack:mine', { pack: mine, from: 'link', added: 1, opened: 5 })
    db.set('pack:hanon-warmup', { opened: 9 })
    const file = await backup.exportAll()
    db.clear() // this browser opened the Hanon pack later, and never had the other
    db.set('pack:hanon-warmup', { opened: 12 })
    await backup.importAll(file)
    expect(db.get('pack:mine')).toEqual({ pack: mine, from: 'link', added: 1, opened: 5 })
    expect(db.get('pack:hanon-warmup')).toEqual({ opened: 12 })
    await store.clearAll()
    expect([...db.keys()].filter((k) => k.startsWith('pack:'))).toEqual([])
  })

  it('refuses what is not an export', async () => {
    await expect(backup.importAll('{"version":2}')).rejects.toThrow('This file is not a Page to Hand export. Choose a file saved with Export.')
  })

  it('merges valid sync files, skips a damaged peer, and leaves this device settings alone', async () => {
    ls.set('piano.settings', 'this device')
    const a = JSON.stringify({ version: 1, at: 2, practice: { b: 20 }, settings: 'other device' })
    const b = JSON.stringify({ version: 1, at: 1, practice: { a: 10 } })
    const result = await (await import('./backup')).importMany([a, '{bad', b])
    expect(result).toEqual({ merged: 2, skipped: 1 })
    expect(db.get('practice:days')).toEqual({ a: 10, b: 20 })
    expect(ls.get('piano.settings')).toBe('this device')
    expect(db.has('backup:last')).toBe(true)
  })

  it('skips an unreadable song in a backup before it reaches the library', async () => {
    const bytes = Buffer.from('not music').toString('base64')
    await backup.importAll(JSON.stringify({ version: 1, songs: [{ id: 'bad', title: 'Broken', bytes, added: 1, kind: 'midi' }] }))
    expect(await store.listSongs()).toEqual([])
    expect([...db.keys()].filter((k) => k === 'song:bad')).toEqual([])
  })

  it('names a malformed local song for recovery, and forgetting it keeps its practice history', async () => {
    db.set('song:bad', { id: 'wrong', title: 'Broken' })
    db.set('prog:bad', { plays: 2, last: 1, heat: [] })
    const recovery = await import('./recovery')
    expect(await recovery.songRecords()).toEqual({ songs: [], damaged: [{ id: 'bad', title: 'Broken' }] })
    await recovery.forgetDamagedSong('bad')
    expect(db.has('song:bad')).toBe(false)
    expect(db.has('prog:bad')).toBe(true)
  })

  it('the same file imported again keeps its track choice', async () => {
    const bytes = readFileSync(new URL('../public/library/mutopia-2080.mid', import.meta.url))
    const { id } = await store.addFile(new File([bytes], 'a.mid'))
    await store.setPick(id, { tracks: [0], hands: { 0: 'L' } })
    await store.addFile(new File([bytes], 'a.mid'))
    expect((db.get(`song:${id}`) as { pick: unknown }).pick).toEqual({ tracks: [0], hands: { 0: 'L' } })
  })

  it('removing a song takes its simplify level with it', async () => {
    db.set('song:abc', song)
    db.set('simp:abc', 2)
    await store.removeSong('abc')
    expect([...db.keys()]).toEqual([])
  })
})

describe('the attempt log', () => {
  it('a row says what offered it, a pick of the player\'s own is own, and what came next is edited onto it', async () => {
    store.offered({ kind: 'read', by: 'plan' })
    const then = store.logHistory({ ts: 1, kind: 'read', label: 'a', acc: 1 }) // the offer was a reading set: this is it
    store.logHistory({ ts: 2, kind: 'read', label: 'b', acc: 1 }) // another set, picked by the player
    store.offered({ kind: 'theory', by: 'due' })
    store.logHistory({ ts: 3, kind: 'song', label: 'c', acc: 1 }) // a piece, not the Theory session offered
    then('c')
    await store.edit('x', 0, (x) => x) // the queue has run
    expect((db.get('history:log') as HistoryEntry[]).map((e) => [e.by, e.then])).toEqual([['plan', 'c'], ['own', undefined], ['own', undefined]])
  })

  const jan = Date.UTC(2026, 0, 15)
  const feb = Date.UTC(2026, 1, 3)

  it('card rows go under their month, and with the new fields round-trip an export, merge by time, and Clear all data takes them', async () => {
    await store.logCards([{ ts: jan, k: 'a', y: 1, rt: 800 }, { ts: jan + 1, k: 'b', y: 0, rt: 2100, got: [62] }, { ts: feb, k: 'c', y: 0, rt: 900, got: [60, 64] }])
    expect([...db.keys()].sort()).toEqual(['log:cards:2026-01', 'log:cards:2026-02'])
    await store.logHistory({ ts: 5, kind: 'song', label: 'Minuet', acc: 0.9, id: 'song:minuet', notes: 0.94, ok: true, as: 1, rate: 0.7, sp: 22 })
    await store.edit<{ ts: number }[]>('history:log', [], (l) => l.map((e) => ({ ...e, then: 'a' })))
    const file = await backup.exportAll()

    db.clear() // this browser moved on: another January card, one in common, and a March
    await store.logCards([{ ts: jan + 1, k: 'b', y: 0, rt: 2100, got: [62] }, { ts: jan + 2, k: 'd', y: 1, rt: 900 }, { ts: Date.UTC(2026, 2, 1), k: 'e', y: 1, rt: 700 }])
    await backup.importAll(file)
    const ts = (m: string) => (db.get(`log:cards:${m}`) as { ts: number }[]).map((c) => c.ts)
    expect(ts('2026-01')).toEqual([jan, jan + 1, jan + 2])
    expect(ts('2026-02')).toEqual([feb])
    expect(ts('2026-03')).toHaveLength(1)
    expect((db.get('log:cards:2026-02') as { got: number[] }[])[0].got).toEqual([60, 64])
    expect(db.get('history:log')).toEqual([{ ts: 5, kind: 'song', label: 'Minuet', acc: 0.9, id: 'song:minuet', notes: 0.94, ok: true, as: 1, rate: 0.7, sp: 22, then: 'a', by: 'own' }])

    await store.clearAll()
    expect([...db.keys()].filter((k) => /^(log|history)/.test(k))).toEqual([])
  })
})
