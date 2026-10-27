// Boot and navigation. Each page and the play screen live in src/app/; their shared state is src/app/state.ts.
import './native-midi' // first: it must exist before midi.ts reads requestMIDIAccess
import '@fontsource/barlow-condensed/700.css'
import '@fontsource/barlow-condensed/800-italic.css'
import '@fontsource-variable/hanken-grotesk'
import './style.css'
// the feature stylesheets, in the cascade order they had before the split (each module still imports its own)
import './metronome.css'
import './ear.css'
import './coach.css'
import './report.css'
import './memory.css'
import './readthrough.css'
import './library-view.css'
import './habit.css'
import './accomp.css'
import * as lib from './catalog'
import { cardKey, cards, record, STAGES, type Stats } from './drill'
import type { Mode } from './game'
import { icon } from './icons'
import { feed } from './midi'
import { showSetup } from './settings'
import { STARTERS } from './starters'
import { lost, probe } from './kv'
import * as store from './store'
import { $, notice } from './ui'
import { current, drillStats, game, highway, hooks, mem, run, type Section, stageById, starters } from './app/state'
import { connectMidi, updateChip } from './app/banner'
import { flushPractice, setView, view } from './app/stage'
import { openTracks, showLibrary } from './app/library'
import { leave, openById, openLibrary, openSong, stageCode } from './app/play'
import { readThrough } from './app/readthrough-ui'
import { memorise } from './app/memorise-ui'
import { runFinish, startDrill } from './app/drill'
import { showRead } from './app/read'
import './app/results' // nothing names it: it registers hooks.onDone
import { theory, theoryUi } from './app/lazy'
import { showScales } from './app/scales-ui'
import { showTechnique } from './app/technique-ui'
import { showProgress, showToday } from './app/today'
import { openSetup } from './app/drawer'
import { fromKeyboard } from './app/input'
// last, where the cascade had them: their modules now load lazily, their styles stay in the one stylesheet
import './take.css'
import './pulse.css'

async function showSection(name: Section, err = '') {
  await flushPractice()
  const tab = $(`input[name=nav][value=${name}]`) as HTMLInputElement
  tab.checked = true
  tab.parentElement!.scrollIntoView({ block: 'nearest', inline: 'nearest' }) // a narrow window scrolls the tabs
  const id = name === 'songs' ? 'library' : name
  view(id)
  try {
    if (name === 'today') await showToday()
    else if (name === 'songs') await showLibrary(err)
    else if (name === 'read') await showRead()
    else if (name === 'scales') await showScales()
    else if (name === 'theory') (await theory()).showTheory()
    else if (name === 'technique') await showTechnique()
    else await showProgress()
  } catch (e) {
    // a page that cannot be drawn says so and offers another go, never a blank screen
    console.error(e)
    $(`#${id}`).innerHTML = `<div class="lib-head"><h1>${name[0].toUpperCase() + name.slice(1)}</h1></div>${notice('This page could not load. Try again, or reload the app.', '<button class="btn" data-retry>Try again</button>')}`
    $(`#${id} [data-retry]`).onclick = () => void showSection(name)
  }
  if (err && name !== 'songs') $(`#${id}`).insertAdjacentHTML('afterbegin', notice(err)) // Songs has its own error line
  if (lost() && !$(`#${id}`).querySelector('.lost')) $(`#${id}`).insertAdjacentHTML('afterbegin', notice('This browser is not letting the app save. What you do now is gone when you close this tab.', '', ' lost')) // a page that keeps its content between visits gets it once
}
Object.assign(hooks, { showSection })

$('#brand').onclick = () => (current ? leave() : void showSection('today'))
$('#stagesBtn').onclick = () => (run && !run.done && (run.arc.cards || (run.spec.pace && game.judge.judged)) ? void runFinish() : leave())
for (const r of document.querySelectorAll<HTMLInputElement>('input[name=nav]')) r.onchange = () => void showSection(r.value as Section)

// library actions: the rows and buttons start pieces in any mode

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

// ---------------------------------------------------------------- boot

/** A localStorage key is set; false when the browser refuses localStorage altogether. */
const stored = (k: string) => {
  try {
    return !!localStorage.getItem(k)
  } catch {
    return false
  }
}

void (async () => {
  await probe()
  await lib.init(() => {
    if ($('#library').classList.contains('on')) void showLibrary()
  })
  await showSection('today')
  // Today is up: fetch what a first tap wants while the app is idle, so a piece or a tab opens without waiting on the network
  ;(window.requestIdleCallback ?? setTimeout)(() => void Promise.all([stageCode(), theory(), import('./library-view'), import('./midi-tracks'), import('./musicxml')]).catch(() => {}))
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
  else if (showSetup({ seen: stored('piano.setup'), saved: stored('piano.settings'), automated: navigator.webdriver, forced: location.search.includes('setup') })) openSetup()
})()

if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__piano = { catalog: async (n: number) => { lib.use((await import('./catalog-fixture')).synthetic(n)); await showSection('songs') }, game, key: (p: number, v: number) => fromKeyboard({ on: true, p, v, ts: performance.now() }), up: (p: number) => fromKeyboard({ on: false, p, v: 0, ts: performance.now() }), cc: (n: number, v: number) => feed([0xb0, n, v]), pedal: (down: boolean) => feed([0xb0, 64, down ? 127 : 0]), icon, open: (i: number, m: Mode) => openSong(starters[i], m), memorise, mem: () => mem, drill: (id: string) => startDrill(stageById(id)!), keyXY: (p: number) => { const r = highway.app.canvas.getBoundingClientRect(); return { x: r.left + highway.center(p), y: r.top + highway.recY + 40 } }, setView, stats: () => drillStats, solidUpTo: async (n: number) => { const st: Stats = {}; for (const stage of STAGES.slice(0, n)) for (const c of cards(stage)) for (let i = 0; i < 12; i++) record(st, cardKey(c), true, 1200); await store.saveDrill(st); await showSection('read') } }
  Object.assign((window as unknown as { __piano: object }).__piano, { theory: () => theoryUi?.currentTheory() }) // e2e: the Theory session in progress, to answer its cards
}

// Offline after the first visit (src/sw.ts). Not in the iPad app (capacitor:), whose files are on the device, nor in dev.
if (import.meta.env.PROD && /^https?:$/.test(location.protocol)) void navigator.serviceWorker?.register(`${import.meta.env.BASE_URL}sw.js`).then((r) => r.update()).catch(() => {}) // update(): browsers recheck sw.js only once a day on their own
