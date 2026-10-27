// ---------------------------------------------------------------- views
import './native-midi' // first: it must exist before midi.ts reads requestMIDIAccess
import '@fontsource/barlow-condensed/700.css'
import '@fontsource/barlow-condensed/800-italic.css'
import '@fontsource-variable/hanken-grotesk'
import './style.css'
import * as audio from './audio'
import * as lib from './catalog'
import * as coach from './coach'
import { creditBlock, libraryUrl } from './credits'
import { cardKey, cards, dayNum, record, STAGES, type Stats } from './drill'
import { type EarRun, earTap, earView, newEar, playCard, stopEar } from './ear-play'
import type { Mode, Result } from './game'
import { type Ctx, nextOf, path as gradePath, type Start } from './grades'
import { icon } from './icons'
import { chooseInput, inputs, type MidiMsg, monitor, onMidi, onPedal, typingKeyboard } from './midi'
import { nextStep } from './pace'
import { type PlanMin, theoryDue } from './plan'
import { pickPiece } from './readthrough'
import { buildSummary, reportLink } from './report'
import { DEFAULT_RUN } from './run'
import { type Card as ScaleCard, CLEAN_RUNS, degreeOfPitch, type Form, keyName, mastery as scaleMastery, nextCard, nextStage as nextScaleStage, parseId, passed, quizDeal, quizRecord, quizRight, type QuizStats, record as recordScale, scaleSong, STAGES as SCALE_STAGES } from './scales'
import { save, settings, showSetup } from './settings'
import { fromSpec } from './song'
import { STARTERS } from './starters'
import * as store from './store'
import { streak as dayStreak } from './streak'
import { applyRun, nextRecipe, stateOf, SYLLABUS, type TechStats } from './syllabus'
import { exercise, type Opts, PATTERNS } from './technique'
import { check as checkAnswer, deal as dealTheory, deckOf, type Trainer, TRAINERS } from './theory'
import { thumb } from './thumb'
import { calibrate } from './touch'
import { $, CAL_NOTES, cardName, creditsDialog, drawer, progressView, type QuizState, results, type ScalePick, scalesView, setupDialog, techniqueView, type TheoryRunView, theoryView, todayView, type TouchCal } from './ui'
import { dayKey, improved, lastWeek, weekOf } from './week'
import { calibrating, current, dock, drill, drillStats, esc, game, highway, hooks, median, mem, played, resOpen, rt, run, say, type Section, setCalibrating, setPlayed, stageById, starters, worstBars } from './app/state'
import { chipFlash, connectMidi, midiLine, midiState, updateBanner, updateChip } from './app/banner'
import { flushPractice, practised, setView, setZoom, syncMode, view, zen, ZOOM } from './app/stage'
import { lens, libraryData, openTracks, shareFile, showLibrary } from './app/library'
import { fixBars, leave, onPhase, openById, openLibrary, openSong } from './app/play'
import { readThrough, rtDone, rtPieces } from './app/readthrough-ui'
import { memDone, memorise } from './app/memorise-ui'
import { drillDone, runFinish, startDrill, startRun } from './app/drill'
import { showRead, stageRows } from './app/read'

async function showSection(name: Section, err = '') {
  await flushPractice()
  const tab = $(`input[name=nav][value=${name}]`) as HTMLInputElement
  tab.checked = true
  tab.parentElement!.scrollIntoView({ block: 'nearest', inline: 'nearest' }) // a narrow window scrolls the tabs
  view(name === 'songs' ? 'library' : name)
  if (name === 'today') await showToday()
  else if (name === 'songs') await showLibrary(err)
  else if (name === 'read') await showRead()
  else if (name === 'scales') await showScales()
  else if (name === 'theory') showTheory()
  else if (name === 'technique') await showTechnique()
  else await showProgress()
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
  } else if (s.kind === 'read') void startDrill(stageById(s.id)!, s.fast)
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
  click('#calStart', startTouchCal)
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

function startTouchCal() {
  touchCal = { step: 0, got: 0 }
  calGot = [[], [], []]
  calMsg = ''
  void showSection('technique')
}

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

