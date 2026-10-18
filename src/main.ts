import '@fontsource/barlow-condensed/700.css'
import '@fontsource/barlow-condensed/800-italic.css'
import '@fontsource-variable/hanken-grotesk'
import './style.css'

import * as audio from './audio'
import { Dock } from './dock'
import { BPM, STAGES, cardKey, cards, deck, deckSong, mastery, nextStage, record, reviewPool, weakest, type Card, type Stage, type Stats } from './drill'
import { Game, type GameEvent, type Mode, type Result } from './game'
import { Highway } from './highway'
import { icon } from './icons'
import { multiplier, type Grade } from './judge'
import { chooseInput, connect, inputs, midiSupported, monitor, onMidi, typingKeyboard } from './midi'
import { noteName } from './spell'
import { save, settings } from './settings'
import { fromSpec, type Song } from './song'
import { Staff } from './staff'
import { STARTERS } from './starters'
import * as store from './store'
import { thumb } from './thumb'
import { $, drawer, drillResults, library, readView, results, skeleton, starterRows, userRows, type StageRow } from './ui'

const app = $('#app')
skeleton(app)

const game = new Game()
const starters = STARTERS.map((s) => fromSpec(s.spec))
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

let highway!: Highway
let staff!: Staff
let dock!: Dock
let current: { song: Song; heat: number[] } | undefined
let calibrating: { prevOffset: number } | undefined
let midiState: 'idle' | 'ok' | 'blocked' | 'unsupported' = midiSupported ? 'idle' : 'unsupported'
let midiMsg = ''
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

const lens = new Map<string, { bars: number; len: number }>()

const thumbs = new Map<string, string>(STARTERS.map((st) => [st.spec.id, thumb(fromSpec(st.spec))]))

async function showLibrary(err = '') {
  const [stored, prog] = await Promise.all([store.listSongs(), store.allProgress()])
  for (const s of stored) {
    if (!lens.has(s.id)) {
      try {
        const song = await store.toSong(s, settings.split)
        lens.set(s.id, { bars: song.bars.length, len: song.end })
        thumbs.set(s.id, thumb(song))
      } catch {
        lens.set(s.id, { bars: 0, len: 0 })
      }
    }
  }
  const starts = starterRows(STARTERS, starters, prog, thumbs)
  const mine = userRows(stored, prog, lens, thumbs)
  // one row carries the lamp: the piece you played last, or the first warm-up if you have not played yet
  const all = [...starts, ...mine]
  const last = all.filter((r) => r.prog?.last).sort((a, b) => b.prog!.last - a.prog!.last)[0] ?? starts[0]
  last.cont = true
  library($('#library'), starts, mine, err)
}

function view(name: 'library' | 'read' | 'play') {
  for (const v of ['library', 'read', 'play'] as const) $(`#${v}`).classList.toggle('on', v === name)
  $('#nav').hidden = name === 'play'
  $('#modeSeg').hidden = name !== 'play' || game.mode === 'read'
  $('#viewSeg').hidden = name !== 'play' || game.mode === 'read'
  $('#hud').hidden = name !== 'play'
  if (name !== 'play') $('#title').textContent = ''
}

async function showSection(name: 'songs' | 'read') {
  ;($(`input[name=nav][value=${name}]`) as HTMLInputElement).checked = true
  view(name === 'songs' ? 'library' : 'read')
  if (name === 'songs') await showLibrary()
  else await showRead()
}

