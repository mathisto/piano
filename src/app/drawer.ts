// The settings drawer, and the Set up and Credits dialogs it opens.
import * as audio from '../audio'
import * as lib from '../catalog'
import { creditBlock, libraryUrl } from '../credits'
import { chooseInput, inputs, monitor } from '../midi'
import { buildSummary, reportLink } from '../report'
import { save, settings } from '../settings'
import { STARTERS } from '../starters'
import * as store from '../store'
import { $, creditsDialog, drawer, setupDialog } from '../ui'
import { current, game, highway, hooks, say } from './state'
import { connectMidi, midiLine, midiState, updateChip } from './banner'
import { lens, shareFile } from './library'
import { leave } from './play'
import { startCalibration } from './calibration'
import { startTouchCal } from './technique-ui'

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

export function closeDrawer() {
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
export function openSetup() {
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

Object.assign(hooks, { openDrawer, closeDrawer })
