// The review of a finished run, on the score itself: the results card covers the falling notes only, the paper above keeps the run's marks,
// the Review button folds the card to a bar and fits the whole piece, a tap on a mark (or a row of the Mark list) says what it is.
// Loaded with the results card, never at boot.
import type { Result } from '../game'
import { marksOf, markLine, rightOf, type Mark } from '../marks'
import { passed } from '../scales'
import { settings } from '../settings'
import type { Song } from '../song'
import { type HistoryEntry, edit, logHistory } from '../store'
import { goodRun } from '../syllabus'
import { $ } from '../ui'
import { game, say, staff, highway } from './state'
import { applyLayout, ZOOM } from './stage'

const TAP = 30 // px from a mark's middle that still counts as a tap on it

/** The run's row in the attempt log (HistoryEntry in store.ts). Returns what to call with 'a' (Again) or 'b' (Back) to say what the player did next. */
export function logRun(r: Result, song: Song, kind: HistoryEntry['kind'], label: string, counted: boolean, partial: boolean) {
  const ts = Date.now()
  const n = r.offs.length
  const mean = r.offs.reduce((a, b) => a + b, 0) / n
  void logHistory({ ts, kind, label, acc: r.first >= 0 ? r.first : r.acc, even: r.even?.inside, bias: r.timing?.bias, id: kind === 'song' ? `song:${song.id}` : song.id, notes: rightOf(r) / (r.total + game.judge.extra), ok: kind === 'scale' ? passed(r) : kind === 'tech' ? goodRun(r) : counted, as: r.mode === 'learn' || partial ? 1 : undefined, rate: r.rate, sp: r.first < 0 && n >= 8 ? Math.round(Math.sqrt(r.offs.reduce((a, o) => a + (o - mean) ** 2, 0) / n)) : undefined })
  return (then: 'a' | 'b') => void edit<HistoryEntry[]>('history:log', [], (l) => l.map((e) => (e.ts === ts ? { ...e, then } : e)))
}

