import './native-midi' // first: it must exist before midi.ts reads requestMIDIAccess
import '@fontsource/barlow-condensed/700.css'
import '@fontsource/barlow-condensed/800-italic.css'
import '@fontsource-variable/hanken-grotesk'
import './style.css'

import * as audio from './audio'
import { Dock } from './dock'
import { DEFAULT_EDGES } from './touch'
import { judged, live, tolerance } from './even'
import { earView, earTap, newEar, playCard, stopEar, type EarRun } from './ear-play'
import { TRAINERS, check as checkAnswer, deal as dealTheory, deckOf, type Trainer } from './theory'
import { STAGES as SCALE_STAGES, mastery as scaleMastery, nextCard, nextStage as nextScaleStage, parseId, passed, record as recordScale, scaleSong, CLEAN_RUNS, degreeOfPitch, quizDeal, quizRecord, quizRight, keyName, type Card as ScaleCard, type Form, type QuizStats } from './scales'
import { DEFAULT_RUN, LIMITS, SET, bestKey, deal, goalMs, newTally, runCards, tally, widened, type RunSpec, type Tally } from './run'
import { STAGES, dayNum, noteCards, cardKey, cards, deck, deckSong, dueCards, focus, mastery, nextStage, record, reviewPool, weakest, type Card, type Stage, type Stats } from './drill'
import { Game, type GameEvent, type Mode, type Result } from './game'
import { Highway } from './highway'
import { icon } from './icons'
import { nextStep } from './pace'
import { knownPitches } from './quiet'
import type { Grade, VelGrade } from './judge'
import { chooseInput, connect, inputs, midiSupported, monitor, onMidi, onPedal, typingKeyboard, type MidiMsg } from './midi'
import { noteName } from './spell'
import { save, settings } from './settings'
import { barAt, fromSpec, type Hand, type Note, type Song } from './song'
import { Staff } from './staff'
import { STARTERS } from './starters'
import * as store from './store'
import { nameChord } from './chord'
import { thumb } from './thumb'
import { creditBlock, creditLine, libraryUrl } from './credits'
import * as lib from './catalog'
import type { Piece } from './catalog-types'
import { mountLibrary } from './library-view'
import { autoSelect, inspectMidi } from './midi-tracks'
import { calibrate, writtenTargets } from './touch'
import { LEVELS, autoLevel, simplify, type Level } from './simplify'
import { applyRun, nextRecipe, stateOf, SYLLABUS, type TechStats } from './syllabus'
import { exercise, PATTERNS, type Opts } from './technique'
import { dayKey, improved, lastWeek, weekOf } from './week'
import { nextOf, path as gradePath, type Ctx, type Start } from './grades'
import { breakToast } from './habit-ui'
import { theoryDue, type PlanMin } from './plan'
import { restTracker } from './rest'
import { streak as dayStreak } from './streak'
import { $, CAL_NOTES, art, creditsDialog, tracksDialog, type Row, progressView, techniqueView, todayView, type TouchCal, drawer, drillResults, library, readView, results, runForm, scalesView, theoryView, type TheoryRunView, cardName, type QuizState, type ScalePick, runResults, runTitle, RUN_START, skeleton, starterRows, userRows, type StageRow } from './ui'
import { LOOK, lookCard, pct, pickPiece, startRate, summaryCard, type RtPiece } from './readthrough'

const app = $('#app')
skeleton(app)

const game = new Game()
const starters = STARTERS.map((s) => fromSpec(s.spec))
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

let highway!: Highway
let staff!: Staff
let dock!: Dock
let current: { song: Song; base: Song; level: Level; heat: number[]; credit?: string } | undefined
let calibrating: { prevOffset: number } | undefined
let midiState: 'idle' | 'ok' | 'blocked' | 'unsupported' = midiSupported ? 'idle' : 'unsupported'
let played = false
let noteTimer = 0
let note = ''

// A reading drill in progress: one card per beat, tracked card by card.
interface Drill {
  stage: Stage | 'review'
  title: string
  goal: number
  cards: Card[]
  left: number[] // notes still to play on each card
  agg: { clean: boolean; rt: number }[]
  noteCard: number[] // note id -> card index
  done: number
  streak: number
  cleanN: number
  rts: number[]
  before: number
  run?: RunCtx
}
// Sight Run: one setup, dealt a set of cards at a time until you finish or run out of lives.
interface RunCtx {
  base: RunSpec // as set up
  spec: RunSpec // as dealt: the range grows when widening is on
  arc: Tally
  prev?: Card
  turn: number
  sets: number
  setCards: number
  setClean: number
  setRts: number[]
  seen: Map<number, { n: number; miss: number; ms: number }>
  rts: number[]
  done: boolean
}
let run: RunCtx | undefined
let runSpec: RunSpec = { ...DEFAULT_RUN }
let readTab: 'stages' | 'run' = 'stages'
let drill: Drill | undefined
let drillStats: Stats = {}

// ---------------------------------------------------------------- views

const lens = new Map<string, { bars: number; len: number; tracks?: { all: number; used: number } }>()

const thumbs = new Map<string, string>(STARTERS.map((st) => [st.spec.id, thumb(fromSpec(st.spec))]))

async function libraryData() {
  const [stored, prog] = await Promise.all([store.listSongs(), store.allProgress()])
  for (const s of stored) {
    if (!lens.has(s.id)) {
      try {
        const song = await store.toSong(s, settings.split)
        let tracks
        if (s.kind !== 'xml') {
          const r = inspectMidi(s.bytes)
          tracks = { all: r.tracks.filter((t) => !t.percussion).length, used: (s.pick ?? autoSelect(r)).tracks.length }
        }
        lens.set(s.id, { bars: song.bars.length, len: song.end, tracks })
        thumbs.set(s.id, thumb(song))
      } catch {
        lens.set(s.id, { bars: 0, len: 0 })
      }
    }
  }
  const starts = starterRows(STARTERS, starters, prog, thumbs)
  const mine = userRows(stored, prog, lens, thumbs)
  // one row carries the lamp: the piece you played last, or the first warm-up if you have not played yet
  const libRows: Row[] = [...prog.keys()].flatMap((k) => {
    const p = k.startsWith('lib:') && lib.piece(k.slice(4))
    return p ? [{ id: `lib:${p.id}`, title: p.title, sub: `${lib.catalog.composers[p.composer]?.name} · Level ${lib.gradeOf(p)}`, bars: p.bars, len: p.sec, prog: prog.get(k), user: false, thumb: '' }] : []
  })
  const last = [...starts, ...mine, ...libRows].filter((r) => r.prog?.last).sort((a, b) => b.prog!.last - a.prog!.last)[0] ?? starts[0]
  return { starts, mine, last, all: [...starts, ...mine, ...libRows] }
}

async function showLibrary(err = '') {
  const { starts, mine, last } = await libraryData()
  last.cont = true
  library($('#library'), starts, mine, err)
  mountLibrary($('#library'), await store.allProgress(), libSong)
}

async function libSong(p: Piece) {
  return store.toSong({ id: `lib:${p.id}`, title: p.title, bytes: await lib.pieceBytes(p), added: 0, kind: p.format === 'midi' ? 'midi' : 'xml', pick: p.pick }, settings.split)
}

const SECTIONS = ['today', 'library', 'read', 'scales', 'theory', 'technique', 'progress', 'play'] as const

function view(name: (typeof SECTIONS)[number]) {
  for (const v of SECTIONS) $(`#${v}`).classList.toggle('on', v === name)
  $('#nav').hidden = name === 'play'
  $('#modeSeg').hidden = name !== 'play' || game.mode === 'read'
  $('#hud').hidden = name !== 'play'
  if (name !== 'play') $('#title').textContent = ''
  $('#title').hidden = name !== 'play' // an empty heading is noise to a screen reader
}

type Section = 'today' | 'songs' | 'read' | 'scales' | 'theory' | 'technique' | 'progress'

async function showSection(name: Section, err = '') {
  await flushPractice()
  ;($(`input[name=nav][value=${name}]`) as HTMLInputElement).checked = true
  view(name === 'songs' ? 'library' : name)
  if (name === 'today') await showToday()
  else if (name === 'songs') await showLibrary(err)
  else if (name === 'read') await showRead()
  else if (name === 'scales') await showScales()
  else if (name === 'theory') showTheory()
  else if (name === 'technique') await showTechnique()
  else await showProgress()
}

async function stageRows(): Promise<StageRow[]> {
  drillStats = await store.getDrill()
  const f = focus(drillStats)
  return STAGES.map((stage) => {
    const m = mastery(stage, drillStats)
    const seen = cards(stage).map((c) => drillStats[cardKey(c)]).filter(Boolean)
    return { stage, ...m, rt: seen.length ? seen.reduce((a, b) => a + b.rt, 0) / seen.length : 0, next: stage === f.stage, due: dueCards(stage, drillStats) }
  })
}

