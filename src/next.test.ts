import { expect, it } from 'vitest'
import { nextUp, type Snap, type Strand, type Unit } from './next'

const u = (key: string, due?: number): Unit => ({ key, title: key, sub: `why ${key}`, due })
const piece = u('piece')
const fix = u('loop')
// a first visit with nothing played: the plan's rows, the starter piece, nothing due
const empty: Snap = { rows: [u('warm'), u('read'), piece], plan: ['warm', 'read', 'piece'], done: [] }
const allDone = { ...empty, done: ['warm', 'read', 'piece'] }

it('a run that was not clean: the fix, offered three times at most, then the day goes on', () => {
  for (const offers of [0, 1, 2]) expect(nextUp({ ...empty, after: { clean: false, fix, offers } })).toMatchObject({ key: 'loop', by: 'fix' })
  expect(nextUp({ ...empty, after: { clean: false, fix, offers: 3 } })).toMatchObject({ key: 'warm', by: 'plan' })
})

it('a clean run moves on to the day, whatever its fix', () => {
  expect(nextUp({ ...empty, after: { clean: true, fix, offers: 0 } })).toMatchObject({ key: 'warm', by: 'plan' })
  expect(nextUp({ ...empty, after: { clean: false, offers: 0 } })).toMatchObject({ key: 'warm', by: 'plan' }) // nothing to loop
})

it('the first week: its step for today comes before the plan', () => {
  expect(nextUp({ ...empty, guide: u('guide') })).toMatchObject({ key: 'guide', by: 'guide' })
  expect(nextUp({ ...empty, guide: u('guide'), after: { clean: false, fix, offers: 0 } }).by).toBe('fix')
})

it("the plan's first row not ticked, in the plan's order", () => {
  expect(nextUp({ ...empty, done: ['warm'] })).toMatchObject({ key: 'read', by: 'plan' })
})

it('the plan done: the most due, then the Path, then the piece', () => {
  const rows = [u('warm', 1), u('read', 12), u('review', 3), u('path'), piece]
  expect(nextUp({ ...allDone, rows })).toMatchObject({ key: 'read', by: 'due', sub: 'why read' })
  expect(nextUp({ ...allDone, rows: [u('path'), piece], path: 'path' })).toMatchObject({ key: 'path', by: 'path' })
  expect(nextUp({ ...allDone, path: 'scale' })).toMatchObject({ key: 'piece', by: 'piece' }) // a Path step with no row of its own today
})

it('after due work, two low sessions step back; five stalled sessions change the task', () => {
  const row = (ts: number, acc: number) => ({ ts, kind: 'read' as const, label: 'Bass five-finger', id: 'drill:b-five', acc, ms: 2000 })
  const back = { ...u('bass landmarks'), strand: 'read' as const }
  const change = { ...u('weak notes'), strand: 'read' as const }
  const adapt = [{ id: 'drill:b-five', strand: 'read' as const, back, change }]
  expect(nextUp({ ...allDone, log: [row(1, 0.6), row(2, 0.65)], adapt })).toMatchObject({ key: 'bass landmarks', by: 'back', sub: expect.stringContaining('under 70%') })
  expect(nextUp({ ...allDone, log: [1, 2, 3, 4, 5].map((ts) => row(ts, 0.78)), adapt })).toMatchObject({ key: 'weak notes', by: 'change', sub: expect.stringContaining('Five sessions') })
  expect(nextUp({ ...allDone, rows: [u('due', 2), piece], log: [row(1, 0.6), row(2, 0.6)], adapt })).toMatchObject({ key: 'due', by: 'due' })
  expect(nextUp({ ...allDone, log: [row(1, 0.6), row(2, 0.6), { ...row(3, 0.9), id: 'drill:b-land', by: 'back' }], adapt })).toMatchObject({ key: 'piece', by: 'piece' })
})

it('the lowest learning strand gets the free slot, while a page stays in its strand', () => {
  const lag = [
    { ...u('reading'), strand: 'read' as const, level: 3 },
    { ...u('scales'), strand: 'scale' as const, level: 2 },
  ]
  expect(nextUp({ ...allDone, lag })).toMatchObject({ key: 'scales', by: 'lag', sub: expect.stringContaining('level 2') })
  expect(nextUp({ ...allDone, lag }, 'read')).toMatchObject({ key: 'reading', by: 'lag' })
})

it('never empty: an empty profile with every step done still names the piece, with its reason', () => {
  const n = nextUp({ rows: [piece], plan: [], done: [] })
  expect(n).toMatchObject({ key: 'piece', by: 'piece', sub: 'why piece' })
  for (const s of [empty, allDone, { ...allDone, after: { clean: false, fix, offers: 9 } }]) expect(nextUp(s).by).toBeTruthy()
})

