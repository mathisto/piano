// Reading drills and Sight Run on the stage: dealing the cards, scoring them, and the results.
import { type Card, cardKey, dayNum, deck, deckSong, fluentMs, mastery, nextStage, noteCards, record, reviewPool, type Stage, stageDeck, weakest } from '../drill'
import { after, PACED_CARDS, score, type Struck } from '../paced'
import { bestKey, deal, DEFAULT_RUN, goalMs, newTally, runCards, type RunSpec, SET, tally, widened } from '../run'
import { noteName } from '../spell'
import * as store from '../store'
import { $, runTitle } from '../ui'
import { dayKey } from '../week'
import { drill, drillStats, game, hooks, median, resOpen, run, say, setDrill, setDrillStats, setRun, setRunSpec, staff, type RunCtx } from './state'
import { leave, openSong } from './play'

export async function saveRun(s: RunSpec) {
  setRunSpec(s)
  const saved = await store.getRuns()
  await store.saveRuns({ ...saved, last: s })
}

export async function startDrill(which: Stage | 'review', fast = false) {
  setDrillStats(await store.getDrill())
  const stage = which === 'review' ? undefined : which
  fast = fast && !!stage
  const goal = stage ? (fast ? fluentMs(stage) : stage.goalMs) : 3000
  const n = stage?.scale ? 10 : 24 // a fragment takes four beats
  const d = stage ? stageDeck(stage, drillStats, goal, n) : deck(reviewPool(drillStats), drillStats, goal, n)
  const title = stage ? `${stage.name}${fast ? ', for speed' : ''}` : 'Weak notes review'
  const song = deckSong(`drill:${stage ? stage.id : 'review'}`, title, d, stage?.fifths ?? 0)
  const noteCard = noteCards(d, song)
  setDrill({
    stage: which,
    title,
    goal,
    cards: d,
    left: d.map((c) => c.pitches.length),
    agg: d.map(() => ({ clean: true, rt: 0 })),
    noteCard,
    done: 0,
    streak: 0,
    cleanN: 0,
    rts: [],
    before: stage ? mastery(stage, drillStats, goal).pct : 0,
    fast,
  })
  setRun(undefined)
  $('#stagesBtn').textContent = 'All stages'
  await openSong(song, 'read')
  staff.lookahead = -(stage?.cover ?? 0)
  drillHud()
}

export async function startRun(spec: RunSpec) {
  spec = { ...DEFAULT_RUN, ...spec }
  if (spec.pace) spec = { ...spec, ahead: spec.ahead < 2 ? 3 : spec.ahead, widen: false } // a paced run always reads ahead and is one unbroken set
  void saveRun(spec)
  setDrillStats(await store.getDrill())
  setRun({ base: spec, spec, arc: newTally(), turn: 0, sets: 0, setCards: 0, setClean: 0, setRts: [], seen: new Map(), rts: [], done: false })
  await runSet()
}

/** Deal the next set and open it. */
async function runSet() {
  const r = run!
  const pulse = r.spec.pace ? { bpm: r.spec.pace, every: r.spec.every } : undefined // paced: the whole run is one set, so the pulse never breaks
  const n = pulse ? r.spec.length || PACED_CARDS : r.spec.length ? Math.min(SET, r.spec.length - r.arc.cards) : SET
  const d = deal(runCards(r.spec), drillStats, r.spec, n, r.prev)
  r.prev = d[d.length - 1]
  r.setCards = r.setClean = 0
  r.setRts = []
  const title = runTitle(r.spec) + (pulse ? `, ${pulse.bpm} bpm` : '')
  const song = deckSong('drill:run', title, d, r.spec.fifths, pulse)
  setDrill({ stage: 'review', title, goal: goalMs(r.spec), cards: d, left: d.map((c) => c.pitches.length), agg: d.map(() => ({ clean: true, rt: 0 })), noteCard: noteCards(d, song, pulse), done: 0, streak: 0, cleanN: 0, rts: [], before: 0, run: r })
  $('#stagesBtn').textContent = 'Finish'
  await openSong(song, 'read', !!pulse)
  staff.lookahead = r.spec.ahead * (pulse?.every ?? 1) // in beats
  drillHud()
}