async function showToday() {
  const [{ last, all }, rows, days, done] = await Promise.all([libraryData(), stageRows(), store.getPractice(), store.getPlan(dayKey())])
  const next = rows.find((r) => r.next)!
  const ts = await store.getTech()
  const nr = nextRecipe(ts, dayNum())
  const ex = exercise(nr.recipe.opts, settings.edges)
  const worst = last.prog?.heat.length ? worstBars(last.prog.heat, last.bars) : null
  const second = rows.find((r) => r.due && !r.next) // a second stage with cards due, for the longest plan
  const ctx = await pathCtx(ts)
  const nx = nextOf(gradePath(ctx))
  const sst = nextScaleStage(ctx.scales)
  const td = theoryDue(ctx.theory)
  const PATH_STEP = { scale: 'scale', read: 'read', tech: 'warm', theory: 'theory' } // the plan step that does a requirement
  // one snapshot a week lets the recap say what got better; the recap shows on Monday and Tuesday
  const week = weekOf(days).days
  const snap = { read: Object.fromEntries(rows.map((r) => [r.stage.id, r.pct])), tech: SYLLABUS.filter((r) => stateOf(ts, r.id, dayNum()) === 'solid').length }
  if (!(await store.getSnap(week[0].key))) await store.putSnap(week[0].key, snap)
  const lw = [1, 2].includes(new Date().getDay()) ? lastWeek(days, settings.goal) : null
  const prevKey = dayKey(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 7 - ((new Date().getDay() + 6) % 7)))
  const sight = pickPiece(rtPieces(), await store.allProgress())
  const recap = lw ? { ...lw, better: improved(await store.getSnap(prevKey), snap, Object.fromEntries(rows.map((r) => [r.stage.id, r.stage.name]))) ?? undefined } : null
  todayView($('#today'), {
    last: { id: last.id, title: last.title, sub: last.prog?.best ? `Best ${Math.round(last.prog.best.acc * 100)}%` : last.sub, first: !last.prog?.last },
    again: (() => {
      const r = all.filter((x) => x.prog?.due !== undefined && x.prog.due <= dayNum() && x.id !== last.id).sort((a, b) => a.prog!.due! - b.prog!.due!)[0]
      return r ? { id: r.id, title: r.title, sub: 'Due for another go' } : undefined
    })(),
    read: { id: next.stage.id, name: next.due ? `Review ${next.stage.name.toLowerCase()}` : next.stage.name, pct: next.pct, line: next.due ? `${next.due} ${next.due === 1 ? 'card' : 'cards'} due` : next.seen ? `${next.seen} of ${next.total} notes seen` : next.stage.blurb },
    tech: ex.title.charAt(0).toUpperCase() + ex.title.slice(1),
    techDue: nr.reason === 'due',
    techId: nr.recipe.id,
    fix: worst && last.bars ? { id: last.id, title: last.title, ...worst } : undefined,
    review: second ? { id: second.stage.id, name: `Review ${second.stage.name.toLowerCase()}`, line: `${second.due} ${second.due === 1 ? 'card' : 'cards'} due` } : undefined,
    week: weekOf(days),
    goal: settings.goal,
    planMin: settings.planMin,
    streak: dayStreak(days),
    scale: { title: `Scales: ${sst.name}`, sub: `Next: ${keyName(nextCard(sst, ctx.scales).tonic, nextCard(sst, ctx.scales).form)}, at ${sst.bpm} bpm`, pct: scaleMastery(sst, ctx.scales).pct, start: { kind: 'scale', id: sst.id } },
    theory: td && { title: `Theory: ${td.name}`, sub: `${td.due} ${td.due === 1 ? 'card' : 'cards'} due for review`, start: { kind: 'theory', trainer: td.trainer, level: td.level } },
    path: nx?.start && nx.start.kind !== 'scale' ? { title: `Path: ${nx.name}`, sub: `Level ${nx.level}. ${nx.detail}`, start: nx.start } : undefined,
    done: nx?.start && done.includes(PATH_STEP[nx.start.kind]) ? [...done, 'path'] : done,
    recap: recap ?? undefined,
    sight: sight && { id: sight.piece.id, title: sight.piece.title, sub: `Read through, no stopping · ${sight.fresh ? 'new ' : ''}${sight.piece.level}` },
  })
  $('#today').querySelectorAll<HTMLInputElement>('input[name=planMin]').forEach((r) => (r.onchange = () => {
    settings.planMin = Number(r.value) as PlanMin
    save()
    void showToday()
  }))
}

async function showProgress() {
  const [stages, days, log, ts, history] = await Promise.all([stageRows(), store.getPractice(), store.getTouch(), store.getTech(), store.getHistory()])
  const today = dayNum()
  const gp = gradePath(await pathCtx(ts))
  progressView($('#progress'), { week: weekOf(days), goal: settings.goal, streak: dayStreak(days), path: gp, next: nextOf(gp), stages, log, history, stats: drillStats, tech: SYLLABUS.map((r) => ({ id: r.id, label: r.label, group: PATTERNS[r.opts.pattern], state: stateOf(ts, r.id, today) })) })
  $('#pGoal').addEventListener('change', (e) => {
    settings.goal = Number((e.target as HTMLSelectElement).value)
    save()
    void showProgress()
  })
}

/** The state every Path requirement is judged from. */
async function pathCtx(tech?: TechStats): Promise<Ctx> {
  const [scales, theory, t] = await Promise.all([store.getScales(), store.getTheory(), tech ?? store.getTech()])
  return { scales, drill: drillStats, tech: t, theory, day: dayNum() }
}

/** Start whatever a Path requirement or a Today row names. */
async function startReq(s: Start) {
  if (s.kind === 'scale') {
    const st = SCALE_STAGES.find((x) => x.id === s.id)!
    startScale(nextCard(st, await store.getScales()), st.bpm)
  } else if (s.kind === 'read') void startDrill(stageById(s.id)!)
  else if (s.kind === 'tech') void openSong(exercise((SYLLABUS.find((r) => r.id === s.id) ?? SYLLABUS[0]).opts, settings.edges), 'perform')
  else {
    theoryLevels[s.trainer] = s.level
    await showSection('theory')
    await startTheory(s.trainer)
  }
}

$('#progress').addEventListener('click', (e) => {
  const st = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-start]')
  if (st) return void startReq(JSON.parse(st.dataset.start!))
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button.cell')
  if (b?.dataset.stage) void startDrill(stageById(b.dataset.stage)!)
  else if (b?.dataset.recipe) void openSong(exercise((SYLLABUS.find((r) => r.id === b.dataset.recipe) ?? SYLLABUS[0]).opts, settings.edges), 'perform')
})

$('#today').addEventListener('click', (e) => {
  const g = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-goal]')
  if (g) {
    settings.goal = Number(g.dataset.goal)
    save()
    return void showToday()
  }
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-today]')
  if (!b) return
  if (b.dataset.today === 'start') void startReq(JSON.parse(b.dataset.start!))
  else if (b.dataset.today === 'run') void store.getRuns().then((r) => startRun({ ...DEFAULT_RUN, ...r.last }))
  else if (b.dataset.today === 'continue') void openById(b.dataset.id!, 'learn')
  else if (b.dataset.today === 'fix') void fixBars(b.dataset.id!, Number(b.dataset.a), Number(b.dataset.b))
  else if (b.dataset.today === 'read') void startDrill(stageById(b.dataset.id!)!)
  else if (b.dataset.today === 'sight') void readThrough(b.dataset.id)
  else void openSong(exercise((SYLLABUS.find((r) => r.id === b.dataset.id) ?? SYLLABUS[0]).opts, settings.edges), 'perform')
})

/** Open a piece in Learn with two worst bars looped at a lower tempo. */
async function fixBars(id: string, a: number, b: number) {
  await openById(id, 'learn')
  if (!current || current.song.id !== id) return
  const bars = current.song.bars
  game.setRate(0.7)
  game.setLoop({ a: bars[a].t0, b: bars[b].t1 })
  syncMode()
  onPhase()
}

async function showTechnique() {
  const el = $('#technique')
  const ts = await store.getTech()
  const today = dayNum()
  const path = SYLLABUS.map((r) => ({ id: r.id, label: r.label, group: PATTERNS[r.opts.pattern], state: stateOf(ts, r.id, today) }))
  techniqueView(el, settings.tech, touchCal, calMsg, thumb(exercise(settings.tech, settings.edges)), path)
  el.querySelectorAll<HTMLButtonElement>('button[data-recipe]').forEach((b) => (b.onclick = () => {
    const r = SYLLABUS.find((x) => x.id === b.dataset.recipe)
    if (r) void openSong(exercise(r.opts, settings.edges), 'perform')
  }))
  const redraw = () => void showTechnique()
  const on = (id: string, f: (v: string) => void, rerender = false) => {
    const sel = el.querySelector<HTMLSelectElement>(id)
    if (sel)
      sel.addEventListener('change', () => {
        f(sel.value)
        save()
        if (rerender) redraw()
        else el.querySelector('.tprev')!.innerHTML = thumb(exercise(settings.tech, settings.edges))
      })
  }
  on('#tPattern', (v) => (settings.tech.pattern = v as Opts['pattern']), true)
  on('#tKey', (v) => {
    settings.tech.tonic = parseInt(v)
    settings.tech.minor = v.endsWith('m') || undefined
  })
  on('#tHands', (v) => (settings.tech.hands = v as Opts['hands']))
  on('#tDyn', (v) => (settings.tech.dyn = v as Opts['dyn']))
  on('#tArtic', (v) => (settings.tech.artic = v === 'normal' ? undefined : (v as Opts['artic'])))
  on('#tLevel', (v) => (settings.tech.level = Number(v) as 1 | 2 | 3))
  on('#tBpm', (v) => (settings.tech.bpm = Number(v)))
  $('#tStart', el).onclick = () => void openSong(exercise(settings.tech, settings.edges), 'perform')
  const click = (sel: string, f: () => void) => {
    const b = el.querySelector<HTMLButtonElement>(sel)
    if (b) b.onclick = f
  }
  click('#calStart', () => {
    touchCal = { step: 0, got: 0 }
    calGot = [[], [], []]
    calMsg = ''
    void showTechnique()
  })
  click('#calCancel', () => {
    touchCal = null
    void showTechnique()
  })
  click('#calReset', () => {
    settings.edges = undefined
    save()
    calMsg = ''
    void showTechnique()
  })
}

// ---------------------------------------------------------------- touch calibration

let touchCal: TouchCal | null = null
let calGot: number[][] = [[], [], []]
let calMsg = ''

/** A note-on from a real keyboard while calibrating; returns true when it was consumed. */
function calNote(vel: number) {
  if (!touchCal || !$('#technique').classList.contains('on')) return false // only while the Technique page is open
  const c = touchCal
  calGot[c.step].push(Math.max(1, Math.round(vel * 127)))
  c.got = calGot[c.step].length
  if (c.got >= CAL_NOTES) {
    if (c.step < 2) touchCal = { step: (c.step + 1) as 1 | 2, got: 0 }
    else {
      const e = calibrate(calGot[0], calGot[1], calGot[2])
      if (e) {
        settings.edges = e
        save()
      }
      calMsg = e ? 'Saved. Soft, medium and hard now follow your own playing.' : 'The three levels were too close together. Play soft very gently and hard firmly, then try again.'
      touchCal = null
    }
  }
  void showTechnique()
  return true
}

