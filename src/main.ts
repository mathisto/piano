import './native-midi' // first: it must exist before midi.ts reads requestMIDIAccess
import '@fontsource/barlow-condensed/700.css'
import '@fontsource/barlow-condensed/800-italic.css'
import '@fontsource-variable/hanken-grotesk'
import './style.css'

import * as audio from './audio'
import { Dock } from './dock'
import { STAGES, dayNum, noteCards, cardKey, cards, deck, deckSong, dueCards, focus, mastery, nextStage, record, reviewPool, weakest, type Card, type Stage, type Stats } from './drill'
import { Game, type GameEvent, type Mode, type Result } from './game'
import { Highway } from './highway'
import { icon } from './icons'
import { nextStep } from './pace'
import { knownPitches } from './quiet'
import { multiplier, type Grade, type VelGrade } from './judge'
import { chooseInput, connect, inputs, midiSupported, monitor, onMidi, onPedal, typingKeyboard, type MidiMsg } from './midi'
import { noteName } from './spell'
import { save, settings } from './settings'
import { fromSpec, type Song } from './song'
import { Staff } from './staff'
import { STARTERS } from './starters'
import * as store from './store'
import { nameChord } from './chord'
import { thumb } from './thumb'
import { creditLine, libraryUrl, loadManifest, type LibraryEntry } from './credits'
import { autoSelect, inspectMidi } from './midi-tracks'
import { calibrate, writtenTargets } from './touch'
import { LEVELS, autoLevel, notesPerBar, simplify, type Level } from './simplify'
import { applyRun, nextRecipe, stateOf, SYLLABUS } from './syllabus'
import { exercise, type Opts } from './technique'
import { dayKey, improved, lastWeek, weekOf } from './week'
import { $, CAL_NOTES, creditsDialog, tracksDialog, type Row, progressView, techniqueView, todayView, type TouchCal, drawer, drillResults, library, readView, results, skeleton, starterRows, userRows, type StageRow } from './ui'

const app = $('#app')
skeleton(app)

const game = new Game()
const starters = STARTERS.map((s) => fromSpec(s.spec))
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

let highway!: Highway
let staff!: Staff
let dock!: Dock
let current: { song: Song; base: Song; level: Level; heat: number[]; credit?: string } | undefined
let libEntries: LibraryEntry[] = []
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
}
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
  const libRows: Row[] = libEntries.map((e) => ({ id: `lib:${e.id}`, title: e.title, sub: `${e.composer} · ${e.level}`, bars: 0, len: 0, prog: prog.get(`lib:${e.id}`), user: false, thumb: '' }))
  const last = [...starts, ...mine, ...libRows].filter((r) => r.prog?.last).sort((a, b) => b.prog!.last - a.prog!.last)[0] ?? starts[0]
  return { starts, mine, last }
}

async function showLibrary(err = '') {
  const { starts, mine, last } = await libraryData()
  last.cont = true
  library($('#library'), starts, mine, err, libEntries)
}

const SECTIONS = ['today', 'library', 'read', 'technique', 'progress', 'play'] as const

function view(name: (typeof SECTIONS)[number]) {
  for (const v of SECTIONS) $(`#${v}`).classList.toggle('on', v === name)
  $('#nav').hidden = name === 'play'
  $('#modeSeg').hidden = name !== 'play' || game.mode === 'read'
  $('#viewSeg').hidden = name !== 'play' || game.mode === 'read'
  $('#hud').hidden = name !== 'play'
  if (name !== 'play') $('#title').textContent = ''
  $('#title').hidden = name !== 'play' // an empty heading is noise to a screen reader
}

type Section = 'today' | 'songs' | 'read' | 'technique' | 'progress'

