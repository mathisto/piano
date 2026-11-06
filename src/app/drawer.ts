// The settings drawer, and the Set up and Credits dialogs it opens.
import * as audio from '../audio'
import * as lib from '../catalog'
import { creditBlock, libraryUrl } from '../credits'
import { chooseInput, inputs } from '../midi'
import { native } from '../native-midi'
import { save, settings } from '../settings'
import { applyTheme } from '../theme'
import { STARTERS } from '../starters'
import * as store from '../store'
import { $, keepFocus } from '../ui'
import { esc } from '../util'
import { current, game, highway, hooks, say, sheets } from './state'
import { connectMidi, midiLine, midiState, PAIR, updateChip } from './banner'
import { importFiles, lens, shareFile } from './library'
import { leave } from './play'
import { startCalibration } from './calibration'
import { startTouchCal } from './technique-ui'

const backup = () => import('../backup')

/** The drawer holds focus and the screen reader: the page and the bar behind it are inert, but the Settings button (it closes the drawer) and the main landmark stay. The keyboard still plays. */
const behind = (on: boolean) => document.querySelectorAll<HTMLElement>('#main > section, .bar > :not(#settingsBtn)').forEach((e) => (e.inert = on))

async function openDrawer() {
  const d = $('#drawer')
  const wasOpen = !d.hidden
  d.hidden = false // open on the tap, before its markup arrives: a second tap closes it rather than opening it twice
  behind(true)
  $('#settingsBtn').setAttribute('aria-expanded', 'true')
  let drawer: typeof import('../ui-drawer').drawer
  try {
    ;({ drawer } = await import('../ui-drawer'))
  } catch {
    d.innerHTML = '<h2 id="drawerTitle" tabindex="-1">Settings</h2><p>Settings could not load. Check the connection, then reload the page.</p>'
    return
  }
  if (d.hidden) return // closed again while it loaded
  const open = d.querySelector('details')?.open
  keepFocus(d, () => {
    drawer(d, inputs())
    if (open) d.querySelector('details')!.open = true
  })
  if (!wasOpen) $('#drawerTitle', d).focus()
  const on = (id: string, fn: (el: HTMLInputElement) => void, ev = 'input') => d.querySelector<HTMLInputElement>(id)?.addEventListener(ev, (e) => fn(e.target as HTMLInputElement))
  const radios = (name: string, fn: (v: string) => void) => d.querySelectorAll<HTMLInputElement>(`input[name=${name}]`).forEach((r) => (r.onchange = () => fn(r.value)))
  on('#sOffset', (el) => {
    settings.offset = Math.max(-300, Math.min(300, Number(el.value) || 0))
    save()
  })
  $('#sCal', d).onclick = () => void startCalibration()
  $('#sClose', d).onclick = closeDrawer
  radios('theme', (v) => {
    settings.theme = v as typeof settings.theme
    applyTheme()
    save()
  })
  radios('fx', (v) => {
    settings.fx = Number(v) as 0 | 1
    save()
  })
  radios('pulse', (v) => {
    settings.pulse = v as typeof settings.pulse
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
  // the plain ones: the setting follows the box (a switch) or the select
  for (const [id, k] of [['sMarks', 'marks'], ['sWritten', 'asWritten'], ['sFingers', 'fingers'], ['sFade', 'fade'], ['sKeys', 'shortcuts'], ['sKeyTouch', 'keyTouch']] as const)
    on(`#${id}`, (el) => {
      ;(settings as unknown as Record<string, unknown>)[k] = el.type === 'checkbox' ? el.checked : el.value
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
  if (native) void import('../native-reminder').then((m) => m.wireReminder(d))
  void import('../sync').then((m) => m.wireSync(d))
  $('#sCredits', d).onclick = () => void openCredits()
  $('#sSetup', d).onclick = openSetup
  $('#sHelp', d).onclick = () => ($('#help') as HTMLDialogElement).showModal()
  $('#sExport', d).onclick = async () => {
    await shareFile(new File([await (await backup()).exportAll()], 'piano-forte-backup.json', { type: 'application/json' }))
  }
  $('#sSummary', d).onclick = async () => {
    const { buildSummary } = await import('../report')
    const titles: Record<string, string> = Object.fromEntries([...STARTERS.map((s) => [s.spec.id, s.spec.title]), ...(await store.listSongs()).map((s) => [s.id, s.title]), ...lib.catalog.pieces.map((p) => [`lib:${p.id}`, p.title])])
    await shareFile(new File([buildSummary(JSON.parse(await (await backup()).exportAll()), titles)], 'piano-practice-summary.txt', { type: 'text/plain' }))
  }
  const file = $<HTMLInputElement>('#sFile', d)
  $('#sImport', d).onclick = () => file.click()
  file.onchange = async () => {
    const f = file.files?.[0]
    if (!f) return
    try {
      await (await backup()).importAll(await f.text())
      location.reload()
    } catch (e) {
      say((e as Error).message)
    }
  }
  $('#sClear', d).onclick = async () => {
    if (!confirm('Delete your files, progress and settings from this device? This cannot be undone. Export first to keep a copy.')) return
    await store.clearAll()
    location.reload()
  }
}

export function closeDrawer() {
  const d = $('#drawer')
  if (d.hidden) return false
  d.hidden = true
  behind(false)
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
// The keyboard chip is the one place to see and connect keyboards: a small panel under it (the shared More menu
// opens it; this fills it first): what is connected, a choice when there are several, pairing over Bluetooth on the iPad
$('#dev').addEventListener('click', () => {
  const ins = inputs()
  $('#kbMenu').innerHTML = `<p class="kbstate">${ins.length ? `${ins.length > 1 ? 'Keyboards' : 'Connected'}` : 'No keyboard'}</p>${
    ins.length > 1
      ? `<select id="sDevice" aria-label="Keyboard"><option value="">All keyboards</option>${ins.map((i) => `<option value="${esc(i.id)}"${i.id === settings.device ? ' selected' : ''}>${esc(i.name)}</option>`).join('')}</select>`
      : ins.length ? `<p class="kbname">${esc(ins[0].name)}</p>` : ''
  }${native ? '<button class="btn" data-pair>Pair a Bluetooth keyboard</button>' : midiState === 'ok' ? '' : '<button class="btn" data-connect>Connect</button>'}${ins.length ? '' : `<p class="kbnote">${native ? 'Plug in a USB keyboard and switch it on; it connects by itself.' : midiState === 'ok' ? 'A USB keyboard connects by itself when it is plugged in and switched on.' : 'After the first Connect, a USB keyboard connects by itself whenever it is plugged in and switched on.'}</p>`}`
  $<HTMLSelectElement>('#kbMenu').querySelector('select')?.addEventListener('change', (e) => {
    settings.device = (e.target as HTMLSelectElement).value
    chooseInput(settings.device)
    save()
    updateChip()
  })
})
// elsewhere a Connect button only points here
document.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('[data-kb]')) return
  document.querySelectorAll('dialog[open]').forEach((x) => (x as HTMLDialogElement).close())
  closeDrawer()
  setTimeout(() => $('#dev').click())
})

/** Credits name the pieces you have played or saved; the full list is LICENSES.md, in the app and in the corpus. */
async function openCredits() {
  const d = $('#credits') as HTMLDialogElement
  const [prog, { reportLink }, ui] = await Promise.all([store.allProgress(), import('../report'), sheets(d)])
  if (!ui) return
  const mine = lib.catalog.pieces.filter((p) => lib.cached.has(p.id) || prog.has(`lib:${p.id}`)).sort((a, b) => a.title.localeCompare(b.title))
  d.innerHTML = ui.creditsDialog(mine.map((p) => creditBlock(lib.catalog, p)), { app: libraryUrl('LICENSES.md'), corpus: new URL('LICENSES.md', lib.CORPUS).href }, (i) => reportLink(lib.catalog, mine[i]))
  d.showModal()
  d.scrollTop = 0
}

/** The first-run sheet, also Settings > Set up. Every action hands over to the flow it names; nothing here blocks. */
export async function openSetup() {
  const d = $('#setup') as HTMLDialogElement
  try {
    localStorage.setItem('piano.setup', '1')
  } catch {
    /* private mode: it may show again next time */
  }
  closeDrawer()
  const ui = await sheets(d)
  if (!ui) return
  d.innerHTML = ui.setupDialog(midiLine(), inputs().length > 0, settings.offset, PAIR)
  const away = (f: () => void) => () => {
    d.close()
    if (current) leave()
    f()
  }
  $('#suConnect', d).onclick = () => void connectMidi()
  const files = $<HTMLInputElement>('#suFiles', d)
  $('#suAddFiles', d).onclick = () => files.click()
  files.onchange = async (e) => {
    const files = [...((e.target as HTMLInputElement).files ?? [])]
    if (!files.length) return
    d.close()
    if (current) leave()
    await importFiles(files)
  }
  $('#suTouch', d).onclick = away(() => startTouchCal(openSetup)) // and back here when it is done
  $('#suDelay', d).onclick = away(() => void startCalibration(openSetup))
  $<HTMLSelectElement>('#suKeyTouch', d).onchange = (e) => {
    settings.keyTouch = (e.target as HTMLSelectElement).value as typeof settings.keyTouch
    save()
  }
  d.showModal()
}

Object.assign(hooks, { openDrawer, closeDrawer })