async function showRead() {
  const saved = await store.getRuns()
  if (saved.last) runSpec = { ...DEFAULT_RUN, ...saved.last }
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
  const n = Number(v('rSize')) > 1 ? 'nat' : v('rNotes') // intervals and triads are built on white keys
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

async function saveRun(s: RunSpec) {
  runSpec = s
  const saved = await store.getRuns()
  await store.saveRuns({ ...saved, last: s })
}

// ---------------------------------------------------------------- Theory trainers

interface TheoryRun extends Omit<TheoryRunView, 'missed' | 'medianMs'> {
  level: number
  at: number
  rts: number[]
  missed: Set<string>
  buf: number[]
  timer: number
  ears: EarRun
}
let theory: TheoryRun | undefined
let theoryStats: Stats = {}
const theoryLevels = Object.fromEntries(TRAINERS.map((t) => [t.id, 1])) as Record<Trainer, number>

function showTheory() {
  theoryView($('#theory'), theoryLevels, theory && { ...theory, missed: [...theory.missed], medianMs: median(theory.rts), ear: earView(theory.ears) })
}

async function startTheory(trainer: Trainer) {
  theoryStats = await store.getTheory()
  const level = theoryLevels[trainer]
  if (theory) stopEar(theory.ears)
  theory = { trainer, level, cards: dealTheory(deckOf(trainer, level), theoryStats, 15), i: 0, step: 0, ok: 0, streak: 0, best: 0, at: performance.now(), rts: [], missed: new Set(), buf: [], timer: 0, ears: newEar() }
  showTheory()
  promptTheory()
}

/** An ear or rhythm card sounds its prompt (the app's own piano and click, whatever the Sound setting); the keyboard is deaf until it ends. After a miss, only the answer is played again. */
function promptTheory(demo = false) {
  const t = theory
  const c = t?.cards[t.i]
  if (!t || !c?.play) return
  t.step = 0
  t.buf = []
  t.at = playCard(t.ears, c, () => $('#theory').classList.contains('on'), finishTheory, demo)
}

const theoryOpen = () => $('#theory').classList.contains('on') && !!theory && theory.i < theory.cards.length && !theory.answered

/** A key played on a Theory card: single-note answers are judged at once, chords when the hand has settled. */
function theoryNote(p: number, ts: number) {
  const t = theory!
  if (ts < t.ears.deaf) return // a prompt is playing
  const c = t.cards[t.i]
  if (c.play?.kind === 'rhythm') return earTap(t.ears, c, ts) // any key is a tap
  t.buf.push(p)
  const step = c.steps[t.step]
  clearTimeout(t.timer)
  if (t.buf.length >= step.pcs.length) judgeTheory()
  else t.timer = window.setTimeout(judgeTheory, 600)
}

function judgeTheory() {
  const t = theory
  if (!t || t.answered) return
  clearTimeout(t.timer)
  const c = t.cards[t.i]
  const ok = checkAnswer(c.steps[t.step], t.buf)
  t.buf = []
  if (ok && t.step + 1 < c.steps.length) {
    t.step++
    return showTheory()
  }
  finishTheory(ok, performance.now() - t.at)
}

function finishTheory(ok: boolean, rt: number) {
  const t = theory
  if (!t || t.answered) return
  const c = t.cards[t.i]
  record(theoryStats, c.id, ok, rt)
  practised(Math.min(30, rt / 1000)) // Theory has no song on the stage, so its time is counted here
  void store.saveTheory(theoryStats)
  t.rts.push(rt)
  t.answered = ok ? 'ok' : 'miss'
  if (ok) {
    t.ok++
    t.streak++
    t.best = Math.max(t.best, t.streak)
    setTimeout(nextTheory, c.play ? 1200 : 700)
  } else {
    t.streak = 0
    t.missed.add(c.name ?? c.prompt)
    promptTheory(true)
  }
  showTheory()
}

function nextTheory() {
  const t = theory
  if (!t) return
  t.i++
  t.step = 0
  t.answered = undefined
  t.at = performance.now()
  if (t.i === t.cards.length) void store.markPlan(dayKey(), 'theory')
  if (t.i === t.cards.length) void store.logHistory({ ts: Date.now(), kind: 'theory', label: TRAINERS.find((x) => x.id === t.trainer)!.name, acc: t.ok / t.cards.length, ms: t.trainer === 'rhythm' ? undefined : median(t.rts) })
  promptTheory()
  showTheory()
}

$('#theory').addEventListener('change', (e) => {
  const s = e.target as HTMLSelectElement
  if (s.dataset.tlevel) theoryLevels[s.dataset.tlevel as Trainer] = Number(s.value)
})
$('#theory').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button')
  if (!b) return
  if (b.dataset.trainer) void startTheory(b.dataset.trainer as Trainer)
  else if (b.id === 'thNext') nextTheory()
  else if (b.id === 'thReplay' && theory) {
    theory.ears.replays++
    promptTheory()
    showTheory()
  } else if (b.id === 'thMenu') {
    if (theory) stopEar(theory.ears)
    theory = undefined
    showTheory()
  } else if (b.id === 'thAgain' && theory) void startTheory(theory.trainer)
})

let scaleTab: 'stages' | 'pick' | 'quiz' = 'stages'
let quiz: QuizState | undefined
let quizStats: QuizStats = {}

async function newQuiz() {
  quizStats = await store.getQuiz()
  quiz = { cards: quizDeal(quizStats, 10), i: 0, ok: 0, streak: 0, best: 0 }
}

/** A degree chosen, by tap or by pressing its note: score it, keep the stats, show the reason. */
function answerQuiz(degree: number) {
  if (!quiz || quiz.picked !== undefined || quiz.i >= quiz.cards.length) return
  const ok = quizRight(quiz.cards[quiz.i], degree)
  quiz.picked = degree
  quiz.streak = ok ? quiz.streak + 1 : 0
  quiz.best = Math.max(quiz.best, quiz.streak)
  if (ok) quiz.ok++
  quizRecord(quizStats, quiz.cards[quiz.i], ok)
  void store.saveQuiz(quizStats)
  void showScales()
}
const quizOpen = () => $('#scales').classList.contains('on') && scaleTab === 'quiz' && !!quiz
let scalePick: ScalePick = { tonic: 0, form: 'major', hands: 'R', oct: 1, bpm: 60 }

async function showScales() {
  const stats = await store.getScales()
  const f = nextScaleStage(stats)
  if (scaleTab === 'quiz' && !quiz) await newQuiz()
  scalesView($('#scales'), SCALE_STAGES.map((stage) => ({ stage, ...scaleMastery(stage, stats), next: stage === f, card: nextCard(stage, stats) })), scaleTab, scalePick, quiz)
}

const startScale = (c: ScaleCard, bpm: number) => void openSong(scaleSong(c, bpm), 'perform')

$('#scales').addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement
  if (t.name === 'scaleTab') {
    scaleTab = t.value as typeof scaleTab
    return void showScales()
  }
  const v = (id: string) => ($(`#${id}`, $('#scales')) as HTMLSelectElement | null)?.value
  if (!v('sgForm')) return
  const form = v('sgForm') as Form
  scalePick = { form, tonic: Number(v('sgKey')), hands: v('sgHands') as ScalePick['hands'], oct: Number(v('sgOct')) as 1 | 2, bpm: Number(v('sgBpm')) }
  if (t.id !== 'sgBpm') void showScales() // major and minor name the keys differently, and the fingering line follows the key
})
$('#scales').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button')
  if (!b) return
  if (b.id === 'sgStart') startScale(scalePick, scalePick.bpm)
  else if (b.dataset.qd) answerQuiz(Number(b.dataset.qd))
  else if (b.id === 'qNext' && quiz) {
    quiz.i++
    quiz.picked = undefined
    void showScales()
  } else if (b.id === 'qAgain') void newQuiz().then(showScales)
  else if (b.dataset.sstage) {
    const st = SCALE_STAGES.find((x) => x.id === b.dataset.sstage)!
    void store.getScales().then((stats) => startScale(nextCard(st, stats), st.bpm))
  }
})

async function ensureStage() {
  if (highway) return
  await Promise.all([document.fonts.load('700 16px "Barlow Condensed"'), document.fonts.load('40px Bravura')])
  highway = new Highway($('#stage'), game)
  await highway.init()
  highway.onFrame = frame
  screenKeys(highway.app.canvas)
  staff = new Staff($('#staff'), game)
  staff.onDense = () => void stepSimplify()
  dock = new Dock($('#dock'), game)
  dock.onNote = flash
  dock.onHands = () => staff.render()
}

/** Click or touch the on-screen keys to play them; drag across keys to glide. */
function screenKeys(canvas: HTMLCanvasElement) {
  const down = new Map<number, number>() // pointer id -> pitch held
  const at = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    return highway.keyAt(e.clientX - r.left, e.clientY - r.top)
  }
  const lift = (id: number) => {
    const p = down.get(id)
    if (p === undefined) return
    down.delete(id)
    if (![...down.values()].includes(p)) game.release(p, performance.now(), true)
  }
  canvas.addEventListener('pointerdown', (e) => {
    const k = at(e)
    if (!k) return
    canvas.setPointerCapture(e.pointerId)
    audio.unlock()
    down.set(e.pointerId, k.p)
    game.press(k.p, k.vel, performance.now(), true)
    played = true
    updateBanner()
  })
  canvas.addEventListener('pointermove', (e) => {
    const was = down.get(e.pointerId)
    if (was === undefined) return
    const k = at(e)
    if (!k || k.p === was) return
    lift(e.pointerId)
    down.set(e.pointerId, k.p)
    game.press(k.p, k.vel, performance.now(), true)
  })
  for (const ev of ['pointerup', 'pointercancel'] as const) canvas.addEventListener(ev, (e) => lift(e.pointerId))
}

async function openSong(base: Song, mode: Mode) {
  game.endPass()
  // a busy arrangement opens at the mildest level that fits the staff; the start card can change it
  const level = mode === 'read' || base.id.startsWith('tech:') || base.id.startsWith('scale:') ? 0 : ((await store.getSimplify(base.id)) as Level | undefined) ?? autoLevel(base)
  const song = simplify(base, level)
  if (settings.asWritten && !song.dyn && mode !== 'read') {
    const w = writtenTargets(song.notes, settings.edges)
    if (w) song.notes.forEach((n, i) => (n.want = w[i]))
  }
  game.known = knownPitches(await store.getDrill())
  view('play')
  void audio.preload() // the piano is about to be wanted: Listen, the screen keys, browser sound
  await ensureStage()
  game.load(song, mode)
  const prog = await store.getProgress(song.id)
  current = { song, base, level, heat: prog.heat }
  $('#title').textContent = song.title
  $('#stagesBtn').hidden = mode !== 'read'
  document.body.classList.toggle('reading', mode === 'read')
  $('#brand').setAttribute('aria-label', 'Piano Forte: leave this piece')
  if (mode !== 'read') ($(`input[name=mode][value=${mode}]`) as HTMLInputElement).checked = true
  $('#modeSeg').hidden = mode === 'read'
  $('#play').classList.toggle('drill', mode === 'read')
  applyLayout()
  highway.layout()
  staff.render()
  dock.setSong(song, prog.heat)
  syncMode()
  dock.setPhase()
  resOpen(false)
  onPhase()
  history.replaceState(null, '', mode === 'read' ? location.pathname : '#' + song.id)
}

function leave() {
  if (document.body.classList.contains('zen')) zen()
  void flushPractice()
  document.body.classList.remove('hush')
  const wasDrill = !!drill
  const techSong = current?.song.id.startsWith('tech:')
  const scaleSong_ = current?.song.id.startsWith('scale:')
  if (drill) void store.saveDrill(drillStats)
  drill = undefined
  run = undefined
  rtEnd()
  staff.lookahead = 0
  game.endPass()
  if (game.phase === 'countin' || game.phase === 'playing' || game.phase === 'waiting') game.toggle()
  if (calibrating) {
    settings.offset = calibrating.prevOffset
    calibrating = undefined
  }
  current = undefined
  $('#stagesBtn').hidden = true
  document.body.classList.remove('reading')
  $('#play').classList.remove('drill')
  history.replaceState(null, '', location.pathname)
  void showSection(wasDrill ? 'read' : scaleSong_ ? 'scales' : techSong ? 'technique' : 'songs')
}

