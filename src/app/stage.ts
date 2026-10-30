// The play screen's furniture: which view shows, the staff/falling-notes split and zoom, the frame loop, practice time, and the per-note feedback.
import * as audio from '../audio'
import { nameChord } from '../chord'
import * as coach from '../coach'
import { judged, live, tolerance } from '../even'
import { breakToast } from '../habit-ui'
import type { Grade, VelGrade } from '../judge'
import { restTracker } from '../rest'
import { save, settings } from '../settings'
import { barAt, type Hand, type Note } from '../song'
import * as store from '../store'
import { DEFAULT_EDGES } from '../touch'
import { $ } from '../ui'
import { dayKey } from '../week'
import { current, dock, game, highway, reduced, run, setPlayed, staff } from './state'
import { flash, updateBanner } from './banner'

const SECTIONS = ['today', 'library', 'read', 'scales', 'theory', 'technique', 'progress', 'play'] as const

/** The section on screen now. */
export const shown = () => SECTIONS.find((v) => $(`#${v}`).classList.contains('on'))

export function view(name: (typeof SECTIONS)[number]) {
  for (const v of SECTIONS) $(`#${v}`).classList.toggle('on', v === name)
  $('#nav').hidden = name === 'play'
  $('#modeSeg').hidden = name !== 'play' || game.mode === 'read'
  $('#hud').hidden = name !== 'play'
  if (name !== 'play') $('#title').textContent = ''
  $('#title').hidden = name !== 'play' // an empty heading is noise to a screen reader
  if (highway) highway.app.ticker[name === 'play' ? 'start' : 'stop']() // the falling-notes stage draws only while it can be seen
}