async function showSection(name: Section, err = '') {
  await flushPractice()
  ;($(`input[name=nav][value=${name}]`) as HTMLInputElement).checked = true
  view(name === 'songs' ? 'library' : name)
  if (name === 'today') await showToday()
  else if (name === 'songs') await showLibrary(err)
  else if (name === 'read') await showRead()
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
  const [{ last }, rows, days, done] = await Promise.all([libraryData(), stageRows(), store.getPractice(), store.getPlan(dayKey())])
  const next = rows.find((r) => r.next)!
  const ts = await store.getTech()
  const nr = nextRecipe(ts, dayNum())
  const ex = exercise(nr.recipe.opts, settings.edges)
  const worst = last.prog?.heat.length ? worstBars(last.prog.heat, last.bars) : null
  const second = rows.find((r) => r.due && !r.next) // a second stage with cards due, for the longest plan
  // one snapshot a week lets the recap say what got better; the recap shows on Monday and Tuesday
  const week = weekOf(days).days
  const snap = { read: Object.fromEntries(rows.map((r) => [r.stage.id, r.pct])), tech: SYLLABUS.filter((r) => stateOf(ts, r.id, dayNum()) === 'solid').length }
  if (!(await store.getSnap(week[0].key))) await store.putSnap(week[0].key, snap)
  const lw = [1, 2].includes(new Date().getDay()) ? lastWeek(days, settings.goal) : null
  const prevKey = dayKey(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 7 - ((new Date().getDay() + 6) % 7)))
  const recap = lw ? { ...lw, better: improved(await store.getSnap(prevKey), snap, Object.fromEntries(rows.map((r) => [r.stage.id, r.stage.name]))) ?? undefined } : null
  todayView($('#today'), {
    last: { id: last.id, title: last.title, sub: last.prog?.best ? `Best ${last.prog.best.grade}, ${Math.round(last.prog.best.acc * 100)}%` : last.sub, thumb: last.thumb, first: !last.prog?.last },
    read: { id: next.stage.id, name: next.due ? `Review ${next.stage.name.toLowerCase()}` : next.stage.name, pct: next.pct, line: next.due ? `${next.due} ${next.due === 1 ? 'card' : 'cards'} due` : next.seen ? `${next.seen} of ${next.total} notes seen` : next.stage.blurb },
    tech: ex.title.charAt(0).toUpperCase() + ex.title.slice(1),
    techDue: nr.reason === 'due',
    techId: nr.recipe.id,
    fix: worst && last.bars ? { id: last.id, title: last.title, ...worst } : undefined,
    review: second ? { id: second.stage.id, name: `Review ${second.stage.name.toLowerCase()}`, line: `${second.due} ${second.due === 1 ? 'card' : 'cards'} due` } : undefined,
    week: weekOf(days),
    goal: settings.goal,
    planMin: settings.planMin,
    done,
    recap: recap ?? undefined,
  })
  $('#today').querySelectorAll<HTMLInputElement>('input[name=planMin]').forEach((r) => (r.onchange = () => {
    settings.planMin = Number(r.value) as 5 | 10 | 20
    save()
    void showToday()
  }))
}

async function showProgress() {
  const [stages, days, log, ts] = await Promise.all([stageRows(), store.getPractice(), store.getTouch(), store.getTech()])
  const today = dayNum()
  progressView($('#progress'), { week: weekOf(days), goal: settings.goal, stages, log, tech: SYLLABUS.map((r) => ({ id: r.id, label: r.label, state: stateOf(ts, r.id, today) })) })
  $('#pGoal').addEventListener('change', (e) => {
    settings.goal = Number((e.target as HTMLSelectElement).value)
    save()
    void showProgress()
  })
}

$('#today').addEventListener('click', (e) => {
  const g = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-goal]')
  if (g) {
    settings.goal = Number(g.dataset.goal)
    save()
    return void showToday()
  }
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-today]')
  if (!b) return
  if (b.dataset.today === 'continue') void openById(b.dataset.id!, 'learn')
  else if (b.dataset.today === 'fix') void fixBars(b.dataset.id!, Number(b.dataset.a), Number(b.dataset.b))
  else if (b.dataset.today === 'read') void startDrill(stageById(b.dataset.id!)!)
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
  const path = SYLLABUS.map((r) => ({ id: r.id, label: r.label, state: stateOf(ts, r.id, today) }))
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
  readView($('#read'), await stageRows(), reviewPool(drillStats).length >= 3)
}