/** Show the panes the view asks for: staff only, both, or falling notes only. */
function applyLayout() {
  const v = game.view
  const p = $('#play')
  $('#staff').hidden = v === 'falling'
  p.classList.toggle('v-sheet', v === 'sheet')
  p.classList.toggle('v-falling', v === 'falling')
  p.style.setProperty('--pa', `${settings.pane * 100}fr`)
  p.style.setProperty('--pb', `${(1 - settings.pane) * 100}fr`)
  const sp = $('#split')
  sp.hidden = !current || game.mode === 'read'
  sp.classList.toggle('edge', v !== 'both')
  sp.setAttribute('aria-valuenow', String(Math.round((v === 'falling' ? 0 : v === 'sheet' ? 1 : settings.pane) * 100)))
  sp.setAttribute('aria-valuetext', v === 'both' ? 'Sheet music and falling notes' : v === 'sheet' ? 'Sheet music only' : 'Falling notes only')
}

function setView(v: 'both' | 'sheet' | 'falling') {
  settings.view = v
  save()
  applyLayout()
  staff.render()
  highway.layout() // the stage changed size: the resize observer follows, this makes it immediate
}

// The divider between the staff and the falling notes: drag it, and an end of the track shows one pane alone.
const PANE = { min: 0.26, max: 0.72, def: 0.4, falling: 0.17, sheet: 0.8 }
const dragFrom = { top: 0, total: 1, y: 0, moved: false }

/** Place the divider at `p`, the staff's share of the room: between the stops both panes show, past them one pane. */
function setPane(p: number) {
  const v = p < PANE.falling ? 'falling' : p > PANE.sheet ? 'sheet' : 'both'
  if (v === 'both') settings.pane = Math.min(PANE.max, Math.max(PANE.min, p))
  if (v !== settings.view) setView(v)
  else applyLayout()
}

/** A tap or Enter walks both, staff only, falling notes only: the way to resize without dragging. */
function cycle() {
  const v = settings.view
  setPane(v === 'both' ? 1 : v === 'sheet' ? 0 : PANE.def)
  save()
}

// Staff size: pinch, trackpad pinch, plus and minus, or the buttons. Smaller shows more bars, and a second line once two fit.
const ZOOM = { min: 0.26, max: 1.8, step: 1.15 }
let zoomFrame = 0
function setZoom(z: number) {
  const v = Math.round(Math.min(ZOOM.max, Math.max(ZOOM.min, z)) * 50) / 50
  if (v === settings.zoom) return
  settings.zoom = v
  cancelAnimationFrame(zoomFrame)
  zoomFrame = requestAnimationFrame(() => {
    save()
    staff.render()
  })
}
{
  const host = $('#staff')
  const pts = new Map<number, { x: number; y: number }>()
  let from = { d: 0, z: 1 }
  const spread = () => {
    const [a, b] = [...pts.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }
  let tap = { t: 0, x: 0, y: 0 } // the last single tap, for a double tap that puts the size back to 1
  let moved = false
  let down = { x: 0, y: 0 }
  host.addEventListener('pointerdown', (e) => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    down = { x: e.clientX, y: e.clientY }
    moved = pts.size > 1
    if (pts.size === 2) from = { d: spread(), z: settings.zoom }
  })
  host.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pts.size === 2 && from.d > 20) setZoom(from.z * (spread() / from.d)) // fingers apart: bigger notes, together: more bars
    else if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) moved = true
  })
  host.addEventListener('pointerup', (e) => {
    const alone = pts.size === 1 && !moved && !(e.target as HTMLElement).closest('.zoomc, .barno')
    pts.delete(e.pointerId)
    if (!alone) return (tap.t = 0)
    if (e.timeStamp - tap.t < 320 && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 30) {
      tap.t = 0
      setZoom(1)
    } else tap = { t: e.timeStamp, x: e.clientX, y: e.clientY }
  })
  host.addEventListener('pointercancel', (e) => pts.delete(e.pointerId))
  host.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey) return // a trackpad pinch arrives as ctrl + wheel
    e.preventDefault()
    setZoom(settings.zoom * Math.exp(-e.deltaY / 200))
  }, { passive: false })
  $('#zoomOut').onclick = () => setZoom(settings.zoom / ZOOM.step)
  $('#zoomIn').onclick = () => setZoom(settings.zoom * ZOOM.step)
  // the whole piece in view; pressed again, back to the normal size
  $('#zoomFit').onclick = () => {
    const f = staff.fit(ZOOM.min, 1)
    setZoom(settings.zoom === f ? 1 : f)
  }
  // the buttons can be dragged by their grip to wherever they are out of the way
  const box = $('#staff .zoomc')
  const place = ([x, y]: [number, number]) => {
    box.style.setProperty('--zx', String(x))
    box.style.setProperty('--zy', String(y))
  }
  place(settings.zpos)
  const grip = $('#zoomGrip')
  grip.onpointerdown = (e) => {
    grip.setPointerCapture(e.pointerId)
    box.classList.add('drag')
    const b = box.getBoundingClientRect()
    const off = { x: e.clientX - b.left, y: e.clientY - b.top }
    grip.onpointermove = (m) => {
      const h = host.getBoundingClientRect()
      const f = (v: number, size: number, span: number) => Math.min(1, Math.max(0, span > 0 ? (v - 8) / (span - 16 - size) : 1))
      settings.zpos = [f(m.clientX - off.x - h.left, b.width, h.width), f(m.clientY - off.y - h.top, b.height, h.height)]
      place(settings.zpos)
    }
    grip.onpointerup = grip.onpointercancel = () => {
      grip.onpointermove = grip.onpointerup = grip.onpointercancel = null
      box.classList.remove('drag')
      save()
    }
  }
}

/** One step by keyboard: down and up walk through falling only, both with the pane resized, and sheet only. */
function nudge(dir: 1 | -1) {
  const v = settings.view
  if (v === 'falling') return dir > 0 ? setPane(PANE.def) : undefined
  if (v === 'sheet') return dir < 0 ? setPane(PANE.def) : undefined
  const p = settings.pane + dir * 0.06
  setPane(p < PANE.min ? 0 : p > PANE.max ? 1 : p)
  save()
}

{
  const sp = $('#split')
  sp.onpointerdown = (e) => {
    sp.setPointerCapture(e.pointerId)
    sp.classList.add('drag')
    const top = ($('#staff').hidden ? sp : $('#staff')).getBoundingClientRect().top
    const h = sp.offsetHeight
    Object.assign(dragFrom, { top: top + h / 2, total: $('#stage').getBoundingClientRect().bottom - top - h, y: e.clientY, moved: false })
  }
  sp.onpointermove = (e) => {
    if (!sp.hasPointerCapture(e.pointerId)) return
    if (Math.abs(e.clientY - dragFrom.y) > 4) dragFrom.moved = true
    if (dragFrom.moved) setPane((e.clientY - dragFrom.top) / dragFrom.total)
  }
  sp.onpointercancel = () => sp.classList.remove('drag')
  sp.onpointerup = () => {
    sp.classList.remove('drag')
    if (dragFrom.moved) save()
    else cycle()
  }
  sp.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') cycle()
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') nudge(e.key === 'ArrowDown' ? 1 : -1)
    else return
    e.preventDefault()
  }
}

function syncMode() {
  for (const e of document.querySelectorAll<HTMLElement>('#hud [data-m]')) {
    const r = e.dataset.run
    e.hidden = e.dataset.m !== game.mode || (!!r && !run)
  }
  dock.sync()
}

// ---------------------------------------------------------------- per-frame

let last = { score: -1, combo: -1, count: 0 }

// Time spent playing, per local day. It only goes up, so it can measure effort without shaming anyone.
let sessionSec = 0
let lastFrame = 0
const rest = restTracker()

/** Seconds practised: the day's total, and the run since the last break. */
function practised(sec: number) {
  sessionSec += sec
  if (rest.add(sec, Date.now())) breakToast()
}

async function flushPractice() {
  const sec = Math.round(sessionSec)
  if (sec < 1) return
  sessionSec = 0
  await store.addPractice(dayKey(), sec)
}

function frame() {
  const now = performance.now()
  if (current && (game.phase === 'playing' || game.phase === 'countin' || game.phase === 'waiting') && !document.hidden) {
    practised(Math.min(0.25, (now - lastFrame) / 1000))
    if (sessionSec >= 20) void flushPractice()
  }
  lastFrame = now
  game.frame(now)
  staff.frame()
  dock.frame()
  const j = game.judge
  if (game.mode === 'perform') {
    if (j.score !== last.score) $('#hScore').textContent = `${Math.round(j.accuracy * 100)}%`
    if (j.combo !== last.combo) $('#hCombo').textContent = String(j.combo)
    last = { ...last, score: j.score, combo: j.combo }
  }
  const n = game.count
  if (n !== last.count) {
    last.count = n
    const c = $('#count')
    c.hidden = !n
    c.textContent = n ? String(n) : ''
  }
  dock.liveHeat(game.heat)
}

// ---------------------------------------------------------------- game events

/** Fix-it chain: three clean passes of a loop add the next bar to it, and once the loop is the whole piece it lets go. */
let cleanPasses = 0
function fixChain(clean: boolean) {
  const lp = game.loop
  if (!lp || game.mode !== 'learn') return
  cleanPasses = clean ? cleanPasses + 1 : 0
  if (cleanPasses < 3) return
  cleanPasses = 0
  const bars = game.song.bars
  const last = barAt(bars, lp.b - 1e-3)
  if (last + 1 < bars.length) {
    game.setLoop({ a: lp.a, b: bars[last + 1].t1 })
    flash(`Clean three times. Adding bar ${last + 2}.`)
  } else {
    game.setLoop(null)
    flash('Clean three times, and the whole piece is in. Loop off.')
  }
}

// Touch coach, live: how hard each note was struck against the last few of its hand.
const felt: Record<Hand, { v: number[]; t: number }> = { R: { v: [], t: -1 }, L: { v: [], t: -1 } }
function feel(n: Note, v: number) {
  const f = felt[n.h]
  if (settings.coach === 'off' || !v || game.mode === 'read' || !judged(game.song.id, game.song.dyn) || Math.abs(n.t - f.t) < 0.03) return // a chord is one moment
  f.t = n.t
  const d = live(f.v, v)
  if (d !== null && Math.abs(d) > tolerance(settings.edges ?? DEFAULT_EDGES, settings.coach)) staff.dev(n.id, d)
  f.v.push(v)
}

const WORDS: Record<Grade, string> = { perfect: 'Perfect', great: 'Great', good: 'Good', miss: 'Miss' }

const TOUCH: Record<VelGrade, string> = { ok: 'touch ✓', low: 'too soft', high: 'too hard' }

