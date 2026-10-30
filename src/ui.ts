import { keyName, type Card } from './scales'
import { memTag } from './memory'
import { loadState } from './audio'
import { INSTRUMENTS, instrument } from './instruments'
import { inBundle } from './catalog'
import { icon } from './icons'
import type { Input } from './midi'
import { noteName } from './spell'
import { settings, KEY_TOUCH } from './settings'
import type { Progress, Stored } from './store'
import { type Song } from './song'
import type { Starter } from './starters'
import { type RunSpec } from './run'
import { startAttr, streakHtml } from './habit-ui'
import type { Start } from './grades'
import { PLAN_LENGTHS, planOf, type PlanMin } from './plan'
import { guideCard, HELP, tabNote, type Guide } from './guide'
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
    <button class="brand" id="brand" aria-label="Piano Forte: Today"><svg viewBox="9 9 48 36" width="40" height="30" fill="currentColor" aria-hidden="true"><rect x="10" y="10" width="8" height="34" rx="2"/><rect x="10" y="10" width="20" height="8" rx="2"/><rect x="24" y="10" width="8" height="22" rx="2"/><rect x="10" y="24" width="22" height="8" rx="2"/><rect x="38" y="10" width="8" height="34" rx="2"/><rect x="38" y="10" width="18" height="8" rx="2"/><rect x="38" y="24" width="14" height="8" rx="2"/></svg></button>
    <div class="seg" id="nav" role="radiogroup" aria-label="Section">
      <label><input type="radio" name="nav" value="today" checked><span>Today</span></label>
      <label><input type="radio" name="nav" value="songs"><span>Songs</span></label>
      <label><input type="radio" name="nav" value="read"><span>Read</span></label>
      <label><input type="radio" name="nav" value="scales"><span>Scales</span></label>
      <label><input type="radio" name="nav" value="theory"><span>Theory</span></label>
      <label><input type="radio" name="nav" value="technique"><span>Technique</span></label>
      <label><input type="radio" name="nav" value="progress"><span>Progress</span></label>
    </div>
    <div class="song-title" id="title" role="heading" aria-level="1"></div>
    <button class="btn" id="stagesBtn" hidden>All stages</button>
    <div class="seg" id="modeSeg" hidden role="radiogroup" aria-label="Mode">
      <label><input type="radio" name="mode" value="perform"><span>Perform</span></label>
      <label><input type="radio" name="mode" value="learn"><span>Learn</span></label>
    </div>
    <div class="spacer"></div>
    <div class="hud" id="hud" hidden>
      <div data-m="perform" role="group" aria-label="Accuracy" title="Accuracy"><small>Accuracy</small><b id="hScore">—</b></div>
      <div data-m="perform" class="combo" role="group" aria-label="In a row" title="Notes in a row"><small>In a row</small><b id="hCombo">0</b></div>
      <div data-m="read" data-run="all" class="combo" role="group" aria-label="Run streak" title="Streak"><small>Streak</small><b id="rStreak">0</b></div>
      <div data-m="read" role="group" aria-label="Cards" title="Cards"><small>Cards</small><b id="hCards">0/0</b></div>
    </div>
    <button class="chip" id="dev"><span class="dot"></span><span id="devName">No keyboard</span></button>
    <button class="btn icon ghost" id="settingsBtn" aria-label="Settings" aria-expanded="false" aria-controls="drawer">${icon('sliders')}</button>
  </header>
  <dialog id="tracks" class="sheet" aria-label="Options"></dialog>
  <dialog id="credits" class="sheet" aria-label="Credits"></dialog>
  <dialog id="setup" class="sheet" aria-label="Set up"></dialog>
  <dialog id="help" class="sheet" aria-label="Help">${HELP}
  </dialog>
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
      <div id="staff"><div class="zoomc" role="group" aria-label="Staff size"><span class="zgrip" id="zoomGrip" aria-hidden="true">${icon('grip')}</span><button class="btn icon sm" id="zoomFit" aria-label="Fit the whole piece" title="Fit the whole piece">${icon('page')}</button><button class="btn icon sm" id="zoomOut" aria-label="Smaller staff, more bars">${icon('minus')}</button><button class="btn icon sm" id="zoomIn" aria-label="Larger staff, fewer bars">${icon('plus')}</button></div></div>
      <div id="split" role="separator" aria-orientation="horizontal" aria-label="Resize sheet music and falling notes" aria-valuemin="0" aria-valuemax="100" tabindex="0" hidden></div>
      <div id="stage">
        <div id="judge" aria-hidden="true"></div>
        <div id="banner"></div>
        <div id="ready" class="ready" hidden></div>
        <div id="count" class="countin" hidden aria-hidden="true"></div>
        <div id="res" hidden></div>
        <div id="live" class="sr-only" aria-live="polite" style="position:absolute;left:-9999px"></div>
      </div>
      <div id="dock"></div>
      <div id="chord" class="chord" hidden aria-hidden="true"><b></b><small></small></div>
    </section>
  </main>
  <aside id="drawer" class="drawer" hidden aria-label="Settings"></aside>`
}

// ---------- library ----------

/** The cover for a starter or a bundled open-library piece; your own files and the corpus have none and keep the mini-staff. */
export const art = (id: string, cls = 'art') =>
  id.startsWith('starter-') || (id.startsWith('lib:') && inBundle(id.slice(4))) ? `<img class="${cls}" src="${import.meta.env.BASE_URL}art/${id.replace('lib:', '')}.webp" alt="" width="600" height="400" decoding="async">` : ''

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`

