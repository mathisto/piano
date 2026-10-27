import './habit.css'
import type { Level, Row, Start, State } from './grades'
import type { LadderLevel, PieceState } from './ladder'
import type { Streak } from './streak'

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** "12-day streak · 1 freeze": quiet, and absent until there is a streak to show. */
export function streakHtml(s: Streak): string {
  if (!s.n) return ''
  const f = s.freezes ? ` · ${s.freezes} ${s.freezes === 1 ? 'freeze' : 'freezes'}` : ''
  return `<span class="streak">${s.n}-day streak${f}${s.saved ? ' · a freeze covered yesterday' : ''}</span>`
}

const WORD: Record<State, string> = { new: 'Not started', learning: 'Learning', solid: 'Solid', coming: 'Coming' }

/** `data-start` carries a Start as JSON for main.ts to route. */
export const startAttr = (s: Start) => esc(JSON.stringify(s))

const reqRow = (r: Row, go: 'primary' | 'sm' | '') =>
  `<li class="rq ${r.state}"><div class="rqn"><b>${esc(r.name)}</b><span>${esc(r.detail)}</span></div>
    <div class="rqs"><span>${WORD[r.state]}</span>${r.state === 'coming' ? '' : `<div class="meter${r.state === 'solid' ? ' solid' : ''}" role="meter" aria-label="${esc(r.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(r.pct * 100)}"><i style="width:${Math.round(r.pct * 100)}%"></i></div>`}</div>
    <div class="rqa">${go && r.start ? `<button class="btn ${go}" data-start="${startAttr(r.start)}">Start</button>` : ''}</div></li>`

const PIECE: Record<PieceState, string> = { new: 'Not started', learning: 'Learning', ready: 'Ready' }

/** A level's repertoire: pieces to work towards, each with its state and a Start that opens it in Learn. */
const ladderRows = (l?: LadderLevel) =>
  l?.pieces.length
    ? `<p class="label cap">Pieces to work towards</p><ul class="rqs-list">${l.pieces
        .map(
          (x) => `<li class="rq ${x.state === 'ready' ? 'solid' : x.state}"><div class="rqn"><b>${esc(x.title)}</b><span>${esc(x.composer)} · ${esc(x.why)}</span></div>
    <div class="rqs"><span>${PIECE[x.state]}</span></div>
    <div class="rqa"><button class="btn sm" data-ladder="${esc(x.id)}" aria-label="Start ${esc(x.title)}">Start</button></div></li>`,
        )
        .join('')}</ul><p class="note ladder-msg" role="status"></p>`
    : ''

/** The Progress page's Path: five levels, the first with work left open, a Start on each level's next requirement, then its repertoire. */
export function pathSection(p: Level[], next?: Row, ladder: LadderLevel[] = []): string {
  const open = p.find((l) => l.next)?.level
  return `<h2 class="sec">Path</h2>
    <p class="note">Five levels of technical requirements, from the public graded syllabi, in our own words. A requirement is solid when its practice is. Coming means nothing trains it yet.</p>
    ${p
      .map(
        (l) => `<details class="all lvl"${l.level === open ? ' open' : ''}><summary>Level ${l.level}<span>${l.solid} of ${l.total} solid${l.coming ? ` · ${l.coming} coming` : ''}${ladder[l.level - 1]?.pieces.length ? ` · ${ladder[l.level - 1].ready} of ${ladder[l.level - 1].pieces.length} pieces ready` : ''}</span></summary>
        <ul class="rqs-list">${l.rows.map((r) => reqRow(r, r === l.next ? (r === next ? 'primary' : 'sm') : '')).join('')}</ul>${ladderRows(ladder[l.level - 1])}</details>`,
      )
      .join('')}`
}

let timer = 0

/** A quiet reminder after a long run of practice. Association only, no claim about injury. */
export function breakToast() {
  document.querySelector('.wristnote')?.remove()
  const el = document.createElement('div')
  el.className = 'wristnote'
  el.setAttribute('role', 'status')
  el.innerHTML = `<span>Stretch your wrists</span><button class="btn ghost sm">Dismiss</button>`
  const close = () => {
    clearTimeout(timer)
    el.remove()
  }
  el.querySelector('button')!.onclick = close
  document.body.append(el)
  timer = window.setTimeout(close, 90_000)
}