// ---------------------------------------------------------------- game events

// ---------------------------------------------------------------- Read through

// ---------------------------------------------------------------- Memorise

// ---------------------------------------------------------------- reading drills

// ---------------------------------------------------------------- Sight Run

async function onDone(r: Result) {
  if (!current) return
  if (drill) return drillDone()
  if (calibrating) return calibrated(r)
  if (rt) return rtDone(r)
  if (mem) return memDone(r)
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
    void store.logTouch({ ts: Date.now(), id: current.song.id, title: current.song.title, mode: r.mode, n, mean, sd, R: hands.R, L: hands.L, bands, keyTouch: settings.keyTouch })
  }
  const kind = current.song.id.startsWith('scale:') ? 'scale' : current.song.id.startsWith('tech:') ? 'tech' : 'song'
  if (r.mode === 'perform' && r.total >= 4) void store.logHistory({ ts: Date.now(), kind, label: current.song.title, acc: r.acc, even: r.even?.inside, bias: r.timing?.bias })
  if (coach.coached(current.song.id, current.song.dyn, r.mode)) void coach.tally(current.song.id, r.even?.rating)
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
  if (r.mode === 'learn' && r.clean && !game.loop) $('#toLib', res).insertAdjacentHTML('beforebegin', '<button class="btn" id="memTry">Try it from memory</button>')
  res.querySelector<HTMLButtonElement>('#memTry')?.addEventListener('click', () => void memorise(current!.song.id, 1))
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
  setCalibrating({ prevOffset: settings.offset })
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
    setCalibrating(undefined)
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

