import '@fontsource/barlow-condensed/700.css'
import '@fontsource/barlow-condensed/800-italic.css'
import '@fontsource-variable/hanken-grotesk'
import './style.css'

import * as audio from './audio'
import { Dock } from './dock'
import { Game, type GameEvent, type Mode, type Result } from './game'
import { Highway } from './highway'
import { icon } from './icons'
import { multiplier, type Grade } from './judge'
import { chooseInput, connect, inputs, midiSupported, onMidi, typingKeyboard } from './midi'
import { save, settings } from './settings'
import { fromSpec, type Song } from './song'
import { Staff } from './staff'
import { STARTERS } from './starters'
import * as store from './store'
import { $, drawer, library, results, skeleton, starterRows, userRows } from './ui'

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

// ---------------------------------------------------------------- views

const lens = new Map<string, { bars: number; len: number }>()

async function showLibrary(err = '') {
  const [stored, prog] = await Promise.all([store.listSongs(), store.allProgress()])
  for (const s of stored) {
    if (!lens.has(s.id)) {
      try {
        const song = store.toSong(s, settings.split)
        lens.set(s.id, { bars: song.bars.length, len: song.end })
      } catch {
        lens.set(s.id, { bars: 0, len: 0 })
      }
    }
  }
  library($('#library'), starterRows(STARTERS, starters, prog), userRows(stored, prog, lens), err)
}

function view(name: 'library' | 'play') {
  $('#library').classList.toggle('on', name === 'library')
  $('#play').classList.toggle('on', name === 'play')
  $('#modeSeg').hidden = name !== 'play'
  $('#hud').hidden = name !== 'play'
  if (name === 'library') $('#title').textContent = ''
}

async function ensureStage() {
  if (highway) return
  await Promise.all([document.fonts.load('700 16px "Barlow Condensed"'), document.fonts.load('40px Bravura')])
  highway = new Highway($('#stage'), game)
  await highway.init()
  highway.onFrame = frame
  staff = new Staff($('#staff'), game)
  dock = new Dock($('#dock'), game)
  dock.onNote = flash
  dock.onHands = () => staff.render()
}

async function openSong(song: Song, mode: Mode) {
  game.endPass()
  view('play')
  await ensureStage()
  game.load(song, mode)
  const prog = await store.getProgress(song.id)
  current = { song, heat: prog.heat }
  $('#title').textContent = song.title
  ;($(`input[name=mode][value=${mode}]`) as HTMLInputElement).checked = true
  applyLayout()
  highway.layout()
  staff.render()
  dock.setSong(song, prog.heat)
  syncMode()
  dock.setPhase()
  resOpen(false)
  onPhase()
  history.replaceState(null, '', '#' + song.id)
}

function leave() {
  game.endPass()
  if (game.phase === 'countin' || game.phase === 'playing' || game.phase === 'waiting') game.toggle()
  if (calibrating) {
    settings.offset = calibrating.prevOffset
    calibrating = undefined
  }
  current = undefined
  view('library')
  history.replaceState(null, '', location.pathname)
  void showLibrary()
}

function applyLayout() {
  $('#staff').hidden = !settings.staff
  $('#play').style.gridTemplateRows = settings.staff ? '' : 'minmax(0,1fr) auto'
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
  } else {
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

function popup(grade: Grade, off: number, p: number) {
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
  if (settings.fx < 2 || reduced || now - lastSlam < 1000) return // one big flash per second at most
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
      popup(e.grade, e.off, e.note.p)
      break
    case 'ok':
      highway.hit(e.note.p, 'ok', e.note.h)
      staff.mark(e.note.id, 'hit-ok')
      break
    case 'miss':
      staff.mark(e.note.id, 'miss')
      popup('miss', 0, e.note.p)
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
      if (current) void store.commit(current.song.id, e.heat)
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
    r.innerHTML = calibrating
      ? `<b>Play middle C on every beat</b><span>Press <kbd>Space</kbd> to start. On the computer keyboard, that is <kbd>A</kbd>.</span>`
      : game.mode === 'perform'
        ? `<b>${esc(current.song.title)}</b><span>Press <kbd>Space</kbd> to start. You get a four-beat count-in.</span>`
        : `<b>Learn mode</b><span>The song waits for you. Press <kbd>Space</kbd>, slow it down, loop the hard bars.</span>`
  }
  if (game.phase === 'paused') say('Paused')
  if (game.phase === 'waiting') say('Waiting for you')
  updateBanner()
}