async function ensureStage() {
  if (highway) return
  await Promise.all([document.fonts.load('700 16px "Barlow Condensed"'), document.fonts.load('40px Bravura')])
  highway = new Highway($('#stage'), game)
  await highway.init()
  highway.onFrame = frame
  screenKeys(highway.app.canvas)
  staff = new Staff($('#staff'), game)
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
  const level = mode === 'read' || base.id.startsWith('tech:') ? 0 : ((await store.getSimplify(base.id)) as Level | undefined) ?? autoLevel(base)
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
  $('#brand').setAttribute('aria-label', 'piano: leave this piece')
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
  if (drill) void store.saveDrill(drillStats)
  drill = undefined
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
  void showSection(wasDrill ? 'read' : techSong ? 'technique' : 'songs')
}

/** Show the panes the view asks for: staff only, both, or falling notes only. */
function applyLayout() {
  const v = game.view
  $('#staff').hidden = v === 'falling'
  $('#play').classList.toggle('v-sheet', v === 'sheet')
  $('#play').classList.toggle('v-falling', v === 'falling')
  $('#viewSeg').hidden = !current || game.mode === 'read'
  ;($(`input[name=view][value=${settings.view}]`) as HTMLInputElement).checked = true
}

function setView(v: 'both' | 'sheet' | 'falling') {
  settings.view = v
  save()
  applyLayout()
  staff.render()
  highway.layout() // the stage changed size: the resize observer follows, this makes it immediate
}

function syncMode() {
  for (const e of document.querySelectorAll<HTMLElement>('#hud [data-m]')) e.hidden = e.dataset.m !== game.mode
  dock.sync()
}

// ---------------------------------------------------------------- per-frame

let last = { score: -1, combo: -1, count: 0 }

// Time spent playing, per local day. It only goes up, so it can measure effort without shaming anyone.
let sessionSec = 0
let lastFrame = 0

async function flushPractice() {
  const sec = Math.round(sessionSec)
  if (sec < 1) return
  sessionSec = 0
  await store.addPractice(dayKey(), sec)
}

