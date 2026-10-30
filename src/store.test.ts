import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
  const song = { id: 'abc', title: 'Mine', bytes: new Uint8Array([77, 84, 104, 100, 0, 255]).buffer, added: 5, kind: 'midi' as const, pick: { tracks: [1], hands: {} } }

  it('carries imported songs, and an import merges instead of overwriting', async () => {
    db.set('song:abc', song)
    db.set('plan:d', ['read'])
    db.set('practice:days', { d: 60, e: 10 })
    db.set('history:log', [{ ts: 1, kind: 'read', label: 'a', acc: 1 }])
    db.set('drill:stats', { c4: { n: 10, clean: 0.9, rt: 900 }, d4: { n: 1, clean: 0, rt: 3000 } })
    db.set('prog:x', { plays: 4, last: 100, heat: [1], best: { score: 9, acc: 0.95, grade: 'A' }, memStage: 2, memDay: 3 })
    const file = await store.exportAll()

    // this browser moves on after the export
    db.clear()
    db.set('plan:d', ['run'])
    db.set('practice:days', { d: 90 })
    db.set('history:log', [{ ts: 1, kind: 'read', label: 'a', acc: 1 }, { ts: 2, kind: 'run', label: 'b', acc: 1 }])
    db.set('drill:stats', { c4: { n: 3, clean: 0.5, rt: 1000 }, d4: { n: 6, clean: 0.8, rt: 1200 } })
    db.set('prog:x', { plays: 2, last: 200, heat: [0, 3], best: { score: 5, acc: 0.7, grade: 'C' } })
    await store.importAll(file)

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

  it('refuses what is not an export', async () => {
    await expect(store.importAll('{"version":2}')).rejects.toThrow('Not a piano export.')
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
