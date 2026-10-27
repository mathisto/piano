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
import * as lib from './catalog'
import { cardKey, cards, record, STAGES, type Stats } from './drill'
import type { Mode } from './game'
import { icon } from './icons'
import { showSetup } from './settings'
import { STARTERS } from './starters'
import * as store from './store'
import { $ } from './ui'
import { current, drillStats, game, highway, hooks, mem, run, type Section, stageById, starters } from './app/state'
import { connectMidi, updateChip } from './app/banner'
import { flushPractice, setView, view } from './app/stage'
import { openTracks, showLibrary } from './app/library'
import { leave, openById, openLibrary, openSong } from './app/play'
import { readThrough } from './app/readthrough-ui'
import { memorise } from './app/memorise-ui'
import { runFinish, startDrill } from './app/drill'
import { showRead } from './app/read'
import './app/results' // nothing names it: it registers hooks.onDone
import { showTheory } from './app/theory-ui'
import { showScales } from './app/scales-ui'
import { showTechnique } from './app/technique-ui'
import { showProgress, showToday } from './app/today'
import { openSetup } from './app/drawer'
import { fromKeyboard } from './app/input'

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
Object.assign(hooks, { showSection })

$('#brand').onclick = () => (current ? leave() : void showSection('today'))
$('#stagesBtn').onclick = () => (run && run.arc.cards ? void runFinish() : leave())
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
