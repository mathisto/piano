import { keyName, type Card } from './scales'
import { icon } from './icons'
import type { CoverMeta } from './cover'
import { noteName } from './spell'
import { settings, KEY_TOUCH } from './settings'
import type { Progress, Stored } from './store'
import { type Song } from './song'
import type { Starter } from './starters'
import { type RunSpec } from './run'
import { streakHtml } from './habit-ui'
import type { Next } from './pace'
import type { Start } from './grades'
import type { PlanMin } from './plan'
import type { Guide } from './guide'
import type { Streak } from './streak'
import { esc, focusKey } from './util'

export const $ = <T extends HTMLElement>(s: string, root: ParentNode = document) => root.querySelector(s) as T

/** Redraw part of the page without dropping keyboard or VoiceOver focus: the control that had it gets it back in the new markup. */
export function keepFocus<T>(root: Element, render: () => T): T {
  const a = document.activeElement as HTMLInputElement | null
  const key = a && a !== root && root.contains(a) ? focusKey(a) : ''
  const back = () => key && !root.contains(document.activeElement) && root.querySelector<HTMLElement>(key)?.focus({ preventScroll: true })
  const out = render()
  if (out instanceof Promise) out.then(back, () => {}) // the caller handles a failure
  else back()
  return out
}

export function skeleton(app: HTMLElement) {
  app.innerHTML = `
  <header class="bar">
    <button class="brand" id="brand" aria-label="Piano Forte: Today"><svg viewBox="160 362 704 360" width="36" height="18" fill="currentColor" aria-hidden="true"><path d="M168 612 C240 290 784 290 856 612 C751 480 649 424 512 424 C375 424 273 480 168 612 Z"/><circle cx="512" cy="638" r="76"/></svg><span class="wordmark" aria-hidden="true">Piano Forte</span></button>
    <button class="btn ghost" id="stagesBtn" hidden>${icon('back')}<span></span></button>
    <nav class="seg" id="nav" aria-label="Sections">
      ${(['today', 'songs', 'read', 'scales', 'theory', 'technique', 'progress'] as const).map((v, i) => `<label><input type="radio" name="nav" value="${v}"${i ? '' : ' checked'}><span>${icon(v)}<em>${v[0].toUpperCase() + v.slice(1)}</em></span></label>`).join('')}
    </nav>
    <div class="song-title" id="title" role="heading" aria-level="1"></div>
    <div class="seg" id="modeSeg" hidden role="radiogroup" aria-label="Mode">
      <label><input type="radio" name="mode" value="perform"><span>Perform</span></label>
      <label><input type="radio" name="mode" value="learn"><span>Learn</span></label>
    </div>
    <div class="spacer"></div>
    <div class="hud" id="hud" hidden>
      <div data-m="perform" role="group" aria-label="Accuracy" title="Accuracy"><small>Accuracy</small><b id="hScore">—</b></div>
      <div data-m="perform" class="combo" role="group" aria-label="In a row" title="Notes in a row"><small>In a row</small><b id="hCombo">0</b></div>
      <div data-m="read" data-run="all" class="combo" role="group" aria-label="In a row" title="Cards in a row"><small>In a row</small><b id="rStreak">0</b></div>
      <div data-m="read" role="group" aria-label="Cards" title="Cards"><small>Cards</small><b id="hCards">0/0</b></div>
    </div>
    <span class="pop"><button class="chip" id="dev" data-more aria-expanded="false" aria-controls="kbMenu"><span class="dot"></span>${icon('keyboard')}<span id="devName">No keyboard</span></button><div class="popmenu end kbmenu" id="kbMenu" role="group" aria-label="Keyboard" hidden></div></span>
    <button class="btn icon ghost" id="settingsBtn" aria-label="Settings" aria-expanded="false" aria-controls="drawer">${icon('sliders')}</button>
  </header>
  <dialog id="tracks" class="sheet" aria-label="Options"></dialog>
  <dialog id="credits" class="sheet" aria-label="Credits"></dialog>
  <dialog id="setup" class="sheet" aria-label="Set up"></dialog>
  <dialog id="help" class="sheet" aria-label="Help"><header><h2>Help</h2><button class="btn icon ghost" data-close aria-label="Close">${icon('x')}</button></header><div class="body helpbody" tabindex="0"></div></dialog>
  <main id="main" style="display:grid;min-height:0">
    <section id="today" class="view on" aria-label="Today"></section>
    <section id="library" class="view" aria-label="Songs"></section>
    <section id="read" class="view" aria-label="Read"></section>
    <section id="scales" class="view" aria-label="Scales"></section>
    <section id="theory" class="view" aria-label="Theory"></section>
    <section id="technique" class="view" aria-label="Technique"></section>
    <section id="progress" class="view" aria-label="Progress"></section>
    <section id="play" class="view" aria-label="Play">
      <div id="beatBar" class="beat-bar" aria-hidden="true" hidden></div>
      <div id="staff"></div>
      <div id="split" role="separator" aria-orientation="horizontal" aria-label="Resize sheet music and falling notes" aria-valuemin="0" aria-valuemax="100" tabindex="0" hidden></div>
      <div id="stage">
        <div id="judge" aria-hidden="true"></div>
        <div class="stagecol"><div id="banner" role="status"></div><div id="ready" class="ready" hidden></div></div>
        <div id="count" class="countin" hidden aria-hidden="true"></div>
        <div id="paused" class="paused" hidden aria-hidden="true">Paused</div>
        <div id="res" hidden></div>
        <div id="live" class="sr-only" aria-live="polite" style="position:absolute;left:-9999px"></div>
      </div>
      <div id="dock"></div>
      <div id="chord" class="chord" hidden aria-hidden="true"><b></b><small></small></div>
    </section>
  </main>
  <div id="drawer" class="drawer" hidden role="dialog" aria-modal="true" aria-label="Settings"></div>`
}