it("a page's Start keeps to its strand: the day first, then its Path step, then its own first row; nothing for a strand with no row", () => {
  const st = (key: string, strand: Strand, due?: number): Unit => ({ ...u(key, due), strand })
  const rows = [st('warm', 'tech'), st('read', 'read'), st('review', 'read', 4), st('piece', 'song'), st('sight', 'song'), st('scale', 'scale'), st('run', 'run')]
  const reqs = [
    { level: 1, name: 'Scales: the easy keys', detail: '', state: 'solid', pct: 1, start: { kind: 'scale', id: 's1' } },
    { level: 1, name: 'Triads on the white keys', detail: '', state: 'new', pct: 0, start: { kind: 'theory', trainer: 'chords', level: 1 } },
    { level: 2, name: 'Scales: two octaves', detail: '', state: 'learning', pct: 0.2, start: { kind: 'scale', id: 's2' } },
  ] as Snap['reqs']
  const s: Snap = { rows, plan: ['warm', 'read', 'piece'], done: [], reqs, guide: st('guide', 'read') }
  expect(nextUp(s, 'read')).toMatchObject({ key: 'guide', by: 'guide' }) // the first week's step is a reading one
  expect(nextUp(s, 'tech')).toMatchObject({ key: 'warm', by: 'plan' })
  expect(nextUp({ ...s, guide: undefined }, 'read')).toMatchObject({ key: 'read', by: 'plan' })
  expect(nextUp({ ...s, done: ['read'], guide: undefined }, 'read')).toMatchObject({ key: 'review', by: 'due' })
  expect(nextUp(s, 'scale')).toMatchObject({ title: 'Scales: two octaves', sub: 'Next on your Path, level 2', by: 'path', go: { today: 'start', start: '{"kind":"scale","id":"s2"}' } }) // its first requirement not solid
  expect(nextUp(s, 'theory')).toMatchObject({ title: 'Triads on the white keys', by: 'path' })
  expect(nextUp({ ...s, reqs: [] }, 'theory')).toBeUndefined() // Theory picks for itself
  expect(nextUp({ ...s, reqs: [] }, 'scale')).toMatchObject({ key: 'scale', by: 'next' })
  expect(nextUp(s, 'run')).toMatchObject({ key: 'run', by: 'next' })
  expect(nextUp({ ...s, done: ['warm', 'read', 'piece'] }, 'song')).toMatchObject({ key: 'piece', by: 'next' })
  // a fix after a run is not a page's: it has no strand
  expect(nextUp({ ...s, after: { clean: false, fix, offers: 0 } }, 'tech').by).toBe('plan')
})

it('a 30-day learner stays on mastered frontiers, succeeds at a useful rate, and is never left without a next unit', () => {
  type Skill = { id: string; strand: Strand; level: number; pre?: string }
  const skills: Skill[] = [
    { id: 'read:1', strand: 'read', level: 1 }, { id: 'read:2', strand: 'read', level: 2, pre: 'read:1' }, { id: 'read:3', strand: 'read', level: 3, pre: 'read:2' },
    { id: 'scale:1', strand: 'scale', level: 1 }, { id: 'scale:2', strand: 'scale', level: 2, pre: 'scale:1' }, { id: 'scale:3', strand: 'scale', level: 3, pre: 'scale:2' },
    { id: 'tech:1', strand: 'tech', level: 1 }, { id: 'tech:2', strand: 'tech', level: 2, pre: 'tech:1' }, { id: 'tech:3', strand: 'tech', level: 3, pre: 'tech:2' },
  ]
  const solid = new Set(['read:1', 'scale:1'])
  const wins = new Map<string, number>()
  const log: NonNullable<Snap['log']> = [
    { ts: 1, kind: 'read', label: 'Reading 2', id: 'read:2', acc: 0.6 }, { ts: 2, kind: 'read', label: 'Reading 2', id: 'read:2', acc: 0.65 },
    ...[3, 4, 5, 6, 7].map((ts) => ({ ts, kind: 'scale' as const, label: 'Scales 2', id: 'scale:2', acc: 0.8 })),
  ]
  const used = new Set<string>()
  let success = 0
  for (let day = 0; day < 30; day++) {
    const front = (['read', 'scale', 'tech'] as Strand[]).flatMap((strand) => {
      const x = skills.find((s) => s.strand === strand && !solid.has(s.id) && (!s.pre || solid.has(s.pre)))
      return x ? [x] : []
    })
    const unit = (x: Skill, key = x.id): Unit => ({ key, title: x.id, sub: 'frontier', strand: x.strand, go: { id: x.id } })
    const adapt = front.map((x) => {
      const prev = x.pre && skills.find((s) => s.id === x.pre)
      return { id: x.id, strand: x.strand, ...(prev && { back: unit(prev, `back:${x.id}`) }), change: unit(x, `change:${x.id}`) }
    })
    const n = nextUp({ rows: [piece], plan: [], done: [], log, adapt, lag: front.map((x) => ({ ...unit(x), level: x.level })) })
    expect(n).toBeTruthy()
    used.add(n.by)
    const id = n.go?.id
    const skill = skills.find((x) => x.id === id)
    if (skill?.pre) expect(solid.has(skill.pre)).toBe(true)
    const ok = day % 6 !== 0
    success += Number(ok)
    if (skill) {
      if (ok) wins.set(skill.id, (wins.get(skill.id) ?? 0) + 1)
      if ((wins.get(skill.id) ?? 0) >= 3) solid.add(skill.id)
      log.push({ ts: 100 + day, kind: skill.strand === 'song' ? 'song' : skill.strand, label: skill.id, id: skill.id, acc: ok ? 0.92 : 0.65, by: n.by })
    }
  }
  expect(success / 30).toBeGreaterThanOrEqual(0.75)
  expect(success / 30).toBeLessThanOrEqual(0.92)
  expect(used).toEqual(expect.objectContaining(new Set(['back', 'change', 'lag'])))
})