/** `grade` is null in wait mode, where only the touch has a verdict. */
function popup(grade: Grade | null, off: number, p: number, noteId: number, vel?: VelGrade) {
  const fine = (grade === null || grade === 'perfect' || grade === 'great') && vel !== 'low' && vel !== 'high'
  if (fine && game.mode !== 'perform' && game.quiet.hushed) return // clean playing needs no praise; slips still speak
  if (game.view === 'sheet') {
    if (grade !== 'miss') staff.grade(noteId, grade, off, vel && TOUCH[vel]) // the grade, as a word on the staff
    return
  }
  const el = $('#judge')
  el.dataset.g = grade ?? (vel === 'ok' ? 'perfect' : 'good')
  const timing = grade === null || grade === 'perfect' || grade === 'miss' ? '' : off < 0 ? '‹ early' : 'late ›'
  const touch = vel ? TOUCH[vel] : ''
  el.innerHTML = `${grade ? WORDS[grade] : touch}<small>${[timing, grade ? touch : ''].filter(Boolean).join(' · ')}</small>`
  const x = Math.min(highway.W - 90, Math.max(90, highway.center(p)))
  el.style.left = `${x}px`
  el.style.top = `${highway.recY - 96}px`
  el.getAnimations().forEach((a) => a.cancel())
  const dy = reduced || settings.fx === 0 ? 0 : -22
  el.animate(
    [
      { opacity: 0, transform: `translate(-50%, ${dy ? 8 : 0}px) scale(${dy ? 0.85 : 1})` },
      { opacity: 1, transform: 'translate(-50%, 0) scale(1.06)', offset: 0.18 },
      { opacity: 1, transform: 'translate(-50%, 0) scale(1)', offset: 0.7 },
      { opacity: 0, transform: `translate(-50%, ${dy}px) scale(1)` },
    ],
    { duration: 720, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' },
  )
}


let chordTimer = 0
/** The readout of what is held now; it lingers a moment after the last key comes up. */
function chordUpdate() {
  const el = $('#chord')
  const c = nameChord([...game.held.keys()], game.song.fifths)
  clearTimeout(chordTimer)
  if (c) {
    $('b', el).textContent = c.name
    $('small', el).textContent = c.detail
    el.style.bottom = `${$('#dock').offsetHeight + highway.kbH + 12}px` // just above the keyboard
    el.hidden = false
  } else chordTimer = window.setTimeout(() => (el.hidden = true), 700)
}

game.on((e: GameEvent) => {
  switch (e.type) {
    case 'press':
      staff?.ghost(e.p, e.t)
      chordUpdate()
      break
    case 'release':
      staff?.ghostEnd(e.p)
      chordUpdate()
      break
    case 'hit':
      feel(e.note, e.v)
      highway.hit(e.note.p, e.grade, e.note.h)
      staff.ghostHit(e.note.p, e.note.id, e.grade)
      staff.mark(e.note.id, `hit-${e.grade}`)
      popup(e.grade, e.off, e.note.p, e.note.id, e.vel)
      break
    case 'ok':
      feel(e.note, e.v)
      highway.hit(e.note.p, 'ok', e.note.h)
      staff.ghostHit(e.note.p, e.note.id, 'great')
      staff.mark(e.note.id, 'hit-ok')
      if (e.vel) popup(null, 0, e.note.p, e.note.id, e.vel)
      if (drill) drillOk(e.note.id, e.rt, e.clean)
      break
    case 'hold':
      if (e.grade === 'short') staff.cut(e.note.id)
      else if (e.grade === 'long') staff.over(e.note.id)
      break
    case 'miss':
      staff.mark(e.note.id, 'miss')
      popup('miss', 0, e.note.p, e.note.id)
      break
    case 'wrong':
      highway.wrong(e.p)
      staff.ghostBad(e.p)
      break
    case 'loop':
      fixChain(e.clean)
      break
    case 'short':
      flash('Hold it a little longer')
      break
    case 'tempo':
      dock.sync()
      say(`Tempo ${Math.round(e.rate * 100)} percent`)
      flash(`Tempo ${Math.round(e.rate * 100)}%`)
      break
    case 'phase':
      onPhase()
      break
    case 'pass':
      if (current && game.mode !== 'read') void store.commit(current.song.id, e.heat)
      break
    case 'done':
      void onDone(e.result)
      break
  }
})

// the top bar fades two and a half seconds into a run and comes back on any pointer or key
let idle = 0
function wake() {
  document.body.classList.remove('hush')
  clearTimeout(idle)
  if (current && game.phase !== 'ready' && game.phase !== 'paused' && game.phase !== 'done') idle = window.setTimeout(() => document.body.classList.add('hush'), 2500)
}
for (const ev of ['pointermove', 'pointerdown', 'keydown']) addEventListener(ev, wake, { passive: true }) // only opacity changes, so waking costs no layout

function say(msg: string) {
  $('#live').textContent = msg
}

function onPhase() {
  if (!dock || !current) return
  if (game.phase === 'ready') for (const f of Object.values(felt)) (f.v = []), (f.t = -1)
  dock.setPhase()
  const r = $('#ready')
  r.hidden = game.phase !== 'ready'
  $('#modeSeg').hidden = game.mode === 'read' || game.phase === 'ready' // the start card carries the choice until play begins
  if (game.phase === 'ready') {
    resOpen(false)
    let legend = ''
    try {
      if (!localStorage.getItem('piano.legend') && !drill && !calibrating && !rt && game.view !== 'sheet') {
        legend = '<div class="legend"><span><i class="sw R"></i>Right hand</span><span><i class="sw L"></i>Left hand</span><span><i class="sw lamp"></i>Play this</span></div>'
        localStorage.setItem('piano.legend', '1') // the colours explain themselves after one song
      }
    } catch {
      /* private mode: the legend shows every time */
    }
    const go = matchMedia('(pointer: coarse)').matches ? 'Tap Play to start.' : 'Press Space to start.'
    const sheet = `<div class="seg" role="radiogroup" aria-label="Mode">${(['perform', 'learn'] as const).map((v) => `<label><input type="radio" name="modeSheet" value="${v}"${game.mode === v ? ' checked' : ''}><span>${v === 'perform' ? 'Perform' : 'Learn'}</span></label>`).join('')}</div><span class="hint">${game.mode === 'perform' ? 'Scored. The song does not wait.' : 'No score. The song waits for you.'} ${go}</span>`
    const shows = current.base.notes.length > 0 && simplify(current.base, 3).notes.length < current.base.notes.length * 0.9
    const levels = shows ? `<span class="cap">Notes shown</span><div class="seg" role="radiogroup" aria-label="Notes shown">${([0, 1, 2, 3] as const).map((l) => `<label><input type="radio" name="level" value="${l}"${current!.level === l ? ' checked' : ''}><span>${LEVELS[l]}</span></label>`).join('')}</div>` : ''
    r.innerHTML = rt
      ? lookCard({ title: current.song.title, left: rt.left, rate: rt.rate, ahead: !!settings.readAhead, why: rt.why, credit: current.credit })
      : drill
      ? `<b>${esc(drill.title)}</b><span class="hint">${go}</span>`
      : calibrating
        ? `<b>Play middle C on every beat</b><span class="hint">${go}</span>`
        : `${art(current.song.id, 'art cover')}<b>${esc(current.song.title)}</b>${current.credit ? `<span class="hint">${esc(current.credit)}</span>` : ''}${sheet}${levels}${legend}`
    r.querySelectorAll<HTMLInputElement>('input[name=level]').forEach((x) => (x.onchange = async () => {
      if (!current) return
      const { base, credit } = current
      await store.setSimplify(base.id, Number(x.value))
      await openSong(base, game.mode)
      if (current) current.credit = credit
      onPhase()
    }))
    r.querySelectorAll<HTMLInputElement>('input[name=modeSheet]').forEach((x) => (x.onchange = () => chooseMode(x.value as Mode)))
  }
  if (rt) rtPhase()
  wake()
  if (game.phase === 'paused') say('Paused')
  if (game.phase === 'waiting') say('Waiting for you')
  updateBanner()
}

function resOpen(on: boolean) {
  $('#res').hidden = !on
  $('#play').classList.toggle('resopen', on)
}

// ---------------------------------------------------------------- Read through

// a read-through in progress: look-through seconds left, the timer counting them, the tempo, and why this piece was offered
let rt: { left: number; timer: number; rate: number; why: string; zoom?: number } | undefined

const RT_LEVEL = ['Beginner', 'Beginner', 'Elementary', 'Intermediate', 'Intermediate', 'Intermediate'] // catalogue grade 1..5 to the three levels the picker knows
const rtPieces = (): RtPiece[] => [...STARTERS.map((s) => ({ id: s.spec.id, title: s.spec.title, level: s.level })), ...lib.catalog.pieces.filter((p) => lib.local(p.id)).map((p) => ({ id: `lib:${p.id}`, title: p.title, level: RT_LEVEL[Math.min(5, lib.gradeOf(p))] }))]

/** One no-stop pass of a piece at a gentle tempo, after a look-through. No id: a new, easy piece is picked. */
async function readThrough(id?: string) {
  audio.unlock() // the count-in starts on a timer, after the click that opened this
  const pick = pickPiece(rtPieces(), await store.allProgress())
  id ??= pick?.piece.id
  if (!id) return
  rtEnd()
  rt = { left: LOOK, timer: 0, rate: startRate(settings.readBest), why: id === pick?.piece.id ? pick.why : '' }
  document.body.classList.add('readthru')
  await openById(id, 'perform')
  if (!current || current.song.id !== id || !rt) return rtEnd()
  // a look-through wants the page, not one bar: the staff shrinks to fit (not below 0.6) and goes back afterwards
  rt.zoom = settings.zoom
  setZoom(staff.fit(0.6, settings.zoom))
}

function rtEnd() {
  if (rt) clearInterval(rt.timer)
  if (rt?.zoom) setZoom(rt.zoom)
  rt = undefined
  document.body.classList.remove('readthru')
  if (staff) staff.aheadBars = 0
}

/** After every phase change: the look-through counts down on the start card, then the count-in starts by itself. */
function rtPhase() {
  const r = rt!
  if (game.phase !== 'ready') {
    clearInterval(r.timer)
    r.timer = 0
    r.left = LOOK
    return
  }
  if (game.rate !== r.rate) game.setRate(r.rate) // a reopen (thinning the notes) loads at full tempo
  staff.aheadBars = settings.readAhead ? 2 : 0
  if (!r.timer)
    r.timer = window.setInterval(() => {
      if (game.phase !== 'ready') return
      r.left = Math.max(0, r.left - 1)
      document.querySelector<HTMLElement>('#rtMeter')?.style.setProperty('--f', String(r.left / LOOK))
      const l = document.querySelector('#rtLeft')
      if (l) l.textContent = `0:${String(r.left).padStart(2, '0')}`
      if (!r.left) game.toggle()
    }, 1000)
  const q = <T extends HTMLElement>(s: string) => $('#ready').querySelector<T>(s)!
  const tempo = (d: number) => {
    game.setRate(Math.round((game.rate + d) * 20) / 20)
    r.rate = game.rate
    q('#rtRate').textContent = pct(r.rate)
  }
  q('#rtSlower').onclick = () => tempo(-0.05)
  q('#rtFaster').onclick = () => tempo(0.05)
  q('#rtGo').onclick = () => game.toggle()
  q<HTMLInputElement>('#rtAhead').onchange = (e) => {
    settings.readAhead = (e.target as HTMLInputElement).checked
    save()
    staff.aheadBars = settings.readAhead ? 2 : 0
    staff.render()
  }
}

async function rtDone(r: Result) {
  const c = current!
  const clean = r.acc >= 0.9 && r.clean
  const prog = await store.commit(c.song.id, r.heat, undefined, clean) // into spaced review, like a Perform run
  c.heat = prog.heat
  dock.setSong(c.song, prog.heat)
  void store.markPlan(dayKey(), 'sight')
  if (r.total) void store.logHistory({ ts: Date.now(), kind: 'song', label: `Read-through: ${c.song.title}`, acc: r.acc })
  if (clean) {
    settings.readBest = Math.max(settings.readBest ?? 0, r.rate)
    save()
  }
  const worst = worstBars(r.heat)
  const next = pickPiece(rtPieces(), await store.allProgress(), c.song.id)
  const res = $('#res')
  res.innerHTML = summaryCard({ title: c.song.title, acc: r.acc, rate: r.rate, caught: r.total - r.counts.miss, total: r.total, wrong: r.wrong, heat: r.heat, bars: c.song.bars.length, worst, next })
  resOpen(true)
  res.querySelector<HTMLButtonElement>('#rtNext, #rtFix, #toLib')?.focus()
  say(`Read-through finished. ${pct(r.acc)} accuracy.`)
  const fix = res.querySelector<HTMLButtonElement>('#rtFix')
  if (fix && worst)
    fix.onclick = () => {
      rtEnd()
      void fixBars(c.song.id, worst.a, worst.b)
    }
  const nx = res.querySelector<HTMLButtonElement>('#rtNext')
  if (nx && next) nx.onclick = () => void readThrough(next.piece.id)
  $('#toLib', res).onclick = leave
}

// ---------------------------------------------------------------- reading drills

const stageById = (id: string) => STAGES.find((s) => s.id === id)

async function startDrill(which: Stage | 'review') {
  drillStats = await store.getDrill()
  const stage = which === 'review' ? undefined : which
  const pool = stage ? cards(stage) : reviewPool(drillStats)
  const goal = stage ? stage.goalMs : 3000
  const d = deck(pool, drillStats, goal, stage?.scale ? 10 : 24) // a fragment takes four beats
  const title = stage ? stage.name : 'Weak notes review'
  const song = deckSong(`drill:${stage ? stage.id : 'review'}`, title, d, stage?.fifths ?? 0)
  const noteCard = noteCards(d, song)
  drill = {
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
    before: stage ? mastery(stage, drillStats).pct : 0,
  }
  run = undefined
  $('#stagesBtn').textContent = 'All stages'
  await openSong(song, 'read')
  drillHud()
}

// ---------------------------------------------------------------- Sight Run

async function startRun(spec: RunSpec) {
  spec = { ...DEFAULT_RUN, ...spec }
  void saveRun(spec)
  drillStats = await store.getDrill()
  run = { base: spec, spec, arc: newTally(), turn: 0, sets: 0, setCards: 0, setClean: 0, setRts: [], seen: new Map(), rts: [], done: false }
  await runSet()
}

/** Deal the next set and open it. */
async function runSet() {
  const r = run!
  const n = r.spec.length ? Math.min(SET, r.spec.length - r.arc.cards) : SET
  const d = deal(runCards(r.spec), drillStats, r.spec, n, r.prev)
  r.prev = d[d.length - 1]
  r.setCards = r.setClean = 0
  r.setRts = []
  const title = runTitle(r.spec)
  const song = deckSong('drill:run', title, d, r.spec.fifths)
  drill = { stage: 'review', title, goal: goalMs(r.spec), cards: d, left: d.map((c) => c.pitches.length), agg: d.map(() => ({ clean: true, rt: 0 })), noteCard: noteCards(d, song), done: 0, streak: 0, cleanN: 0, rts: [], before: 0, run: r }
  $('#stagesBtn').textContent = 'Finish'
  await openSong(song, 'read')
  staff.lookahead = r.spec.ahead
  drillHud()
}

/** One card answered: score it, count the note, end the run if the lives are gone. */
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
  await store.saveDrill(drillStats)
  if (!r.sets++) {
    const done = await store.getPlan(dayKey())
    void store.markPlan(dayKey(), done.includes('read') ? 'review' : 'read')
    void store.markPlan(dayKey(), 'run')
  }
  if (r.spec.widen && r.setCards && r.setClean / r.setCards >= 0.9 && median(r.setRts) <= goalMs(r.spec)) r.spec = widened(r.spec, r.turn++)
  if (r.done || (r.spec.length && r.arc.cards >= r.spec.length)) return runFinish()
  await runSet()
  game.toggle()
}