const fromKeyboard = (m: MidiMsg) => {
  if (m.on) {
    chipFlash(m.p)
    if (!played) {
      setPlayed(true)
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
  on('#sKeyTouch', (el) => {
    settings.keyTouch = el.value as typeof settings.keyTouch
    save()
  }, 'change')
  on('#sMarks', (el) => {
    settings.marks = el.checked
    save()
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
  $('#sSetup', d).onclick = openSetup
  $('#sHelp', d).onclick = () => ($('#help') as HTMLDialogElement).showModal()
  $('#sExport', d).onclick = async () => {
    await shareFile(new File([await store.exportAll()], 'piano-progress.json', { type: 'application/json' }))
  }
  $('#sSummary', d).onclick = async () => {
    const titles: Record<string, string> = Object.fromEntries([...STARTERS.map((s) => [s.spec.id, s.spec.title]), ...(await store.listSongs()).map((s) => [s.id, s.title]), ...lib.catalog.pieces.map((p) => [`lib:${p.id}`, p.title])])
    await shareFile(new File([buildSummary(JSON.parse(await store.exportAll()), titles)], 'piano-practice-summary.txt', { type: 'text/plain' }))
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

// Tab wraps inside the open drawer: the page behind it is inert, so nothing else is a stop
$('#drawer').onkeydown = (e) => {
  if (e.key !== 'Tab') return
  const d = $('#drawer')
  const stops = [...d.querySelectorAll<HTMLInputElement>('button, input, select, summary, a[href]')].filter((x) => !x.disabled && x.offsetParent && (x.type !== 'radio' || x.checked || !d.querySelector(`input[name="${x.name}"]:checked`)))
  const [first, last] = [stops[0], stops[stops.length - 1]]
  const from = e.target as HTMLElement
  if (e.shiftKey ? from === first || from.id === 'drawerTitle' : from === last) {
    e.preventDefault()
    ;(e.shiftKey ? last : first).focus()
  }
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
  } else if (e.key === 'b' && current && game.mode !== 'read') {
    dock.cycleMetro()
  } else if (e.key === 'v' && current && game.mode !== 'read') {
    const order = ['sheet', 'both', 'falling'] as const
    setView(order[(order.indexOf(settings.view) + 1) % 3])
  } else if ((e.key === '[' || e.key === ']') && current && game.mode === 'learn') {
    game.setRate(game.rate + (e.key === ']' ? 0.05 : -0.05))
    dock.sync()
  }
})

// ---------------------------------------------------------------- library actions + import

$('#library').addEventListener('click', async (e) => {
  const t = e.target as HTMLElement
  const b = t.closest('button')
  const row = t.closest<HTMLElement>('tr[data-open]')
  const lib = t.closest<HTMLElement>('tr[data-lib]')
  if (!b && lib) return void openLibrary(lib.dataset.lib!, 'learn')
  if (b?.dataset.rt) return void readThrough(b.dataset.rt)
  if (b?.dataset.mem) return void memorise(b.dataset.mem)
  if (b?.dataset.libplay) return void openLibrary(b.dataset.libplay, b.dataset.mode as Mode)
  if (!b && row) return void openById(row.dataset.open!, 'learn') // the whole row opens Learn
  if (!b) return
  if (b.dataset.play) {
    return void openById(b.dataset.play, b.dataset.mode as Mode)
  } else if (b.dataset.tracks) {
    void openTracks(b.dataset.tracks)
  }
})

/** Credits name the pieces you have played or saved; the full list is LICENSES.md, in the app and in the corpus. */
async function openCredits() {
  const d = $('#credits') as HTMLDialogElement
  const prog = await store.allProgress()
  const mine = lib.catalog.pieces.filter((p) => lib.cached.has(p.id) || prog.has(`lib:${p.id}`)).sort((a, b) => a.title.localeCompare(b.title))
  d.innerHTML = creditsDialog(mine.map((p) => creditBlock(lib.catalog, p)), { app: libraryUrl('LICENSES.md'), corpus: new URL('LICENSES.md', lib.CORPUS).href }, (i) => reportLink(lib.catalog, mine[i]))
  d.showModal()
  d.scrollTop = 0
}

/** The first-run sheet, also Settings > Set up. Every action hands over to the flow it names; nothing here blocks. */
function openSetup() {
  const d = $('#setup') as HTMLDialogElement
  try {
    localStorage.setItem('piano.setup', '1')
  } catch {
    /* private mode: it may show again next time */
  }
  closeDrawer()
  d.innerHTML = setupDialog(midiLine(), inputs().length > 0, settings.offset)
  const away = (f: () => void) => () => {
    d.close()
    if (current) leave()
    f()
  }
  $('#suConnect', d).onclick = () => void connectMidi()
  $('#suTouch', d).onclick = away(startTouchCal)
  $('#suDelay', d).onclick = away(() => void startCalibration())
  $<HTMLSelectElement>('#suKeyTouch', d).onchange = (e) => {
    settings.keyTouch = (e.target as HTMLSelectElement).value as typeof settings.keyTouch
    save()
  }
  d.showModal()
}

Object.assign(hooks, { openDrawer, showSection, onDone })

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
  else if (showSetup({ seen: !!localStorage.getItem('piano.setup'), saved: !!localStorage.getItem('piano.settings'), automated: navigator.webdriver, forced: location.search.includes('setup') })) openSetup()
})()

if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__piano = { catalog: async (n: number) => { lib.use((await import('./catalog-fixture')).synthetic(n)); await showSection('songs') }, game, key: (p: number, v: number) => fromKeyboard({ on: true, p, v, ts: performance.now() }), up: (p: number) => fromKeyboard({ on: false, p, v: 0, ts: performance.now() }), icon, open: (i: number, m: Mode) => openSong(starters[i], m), memorise, mem: () => mem, drill: (id: string) => startDrill(stageById(id)!), keyXY: (p: number) => { const r = highway.app.canvas.getBoundingClientRect(); return { x: r.left + highway.center(p), y: r.top + highway.recY + 40 } }, setView, stats: () => drillStats, solidUpTo: async (n: number) => { const st: Stats = {}; for (const stage of STAGES.slice(0, n)) for (const c of cards(stage)) for (let i = 0; i < 12; i++) record(st, cardKey(c), true, 1200); await store.saveDrill(st); await showSection('read') } }
}
