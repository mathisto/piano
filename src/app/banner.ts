// The banner over the stage, the keyboard chip in the top bar, and connecting a MIDI keyboard.
import { PLUG } from '../guide'
import { chooseInput, connect, inputs, midiSupported } from '../midi'
import { native, pairBluetooth } from '../native-midi'
import { settings } from '../settings'
import { $ } from '../ui'
import { esc } from '../util'
import { current, game, hooks, played, say } from './state'
import { syncOsk } from './osk-ui'

/** The iPad app's way to a Bluetooth keyboard: Apple's pairing sheet. A browser has none. */
export const PAIR = native ? '<button class="btn" data-kb>Connect</button>' : '' // the chip's panel is the one place that pairs

export let midiState: 'idle' | 'ok' | 'blocked' | 'unsupported' = midiSupported ? 'idle' : 'unsupported'
let noteTimer = 0
let note = ''

export function flash(msg: string) {
  note = msg
  updateBanner()
  clearTimeout(noteTimer)
  noteTimer = window.setTimeout(() => {
    note = ''
    updateBanner()
  }, 5000)
}

export function updateBanner() {
  const b = $('#banner')
  let html = ''
  const have = inputs().length > 0
  if (note) html = `<span>${esc(note)}</span>`
  else if (!current || played || have) html = ''
  else if (midiState === 'unsupported') html = `<span><b>No MIDI in this browser.</b> Use Chrome, Edge or Firefox on a computer, or play the computer keys <kbd>A</kbd> to <kbd>;</kbd>.</span>`
  else if (midiState === 'blocked') html = `<span><b>MIDI is blocked for this site.</b> Allow it in the address bar, then reload.</span>`
  else if (native) html = `<span><b>No keyboard.</b> ${PLUG}</span>${PAIR}`
  else
    html = `<span><b>No keyboard.</b> ${PLUG} Or play the computer keys <kbd>A</kbd> to <kbd>;</kbd>.</span><button class="btn" id="connectBtn">Connect</button>`
  b.innerHTML = html ? `<div class="banner">${html}</div>` : '' // #banner is the one live region: its words change, the region stays
  const c = b.querySelector<HTMLButtonElement>('#connectBtn')
  if (c) c.onclick = () => void connectMidi()
}

export function updateChip() {
  const list = inputs()
  const chip = $('#dev')
  chip.classList.toggle('ok', list.length > 0)
  const pick = list.find((i) => i.id === settings.device) ?? list[0]
  $('#devName').textContent = pick ? pick.name : midiState === 'unsupported' ? 'No MIDI here' : 'No keyboard'
  $('#dev').setAttribute('aria-label', `Keyboard: ${$('#devName').textContent}`) // the name is hidden in a narrow window
  document.querySelectorAll<HTMLElement>('.kbline').forEach((e) => (e.hidden = list.length > 0)) // the Connect line on Theory, the Quiz and Sight Run
  document.querySelectorAll<HTMLElement>('[data-needs]').forEach((e) => (e instanceof HTMLButtonElement ? (e.disabled = !list.length) : (e.hidden = list.length > 0))) // what only a keyboard can do: its button waits, its line says why
  syncOsk() // the on-screen keys follow it
  const su = document.querySelector('#suMidi')
  if (su) {
    su.textContent = midiLine()
    document.querySelector('#suConnect')?.toggleAttribute('hidden', list.length > 0)
  }
}

/** The keyboard's state in words, for the Set up sheet. */
export function midiLine() {
  const list = inputs()
  const pick = list.find((i) => i.id === settings.device) ?? list[0]
  if (pick) return `${pick.name}, connected`
  if (midiState === 'unsupported') return 'No MIDI in this browser. Use Chrome, Edge or Firefox on a computer, or play the computer keys.'
  if (midiState === 'blocked') return 'MIDI is blocked for this site. Allow it in the address bar, then reload.'
  return `No keyboard. ${PLUG}`
}

export async function connectMidi() {
  try {
    await connect(() => {
      updateChip()
      updateBanner()
      if (inputs().length) say(`${inputs()[0].name} connected`) // the chip changes silently
      else {
        if (game.phase === 'playing' || game.phase === 'waiting' || game.phase === 'countin') {
          game.toggle()
          flash(`Keyboard disconnected. Plug it back in, then ${matchMedia('(pointer: coarse)').matches ? 'tap Play' : 'press Space'}.`) // the banner is a live region
        } else say('Keyboard disconnected')
        game.letGo() // its keys and pedal never send their up
      }
      if (document.querySelector('#drawer:not([hidden])')) hooks.openDrawer()
    })
    chooseInput(settings.device)
    midiState = 'ok'
  } catch {
    midiState = midiSupported ? 'blocked' : 'unsupported'
  }
  updateChip()
  updateBanner()
}

document.addEventListener('click', (e) => (e.target as HTMLElement).closest('[data-connect]') && void connectMidi())
document.addEventListener('click', (e) => (e.target as HTMLElement).closest('[data-pair]') && pairBluetooth())

let chipTimer = 0
/** A key came in: the chip's ring lights for a moment (the keyboard is sending). Its words stay the keyboard's name; the held-chord readout names keys. */
export function chipFlash() {
  const chip = $('#dev')
  chip.classList.add('live')
  clearTimeout(chipTimer)
  chipTimer = window.setTimeout(() => chip.classList.remove('live'), 450)
}
