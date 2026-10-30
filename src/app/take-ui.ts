// The recorder: every Perform and Learn run of a piece is kept as a take (the last three per piece), to listen back to,
// to compare bar by bar with last time, and to show as a faint ghost on the next run. The pure part is src/take.ts.
import '../take.css'
import * as audio from '../audio'
import { icon } from '../icons'
import * as store from '../store'
import { compareTakes, ghostOf, MAX_KEYS, newTake, type BarStat, type Take } from '../take'
import { $ } from '../ui'
import { calibrating, current, drill, game, mem, resOpen, rt, say, staff } from './state'

let rec: Take | null = null // the run being recorded
const held = new Map<number, number>() // pitch -> its key in `rec`, while down
let saving: Promise<Take[]> | null = null // the finished run on its way to the store
let takes: Take[] = [] // the current piece's, newest first
let takesFor = ''
let shown: Take | undefined // the take the ghost is drawn from
let ghostOn = false
try {
  ghostOn = localStorage.getItem('piano.ghost') === '1'
} catch {
  /* private mode: off */
}
let stopListen: (() => void) | null = null

const plain = () => !!current && !drill && !calibrating && !rt && !mem && game.mode !== 'read' // a piece, not a drill or a special run
const now = () => Math.round(game.t * 1000 - game.offset * game.rate) // the run's end, on the clock the presses are on

/** A new take; a pedal already down is its first change. */
const fresh = (mode: Take['mode'], n: number): Take => Object.assign(newTake(mode, game.rate, game.wait, n), game.pedal && { ped: [Math.round(game.t * 1000)] })

game.on((e) => {
  if (e.type === 'press' && stopListen) stopListen() // a key on the piano stops a listen-back
  if (e.type === 'phase') {
    if (e.phase === 'ready') (rec = null), held.clear()
    else if (!rec && (e.phase === 'countin' || e.phase === 'playing') && plain()) rec = fresh(game.mode === 'perform' ? 'perform' : 'learn', game.song.notes.length)
    return
  }
  if (!rec) return
  if (e.type === 'done') {
    for (const j of held.values()) rec.d[j] = Math.max(0, now() - rec.t[j])
    Object.assign(rec, { acc: e.result.acc, clean: e.result.clean, rate: e.result.rate })
    if (plain() && rec.p.length) saving = store.addTake(current!.song.id, rec)
    rec = null
    held.clear()
  } else if (e.type === 'pedal') (rec.ped ??= []).push(Math.round(e.t * 1000)) // even paused: the changes must alternate
  else if (game.phase === 'paused') return
  else if (e.type === 'loop') rec = fresh(rec.mode, rec.n) // a looped stretch is practice, not a run: keep only the pass that runs on
  else if (e.type === 'press' && rec.p.length < MAX_KEYS) {
    held.set(e.p, rec.p.push(e.p) - 1)
    rec.v.push(Math.max(1, Math.round(e.vel * 127)))
    rec.t.push(Math.round(e.t * 1000))
    rec.d.push(0)
    rec.i.push(-1)
  } else if ((e.type === 'hit' || e.type === 'ok') && held.has(e.note.p)) rec.i[held.get(e.note.p)!] = e.note.id
  else if (e.type === 'release' && held.has(e.p)) {
    const j = held.get(e.p)!
    rec.d[j] = Math.max(0, Math.round(e.t * 1000) - rec.t[j])
    held.delete(e.p)
  } else if (e.type === 'miss') rec.miss.push(e.note.id)
})