export function review(res: HTMLElement, r: Result) {
  say(`Finished. ${rightOf(r)} of ${r.total} notes right.`)
  const root = $('.results', res)
  const host = $('#staff')
  const play = $('#play')
  const marks = marksOf(game.judge, game.song)
  const slip = marks.find((m) => m.kind === 'wrong' || m.kind === 'miss') ?? marks[0]
  let at = -1
  let zoom = 0
  let ac: AbortController | undefined
  let ring: HTMLElement
  const folded = () => root.classList.contains('folded')
  const elOf = (m: Mark) => host.querySelector<SVGGraphicsElement>(m.s !== undefined ? `.stray[data-s="${m.s}"]` : `:is(.gshape, .miss-mark)[data-id="${m.id}"]`)
  const hide = () => (ring.hidden = true)

  /** Ring mark `at` on the paper; its sentence is the review bar's, or the Mark list's current row: words never go over the music. */
  const place = () => {
    const e = at >= 0 && elOf(marks[at])
    if (!e) return hide()
    const h = host.getBoundingClientRect()
    const b = e.getBoundingClientRect()
    Object.assign(ring.style, { left: `${b.left + b.width / 2 - h.left}px`, top: `${b.top + b.height / 2 - h.top}px` })
    ring.hidden = false
  }
  const show = (i: number) => {
    at = i
    staff.reveal(marks[i].bar)
    $('#markAt', res).textContent = `${i + 1} of ${marks.length}`
    $('#markSay', res).textContent = markLine(marks[i], game.song)
    for (const b of res.querySelectorAll<HTMLElement>('.marklist button')) b.toggleAttribute('aria-current', b.dataset.m === String(i))
    place()
  }

  /** Two layouts while the card is up: both panes, the card over the falling notes; folded, the paper alone with the bar over a strip of keys. */
  const view = (v: 'both' | 'sheet') => {
    game.reviewing = v
    applyLayout()
    highway.layout()
  }
  const fold = (on: boolean) => {
    hide()
    root.classList.toggle('folded', on)
    $('#review', res).setAttribute('aria-expanded', String(on))
    view(on ? 'sheet' : 'both')
    if (on) {
      zoom = settings.zoom
      game.seek(game.song.bars[0].t0) // from bar 1: the whole of a short piece at once, the start of a long one
      settings.zoom = staff.fit(ZOOM.min, 1) // the dock's Fit, for the review only: not saved, put back on Results
    } else settings.zoom = zoom
    staff.render()
    if (on && slip) show(at >= 0 ? at : marks.indexOf(slip))
    $(on ? '#unfold' : '#review', res).focus()
  }

  const step = (d: number) => show((at + d + marks.length) % marks.length)
  if (marks.length) {
    $('#review', res).onclick = () => fold(true)
    $('#unfold', res).onclick = () => fold(false)
    $('#markPrev', res).onclick = () => step(-1)
    $('#markNext', res).onclick = () => step(1)
    res.querySelector<HTMLInputElement>('#allTiming')?.addEventListener('change', (e) => play.classList.toggle('alltiming', (e.target as HTMLInputElement).checked))
    for (const d of res.querySelectorAll('.reviewrow details')) d.addEventListener('toggle', () => (d as HTMLDetailsElement).open && d.scrollIntoView({ block: 'nearest' })) // an opened list is not left under the footer
    $('.marklist', res).addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('button[data-m]')
      if (b) show(Number(b.dataset.m))
    })
  }

  // armed while the card is up; Listen back hides the card for a while and the view goes back, then returns with it
  const arm = () => {
    if (ac) return
    ac = new AbortController()
    const on = { signal: ac.signal }
    view('both') // the card covers the falling notes: in the staff-only view they are a strip, in the falling-only view there is no paper
    if (slip) staff.reveal(slip.bar) // the paper opens on the first slip, not on the last bar played
    staff.render() // the marks of the run are drawn from the judge
    ring = Object.assign(document.createElement('div'), { className: 'selring', hidden: true })
    host.append(ring)
    const ro = new ResizeObserver(() => !ring.hidden && place()) // a turn of the iPad moves the music under the ring
    ro.observe(host)
    ac.signal.addEventListener('abort', () => ro.disconnect())
    host.addEventListener(
      'click',
      (e) => {
        let best = TAP
        let hit = -1
        marks.forEach((m, i) => {
          const r = elOf(m)?.getBoundingClientRect()
          const d = r ? Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) : Infinity
          if (d < best) [best, hit] = [d, i]
        })
        if (hit < 0) return hide()
        if (!folded()) fold(true) // a tap on a mark is a way into Review
        show(hit)
      },
      on,
    )
    document.addEventListener(
      'keydown',
      (e) => {
        const t = e.target as HTMLElement
        if (e.defaultPrevented || (/INPUT|SELECT|TEXTAREA/.test(t.tagName) && !/checkbox|radio/.test((t as HTMLInputElement).type)) || t.id === 'split') return // a switch in the bar is not typing
        if (e.key === 'Escape' && (!ring.hidden || folded())) ring.hidden ? fold(false) : hide() // the ring first, then back to the card, as a pop-up closes before the page
        else if (folded() && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) step(e.key === 'ArrowLeft' ? -1 : 1)
        else return
        e.preventDefault()
      },
      on,
    )
  }
  const disarm = () => {
    if (!ac) return
    ac.abort()
    ac = undefined
    ring.remove()
    play.classList.remove('alltiming')
    if (folded()) fold(false)
    game.reviewing = false
    applyLayout()
    highway.layout()
    staff.render()
  }
  arm()
  const watch = new MutationObserver(() => {
    if (!root.isConnected) return disarm(), watch.disconnect()
    res.hidden ? disarm() : arm()
  })
  watch.observe(res, { attributes: true, attributeFilter: ['hidden'], childList: true })
}