function frame() {
  const now = performance.now()
  if (current && (game.phase === 'playing' || game.phase === 'countin' || game.phase === 'waiting') && !document.hidden) {
    sessionSec += Math.min(0.25, (now - lastFrame) / 1000)
    if (sessionSec >= 20) void flushPractice()
  }
  lastFrame = now
  game.frame(now)
  staff.frame()
  dock.frame()
  const j = game.judge
  if (game.mode === 'perform') {
    if (j.score !== last.score) $('#hScore').textContent = j.score.toLocaleString()
    if (j.combo !== last.combo) {
      $('#hCombo').textContent = String(j.combo)
      const m = multiplier(j.combo)
      $('#hMult').hidden = m === 1
      $('#hMult').textContent = `×${m}`
    }
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

let lastSlam = 0
function slam(combo: number) {
  const now = performance.now()
  if (settings.fx < 2 || reduced || game.view === 'sheet' || now - lastSlam < 1000) return // one big flash per second at most
  lastSlam = now
  const el = $('#slam')
  el.innerHTML = `${combo}<small>combo</small>`
  el.getAnimations().forEach((a) => a.cancel())
  el.animate(
    [
      { opacity: 0, transform: 'translateX(-50%) scale(1.5)' },
      { opacity: 1, transform: 'translateX(-50%) scale(1)', offset: 0.2 },
      { opacity: 1, transform: 'translateX(-50%) scale(1)', offset: 0.65 },
      { opacity: 0, transform: 'translateX(-50%) scale(0.96)' },
    ],
    { duration: 900, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' },
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
      highway.hit(e.note.p, e.grade, e.note.h)
      staff.ghostHit(e.note.p, e.note.id, e.grade)
      staff.mark(e.note.id, `hit-${e.grade}`)
      popup(e.grade, e.off, e.note.p, e.note.id, e.vel)
      break
    case 'ok':
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
    case 'milestone':
      slam(e.combo)
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
  dock.setPhase()
  const r = $('#ready')
  r.hidden = game.phase !== 'ready'
  $('#modeSeg').hidden = game.mode === 'read' || game.phase === 'ready' // the start card carries the choice until play begins
  if (game.phase === 'ready') {
    resOpen(false)
    let legend = ''
    try {
      if (!localStorage.getItem('piano.legend') && !drill && !calibrating) {
        legend = '<div class="legend"><span><i class="sw R"></i>Right hand</span><span><i class="sw L"></i>Left hand</span><span><i class="sw lamp"></i>Play this</span></div>'
        localStorage.setItem('piano.legend', '1') // the colours explain themselves after one song
      }
    } catch {
      /* private mode: the legend shows every time */
    }
    const start = `<span class="hint">${matchMedia('(pointer: coarse)').matches ? 'Tap Play to start.' : 'Press Space to start.'}</span>`
    const sheet = `<div class="seg" role="radiogroup" aria-label="Mode">${(['perform', 'learn'] as const).map((v) => `<label><input type="radio" name="modeSheet" value="${v}"${game.mode === v ? ' checked' : ''}><span>${v === 'perform' ? 'Perform' : 'Learn'}</span></label>`).join('')}</div><span class="hint">${game.mode === 'perform' ? 'Scored. The song does not wait.' : 'No score. The song waits for you.'}</span>`
    const shows = current.base.notes.length > 0 && simplify(current.base, 3).notes.length < current.base.notes.length * 0.9
    const levels = shows ? `<div class="seg" role="radiogroup" aria-label="Notes shown">${([0, 1, 2, 3] as const).map((l) => `<label><input type="radio" name="level" value="${l}"${current!.level === l ? ' checked' : ''}><span>${LEVELS[l]}</span></label>`).join('')}</div>` : ''
    r.innerHTML = drill
      ? `<b>${esc(drill.title)}</b>${start}`
      : calibrating
        ? `<b>Play middle C on every beat</b>${start}`
        : `<b>${esc(current.song.title)}</b>${current.credit ? `<span class="hint">${esc(current.credit)}</span>` : ''}${sheet}${levels}${start}${legend}`
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
  wake()
  if (game.phase === 'paused') say('Paused')
  if (game.phase === 'waiting') say('Waiting for you')
  updateBanner()
}

function resOpen(on: boolean) {
  $('#res').hidden = !on
  $('#play').classList.toggle('resopen', on)
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
  await openSong(song, 'read')
  drillHud()
}

function median(xs: number[]) {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[s.length >> 1]
}

function drillHud() {
  if (!drill) return
  $('#hCards').textContent = `${drill.done}/${drill.cards.length}`
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
  drillHud()
}

async function drillDone() {
  const d = drill!
  await store.saveDrill(drillStats)
  const done = await store.getPlan(dayKey())
  void store.markPlan(dayKey(), done.includes('read') ? 'review' : 'read')
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
  $('#nextSet', res).onclick = () => void startDrill(m?.solid && stage ? nxt : (d.stage as Stage | 'review'))
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
  const prog = await store.commit(
    current.song.id,
    r.heat,
    r.mode === 'perform' ? { score: r.score, acc: r.acc, grade: r.grade } : undefined,
  )
  current.heat = prog.heat
  void store.markPlan(dayKey(), current.song.id.startsWith('tech:') ? 'warm' : game.loop ? 'fix' : 'piece')
  if (current.song.id.startsWith('tech:') && r.mode === 'perform') void store.getTech().then((ts) => store.saveTech(applyRun(ts, current!.song.id, { acc: r.acc, touchPct: r.touchPct }, dayNum())))
  dock.setSong(current.song, prog.heat)
  if (r.touch.n >= 4) {
    const { n, mean, sd, hands, bands } = r.touch
    void store.logTouch({ ts: Date.now(), id: current.song.id, title: current.song.title, mode: r.mode, n, mean, sd, R: hands.R, L: hands.L, bands })
  }
  const worst = worstBars(r.heat)
  const next = r.mode === 'read' ? null : nextStep({ clean: r.clean, wait: game.wait, rate: game.rate, worst })
  const res = $('#res')
  res.innerHTML = results(r, next)
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
    settings.fx = Number(v) as 0 | 1 | 2
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
    settings.instrument = el.value as 'piano' | 'synth'
    save()
    if (settings.instrument === 'piano') void audio.preload().then(openDrawer) // shows the failure line if the samples did not load
  }, 'change')
  on('#sVol', (el) => {
    settings.volume = Number(el.value)
    save()
  })
  on('#sSplit', (el) => {
    settings.split = Number(el.value)
    save()
    lens.clear()
  }, 'change')
  $('#sCredits', d).onclick = openCredits
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

$('#settingsBtn').onclick = () => ($('#drawer').hidden ? openDrawer() : closeDrawer())
$('#dev').onclick = () => (midiState === 'ok' ? openDrawer() : void connectMidi())
$('#brand').onclick = () => (current ? leave() : void showSection('today'))
$('#stagesBtn').onclick = leave
for (const r of document.querySelectorAll<HTMLInputElement>('input[name=nav]')) r.onchange = () => void showSection(r.value as Section)
$('#read').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button')
  if (!b) return
  if (b.dataset.stage) {
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
  if ((e.target as HTMLElement).closest('#zen')) zen()
})

function chooseMode(mode: Mode) {
  game.endPass()
  game.setMode(mode)
  ;($(`input[name=mode][value=${mode}]`) as HTMLInputElement).checked = true
  resOpen(false)
  syncMode()
  onPhase()
}

for (const r of document.querySelectorAll<HTMLInputElement>('input[name=mode]')) r.onchange = () => chooseMode(r.value as Mode)

for (const r of document.querySelectorAll<HTMLInputElement>('input[name=view]')) r.onchange = () => setView(r.value as 'both' | 'sheet' | 'falling')

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
  if (b?.dataset.libplay) return void openLibrary(b.dataset.libplay, b.dataset.mode as Mode)
  if (!b && row) return void openById(row.dataset.open!, 'learn') // the whole row opens Learn
  if (!b) return
  if (b.dataset.play) {
    return void openById(b.dataset.play, b.dataset.mode as Mode)
  } else if (b.dataset.tracks) {
    void openTracks(b.dataset.tracks)
  } else if (b.dataset.del) {
    await store.removeSong(b.dataset.del)
    void showLibrary()
  }
})

/** Fetch a piece from the open library, then play it like any imported file, with its credit on the start card. */
async function openLibrary(id: string, mode: Mode) {
  const e = libEntries.find((x) => x.id === id)
  if (!e) return
  try {
    const r = await fetch(libraryUrl(e.file))
    if (!r.ok) throw new Error(`${e.title} could not be loaded.`)
    const song = await store.toSong({ id: `lib:${e.id}`, title: e.title, bytes: await r.arrayBuffer(), added: 0, kind: e.format === 'midi' ? 'midi' : 'xml' }, settings.split)
    await openSong(song, mode)
    if (current) current.credit = creditLine(e)
    onPhase()
  } catch (err) {
    void showSection('songs', (err as Error).message)
  }
}

function openCredits() {
  const d = $('#credits') as HTMLDialogElement
  d.innerHTML = creditsDialog(libEntries)
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
    ['Busiest bars', `${notesPerBar(song)} notes`],
  ]
  const dlg = $('#tracks') as HTMLDialogElement
  const draw = () => {
    dlg.innerHTML = tracksDialog(s.title, r, pick, noteName, facts)
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
  if (i >= 0) return void openSong(starters[i], mode)
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
  libEntries = await loadManifest()
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
  ;(window as unknown as Record<string, unknown>).__piano = { game, key: (p: number, v: number) => fromKeyboard({ on: true, p, v, ts: performance.now() }), icon, open: (i: number, m: Mode) => openSong(starters[i], m), drill: (id: string) => startDrill(stageById(id)!), keyXY: (p: number) => { const r = highway.app.canvas.getBoundingClientRect(); return { x: r.left + highway.center(p), y: r.top + highway.recY + 40 } }, setView, stats: () => drillStats, solidUpTo: async (n: number) => { const st: Stats = {}; for (const stage of STAGES.slice(0, n)) for (const c of cards(stage)) for (let i = 0; i < 12; i++) record(st, cardKey(c), true, 1200); await store.saveDrill(st); await showSection('read') } }
}
