import { piano } from './audio'
import type { Result } from './game'
import { icon } from './icons'
import type { Input } from './midi'
import { noteName } from './spell'
import { settings } from './settings'
import type { Progress, Stored } from './store'
import type { Song } from './song'
import type { Starter } from './starters'
import type { Stage } from './drill'

export const $ = <T extends HTMLElement>(s: string, root: ParentNode = document) => root.querySelector(s) as T

export function skeleton(app: HTMLElement) {
  app.innerHTML = `
  <header class="bar">
    <button class="brand" id="brand" aria-label="piano — back to songs">piano</button>
    <div class="seg" id="nav" role="radiogroup" aria-label="Section">
      <label><input type="radio" name="nav" value="songs" checked><span>Songs</span></label>
      <label><input type="radio" name="nav" value="read"><span>Read music</span></label>
    </div>
    <div class="song-title" id="title"></div>
    <button class="btn" id="stagesBtn" hidden>All stages</button>
    <div class="seg" id="modeSeg" hidden role="radiogroup" aria-label="Mode">
      <label><input type="radio" name="mode" value="perform"><span>Perform</span></label>
      <label><input type="radio" name="mode" value="learn"><span>Learn</span></label>
    </div>
    <div class="seg icons" id="viewSeg" hidden role="radiogroup" aria-label="View">
      <label title="Sheet music only"><input type="radio" name="view" value="sheet"><span>${icon('viewStaff')}<em>Staff</em></span></label>
      <label title="Sheet music and falling notes"><input type="radio" name="view" value="both"><span>${icon('viewBoth')}<em>Both</em></span></label>
      <label title="Falling notes only"><input type="radio" name="view" value="falling"><span>${icon('viewFall')}<em>Falling</em></span></label>
    </div>
    <div class="spacer"></div>
    <div class="hud" id="hud" hidden>
      <div data-m="perform" role="group" aria-label="Score" title="Score"><small>Score</small><b id="hScore">0</b></div>
      <div data-m="perform" class="combo" role="group" aria-label="Combo" title="Combo"><small>Combo</small><b id="hCombo">0</b><span class="mult" id="hMult" hidden>×2</span></div>
      <div data-m="perform" role="group" aria-label="Accuracy" title="Accuracy"><small>Accuracy</small><b id="hAcc">100%</b></div>
      <div data-m="learn" role="group" aria-label="Notes" title="Notes"><small>Notes</small><b id="hClr">0/0</b></div>
      <div data-m="learn" role="group" aria-label="Wrong" title="Wrong"><small>Wrong</small><b id="hSlip">0</b></div>
      <div data-m="read" role="group" aria-label="Cards" title="Cards"><small>Cards</small><b id="hCards">0/0</b></div>
      <div data-m="read" role="group" aria-label="Streak" title="Streak"><small>Streak</small><b id="hStreak">0</b></div>
      <div data-m="read" role="group" aria-label="First try" title="First try"><small>First try</small><b id="hClean">—</b></div>
      <div data-m="read" role="group" aria-label="Median" title="Median"><small>Median</small><b id="hMed">—</b></div>
    </div>
    <button class="chip" id="dev"><span class="dot"></span><span id="devName">No keyboard</span></button>
    <button class="btn icon ghost" id="settingsBtn" aria-label="Settings" aria-expanded="false" aria-controls="drawer">${icon('sliders')}</button>
  </header>
  <main id="main" style="display:grid;min-height:0">
    <section id="library" class="view on" aria-label="Songs"></section>
    <section id="read" class="view" aria-label="Read music"></section>
    <section id="play" class="view" aria-label="Play">
      <div id="staff"></div>
      <div id="stage">
        <div id="judge" aria-hidden="true"></div>
        <div id="slam" aria-hidden="true"></div>
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

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`

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

export function userRows(stored: Stored[], prog: Map<string, Progress>, lens: Map<string, { bars: number; len: number }>, thumbs: Map<string, string>): Row[] {
  return stored.map((s) => ({
    id: s.id,
    title: s.title,
    sub: new Date(s.added).toLocaleDateString(),
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
        <td class="thumb">${r.thumb}</td>
        <td class="name">${esc(r.title)}${r.cont ? ` <span class="tag">${r.prog?.last ? 'Continue' : 'Start here'}</span>` : ''}<small>${esc(r.sub)}</small></td>
        <td class="num">${r.bars || '—'}</td>
        <td class="num">${r.len ? mmss(r.len) : '—'}</td>
        ${best ? `<td class="num">${r.prog?.best ? `<span class="grade" style="color:${gradeColor(r.prog.best.grade)}">${r.prog.best.grade}</span> ${Math.round(r.prog.best.acc * 100)}%` : '—'}</td>` : ''}
        <td class="acts"><div class="row-actions">
          <button class="btn${r.cont ? ' primary' : ''}" data-play="${r.id}" data-mode="learn" aria-label="Learn ${esc(r.title)}">${r.cont ? icon('play') : ''}Learn</button>
          <button class="btn ghost" data-play="${r.id}" data-mode="perform" aria-label="Perform ${esc(r.title)}">Perform</button>
          ${r.user ? `<button class="btn icon ghost" data-del="${r.id}" aria-label="Remove ${esc(r.title)}" title="Remove">${icon('x')}</button>` : ''}
        </div></td></tr>`,
        )
        .join('')
    : `<tr><td colspan="7" class="empty">${empty}</td></tr>`
  return `<table class="songs"><caption>${caption}</caption>
    <colgroup><col style="width:156px"><col><col style="width:80px"><col style="width:100px">${best ? '<col style="width:130px">' : ''}<col style="width:270px"></colgroup>
    <thead><tr><th scope="col"><span style="position:absolute;left:-9999px">Preview</span></th><th scope="col">Piece</th><th scope="col" class="num">Bars</th><th scope="col" class="num">Length</th>${best ? '<th scope="col" class="num">Best</th>' : ''}<th scope="col"><span style="position:absolute;left:-9999px">Actions</span></th></tr></thead>
    <tbody>${body}</tbody></table>`
}

export function gradeColor(g: string) {
  return g === 'S' ? 'var(--perfect)' : g === 'A' ? 'var(--great)' : g === 'B' ? 'var(--R)' : g === 'C' ? 'var(--good)' : 'var(--L)'
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export function library(el: HTMLElement, starters: Row[], mine: Row[], err = '') {
  el.innerHTML = `
    <div class="lib-head">
      <h1>Songs</h1>
      <p>Pick a piece, or add your own MIDI or MusicXML file. Files stay in this browser. Nothing is uploaded.</p>
    </div>
    <div class="drop" id="drop">
      <label class="btn" style="cursor:pointer">${icon('plus')}Add files<input id="file" type="file" accept=".mid,.midi,.musicxml,.xml,.mxl,audio/midi" multiple hidden></label>
      <span>MIDI (.mid) or MusicXML (.musicxml, .mxl). Or drop them anywhere on this page.</span>
      <span class="err" role="alert">${esc(err)}</span>
    </div>
    ${table('Starter pieces', starters, '')}
    ${table('Your files', mine, 'Nothing yet. Public-domain scores: Mutopia Project, OpenScore, or export MIDI or MusicXML from MuseScore.')}`
}

// ---------- results ----------

export function results(r: Result, worst: { a: number; b: number } | null) {
  const bins = new Array(13).fill(0) // -125..+125 in 20 ms steps
  for (const o of r.offs) bins[Math.min(12, Math.max(0, Math.round((o + 125) / 20)))]++
  const peak = Math.max(1, ...bins)
  const mean = r.offs.length ? r.offs.reduce((a, b) => a + b, 0) / r.offs.length : 0
  const lean = Math.abs(mean) < 8 ? 'Your timing is centred.' : mean < 0 ? `You tend to play about ${Math.round(-mean)} ms early.` : `You tend to play about ${Math.round(mean)} ms late.`
  const hist = bins
    .map((n, i) => `<rect x="${i * 30 + 6}" y="${60 - (n / peak) * 56}" width="24" height="${(n / peak) * 56 + 0.5}" rx="2"/>`)
    .join('')
  const perform = r.mode === 'perform'
  return `
  <div class="results"><div class="card" role="dialog" aria-label="Results">
    <div class="big-grade" style="color:${gradeColor(r.grade)}">${perform ? r.grade : icon('check')}</div>
    <h2>${perform ? 'Song complete' : 'Cleared'}${r.rate < 1 ? ` at ${Math.round(r.rate * 100)}% tempo` : ''}</h2>
    <p class="line">${perform ? `<b>${r.score.toLocaleString()}</b> points · ` : ''}<b>${Math.round(r.acc * 100)}%</b> accuracy · best combo <b>${r.maxCombo}</b> · <b>${r.wrong}</b> wrong ${r.wrong === 1 ? 'note' : 'notes'}${perform && r.holds >= 0 ? ` · held <b>${Math.round(r.holds * 100)}%</b>` : ''}</p>
    ${
      perform
        ? `<div>
      <div class="counts"><span><i style="background:var(--perfect)"></i>Perfect ${r.counts.perfect}</span><span><i style="background:var(--great);border-radius:50%"></i>Great ${r.counts.great}</span><span><i style="background:var(--good);transform:rotate(45deg) scale(.85)"></i>Good ${r.counts.good}</span><span><i style="background:var(--bad);clip-path:polygon(50% 0,100% 100%,0 100%)"></i>Miss ${r.counts.miss}</span></div>
      <svg class="hist" viewBox="0 0 396 82" role="img" aria-label="Timing: ${lean}">${hist}<line class="mid" x1="198" x2="198" y1="0" y2="62"/><text x="198" y="80" text-anchor="middle">on time</text><text x="6" y="80">early</text><text x="390" y="80" text-anchor="end">late</text></svg>
      <div style="color:var(--ink-2)">${lean}</div></div>`
        : ''
    }
    <div class="row">
      ${worst ? `<button class="btn primary big" id="drill">${icon('loop')}Loop bars ${worst.a + 1}–${worst.b + 1}</button>` : ''}
      <button class="btn ${worst ? '' : 'primary big'}" id="again">${icon('restart')}Again</button>
      <button class="btn" id="toLib">Songs</button>
    </div>
  </div></div>`
}

// ---------- settings ----------

export function drawer(el: HTMLElement, inputs: Input[], status: string) {
  const split = settings.split
  el.innerHTML = `
  <h2 id="drawerTitle" tabindex="-1">Settings</h2>
  <fieldset><legend>Look and feel</legend>
    <div class="field"><span>Effects</span>
      <div class="seg" role="radiogroup" aria-label="Effects">${['Off', 'Calm', 'Arcade', 'Max'].map((n, i) => `<label><input type="radio" name="fx" value="${i}"${settings.fx === i ? ' checked' : ''}><span>${n}</span></label>`).join('')}</div></div>
    <label class="field"><span>Fall speed</span><input id="sFall" type="range" min="1" max="5" step="0.5" value="${6.5 - settings.fall}"></label>
    <label class="switch"><input id="sNames" type="checkbox"${settings.names ? ' checked' : ''}><i></i>Note names on keys and notes</label>
    <label class="switch"><input id="sChord" type="checkbox"${settings.chord ? ' checked' : ''}><i></i>Name the chord I am holding</label>
    <label class="switch"><input id="sFull" type="checkbox"${settings.full ? ' checked' : ''}><i></i>Show all 88 keys</label>
  </fieldset>
  <fieldset><legend>Sound</legend>
    <label class="switch"><input id="sSound" type="checkbox"${settings.sound ? ' checked' : ''}><i></i>Play through the browser</label>
    <label class="field"><span>Instrument</span>
      <select id="sInst"><option value="piano"${settings.instrument === 'piano' ? ' selected' : ''}>Grand piano (samples)</option><option value="synth"${settings.instrument === 'synth' ? ' selected' : ''}>Simple synth</option></select></label>
    <p id="sInstNote" role="status">${piano.state === 'loading' ? 'Loading the piano sounds (about 2 MB)…' : piano.state === 'failed' ? 'The piano sounds did not load, so the simple synth plays instead. Reload to try again.' : ''}</p>
    <label class="field"><span>Volume</span><input id="sVol" type="range" min="0.1" max="1" step="0.05" value="${settings.volume}"></label>
    <p>Piano samples: Salamander Grand Piano by Alexander Holm, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a>.</p>
    <p>Off by default: your keyboard's own speakers play. The Listen hand, the on-screen keys and the computer keys always sound through the browser. If you turn this on and hear every note twice, set Local Control to Off on the keyboard or turn it down.</p>
  </fieldset>
  <fieldset><legend>Timing</legend>
    <div class="field"><span>Hold the keys</span>
      <div class="seg" role="radiogroup" aria-label="Hold the keys">${(['off', 'lenient', 'strict'] as const).map((v) => `<label><input type="radio" name="hold" value="${v}"${settings.hold === v ? ' checked' : ''}><span>${v[0].toUpperCase() + v.slice(1)}</span></label>`).join('')}</div></div>
    <p>Perform mode takes points back when you let go well before the written length. Lenient allows a generous margin; Strict also marks keys held too long. The sustain pedal excuses early release. Learn and Read modes never check.</p>
    <label class="field"><span>Input delay (ms)</span><input id="sOffset" type="number" min="-300" max="300" step="5" value="${settings.offset}"></label>
    <p>Positive means your notes arrive late (display lag, Bluetooth). Calibrate by playing along to a click, or nudge by hand.</p>
    <button class="btn" id="sCal">Calibrate…</button>
  </fieldset>
  <fieldset><legend>Keyboard</legend>
    <label class="field"><span>MIDI input</span>
      <select id="sDevice"><option value="">All connected keyboards</option>${inputs.map((i) => `<option value="${esc(i.id)}"${i.id === settings.device ? ' selected' : ''}>${esc(i.name)}</option>`).join('')}</select></label>
    <p id="sStatus">${esc(status)}</p>
    <p id="sMon" role="status" style="color:var(--ink)"></p>
    <details ${inputs.length ? '' : 'open'}><summary>Keyboard not detected?</summary>
      <p>Check that it is switched on (many keyboards power off after a while), that the USB cable carries data (some only charge), and that it is not paired over Bluetooth only. Then unplug and replug it, or reload this page.</p></details>
    <details><summary>No keyboard? Use the computer keys</summary>
      <p><kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> <kbd>G</kbd> <kbd>H</kbd> <kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd> <kbd>;</kbd> are the white keys, <kbd>W</kbd> <kbd>E</kbd> <kbd>T</kbd> <kbd>Y</kbd> <kbd>U</kbd> <kbd>O</kbd> <kbd>P</kbd> the black ones, <kbd>Z</kbd>/<kbd>X</kbd> shift the octave. You can also click or touch the on-screen keys.</p></details>
  </fieldset>
  <fieldset><legend>Hands</legend>
    <label class="field"><span>Split point for single-track files</span>
      <select id="sSplit">${[55, 57, 60, 62, 64].map((p) => `<option value="${p}"${p === split ? ' selected' : ''}>${noteName(p)}${p === 60 ? ' (middle C)' : ''} and up is the right hand</option>`).join('')}</select></label>
  </fieldset>
  <fieldset><legend>Shortcuts</legend>
    <div class="sc"><kbd>Space</kbd><span>Play / pause</span><kbd>V</kbd><span>Cycle the view: staff, both, falling</span><kbd>Esc</kbd><span>Close, or back to songs</span><kbd>[</kbd><span>Slower (Learn)</span><kbd>]</kbd><span>Faster (Learn)</span></div>
  </fieldset>
  <fieldset><legend>Your data</legend>
    <p>Songs and progress live only in this browser.</p>
    <button class="btn" id="sExport">Export progress (JSON)</button>
  </fieldset>`
}

// ---------- reading drills ----------

export interface StageRow {
  stage: Stage
  pct: number
  solid: boolean
  seen: number
  total: number
  rt: number // mean response time of seen cards, ms (0 = none yet)
  next: boolean
}

const names = (s: Stage) => {
  if (s.notes) return s.notes
  const n = (p: number) => noteName(p)
  if (s.size === 2) return 'Seconds to fifths'
  if (s.size === 3) return 'Root-position triads'
  return s.pool.length <= 3 ? s.pool.map(n).join(' · ') : `${n(Math.min(...s.pool))} to ${n(Math.max(...s.pool))}`
}

const GROUPS: [string, (id: string) => boolean][] = [
  ['Treble clef', (id) => id.startsWith('t-')],
  ['Bass clef', (id) => id.startsWith('b-')],
  ['Both clefs', (id) => id === 'grand'],
  ['Accidentals and keys', (id) => id === 'sharps' || id === 'flats' || id.startsWith('keys-')],
  ['Chords', (id) => id === 'ints' || id === 'triads'],
]

const meter = (pct: number, solid: boolean, label: string) =>
  `<div class="meter${solid ? ' solid' : ''}" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct * 100)}"><i style="width:${Math.round(pct * 100)}%"></i></div>`

export function readView(el: HTMLElement, rows: StageRow[], canReview: boolean) {
  const next = rows.find((r) => r.next)!
  let group = ''
  const body = rows
    .map((r) => {
      const g = GROUPS.find(([, f]) => f(r.stage.id))![0]
      const head = g !== group ? `<tr class="band"><th colspan="5" scope="colgroup">${g}</th></tr>` : ''
      group = g
      const pct = Math.round(r.pct * 100)
      return `${head}<tr>
        <td class="name">${esc(r.stage.name)}${r.next ? ' <span class="tag">Next</span>' : ''}<small>${esc(r.stage.blurb)}</small></td>
        <td>${esc(names(r.stage))}</td>
        <td><div class="mrow">${meter(r.pct, r.solid, `${esc(r.stage.name)} mastery`)}<b>${pct}%</b></div>
          <small style="color:var(--ink-3)">${r.solid ? 'Solid' : r.seen ? `${r.seen} of ${r.total} notes seen` : 'Not started'}</small></td>
        <td class="num">${r.rt ? (r.rt / 1000).toFixed(1) + ' s' : '—'}</td>
        <td class="acts"><div class="row-actions"><button class="btn" data-stage="${r.stage.id}" aria-label="Practice ${esc(r.stage.name)}">Practice</button></div></td></tr>`
    })
    .join('')
  el.innerHTML = `
    <div class="lib-head">
      <h1>Read music</h1>
      <p>Short drills that train your eyes. Notes appear on the staff and the song waits for you to play them. The falling notes are hidden, so the staff is all you have.</p>
    </div>
    <div class="next-strip">
      <span>Next up: <b>${esc(next.stage.name)}</b>. ${esc(next.stage.blurb)}</span>
      <span class="row-actions">
        ${canReview ? '<button class="btn" data-review="1">Review weak notes</button>' : ''}
        <button class="btn primary" data-stage="${next.stage.id}">${icon('play')}Start</button>
      </span>
    </div>
    <table class="songs stages"><caption>Stages</caption>
      <colgroup><col><col style="width:190px"><col style="width:250px"><col style="width:130px"><col style="width:130px"></colgroup>
      <thead><tr><th scope="col">Stage</th><th scope="col">Notes</th><th scope="col">Mastery</th><th scope="col" class="num">Median time</th><th scope="col"><span style="position:absolute;left:-9999px">Actions</span></th></tr></thead>
      <tbody>${body}</tbody></table>`
}

export interface DrillSummary {
  stage: string
  cards: number
  clean: number // 0..1
  medianMs: number
  weakest: { name: string; clean: number; rt: number }[]
  before: number // mastery 0..1
  after: number
  solid: boolean
  nextName: string
}

export function drillResults(d: DrillSummary) {
  const secs = (ms: number) => (ms / 1000).toFixed(1) + ' s'
  return `
  <div class="results"><div class="card" style="grid-template-columns:1fr" role="dialog" aria-label="Drill results">
    <h2>${esc(d.stage)}: set complete</h2>
    <p class="line"><b>${d.cards}</b> cards · <b>${Math.round(d.clean * 100)}%</b> first try · median <b>${secs(d.medianMs)}</b> a card</p>
    <div>
      <p class="line" style="margin-bottom:6px">Stage mastery went from <b>${Math.round(d.before * 100)}%</b> to <b>${Math.round(d.after * 100)}%</b>${d.solid ? '. Solid.' : '. It is solid when every note is first-try right and fast.'}</p>
      <div class="mrow" style="max-width:420px">${meter(d.after, d.solid, 'Stage mastery after this set')}<b>${Math.round(d.after * 100)}%</b></div>
    </div>
    ${d.solid ? `<p class="line">Next up: <b>${esc(d.nextName)}</b></p>` : ''}
    ${
      d.weakest.length
        ? `<div><p class="line" style="margin-bottom:6px">Needs the most work</p><ul style="margin:0;padding-left:20px;color:var(--ink-2)">${d.weakest
            .map((w) => `<li>${esc(w.name)}: ${Math.round(w.clean * 100)}% first try, ${secs(w.rt)}</li>`)
            .join('')}</ul></div>`
        : ''
    }
    <div class="row">
      <button class="btn primary big" id="nextSet">${icon('restart')}${d.solid ? 'Next stage' : 'Another set'}</button>
      <button class="btn" id="toStages">All stages</button>
    </div>
  </div></div>`
}
