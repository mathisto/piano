// Technique: the exercise builder, the syllabus, and calibrating your touch.
import { dayNum } from '../drill'
import { save, settings } from '../settings'
import * as store from '../store'
import { stateOf, SYLLABUS } from '../syllabus'
import { exercise, type Opts, PATTERNS } from '../technique'
import { thumb } from '../thumb'
import { calibrate } from '../touch'
import { $, CAL_NOTES, techniqueView, type TouchCal } from '../ui'
import { hooks } from './state'
import { openSong } from './play'

export async function showTechnique() {
  const el = $('#technique')
  const ts = await store.getTech()
  const today = dayNum()
  const path = SYLLABUS.map((r) => ({ id: r.id, label: r.label, group: PATTERNS[r.opts.pattern], state: stateOf(ts, r.id, today) }))
  techniqueView(el, settings.tech, touchCal, calMsg, thumb(exercise(settings.tech, settings.edges)), path)
  el.querySelectorAll<HTMLButtonElement>('button[data-recipe]').forEach((b) => (b.onclick = () => {
    const r = SYLLABUS.find((x) => x.id === b.dataset.recipe)
    if (r) void openSong(exercise(r.opts, settings.edges), 'perform')
  }))
  const redraw = () => void showTechnique()
  const on = (id: string, f: (v: string) => void, rerender = false) => {
    const sel = el.querySelector<HTMLSelectElement>(id)
    if (sel)
      sel.addEventListener('change', () => {
        f(sel.value)
        save()
        if (rerender) redraw()
        else el.querySelector('.tprev')!.innerHTML = thumb(exercise(settings.tech, settings.edges))
      })
  }
  on('#tPattern', (v) => (settings.tech.pattern = v as Opts['pattern']), true)
  on('#tKey', (v) => {
    settings.tech.tonic = parseInt(v)
    settings.tech.minor = v.endsWith('m') || undefined
  })
  on('#tHands', (v) => (settings.tech.hands = v as Opts['hands']))
  on('#tDyn', (v) => (settings.tech.dyn = v as Opts['dyn']))
  on('#tArtic', (v) => (settings.tech.artic = v === 'normal' ? undefined : (v as Opts['artic'])))
  on('#tLevel', (v) => (settings.tech.level = Number(v) as 1 | 2 | 3))
  on('#tBpm', (v) => (settings.tech.bpm = Number(v)))
  $('#tStart', el).onclick = () => void openSong(exercise(settings.tech, settings.edges), 'perform')
  const click = (sel: string, f: () => void) => {
    const b = el.querySelector<HTMLButtonElement>(sel)
    if (b) b.onclick = f
  }
  click('#calStart', startTouchCal)
  click('#calCancel', () => {
    touchCal = null
    void showTechnique()
  })
  click('#calReset', () => {
    settings.edges = undefined
    save()
    calMsg = ''
    void showTechnique()
  })
}

let touchCal: TouchCal | null = null
let calGot: number[][] = [[], [], []]
let calMsg = ''

export function startTouchCal() {
  touchCal = { step: 0, got: 0 }
  calGot = [[], [], []]
  calMsg = ''
  void hooks.showSection('technique')
}

/** A note-on from a real keyboard while calibrating; returns true when it was consumed. */
export function calNote(vel: number) {
  if (!touchCal || !$('#technique').classList.contains('on')) return false // only while the Technique page is open
  const c = touchCal
  calGot[c.step].push(Math.max(1, Math.round(vel * 127)))
  c.got = calGot[c.step].length
  if (c.got >= CAL_NOTES) {
    if (c.step < 2) touchCal = { step: (c.step + 1) as 1 | 2, got: 0 }
    else {
      const e = calibrate(calGot[0], calGot[1], calGot[2])
      if (e) {
        settings.edges = e
        save()
      }
      calMsg = e ? 'Saved. Soft, medium and hard now follow your own playing.' : 'The three levels were too close together. Play soft very gently and hard firmly, then try again.'
      touchCal = null
    }
  }
  void showTechnique()
  return true
}
