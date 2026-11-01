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
import { applyLayout, setZoom, ZOOM } from './stage'

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
  let at = -1
  let zoom = 0
  let ac: AbortController | undefined
  let ring: HTMLElement
  let pop: HTMLElement
  const elOf = (m: Mark) => host.querySelector<SVGGraphicsElement>(m.s !== undefined ? `.stray[data-s="${m.s}"]` : `:is(.gshape, .miss-mark)[data-id="${m.id}"]`)
  const hide = () => (ring.hidden = pop.hidden = true)

  /** Say mark `i`: ring it on the paper and put its sentence beside it. */
  const show = (i: number) => {
    at = i
    const m = marks[i]
    staff.reveal(m.bar)
    $('#markAt', res).textContent = `Mark ${i + 1} of ${marks.length}`
    for (const b of res.querySelectorAll<HTMLElement>('.marklist button')) b.toggleAttribute('aria-current', b.dataset.m === String(i))
    const e = elOf(m)
    if (!e) return hide()
    const h = host.getBoundingClientRect()
    const r = e.getBoundingClientRect()
    const [x, y] = [r.left + r.width / 2 - h.left, r.top + r.height / 2 - h.top]
    Object.assign(ring.style, { left: `${x}px`, top: `${y}px` })
    pop.textContent = markLine(m, game.song)
    pop.style.left = `${Math.max(8, Math.min(h.width - 276, x - 130))}px` // the words sit at the foot of the paper, clear of the music; the ring says which mark
    ring.hidden = pop.hidden = false
  }

  const fold = (on: boolean) => {
    hide()
    root.classList.toggle('folded', on)
    $('#review', res).setAttribute('aria-expanded', String(on))
    if (on) {
      zoom = settings.zoom
      setZoom(staff.fit(ZOOM.min, 1)) // the dock's Fit: every mark of a short piece at once
    } else if (zoom) setZoom(zoom)
    $(on ? '#unfold' : '#review', res).focus()
  }

  const step = (d: number) => show((at + d + marks.length) % marks.length)
  if (marks.length) {
    $('#review', res).onclick = () => fold(true)
    $('#unfold', res).onclick = () => fold(false)
    $('#markPrev', res).onclick = () => step(-1)
    $('#markNext', res).onclick = () => step(1)
    res.querySelector<HTMLInputElement>('#allTiming')?.addEventListener('change', (e) => play.classList.toggle('alltiming', (e.target as HTMLInputElement).checked))
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
    if (settings.view !== 'both') {
      // the card covers the falling notes: in the staff-only view they are a strip, in the falling-only view there is no paper. Both, until the card goes.
      game.reviewing = true
      applyLayout()
      highway.layout()
    }
    staff.render() // the marks of the run are drawn from the judge
    ring = Object.assign(document.createElement('div'), { className: 'selring', hidden: true })
    pop = Object.assign(document.createElement('div'), { className: 'markpop', hidden: true })
    host.append(ring, pop)
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
        if (hit >= 0) show(hit)
        else hide()
      },
      on,
    )
    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'Escape' || pop.hidden) return
        e.preventDefault() // the first Escape closes the words, as it closes a pop-up
        hide()
      },
      on,
    )
  }
  const disarm = () => {
    if (!ac) return
    ac.abort()
    ac = undefined
    ring.remove()
    pop.remove()
    play.classList.remove('alltiming')
    if (root.classList.contains('folded')) fold(false)
    if (game.reviewing) {
      game.reviewing = false
      applyLayout()
      highway.layout()
      staff.render()
    }
  }
  arm()
  const watch = new MutationObserver(() => {
    if (!root.isConnected) return disarm(), watch.disconnect()
    res.hidden ? disarm() : arm()
  })
  watch.observe(res, { attributes: true, attributeFilter: ['hidden'], childList: true })
}
