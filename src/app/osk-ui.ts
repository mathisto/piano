// The on-screen keys under Theory and the Scales quiz: the same MidiMsg a keyboard sends, flagged virtual.
import * as audio from '../audio'
import { icon } from '../icons'
import { inputs, type MidiMsg } from '../midi'
import { clampLow, defaultLow, keyAt, label, layout, type OKey, shown, whitesFor } from '../osk'
import { noteName } from '../spell'
import { save, settings } from '../settings'
import { $ } from '../ui'
import '../osk.css'
import { drill } from './state' // also builds the page the keys go into

const VEL = 0.75
let send: (m: MidiMsg) => void = () => {}
let keys: OKey[] = []
let whites = 0
let low = 0
const down = new Map<number, number>() // pointer id -> pitch held

const box = document.createElement('div')
box.id = 'osk'
box.hidden = true
box.setAttribute('role', 'region')
box.setAttribute('aria-label', 'On-screen keys')
box.setAttribute('aria-describedby', 'oskHelp')
box.innerHTML = `<p class="sr-only" id="oskHelp">Piano keys. Touch a key, or move through the named buttons with VoiceOver and activate one. VoiceOver gives you four seconds to move between notes of a chord.</p><div class="osk-bar"><button class="btn icon sm" data-oct="-1" aria-label="Octave down">${icon('back')}</button><b class="osk-range" aria-live="polite"></b><button class="btn icon sm flip" data-oct="1" aria-label="Octave up">${icon('back')}</button><button class="btn sm osk-names" aria-pressed="false">Names</button><button class="btn icon sm" data-hide aria-label="Hide on-screen keys">${icon('x')}</button></div><div class="osk-keys" role="group" aria-label="Piano keys"></div>`
$('#app').insertBefore(box, $('#drawer'))
const board = $('.osk-keys', box)

const midi = (on: boolean, p: number): MidiMsg => ({ on, p, v: on ? VEL : 0, ts: performance.now(), virtual: true })

function draw() {
  board.innerHTML = keys.map((k) => `<button type="button" class="${k.black ? 'b' : 'w'}" data-p="${k.p}" style="left:${k.x * 100}%;width:${k.w * 100}%" aria-label="${noteName(k.p)}">${label(k.p, !!settings.oskNames)}</button>`).join('')
  $('.osk-range', box).textContent = `${noteName(low)} to ${noteName(keys[keys.length - 1].p)}`
  $('.osk-names', box).setAttribute('aria-pressed', String(!!settings.oskNames))
  box.querySelectorAll<HTMLButtonElement>('[data-oct]').forEach((b) => (b.disabled = clampLow(low + Number(b.dataset.oct) * 12, whites) === low))
}

/** (Re)build the keys; a change of range lets go of any held key first. */
function build(n: number, l: number) {
  if (n === whites && l === low) return
  for (const p of new Set(down.values())) send(midi(false, p))
  down.clear()
  whites = n
  low = l
  keys = layout(low, whites)
  draw()
}
const fit = () => {
  const n = whitesFor(board.clientWidth)
  build(n, n === whites ? low : defaultLow(n, drill ? Math.min(...drill.cards.flatMap((c) => c.pitches)) : undefined))
}

const light = () => {
  const held = new Set(down.values())
  for (const e of board.children) e.classList.toggle('on', held.has(Number((e as HTMLElement).dataset.p)))
}
const at = (e: PointerEvent) => {
  const r = board.getBoundingClientRect()
  return keyAt(keys, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
}
const lift = (id: number) => {
  const p = down.get(id)
  if (p === undefined) return
  down.delete(id)
  if (![...down.values()].includes(p)) send(midi(false, p))
  light()
}
const press = (id: number, p: number) => {
  down.set(id, p)
  send(midi(true, p))
  light()
}
board.addEventListener('pointerdown', (e) => {
  const p = at(e)
  if (p === undefined) return
  e.preventDefault()
  board.setPointerCapture(e.pointerId)
  audio.unlock()
  press(e.pointerId, p)
})
board.addEventListener('pointermove', (e) => {
  const was = down.get(e.pointerId)
  const p = at(e)
  if (was === undefined || p === undefined || p === was) return
  lift(e.pointerId) // glide: the finger leaves one key for the next
  press(e.pointerId, p)
})
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) board.addEventListener(ev, (e) => lift(e.pointerId))
board.addEventListener('click', (e) => {
  if (e.detail !== 0) return // direct touch already played through the pointer events; detail 0 is keyboard or assistive activation
  const key = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-p]')
  if (!key) return
  audio.unlock()
  const p = Number(key.dataset.p)
  send({ ...midi(true, p), assistive: true })
  setTimeout(() => send({ ...midi(false, p), assistive: true }), 80)
})
box.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button')
  if (!b || b.dataset.p !== undefined) return
  if (b.dataset.hide !== undefined) {
    settings.osk = false
    save()
    syncOsk()
  } else if (b.dataset.oct) build(whites, clampLow(low + Number(b.dataset.oct) * 12, whites))
  else if (b.classList.contains('osk-names')) {
    settings.oskNames = !settings.oskNames
    save()
    draw()
  }
})

/** Show the keys when a card waits for an answer and the player wants them (or has no keyboard). */
export function syncOsk() {
  const needed = !!document.querySelector('.view.on [data-osk]') || (!!drill && $('#play').classList.contains('on')) // a card waits, or a reading drill or Sight Run is open
  const on = shown(settings.osk, inputs().length, needed)
  if (box.hidden !== !on) box.hidden = !on
  if (on) fit()
  else whites = 0 // the next card or drill starts on its own range, not wherever the last was shifted to
  document.querySelectorAll<HTMLInputElement>('input[data-osk-sw]').forEach((c) => (c.checked = settings.osk ?? inputs().length === 0))
}

document.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement
  if (!t.matches?.('input[data-osk-sw]')) return
  settings.osk = t.checked
  save()
  syncOsk()
})
new ResizeObserver(() => !box.hidden && fit()).observe(box)
const watch = new MutationObserver(syncOsk)
for (const v of document.querySelectorAll('#main > .view')) watch.observe(v, { attributes: true, attributeFilter: ['class'], childList: v.id === 'theory' || v.id === 'scales' })
syncOsk()

export const mountOsk = (fn: (m: MidiMsg) => void) => (send = fn)