/** The start card was drawn: load this piece's takes, draw or clear the ghost, and offer the switch once there is a last run. */
async function sync() {
  const id = plain() ? current!.song.id : ''
  if (id !== takesFor) {
    takesFor = id
    takes = id ? await store.getTakes(id) : []
    if (takesFor !== id) return // another piece opened meanwhile
  }
  const want = ghostOn && id ? takes[0] : undefined
  if (want !== shown) {
    shown = want
    game.ghost = want ? ghostOf(want, game.song) : null
    staff.render()
  }
  const card = $('#ready')
  if (!id || !takes.length || game.phase !== 'ready' || card.querySelector('#ghostOn')) return
  const sw = `<label class="switch ghostsw" title="Your last run, faintly, on the staff and the falling notes"><input type="checkbox" id="ghostOn"${ghostOn ? ' checked' : ''}><i></i>Ghost of last run</label>`
  const report = card.querySelector('a.report')
  if (report) report.insertAdjacentHTML('beforebegin', sw)
  else card.insertAdjacentHTML('beforeend', sw)
  $('#ghostOn', card).onchange = (e) => {
    ghostOn = (e.target as HTMLInputElement).checked
    try {
      localStorage.setItem('piano.ghost', ghostOn ? '1' : '0')
    } catch {
      /* private mode: for this visit only */
    }
    void sync()
  }
}
new MutationObserver(() => void sync()).observe($('#ready'), { childList: true })

/** The listen-back's way to the piano; dev builds hand it to the e2e checks, which count the notes through it. */
export const sink = { on: audio.noteOn, off: audio.keyUp, pedal: audio.sustain }
if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__take = { sink, takes: () => takes }

/** Play a take through the app's piano at its own timing and touch, the staff cursor following. Any key, tap or Escape stops it. */
function listen(k: Take, back: HTMLElement, label: string) {
  stopListen?.()
  if (!k.p.length) return
  audio.unlock()
  const from = Math.min(...k.t) - 600 // a breath before the first note
  const end = Math.max(...k.t.map((t, j) => t + k.d[j]))
  const t0 = game.t
  const start = performance.now()
  const timers = k.p.flatMap((p, j) => {
    const at = (k.t[j] - from) / k.rate
    return [setTimeout(() => sink.on(p, k.v[j] / 127, true), at), setTimeout(() => sink.off(p), at + k.d[j] / k.rate)]
  })
  k.ped?.forEach((t, j) => timers.push(setTimeout(() => sink.pedal(j % 2 === 0), (t - from) / k.rate))) // the pedal as you used it: a key let go under it rings on
  timers.push(setTimeout(() => stopListen?.(), (end - from) / k.rate + 500))
  let raf = 0
  const follow = () => {
    game.seek((from + (performance.now() - start) * k.rate) / 1000)
    raf = requestAnimationFrame(follow)
  }
  const bar = document.createElement('div')
  bar.className = 'takebar'
  bar.innerHTML = `<b>${label}</b><small>Any key stops</small><button class="btn sm" type="button">${icon('x')}Stop</button>`
  const key = (e: Event) => {
    e.preventDefault()
    e.stopImmediatePropagation() // Escape would leave the piece, Space would start it again
    stopListen?.()
  }
  const tap = () => stopListen?.()
  stopListen = () => {
    stopListen = null
    timers.forEach(clearTimeout)
    cancelAnimationFrame(raf)
    sink.pedal(false)
    for (const p of new Set(k.p)) sink.off(p)
    game.seek(t0)
    bar.remove()
    removeEventListener('keydown', key, true)
    removeEventListener('pointerdown', tap, true)
    resOpen(true)
    back.focus()
  }
  resOpen(false)
  $('#stage').append(bar)
  addEventListener('keydown', key, true)
  addEventListener('pointerdown', tap, true)
  say(`${label}. Any key stops.`)
  follow()
}

const ms = (o: number) => (Math.abs(o) < 5 ? 'on the beat' : `${Math.round(Math.abs(o))} ms ${o < 0 ? 'early' : 'late'}`)
const list = (bars: number[]) => (bars.length > 1 ? `bars ${bars.slice(0, -1).join(', ')} and ${bars[bars.length - 1]}` : `bar ${bars[0]}`)