export interface Row {
  id: string
  title: string
  sub: string
  bars: number
  len: number
  prog?: Progress
  user: boolean
  thumb: string
  cont?: boolean // the one row to carry the lamp: where to go next
  tracks?: boolean // a multi-track MIDI file whose tracks can be chosen
}

export function starterRows(starts: Starter[], songs: Song[], prog: Map<string, Progress>, thumbs: Map<string, string>): Row[] {
  return starts.map((s, i) => ({
    id: s.spec.id,
    title: s.spec.title,
    sub: `${s.by} · ${s.level}`,
    bars: songs[i].bars.length,
    len: songs[i].end,
    prog: prog.get(s.spec.id),
    user: false,
    thumb: thumbs.get(s.spec.id) ?? '',
  }))
}

export function userRows(stored: Stored[], prog: Map<string, Progress>, lens: Map<string, { bars: number; len: number; tracks?: { all: number; used: number } }>, thumbs: Map<string, string>): Row[] {
  return stored.map((s) => ({
    id: s.id,
    title: s.title,
    sub: new Date(s.added).toLocaleDateString() + ((lens.get(s.id)?.tracks?.all ?? 0) > 1 ? ` · ${lens.get(s.id)!.tracks!.used} of ${lens.get(s.id)!.tracks!.all} tracks` : ''),
    tracks: true,
    bars: lens.get(s.id)?.bars ?? 0,
    len: lens.get(s.id)?.len ?? 0,
    prog: prog.get(s.id),
    user: true,
    thumb: thumbs.get(s.id) ?? '',
  }))
}

function table(caption: string, rows: Row[], empty: string) {
  const best = rows.some((r) => r.prog?.best) // no column of dashes before the first score
  const body = rows.length
    ? rows
        .map(
          (r) => `<tr class="open" data-open="${r.id}">
        <td class="thumb">${art(r.id)}${r.thumb}</td>
        <td class="name">${esc(r.title)}${(r.prog?.days?.length ?? 0) >= 2 ? ' <span class="tag">Ready</span>' : ''}${memTag(r.prog)}<small>${esc(r.sub)}${r.len ? ` · ${mmss(r.len)}` : ''}</small></td>
        ${best ? `<td class="num">${r.prog?.best ? `<b>${Math.round(r.prog.best.acc * 100)}%</b>` : '—'}</td>` : ''}
        <td class="acts"><div class="row-actions">
          <button class="btn${r.cont ? ' primary' : ' ghost'}" data-play="${r.id}" data-mode="learn" aria-label="${r.cont ? (r.prog?.last ? 'Continue' : 'Start') : 'Learn'} ${esc(r.title)}">${r.cont ? icon('play') : ''}${r.cont ? (r.prog?.last ? 'Continue' : 'Start') : 'Learn'}</button>
          <button class="btn ghost" data-play="${r.id}" data-mode="perform" aria-label="Perform ${esc(r.title)}">Perform</button>
          <button class="btn ghost" data-rt="${r.id}" aria-label="Read through ${esc(r.title)}">Read through</button>
          <button class="btn ghost" data-mem="${r.id}" aria-label="Memorise ${esc(r.title)}">Memorise</button>
          ${r.tracks ? `<button class="btn ghost" data-tracks="${r.id}" aria-label="Options for ${esc(r.title)}">Options</button>` : ''}
        </div></td></tr>`,
        )
        .join('')
    : `<tr><td colspan="${best ? 4 : 3}" class="empty">${empty}</td></tr>`
  return `<table class="songs"><caption>${caption}</caption>
    <colgroup><col><col>${best ? '<col style="width:90px">' : ''}<col class="acol"></colgroup>
    ${rows.length ? `<thead><tr><th scope="col"><span class="sr-only">Preview</span></th><th scope="col">Piece</th>${best ? '<th scope="col" class="num">Best</th>' : ''}<th scope="col"><span class="sr-only">Actions</span></th></tr></thead>` : ''}
    <tbody>${body}</tbody></table>`
}


