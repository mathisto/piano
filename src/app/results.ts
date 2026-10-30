// The end of a piece: saving the run and the results card, or handing over to the drill, calibration, read-through or memorise ending.
import { yourPart } from '../accomp'
import * as coach from '../coach'
import { dayNum } from '../drill'
import type { Result } from '../game'
import { nextStep } from '../pace'
import { CLEAN_RUNS, parseId, passed, record as recordScale } from '../scales'
import { settings } from '../settings'
import { LEVELS } from '../levels'
import * as store from '../store'
import { applyRun } from '../syllabus'
import { $, cardName } from '../ui'
import { esc, worstBars } from '../util'
import { dayKey } from '../week'
import { calibrating, current, dock, drill, game, hooks, mem, resOpen, rt, say } from './state'
import { syncMode } from './stage'
import { leave, onPhase } from './play'
import { rtDone } from './readthrough-ui'
import { memDone, memorise } from './memorise-ui'
import { drillDone } from './drill'
import { calibrated } from './calibration'

async function onDone(r: Result) {
  if (!current) return
  if (drill) return drillDone()
  if (calibrating) return calibrated(r)
  if (rt) return rtDone(r)
  if (mem) return memDone(r)
  const who = yourPart(game.song, game.hands, game.parts) // one part of the piece: judged, but not a run of the piece
  const lv = current.level // Notes shown above Full leaves notes out, so it is not the piece as written either: Ready asks for the piece as written
  const partial = !!who || lv > 0
  const prog = await store.commit(
    current.song.id,
    r.heat,
    current.song.bars.length,
    r.mode === 'perform' && !partial ? { acc: r.acc } : undefined,
    r.mode === 'read' || game.loop || partial ? undefined : r.rate >= 0.9 && (r.mode === 'perform' ? r.acc >= 0.9 && r.clean : r.clean && !game.wait), // Ready and the review boxes count runs near the written tempo, without waiting
  )
  current.heat = prog.heat
  void store.markPlan(dayKey(), current.song.id.startsWith('scale:') ? 'scale' : current.song.id.startsWith('tech:') ? 'warm' : game.loop ? 'fix' : 'piece')
  if (current.song.id.startsWith('tech:') && r.mode === 'perform') void store.saveTech((ts) => applyRun(ts, current!.song.id, { acc: r.acc, touchPct: r.touchPct }, dayNum()))
  dock.setSong(current.song, prog.heat)
  if (r.touch.n >= 4) {
    const { n, mean, sd, hands, bands } = r.touch
    void store.logTouch({ ts: Date.now(), id: current.song.id, title: current.song.title, mode: r.mode, n, mean, sd, R: hands.R, L: hands.L, bands, keyTouch: settings.keyTouch })
  }
  const kind = current.song.id.startsWith('scale:') ? 'scale' : current.song.id.startsWith('tech:') ? 'tech' : 'song'
  if (r.mode === 'perform' && r.total >= 4) void store.logHistory({ ts: Date.now(), kind, label: who ? `${current.song.title}: your part` : lv ? `${current.song.title}: ${LEVELS[lv]}` : current.song.title, acc: r.acc, even: r.even?.inside, bias: r.timing?.bias })
  if (coach.coached(current.song.id, current.song.dyn, r.mode)) void coach.tally(current.song.id, r.even?.rating)
  let note = ''
  const sc = parseId(current.song.id)
  if (sc && r.mode === 'perform') {
    const ok = passed(r)
    let before = 0
    const stats = await store.saveScales((st) => {
      before = st[`${sc.card.form}:${sc.card.tonic}:${sc.card.hands}:${sc.card.oct}`]?.best ?? 0
      recordScale(st, sc.card, sc.bpm, ok)
      return st
    })
    const s = stats[`${sc.card.form}:${sc.card.tonic}:${sc.card.hands}:${sc.card.oct}`]
    note = ok
      ? s.best > before ? `Three clean runs in a row: <b>${esc(cardName(sc.card))}</b> is solid at ${sc.bpm}.` : `A clean run, ${s.streak} of ${CLEAN_RUNS} at ${sc.bpm}.`
      : `This run did not count: ${!r.clean ? 'a missed or wrong note' : r.acc < 0.85 ? 'the timing slipped' : 'the touch was uneven'}. The count starts again.`
  }
  const worst = worstBars(r.heat, current.song.bars.length)
  const next = r.mode === 'read' ? null : nextStep({ clean: r.clean, wait: game.wait, rate: game.rate, worst })
  const res = $('#res')
  if (who) note = `Judged on your part only: <b>${esc(who.you)}</b>.${who.app ? ` The app played ${esc(who.app)}.` : ''} ${note}`
  if (lv) note = `Notes shown: ${LEVELS[lv]}, not the whole piece, so this run does not count toward Ready. ${note}`
  res.innerHTML = (await import('../ui-results')).results(r, next, note, current.song.id.startsWith('scale:') ? 'Scales' : current.song.id.startsWith('tech:') ? 'Technique' : 'Songs')
  if (r.mode === 'learn' && r.clean && !game.loop) $('#toLib', res).insertAdjacentHTML('beforebegin', '<button class="btn" id="memTry">Try it from memory</button>')
  res.querySelector<HTMLButtonElement>('#memTry')?.addEventListener('click', () => void memorise(current!.song.id, 1))
  void import('./take-ui').then((t) => t.takeCard(res)) // Listen back and Compare with last time (loaded with the stage)
  resOpen(true)
  res.querySelector<HTMLButtonElement>('#next, #again')?.focus()
  say(`Finished. ${Math.round(r.acc * 100)} percent accuracy.`)
  $('#again', res).onclick = () => game.restart()
  $('#toLib', res).onclick = leave
  const nextBtn = res.querySelector<HTMLButtonElement>('#next')
  if (nextBtn && next)
    nextBtn.onclick = () => {
      if (next.kind === 'loop' && worst) {
        ;($('input[name=mode][value=learn]') as HTMLInputElement).checked = true
        game.setMode('learn')
        game.setLoop({ a: game.song.bars[worst.a].t0, b: game.song.bars[worst.b].t1 })
      } else if (next.kind === 'nowait') {
        game.setWait(false)
        game.restart()
      } else if (next.rate) {
        game.setRate(next.rate)
        game.restart()
      }
      if (next.rate && next.kind === 'loop') game.setRate(next.rate)
      resOpen(false)
      syncMode()
      onPhase()
    }
}

Object.assign(hooks, { onDone })
