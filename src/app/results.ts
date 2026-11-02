// The end of a piece: saving the run and the results card, or handing over to the drill, calibration, read-through or memorise ending.
import { yourPart } from '../accomp'
import * as coach from '../coach'
import { dayNum } from '../drill'
import type { Result } from '../game'
import { type Next, nextStep } from '../pace'
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
import { backName, leave, onPhase } from './play'
import { memorise } from './lazy'
import { rtDone } from './readthrough-ui'
import { drillDone } from './drill'
import { calibrated } from './calibration'

/** A More menu with one item is that item, as a plain button. */
const soloMenu = (res: HTMLElement) => {
  const pop = res.querySelector('.card .row .pop')
  const items = pop?.querySelectorAll('.popmenu > button')
  if (items?.length === 1) pop!.replaceWith(items[0])
}

async function onDone(r: Result) {
  const c = current // the piece this result is for: leaving during an await below ends it
  if (!c) return
  if (drill) return drillDone()
  if (calibrating) return calibrated(r)
  if (rt) return rtDone(r)
  if (mem) return (await memorise()).memDone(r)
  if (game.hands.R === 'listen' && game.hands.L === 'listen') {
    // a listen: nothing was played, so nothing to save or score. Back to the start card with the hands yours again
    game.accomp({ R: 'play', L: 'play' }, [])
    game.setWait(true)
    game.restart()
    syncMode()
    onPhase()
    return say('Your turn: press Play, or the first note.')
  }
  const who = yourPart(game.song, game.hands, game.parts) // one part of the piece: judged, but not a run of the piece
  const lv = c.level // Notes shown above Full leaves notes out, so it is not the piece as written either: Ready asks for the piece as written
  const partial = !!who || lv > 0
  const counted = r.mode === 'perform' ? r.acc >= 0.9 && r.clean : r.clean && !game.wait
  const [ui, { marksOf }] = await Promise.all([import('../ui-results'), import('../marks')])
  const marks = marksOf(game.judge, game.song)
  // the loop takes the bars of the slips the headline names (wrong keys and misses), so the two never disagree; only a run with no slip, held up by long waits, loops on its heat
  const slips = new Array<number>(c.song.bars.length).fill(0)
  for (const m of marks) if (m.kind === 'wrong' || m.kind === 'miss') slips[m.bar]++
  const worst = worstBars(slips.some(Boolean) ? slips : r.heat, c.song.bars.length)
  const next = r.mode === 'read' ? null : nextStep({ clean: r.clean, wait: game.wait, rate: game.rate, worst })
  const prog = await store.commit(
    c.song.id,
    r.heat,
    c.song.bars.length,
    r.mode === 'perform' && !partial ? { acc: r.acc } : undefined,
    r.mode === 'read' || game.loop || partial ? undefined : r.rate >= 0.9 && counted, // Ready and the review boxes count runs near the written tempo, without waiting
    r.mode === 'read' ? undefined : r.clean ? next : null, // a clean run's pace step waits on Today's piece row (decision 6)
  )
  c.heat = prog.heat
  const marked = store.markPlan(dayKey(), c.song.id.startsWith('scale:') ? 'scale' : c.song.id.startsWith('tech:') ? 'warm' : game.loop ? 'fix' : 'piece')
  if (c.song.id.startsWith('tech:') && r.mode === 'perform') void store.saveTech((ts) => applyRun(ts, c.song.id, r, dayNum(), settings.lv))
  if (current === c) dock.setSong(c.song, prog.heat)
  if (r.touch.n >= 4) {
    const { n, mean, sd, hands, bands } = r.touch
    void store.logTouch({ ts: Date.now(), id: c.song.id, title: c.song.title, mode: r.mode, n, mean, sd, R: hands.R, L: hands.L, bands, keyTouch: settings.keyTouch })
  }
  const kind = c.song.id.startsWith('scale:') ? 'scale' : c.song.id.startsWith('tech:') ? 'tech' : 'song'
  const rv = await import('./review-ui') // the run's row in the log, and the review of its marks, load with the card
  const then = r.mode !== 'read' && r.total >= 4 ? rv.logRun(r, c.song, kind, who ? `${c.song.title}: your part` : lv ? `${c.song.title}: ${LEVELS[lv]}` : c.song.title, counted, partial) : () => {}
  if (coach.coached(c.song.id, c.song.dyn, r.mode)) void coach.tally(c.song.id, r.even?.rating)
  let note = ''
  const sc = parseId(c.song.id)
  if (sc && r.mode === 'perform') {
    const ok = passed(r, settings.lv)
    let before = 0
    const stats = await store.saveScales((st) => {
      before = st[`${sc.card.form}:${sc.card.tonic}:${sc.card.hands}:${sc.card.oct}`]?.best ?? 0
      recordScale(st, sc.card, sc.bpm, ok)
      return st
    })
    const s = stats[`${sc.card.form}:${sc.card.tonic}:${sc.card.hands}:${sc.card.oct}`]
    note = ok
      ? s.best > before ? `Three clean runs in a row: <b>${esc(cardName(sc.card))}</b> is solid at ${sc.bpm} bpm.` : `A clean run at ${sc.bpm} bpm: ${s.streak} of ${CLEAN_RUNS} in a row.`
      : `This run did not count: ${!r.clean ? 'a missed or wrong note' : r.acc < 0.85 ? 'the timing slipped' : 'the touch was uneven'}. The count starts again.`
  }
  // Continue (decision 6): after a run that was not clean, the loop of its worst bars, at most three times a day; otherwise the day's next thing
  const key = `${dayNum()}:${c.song.id}`
  if (r.clean) offers.delete(key)
  const fix = next?.kind === 'loop' ? { key: 'loop', title: next.label, sub: '' } : undefined
  const cont = await marked.then(() => hooks.next({ clean: r.clean, fix, offers: offers.get(key) ?? 0 })).catch(() => undefined) // its code did not load: Again is the lamp
  if (cont?.by === 'fix') offers.set(key, (offers.get(key) ?? 0) + 1)
  const res = $('#res')
  if (who) note = `Judged on your part only: <b>${esc(who.you)}</b>.${who.app ? ` The app played ${esc(who.app)}.` : ''} ${note}`
  if (lv) note = `Notes shown: ${LEVELS[lv]}, not the whole piece, so this run does not count toward Ready. ${note}`
  if (current !== c) return // left during the saves above: the run is recorded, the card is not wanted
  const step = cont?.by === 'fix' ? null : next // the pace step, or the loop when Continue moved on, waits in More
  res.innerHTML = ui.results(r, cont, note, backName(), { song: game.song, marks, worst, step })
  if (r.mode === 'learn' && r.clean && !game.loop) $('#resMenu', res).insertAdjacentHTML('beforeend', '<button class="btn ghost" id="memTry">Try it from memory</button>')
  res.querySelector<HTMLButtonElement>('#memTry')?.addEventListener('click', () => (then('o'), void memorise().then((m) => m.memorise(c.song.id, 1))))
  void import('./take-ui').then((t) => t.takeCard(res)).finally(() => soloMenu(res)) // Listen back and Compare with last time (loaded with the stage)
  resOpen(true)
  rv.review(res, r) // the paper keeps the run's marks; this wires the Review button and the Mark list
  res.querySelector<HTMLButtonElement>('#next, #again')?.focus({ preventScroll: true }) // the card opens at its headline, not scrolled to its buttons
  $('#again', res).onclick = () => (then('a'), game.restart())
  $('#toLib', res).onclick = () => (then('b'), leave())
  /** The pace step in place: loop the worst bars in Learn, lose the wait, or the next tempo. */
  const pace = (n: Next) => {
    if (n.kind === 'loop' && worst) {
      ;($('input[name=mode][value=learn]') as HTMLInputElement).checked = true
      game.setMode('learn')
      game.setLoop({ a: game.song.bars[worst.a].t0, b: game.song.bars[worst.b].t1 })
    } else if (n.kind === 'nowait') {
      game.setWait(false)
      game.restart()
    } else if (n.rate) {
      game.setRate(n.rate)
      game.restart()
    }
    if (n.rate && n.kind === 'loop') game.setRate(n.rate)
    resOpen(false)
    syncMode()
    onPhase()
  }
  const nb = res.querySelector<HTMLButtonElement>('#next')
  if (nb && cont) nb.onclick = () => (then('c'), cont.by === 'fix' ? pace(next!) : void cont.start())
  res.querySelector<HTMLButtonElement>('#pace')?.addEventListener('click', () => (then('o'), pace(step!)))
}

const offers = new Map<string, number>() // ponytail: in memory, so a reload starts the day's count of loop offers again; the log's rows if that matters

Object.assign(hooks, { onDone })
