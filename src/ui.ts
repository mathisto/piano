import type { Result } from './game'
import { icon } from './icons'
import type { Input } from './midi'
import { noteName } from './spell'
import { settings } from './settings'
import type { Progress, Stored } from './store'
import type { Song } from './song'
import type { Starter } from './starters'

export const $ = <T extends HTMLElement>(s: string, root: ParentNode = document) => root.querySelector(s) as T

export function skeleton(app: HTMLElement) {
  app.innerHTML = `
  <header class="bar">
    <button class="brand" id="brand" aria-label="piano — back to songs">piano</button>
    <div class="song-title" id="title"></div>
    <div class="seg" id="modeSeg" hidden role="radiogroup" aria-label="Mode">
      <label><input type="radio" name="mode" value="perform"><span>Perform</span></label>
      <label><input type="radio" name="mode" value="learn"><span>Learn</span></label>
    </div>
    <div class="spacer"></div>
    <div class="hud" id="hud" hidden>
      <div data-m="perform"><small>Score</small><b id="hScore">0</b></div>
      <div data-m="perform" class="combo"><small>Combo</small><b id="hCombo">0</b><span class="mult" id="hMult" hidden>×2</span></div>
      <div data-m="perform"><small>Accuracy</small><b id="hAcc">100%</b></div>
      <div data-m="learn"><small>Cleared</small><b id="hClr">0/0</b></div>
      <div data-m="learn"><small>Slips</small><b id="hSlip">0</b></div>
    </div>
    <button class="chip" id="dev"><span class="dot"></span><span id="devName">No keyboard</span></button>
    <button class="btn icon ghost" id="settingsBtn" aria-label="Settings" aria-expanded="false" aria-controls="drawer">${icon('sliders')}</button>
  </header>
  <main id="main" style="display:grid;min-height:0">
    <section id="library" class="view on" aria-label="Songs"></section>
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
}

export function starterRows(starts: Starter[], songs: Song[], prog: Map<string, Progress>): Row[] {
  return starts.map((s, i) => ({
    id: s.spec.id,
    title: s.spec.title,
    sub: `${s.by} · ${s.level}`,
    bars: songs[i].bars.length,
    len: songs[i].end,
    prog: prog.get(s.spec.id),
    user: false,
  }))
}

export function userRows(stored: Stored[], prog: Map<string, Progress>, lens: Map<string, { bars: number; len: number }>): Row[] {
  return stored.map((s) => ({
    id: s.id,
    title: s.title,
    sub: new Date(s.added).toLocaleDateString(),
    bars: lens.get(s.id)?.bars ?? 0,
    len: lens.get(s.id)?.len ?? 0,
    prog: prog.get(s.id),
    user: true,
  }))
}

function table(caption: string, rows: Row[], empty: string) {
  const body = rows.length
    ? rows
        .map(
          (r) => `<tr>
        <td class="name">${esc(r.title)}<small>${esc(r.sub)}</small></td>
        <td class="num">${r.bars || '—'}</td>
        <td class="num">${r.len ? mmss(r.len) : '—'}</td>
        <td class="num">${r.prog?.best ? `<span class="grade" style="color:${gradeColor(r.prog.best.grade)}">${r.prog.best.grade}</span> ${Math.round(r.prog.best.acc * 100)}%` : '—'}</td>
        <td class="acts"><div class="row-actions">
          <button class="btn primary" data-play="${r.id}" data-mode="learn">${icon('play')}Learn</button>
          <button class="btn" data-play="${r.id}" data-mode="perform">Perform</button>
          ${r.user ? `<button class="btn icon ghost" data-del="${r.id}" aria-label="Remove ${esc(r.title)}" title="Remove">${icon('x')}</button>` : ''}
        </div></td></tr>`,
        )
        .join('')
    : `<tr><td colspan="5" class="empty">${empty}</td></tr>`
  return `<table class="songs"><caption>${caption}</caption>
    <colgroup><col><col style="width:90px"><col style="width:110px"><col style="width:150px"><col style="width:300px"></colgroup>
    <thead><tr><th scope="col">Piece</th><th scope="col" class="num">Bars</th><th scope="col" class="num">Length</th><th scope="col" class="num">Best</th><th scope="col"><span style="position:absolute;left:-9999px">Actions</span></th></tr></thead>
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
      <p>Pick a piece, or drop in any MIDI file. Files stay in this browser. Nothing is uploaded.</p>
    </div>
    <div class="drop" id="drop">
      <label class="btn" style="cursor:pointer">${icon('plus')}Add MIDI files<input id="file" type="file" accept=".mid,.midi,audio/midi" multiple hidden></label>
      <span>or drop .mid files anywhere on this page.</span>
      <span class="err" role="alert">${esc(err)}</span>
    </div>
    ${table('Starter pieces', starters, '')}
    ${table('Your files', mine, 'Nothing yet. Public-domain MIDI: Mutopia Project, OpenScore, or export from MuseScore.')}`
}

// ---------- results ----------

export function results(r: Result, worst: { a: number; b: number } | null) {
  const bins = new Array(13).fill(0) // -125..+125 in 20 ms steps
  for (const o of r.offs) bins[Math.min(12, Math.max(0, Math.round((o + 125) / 20)))]++
  const peak = Math.max(1, ...bins)
  const mean = r.offs.length ? r.offs.reduce((a, b) => a + b, 0) / r.offs.length : 0
  const lean = Math.abs(mean) < 8 ? 'Your timing is centred.' : mean < 0 ? `You tend to play about ${Math.round(-mean)} ms early.` : `You tend to play about ${Math.round(mean)} ms late.`
  const hist = bins
    .map((n, i) => `<rect class="${i === 6 ? 'mid' : ''}" x="${i * 30 + 6}" y="${60 - (n / peak) * 56}" width="24" height="${(n / peak) * 56 + 0.5}" rx="2"/>`)
    .join('')
  const perform = r.mode === 'perform'
  return `
  <div class="results"><div class="card" role="dialog" aria-label="Results">
    <div class="big-grade" style="color:${gradeColor(r.grade)}">${perform ? r.grade : '✓'}</div>
    <h2>${perform ? 'Song complete' : 'Cleared'}${r.rate < 1 ? ` at ${Math.round(r.rate * 100)}% tempo` : ''}</h2>
    <p class="line">${perform ? `<b>${r.score.toLocaleString()}</b> points · ` : ''}<b>${Math.round(r.acc * 100)}%</b> accuracy · best combo <b>${r.maxCombo}</b> · <b>${r.wrong}</b> wrong ${r.wrong === 1 ? 'note' : 'notes'}</p>
    ${
      perform
        ? `<div>
      <div class="counts"><span><i style="background:var(--perfect)"></i>Perfect ${r.counts.perfect}</span><span><i style="background:var(--great);border-radius:50%"></i>Great ${r.counts.great}</span><span><i style="background:var(--good);transform:rotate(45deg) scale(.85)"></i>Good ${r.counts.good}</span><span><i style="background:var(--bad);clip-path:polygon(50% 0,100% 100%,0 100%)"></i>Miss ${r.counts.miss}</span></div>
      <svg class="hist" viewBox="0 0 396 82" role="img" aria-label="Timing: ${lean}">${hist}<text x="6" y="80">early</text><text x="390" y="80" text-anchor="end">late</text></svg>
      <div style="color:var(--ink-2)">${lean}</div></div>`
        : ''
    }
    <div class="row">
      ${worst ? `<button class="btn primary big" id="drill">${icon('loop')}Loop bars ${worst.a + 1}–${worst.b + 1}</button>` : ''}
      <button class="btn ${worst ? '' : 'primary big'}" id="again">${icon('restart')}Again</button>
      <button class="btn ghost" id="toLib">Songs</button>
    </div>
  </div></div>`
}

// ---------- settings ----------

export function drawer(el: HTMLElement, inputs: Input[], status: string) {
  const split = settings.split
  el.innerHTML = `
  <h2>Settings</h2>
  <fieldset><legend>Keyboard</legend>
    <label class="field"><span>MIDI input</span>
      <select id="sDevice"><option value="">All connected keyboards</option>${inputs.map((i) => `<option value="${esc(i.id)}"${i.id === settings.device ? ' selected' : ''}>${esc(i.name)}</option>`).join('')}</select></label>
    <p id="sStatus">${esc(status)}</p>
    <p>No keyboard? Play with your computer keys: <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> <kbd>G</kbd> <kbd>H</kbd> <kbd>J</kbd> for white keys, <kbd>W</kbd> <kbd>E</kbd> <kbd>T</kbd> <kbd>Y</kbd> <kbd>U</kbd> for black, <kbd>Z</kbd>/<kbd>X</kbd> shift the octave.</p>
  </fieldset>
  <fieldset><legend>Timing</legend>
    <label class="field"><span>Input delay (ms)</span><input id="sOffset" type="number" min="-300" max="300" step="5" value="${settings.offset}"></label>
    <p>Positive means your notes arrive late (display lag, Bluetooth). Calibrate by playing along to a click, or nudge by hand.</p>
    <button class="btn" id="sCal">Calibrate…</button>
  </fieldset>
  <fieldset><legend>Look and feel</legend>
    <div class="field"><span>Effects</span>
      <div class="seg" role="radiogroup" aria-label="Effects">${['Off', 'Calm', 'Arcade', 'Max'].map((n, i) => `<label><input type="radio" name="fx" value="${i}"${settings.fx === i ? ' checked' : ''}><span>${n}</span></label>`).join('')}</div></div>
    <label class="field"><span>Fall speed</span><input id="sFall" type="range" min="1" max="5" step="0.5" value="${6.5 - settings.fall}"></label>
    <label class="switch"><input id="sNames" type="checkbox"${settings.names ? ' checked' : ''}><i></i>Note names on keys and notes</label>
    <label class="switch"><input id="sFull" type="checkbox"${settings.full ? ' checked' : ''}><i></i>Show all 88 keys</label>
    <label class="switch"><input id="sStaff" type="checkbox"${settings.staff ? ' checked' : ''}><i></i>Show the staff</label>
  </fieldset>
  <fieldset><legend>Sound</legend>
    <label class="switch"><input id="sSound" type="checkbox"${settings.sound ? ' checked' : ''}><i></i>Play through the browser</label>
    <label class="field"><span>Volume</span><input id="sVol" type="range" min="0.1" max="1" step="0.05" value="${settings.volume}"></label>
    <p>Off by default: your keyboard's own speakers play. If you turn this on and hear every note twice, set Local Control to Off on the keyboard or turn it down.</p>
  </fieldset>
  <fieldset><legend>Hands</legend>
    <label class="field"><span>Split point for single-track files</span>
      <select id="sSplit">${[55, 57, 60, 62, 64].map((p) => `<option value="${p}"${p === split ? ' selected' : ''}>${noteName(p)}${p === 60 ? ' (middle C)' : ''} and up is the right hand</option>`).join('')}</select></label>
  </fieldset>
  <fieldset><legend>Shortcuts</legend>
    <div class="sc"><kbd>Space</kbd><span>Play / pause</span><kbd>Esc</kbd><span>Close, or back to songs</span><kbd>[</kbd><span>Slower (Learn)</span><kbd>]</kbd><span>Faster (Learn)</span></div>
  </fieldset>
  <fieldset><legend>Your data</legend>
    <p>Songs and progress live only in this browser.</p>
    <button class="btn" id="sExport">Export progress (JSON)</button>
  </fieldset>`
}