// ---------- library ----------

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`

export interface Row {
  id: string
  title: string
  sub: string
  bars: number
  len: number
  prog?: Progress
  user: boolean
  cover: CoverMeta
  cont?: boolean // the one row to carry the lamp: where to go next
  tracks?: boolean // a multi-track MIDI file whose tracks can be chosen
}

export function starterRows(starts: Starter[], songs: Song[], prog: Map<string, Progress>, meta: (s: Starter) => CoverMeta): Row[] {
  return starts.map((s, i) => ({
    id: s.spec.id,
    title: s.spec.title,
    sub: `${s.by} · ${s.level}`,
    bars: songs[i].bars.length,
    len: songs[i].end,
    prog: prog.get(s.spec.id),
    user: false,
    cover: meta(s),
  }))
}

export function userRows(stored: Stored[], prog: Map<string, Progress>, lens: Map<string, { bars: number; len: number; tracks?: { all: number; used: number } }>, meta: (s: Stored) => CoverMeta): Row[] {
  return stored.map((s) => ({
    id: s.id,
    title: s.title,
    sub: new Date(s.added).toLocaleDateString() + ((lens.get(s.id)?.tracks?.all ?? 0) > 1 ? ` · ${lens.get(s.id)!.tracks!.used} of ${lens.get(s.id)!.tracks!.all} tracks` : ''),
    tracks: true,
    bars: lens.get(s.id)?.bars ?? 0,
    len: lens.get(s.id)?.len ?? 0,
    prog: prog.get(s.id),
    user: true,
    cover: meta(s),
  }))
}



// Two tiers: the fill climbs to Solid in Ink Soft; past Solid, a second fill in Ink climbs to Fluent over it.
export const meter = (pct: number, solid: boolean, label: string, fluent?: number) =>
  `<div class="meter${solid ? (fluent === undefined ? ' solid' : ' tier') : ''}" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct * 100)}"${solid && fluent !== undefined ? ` aria-valuetext="Solid, ${Math.round(fluent * 100)}% fluent"` : ''}><i style="width:${Math.round(pct * 100)}%"></i>${solid && fluent !== undefined ? `<i class="fl" style="width:${Math.round(fluent * 100)}%"></i>` : ''}</div>`