// Two tiers: the fill climbs to Solid in Ink Soft; past Solid, a second fill in Ink climbs to Fluent over it.
export const meter = (pct: number, solid: boolean, label: string, fluent?: number) =>
  `<div class="meter${solid ? (fluent === undefined ? ' solid' : ' tier') : ''}" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct * 100)}"${solid && fluent !== undefined ? ` aria-valuetext="Solid, ${Math.round(fluent * 100)}% fluent"` : ''}><i style="width:${Math.round(pct * 100)}%"></i>${solid && fluent !== undefined ? `<i class="fl" style="width:${Math.round(fluent * 100)}%"></i>` : ''}</div>`
export const CLEFS = { treble: 'Treble', bass: 'Bass', grand: 'Grand staff' } as const
export const FREE = 'Free, no subscription, no ads, no account.'
export const KEY_TOUCH_HINT = 'Changes the loudness we read; Fixed hides evenness.'
export const keyTouchSelect = (id: string) => `<select id="${id}" aria-label="Key touch">${KEY_TOUCH.map((k) => `<option${k === settings.keyTouch ? ' selected' : ''}>${k}</option>`).join('')}</select>`

export const head = (title: string, actions = '', lede = '') =>
  `<div class="lib-head"><h1>${title}</h1>${lede ? `<p>${lede}</p>` : ''}${actions ? `<div class="head-actions">${actions}</div>` : ''}</div>${tabNote(title)}`



/** A line of plain words at the top of a page, with an optional button: what is wrong and what can be done about it. */
export const notice = (text: string, action = '', cls = '') => `<p class="notice${cls}" role="status"><span>${esc(text)}</span>${action}</p>`

export function library(el: HTMLElement, starters: Row[], mine: Row[], err = '') {
  el.innerHTML = `
    ${head('Songs', `<label class="btn" style="cursor:pointer">${icon('plus')}Add files<input id="file" type="file" accept=".mid,.midi,.musicxml,.xml,.mxl,audio/midi" multiple hidden></label>`)}
    <p class="err" role="alert" id="drop">${esc(err)}</p>
    ${table('Starter pieces', starters, '')}
    ${table('Your files', mine, 'Add a MIDI or MusicXML file, or drop one anywhere on this page.')}`
}



// ---------- settings ----------

