import { loadState } from './audio'
import { INSTRUMENTS, instrument } from './instruments'
import type { Result } from './game'
import type { Next } from './pace'
import { creditBlock, licenceName, type LibraryEntry } from './credits'
import { icon } from './icons'
import type { Input } from './midi'
import { noteName } from './spell'
import { settings } from './settings'
import type { Progress, Stored, TouchEntry } from './store'
import type { Evenness } from './even'
import type { Song } from './song'
import type { Starter } from './starters'
import type { Stage } from './drill'
import { LIMITS, type RunSpec, type Tally } from './run'
import { TRAINERS, type TCard, type Trainer } from './theory'
import { UNCHECKED, degreeName, fingering, keyName, quizRight, why, type Card, type Form, type QCard, type Stage as ScaleStage } from './scales'
import { COMFORT, density, type Report, type Selection, type TrackInfo } from './midi-tracks'
import { band, DEFAULT_EDGES, type TouchStats } from './touch'
import { ARTICS, DYNS, KEYS, KEYS_MINOR, PATTERNS, type Opts } from './technique'

export const $ = <T extends HTMLElement>(s: string, root: ParentNode = document) => root.querySelector(s) as T

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
      <div data-m="perform" role="group" aria-label="Accuracy" title="Accuracy"><small>Accuracy</small><b id="hScore">100%</b></div>
      <div data-m="perform" class="combo" role="group" aria-label="In a row" title="Notes in a row"><small>In a row</small><b id="hCombo">0</b></div>
      <div data-m="read" data-run="all" class="combo" role="group" aria-label="Run streak" title="Streak"><small>Streak</small><b id="rStreak">0</b></div>
      <div data-m="read" role="group" aria-label="Cards" title="Cards"><small>Cards</small><b id="hCards">0/0</b></div>
    </div>
    <button class="chip" id="dev"><span class="dot"></span><span id="devName">No keyboard</span></button>
    <button class="btn icon ghost" id="settingsBtn" aria-label="Settings" aria-expanded="false" aria-controls="drawer">${icon('sliders')}</button>
  </header>
  <dialog id="tracks" class="sheet" aria-label="Options"></dialog>
  <dialog id="credits" class="sheet" aria-label="Credits"></dialog>
  <dialog id="help" class="sheet" aria-label="Shortcuts">
    <header><h2>Shortcuts</h2><button class="btn icon ghost" data-close aria-label="Close">${icon('x')}</button></header>
    <div class="body"><div class="sc"><kbd>Space</kbd><span>Play, pause</span><kbd>V</kbd><span>Staff, both, falling</span><kbd>- +</kbd><span>Staff size</span><kbd>N</kbd><span>Note names</span><kbd>M</kbd><span>Hide controls</span><kbd>[ ]</kbd><span>Tempo down, up</span><kbd>Esc</kbd><span>Back</span><kbd>?</kbd><span>This list</span></div>
    <p class="fine">Hearing every note twice? Turn Local Control off on the keyboard. No keyboard: <kbd>A</kbd> to <kbd>;</kbd> play the white keys, <kbd>W E T Y U O P</kbd> the black, <kbd>Z X</kbd> shift the octave.</p></div>
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

