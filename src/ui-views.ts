import { inputs } from './midi'
import { keyboardLine } from './guide'
import { cardName, CAL_NOTES, CLEFS, HANDS, head, meter, runTitle, type TodayData, weekBlock } from './ui'
import { icon } from './icons'
import { noteName } from './spell'
import { settings } from './settings'
import type { HistoryEntry, TouchEntry } from './store'
import { fluentMs, type Stage, type Stats } from './drill'
import { LIMITS, type RunSpec } from './run'
import { PACE, type Pace } from './paced'
import { TRAINERS, untimed } from './theory'
import type { TCard, Trainer } from './theory-cards'
import { earAsk, earBlock, replayBtn, type EarView } from './ear'
import { isPulse, pulseBars } from './pulse'
import { checkNote, degreeName, explain, fingering, keyLabels, keyName, quizRight, why, type Card, type Form, type QCard, type Stage as ScaleStage } from './scales'
import { DEFAULT_EDGES } from './touch'
import { ARTICS, DYNS, KEYS, KEYS_MINOR, PATTERNS, type Opts } from './technique'
import { pathSection } from './habit-ui'
import type { Level, Row as GradeRow } from './grades'
import type { LadderLevel } from './ladder'
import type { Streak } from './streak'
import { esc } from './util'

// ---------- reading drills ----------

export interface StageRow {
  stage: Stage
  pct: number
  solid: boolean
  seen: number
  total: number
  rt: number // mean response time of seen cards, ms (0 = none yet)
  fluent: number // 0..1, mastery against the Fluent clock
  fast: boolean // the Fluent tier reached
  next: boolean
  due: number // seen cards whose review is due
}

const GROUPS: [string, (id: string) => boolean][] = [
  ['Treble clef', (id) => id.startsWith('t-')],
  ['Bass clef', (id) => id.startsWith('b-')],
  ['Both clefs', (id) => id === 'mixed' || id === 'grand' || id === 'oct8'],
  ['Accidentals and keys', (id) => id === 'sharps' || id === 'flats' || id.startsWith('keys-')],
  ['Melodies', (id) => id.startsWith('tune-')],
  ['Chords', (id) => id === 'ints' || id === 'triads'],
]