/** One card answered: tally it and count the note. */
function runCard(c: Card, clean: boolean, rt: number) {
  const r = run!
  r.arc = tally(r.arc, clean)
  r.setCards++
  if (clean) r.setClean++
  r.setRts.push(rt)
  r.rts.push(rt)
  for (const p of c.pitches) {
    const s = r.seen.get(p) ?? { n: 0, miss: 0, ms: 0 }
    s.n++
    s.ms += rt
    if (!clean) s.miss++
    r.seen.set(p, s)
  }
}

/** A set is done: widen the range if it went well, then deal on, or finish. */
async function runSetDone() {
  const r = run!
  if (r.spec.pace) return runFinish()
  await store.saveDrill(drillStats)
  if (!r.sets++) markRun()
  if (r.spec.widen && r.setCards && r.setClean / r.setCards >= 0.9 && median(r.setRts) <= goalMs(r.spec)) r.spec = widened(r.spec, r.turn++)
  if (r.done || (r.spec.length && r.arc.cards >= r.spec.length)) return runFinish()
  await runSet()
  game.toggle()
}

async function markRun() {
  const done = await store.getPlan(dayKey())
  void store.markPlan(dayKey(), done.includes('read') ? 'review' : 'read')
  void store.markPlan(dayKey(), 'run')
}

/** The notes of a paced set as the judge left them, each with its card. */
const struck = (): Struck[] => game.song.notes.map((n, i) => ({ card: drill!.noteCard[i], p: n.p, h: n.h, t: n.t, grade: game.judge.grade[i], off: game.judge.off[i] }))

/** A paced run is over (the last card went by, or Finish): cards on the beat, how the timing sat, the notes missed, and what the tempo rule says. */
async function pacedFinish(r: RunCtx) {
  const d = drill!
  const sc = score(d.cards, struck())
  if (!sc.n) return leave()
  const { pace: bpm, every } = r.spec
  const saved = await store.getRuns()
  const k = bestKey(r.spec)
  const out = after(saved.paced?.[k], { bpm, every, n: sc.n, hit: sc.hit, day: dayNum() })
  await store.saveRuns({ ...saved, paced: { ...saved.paced, [k]: out.memo } })
  void markRun()
  void store.logHistory({ ts: Date.now(), kind: 'run', label: `${runTitle(r.spec)}, paced at ${bpm} bpm`, acc: sc.hit / sc.n, bias: sc.timing?.bias })
  const names = sc.missed.map((i) => d.cards[i].pitches.map((p) => noteName(p, r.spec.fifths)).join(' '))
  const res = $('#res')
  res.innerHTML = (await import('../ui-results')).pacedResults({ spec: r.spec, n: sc.n, hit: sc.hit, cells: sc.cells, missed: names, timing: sc.timing, wrong: game.judge.wrong, note: out.note })
  resOpen(true)
  $('#runAgain', res).focus()
  say(`Run finished. ${sc.hit} of ${sc.n} cards on the beat.`)
  $('#runAgain', res).onclick = () => void startRun({ ...r.base, pace: out.memo.bpm, every: out.memo.every }).then(() => game.toggle())
  $('#toStages', res).onclick = leave
}