/** This run and last time, bar by bar: right keys as two thin columns per bar, timing as two ticks about the beat. */
function compareHtml(k: Take, last: Take): string {
  const c = compareTakes(game.song, k, last)
  const when = (t: Take) => `${t.mode === 'perform' ? 'Perform' : 'Learn'}${t.rate < 1 ? ` at ${Math.round(t.rate * 100)}%` : ''}`
  const legend = `<div class="cmp-key"><span><i class="last"></i>Last time, ${when(last)}</span><span><i class="now"></i>This run, ${when(k)}</span></div>`
  if (!c) return `${legend}<p class="line">Last time showed a different set of notes, so the bars cannot be lined up. You can still hear it.</p>`
  const W = 12
  const up: number[] = []
  const down: number[] = []
  let acc = ''
  let tim = ''
  c.bars.forEach(([a, b], i) => {
    const x = i * W
    const d = a.acc !== null && b.acc !== null ? a.acc - b.acc : 0
    if (d >= 0.15) up.push(i + 1)
    if (d <= -0.15) down.push(i + 1)
    const col = (s: BarStat, cls: string, dx: number) => (s.acc === null ? '' : `<rect class="${cls}" x="${x + dx}" y="${40 - Math.max(2, s.acc * 40)}" width="4" height="${Math.max(2, s.acc * 40)}"/>`)
    acc += col(b, 'last', 1.5) + col(a, d >= 0.15 ? 'now up' : d <= -0.15 ? 'now down' : 'now', 6.5)
    const tick = (s: BarStat, cls: string, dx: number) => {
      if (s.off === null) return ''
      const h = (Math.max(-150, Math.min(150, s.off)) / 150) * 18
      return `<rect class="${cls}" x="${x + dx}" y="${20 - Math.max(h, 0) - 0.75}" width="4" height="${Math.abs(h) + 1.5}"/>`
    }
    tim += tick(b, 'last', 1.5) + tick(a, 'now', 6.5)
  })
  const w = c.bars.length * W
  const [na, la] = c.all
  const said = [
    up.length ? `More right in ${list(up)}.` : '',
    down.length ? `Fewer right in ${list(down)}.` : '',
    !up.length && !down.length ? 'Bar by bar, much as last time.' : '',
    na.off !== null && la.off !== null ? `On average ${ms(na.off)}; last time ${ms(la.off)}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
  const timing = tim ? `<span class="cap">Timing<small>late above</small></span><svg viewBox="0 0 ${w} 40" preserveAspectRatio="none" role="img" aria-label="Mean timing per bar, late above the line, early below"><line x1="0" x2="${w}" y1="20" y2="20"/>${tim}</svg>` : ''
  return `${legend}<div class="cmp-grid"><span class="cap">Right keys</span><svg viewBox="0 0 ${w} 40" preserveAspectRatio="none" role="img" aria-label="Share of right keys per bar">${acc}</svg>${timing}<span></span><div class="cmp-bars"><small>Bar 1</small><small>Bar ${c.bars.length}</small></div></div><p class="line">${said}</p>`
}

/** The results card of a piece: Listen back, and once there is a run before it, Compare with last time. */
export async function takeCard(res: HTMLElement) {
  const ks = await saving
  saving = null
  const card = res.querySelector('.card')
  if (!ks || !card || !current) return
  takes = ks
  takesFor = current.song.id
  const [k, last] = ks
  card.querySelector('#toLib')?.insertAdjacentHTML('beforebegin', `<button class="btn" id="listenBack" type="button">${icon('play')}Listen back</button>${last ? '<button class="btn" id="cmpBtn" type="button" aria-expanded="false">Compare with last time</button>' : ''}`)
  const lb = $('#listenBack', card) as HTMLButtonElement
  lb.onclick = () => listen(k, lb, 'Listening back')
  const cb = card.querySelector<HTMLButtonElement>('#cmpBtn')
  if (cb)
    cb.onclick = () => {
      const open = card.querySelector('.cmp')
      cb.setAttribute('aria-expanded', String(!open))
      if (open) return open.remove()
      card.querySelector('.row')!.insertAdjacentHTML('beforebegin', `<section class="cmp" aria-label="Compared with last time">${compareHtml(k, last)}<button class="btn sm" id="hearLast" type="button">${icon('play')}Hear last time</button></section>`)
      card.querySelector('.cmp')!.scrollIntoView({ block: 'nearest' })
      const hb = $('#hearLast', card) as HTMLButtonElement
      hb.onclick = () => listen(last, hb, 'Last time')
    }
}