export function readView(el: HTMLElement, rows: StageRow[], canReview: boolean, tab: 'stages' | 'run', run = '') {
  let group = ''
  const timed = rows.some((r) => r.rt) // no column of dashes before the first card
  const body = rows
    .map((r) => {
      const g = GROUPS.find(([, f]) => f(r.stage.id))![0]
      const band = g !== group ? `<tr class="band"><th colspan="${timed ? 4 : 3}" scope="colgroup">${g}</th></tr>` : ''
      group = g
      const pct = Math.round(r.pct * 100)
      const speed = r.solid && !r.fast && !r.next // Solid, not yet Fluent: the button practises against the tighter clock
      const sub = r.fast ? '' : r.solid ? `Solid · Fluent at ${fluentMs(r.stage) / 1000} s` : r.seen ? `${r.seen} of ${r.total} seen` : ''
      return `${band}<tr>
        <td class="name">${esc(r.stage.name)}${r.next ? ' <span class="tag next">Next</span>' : ''}${r.fast ? ' <span class="tag">Fluent</span>' : ''}${r.due ? ` <span class="tag">${r.due} due</span>` : ''}<small>${esc(r.stage.blurb)}</small></td>
        <td><div class="mrow">${meter(r.pct, r.solid, `${esc(r.stage.name)} mastery`, r.fluent)}<b>${r.solid ? Math.round(r.fluent * 100) : pct}%</b></div>${sub ? `<small style="color:var(--ink-3)">${sub}</small>` : ''}</td>
        ${timed ? `<td class="num">${r.rt ? (r.rt / 1000).toFixed(1) + ' s' : ''}</td>` : ''}
        <td class="acts"><div class="row-actions"><button class="btn${r.next ? ' primary' : ' ghost'}" data-stage="${r.stage.id}"${speed ? ' data-fast="1"' : ''} aria-label="Practice ${esc(r.stage.name)}${speed ? ' for speed' : ''}">${r.next ? icon('play') : ''}${speed ? 'For speed' : 'Practice'}</button></div></td></tr>`
    })
    .join('')
  el.innerHTML = `
    ${head('Read', `${tab === 'stages' && canReview ? '<button class="btn" data-review="1">Review weak notes</button>' : ''}<div class="seg" role="radiogroup" aria-label="Read">${([['stages', 'Stages'], ['run', 'Sight Run']] as const).map(([v, l]) => `<label><input type="radio" name="readTab" value="${v}"${tab === v ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div>`)}
    ${tab === 'run' ? noKeyboard(true) + run : `<table class="songs stages"><caption class="sr-only">Stages</caption>
      <colgroup><col><col class="mcol">${timed ? '<col style="width:120px">' : ''}<col style="width:150px"></colgroup>
      <thead><tr><th scope="col">Stage</th><th scope="col">Mastery</th>${timed ? '<th scope="col" class="num">Typical time</th>' : ''}<th scope="col"><span style="position:absolute;left:-9999px">Actions</span></th></tr></thead>
      <tbody>${body}</tbody></table>`}`
}

const opt = (v: string | number, label: string, cur: string | number) => `<option value="${v}"${String(v) === String(cur) ? ' selected' : ''}>${label}</option>`
export interface TouchCal {
  step: 0 | 1 | 2 // soft, medium, hard
  got: number // notes played in this step
}

const KEY_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']

const CAL_STEPS = ['soft', 'medium', 'hard'] as const

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
            (o.pattern === 'pedal' ? '' : sel('tHands', 'Hands', [['R', 'Right'], ['L', 'Left'], ['both', 'Both']].map(([v, l]) => opt(v, l, o.hands)).join('')) +
              sel('tDyn', 'Dynamics', Object.entries(DYNS).map(([v, l]) => opt(v, l, o.dyn)).join('')) +
              sel('tArtic', 'Articulation', Object.entries(ARTICS).map(([v, l]) => opt(v, l, o.artic ?? 'normal')).join('')))
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
    `<div class="prow"><div class="pwho"><b>${esc(p.label.charAt(0).toUpperCase() + p.label.slice(1))}${p.state === 'due' ? ' <span class="tag">Due</span>' : ''}</b><span>${p.state === 'learning' ? 'Learning' : p.state === 'solid' ? 'Solid' : p.state === 'new' ? 'Not started' : ''}</span></div><div class="pact"><button class="btn ghost" data-recipe="${esc(p.id)}">Start</button></div></div>`
  const next = path.filter((p) => p.state !== 'solid').slice(0, 5)
  const rest = path.filter((p) => !next.includes(p))
  return `<p class="label cap">Path · ${solid} of ${path.length} solid</p>
    <div class="plan">${next.map(row).join('')}</div>
    ${rest.length ? `<details class="all"><summary>${rest.length} more</summary><div class="plan">${rest.map(row).join('')}</div></details>` : ''}`
}


export interface ProgressData {
  streak: Streak
  path: Level[]
  ladder: LadderLevel[]
  next?: GradeRow // the one requirement to work on next
  week: TodayData['week']
  goal: number
  stages: StageRow[]
  tech: PathRow[]
  log: TouchEntry[]
  history: HistoryEntry[]
  stats: Stats // reading, card by card
}

const KIND_NAME: Record<HistoryEntry['kind'], string> = { read: 'Reading drills', run: 'Sight Run', scale: 'Scales', theory: 'Theory', song: 'Songs', tech: 'Technique' }

/** One small chart per kind of practice: accuracy session by session, and whether the latest few are better than the few before. */
function overTime(h: HistoryEntry[]) {
  const cards = (Object.keys(KIND_NAME) as HistoryEntry['kind'][])
    .map((k) => {
      const xs = h.filter((e) => e.kind === k).slice(-24)
      if (xs.length < 2) return ''
      const W = 260
      const X = (i: number) => 6 + (i / (xs.length - 1)) * (W - 12)
      const Y = (a: number) => 46 - Math.max(0, (a - 0.4) / 0.6) * 40 // the chart runs from 40 to 100 percent
      const avg = (a: HistoryEntry[]) => a.reduce((s, e) => s + e.acc, 0) / a.length
      const recent = xs.slice(-5)
      const before = xs.slice(-10, -5)
      const delta = before.length >= 3 ? Math.round((avg(recent) - avg(before)) * 100) : null
      return `<div class="otc"><small class="label">${KIND_NAME[k]}</small>
        <svg class="hist spark" viewBox="0 0 ${W} 52" preserveAspectRatio="none" role="img" aria-label="${KIND_NAME[k]} accuracy over your last ${xs.length} sessions, now ${Math.round(avg(recent) * 100)} percent">
          <line class="mid" x1="6" x2="${W - 6}" y1="${Y(1)}" y2="${Y(1)}" stroke-dasharray="3 5"/><polyline points="${xs.map((e, i) => `${X(i)},${Y(e.acc)}`).join(' ')}"/></svg>
        <div class="otv"><b>${Math.round(avg(recent) * 100)}%</b><span>${delta === null ? `${xs.length} sessions` : delta === 0 ? 'steady' : `${delta > 0 ? 'up' : 'down'} ${Math.abs(delta)} ${Math.abs(delta) === 1 ? 'point' : 'points'} on the five before`}</span></div></div>`
    })
    .join('')
  return cards ? `<p class="note">Accuracy, session by session, up to the last 24. Each chart runs from 40% to 100%; the dashed line is 100%.</p><div class="over">${cards}</div>` : '<p class="note">Your charts start after two sessions of anything: reading, scales, Theory or a song.</p>'
}

/** Which notes you read well: one bar per semitone across the keyboard, filled by how often, how cleanly and how fast. */
function knownStrip(stats: Stats) {
  const best = new Map<number, number>()
  for (const [k, s] of Object.entries(stats)) {
    const [size, , p] = k.split(':')
    if (size !== '1') continue
    const m = Math.min(1, s.n / 12) * s.clean * Math.min(1, 3000 / Math.max(s.rt, 1))
    best.set(Number(p), Math.max(best.get(Number(p)) ?? 0, m))
  }
  if (!best.size) return ''
  const lo = 36
  const hi = 96
  const w = 600 / (hi - lo + 1)
  const bars = Array.from({ length: hi - lo + 1 }, (_, i) => {
    const p = lo + i
    const m = best.get(p)
    return `<rect x="${(i * w).toFixed(1)}" y="2" width="${(w - 1).toFixed(1)}" height="40" rx="1.5" class="${m === undefined ? 'unseen' : 'seen'}"${m === undefined ? '' : ` style="--m:${(0.15 + 0.85 * m).toFixed(2)}"`}><title>${noteName(p)}${m === undefined ? ', not met yet' : `, ${Math.round(m * 100)}%`}</title></rect>${p % 12 === 0 ? `<text x="${p === hi ? 600 : (i * w).toFixed(1)}"${p === hi ? ' text-anchor="end"' : ''} y="56">${noteName(p)}</text>` : ''}`
  }).join('')
  return `<h2 class="sec">Notes you know</h2><svg class="hist known" viewBox="0 0 600 62" role="img" aria-label="How well you read each note on the keyboard, from C2 to C7">${bars}</svg><p class="note">Brighter is better: met often, answered cleanly and quickly. Dark outlines are notes you have not drilled yet.</p>`
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
    <div class="tcard">${weekBlock(d.week, d.goal, d.streak)}
      <label class="field inline"><span>Weekly goal</span><select id="pGoal">${[30, 60, 90, 120, 180].map((m) => opt(m, `${m} min`, d.goal)).join('')}</select></label></div>
    <h2 class="sec">Over time</h2>
    ${overTime(d.history)}
    ${knownStrip(d.stats)}
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
    ${pathSection(d.path, d.next, d.ladder)}
    <h2 class="sec">Touch</h2>
    ${spark ? `${spark}<table class="songs"><caption class="sr-only">Recent sessions</caption><thead><tr><th scope="col">Date</th><th scope="col">Piece</th><th scope="col" class="num">Average</th><th scope="col" class="num">Spread</th><th scope="col" class="num">Right / left</th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="note">Finish a song on a real keyboard and its touch shows up here.</p>'}`
}