export function drawer(el: HTMLElement, inputs: Input[]) {
  const seg = (name: string, label: string, opts: [string, string][], cur: string) =>
    `<div class="srow"><span>${label}</span><div class="seg" role="radiogroup" aria-label="${label}">${opts.map(([v, l]) => `<label><input type="radio" name="${name}" value="${v}"${cur === v ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div></div>`
  const device = settings.sound
  el.innerHTML = `
  <h2 id="drawerTitle" tabindex="-1" role="heading" aria-level="1">Settings</h2>
  ${seg('fx', 'Effects', [['0', 'Off'], ['1', 'Calm']], String(settings.fx))}
  ${seg('sound', 'Sound', [['keyboard', 'Keyboard'], ['device', 'This device']], device ? 'device' : 'keyboard')}
  ${
    device
      ? `<label class="srow"><span>Instrument</span><select id="sInst">${INSTRUMENTS.map((i) => `<option value="${i.id}"${settings.instrument === i.id ? ' selected' : ''}>${i.label}</option>`).join('')}</select></label>
  <label class="srow"><span>Volume</span><input id="sVol" type="range" min="0.1" max="1" step="0.05" value="${settings.volume}"></label>
  ${loadState(settings.instrument) === 'failed' ? `<p class="fine" role="status">${instrument(settings.instrument).label} failed to load. Using the synth.</p>` : ''}`
      : ''
  }
  <label class="srow"><span>Click volume</span><input id="sClick" type="range" min="0" max="1" step="0.05" value="${settings.click}" aria-label="Click volume: count-in and metronome"></label>
  ${seg('coach', 'Touch coach', [['off', 'Off'], ['gentle', 'Gentle'], ['steady', 'Steady'], ['strict', 'Strict']], settings.coach)}
  <div class="srow"><span>Key touch</span>${keyTouchSelect('sKeyTouch')}</div>
  <p class="fine">${KEY_TOUCH_HINT}</p>
  ${seg('strict', 'Strictness', [['easy', 'Easy'], ['standard', 'Standard'], ['strict', 'Strict']], settings.strict)}
  <div class="srow"><span>Keyboard</span>${
    inputs.length > 1
      ? `<select id="sDevice"><option value="">All</option>${inputs.map((i) => `<option value="${esc(i.id)}"${i.id === settings.device ? ' selected' : ''}>${esc(i.name)}</option>`).join('')}</select>`
      : `<b>${inputs.length ? esc(inputs[0].name) : 'None found'}</b>`
  }</div>
  <p id="sMon" class="fine" role="status" hidden></p>
  <div class="srow"><span>Delay</span><div class="inl"><input id="sOffset" type="number" min="-300" max="300" step="5" value="${settings.offset}" aria-label="Delay in milliseconds"><small>ms</small><button class="btn" id="sCal">Calibrate</button></div></div>
  <div class="srow"><span>Data</span><div class="inl"><button class="btn sm" id="sExport">Export</button><button class="btn sm" id="sSummary" title="A plain text summary of your practice, to send to a teacher">Practice summary</button><button class="btn sm" id="sImport">Import</button><button class="btn sm" id="sClear">Clear</button><input id="sFile" type="file" accept="application/json,.json" hidden></div></div>
  <details><summary>Advanced</summary>
    <label class="switch"><input id="sNames" type="checkbox"${settings.names ? ' checked' : ''}><i></i>Note names</label>
    <label class="switch sub"><input id="sFade" type="checkbox"${settings.fade ? ' checked' : ''}${settings.names ? '' : ' disabled'}><i></i>Fade names I know</label>
    <label class="switch"><input id="sFull" type="checkbox"${settings.full ? ' checked' : ''}><i></i>All 88 keys</label>
    <label class="switch"><input type="checkbox" data-osk-sw${(settings.osk ?? inputs.length === 0) ? ' checked' : ''}><i></i>On-screen keys</label>
    <label class="switch"><input id="sMarks" type="checkbox"${settings.marks ? ' checked' : ''}><i></i>Always show touch marks</label>
    <label class="switch"><input id="sWritten" type="checkbox"${settings.asWritten ? ' checked' : ''}><i></i>Play the file's dynamics</label>
    <label class="srow"><span>Fall speed</span><span class="slider"><small>Slow</small><input id="sFall" type="range" min="1" max="5" step="0.5" value="${6.5 - settings.fall}"><small>Fast</small></span></label>
    <label class="srow"><span>Hand split</span><select id="sSplit">${[55, 57, 60, 62, 64].map((p) => `<option value="${p}"${p === settings.split ? ' selected' : ''}>${noteName(p)}</option>`).join('')}</select></label>
  </details>
  <p class="fine foot"><button class="link" id="sSetup">Set up</button> <button class="link" id="sCredits">Credits</button> <button class="link" id="sHelp">Help</button></p>`
}


export const CAL_NOTES = 10

/** A plan row that starts something through the same route as the Path: a title, a line and what to start. */
interface Go {
  title: string
  sub: string
  start: Start
}

export interface TodayData {
  guide?: Guide | null // the first-week card
  last: { id: string; title: string; sub: string; first: boolean }
  again?: { id: string; title: string; sub: string } // a piece whose spaced review is due
  read: { id: string; name: string; pct: number; line: string }
  tech: string
  techDue: boolean
  techId: string
  fix?: { id: string; title: string; a: number; b: number } // the worst bars of the piece played last
  review?: { name: string; id: string; line: string } // a second reading stage, for the longest plan
  sight?: { id: string; title: string; sub: string } // a new, easy piece to read through without stopping
  week: { days: { key: string; label: string; played: boolean; today: boolean }[]; minutes: number }
  goal: number
  planMin: PlanMin
  streak: Streak
  scale?: Go & { pct: number } // the next Scales stage, for the longer plans
  theory?: Go // a Theory session with cards due
  path?: Go // the next requirement on the Path, when Today has no row of its own for it
  done: string[] // steps finished today
  recap?: { minutes: number; played: number; suggest: number; better?: string } // last week, shown early in the week
}

export const weekBlock = (w: TodayData['week'], goal: number, streak?: Streak) => `
  <div class="week" role="img" aria-label="${w.days.filter((d) => d.played).length} days practised this week, ${w.minutes} of ${goal} minutes">
    ${w.days.map((d) => `<span class="day${d.played ? ' on' : ''}${d.today ? ' today' : ''}"><i></i>${d.label}</span>`).join('')}
  </div>
  <div class="goal"><div class="meter${w.minutes >= goal ? ' solid' : ''}"><i style="width:${Math.min(100, Math.round((w.minutes / goal) * 100))}%"></i></div><span><b>${w.minutes}</b> of ${goal} min</span></div>${streak ? streakHtml(streak) : ''}`

const go = (c: string, s: Start, word: string) => `<button class="btn${c}" data-today="start" data-start="${startAttr(s)}">${c.includes('primary') ? icon('play') : ''}${word}</button>`

/** The day as a short list in practice order; nothing is locked and each row stands alone. */
export function todayView(el: HTMLElement, d: TodayData) {
  type R = { key: string; min: number; title: string; sub: string; mid?: string; act: (cls: string) => string }
  const all: R[] = [
    { key: 'warm', min: 2, title: d.tech, sub: d.techDue && !d.done.includes('warm') ? 'Exercise, due for review' : 'Exercise', act: (c) => `<button class="btn${c}" data-today="tech" data-id="${esc(d.techId)}">${c.includes('primary') ? icon('play') : ''}Start</button>` },
    { key: 'read', min: 3, title: d.read.name, sub: d.read.line, mid: `<div class="mrow">${meter(d.read.pct, false, 'Mastery')}<b>${Math.round(d.read.pct * 100)}%</b></div>`, act: (c) => `<button class="btn${c}" data-today="read" data-id="${d.read.id}">${c.includes('primary') ? icon('play') : ''}Practice</button>` },
    { key: 'piece', min: 5, title: d.last.title, sub: d.last.sub, act: (c) => `<button class="btn${c}" data-today="continue" data-id="${d.last.id}">${c.includes('primary') ? icon('play') : ''}${d.last.first ? 'Start' : 'Continue'}</button>` },
    ...(d.sight ? [{ key: 'sight', min: 4, title: d.sight.title, sub: d.sight.sub, act: (c: string) => `<button class="btn${c}" data-today="sight" data-id="${esc(d.sight!.id)}">${c.includes('primary') ? icon('play') : ''}Read through</button>` }] : []),
    ...(d.again ? [{ key: 'again', min: 5, title: d.again.title, sub: d.again.sub, act: (c: string) => `<button class="btn${c}" data-today="continue" data-id="${d.again!.id}">Play</button>` }] : []),
    ...(d.fix ? [{ key: 'fix', min: 4, title: `Bars ${d.fix.a + 1} to ${d.fix.b + 1} of ${d.fix.title}`, sub: 'Slow loop at 70%', act: (c: string) => `<button class="btn${c}" data-today="fix" data-id="${d.fix!.id}" data-a="${d.fix!.a}" data-b="${d.fix!.b}">${icon('loop')}Loop</button>` }] : []),
    ...(d.scale ? [{ key: 'scale', min: 3, title: d.scale.title, sub: d.scale.sub, mid: `<div class="mrow">${meter(d.scale.pct, false, 'Mastery')}<b>${Math.round(d.scale.pct * 100)}%</b></div>`, act: (c: string) => go(c, d.scale!.start, 'Start') }] : []),
    ...(d.theory ? [{ key: 'theory', min: 3, title: d.theory.title, sub: d.theory.sub, act: (c: string) => go(c, d.theory!.start, 'Start') }] : []),
    ...(d.path ? [{ key: 'path', min: 3, title: d.path.title, sub: d.path.sub, act: (c: string) => go(c, d.path!.start, 'Start') }] : []),
    { key: 'run', min: 3, title: 'Sight Run', sub: 'Fresh notes in a row, at your range', act: (c: string) => `<button class="btn${c}" data-today="run">${c.includes('primary') ? icon('play') : ''}Start</button>` },
    ...(d.review ? [{ key: 'review', min: 6, title: d.review.name, sub: d.review.line, act: (c: string) => `<button class="btn${c}" data-today="read" data-id="${d.review!.id}">${c.includes('primary') ? icon('play') : ''}Practice</button>` }] : []),
  ]
  const plan = planOf(d.planMin, all.map((r) => r.key)).map(({ key, min }) => ({ ...all.find((r) => r.key === key)!, min }))
  // what is still to do comes first, in practice order; finished steps sink to the bottom as a record of the day
  const ordered = [...plan.filter((r) => !d.done.includes(r.key)), ...plan.filter((r) => d.done.includes(r.key))]
  const first = ordered.find((r) => !d.done.includes(r.key))
  const rows = ordered
    .map((r) => {
      const done = d.done.includes(r.key)
      const cls = r === first ? ' primary' : done ? ' ghost' : ''
      return `<div class="prow${done ? ' done' : ''}"><span class="plead">${done ? icon('check') : ''}</span>${r.key === 'piece' ? art(d.last.id, 'art lead') : ''}<div class="pwho"><b>${esc(r.title)}</b><span>${esc(r.sub)}${done ? '' : ` · about ${r.min} min`}</span></div>${r.mid ?? ''}<div class="pact">${r.act(cls)}</div></div>`
    })
    .join('')
  el.innerHTML = `
    ${head('Today', `<span class="plan-cap">Plan</span><div class="seg" role="radiogroup" aria-label="Plan length">${PLAN_LENGTHS.map((m) => `<label><input type="radio" name="planMin" value="${m}"${d.planMin === m ? ' checked' : ''}><span>${m} min</span></label>`).join('')}</div>`)}
    ${d.guide ? guideCard(d.guide) : ''}
    ${d.recap ? `<section class="tcard recap" aria-label="Last week"><span>Last week: <b>${d.recap.minutes} min</b> on ${d.recap.played} ${d.recap.played === 1 ? 'day' : 'days'}.${d.recap.better ? ` Most improved: ${esc(d.recap.better)}.` : ''}</span>${d.recap.suggest > d.goal ? `<button class="btn ghost" data-goal="${d.recap.suggest}">Aim for ${d.recap.suggest} min</button>` : ''}</section>` : ''}
    <section class="tcard span" aria-label="This week">${weekBlock(d.week, d.goal, d.streak)}</section>
    <div class="plan">${rows}</div>`
}



export const RUN_START: Record<RunSpec['clef'], [number, number]> = { treble: [60, 72], bass: [48, 60], grand: [43, 77] }
export const runTitle = (s: RunSpec) => `${CLEFS[s.clef]} ${noteName(s.lo, s.fifths)} to ${noteName(s.hi, s.fifths)}${s.size === 2 ? ', intervals' : s.size === 3 ? ', triads' : ''}`
export const HANDS = { R: 'Right hand', L: 'Left hand', both: 'Hands together', contrary: 'Contrary motion' } as const
export const cardName = (c: Card) => `${keyName(c.tonic, c.form)}, ${HANDS[c.hands].toLowerCase()}, ${c.oct === 1 ? 'one octave' : 'two octaves'}`