export const CLEFS = { treble: 'Treble', bass: 'Bass', grand: 'Grand staff' } as const
export const FREE = 'Free, no subscription, no ads, no account.'
export const KEY_TOUCH_HINT = "Match your keyboard's own key touch setting. Each run is labelled with it. On Fixed every note arrives equally loud, so evenness is not judged." // it is only logged, and Fixed silences evenness (coach.ts)
export const keyTouchSelect = (id: string) => `<select id="${id}" aria-label="Key touch">${KEY_TOUCH.map((k) => `<option${k === settings.keyTouch ? ' selected' : ''}>${k}</option>`).join('')}</select>`

export const head = (title: string, actions = '', lede = '') =>
  `<div class="lib-head"><h1>${title}</h1>${lede ? `<p>${lede}</p>` : ''}${actions ? `<div class="head-actions">${actions}</div>` : ''}</div>`



/** The actions past the first few, behind one ⋯ button: a song row's other ways in, Settings' Data, a file's Options (main.ts opens and closes it). */
let menus = 0
export const rowMenu = (title: string, items: string, id = `rm${++menus}`) =>
  `<button class="btn ghost icon" data-more aria-label="More for ${esc(title)}" aria-expanded="false" aria-controls="${id}">${icon('more')}</button><div class="popmenu rowmenu" id="${id}" role="group" aria-label="${esc(title)}" hidden>${items}</div>`

/** A line of plain words at the top of a page, with an optional button: what is wrong and what can be done about it. */
export const notice = (text: string, action = '', cls = '') => `<p class="notice${cls}" role="status"><span>${esc(text)}</span>${action}</p>`




// ---------- settings ----------





export const CAL_NOTES = 10

/** A plan row that starts something through the same route as the Path: a title, a line and what to start. */
interface Go {
  title: string
  sub: string
  start: Start
}

export interface TodayData {
  guide?: Guide | null // the first-week card
  last: { id: string; title: string; sub: string; first: boolean; cover: string; pace?: Next } // cover: the piece's lead cover, as HTML; pace: the step its last clean run left
  again?: { id: string; title: string; sub: string } // a piece whose spaced review is due
  read: { id: string; name: string; pct: number; line: string; due?: number }
  tech: string
  techDue: boolean
  techId: string
  fix?: { id: string; title: string; a: number; b: number } // the worst bars of the piece played last
  review?: { name: string; id: string; line: string; due: number } // a second reading stage, for the longest plan
  sight?: { id: string; title: string; sub: string } // a new, easy piece to read through without stopping
  week: { days: { key: string; label: string; played: boolean; today: boolean }[]; minutes: number }
  goal: number
  planMin: PlanMin
  streak: Streak
  scale?: Go & { pct: number } // the next Scales stage, for the longer plans
  theory?: Go & { due: number } // a Theory session with cards due
  path?: Go // the next requirement on the Path, when Today has no row of its own for it
  done: string[] // steps finished today
  recap?: { minutes: number; played: number; suggest: number; better?: string } // last week, shown early in the week
}

export const weekBlock = (w: TodayData['week'], goal: number, streak?: Streak) => `
  <div class="week" role="img" aria-label="${w.days.filter((d) => d.played).length} days practised this week, ${w.minutes} of ${goal} minutes">
    ${w.days.map((d) => `<span class="day${d.played ? ' on' : ''}${d.today ? ' today' : ''}"><i></i>${d.label}</span>`).join('')}
  </div>
  <div class="goal"><div class="meter${w.minutes >= goal ? ' solid' : ''}"><i style="width:${Math.min(100, Math.round((w.minutes / goal) * 100))}%"></i></div><span><b>${w.minutes}</b> of ${goal} min</span></div>${streak ? streakHtml(streak) : ''}`

export const RUN_START: Record<RunSpec['clef'], [number, number]> = { treble: [60, 72], bass: [48, 60], grand: [43, 77] }
export const runTitle = (s: RunSpec) => `${CLEFS[s.clef]} ${noteName(s.lo, s.fifths)} to ${noteName(s.hi, s.fifths)}${s.size === 2 ? ', intervals' : s.size === 3 ? ', triads' : ''}`
export const HANDS = { R: 'Right hand', L: 'Left hand', both: 'Hands together', contrary: 'Contrary motion' } as const
export const cardName = (c: Card) => `${keyName(c.tonic, c.form)}, ${HANDS[c.hands].toLowerCase()}, ${c.oct === 1 ? 'one octave' : 'two octaves'}`