export async function runFinish() {
  const r = run
  if (!r || r.done || !drill) return
  r.done = true
  $('#stagesBtn').textContent = 'Back to Read' // the results are up: the button now leaves
  if (game.phase === 'countin' || game.phase === 'playing' || game.phase === 'waiting') game.toggle()
  if (r.spec.pace) return pacedFinish(r)
  await store.saveDrill(drillStats)
  const saved = await store.getRuns()
  const k = bestKey(r.spec)
  const prev = saved.best[k]
  const record = r.arc.best > (prev?.streak ?? 0)
  const ms = median(r.rts)
  saved.best[k] = { streak: Math.max(prev?.streak ?? 0, r.arc.best), ms: prev?.ms ? Math.min(prev.ms, ms || prev.ms) : ms }
  await store.saveRuns(saved)
  if (r.arc.cards) void store.logHistory({ ts: Date.now(), kind: 'run', label: runTitle(r.spec), acc: r.arc.clean / r.arc.cards, ms: median(r.rts) })
  const notes = [...r.seen].map(([p, v]) => ({ p, ...v }))
  const res = $('#res')
  res.innerHTML = (await import('../ui-results')).runResults({
    spec: r.spec,
    arc: r.arc,
    medianMs: median(r.rts),
    record,
    best: saved.best[k],
    notes,
    weakest: notes.filter((n) => n.miss).sort((a, b) => b.miss / b.n - a.miss / a.n).slice(0, 4).map((n) => noteName(n.p, r.spec.fifths)),
  })
  resOpen(true)
  $('#runAgain', res).focus()
  say(`Run finished. ${r.arc.cards} cards, ${r.arc.cards ? Math.round((r.arc.clean / r.arc.cards) * 100) : 0} percent first try.`)
  $('#runAgain', res).onclick = () => void startRun(r.base).then(() => game.toggle())
  $('#toStages', res).onclick = leave
}

function drillHud() {
  if (!drill) return
  if (!run) {
    $('#hCards').textContent = `${drill.done}/${drill.cards.length}`
    return
  }
  const { arc, spec } = run
  const streak = $('#rStreak')
  const paced = !!spec.pace
  $('small', streak.parentElement!).textContent = paced ? 'On the beat' : 'Streak'
  if (paced) {
    const sc = score(drill.cards, struck())
    $('#hCards').textContent = `${sc.n}/${drill.cards.length}`
    streak.textContent = String(sc.hit)
    return
  }
  $('#hCards').textContent = spec.length ? `${arc.cards}/${spec.length}` : String(arc.cards)
  streak.textContent = String(arc.streak)
}

export function drillOk(noteId: number, rt: number, clean: boolean) {
  if (!drill) return
  const i = drill.noteCard[noteId]
  const a = drill.agg[i]
  a.clean = a.clean && clean
  a.rt = Math.max(a.rt, rt)
  if (--drill.left[i] > 0) return
  record(drillStats, cardKey(drill.cards[i]), a.clean, a.rt)
  drill.done++
  drill.streak = a.clean ? drill.streak + 1 : 0
  if (a.clean) drill.cleanN++
  drill.rts.push(a.rt)
  if (run) runCard(drill.cards[i], a.clean, a.rt)
  drillHud()
}

export async function drillDone() {
  if (run) return runSetDone()
  const d = drill!
  await store.saveDrill(drillStats)
  const done = await store.getPlan(dayKey())
  void store.markPlan(dayKey(), done.includes('read') ? 'review' : 'read')
  void store.logHistory({ ts: Date.now(), kind: 'read', label: d.title, acc: d.cleanN / d.cards.length, ms: median(d.rts) })
  const stage = d.stage === 'review' ? undefined : d.stage
  const m = stage ? mastery(stage, drillStats, d.goal) : undefined
  const nxt = nextStage(drillStats)
  const res = $('#res')
  res.innerHTML = (await import('../ui-results')).drillResults({
    stage: d.title,
    cards: d.cards.length,
    clean: d.cleanN / d.cards.length,
    medianMs: median(d.rts),
    weakest: weakest(drillStats, 3),
    before: d.before,
    after: m ? m.pct : 0,
    solid: !!m?.solid,
    nextName: nxt.name,
    fast: !!d.fast,
    goalMs: d.goal,
  })
  resOpen(true)
  $('#nextSet', res).focus()
  say(`Set complete. ${Math.round((d.cleanN / d.cards.length) * 100)} percent first try.`)
  $('#nextSet', res).onclick = () => void (m?.solid && stage ? startDrill(nxt) : startDrill(d.stage, d.fast)).then(() => game.toggle())
  $('#toStages', res).onclick = leave
}

Object.assign(hooks, { drillOk })
game.on((e) => run?.spec.pace && (e.type === 'hit' || e.type === 'miss') && drillHud())