// ---------------------------------------------------------------- Sight Run

const RANGES: Record<RunSpec['clef'], [string, number, number][]> = {
  treble: [['Middle C octave', 60, 72], ['Five fingers', 60, 67], ['The staff', 64, 77], ['With ledger lines', 60, 84]],
  bass: [['Octave below', 48, 60], ['Five fingers', 48, 55], ['The staff', 43, 57], ['With ledger lines', 36, 60]],
  grand: [['Around middle C', 55, 67], ['The staff', 43, 77], ['Wide', 36, 84]],
}
const WHITE = (p: number) => ![1, 3, 6, 8, 10].includes(p % 12)
const KEYS_RUN: [number, string][] = [[1, 'Key of G'], [2, 'Key of D'], [3, 'Key of A'], [4, 'Key of E'], [-1, 'Key of F'], [-2, 'Key of B♭'], [-3, 'Key of E♭'], [-4, 'Key of A♭']]
const runNotes = (s: RunSpec) => (s.fifths ? KEYS_RUN.find(([f]) => f === s.fifths)?.[1] ?? 'In a key' : s.acc === 'nat' ? 'Naturals' : s.acc === 'sharp' ? 'With sharps' : 'With flats')
const runLine = (s: RunSpec) => `${runTitle(s)} · ${runNotes(s)}${s.length ? ` · ${s.length} cards` : ''}${s.pace ? ` · paced, ${s.pace} bpm` : ''}`