/** Click or touch the on-screen keys to play them; drag across keys to glide. */
export function screenKeys(canvas: HTMLCanvasElement) {
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
    setPlayed(true)
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

/** Show the panes the view asks for: staff only, both, or falling notes only. */
export function applyLayout() {
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

export function setView(v: 'both' | 'sheet' | 'falling') {
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
export const ZOOM = { min: 0.26, max: 1.8, step: 1.15 }
let zoomFrame = 0
export function setZoom(z: number) {
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
    const alone = pts.size === 1 && !moved && !(e.target as HTMLElement).closest('.barno')
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
  // the staff size buttons in the dock's Practice menu (the dock is built after this): smaller, the whole piece (again: back to normal), larger
  addEventListener('click', (e) => {
    const z = (e.target as HTMLElement).closest<HTMLElement>('[data-zoom]')?.dataset.zoom
    if (!z) return
    const f = z === 'fit' ? staff.fit(ZOOM.min, 1) : 0
    setZoom(z === 'out' ? settings.zoom / ZOOM.step : z === 'in' ? settings.zoom * ZOOM.step : settings.zoom === f ? 1 : f)
  })
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

export function syncMode() {
  for (const e of document.querySelectorAll<HTMLElement>('#hud [data-m]')) {
    const r = e.dataset.run
    e.hidden = e.dataset.m !== game.mode || (!!r && !run)
  }
  dock.sync()
}

// ---------------------------------------------------------------- per-frame

let last = { judged: -1, combo: -1, count: 0 }

// Time spent playing, per local day. It only goes up, so it can measure effort without shaming anyone.
let sessionSec = 0
let lastFrame = 0
const rest = restTracker()

/** Seconds practised: the day's total, and the run since the last break. */
export function practised(sec: number) {
  sessionSec += sec
  if (rest.add(sec, Date.now())) breakToast()
}

export async function flushPractice() {
  const sec = Math.round(sessionSec)
  if (sec < 1) return
  sessionSec = 0
  await store.addPractice(dayKey(), sec)
}

export function frame() {
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
    if (j.judged !== last.judged) $('#hScore').textContent = j.judged ? `${Math.round(j.accuracy * 100)}%` : '–' // a dash until a note has been judged
    if (j.combo !== last.combo) $('#hCombo').textContent = String(j.combo)
    last = { ...last, judged: j.judged, combo: j.combo }
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

/** Fix-it chain: three clean passes of a loop add the next bar to it, and once the loop is the whole piece it lets go. */
let cleanPasses = 0
export function fixChain(clean: boolean) {
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
export const felt: Record<Hand, { v: number[]; t: number }> = { R: { v: [], t: -1 }, L: { v: [], t: -1 } }
export function feel(n: Note, v: number) {
  const f = felt[n.h]
  if (settings.coach === 'off' || !v || game.mode === 'read' || !judged(game.song.id, game.song.dyn) || Math.abs(n.t - f.t) < 0.03) return // a chord is one moment
  f.t = n.t
  const d = live(f.v, v)
  if (d !== null && coach.marks !== 'none' && Math.abs(d) > tolerance(settings.edges ?? DEFAULT_EDGES, settings.coach)) staff.dev(n.id, d)
  f.v.push(v)
}

const WORDS: Record<Grade, string> = { perfect: 'Perfect', great: 'Great', good: 'Good', late: 'Late', miss: 'Miss' }

const TOUCH: Record<VelGrade, string> = { ok: 'touch ✓', low: 'too soft', high: 'too hard' }

/** `grade` is null in wait mode, where only the touch has a verdict. */
export function popup(grade: Grade | null, off: number, p: number, noteId: number, vel?: VelGrade) {
  const fine = (grade === null || grade === 'perfect' || grade === 'great') && vel !== 'low' && vel !== 'high'
  if (fine && game.mode !== 'perform' && game.quiet.hushed) return // clean playing needs no praise; slips still speak
  if (game.view === 'sheet') {
    if (grade !== 'miss') staff.grade(noteId, grade, off, vel && TOUCH[vel]) // the grade, as a word on the staff
    return
  }
  const el = $('#judge')
  el.dataset.g = grade ?? (vel === 'ok' ? 'perfect' : 'good')
  const timing = grade === null || grade === 'perfect' || grade === 'miss' || grade === 'late' ? '' : off < 0 ? '‹ early' : 'late ›'
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
export function chordUpdate() {
  if (!game.song) return // a key pressed before any song is open
  const el = $('#chord')
  const c = game.mode === 'read' ? null : nameChord([...game.held.keys()], game.song.fifths) // reading: the staff marks each hit, and the readout would sit on the second line
  clearTimeout(chordTimer)
  if (c) {
    $('b', el).textContent = c.name
    $('small', el).textContent = c.detail
    el.style.bottom = `${$('#dock').offsetHeight + highway.kbH + 12}px` // just above the keyboard
    el.hidden = false
  } else chordTimer = window.setTimeout(() => (el.hidden = true), 700)
}

// the top bar and the dock fade two and a half seconds into a run and come back on any pointer or key (a MIDI key is not one)
let idle = 0
/** `phase`: called on a change of phase. Playing and waiting take turns in Learn on every note: between them the fade's clock runs on. */
export function wake(phase = false) {
  const run = !!current && game.phase !== 'ready' && game.phase !== 'paused' && game.phase !== 'done'
  if (phase && run && idle) return
  document.body.classList.remove('hush')
  clearTimeout(idle)
  idle = run ? window.setTimeout(() => document.body.classList.add('hush'), 2500) : 0
}
for (const ev of ['pointermove', 'pointerdown', 'keydown']) addEventListener(ev, () => wake(), { passive: true }) // only opacity changes, so waking costs no layout

/** Hide the top bar so the staff and keyboard have the screen (M); again, back. */
export function zen() {
  document.body.classList.toggle('zen')
  highway?.layout()
}
addEventListener('click', (e) => {
  const t = e.target as HTMLElement
  const x = t.closest<HTMLElement>('[data-close]')
  if (x) x.closest('dialog')?.close()
})
