// The Read page: stages, review and the Sight Run form.
import { cardKey, cards, dueCards, fluentMs, focus, mastery, reviewPool, STAGES } from '../drill'
import { bestKey, DEFAULT_RUN, LIMITS, type RunSpec } from '../run'
import * as store from '../store'
import { $, readView, RUN_START, runForm, runTitle, type StageRow } from '../ui'
import { drillStats, runSpec, setDrillStats, setRunSpec, stageById } from './state'
import { saveRun, startDrill, startRun } from './drill'

let readTab: 'stages' | 'run' = 'stages'

export async function stageRows(): Promise<StageRow[]> {
  setDrillStats(await store.getDrill())
  const f = focus(drillStats)
  return STAGES.map((stage) => {
    const m = mastery(stage, drillStats)
    const fl = mastery(stage, drillStats, fluentMs(stage))
    const seen = cards(stage).map((c) => drillStats[cardKey(c)]).filter(Boolean)
    return { stage, ...m, fluent: fl.pct, fast: fl.solid, rt: seen.length ? seen.reduce((a, b) => a + b.rt, 0) / seen.length : 0, next: stage === f.stage, due: dueCards(stage, drillStats) }
  })
}

export async function showRead() {
  const saved = await store.getRuns()
  if (saved.last) setRunSpec({ ...DEFAULT_RUN, ...saved.last })
  readView($('#read'), await stageRows(), reviewPool(drillStats).length >= 3, readTab, runForm(runSpec, saved.presets, saved.best, bestKey))
}

/** The form as the DOM has it now, kept inside what the clef can show. */
function readRun(): RunSpec {
  const v = (id: string) => ($(`#${id}`, $('#read')) as HTMLInputElement | HTMLSelectElement).value
  const clef = v('rClef') as RunSpec['clef']
  let lo = Number(v('rLo'))
  let hi = Number(v('rHi'))
  if (lo > hi) [lo, hi] = [hi, lo]
  const [min, max] = LIMITS[clef]
  const n = Number(v('rSize')) > 1 && !v('rNotes').startsWith('k') ? 'nat' : v('rNotes') // intervals and triads: naturals or a key, no loose sharps or flats
  return {
    clef,
    lo: Math.max(min, lo),
    hi: Math.min(max, hi),
    acc: n.startsWith('k') ? 'nat' : (n as RunSpec['acc']),
    fifths: n.startsWith('k') ? Number(n.slice(1)) : 0,
    size: Number(v('rSize')) as RunSpec['size'],
    near: Number(v('rNear')),
    weak: Number(v('rWeak')),
    length: Number(v('rLength')),
    ahead: Number(v('rAhead')),
    widen: ($('#rWiden', $('#read')) as HTMLInputElement).checked,
  }
}

$('#read').addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement
  if (t.name === 'readTab') {
    readTab = t.value as typeof readTab
    return void showRead()
  }
  if (!($(`#rClef`, $('#read')))) return
  const id = (e.target as HTMLElement).id
  let s = readRun()
  if (id === 'rClef') {
    ;[s.lo, s.hi] = RUN_START[s.clef]
    s = { ...s, ...(s.clef === 'bass' ? { acc: s.acc } : {}) }
  }
  void saveRun(s)
  if (id === 'rClef' || id === 'rSize') void showRead() // the pickers list a different span of notes; intervals and triads offer no loose sharps or flats
})
$('#read').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button')
  if (!b) return
  if (b.id === 'rStart') void startRun(readRun())
  else if (b.id === 'rSave') {
    const s = readRun()
    const name = prompt('Name this run', runTitle(s))
    if (name) void store.getRuns().then(async (r) => (await store.saveRuns({ ...r, presets: [...r.presets, { ...s, name }] }), showRead()))
  } else if (b.dataset.runp) void store.getRuns().then((r) => startRun(r.presets[Number(b.dataset.runp)]))
  else if (b.dataset.rund) void store.getRuns().then(async (r) => (await store.saveRuns({ ...r, presets: r.presets.filter((_, i) => i !== Number(b.dataset.rund)) }), showRead()))
  else if (b.dataset.rr) {
    const [lo, hi] = b.dataset.rr.split(':').map(Number)
    void saveRun({ ...readRun(), lo, hi }).then(showRead)
  } else if (b.dataset.stage) {
    const st = stageById(b.dataset.stage)
    if (st) void startDrill(st, !!b.dataset.fast)
  } else if (b.dataset.review) void startDrill('review')
})