/** The Sight Run builder on the Read page, and the saved runs under it. */
export function runForm(s: RunSpec, presets: RunSpec[], best: Record<string, { streak: number; ms: number }>, bestKey: (s: RunSpec) => string, offer: Pace & { why: string }) {
  const [min, max] = LIMITS[s.clef]
  const names = Array.from({ length: max - min + 1 }, (_, i) => min + i).filter(WHITE)
  const picks = (cur: number) => names.map((p) => `<option value="${p}"${p === cur ? ' selected' : ''}>${noteName(p)}</option>`).join('')
  const field = (id: string, label: string, body: string) => `<label class="field"><span>${label}</span><select id="${id}">${body}</select></label>`
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
    <div class="run-head"><div><h2>Sight Run</h2><p class="fine">Build your own reading run: pick the range and how the notes jump about. ${s.pace ? 'A beat leads and the run does not stop for a miss: look ahead and keep going.' : 'It waits for you, and keeps going until you finish.'}</p></div></div>
    <div class="tech-form">
      ${field('rClef', 'Clef', Object.entries(CLEFS).map(([v, l]) => `<option value="${v}"${v === s.clef ? ' selected' : ''}>${l}</option>`).join(''))}
      ${field('rLo', 'From', picks(s.lo))}
      ${field('rHi', 'To', picks(s.hi))}
      ${field('rNotes', 'Notes', (s.size > 1 ? [['nat', 'Naturals']] : [['nat', 'Naturals'], ['sharp', 'With sharps'], ['flat', 'With flats']]).map(([v, l]) => `<option value="${v}"${v === notes ? ' selected' : ''}>${l}</option>`).join('') + KEYS_RUN.map(([f, l]) => `<option value="k${f}"${notes === `k${f}` ? ' selected' : ''}>${l}</option>`).join(''))}
      ${field('rSize', 'Cards', [[1, 'Single notes'], [2, 'Intervals'], [3, 'Triads']].map(([v, l]) => `<option value="${v}"${v === s.size ? ' selected' : ''}>${l}</option>`).join(''))}
      ${field('rPaced', 'Pace', [[0, 'Waits for me'], [1, 'Steady beat']].map(([v, l]) => `<option value="${v}"${(v === 1) === !!s.pace ? ' selected' : ''}>${l}</option>`).join(''))}
      ${s.pace ? `<label class="field"><span>Tempo</span><span class="slider"><input id="rPace" type="range" min="${PACE.min}" max="${PACE.max}" step="2" value="${s.pace}" aria-valuetext="${s.pace} beats a minute"><small id="rPaceV" class="bpm">${s.pace} bpm</small></span></label>${field('rEvery', 'A card every', [[1, 'Beat'], [2, 'Two beats']].map(([v, l]) => `<option value="${v}"${v === s.every ? ' selected' : ''}>${l}</option>`).join(''))}` : ''}
      ${field('rLength', 'Length', [[0, s.pace ? '16 cards' : 'Endless'], ...(s.pace ? [] : [[10, '10 cards']]), [25, '25 cards'], [50, '50 cards'], [100, '100 cards']].map(([v, l]) => `<option value="${v}"${v === s.length ? ' selected' : ''}>${l}</option>`).join(''))}
      ${field('rAhead', 'Reading ahead', (s.pace ? [[4, 'Next 4 notes'], [3, 'Next 3 notes'], [2, 'Next 2 notes']] : [[0, 'Whole set shown'], [4, 'Next 4 notes'], [3, 'Next 3 notes'], [2, 'Next 2 notes'], [1, 'Only the next note']]).map(([v, l]) => `<option value="${v}"${v === (s.pace && s.ahead < 2 ? 3 : s.ahead) ? ' selected' : ''}>${l}</option>`).join(''))}
      ${slider('rNear', 'Jumps', 'Leaps', 'Steps', s.near)}
      ${slider('rWeak', 'Shuffle', 'Even', 'My weak notes', s.weak)}
    </div>
    <div class="chips" role="group" aria-label="Ranges">${RANGES[s.clef].map(([l, lo, hi]) => `<button class="chip-btn${s.lo === lo && s.hi === hi ? ' on' : ''}" data-rr="${lo}:${hi}">${l}</button>`).join('')}</div>
    <div class="run-opts">
      ${s.pace ? `<p class="fine">Offered for this range: <b>${offer.bpm} bpm</b>, a card every ${offer.every === 1 ? 'beat' : 'two beats'}. ${esc(offer.why)} A clean run on two days raises it by ${PACE.step} bpm.</p>` : `<label class="switch"><input type="checkbox" id="rWiden"${s.widen ? ' checked' : ''}><i></i><span><b>Widen as I improve</b><small>A clean set adds a note to the range</small></span></label>`}</div>
    <div class="row-actions run-go">${b && !s.pace ? `<span class="fine">Your longest streak on this range: <b>${b.streak}</b></span>` : ''}<button class="btn ghost" id="rSave">Save this run</button><button class="btn primary" id="rStart">${icon('play')}Start</button></div>
    ${saved ? `<p class="label cap">Your runs</p><div class="plan">${saved}</div>` : ''}
  </section>`
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

const FORMS: Record<Form, string> = { major: 'Major', natural: 'Natural minor', harmonic: 'Harmonic minor', melodic: 'Melodic minor', chromatic: 'Chromatic', arpMajor: 'Major arpeggio', arpMinor: 'Minor arpeggio', dom7: 'Dominant 7th arpeggio', dim7: 'Diminished 7th arpeggio' }

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
  return `<section class="tcard run" aria-label="Quiz" data-osk><p class="fine">Card ${q.i + 1} of ${q.cards.length}${q.streak > 1 ? ` · streak ${q.streak}` : ''}</p>
    <h2>${esc(keyName(c.tonic, c.form))}, ${hand}</h2>
    <p class="line">Which degree takes the 4th finger? Press the note on your keyboard, or tap a number.</p>
    <div class="chips" role="group" aria-label="Degree">${DEG.map((d) => `<button class="chip-btn${done && d === q.picked ? ' on' : ''}" data-qd="${d}"${done ? ' disabled' : ''} aria-label="Degree ${d}, ${degreeName(c.tonic, c.form, d)}${done && quizRight(c, d) ? ', the answer' : ''}">${d}${done && quizRight(c, d) ? icon('check') : ''}</button>`).join('')}</div>
    ${done ? `<p class="line" role="status"><b>${right ? 'Yes.' : 'Not quite.'}</b> ${esc(why(c.tonic, c.form, c.hand))} Up the scale: <b>${fingering(c.tonic, c.form, c.hand).split('').join(' ')}</b>. ${esc(checkNote({ tonic: c.tonic, form: c.form, hands: c.hand, oct: 1 }, c.hand))}</p><div class="row-actions run-go"><button class="btn primary" id="qNext">${q.i + 1 === q.cards.length ? 'Finish' : 'Next'}</button></div>` : ''}</section>`
}

export function scalesView(el: HTMLElement, rows: ScaleRow[], tab: 'stages' | 'pick' | 'quiz', p: ScalePick, quiz?: QuizState) {
  const ex = explain(p)
  const field = (id: string, label: string, body: string) => `<label class="field"><span>${label}</span><select id="${id}">${body}</select></label>`
  const body =
    tab === 'quiz' && quiz
      ? quizBody(quiz)
      : tab === 'stages'
      ? `<table class="songs stages"><caption class="sr-only">Scale stages</caption>
      <colgroup><col><col class="mcol"><col style="width:150px"></colgroup>
      <thead><tr><th scope="col">Stage</th><th scope="col">Solid</th><th scope="col"><span style="position:absolute;left:-9999px">Actions</span></th></tr></thead>
      <tbody>${rows
        .map(
          (r) => `<tr><td class="name">${esc(r.stage.name)}${r.next ? ' <span class="tag next">Next</span>' : ''}<small>${esc(r.stage.blurb)} Eighth notes at ${r.stage.bpm}.${r.solid ? '' : ` Up next: ${esc(cardName(r.card))}.`}</small></td>
        <td><div class="mrow">${meter(r.pct, r.solid, `${esc(r.stage.name)} solid`)}<b>${Math.round(r.pct * 100)}%</b></div><small style="color:var(--ink-3)">${r.done} of ${r.total} solid</small></td>
        <td class="acts"><div class="row-actions"><button class="btn${r.next ? ' primary' : ' ghost'}" data-sstage="${r.stage.id}" aria-label="Practice ${esc(r.stage.name)}">${r.next ? icon('play') : ''}Practice</button></div></td></tr>`,
        )
        .join('')}</tbody></table>`
      : `<section class="tcard run" aria-label="Choose a scale"><div class="tech-form">
      ${field('sgForm', 'Scale', Object.entries(FORMS).map(([v, l]) => `<option value="${v}"${v === p.form ? ' selected' : ''}>${l}</option>`).join(''))}
      ${field('sgKey', 'Key', keyLabels(p.form).map((n, i) => `<option value="${i}"${i === p.tonic ? ' selected' : ''}>${n}</option>`).join(''))}
      ${field('sgHands', 'Hands', Object.entries(HANDS).map(([v, l]) => `<option value="${v}"${v === p.hands ? ' selected' : ''}>${l}</option>`).join(''))}
      ${field('sgOct', 'Octaves', [[1, 'One'], [2, 'Two']].map(([v, l]) => `<option value="${v}"${v === p.oct ? ' selected' : ''}>${l}</option>`).join(''))}
      ${field('sgBpm', 'Tempo', [50, 60, 66, 72, 80, 90, 100, 112, 120].map((b) => `<option value="${b}"${b === p.bpm ? ' selected' : ''}>${b}, eighth notes</option>`).join(''))}
    </div>
    <p class="line">${ex.lead}: right hand <b>${ex.r}</b>, left hand <b>${ex.l}</b>.</p>
    ${ex.why.map((w) => `<p class="fine">${esc(w)}</p>`).join('')}
    <div class="row-actions run-go"><button class="btn primary" id="sgStart">${icon('play')}Start</button></div></section>`
  el.innerHTML = `
    ${head('Scales', `<div class="seg" role="radiogroup" aria-label="Scales">${([['stages', 'Stages'], ['pick', 'Choose a scale'], ['quiz', 'Quiz']] as const).map(([v, l]) => `<label><input type="radio" name="scaleTab" value="${v}"${tab === v ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div>`, tab === 'stages' ? 'A scale is solid when three runs in a row are clean, in time and even in touch. A scale you miss starts its count again.' : '')}
    ${tab === 'quiz' && !(quiz && quiz.i < quiz.cards.length) ? noKeyboard(true) : ''}${body}`
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
  ear?: EarView
}

/** The trainer list, or one card of a session, or its results. */
export function theoryView(el: HTMLElement, levels: Record<Trainer, number>, run?: TheoryRunView) {
  let body: string
  if (!run) {
    body = `<div class="plan">${TRAINERS.map(
      (t) => `<div class="prow"><div class="pwho"><b>${esc(t.name)}</b><span>${esc(t.blurb)}</span></div>
      ${t.levels.length ? `<label class="field inline"><span class="sr-only">Level of ${esc(t.name)}</span><select data-tlevel="${t.id}">${t.levels.map((l, i) => `<option value="${i + 1}"${levels[t.id] === i + 1 ? ' selected' : ''}>Level ${i + 1}: ${esc(l)}</option>`).join('')}</select></label>` : ''}
      <div class="pact"><button class="btn ghost" data-trainer="${t.id}">Start</button></div></div>`,
    ).join('')}</div>`
  } else if (run.i >= run.cards.length) {
    const n = run.cards.length
    body = `<section class="tcard run" aria-label="Session results"><h2>${run.ok} of ${n} first time</h2>
      <p class="line">Best streak <b>${run.best}</b>${untimed(run.trainer) || isPulse(run.trainer) ? '' : ` · median <b>${(run.medianMs / 1000).toFixed(1)} s</b> a card`}.${run.missed.length ? ` Missed: ${run.missed.map(esc).join('; ')}.` : ' Every one.'}${run.ear?.summary ? ` ${esc(run.ear.summary)}` : ''}</p>
      <div class="row-actions run-go"><button class="btn ghost" id="thMenu">All trainers</button><button class="btn primary" id="thAgain">${icon('restart')}Again</button></div></section>`
  } else {
    const c = run.cards[run.i]
    const t = TRAINERS.find((x) => x.id === run.trainer)!
    body = `<section class="tcard run" aria-label="${esc(t.name)}" data-osk><p class="fine">${esc(t.name)} · card ${run.i + 1} of ${run.cards.length}${run.streak > 1 ? ` · streak ${run.streak}` : ''}</p>
      <h2>${esc(c.prompt)}</h2>
      ${c.steps.length > 1 ? `<p class="line">${c.steps[0].pcs.length > 1 ? 'Chord' : 'Note'} <b>${Math.min(run.step + 1, c.steps.length)}</b> of ${c.steps.length}</p>` : ''}
      <p class="line" role="status">${run.answered === 'ok' ? '<b>Yes.</b>' : run.answered === 'miss' ? `<b>Not quite.</b> ${esc(c.show)}.` : c.play ? earAsk(c) : 'Play it on your keyboard.'}</p>
      ${c.play?.kind === 'pulse' ? pulseBars(c.play) : ''}${c.play && run.ear ? earBlock(c, run.ear, run.answered) : ''}
      <div class="row-actions run-go">${c.play && run.ear && !run.answered ? replayBtn(run.ear) : ''}<button class="btn ghost" id="thMenu">Stop</button>${run.answered === 'miss' ? '<button class="btn primary" id="thNext">Next</button>' : ''}</div></section>`
  }
  el.innerHTML = `${head('Theory', '', run ? '' : 'Every answer is played on your keyboard, in any octave. A session is 15 cards; the ones you miss come back sooner.')}${run ? '' : noKeyboard(true)}${body}`
}


/** The Connect line, and with `osk` the switch for the on-screen keys (app/osk-ui.ts). */
const noKeyboard = (osk = false) => keyboardLine(inputs().length > 0) + (osk ? `<label class="switch osk-sw"><input type="checkbox" data-osk-sw${(settings.osk ?? inputs().length === 0) ? ' checked' : ''}><i></i>On-screen keys</label>` : '')