async function runFinish() {
  const r = run
  if (!r || r.done || !drill) return
  r.done = true
  if (game.phase === 'countin' || game.phase === 'playing' || game.phase === 'waiting') game.toggle()
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
  res.innerHTML = runResults({
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

function median(xs: number[]) {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[s.length >> 1]
}

function drillHud() {
  if (!drill) return
  if (!run) {
    $('#hCards').textContent = `${drill.done}/${drill.cards.length}`
    return
  }
  const { arc, spec } = run
  $('#hCards').textContent = spec.length ? `${arc.cards}/${spec.length}` : String(arc.cards)
  $('#rStreak').textContent = String(arc.streak)
}

function drillOk(noteId: number, rt: number, clean: boolean) {
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

async function drillDone() {
  if (run) return runSetDone()
  const d = drill!
  await store.saveDrill(drillStats)
  const done = await store.getPlan(dayKey())
  void store.markPlan(dayKey(), done.includes('read') ? 'review' : 'read')
  void store.logHistory({ ts: Date.now(), kind: 'read', label: d.title, acc: d.cleanN / d.cards.length, ms: median(d.rts) })
  const stage = d.stage === 'review' ? undefined : d.stage
  const m = stage ? mastery(stage, drillStats) : undefined
  const nxt = nextStage(drillStats)
  const res = $('#res')
  res.innerHTML = drillResults({
    stage: d.title,
    cards: d.cards.length,
    clean: d.cleanN / d.cards.length,
    medianMs: median(d.rts),
    weakest: weakest(drillStats, 3),
    before: d.before,
    after: m ? m.pct : 0,
    solid: !!m?.solid,
    nextName: nxt.name,
  })
  resOpen(true)
  $('#nextSet', res).focus()
  say(`Set complete. ${Math.round((d.cleanN / d.cards.length) * 100)} percent first try.`)
  $('#nextSet', res).onclick = () => void startDrill(m?.solid && stage ? nxt : (d.stage as Stage | 'review')).then(() => game.toggle())
  $('#toStages', res).onclick = leave
}

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)

function worstBars(heat: number[], bars = game.song.bars.length): { a: number; b: number } | null {
  let best = 0
  let at = -1
  for (let i = 0; i < heat.length; i++) {
    const s = (heat[i] ?? 0) + (heat[i + 1] ?? 0)
    if (s > best) {
      best = s
      at = i
    }
  }
  if (at < 0) return null
  return { a: at, b: Math.min(bars - 1, at + 1) }
}

async function onDone(r: Result) {
  if (!current) return
  if (drill) return drillDone()
  if (calibrating) return calibrated(r)
  if (rt) return rtDone(r)
  const prog = await store.commit(
    current.song.id,
    r.heat,
    r.mode === 'perform' ? { score: r.score, acc: r.acc, grade: r.grade } : undefined,
    r.mode === 'read' || game.loop ? undefined : r.mode === 'perform' ? r.acc >= 0.9 && r.clean : r.clean && !game.wait,
  )
  current.heat = prog.heat
  void store.markPlan(dayKey(), current.song.id.startsWith('scale:') ? 'scale' : current.song.id.startsWith('tech:') ? 'warm' : game.loop ? 'fix' : 'piece')
  if (current.song.id.startsWith('tech:') && r.mode === 'perform') void store.getTech().then((ts) => store.saveTech(applyRun(ts, current!.song.id, { acc: r.acc, touchPct: r.touchPct }, dayNum())))
  dock.setSong(current.song, prog.heat)
  if (r.touch.n >= 4) {
    const { n, mean, sd, hands, bands } = r.touch
    void store.logTouch({ ts: Date.now(), id: current.song.id, title: current.song.title, mode: r.mode, n, mean, sd, R: hands.R, L: hands.L, bands })
  }
  const kind = current.song.id.startsWith('scale:') ? 'scale' : current.song.id.startsWith('tech:') ? 'tech' : 'song'
  if (r.mode === 'perform' && r.total >= 4) void store.logHistory({ ts: Date.now(), kind, label: current.song.title, acc: r.acc })
  let note = ''
  const sc = parseId(current.song.id)
  if (sc && r.mode === 'perform') {
    const stats = await store.getScales()
    const ok = passed(r)
    const before = stats[`${sc.card.form}:${sc.card.tonic}:${sc.card.hands}:${sc.card.oct}`]?.best ?? 0
    recordScale(stats, sc.card, sc.bpm, ok)
    await store.saveScales(stats)
    const s = stats[`${sc.card.form}:${sc.card.tonic}:${sc.card.hands}:${sc.card.oct}`]
    note = ok
      ? s.best > before ? `Three clean runs in a row: <b>${esc(cardName(sc.card))}</b> is solid at ${sc.bpm}.` : `A clean run, ${s.streak} of ${CLEAN_RUNS} at ${sc.bpm}.`
      : `This run did not count: ${!r.clean ? 'a missed or wrong note' : r.acc < 0.85 ? 'the timing slipped' : 'the touch was uneven'}. The count starts again.`
  }
  const worst = worstBars(r.heat)
  const next = r.mode === 'read' ? null : nextStep({ clean: r.clean, wait: game.wait, rate: game.rate, worst })
  const res = $('#res')
  res.innerHTML = results(r, next, note)
  resOpen(true)
  res.querySelector<HTMLButtonElement>('#next, #again')?.focus()
  say(`Finished. ${Math.round(r.acc * 100)} percent accuracy.`)
  $('#again', res).onclick = () => game.restart()
  $('#toLib', res).onclick = leave
  const nextBtn = res.querySelector<HTMLButtonElement>('#next')
  if (nextBtn && next)
    nextBtn.onclick = () => {
      if (next.kind === 'loop' && worst) {
        ;($('input[name=mode][value=learn]') as HTMLInputElement).checked = true
        game.setMode('learn')
        game.setLoop({ a: game.song.bars[worst.a].t0, b: game.song.bars[worst.b].t1 })
      } else if (next.kind === 'nowait') {
        game.setWait(false)
        game.restart()
      } else if (next.rate) {
        game.setRate(next.rate)
        game.restart()
      }
      if (next.rate && next.kind === 'loop') game.setRate(next.rate)
      resOpen(false)
      syncMode()
      onPhase()
    }
}

async function startCalibration() {
  closeDrawer()
  calibrating = { prevOffset: settings.offset }
  settings.offset = 0
  const song = fromSpec({ id: 'calibration', title: 'Calibration', bpm: 80, fifths: 0, rh: Array(16).fill('C4:1').join(' '), lh: 'R:16' })
  await openSong(song, 'perform')
  $('#modeSeg').hidden = true
}

function calibrated(r: Result) {
  const res = $('#res')
  const offs = r.offs.slice().sort((a, b) => a - b)
  const ok = offs.length >= 8
  const med = ok ? Math.round(offs[offs.length >> 1] / 5) * 5 : 0
  resOpen(true)
  res.innerHTML = `<div class="results"><div class="card" style="grid-template-columns:1fr" role="dialog" aria-label="Calibration result">
    <h2>${ok ? 'Calibration done' : 'Not enough notes'}</h2>
    <p style="margin:0;color:var(--ink-2)">${
      ok
        ? `Your setup runs about <b style="color:var(--ink)">${Math.abs(med)} ms ${med >= 0 ? 'late' : 'early'}</b> (from ${offs.length} notes). Applying ${med} ms shifts the timing windows to match.`
        : `Only ${offs.length} of 16 notes landed close enough. Try again and play on each beat.`
    }</p>
    <div class="row">${ok ? '<button class="btn primary" id="apply">Apply</button>' : ''}<button class="btn" id="retry">Try again</button><button class="btn ghost" id="cancel">Cancel</button></div>
  </div></div>`
  const prev = calibrating!.prevOffset
  const end = () => {
    calibrating = undefined
    resOpen(false)
    leave()
  }
  const apply = res.querySelector<HTMLButtonElement>('#apply')
  if (apply)
    apply.onclick = () => {
      settings.offset = med
      save()
      end()
    }
  $('#retry', res).onclick = () => {
    resOpen(false)
    game.restart()
  }
  $('#cancel', res).onclick = () => {
    settings.offset = prev
    end()
  }
}

// ---------------------------------------------------------------- keyboard + banner

function flash(msg: string) {
  note = msg
  updateBanner()
  clearTimeout(noteTimer)
  noteTimer = window.setTimeout(() => {
    note = ''
    updateBanner()
  }, 5000)
}

function updateBanner() {
  const b = $('#banner')
  let html = ''
  const have = inputs().length > 0
  if (note) html = `<span>${esc(note)}</span>`
  else if (!current || played || have) html = ''
  else if (midiState === 'unsupported') html = `<span><b>No MIDI in this browser.</b> Use Chrome, Edge or Firefox on a computer. You can still play with the computer keyboard (<kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> …).</span>`
  else if (midiState === 'blocked') html = `<span><b>MIDI access is blocked.</b> Allow it in the address bar, then reload. Computer keys work meanwhile.</span>`
  else
    html = `<span><b>No keyboard yet.</b> Plug in over USB, then connect. Or play with the computer keys: <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> <kbd>G</kbd> <kbd>H</kbd> <kbd>J</kbd>.</span><button class="btn" id="connectBtn">Connect keyboard</button>`
  b.innerHTML = html ? `<div class="banner" role="status">${html}</div>` : ''
  const c = b.querySelector<HTMLButtonElement>('#connectBtn')
  if (c) c.onclick = () => void connectMidi()
}

function updateChip() {
  const list = inputs()
  const chip = $('#dev')
  chip.classList.toggle('ok', list.length > 0)
  const pick = list.find((i) => i.id === settings.device) ?? list[0]
  $('#devName').textContent = pick ? pick.name : midiState === 'unsupported' ? 'No MIDI here' : 'No keyboard'
  $('#dev').setAttribute('aria-label', $('#devName').textContent!) // the name is hidden in a narrow window
}

async function connectMidi() {
  try {
    await connect(() => {
      updateChip()
      updateBanner()
      if (!inputs().length && (game.phase === 'playing' || game.phase === 'waiting' || game.phase === 'countin')) {
        game.toggle()
        flash('Keyboard disconnected. Plug it back in and press Space to resume.')
      }
      if (document.querySelector('#drawer:not([hidden])')) openDrawer()
    })
    chooseInput(settings.device)
    midiState = 'ok'
  } catch {
    midiState = midiSupported ? 'blocked' : 'unsupported'
  }
  updateChip()
  updateBanner()
}

let chipTimer = 0
function chipFlash(p: number) {
  const chip = $('#dev')
  chip.classList.add('live')
  $('#devName').textContent = noteName(p)
  clearTimeout(chipTimer)
  chipTimer = window.setTimeout(() => {
    chip.classList.remove('live')
    updateChip()
  }, 450)
}

const fromKeyboard = (m: MidiMsg) => {
  if (m.on) {
    chipFlash(m.p)
    if (!played) {
      played = true
      updateBanner()
    }
    if (!m.virtual && calNote(m.v)) return
    if (theoryOpen()) {
      if (settings.sound) audio.noteOn(m.p, m.v, true)
      theoryNote(m.p, m.ts)
      return // the trainer owns the keyboard while a card is open
    }
    if (quizOpen()) {
      const c = quiz!.cards[quiz!.i]
      const d = c ? degreeOfPitch(c.tonic, c.form, m.p) : 0
      if (d) answerQuiz(d)
      return // the quiz owns the keyboard while it is open
    }
    if (drill && game.phase === 'ready' && $('#res').hidden) game.toggle() // on a reading drill the first key is the Play button
    game.press(m.p, m.v, m.ts, m.virtual)
  } else game.release(m.p, m.ts, m.virtual)
}
onMidi(fromKeyboard)
onPedal((d) => game.sustain(d))
typingKeyboard()

// ---------------------------------------------------------------- drawer

let monTimer = 0

function openDrawer() {
  const d = $('#drawer')
  const open = d.querySelector('details')?.open
  drawer(d, inputs())
  if (open) d.querySelector('details')!.open = true
  const wasOpen = !d.hidden
  d.hidden = false
  document.querySelectorAll<HTMLElement>('#main > section').forEach((s) => (s.inert = true)) // the drawer holds focus; the keyboard still plays; the main landmark stays
  if (!wasOpen) $('#drawerTitle', d).focus()
  const mon = $('#sMon', d)
  const tick = () => (mon.textContent = monitor.n ? `Last: ${monitor.text}` : '')
  tick()
  clearInterval(monTimer)
  monTimer = window.setInterval(tick, 250)
  $('#settingsBtn').setAttribute('aria-expanded', 'true')
  const on = (id: string, fn: (el: HTMLInputElement) => void, ev = 'input') => d.querySelector<HTMLInputElement>(id)?.addEventListener(ev, (e) => fn(e.target as HTMLInputElement))
  const radios = (name: string, fn: (v: string) => void) => d.querySelectorAll<HTMLInputElement>(`input[name=${name}]`).forEach((r) => (r.onchange = () => fn(r.value)))
  on('#sDevice', (el) => {
    settings.device = el.value
    chooseInput(el.value)
    save()
    updateChip()
  }, 'change')
  on('#sOffset', (el) => {
    settings.offset = Math.max(-300, Math.min(300, Number(el.value) || 0))
    save()
  })
  $('#sCal', d).onclick = () => void startCalibration()
  radios('fx', (v) => {
    settings.fx = Number(v) as 0 | 1
    save()
  })
  radios('coach', (v) => {
    settings.coach = v as typeof settings.coach
    save()
  })
  radios('strict', (v) => {
    settings.strict = v as typeof settings.strict
    game.judge.cfg = game.cfg()
    save()
  })
  radios('sound', (v) => {
    settings.sound = v === 'device'
    save()
    if (settings.sound) audio.unlock() // also starts loading the piano
    openDrawer()
  })
  on('#sFall', (el) => {
    settings.fall = 6.5 - Number(el.value)
    save()
  })
  on('#sNames', (el) => {
    settings.names = el.checked
    save()
    openDrawer() // the fade switch only means something while names are shown
  }, 'change')
  on('#sWritten', (el) => {
    settings.asWritten = el.checked
    save()
  }, 'change')
  on('#sFade', (el) => {
    settings.fade = el.checked
    save()
  }, 'change')
  on('#sFull', (el) => {
    settings.full = el.checked
    save()
    if (highway) highway.layout()
  }, 'change')
  on('#sInst', (el) => {
    settings.instrument = el.value
    save()
    void audio.preload().then(openDrawer) // shows the failure line if the samples did not load
  }, 'change')
  on('#sVol', (el) => {
    settings.volume = Number(el.value)
    save()
  })
  on('#sClick', (el) => {
    settings.click = Number(el.value)
    save()
    audio.click(true) // hear the level
  }, 'change')
  on('#sSplit', (el) => {
    settings.split = Number(el.value)
    save()
    lens.clear()
  }, 'change')
  $('#sCredits', d).onclick = () => void openCredits()
  $('#sHelp', d).onclick = () => ($('#help') as HTMLDialogElement).showModal()
  $('#sExport', d).onclick = async () => {
    await shareFile(new File([await store.exportAll()], 'piano-progress.json', { type: 'application/json' }))
  }
  const file = $<HTMLInputElement>('#sFile', d)
  $('#sImport', d).onclick = () => file.click()
  file.onchange = async () => {
    const f = file.files?.[0]
    if (!f) return
    try {
      await store.importAll(await f.text())
      location.reload()
    } catch (e) {
      say((e as Error).message)
    }
  }
  $('#sClear', d).onclick = async () => {
    if (!confirm('Delete your songs, progress and settings from this browser?')) return
    await store.clearAll()
    location.reload()
  }
}

function closeDrawer() {
  const d = $('#drawer')
  if (d.hidden) return false
  d.hidden = true
  clearInterval(monTimer)
  document.querySelectorAll<HTMLElement>('#main > section').forEach((s) => (s.inert = false))
  $('#settingsBtn').focus()
  $('#settingsBtn').setAttribute('aria-expanded', 'false')
  return true
}

// a tap anywhere outside the drawer closes it
document.addEventListener('pointerdown', (e) => {
  if (!$('#drawer').hidden && !(e.target as HTMLElement).closest('#drawer, #settingsBtn, #dev, dialog')) closeDrawer()
}, true)
$('#settingsBtn').onclick = () => ($('#drawer').hidden ? openDrawer() : closeDrawer())
$('#dev').onclick = () => (midiState === 'ok' ? openDrawer() : void connectMidi())
$('#brand').onclick = () => (current ? leave() : void showSection('today'))
$('#stagesBtn').onclick = () => (run && run.arc.cards ? void runFinish() : leave())
for (const r of document.querySelectorAll<HTMLInputElement>('input[name=nav]')) r.onchange = () => void showSection(r.value as Section)
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
  if (id === 'rClef' || id === 'rSize') void showRead() // the pickers list a different span of notes; intervals and triads have no key or sharps
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
    if (st) void startDrill(st)
  } else if (b.dataset.review) void startDrill('review')
})

