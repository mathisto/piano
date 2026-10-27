// The banner over the stage, the keyboard chip in the top bar, and connecting a MIDI keyboard.
import { chooseInput, connect, inputs, midiSupported } from '../midi'
import { settings } from '../settings'
import { noteName } from '../spell'
import { $ } from '../ui'
import { current, esc, game, hooks, played } from './state'

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
  else if (midiState === 'unsupported') html = `<span><b>No MIDI in this browser.</b> Use Chrome, Edge or Firefox on a computer. You can still play with the computer keyboard (<kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> …).</span>`
  else if (midiState === 'blocked') html = `<span><b>MIDI access is blocked.</b> Allow it in the address bar, then reload. Computer keys work meanwhile.</span>`
  else
    html = `<span><b>No keyboard yet.</b> Plug in over USB, then connect. Or play with the computer keys: <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> <kbd>G</kbd> <kbd>H</kbd> <kbd>J</kbd>.</span><button class="btn" id="connectBtn">Connect keyboard</button>`
  b.innerHTML = html ? `<div class="banner" role="status">${html}</div>` : ''
  const c = b.querySelector<HTMLButtonElement>('#connectBtn')
  if (c) c.onclick = () => void connectMidi()
}

export function updateChip() {
  const list = inputs()
  const chip = $('#dev')
  chip.classList.toggle('ok', list.length > 0)
  const pick = list.find((i) => i.id === settings.device) ?? list[0]
  $('#devName').textContent = pick ? pick.name : midiState === 'unsupported' ? 'No MIDI here' : 'No keyboard'
  $('#dev').setAttribute('aria-label', $('#devName').textContent!) // the name is hidden in a narrow window
  document.querySelectorAll<HTMLElement>('.kbline').forEach((e) => (e.hidden = list.length > 0)) // the Connect line on Theory, the Quiz and Sight Run
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
  if (midiState === 'unsupported') return 'No MIDI in this browser. The computer keys still play.'
  if (midiState === 'blocked') return 'MIDI is blocked. Allow it for this site, then reload.'
  return 'Not connected. Plug it in over USB, then Connect.'
}

export async function connectMidi() {
  try {
    await connect(() => {
      updateChip()
      updateBanner()
      if (!inputs().length && (game.phase === 'playing' || game.phase === 'waiting' || game.phase === 'countin')) {
        game.toggle()
        flash('Keyboard disconnected. Plug it back in and press Space to resume.')
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

let chipTimer = 0
export function chipFlash(p: number) {
  const chip = $('#dev')
  chip.classList.add('live')
  $('#devName').textContent = noteName(p)
  clearTimeout(chipTimer)
  chipTimer = window.setTimeout(() => {
    chip.classList.remove('live')
    updateChip()
  }, 450)
}