function resOpen(on: boolean) {
  $('#res').hidden = !on
  $('#play').classList.toggle('resopen', on)
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
  const drill = res.querySelector<HTMLButtonElement>('#drill')
  if (drill && worst)
    drill.onclick = () => {
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
  $('#devName').textContent = pick ? pick.name : midiState === 'unsupported' ? 'No MIDI here' : 'Connect keyboard'
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

onMidi((m) => {
  if (m.on) {
    if (!played) {
      played = true
      updateBanner()
    }
    game.press(m.p, m.v, m.ts)
  } else game.release(m.p)
})
typingKeyboard()

// ---------------------------------------------------------------- drawer

function openDrawer() {
  const d = $('#drawer')
  drawer(d, inputs(), midiState === 'ok' ? (inputs().length ? `${inputs().length} connected.` : 'Connected to the browser, but no keyboard is plugged in.') : midiMsg || 'Not connected yet. Use the Connect button.')
  d.hidden = false
  $('#main').inert = true // the drawer holds focus; the keyboard still plays
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
  on('#sStaff', (el) => {
    settings.staff = el.checked
    save()
    applyLayout()
    if (staff) staff.render()
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
  $('#main').inert = false
  $('#settingsBtn').setAttribute('aria-expanded', 'false')
  return true
}

$('#settingsBtn').onclick = () => ($('#drawer').hidden ? openDrawer() : closeDrawer())
$('#dev').onclick = () => (inputs().length ? openDrawer() : void connectMidi())
$('#brand').onclick = leave

for (const r of document.querySelectorAll<HTMLInputElement>('input[name=mode]')) {
  r.onchange = () => {
    game.endPass()
    game.setMode(r.value as Mode)
    resOpen(false)
    syncMode()
    onPhase()
  }
}

addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement
  const typing = /INPUT|SELECT|TEXTAREA/.test(t.tagName) && (t as HTMLInputElement).type !== 'range' && (t as HTMLInputElement).type !== 'radio' && (t as HTMLInputElement).type !== 'checkbox'
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return
  if (e.key === 'Escape') {
    if (!closeDrawer() && current) leave()
  } else if (e.key === ' ' && current && !/BUTTON/.test(t.tagName) && $('#res').hidden) {
    e.preventDefault()
    game.toggle()
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
  const b = (e.target as HTMLElement).closest('button')
  if (!b) return
  if (b.dataset.play) {
    const id = b.dataset.play
    const mode = b.dataset.mode as Mode
    const i = STARTERS.findIndex((s) => s.spec.id === id)
    if (i >= 0) return void openSong(starters[i], mode)
    const row = (await store.listSongs()).find((s) => s.id === id)
    if (row) {
      try {
        await openSong(store.toSong(row, settings.split), mode)
      } catch (err) {
        void showLibrary((err as Error).message)
      }
    }
  } else if (b.dataset.del) {
    await store.removeSong(b.dataset.del)
    void showLibrary()
  }
})

async function importFiles(files: FileList | File[]) {
  const errs: string[] = []
  for (const f of files) {
    if (!/\.(mid|midi)$/i.test(f.name)) {
      errs.push(`${f.name}: only .mid and .midi files for now.`)
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
  ;(window as unknown as Record<string, unknown>).__piano = { game, icon, open: (i: number, m: Mode) => openSong(starters[i], m) }
}