/** The cover for a starter or open-library piece; your own files have none and keep the mini-staff. */
export const art = (id: string, cls = 'art') =>
  /^(starter-|lib:)/.test(id) ? `<img class="${cls}" src="${import.meta.env.BASE_URL}art/${id.replace('lib:', '')}.webp" alt="" width="600" height="400" decoding="async">` : ''

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
        <td class="name">${esc(r.title)}<small>${esc(r.sub)}</small></td>
        <td class="num">${r.len ? mmss(r.len) : '—'}</td>
        ${best ? `<td class="num">${r.prog?.best ? `<b>${Math.round(r.prog.best.acc * 100)}%</b>` : '—'}</td>` : ''}
        <td class="acts"><div class="row-actions">
          <button class="btn${r.cont ? ' primary' : ' ghost'}" data-play="${r.id}" data-mode="learn" aria-label="${r.cont ? (r.prog?.last ? 'Continue' : 'Start') : 'Learn'} ${esc(r.title)}">${r.cont ? icon('play') : ''}${r.cont ? (r.prog?.last ? 'Continue' : 'Start') : 'Learn'}</button>
          <button class="btn ghost" data-play="${r.id}" data-mode="perform" aria-label="Perform ${esc(r.title)}">Perform</button>
          ${r.tracks ? `<button class="btn ghost" data-tracks="${r.id}" aria-label="Options for ${esc(r.title)}">Options</button>` : ''}
        </div></td></tr>`,
        )
        .join('')
    : `<tr><td colspan="${best ? 5 : 4}" class="empty">${empty}</td></tr>`
  return `<table class="songs"><caption>${caption}</caption>
    <colgroup><col><col><col style="width:100px">${best ? '<col style="width:130px">' : ''}<col style="width:320px"></colgroup>
    <thead><tr><th scope="col"><span style="position:absolute;left:-9999px">Preview</span></th><th scope="col">Piece</th><th scope="col" class="num">Length</th>${best ? '<th scope="col" class="num">Best</th>' : ''}<th scope="col"><span style="position:absolute;left:-9999px">Actions</span></th></tr></thead>
    <tbody>${body}</tbody></table>`
}

export function gradeColor(g: string) {
  return g === 'S' ? 'var(--perfect)' : g === 'A' ? 'var(--great)' : g === 'B' || g === 'C' ? 'var(--good)' : 'var(--bad)' // the judgement spectrum only: the letter tells B from C
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const head = (title: string, actions = '', lede = '') =>
  `<div class="lib-head"><h1>${title}</h1>${lede ? `<p>${lede}</p>` : ''}${actions ? `<div class="head-actions">${actions}</div>` : ''}</div>`

const LEVELS = ['Beginner', 'Elementary', 'Intermediate']

/** The open library, grouped by level; each group folds away. Nothing here is committed copyrighted music: see Credits. */
function libraryTable(lib: LibraryEntry[], prog: Map<string, Progress>, meta: Map<string, { thumb: string; len: number }>) {
  if (!lib.length) return ''
  const groups = LEVELS.map((lv) => [lv, lib.filter((e) => e.level === lv)] as const).filter(([, es]) => es.length)
  return `<p class="label cap">Open library</p>${groups
    .map(
      ([lv, es], i) => `<details class="libgrp"${i === 0 ? ' open' : ''}><summary>${lv} <span>${es.length}</span></summary>
      <table class="songs"><caption class="sr-only">${lv}</caption><colgroup><col><col><col style="width:100px"><col style="width:60px"><col style="width:320px"></colgroup><tbody>${es
        .map(
          (e) => `<tr class="open" data-lib="${esc(e.id)}"><td class="thumb">${art(`lib:${e.id}`)}${meta.get(e.id)?.thumb ?? ''}</td><td class="name">${esc(e.title)}<small>${esc(e.composer)} · ${esc(licenceName(e.licence))}</small></td><td class="num len">${meta.has(e.id) ? mmss(meta.get(e.id)!.len) : ''}</td><td class="num">${prog.get(`lib:${e.id}`)?.best ? `<b>${Math.round(prog.get(`lib:${e.id}`)!.best!.acc * 100)}%</b>` : ''}</td><td class="acts"><div class="row-actions">
            <button class="btn ghost" data-libplay="${esc(e.id)}" data-mode="learn" aria-label="Learn ${esc(e.title)}">Learn</button>
            <button class="btn ghost" data-libplay="${esc(e.id)}" data-mode="perform" aria-label="Perform ${esc(e.title)}">Perform</button></div></td></tr>`,
        )
        .join('')}</tbody></table></details>`,
    )
    .join('')}`
}

export function creditsDialog(lib: LibraryEntry[]) {
  return `<header><h2>Credits</h2><button class="btn icon ghost" data-close aria-label="Close">${icon('x')}</button></header>
    <div class="body"><h3>Sounds</h3>
    <div class="credlist"><pre>Grand piano: Salamander Grand Piano by Alexander Holm\nLicence: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)</pre><pre>Electric piano: Wurlitzer EP200 by Greg Sullivan (sullivang.net), mapped by kinwie\nLicence: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)</pre><pre>Harp, church organ, strings: Versilian Community Sample Library (harp, organ sampled by Simon Dalzell of Ivy Audio) and VSCO 2 Community Edition, by Versilian Studios\nLicence: CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)</pre><pre>Music box: MuseScore_General, from FluidR3 by Frank Wen, adapted by S. Christian Collins\nLicence: MIT (https://ftp.osuosl.org/pub/musescore/soundfont/MuseScore_General/MuseScore_General_License.md)</pre></div>
    <h3>Scores</h3><p class="fine">Scores in the open library are public domain or openly licensed. Each piece keeps its own licence.</p>
    <div class="credlist">${lib.map((e) => `<pre>${esc(creditBlock(e))}</pre>`).join('')}</div></div>
    <footer><button class="btn" data-close>Close</button></footer>`
}

export function library(el: HTMLElement, starters: Row[], mine: Row[], err = '', lib: LibraryEntry[] = [], prog: Map<string, Progress> = new Map(), meta: Map<string, { thumb: string; len: number }> = new Map()) {
  el.innerHTML = `
    ${head('Songs', `<label class="btn" style="cursor:pointer">${icon('plus')}Add files<input id="file" type="file" accept=".mid,.midi,.musicxml,.xml,.mxl,audio/midi" multiple hidden></label>`)}
    <p class="err" role="alert" id="drop">${esc(err)}</p>
    ${table('Starter pieces', starters, '')}
    ${table('Your files', mine, 'Add a MIDI or MusicXML file, or drop one anywhere on this page.')}
    ${libraryTable(lib, prog, meta)}`
}

// ---------- choosing the tracks of a MIDI file ----------

export function tracksDialog(title: string, r: Report | undefined, pick: Selection, noteName: (p: number) => string, facts: [string, string][], order: number[] = []) {
  const hand = (t: TrackInfo): string => pick.hands[t.index] ?? 'auto'
  const used = r ? r.tracks.filter((t) => pick.tracks.includes(t.index)) : []
  const busy = r ? density(used, r.bars) : 0
  const multi = !!r && r.tracks.length > 1
  return `
    <header><div><h2>Options</h2><p>${esc(title)}</p></div><button class="btn icon ghost" data-close aria-label="Close">${icon('x')}</button></header>
    <div class="body">
    <dl class="facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    ${
      multi
        ? `<h3>Tracks</h3><p class="fine" id="tkSum" role="status">${used.length} of ${r!.tracks.length} in use${busy > COMFORT ? '. Crowded: try fewer.' : ''}</p>
    <div class="tklist">${[...r!.tracks]
      .sort((a, b) => (order.indexOf(a.index) + 1 || 99) - (order.indexOf(b.index) + 1 || 99))
      .map((t) => {
        const on = pick.tracks.includes(t.index)
        return `<div class="tkrow${t.percussion ? ' perc' : ''}">
        <label class="switch"><input type="checkbox" data-tk="${t.index}"${on ? ' checked' : ''}><i></i><span><b>${esc(t.name)}</b><small>${esc(t.program)}${t.percussion ? ', drums' : ''} · ${t.notes} notes · ${noteName(t.lo)} to ${noteName(t.hi)}</small></span></label>
        ${on ? `<select data-tkh="${t.index}" aria-label="Hand for ${esc(t.name)}"><option value="auto"${hand(t) === 'auto' ? ' selected' : ''}>By pitch</option><option value="R"${hand(t) === 'R' ? ' selected' : ''}>Right hand</option><option value="L"${hand(t) === 'L' ? ' selected' : ''}>Left hand</option></select>` : ''}</div>`
      })
      .join('')}</div>`
        : ''
    }
    </div>
    <footer><button class="btn ghost" id="tkRemove" title="Remove this file from this browser">Remove</button><span class="grow"></span><button class="btn ghost" id="tkShare" title="Share the original file">Share</button>${multi ? '<button class="btn ghost" id="tkAuto">Pick for me</button>' : ''}<button class="btn" id="tkCancel">${multi ? 'Cancel' : 'Close'}</button>${multi ? '<button class="btn primary" id="tkApply">Use these</button>' : ''}</footer>`
}

// ---------- results ----------

/** How hard the keys were struck: a histogram from soft to hard, then the average, spread and hand balance. */
/** How even the loudness was: a line of words, a bar for each note above or below its neighbours, and one thing to try. */
export function evenBlock(e: Evenness) {
  const scale = Math.max(e.band * 2, ...e.devs.map((x) => Math.abs(x.d ?? 0)))
  const w = Math.min(14, 380 / e.devs.length)
  const bars = e.devs
    .map((x, i) => {
      const h = x.d === null ? 0 : (Math.abs(x.d) / scale) * 34
      return x.d === null ? '' : `<rect class="${Math.abs(x.d) > e.band ? 'out' : ''}" x="${8 + i * (w + 1)}" y="${x.d >= 0 ? 36 - h : 36}" width="${w}" height="${Math.max(1, h)}" rx="1.5"/>`
    })
    .join('')
  const edge = (e.band / scale) * 34
  const word = { even: 'Even', nearly: 'Nearly even', uneven: 'Uneven' }[e.rating]
  return `<div>
    <svg class="hist even" viewBox="0 0 396 74" role="img" aria-label="Loudness of each note against its neighbours: ${Math.round(e.inside * 100)} percent within plus or minus ${e.band}"><rect class="band" x="0" y="${36 - edge}" width="396" height="${edge * 2}"/><line class="mid" x1="0" x2="396" y1="36" y2="36"/>${bars}<text x="6" y="72">softer than its neighbours below, louder above</text></svg>
    <div style="color:var(--ink-2)">Evenness: <b>${word}</b>, ${Math.round(e.inside * 100)}% of ${e.n} notes within ±${e.band}.${e.hint ? ` ${esc(e.hint)}` : ''}</div></div>`
}

export function touchBlock(t: TouchStats) {
  const peak = Math.max(1, ...t.hist)
  const bars = t.hist.map((n, i) => `<rect x="${i * 48 + 6}" y="${60 - (n / peak) * 56}" width="40" height="${(n / peak) * 56 + 0.5}" rx="2"/>`).join('')
  const x = 6 + (t.mean / 128) * 384
  const hand = t.hands.R.n && t.hands.L.n ? ` · right hand ${Math.round(t.hands.R.mean)}, left ${Math.round(t.hands.L.mean)}` : ''
  const regs = (['low', 'mid', 'high'] as const).filter((r) => t.regions[r].n >= 4)
  const where = regs.length >= 2 ? ` · ${regs.map((r) => `${r === 'mid' ? 'middle' : r} keys ${Math.round(t.regions[r].mean)}`).join(', ')}` : ''
  return `<div>
    <svg class="hist" viewBox="0 0 396 82" role="img" aria-label="Key velocity, soft to hard, average ${Math.round(t.mean)}">${bars}<line class="mid" x1="${x}" x2="${x}" y1="0" y2="62"/><text x="6" y="80">soft</text><text x="390" y="80" text-anchor="end">hard</text></svg>
    <div style="color:var(--ink-2)">Touch: average <b>${Math.round(t.mean)}</b> (${band(t.mean, settings.edges)}), spread ±${Math.round(t.sd)}${hand}${where}.</div></div>`
}

export function results(r: Result, next: Next | null, note = '') {
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
    <div class="big-grade">${perform ? `${Math.round(r.acc * 100)}%` : icon('check')}</div>
    <h2>${perform ? 'Song complete' : 'Cleared'}${r.rate < 1 ? ` at ${Math.round(r.rate * 100)}% tempo` : ''}</h2>
    <p class="line"><b>${Math.round(r.acc * 100)}%</b> accuracy · longest run <b>${r.maxCombo}</b> notes · <b>${r.wrong}</b> wrong ${r.wrong === 1 ? 'note' : 'notes'}${r.dyn === 'even' && r.touch.n >= 4 ? ` · spread <b>±${Math.round(r.touch.sd)}</b>` : ''}${r.touchPct >= 0 ? ` · touch in range <b>${Math.round(r.touchPct * 100)}%</b>` : ''}${perform && r.holds >= 0 ? ` · held <b>${Math.round(r.holds * 100)}%</b>` : ''}</p>
    ${
      perform
        ? `<div>
      <div class="counts"><span><i style="background:var(--perfect)"></i>Perfect ${r.counts.perfect}</span><span><i style="background:var(--great);border-radius:50%"></i>Great ${r.counts.great}</span><span><i style="background:var(--good);transform:rotate(45deg) scale(.85)"></i>Good ${r.counts.good}</span><span><i style="background:var(--bad);clip-path:polygon(50% 0,100% 100%,0 100%)"></i>Miss ${r.counts.miss}</span></div>
      <svg class="hist" viewBox="0 0 396 82" role="img" aria-label="Timing: ${lean}">${hist}<line class="mid" x1="198" x2="198" y1="0" y2="62"/><text x="198" y="80" text-anchor="middle">on time</text><text x="6" y="80">early</text><text x="390" y="80" text-anchor="end">late</text></svg>
      <div style="color:var(--ink-2)">${lean}</div></div>`
        : ''
    }
    ${r.touch.n >= 4 ? touchBlock(r.touch) : ''}
    ${r.even ? evenBlock(r.even) : ''}
    ${note ? `<p class="line">${note}</p>` : ''}
    <div class="row">
      ${next ? `<button class="btn primary big" id="next">${icon(next.kind === 'loop' ? 'loop' : 'play')}${next.label}</button>` : ''}
      <button class="btn ${next ? '' : 'primary big'}" id="again">${icon('restart')}Again</button>
      <button class="btn" id="toLib">Songs</button>
    </div>
  </div></div>`
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
  <label class="srow"><span>Count-in click</span><input id="sClick" type="range" min="0" max="1" step="0.05" value="${settings.click}" aria-label="Count-in click volume"></label>
  ${seg('coach', 'Touch coach', [['off', 'Off'], ['gentle', 'Gentle'], ['steady', 'Steady'], ['strict', 'Strict']], settings.coach)}
  ${seg('strict', 'Strictness', [['easy', 'Easy'], ['standard', 'Standard'], ['strict', 'Strict']], settings.strict)}
  <div class="srow"><span>Keyboard</span>${
    inputs.length > 1
      ? `<select id="sDevice"><option value="">All</option>${inputs.map((i) => `<option value="${esc(i.id)}"${i.id === settings.device ? ' selected' : ''}>${esc(i.name)}</option>`).join('')}</select>`
      : `<b>${inputs.length ? esc(inputs[0].name) : 'None found'}</b>`
  }</div>
  <p id="sMon" class="fine" role="status" hidden></p>
  <div class="srow"><span>Delay</span><div class="inl"><input id="sOffset" type="number" min="-300" max="300" step="5" value="${settings.offset}" aria-label="Delay in milliseconds"><small>ms</small><button class="btn" id="sCal">Calibrate</button></div></div>
  <div class="srow"><span>Data</span><div class="inl"><button class="btn sm" id="sExport">Export</button><button class="btn sm" id="sImport">Import</button><button class="btn sm" id="sClear">Clear</button><input id="sFile" type="file" accept="application/json,.json" hidden></div></div>
  <details><summary>Advanced</summary>
    <label class="switch"><input id="sNames" type="checkbox"${settings.names ? ' checked' : ''}><i></i>Note names</label>
    <label class="switch sub"><input id="sFade" type="checkbox"${settings.fade ? ' checked' : ''}${settings.names ? '' : ' disabled'}><i></i>Fade names I know</label>
    <label class="switch"><input id="sFull" type="checkbox"${settings.full ? ' checked' : ''}><i></i>All 88 keys</label>
    <label class="switch"><input id="sWritten" type="checkbox"${settings.asWritten ? ' checked' : ''}><i></i>Play the file's dynamics</label>
    <label class="srow"><span>Fall speed</span><span class="slider"><small>Slow</small><input id="sFall" type="range" min="1" max="5" step="0.5" value="${6.5 - settings.fall}"><small>Fast</small></span></label>
    <label class="srow"><span>Hand split</span><select id="sSplit">${[55, 57, 60, 62, 64].map((p) => `<option value="${p}"${p === settings.split ? ' selected' : ''}>${noteName(p)}</option>`).join('')}</select></label>
  </details>
  <p class="fine foot"><button class="link" id="sCredits">Credits</button> <button class="link" id="sHelp">Shortcuts</button></p>`
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
  due: number // seen cards whose review is due
}

const GROUPS: [string, (id: string) => boolean][] = [
  ['Treble clef', (id) => id.startsWith('t-')],
  ['Bass clef', (id) => id.startsWith('b-')],
  ['Both clefs', (id) => id === 'grand'],
  ['Accidentals and keys', (id) => id === 'sharps' || id === 'flats' || id.startsWith('keys-')],
  ['Melodies', (id) => id.startsWith('tune-')],
  ['Chords', (id) => id === 'ints' || id === 'triads'],
]

const meter = (pct: number, solid: boolean, label: string) =>
  `<div class="meter${solid ? ' solid' : ''}" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct * 100)}"><i style="width:${Math.round(pct * 100)}%"></i></div>`

