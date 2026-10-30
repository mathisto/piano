// The Read page: stages, review and the Sight Run form.
import { cardKey, cards, dueCards, fluentMs, focus, mastery, reviewPool, STAGES } from '../drill'
import { PACE, suggest } from '../paced'
import { bestKey, DEFAULT_RUN, LIMITS, runCards, type RunSpec } from '../run'
import * as store from '../store'
import { $, keepFocus, RUN_START, runTitle } from '../ui'
import type { StageRow } from '../ui-views'
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
  const { readView, runForm } = await import('../ui-views')
  readView($('#read'), await stageRows(), reviewPool(drillStats).length >= 3, readTab, runForm(runSpec, saved.presets, saved.best, bestKey, offer(runSpec, saved.paced?.[bestKey(runSpec)])))
}

/** The tempo a paced run of this setup offers: where the player left it, else a little under their usual time on these cards, else 50. */
const offer = (s: RunSpec, memo?: Parameters<typeof suggest>[2]) => suggest(runCards(s), drillStats, memo)

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
    widen: !!($('#rWiden', $('#read')) as HTMLInputElement | null)?.checked,
    pace: v('rPaced') === '1' ? Number($('#rPace', $('#read')) ? v('rPace') : PACE.start) : 0,
    every: $('#rEvery', $('#read')) ? (Number(v('rEvery')) as 1 | 2) : 1,
  }
}

$('#read').addEventListener('input', (e) => {
  const t = e.target as HTMLInputElement
  if (t.id === 'rPace') $('#rPaceV', $('#read')).textContent = `${t.value} bpm` // the slider speaks as it moves
})
$('#read').addEventListener('change', async (e) => {
  const t = e.target as HTMLInputElement
  if (t.name === 'readTab') {
    readTab = t.value as typeof readTab
    return void keepFocus($('#read'), showRead)
  }
  if (!($(`#rClef`, $('#read')))) return
  const id = (e.target as HTMLElement).id
  let s = readRun()
  if (id === 'rClef') {
    ;[s.lo, s.hi] = RUN_START[s.clef]
    s = { ...s, ...(s.clef === 'bass' ? { acc: s.acc } : {}) }
  }
  const moved = ['rPaced', 'rClef', 'rLo', 'rHi', 'rNotes', 'rSize'].includes(id)
  if (s.pace && moved) {
    // a new range has its own tempo: offer it, and redraw the slider
    const o = offer(s, (await store.getRuns()).paced?.[bestKey(s)])
    s = { ...s, pace: o.bpm, every: o.every }
  }
  await saveRun(s) // before the redraw reads it back
  if (id === 'rClef' || id === 'rSize' || id === 'rPaced' || (s.pace && moved)) void keepFocus($('#read'), showRead) // the pickers list a different span of notes; intervals and triads offer no loose sharps or flats; pace adds a slider
})
$('#read').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button')
  if (!b) return
  if (b.id === 'rStart') void startRun(readRun())
  else if (b.id === 'rSave') {
    const s = readRun()
    const name = prompt('Name this run', runTitle(s))
    if (name) void store.saveRuns((r) => ({ ...r, presets: [...r.presets, { ...s, name }] })).then(() => showRead())
  } else if (b.dataset.runp) void store.getRuns().then((r) => startRun(r.presets[Number(b.dataset.runp)]))
  else if (b.dataset.rund) void store.saveRuns((r) => ({ ...r, presets: r.presets.filter((_, i) => i !== Number(b.dataset.rund)) })).then(() => showRead())
  else if (b.dataset.rr) {
    const [lo, hi] = b.dataset.rr.split(':').map(Number)
    void saveRun({ ...readRun(), lo, hi }).then(showRead)
  } else if (b.dataset.stage) {
    const st = stageById(b.dataset.stage)
    if (st) void startDrill(st, !!b.dataset.fast)
  } else if (b.dataset.review) void startDrill('review')
})
