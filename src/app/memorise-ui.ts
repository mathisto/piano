// Memorise: Learn with the score fading by bars, stage by stage.
import type { Result } from '../game'
import { afterPass, barHtml, hidden, passCard, type PassReport, startStage, TOP, verdict } from '../memory'
import { barAt } from '../song'
import * as store from '../store'
import { $ } from '../ui'
import { dayKey } from '../week'
import { current, dock, game, highway, hooks, mem, resOpen, say, setMem, staff } from './state'
import { flash } from './banner'
import { leave, onPhase, openById } from './play'

/** Learn with the score fading by bars. `floor`: start at this stage at least (1 after a clean Learn run). */
export async function memorise(id: string, floor = 0) {
  const prog = await store.getProgress(id)
  await openById(id, 'learn')
  if (!current || current.song.id !== id) return
  memEnd()
  setMem({ stage: startStage(prog, floor), clean: 0, right: 0, slips: 0, peeks: 0, peek: -1, timer: 0 })
  document.body.classList.add('memorise')
  memShow()
  onPhase()
}

function memEnd() {
  clearTimeout(mem?.timer)
  setMem(undefined)
  document.body.classList.remove('memorise')
  if (staff) memShow()
}

/** Hide the stage's bars on the staff and the falling notes, and redraw the strip over the staff. */
function memShow() {
  const m = mem
  const hide = m && ((b: number) => hidden(m.stage, b) && b !== m.peek)
  staff.hideBar = highway.hideBar = hide
  $('#staff').classList.toggle('mem-blind', !!m && m.stage === TOP && m.peek < 0)
  let bar = document.querySelector<HTMLElement>('#memBar')
  if (!m) return bar?.remove()
  if (!bar) bar = Object.assign(document.createElement('div'), { id: 'memBar', className: 'mem-bar' })
  if (!bar.isConnected) $('#play').prepend(bar) // a row above the staff, so it never covers notation
  bar.innerHTML = barHtml({ ...m, peeking: m.peek >= 0 })
  bar.querySelector('#memPeek')?.addEventListener('click', memPeek)
}

function memStage(stage: number) {
  Object.assign(mem!, { stage, clean: 0 })
  memShow()
  onPhase()
}

/** Show the bar you are on for two seconds; the pass reports it. */
function memPeek() {
  const m = mem
  if (!m || m.peek >= 0) return
  const i = game.judge.nextPending()
  m.peek = i >= 0 ? game.song.notes[i].bar : barAt(game.song.bars, Math.max(0, game.t))
  m.peeks++
  memShow()
  m.timer = window.setTimeout(() => {
    m.peek = -1
    if (mem === m) memShow()
  }, 2000)
}

/** A pass ended (a loop wrapped or the piece finished): move the stage and keep the highest stage cleared. */
function memPass(clean: boolean, heat: number[]): PassReport {
  const m = mem!
  const r: PassReport = { title: game.song.title, from: m.stage, to: afterPass(m, { clean, slips: m.slips, peeks: m.peeks }), slips: m.slips, peeks: m.peeks, clean, heat, bars: game.song.bars.length }
  Object.assign(m, { stage: r.to.stage, clean: r.to.clean, right: 0, slips: 0, peeks: 0 })
  if (r.to.cleared !== undefined) void store.memorised(game.song.id, r.to.cleared)
  memShow()
  return r
}

game.on((e) => {
  const m = mem
  if (!m) return
  if (e.type === 'ok' || e.type === 'hit') m.right++
  else if (e.type === 'miss' || e.type === 'wrong') m.slips++
  else if (e.type === 'phase' && e.phase === 'ready') Object.assign(m, { right: 0, slips: 0, peeks: 0 })
  else if (e.type === 'loop') return flash(verdict(memPass(e.clean, [])))
  else return
  memShow()
})

export async function memDone(r: Result) {
  const c = current!
  const p = memPass(r.clean, r.heat)
  // from stage 3 up the piece is played from memory: it joins spaced review like a clean Perform run
  const prog = await store.commit(c.song.id, r.heat, c.song.bars.length, undefined, p.from >= 3 ? r.clean && !p.peeks : undefined)
  c.heat = prog.heat
  dock.setSong(c.song, prog.heat)
  void store.markPlan(dayKey(), 'piece')
  const res = $('#res')
  res.innerHTML = passCard(p)
  resOpen(true)
  say(verdict(p))
  $('#memAgain', res).onclick = () => game.restart()
  $('#toLib', res).onclick = leave
  $('#memAgain', res).focus()
}

Object.assign(hooks, { memEnd, memStage })