export function readView(el: HTMLElement, rows: StageRow[], canReview: boolean, tab: 'stages' | 'run', run = '') {
  let group = ''
  const timed = rows.some((r) => r.rt) // no column of dashes before the first card
  const body = rows
    .map((r) => {
      const g = GROUPS.find(([, f]) => f(r.stage.id))![0]
      const band = g !== group ? `<tr class="band"><th colspan="${timed ? 4 : 3}" scope="colgroup">${g}</th></tr>` : ''
      group = g
      const pct = Math.round(r.pct * 100)
      return `${band}<tr>
        <td class="name">${esc(r.stage.name)}${r.next ? ' <span class="tag next">Next</span>' : ''}${r.due ? ` <span class="tag">${r.due} due</span>` : ''}<small>${esc(r.stage.blurb)}</small></td>
        <td><div class="mrow">${meter(r.pct, r.solid, `${esc(r.stage.name)} mastery`)}<b>${pct}%</b></div>${r.solid ? '<small style="color:var(--ink-3)">Solid</small>' : r.seen ? `<small style="color:var(--ink-3)">${r.seen} of ${r.total} seen</small>` : ''}</td>
        ${timed ? `<td class="num">${r.rt ? (r.rt / 1000).toFixed(1) + ' s' : ''}</td>` : ''}
        <td class="acts"><div class="row-actions"><button class="btn${r.next ? ' primary' : ' ghost'}" data-stage="${r.stage.id}" aria-label="Practice ${esc(r.stage.name)}">${r.next ? icon('play') : ''}Practice</button></div></td></tr>`
    })
    .join('')
  el.innerHTML = `
    ${head('Read', `${tab === 'stages' && canReview ? '<button class="btn" data-review="1">Review weak notes</button>' : ''}<div class="seg" role="radiogroup" aria-label="Read">${([['stages', 'Stages'], ['run', 'Sight Run']] as const).map(([v, l]) => `<label><input type="radio" name="readTab" value="${v}"${tab === v ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div>`)}
    ${tab === 'run' ? run : `<table class="songs stages"><caption class="sr-only">Stages</caption>
      <colgroup><col><col style="width:250px">${timed ? '<col style="width:120px">' : ''}<col style="width:150px"></colgroup>
      <thead><tr><th scope="col">Stage</th><th scope="col">Mastery</th>${timed ? '<th scope="col" class="num">Typical time</th>' : ''}<th scope="col"><span style="position:absolute;left:-9999px">Actions</span></th></tr></thead>
      <tbody>${body}</tbody></table>`}`
}

const opt = (v: string | number, label: string, cur: string | number) => `<option value="${v}"${String(v) === String(cur) ? ' selected' : ''}>${label}</option>`

export interface TouchCal {
  step: 0 | 1 | 2 // soft, medium, hard
  got: number // notes played in this step
}

export const CAL_STEPS = ['soft', 'medium', 'hard'] as const
export const CAL_NOTES = 10

/** The player's soft, medium and hard edges, and the ten-notes-each calibration that sets them. */
function touchStrip(cal: TouchCal | null, msg: string) {
  const e = settings.edges ?? DEFAULT_EDGES
  const inner = cal
    ? `<span>Play <b>${CAL_NOTES} ${CAL_STEPS[cal.step]}</b> notes: <b>${cal.got} of ${CAL_NOTES}</b></span>
       <span class="row-actions"><button class="btn" id="calCancel">Cancel</button></span>`
    : `<div class="bands" role="img" aria-label="Soft 1 to ${e.soft}, medium ${e.soft + 1} to ${e.hard - 1}, hard ${e.hard} to 127"><small class="label">Touch range</small><div><span style="flex:${e.soft}">Soft 1–${e.soft}</span><span style="flex:${e.hard - 1 - e.soft}">Medium ${e.soft + 1}–${e.hard - 1}</span><span style="flex:${128 - e.hard}">Hard ${e.hard}+</span></div></div>
       <span class="row-actions">${settings.edges ? '<button class="btn ghost" id="calReset">Use defaults</button>' : ''}<button class="btn" id="calStart">Set touch range</button></span>`
  return `<div class="tcard strip" role="status">${inner}</div>${msg ? `<p class="note" role="status">${esc(msg)}</p>` : ''}`
}

const KEY_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']

export interface PathRow {
  id: string
  label: string
  group: string
  state: 'new' | 'learning' | 'solid' | 'due'
}

export function techniqueView(el: HTMLElement, o: Opts, cal: TouchCal | null, msg = '', preview = '', path: PathRow[] = []) {
  const sel = (id: string, label: string, body: string) => `<label class="field"><span>${label}</span><select id="${id}">${body}</select></label>`
  const keyVal = `${o.tonic}${o.minor ? 'm' : ''}`
  const keys = (map: Record<number, number>, minor: boolean) =>
    Object.keys(map).map(Number).sort((a, b) => map[a] - map[b]).map((pc) => opt(`${pc}${minor ? 'm' : ''}`, `${KEY_NAMES[pc]} ${minor ? 'minor' : 'major'}`, keyVal)).join('')
  const rhythm = o.pattern === 'rhythm'
  el.innerHTML = `
    ${head('Technique')}
    <div class="tech-form">
      ${sel('tPattern', 'Pattern', Object.entries(PATTERNS).map(([v, l]) => opt(v, l, o.pattern)).join(''))}
      ${
        rhythm
          ? sel('tLevel', 'Level', [[1, 'Quarters and halves'], [2, 'Eighths'], [3, 'Dotted and off-beat']].map(([v, l]) => opt(v, l as string, o.level ?? 1)).join(''))
          : sel('tKey', 'Key', `<optgroup label="Major">${keys(KEYS, false)}</optgroup><optgroup label="Minor">${keys(KEYS_MINOR, true)}</optgroup>`) +
            sel('tHands', 'Hands', [['R', 'Right'], ['L', 'Left'], ['both', 'Both']].map(([v, l]) => opt(v, l, o.hands)).join('')) +
            sel('tDyn', 'Dynamics', Object.entries(DYNS).map(([v, l]) => opt(v, l, o.dyn)).join('')) +
            sel('tArtic', 'Articulation', Object.entries(ARTICS).map(([v, l]) => opt(v, l, o.artic ?? 'normal')).join(''))
      }
      ${sel('tBpm', 'Tempo', [50, 60, 72, 84, 96, 108, 120].map((b) => opt(b, `${b} bpm`, o.bpm)).join(''))}
      <button class="btn primary" id="tStart">${icon('play')}Start</button>
    </div>
    ${preview ? `<div class="tprev thumb">${preview}</div>` : ''}
    ${touchStrip(cal, msg)}
    ${pathBlock(path)}`
}

const STATE_WORD = { new: '', learning: 'Learning', solid: 'Solid', due: 'Due' }

/** The syllabus: what is next, with the rest folded away. Every row starts on its own; nothing is locked. */
function pathBlock(path: PathRow[]) {
  if (!path.length) return ''
  const solid = path.filter((p) => p.state === 'solid').length
  const row = (p: PathRow) =>
    `<div class="prow"><div class="pwho"><b>${esc(p.label.charAt(0).toUpperCase() + p.label.slice(1))}${p.state === 'due' ? ' <span class="tag">Due</span>' : ''}</b><span>${p.state === 'learning' ? 'Learning' : p.state === 'solid' ? 'Solid' : ''}</span></div><div class="pact"><button class="btn ghost" data-recipe="${esc(p.id)}">Start</button></div></div>`
  const next = path.filter((p) => p.state !== 'solid').slice(0, 5)
  const rest = path.filter((p) => !next.includes(p))
  return `<p class="label cap">Path · ${solid} of ${path.length} solid</p>
    <div class="plan">${next.map(row).join('')}</div>
    ${rest.length ? `<details class="all"><summary>${rest.length} more</summary><div class="plan">${rest.map(row).join('')}</div></details>` : ''}`
}

export interface TodayData {
  last: { id: string; title: string; sub: string; first: boolean }
  read: { id: string; name: string; pct: number; line: string }
  tech: string
  techDue: boolean
  techId: string
  fix?: { id: string; title: string; a: number; b: number } // the worst bars of the piece played last
  review?: { name: string; id: string; line: string } // a second reading stage, for the longest plan
  week: { days: { key: string; label: string; played: boolean; today: boolean }[]; minutes: number }
  goal: number
  planMin: 5 | 10 | 20
  done: string[] // steps finished today
  recap?: { minutes: number; played: number; suggest: number; better?: string } // last week, shown early in the week
}

const weekBlock = (w: TodayData['week'], goal: number) => `
  <div class="week" role="img" aria-label="${w.days.filter((d) => d.played).length} days practised this week, ${w.minutes} of ${goal} minutes">
    ${w.days.map((d) => `<span class="day${d.played ? ' on' : ''}${d.today ? ' today' : ''}"><i></i>${d.label}</span>`).join('')}
  </div>
  <div class="goal"><div class="meter${w.minutes >= goal ? ' solid' : ''}"><i style="width:${Math.min(100, Math.round((w.minutes / goal) * 100))}%"></i></div><span><b>${w.minutes}</b> of ${goal} min</span></div>`

/** The day as a short list in practice order; nothing is locked and each row stands alone. */
export function todayView(el: HTMLElement, d: TodayData) {
  type R = { key: string; min: number; title: string; sub: string; mid?: string; act: (cls: string) => string }
  const all: R[] = [
    { key: 'warm', min: 2, title: d.tech, sub: d.techDue && !d.done.includes('warm') ? 'Exercise, due for review' : 'Exercise', act: (c) => `<button class="btn${c}" data-today="tech" data-id="${esc(d.techId)}">${c.includes('primary') ? icon('play') : ''}Start</button>` },
    { key: 'read', min: 3, title: d.read.name, sub: d.read.line, mid: `<div class="mrow">${meter(d.read.pct, false, 'Mastery')}<b>${Math.round(d.read.pct * 100)}%</b></div>`, act: (c) => `<button class="btn${c}" data-today="read" data-id="${d.read.id}">${c.includes('primary') ? icon('play') : ''}Practice</button>` },
    { key: 'piece', min: 5, title: d.last.title, sub: d.last.sub, act: (c) => `<button class="btn${c}" data-today="continue" data-id="${d.last.id}">${c.includes('primary') ? icon('play') : ''}${d.last.first ? 'Start' : 'Continue'}</button>` },
    ...(d.fix ? [{ key: 'fix', min: 4, title: `Bars ${d.fix.a + 1} to ${d.fix.b + 1} of ${d.fix.title}`, sub: 'Slow loop at 70%', act: (c: string) => `<button class="btn${c}" data-today="fix" data-id="${d.fix!.id}" data-a="${d.fix!.a}" data-b="${d.fix!.b}">${icon('loop')}Loop</button>` }] : []),
    ...(d.review ? [{ key: 'review', min: 6, title: d.review.name, sub: d.review.line, act: (c: string) => `<button class="btn${c}" data-today="read" data-id="${d.review!.id}">${c.includes('primary') ? icon('play') : ''}Practice</button>` }] : []),
  ]
  const keep: Record<number, string[]> = { 5: ['warm', 'read'], 10: ['warm', 'read', 'piece'], 20: ['warm', 'read', 'piece', 'fix', 'review'] }
  const plan = all.filter((r) => keep[d.planMin].includes(r.key))
  // what is still to do comes first, in practice order; finished steps sink to the bottom as a record of the day
  const ordered = [...plan.filter((r) => !d.done.includes(r.key)), ...plan.filter((r) => d.done.includes(r.key))]
  const first = ordered.find((r) => !d.done.includes(r.key))
  const rows = ordered
    .map((r) => {
      const done = d.done.includes(r.key)
      const cls = r === first ? ' primary' : done ? ' ghost' : ''
      return `<div class="prow${done ? ' done' : ''}"><span class="plead">${done ? icon('check') : ''}</span><div class="pwho"><b>${esc(r.title)}</b><span>${esc(r.sub)}${done ? '' : ` · about ${r.min} min`}</span></div>${r.mid ?? ''}${r.key === 'piece' ? art(d.last.id, 'art lead') : ''}<div class="pact">${r.act(cls)}</div></div>`
    })
    .join('')
  el.innerHTML = `
    ${head('Today', `<span class="plan-cap">Plan</span><div class="seg" role="radiogroup" aria-label="Plan length">${[5, 10, 20].map((m) => `<label><input type="radio" name="planMin" value="${m}"${d.planMin === m ? ' checked' : ''}><span>${m} min</span></label>`).join('')}</div>`)}
    ${d.recap ? `<section class="tcard recap" aria-label="Last week"><span>Last week: <b>${d.recap.minutes} min</b> on ${d.recap.played} ${d.recap.played === 1 ? 'day' : 'days'}.${d.recap.better ? ` Most improved: ${esc(d.recap.better)}.` : ''}</span>${d.recap.suggest > d.goal ? `<button class="btn ghost" data-goal="${d.recap.suggest}">Aim for ${d.recap.suggest} min</button>` : ''}</section>` : ''}
    <section class="tcard span" aria-label="This week">${weekBlock(d.week, d.goal)}</section>
    <div class="plan">${rows}</div>`
}

export interface ProgressData {
  week: TodayData['week']
  goal: number
  stages: StageRow[]
  tech: PathRow[]
  log: TouchEntry[]
}

export function progressView(el: HTMLElement, d: ProgressData) {
  const solid = d.stages.filter((r) => r.solid).length
  const runs = d.log.filter((r) => r.id !== 'calibration')
  const pts = runs.slice(-30)
  const e = settings.edges ?? DEFAULT_EDGES
  const X = (i: number) => 8 + (pts.length > 1 ? (i / (pts.length - 1)) * 584 : 292)
  const Y = (v: number) => 146 - (v / 127) * 140
  const spark = pts.length
    ? `<svg class="hist spark" viewBox="0 0 600 150" role="img" aria-label="Average velocity of your last ${pts.length} sessions">
        <line class="mid" x1="8" x2="592" y1="${Y(e.soft)}" y2="${Y(e.soft)}" stroke-dasharray="3 5"/><line class="mid" x1="8" x2="592" y1="${Y(e.hard)}" y2="${Y(e.hard)}" stroke-dasharray="3 5"/><text x="592" y="${Y(e.hard) - 5}" text-anchor="end">hard</text><text x="592" y="${Y(e.soft) - 5}" text-anchor="end">soft</text>
        <polyline points="${pts.map((r, i) => `${X(i)},${Y(r.mean)}`).join(' ')}"/>${pts.map((r, i) => `<circle cx="${X(i)}" cy="${Y(r.mean)}" r="3.5"/>`).join('')}</svg>`
    : ''
  const rows = runs
    .slice(-8)
    .reverse()
    .map((r) => `<tr><td>${new Date(r.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td><td class="name">${esc(r.title)}<small>${esc(r.mode)}</small></td><td class="num">${Math.round(r.mean)}</td><td class="num">±${Math.round(r.sd)}</td><td class="num">${r.R.n && r.L.n ? `${Math.round(r.R.mean)} / ${Math.round(r.L.mean)}` : ''}</td></tr>`)
    .join('')
  el.innerHTML = `
    ${head('Progress')}
    <h2 class="sec">This week</h2>
    <div class="tcard">${weekBlock(d.week, d.goal)}
      <label class="field inline"><span>Weekly goal</span><select id="pGoal">${[30, 60, 90, 120, 180].map((m) => opt(m, `${m} min`, d.goal)).join('')}</select></label></div>
    <h2 class="sec">Reading</h2>
    <p class="note">${solid} of ${d.stages.length} stages solid.</p>
    <div class="cells">${GROUPS.map(([g, f]) => {
      const rs = d.stages.filter((r) => f(r.stage.id))
      return `<div class="cgrp" role="group" aria-label="${g}, ${rs.filter((r) => r.solid).length} of ${rs.length} solid"><small class="label">${g}</small><div class="crow">${rs.map((r) => `<button class="cell${r.solid ? ' solid' : ''}" data-stage="${r.stage.id}" title="${esc(r.stage.name)}, ${Math.round(r.pct * 100)}%" aria-label="${esc(r.stage.name)}, ${Math.round(r.pct * 100)}%${r.solid ? ', solid' : ''}"><b style="height:${Math.round(r.pct * 100)}%"></b></button>`).join('')}</div></div>`
    }).join('')}</div>
    <h2 class="sec">Technique</h2>
    <p class="note">${d.tech.filter((t) => t.state === 'solid').length} of ${d.tech.length} exercises solid${d.tech.some((t) => t.state === 'due') ? `, ${d.tech.filter((t) => t.state === 'due').length} due` : ''}.</p>
    <div class="cells">${[...new Set(d.tech.map((t) => t.group))]
      .map((g) => {
        const ts = d.tech.filter((t) => t.group === g)
        return `<div class="cgrp" role="group" aria-label="${esc(g)}, ${ts.filter((t) => t.state === 'solid').length} of ${ts.length} solid"><small class="label">${esc(g)}</small><div class="crow">${ts
          .map((t) => `<button class="cell${t.state === 'solid' ? ' solid' : t.state === 'due' ? ' due' : ''}" data-recipe="${t.id}" title="${esc(t.label)}${STATE_WORD[t.state] ? ', ' + STATE_WORD[t.state].toLowerCase() : ''}" aria-label="${esc(t.label)}${STATE_WORD[t.state] ? ', ' + STATE_WORD[t.state].toLowerCase() : ''}"><b style="height:${t.state === 'solid' || t.state === 'due' ? 100 : t.state === 'learning' ? 50 : 0}%"></b></button>`)
          .join('')}</div></div>`
      })
      .join('')}</div>
    <h2 class="sec">Touch</h2>
    ${spark ? `${spark}<table class="songs"><caption class="sr-only">Recent sessions</caption><thead><tr><th scope="col">Date</th><th scope="col">Piece</th><th scope="col" class="num">Average</th><th scope="col" class="num">Spread</th><th scope="col" class="num">Right / left</th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="note">Finish a song on a real keyboard and its touch shows up here.</p>'}`
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

// ---------------------------------------------------------------- Sight Run

const CLEFS = { treble: 'Treble', bass: 'Bass', grand: 'Grand staff' } as const
const RANGES: Record<RunSpec['clef'], [string, number, number][]> = {
  treble: [['Middle C octave', 60, 72], ['Five fingers', 60, 67], ['The staff', 64, 77], ['With ledger lines', 60, 84]],
  bass: [['Octave below', 48, 60], ['Five fingers', 48, 55], ['The staff', 43, 57], ['With ledger lines', 36, 60]],
  grand: [['Around middle C', 55, 67], ['The staff', 43, 77], ['Wide', 36, 84]],
}
export const RUN_START: Record<RunSpec['clef'], [number, number]> = { treble: [60, 72], bass: [48, 60], grand: [43, 77] }
const WHITE = (p: number) => ![1, 3, 6, 8, 10].includes(p % 12)
const KEYS_RUN: [number, string][] = [[1, 'Key of G'], [2, 'Key of D'], [3, 'Key of A'], [4, 'Key of E'], [-1, 'Key of F'], [-2, 'Key of B♭'], [-3, 'Key of E♭'], [-4, 'Key of A♭']]
export const runNotes = (s: RunSpec) => (s.fifths ? KEYS_RUN.find(([f]) => f === s.fifths)?.[1] ?? 'In a key' : s.acc === 'nat' ? 'Naturals' : s.acc === 'sharp' ? 'With sharps' : 'With flats')
export const runTitle = (s: RunSpec) => `${CLEFS[s.clef]} ${noteName(s.lo, s.fifths)} to ${noteName(s.hi, s.fifths)}${s.size === 2 ? ', intervals' : s.size === 3 ? ', triads' : ''}`
const runLine = (s: RunSpec) => `${runTitle(s)} · ${runNotes(s)}${s.length ? ` · ${s.length} cards` : ''}`

/** The Sight Run builder on the Read page, and the saved runs under it. */
export function runForm(s: RunSpec, presets: RunSpec[], best: Record<string, { streak: number; ms: number }>, bestKey: (s: RunSpec) => string) {
  const [min, max] = LIMITS[s.clef]
  const names = Array.from({ length: max - min + 1 }, (_, i) => min + i).filter(WHITE)
  const picks = (cur: number) => names.map((p) => `<option value="${p}"${p === cur ? ' selected' : ''}>${noteName(p)}</option>`).join('')
  const field = (id: string, label: string, body: string) => `<label class="field"><span>${label}</span><select id="${id}"${id === 'rNotes' && s.size > 1 ? ' disabled' : ''}>${body}</select></label>`
  const slider = (id: string, label: string, lo: string, hi: string, v: number) => `<label class="field"><span>${label}</span><span class="slider"><small>${lo}</small><input id="${id}" type="range" min="0" max="1" step="0.1" value="${v}"><small>${hi}</small></span></label>`
  const notes = s.fifths ? `k${s.fifths}` : s.acc
  const saved = presets
    .map((p, i) => {
      const b = best[bestKey(p)]
      return `<div class="prow"><div class="pwho"><b>${esc(p.name ?? runTitle(p))}</b><span>${esc(runLine(p))}${b ? ` · Longest streak ${b.streak}` : ''}</span></div><div class="pact"><button class="btn ghost" data-runp="${i}">Start</button><button class="btn icon ghost" data-rund="${i}" aria-label="Remove ${esc(p.name ?? runTitle(p))}">${icon('x')}</button></div></div>`
    })
    .join('')
  const b = best[bestKey(s)]
  return `<section class="tcard run" aria-label="Sight Run">
    <div class="run-head"><div><h2>Sight Run</h2><p class="fine">Build your own reading run: pick the range and how the notes jump about. It waits for you, and keeps going until you finish.</p></div></div>
    <div class="tech-form">
      ${field('rClef', 'Clef', Object.entries(CLEFS).map(([v, l]) => `<option value="${v}"${v === s.clef ? ' selected' : ''}>${l}</option>`).join(''))}
      ${field('rLo', 'From', picks(s.lo))}
      ${field('rHi', 'To', picks(s.hi))}
      ${field('rNotes', 'Notes', [['nat', 'Naturals'], ['sharp', 'With sharps'], ['flat', 'With flats']].map(([v, l]) => `<option value="${v}"${v === notes ? ' selected' : ''}>${l}</option>`).join('') + KEYS_RUN.map(([f, l]) => `<option value="k${f}"${notes === `k${f}` ? ' selected' : ''}>${l}</option>`).join(''))}
      ${field('rSize', 'Cards', [[1, 'Single notes'], [2, 'Intervals'], [3, 'Triads']].map(([v, l]) => `<option value="${v}"${v === s.size ? ' selected' : ''}>${l}</option>`).join(''))}
      ${field('rLength', 'Length', [[0, 'Endless'], [10, '10 cards'], [25, '25 cards'], [50, '50 cards'], [100, '100 cards']].map(([v, l]) => `<option value="${v}"${v === s.length ? ' selected' : ''}>${l}</option>`).join(''))}
      ${field('rAhead', 'Reading ahead', [[0, 'Whole set shown'], [4, 'Next 4 notes'], [3, 'Next 3 notes'], [2, 'Next 2 notes'], [1, 'Only the next note']].map(([v, l]) => `<option value="${v}"${v === s.ahead ? ' selected' : ''}>${l}</option>`).join(''))}
      ${slider('rNear', 'Jumps', 'Leaps', 'Steps', s.near)}
      ${slider('rWeak', 'Shuffle', 'Even', 'My weak notes', s.weak)}
    </div>
    <div class="chips" role="group" aria-label="Ranges">${RANGES[s.clef].map(([l, lo, hi]) => `<button class="chip-btn${s.lo === lo && s.hi === hi ? ' on' : ''}" data-rr="${lo}:${hi}">${l}</button>`).join('')}</div>
    <div class="run-opts">
      <label class="switch"><input type="checkbox" id="rWiden"${s.widen ? ' checked' : ''}><i></i><span><b>Widen as I improve</b><small>A clean set adds a note to the range</small></span></label></div>
    <div class="row-actions run-go">${b ? `<span class="fine">Your longest streak on this range: <b>${b.streak}</b></span>` : ''}<button class="btn ghost" id="rSave">Save this run</button><button class="btn primary" id="rStart">${icon('play')}Start</button></div>
    ${saved ? `<p class="label cap">Your runs</p><div class="plan">${saved}</div>` : ''}
  </section>`
}

export interface RunSummary {
  spec: RunSpec
  arc: Tally
  medianMs: number
  record: boolean
  best?: { streak: number; ms: number }
  notes: { p: number; n: number; miss: number; ms: number }[]
  weakest: string[]
}

export function runResults(d: RunSummary) {
  const secs = (ms: number) => (ms / 1000).toFixed(1) + ' s'
  const top = Math.max(3000, ...d.notes.map((n) => n.ms / n.n))
  const strip = [...d.notes]
    .sort((a, b) => a.p - b.p)
    .map((n) => `<div class="hbar" style="--h:${Math.round(((n.ms / n.n) / top) * 100)}%;--m:${Math.round((n.miss / n.n) * 100)}%" title="${esc(noteName(n.p, d.spec.fifths))}: ${secs(n.ms / n.n)}, ${n.miss} missed of ${n.n}"><i></i><span>${esc(noteName(n.p, d.spec.fifths))}</span></div>`)
    .join('')
  return `
  <div class="results"><div class="card" style="grid-template-columns:1fr" role="dialog" aria-label="Run results">
    <h2>${esc(d.spec.name ?? runTitle(d.spec))}</h2>
    <p class="line"><b>${d.arc.cards}</b> cards · <b>${d.arc.cards ? Math.round((d.arc.clean / d.arc.cards) * 100) : 0}%</b> first try · best streak <b>${d.arc.best}</b> · median <b>${secs(d.medianMs)}</b> a card${d.record ? ' <span class="tag next">Longest yet on this range</span>' : d.best ? ` · your longest here is ${d.best.streak}` : ''}</p>
    ${strip ? `<div><p class="line" style="margin-bottom:6px">Every note you met: taller is slower, redder is missed more</p><div class="hstrip" role="img" aria-label="Speed and misses for each note">${strip}</div></div>` : ''}
    ${d.weakest.length ? `<p class="line">Needs the most work: <b>${d.weakest.map(esc).join(', ')}</b></p>` : ''}
    <div class="row"><button class="btn primary big" id="runAgain">${icon('restart')}Run again</button><button class="btn" id="toStages">Back to Read</button></div>
  </div></div>`
}

// ---------------------------------------------------------------- Scales

export interface ScaleRow {
  stage: ScaleStage
  pct: number
  solid: boolean
  done: number
  total: number
  next: boolean
  card: Card
}
export interface ScalePick extends Card {
  bpm: number
}

const HANDS = { R: 'Right hand', L: 'Left hand', both: 'Hands together' } as const
const FORMS: Record<Form, string> = { major: 'Major', natural: 'Natural minor', harmonic: 'Harmonic minor', melodic: 'Melodic minor' }
export const cardName = (c: Card) => `${keyName(c.tonic, c.form)}, ${HANDS[c.hands].toLowerCase()}, ${c.oct === 1 ? 'one octave' : 'two octaves'}`

export interface QuizState {
  cards: QCard[]
  i: number
  ok: number
  streak: number
  best: number
  picked?: number // set once the card is answered
}

const DEG = [1, 2, 3, 4, 5, 6, 7]

/** One card of the quiz: which degree takes the 4th finger. After the answer it shows the reason. */
function quizBody(q: QuizState) {
  if (q.i >= q.cards.length)
    return `<section class="tcard run" aria-label="Quiz results"><h2>${q.ok} of ${q.cards.length}</h2><p class="line">Best streak <b>${q.best}</b>. ${q.ok === q.cards.length ? 'Every key.' : 'The keys you missed come back sooner next time.'}</p><div class="row-actions run-go"><button class="btn primary" id="qAgain">${icon('restart')}Again</button></div></section>`
  const c = q.cards[q.i]
  const done = q.picked !== undefined
  const right = done && quizRight(c, q.picked!)
  const hand = c.hand === 'R' ? 'right hand' : 'left hand'
  return `<section class="tcard run" aria-label="Quiz"><p class="fine">Card ${q.i + 1} of ${q.cards.length}${q.streak > 1 ? ` · streak ${q.streak}` : ''}</p>
    <h2>${esc(keyName(c.tonic, c.form))}, ${hand}</h2>
    <p class="line">Which degree takes the 4th finger? Press the note on your keyboard, or tap a number.</p>
    <div class="chips" role="group" aria-label="Degree">${DEG.map((d) => `<button class="chip-btn${done && d === q.picked ? ' on' : ''}" data-qd="${d}"${done ? ' disabled' : ''} aria-label="Degree ${d}, ${degreeName(c.tonic, c.form, d)}">${d}</button>`).join('')}</div>
    ${done ? `<p class="line" role="status"><b>${right ? 'Yes.' : 'Not quite.'}</b> ${esc(why(c.tonic, c.form, c.hand))} Up the scale: <b>${fingering(c.tonic, c.form, c.hand).split('').join(' ')}</b>.</p><div class="row-actions run-go"><button class="btn primary" id="qNext">${q.i + 1 === q.cards.length ? 'Finish' : 'Next'}</button></div>` : ''}</section>`
}

export function scalesView(el: HTMLElement, rows: ScaleRow[], tab: 'stages' | 'pick' | 'quiz', p: ScalePick, quiz?: QuizState) {
  const minor = p.form !== 'major'
  const names = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']
  const mnames = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B']
  const f = (h: 'R' | 'L') => fingering(p.tonic, p.form, h).split('').join(' ')
  const shaky = (['R', 'L'] as const).filter((h) => UNCHECKED.has(`${minor ? 'm' : 'M'}${p.tonic}:${h}`))
  const field = (id: string, label: string, body: string) => `<label class="field"><span>${label}</span><select id="${id}">${body}</select></label>`
  const body =
    tab === 'quiz' && quiz
      ? quizBody(quiz)
      : tab === 'stages'
      ? `<table class="songs stages"><caption class="sr-only">Scale stages</caption>
      <colgroup><col><col style="width:250px"><col style="width:150px"></colgroup>
      <thead><tr><th scope="col">Stage</th><th scope="col">Solid</th><th scope="col"><span style="position:absolute;left:-9999px">Actions</span></th></tr></thead>
      <tbody>${rows
        .map(
          (r) => `<tr><td class="name">${esc(r.stage.name)}${r.next ? ' <span class="tag next">Next</span>' : ''}<small>${esc(r.stage.blurb)} Eighth notes at ${r.stage.bpm}.${r.solid ? '' : ` Up next: ${esc(cardName(r.card))}.`}</small></td>
        <td><div class="mrow">${meter(r.pct, r.solid, `${esc(r.stage.name)} solid`)}<b>${Math.round(r.pct * 100)}%</b></div><small style="color:var(--ink-3)">${r.done} of ${r.total} solid</small></td>
        <td class="acts"><div class="row-actions"><button class="btn${r.next ? ' primary' : ' ghost'}" data-sstage="${r.stage.id}" aria-label="Practice ${esc(r.stage.name)}">${r.next ? icon('play') : ''}Practice</button></div></td></tr>`,
        )
        .join('')}</tbody></table>
      <p class="fine" style="margin-top:12px">A scale is solid when three runs in a row are clean, in time and even in touch. A scale you miss starts its count again.</p>`
      : `<section class="tcard run" aria-label="Choose a scale"><div class="tech-form">
      ${field('sgForm', 'Scale', Object.entries(FORMS).map(([v, l]) => `<option value="${v}"${v === p.form ? ' selected' : ''}>${l}</option>`).join(''))}
      ${field('sgKey', 'Key', (minor ? mnames : names).map((n, i) => `<option value="${i}"${i === p.tonic ? ' selected' : ''}>${n}</option>`).join(''))}
      ${field('sgHands', 'Hands', Object.entries(HANDS).map(([v, l]) => `<option value="${v}"${v === p.hands ? ' selected' : ''}>${l}</option>`).join(''))}
      ${field('sgOct', 'Octaves', [[1, 'One'], [2, 'Two']].map(([v, l]) => `<option value="${v}"${v === p.oct ? ' selected' : ''}>${l}</option>`).join(''))}
      ${field('sgBpm', 'Tempo', [50, 60, 66, 72, 80, 90, 100, 112, 120].map((b) => `<option value="${b}"${b === p.bpm ? ' selected' : ''}>${b}, eighth notes</option>`).join(''))}
    </div>
    <p class="line">Fingering up the scale: right hand <b>${f('R')}</b>, left hand <b>${f('L')}</b>.</p>
    <p class="fine">${esc(why(p.tonic, p.form, 'R'))}</p><p class="fine">${esc(why(p.tonic, p.form, 'L'))}</p>
    ${shaky.length ? `<p class="fine">The ${shaky.map((h) => (h === 'R' ? 'right' : 'left')).join(' and ')}-hand fingering for this key is still to be checked against a printed book; your teacher or book wins.</p>` : ''}
    <div class="row-actions run-go"><button class="btn primary" id="sgStart">${icon('play')}Start</button></div></section>`
  el.innerHTML = `
    ${head('Scales', `<div class="seg" role="radiogroup" aria-label="Scales">${([['stages', 'Stages'], ['pick', 'Choose a scale'], ['quiz', 'Quiz']] as const).map(([v, l]) => `<label><input type="radio" name="scaleTab" value="${v}"${tab === v ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div>`)}
    ${body}`
}

// ---------------------------------------------------------------- Theory

export interface TheoryRunView {
  trainer: Trainer
  cards: TCard[]
  i: number
  step: number // which chord of a progression is being asked
  ok: number
  streak: number
  best: number
  answered?: 'ok' | 'miss'
  missed: string[]
  medianMs: number
}

/** The trainer list, or one card of a session, or its results. */
export function theoryView(el: HTMLElement, levels: Record<Trainer, number>, run?: TheoryRunView) {
  let body: string
  if (!run) {
    body = `<div class="plan">${TRAINERS.map(
      (t) => `<div class="prow"><div class="pwho"><b>${esc(t.name)}</b><span>${esc(t.blurb)}</span></div>
      ${t.levels.length ? `<label class="field inline"><span class="sr-only">Level of ${esc(t.name)}</span><select data-tlevel="${t.id}">${t.levels.map((l, i) => `<option value="${i + 1}"${levels[t.id] === i + 1 ? ' selected' : ''}>Level ${i + 1}: ${esc(l)}</option>`).join('')}</select></label>` : ''}
      <div class="pact"><button class="btn ghost" data-trainer="${t.id}">Start</button></div></div>`,
    ).join('')}</div>
    <p class="fine" style="margin-top:12px">Every answer is played on your keyboard, in any octave. A session is 15 cards; the ones you miss come back sooner.</p>`
  } else if (run.i >= run.cards.length) {
    const n = run.cards.length
    body = `<section class="tcard run" aria-label="Session results"><h2>${run.ok} of ${n} first time</h2>
      <p class="line">Best streak <b>${run.best}</b> · median <b>${(run.medianMs / 1000).toFixed(1)} s</b> a card.${run.missed.length ? ` Missed: ${run.missed.map(esc).join('; ')}.` : ' Every one.'}</p>
      <div class="row-actions run-go"><button class="btn ghost" id="thMenu">All trainers</button><button class="btn primary" id="thAgain">${icon('restart')}Again</button></div></section>`
  } else {
    const c = run.cards[run.i]
    const t = TRAINERS.find((x) => x.id === run.trainer)!
    body = `<section class="tcard run" aria-label="${esc(t.name)}"><p class="fine">${esc(t.name)} · card ${run.i + 1} of ${run.cards.length}${run.streak > 1 ? ` · streak ${run.streak}` : ''}</p>
      <h2>${esc(c.prompt)}</h2>
      ${c.steps.length > 1 ? `<p class="line">Chord <b>${Math.min(run.step + 1, c.steps.length)}</b> of ${c.steps.length}</p>` : ''}
      <p class="line" role="status">${run.answered === 'ok' ? '<b>Yes.</b>' : run.answered === 'miss' ? `<b>Not quite.</b> ${esc(c.show)}.` : 'Play it on your keyboard.'}</p>
      <div class="row-actions run-go"><button class="btn ghost" id="thMenu">Stop</button>${run.answered === 'miss' ? '<button class="btn primary" id="thNext">Next</button>' : ''}</div></section>`
  }
  el.innerHTML = `${head('Theory')}${body}`
}