/** Hide the top bar and the dock's extras so the staff and keyboard have the screen; the dock button brings them back. */
function zen() {
  const on = document.body.classList.toggle('zen')
  document.querySelector('#zen')?.setAttribute('aria-pressed', String(on))
  highway?.layout()
}
addEventListener('click', (e) => {
  const t = e.target as HTMLElement
  if (t.closest('#zen')) zen()
  const x = t.closest<HTMLElement>('[data-close]')
  if (x) x.closest('dialog')?.close()
})

/** Thin the notes one level, from the 'too dense' hint on the staff. */
async function stepSimplify() {
  if (!current || current.level >= 3) return
  const { base, credit } = current
  await store.setSimplify(base.id, current.level + 1)
  await openSong(base, game.mode)
  if (current) current.credit = credit
  onPhase()
}

function chooseMode(mode: Mode) {
  game.endPass()
  game.setMode(mode)
  ;($(`input[name=mode][value=${mode}]`) as HTMLInputElement).checked = true
  resOpen(false)
  syncMode()
  onPhase()
}

for (const r of document.querySelectorAll<HTMLInputElement>('input[name=mode]')) r.onchange = () => chooseMode(r.value as Mode)

addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement
  const typing = /INPUT|SELECT|TEXTAREA/.test(t.tagName) && (t as HTMLInputElement).type !== 'range' && (t as HTMLInputElement).type !== 'radio' && (t as HTMLInputElement).type !== 'checkbox'
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return
  if ((e.target as HTMLElement).closest('dialog')) return
  if (e.key === '?') ($('#help') as HTMLDialogElement).showModal()
  else if (e.key === 'm' && current) zen()
  else if (e.key === 'n') {
    settings.names = !settings.names
    save()
  } else if (e.key === 'Escape') {
    if (!closeDrawer() && current) leave()
  } else if (e.key === ' ' && current && !/BUTTON/.test(t.tagName) && $('#res').hidden) {
    e.preventDefault()
    game.toggle()
  } else if ((e.key === '-' || e.key === '=' || e.key === '+') && current) {
    setZoom(settings.zoom * (e.key === '-' ? 1 / ZOOM.step : ZOOM.step))
  } else if (e.key === 'v' && current && game.mode !== 'read') {
    const order = ['sheet', 'both', 'falling'] as const
    setView(order[(order.indexOf(settings.view) + 1) % 3])
  } else if ((e.key === '[' || e.key === ']') && current && game.mode === 'learn') {
    game.setRate(game.rate + (e.key === ']' ? 0.05 : -0.05))
    dock.sync()
  }
})

