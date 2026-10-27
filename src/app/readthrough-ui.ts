// Read-through: a look at the page, then one no-stop pass at a gentle tempo.
import * as audio from '../audio'
import * as lib from '../catalog'
import type { Result } from '../game'
import { LOOK, pct, pickPiece, type RtPiece, startRate, summaryCard } from '../readthrough'
import { save, settings } from '../settings'
import { STARTERS } from '../starters'
import * as store from '../store'
import { $ } from '../ui'
import { dayKey } from '../week'
import { current, dock, game, hooks, resOpen, rt, say, setRt, staff, worstBars } from './state'
import { setZoom } from './stage'
import { fixBars, leave, openById } from './play'

const RT_LEVEL = ['Beginner', 'Beginner', 'Elementary', 'Intermediate', 'Intermediate', 'Intermediate'] // catalogue grade 1..5 to the three levels the picker knows
export const rtPieces = (): RtPiece[] => [...STARTERS.map((s) => ({ id: s.spec.id, title: s.spec.title, level: s.level })), ...lib.catalog.pieces.filter((p) => lib.local(p.id)).map((p) => ({ id: `lib:${p.id}`, title: p.title, level: RT_LEVEL[Math.min(5, lib.gradeOf(p))] }))]

/** One no-stop pass of a piece at a gentle tempo, after a look-through. No id: a new, easy piece is picked. */
export async function readThrough(id?: string) {
  audio.unlock() // the count-in starts on a timer, after the click that opened this
  const pick = pickPiece(rtPieces(), await store.allProgress())
  id ??= pick?.piece.id
  if (!id) return
  rtEnd()
  setRt({ left: LOOK, timer: 0, rate: startRate(settings.readBest), why: id === pick?.piece.id ? pick.why : '' })
  document.body.classList.add('readthru')
  await openById(id, 'perform')
  if (!current || current.song.id !== id || !rt) return rtEnd()
  // a look-through wants the page, not one bar: the staff shrinks to fit (not below 0.6) and goes back afterwards
  rt.zoom = settings.zoom
  setZoom(staff.fit(0.6, settings.zoom))
}

function rtEnd() {
  if (rt) clearInterval(rt.timer)
  if (rt?.zoom) setZoom(rt.zoom)
  setRt(undefined)
  document.body.classList.remove('readthru')
  if (staff) staff.aheadBars = 0
}

/** After every phase change: the look-through counts down on the start card, then the count-in starts by itself. */
function rtPhase() {
  const r = rt!
  if (game.phase !== 'ready') {
    clearInterval(r.timer)
    r.timer = 0
    r.left = LOOK
    return
  }
  if (game.rate !== r.rate) game.setRate(r.rate) // a reopen (thinning the notes) loads at full tempo
  staff.aheadBars = settings.readAhead ? 2 : 0
  if (!r.timer)
    r.timer = window.setInterval(() => {
      if (game.phase !== 'ready') return
      r.left = Math.max(0, r.left - 1)
      document.querySelector<HTMLElement>('#rtMeter')?.style.setProperty('--f', String(r.left / LOOK))
      const l = document.querySelector('#rtLeft')
      if (l) l.textContent = `0:${String(r.left).padStart(2, '0')}`
      if (!r.left) game.toggle()
    }, 1000)
  const q = <T extends HTMLElement>(s: string) => $('#ready').querySelector<T>(s)!
  const tempo = (d: number) => {
    game.setRate(Math.round((game.rate + d) * 20) / 20)
    r.rate = game.rate
    q('#rtRate').textContent = pct(r.rate)
  }
  q('#rtSlower').onclick = () => tempo(-0.05)
  q('#rtFaster').onclick = () => tempo(0.05)
  q('#rtGo').onclick = () => game.toggle()
  q<HTMLInputElement>('#rtAhead').onchange = (e) => {
    settings.readAhead = (e.target as HTMLInputElement).checked
    save()
    staff.aheadBars = settings.readAhead ? 2 : 0
    staff.render()
  }
}

export async function rtDone(r: Result) {
  const c = current!
  const clean = r.acc >= 0.9 && r.clean
  const prog = await store.commit(c.song.id, r.heat, undefined, clean) // into spaced review, like a Perform run
  c.heat = prog.heat
  dock.setSong(c.song, prog.heat)
  void store.markPlan(dayKey(), 'sight')
  if (r.total) void store.logHistory({ ts: Date.now(), kind: 'song', label: `Read-through: ${c.song.title}`, acc: r.acc })
  if (clean) {
    settings.readBest = Math.max(settings.readBest ?? 0, r.rate)
    save()
  }
  const worst = worstBars(r.heat)
  const next = pickPiece(rtPieces(), await store.allProgress(), c.song.id)
  const res = $('#res')
  res.innerHTML = summaryCard({ title: c.song.title, acc: r.acc, rate: r.rate, caught: r.total - r.counts.miss, total: r.total, wrong: r.wrong, heat: r.heat, bars: c.song.bars.length, worst, next })
  resOpen(true)
  res.querySelector<HTMLButtonElement>('#rtNext, #rtFix, #toLib')?.focus()
  say(`Read-through finished. ${pct(r.acc)} accuracy.`)
  const fix = res.querySelector<HTMLButtonElement>('#rtFix')
  if (fix && worst)
    fix.onclick = () => {
      rtEnd()
      void fixBars(c.song.id, worst.a, worst.b)
    }
  const nx = res.querySelector<HTMLButtonElement>('#rtNext')
  if (nx && next) nx.onclick = () => void readThrough(next.piece.id)
  $('#toLib', res).onclick = leave
}

Object.assign(hooks, { rtEnd, rtPhase })
