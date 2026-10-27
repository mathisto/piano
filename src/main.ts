// ---------------------------------------------------------------- views
import './native-midi' // first: it must exist before midi.ts reads requestMIDIAccess
import '@fontsource/barlow-condensed/700.css'
import '@fontsource/barlow-condensed/800-italic.css'
import '@fontsource-variable/hanken-grotesk'
import './style.css'
import * as audio from './audio'
import * as lib from './catalog'
import { cardKey, cards, record, STAGES, type Stats } from './drill'
import type { Mode } from './game'
import { icon } from './icons'
import { type MidiMsg, onMidi, onPedal, typingKeyboard } from './midi'
import { degreeOfPitch } from './scales'
import { save, settings, showSetup } from './settings'
import { STARTERS } from './starters'
import * as store from './store'
import { $ } from './ui'
import { current, dock, drill, drillStats, game, highway, hooks, mem, played, run, type Section, setPlayed, stageById, starters } from './app/state'
import { chipFlash, connectMidi, updateBanner, updateChip } from './app/banner'
import { flushPractice, setView, setZoom, view, zen, ZOOM } from './app/stage'
import { openTracks, showLibrary } from './app/library'
import { leave, openById, openLibrary, openSong } from './app/play'
import { readThrough } from './app/readthrough-ui'
import { memorise } from './app/memorise-ui'
import { runFinish, startDrill } from './app/drill'
import { showRead } from './app/read'
import { showTheory, theoryNote, theoryOpen } from './app/theory-ui'
import { answerQuiz, quiz, quizOpen, showScales } from './app/scales-ui'
import { calNote, showTechnique } from './app/technique-ui'
import { showProgress, showToday } from './app/today'
import { closeDrawer, openSetup } from './app/drawer'

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

// ---------------------------------------------------------------- touch calibration

// ---------------------------------------------------------------- Theory trainers

// ---------------------------------------------------------------- game events

// ---------------------------------------------------------------- Read through

// ---------------------------------------------------------------- Memorise

// ---------------------------------------------------------------- reading drills

// ---------------------------------------------------------------- Sight Run

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

Object.assign(hooks, { showSection })

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