document.addEventListener('visibilitychange', () => {
  if (document.hidden && (game.phase === 'playing' || game.phase === 'countin' || game.phase === 'waiting')) game.toggle()
})
addEventListener('pagehide', () => game.endPass())

// ---------------------------------------------------------------- library actions + import

$('#library').addEventListener('click', async (e) => {
  const t = e.target as HTMLElement
  const b = t.closest('button')
  const row = t.closest<HTMLElement>('tr[data-open]')
  const lib = t.closest<HTMLElement>('tr[data-lib]')
  if (!b && lib) return void openLibrary(lib.dataset.lib!, 'learn')
  if (b?.dataset.rt) return void readThrough(b.dataset.rt)
  if (b?.dataset.libplay) return void openLibrary(b.dataset.libplay, b.dataset.mode as Mode)
  if (!b && row) return void openById(row.dataset.open!, 'learn') // the whole row opens Learn
  if (!b) return
  if (b.dataset.play) {
    return void openById(b.dataset.play, b.dataset.mode as Mode)
  } else if (b.dataset.tracks) {
    void openTracks(b.dataset.tracks)
  }
})

/** Fetch a piece from the open library, then play it like any imported file, with its credit on the start card. */
async function openLibrary(id: string, mode: Mode) {
  const p = lib.piece(id)
  if (!p) return
  try {
    await openSong(await libSong(p), mode)
    if (current) current.credit = creditLine(lib.catalog, p)
    onPhase()
  } catch (err) {
    void showSection('songs', (err as Error).message)
  }
}

/** Credits name the pieces you have played or saved; the full list is LICENSES.md, in the app and in the corpus. */
async function openCredits() {
  const d = $('#credits') as HTMLDialogElement
  const prog = await store.allProgress()
  const mine = lib.catalog.pieces.filter((p) => lib.cached.has(p.id) || prog.has(`lib:${p.id}`)).sort((a, b) => a.title.localeCompare(b.title))
  d.innerHTML = creditsDialog(mine.map((p) => creditBlock(lib.catalog, p)), { app: libraryUrl('LICENSES.md'), corpus: new URL('LICENSES.md', lib.CORPUS).href })
  d.showModal()
  d.scrollTop = 0
}

/** Choose which tracks of a stored MIDI file to read, with a live count of how crowded the staff will be. */
async function openTracks(id: string) {
  const s = (await store.listSongs()).find((x) => x.id === id)
  if (!s) return
  const midi = s.kind !== 'xml'
  const r = midi ? inspectMidi(s.bytes) : undefined
  let pick = s.pick ?? (r ? autoSelect(r) : { tracks: [], hands: {} })
  const song = await store.toSong(s, settings.split)
  const f = song.fifths
  const facts: [string, string][] = [
    ['Notes', String(song.notes.length)],
    ['Bars', String(song.bars.length)],
    ['Length', `${Math.floor(song.end / 60)}:${String(Math.round(song.end % 60)).padStart(2, '0')}`],
    ['Key', f === 0 ? 'No sharps or flats' : `${Math.abs(f)} ${f > 0 ? 'sharp' : 'flat'}${Math.abs(f) > 1 ? 's' : ''}`],
    ...(r ? ([['Drums', r.tracks.some((t) => t.percussion) ? 'Present, left out' : 'None']] as [string, string][]) : []),
  ]
  const dlg = $('#tracks') as HTMLDialogElement
  const order = [...pick.tracks] // the tracks in use first, fixed while the dialog is open
  const draw = () => {
    dlg.innerHTML = tracksDialog(s.title, r, pick, noteName, facts, order)
    dlg.querySelectorAll<HTMLInputElement>('input[data-tk]').forEach((c) => {
      c.onchange = () => {
        const i = Number(c.dataset.tk)
        pick = { ...pick, tracks: c.checked ? [...pick.tracks, i] : pick.tracks.filter((x) => x !== i) }
        draw()
      }
    })
    dlg.querySelectorAll<HTMLSelectElement>('select[data-tkh]').forEach((sel) => {
      sel.onchange = () => {
        const i = Number(sel.dataset.tkh)
        const hands = { ...pick.hands }
        if (sel.value === 'auto') delete hands[i]
        else hands[i] = sel.value as 'R' | 'L'
        pick = { ...pick, hands }
      }
    })
    dlg.querySelector<HTMLButtonElement>('#tkAuto')?.addEventListener('click', () => {
      if (r) pick = autoSelect(r)
      draw()
    })
    $('#tkCancel', dlg).onclick = () => dlg.close()
    $('#tkRemove', dlg).onclick = async () => {
      if (!confirm(`Remove ${s.title} from this browser?`)) return
      await store.removeSong(id)
      dlg.close()
      void showLibrary()
    }
    $('#tkShare', dlg).onclick = () => void shareFile(new File([s.bytes], `${s.title}${midi ? '.mid' : '.musicxml'}`, { type: midi ? 'audio/midi' : 'application/xml' }))
    const apply = dlg.querySelector<HTMLButtonElement>('#tkApply')
    if (apply)
      apply.onclick = async () => {
        if (!pick.tracks.length) return
        await store.setPick(id, pick)
        lens.delete(id)
        thumbs.delete(id)
        dlg.close()
        void showLibrary()
      }
  }
  draw()
  dlg.showModal()
}

/** Save or share a file: the iPad has no downloads folder, so it uses the share sheet. */
async function shareFile(file: File) {
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: file.name }).catch(() => {})
    return
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(file)
  a.download = file.name
  a.click()
  URL.revokeObjectURL(a.href)
}

async function openById(id: string, mode: Mode) {
  if (id.startsWith('lib:')) return openLibrary(id.slice(4), mode)
  const i = STARTERS.findIndex((s) => s.spec.id === id)
  if (i >= 0) return openSong(starters[i], mode) // awaited: fixBars and readThrough look at the piece once it is open
  const row = (await store.listSongs()).find((s) => s.id === id)
  if (row) {
    try {
      await openSong(await store.toSong(row, settings.split), mode)
    } catch (err) {
      void showLibrary((err as Error).message)
    }
  }
}

async function importFiles(files: FileList | File[]) {
  const errs: string[] = []
  for (const f of files) {
    if (!/\.(mid|midi|xml|musicxml|mxl)$/i.test(f.name)) {
      errs.push(`${f.name}: only MIDI (.mid) and MusicXML (.musicxml, .mxl) files.`)
      continue
    }
    try {
      await store.addFile(f)
    } catch (err) {
      errs.push(`${f.name}: ${(err as Error).message || 'could not read this MIDI file.'}`)
    }
  }
  if (!current) await showSection('songs', errs.join(' '))
}

$('#library').addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement
  if (t.id === 'file' && t.files) void importFiles(t.files).then(() => (t.value = ''))
})
addEventListener('dragover', (e) => {
  e.preventDefault()
  document.querySelector('#library')?.classList.add('over')
})
addEventListener('dragleave', () => document.querySelector('#library')?.classList.remove('over'))
addEventListener('drop', (e) => {
  e.preventDefault()
  document.querySelector('#library')?.classList.remove('over')
  if (e.dataTransfer?.files.length) void importFiles(e.dataTransfer.files)
})

// ---------------------------------------------------------------- boot

void (async () => {
  await lib.init(() => {
    if ($('#library').classList.contains('on')) void showLibrary()
  })
  await showSection('today')
  updateChip()
  try {
    const p = await navigator.permissions?.query({ name: 'midi' as PermissionName })
    if (p?.state === 'granted') await connectMidi()
  } catch {
    /* no Permissions API for midi: the Connect button covers it */
  }
  const want = location.hash.slice(1)
  const i = STARTERS.findIndex((s) => s.spec.id === want)
  if (i >= 0) void openSong(starters[i], 'perform')
})()

if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__piano = { catalog: async (n: number) => { lib.use((await import('./catalog-fixture')).synthetic(n)); await showSection('songs') }, game, key: (p: number, v: number) => fromKeyboard({ on: true, p, v, ts: performance.now() }), icon, open: (i: number, m: Mode) => openSong(starters[i], m), drill: (id: string) => startDrill(stageById(id)!), keyXY: (p: number) => { const r = highway.app.canvas.getBoundingClientRect(); return { x: r.left + highway.center(p), y: r.top + highway.recY + 40 } }, setView, stats: () => drillStats, solidUpTo: async (n: number) => { const st: Stats = {}; for (const stage of STAGES.slice(0, n)) for (const c of cards(stage)) for (let i = 0; i < 12; i++) record(st, cardKey(c), true, 1200); await store.saveDrill(st); await showSection('read') } }
}
