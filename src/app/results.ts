// The end of a piece: saving the run and the results card, or handing over to the drill, calibration, read-through or memorise ending.
import { yourPart } from '../accomp'
import * as coach from '../coach'
import { dayNum } from '../drill'
import type { Result } from '../game'
import { nextStep } from '../pace'
import { CLEAN_RUNS, parseId, passed, record as recordScale } from '../scales'
import { settings } from '../settings'
import * as store from '../store'
import { applyRun } from '../syllabus'
import { $, cardName, results } from '../ui'
import { dayKey } from '../week'
import { calibrating, current, dock, drill, esc, game, hooks, mem, resOpen, rt, say, worstBars } from './state'
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
  const prog = await store.commit(
    current.song.id,
    r.heat,
    r.mode === 'perform' && !who ? { score: r.score, acc: r.acc, grade: r.grade } : undefined,
    r.mode === 'read' || game.loop || who ? undefined : r.rate >= 0.9 && (r.mode === 'perform' ? r.acc >= 0.9 && r.clean : r.clean && !game.wait), // Ready and the review boxes count runs near the written tempo, without waiting
  )
  current.heat = prog.heat
  void store.markPlan(dayKey(), current.song.id.startsWith('scale:') ? 'scale' : current.song.id.startsWith('tech:') ? 'warm' : game.loop ? 'fix' : 'piece')
  if (current.song.id.startsWith('tech:') && r.mode === 'perform') void store.getTech().then((ts) => store.saveTech(applyRun(ts, current!.song.id, { acc: r.acc, touchPct: r.touchPct }, dayNum())))
  dock.setSong(current.song, prog.heat)
  if (r.touch.n >= 4) {
    const { n, mean, sd, hands, bands } = r.touch
    void store.logTouch({ ts: Date.now(), id: current.song.id, title: current.song.title, mode: r.mode, n, mean, sd, R: hands.R, L: hands.L, bands, keyTouch: settings.keyTouch })
  }
  const kind = current.song.id.startsWith('scale:') ? 'scale' : current.song.id.startsWith('tech:') ? 'tech' : 'song'
  if (r.mode === 'perform' && r.total >= 4) void store.logHistory({ ts: Date.now(), kind, label: who ? `${current.song.title}: your part` : current.song.title, acc: r.acc, even: r.even?.inside, bias: r.timing?.bias })
  if (coach.coached(current.song.id, current.song.dyn, r.mode)) void coach.tally(current.song.id, r.even?.rating)
  let note = ''
  const sc = parseId(current.song.id)
  if (sc && r.mode === 'perform') {
    const stats = await store.getScales()
    const ok = passed(r)
    const before = stats[`${sc.card.form}:${sc.card.tonic}:${sc.card.hands}:${sc.card.oct}`]?.best ?? 0
    recordScale(stats, sc.card, sc.bpm, ok)
    await store.saveScales(stats)
    const s = stats[`${sc.card.form}:${sc.card.tonic}:${sc.card.hands}:${sc.card.oct}`]
    note = ok
      ? s.best > before ? `Three clean runs in a row: <b>${esc(cardName(sc.card))}</b> is solid at ${sc.bpm}.` : `A clean run, ${s.streak} of ${CLEAN_RUNS} at ${sc.bpm}.`
      : `This run did not count: ${!r.clean ? 'a missed or wrong note' : r.acc < 0.85 ? 'the timing slipped' : 'the touch was uneven'}. The count starts again.`
  }
  const worst = worstBars(r.heat)
  const next = r.mode === 'read' ? null : nextStep({ clean: r.clean, wait: game.wait, rate: game.rate, worst })
  const res = $('#res')
  if (who) note = `Judged on your part only: <b>${esc(who.you)}</b>.${who.app ? ` The app played ${esc(who.app)}.` : ''} ${note}`
  res.innerHTML = results(r, next, note)
  if (r.mode === 'learn' && r.clean && !game.loop) $('#toLib', res).insertAdjacentHTML('beforebegin', '<button class="btn" id="memTry">Try it from memory</button>')
  res.querySelector<HTMLButtonElement>('#memTry')?.addEventListener('click', () => void memorise(current!.song.id, 1))
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