async function showRead() {
  drillStats = await store.getDrill()
  const rec = nextStage(drillStats)
  const rows: StageRow[] = STAGES.map((stage) => {
    const m = mastery(stage, drillStats)
    const seen = cards(stage).map((c) => drillStats[cardKey(c)]).filter(Boolean)
    return { stage, ...m, rt: seen.length ? seen.reduce((a, b) => a + b.rt, 0) / seen.length : 0, next: stage === rec }
  })
  readView($('#read'), rows, reviewPool(drillStats).length >= 3)
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
    if (![...down.values()].includes(p)) game.release(p, true)
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

async function openSong(song: Song, mode: Mode) {
  game.endPass()
  view('play')
  await ensureStage()
  game.load(song, mode)
  const prog = await store.getProgress(song.id)
  current = { song, heat: prog.heat }
  $('#title').textContent = song.title
  $('#stagesBtn').hidden = mode !== 'read'
  document.body.classList.toggle('reading', mode === 'read')
  $('#brand').setAttribute('aria-label', mode === 'read' ? 'piano: back to stages' : 'piano: back to songs')
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
  const wasDrill = !!drill
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
  void showSection(wasDrill ? 'read' : 'songs')
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

let last = { score: -1, combo: -1, mult: 0, acc: '', clr: '', slip: -1, count: 0 }

function frame() {
  game.frame(performance.now())
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
    const acc = `${Math.round(j.accuracy * 100)}%`
    if (acc !== last.acc) $('#hAcc').textContent = acc
    last = { ...last, score: j.score, combo: j.combo, acc }
  } else if (game.mode === 'learn') {
    const clr = `${j.hits}/${j.total}`
    if (clr !== last.clr) $('#hClr').textContent = clr
    if (j.wrong !== last.slip) $('#hSlip').textContent = String(j.wrong)
    last = { ...last, clr, slip: j.wrong }
  }
  const n = game.phase === 'countin' ? Math.min(4, Math.max(1, Math.ceil(-game.t / game.song.spb - 1e-6))) : 0
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

function popup(grade: Grade, off: number, p: number, noteId: number) {
  if (game.view === 'sheet') {
    if (grade !== 'miss') staff.grade(noteId, grade, off) // the grade, as a word on the staff
    return
  }
  const el = $('#judge')
  el.dataset.g = grade
  el.innerHTML = `${WORDS[grade]}<small>${grade === 'perfect' || grade === 'miss' ? '' : off < 0 ? '‹ early' : 'late ›'}</small>`
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

game.on((e: GameEvent) => {
  switch (e.type) {
    case 'hit':
      highway.hit(e.note.p, e.grade, e.note.h)
      staff.mark(e.note.id, `hit-${e.grade}`)
      popup(e.grade, e.off, e.note.p, e.note.id)
      break
    case 'ok':
      highway.hit(e.note.p, 'ok', e.note.h)
      staff.mark(e.note.id, 'hit-ok')
      if (drill) drillOk(e.note.id, e.rt, e.clean)
      break
    case 'miss':
      staff.mark(e.note.id, 'miss')
      popup('miss', 0, e.note.p, e.note.id)
      break
    case 'wrong':
      highway.wrong(e.p)
      break
    case 'milestone':
      slam(e.combo)
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

function say(msg: string) {
  $('#live').textContent = msg
}

function onPhase() {
  if (!dock || !current) return
  dock.setPhase()
  const r = $('#ready')
  r.hidden = game.phase !== 'ready'
  if (game.phase === 'ready') {
    resOpen(false)
    const legend = '<div class="legend"><span><i class="sw R"></i>Right hand</span><span><i class="sw L"></i>Left hand</span><span><i class="sw lamp"></i>Play this</span></div>'
    r.innerHTML = drill
      ? `<b>${esc(drill.title)}</b><span>Read the staff and play what you see. Press <kbd>Space</kbd>. The song waits for you.</span>`
      : calibrating
        ? `<b>Play middle C on every beat</b><span>Press <kbd>Space</kbd> to start. On the computer keyboard, that is <kbd>A</kbd>.</span>`
        : game.mode === 'perform'
          ? `<b>${esc(current.song.title)}</b><span>Press <kbd>Space</kbd> to start. You get a four-beat count-in.</span>${legend}`
          : `<b>${esc(current.song.title)}</b><span>Learn mode: the song waits for you. Press <kbd>Space</kbd>, slow it down, loop the hard bars.</span>${legend}`
  }
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
  const d = deck(pool, drillStats, goal, 24)
  const title = stage ? stage.name : 'Weak notes review'
  const song = deckSong(`drill:${stage ? stage.id : 'review'}`, title, d)
  const q = 60 / BPM
  const noteCard = song.notes.map((n) => Math.round(n.t / q))
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
  $('#hStreak').textContent = String(drill.streak)
  $('#hClean').textContent = drill.done ? `${Math.round((drill.cleanN / drill.done) * 100)}%` : '—'
  $('#hMed').textContent = drill.rts.length ? `${(median(drill.rts) / 1000).toFixed(1)} s` : '—'
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

function worstBars(heat: number[]): { a: number; b: number } | null {
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
  return { a: at, b: Math.min(game.song.bars.length - 1, at + 1) }
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
  dock.setSong(current.song, prog.heat)
  const worst = worstBars(r.heat)
  const res = $('#res')
  res.innerHTML = results(r, worst)
  resOpen(true)
  res.querySelector<HTMLButtonElement>('#drill, #again')?.focus()
  say(`Finished. ${Math.round(r.acc * 100)} percent accuracy.`)
  $('#again', res).onclick = () => game.restart()
  $('#toLib', res).onclick = leave
  const drillBtn = res.querySelector<HTMLButtonElement>('#drill')
  if (drillBtn && worst)
    drillBtn.onclick = () => {
      ;($('input[name=mode][value=learn]') as HTMLInputElement).checked = true
      game.setMode('learn')
      game.setLoop({ a: game.song.bars[worst.a].t0, b: game.song.bars[worst.b].t1 })
      resOpen(false)
      syncMode()
      onPhase()
    }
}

// ---------------------------------------------------------------- calibration

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
  } catch (e) {
    midiMsg = (e as Error).message
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

onMidi((m) => {
  if (m.on) {
    chipFlash(m.p)
    if (!played) {
      played = true
      updateBanner()
    }
    game.press(m.p, m.v, m.ts, m.virtual)
  } else game.release(m.p, m.virtual)
})
typingKeyboard()

// ---------------------------------------------------------------- drawer

let monTimer = 0

function openDrawer() {
  const d = $('#drawer')
  drawer(d, inputs(), midiState === 'ok' ? (inputs().length ? `${inputs().length} connected.` : 'Connected to the browser, but no keyboard is plugged in.') : midiMsg || 'Not connected yet. Use the Connect button.')
  const wasOpen = !d.hidden
  d.hidden = false
  $('#main').inert = true // the drawer holds focus; the keyboard still plays
  if (!wasOpen) $('#drawerTitle', d).focus()
  const mon = $('#sMon', d)
  const tick = () => (mon.textContent = monitor.n ? `${monitor.n} messages received. Last: ${monitor.text}.` : 'Nothing received yet. Press a key on your keyboard.')
  tick()
  clearInterval(monTimer)
  monTimer = window.setInterval(tick, 250)
  $('#settingsBtn').setAttribute('aria-expanded', 'true')
  const on = (id: string, fn: (el: HTMLInputElement) => void, ev = 'input') => $<HTMLInputElement>(id, d).addEventListener(ev, (e) => fn(e.target as HTMLInputElement))
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
  d.querySelectorAll<HTMLInputElement>('input[name=fx]').forEach((r) => (r.onchange = () => {
    settings.fx = Number(r.value) as 0 | 1 | 2 | 3
    save()
  }))
  on('#sFall', (el) => {
    settings.fall = 6.5 - Number(el.value)
    save()
  })
  on('#sNames', (el) => {
    settings.names = el.checked
    save()
  }, 'change')
  on('#sFull', (el) => {
    settings.full = el.checked
    save()
    if (highway) highway.layout()
  }, 'change')
  on('#sSound', (el) => {
    settings.sound = el.checked
    save()
    if (el.checked) audio.unlock()
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
  $('#sExport', d).onclick = async () => {
    const blob = new Blob([await store.exportAll()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'piano-progress.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }
}

function closeDrawer() {
  const d = $('#drawer')
  if (d.hidden) return false
  d.hidden = true
  clearInterval(monTimer)
  $('#main').inert = false
  $('#settingsBtn').focus()
  $('#settingsBtn').setAttribute('aria-expanded', 'false')
  return true
}

$('#settingsBtn').onclick = () => ($('#drawer').hidden ? openDrawer() : closeDrawer())
$('#dev').onclick = () => (midiState === 'ok' ? openDrawer() : void connectMidi())
$('#brand').onclick = () => (current ? leave() : void showSection('songs'))
$('#stagesBtn').onclick = leave
for (const r of document.querySelectorAll<HTMLInputElement>('input[name=nav]')) r.onchange = () => void showSection(r.value as 'songs' | 'read')
$('#read').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button')
  if (!b) return
  if (b.dataset.stage) {
    const st = stageById(b.dataset.stage)
    if (st) void startDrill(st)
  } else if (b.dataset.review) void startDrill('review')
})

for (const r of document.querySelectorAll<HTMLInputElement>('input[name=mode]')) {
  r.onchange = () => {
    game.endPass()
    game.setMode(r.value as Mode)
    resOpen(false)
    syncMode()
    onPhase()
  }
}

for (const r of document.querySelectorAll<HTMLInputElement>('input[name=view]')) r.onchange = () => setView(r.value as 'both' | 'sheet' | 'falling')

addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement
  const typing = /INPUT|SELECT|TEXTAREA/.test(t.tagName) && (t as HTMLInputElement).type !== 'range' && (t as HTMLInputElement).type !== 'radio' && (t as HTMLInputElement).type !== 'checkbox'
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return
  if (e.key === 'Escape') {
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
  if (!b && row) return void openById(row.dataset.open!, 'learn') // the whole row opens Learn
  if (!b) return
  if (b.dataset.play) {
    return void openById(b.dataset.play, b.dataset.mode as Mode)
  } else if (b.dataset.del) {
    await store.removeSong(b.dataset.del)
    void showLibrary()
  }
})

async function openById(id: string, mode: Mode) {
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
  if (!current) await showLibrary(errs.join(' '))
}

$('#library').addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement
  if (t.id === 'file' && t.files) void importFiles(t.files).then(() => (t.value = ''))
})
addEventListener('dragover', (e) => {
  e.preventDefault()
  document.querySelector('#drop')?.classList.add('over')
})
addEventListener('dragleave', () => document.querySelector('#drop')?.classList.remove('over'))
addEventListener('drop', (e) => {
  e.preventDefault()
  document.querySelector('#drop')?.classList.remove('over')
  if (e.dataTransfer?.files.length) void importFiles(e.dataTransfer.files)
})

// ---------------------------------------------------------------- boot

void (async () => {
  await showLibrary()
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
  ;(window as unknown as Record<string, unknown>).__piano = { game, icon, open: (i: number, m: Mode) => openSong(starters[i], m), drill: (id: string) => startDrill(stageById(id)!), keyXY: (p: number) => { const r = highway.app.canvas.getBoundingClientRect(); return { x: r.left + highway.center(p), y: r.top + highway.recY + 40 } }, setView, stats: () => drillStats, solidUpTo: async (n: number) => { const st: Stats = {}; for (const stage of STAGES.slice(0, n)) for (const c of cards(stage)) for (let i = 0; i < 12; i++) record(st, cardKey(c), true, 1200); await store.saveDrill(st); await showSection('read') } }
}
