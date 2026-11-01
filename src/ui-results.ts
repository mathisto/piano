import { meter, runTitle } from './ui'
import type { Result } from './game'
import type { Next } from './pace'
import { icon, jg } from './icons'
import { noteName } from './spell'
import { settings } from './settings'
import { marks as liveMarks, type Timing } from './coach'
import { coachLines, timingLine } from './coach-lines'
import { barList, markLine, rightOf, type Mark } from './marks'
import type { Song } from './song'
import type { Evenness } from './even'
import { type RunSpec, type Tally } from './run'
import { band, type TouchStats } from './touch'
import { esc, plural } from './util'
import { cont, type Cont } from './next'

// ---------- results ----------

/** How hard the keys were struck: a histogram from soft to hard, then the average, spread and hand balance. */
/** How even the loudness was: a bar for each note above or below its neighbours (the chart), and a line of words with one thing to try. */
function evenBlock(e: Evenness) {
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
  return {
    chart: `<div><svg class="hist even" viewBox="0 0 396 74" role="img" aria-label="Loudness of each note against its neighbours: ${Math.round(e.inside * 100)} percent within plus or minus ${e.band}"><rect class="band" x="0" y="${36 - edge}" width="396" height="${edge * 2}"/><line class="mid" x1="0" x2="396" y1="36" y2="36"/>${bars}<text x="6" y="72">softer than its neighbours below, louder above</text></svg></div>`,
    line: `Evenness <b>${word.toLowerCase()}</b>: ${Math.round(e.inside * 100)}% of ${e.n} notes within ±${e.band}.${e.hint ? ` ${esc(e.hint)}` : ''}`,
  }
}

function touchBlock(t: TouchStats, hands = true) {
  const peak = Math.max(1, ...t.hist)
  const bars = t.hist.map((n, i) => `<rect x="${i * 48 + 6}" y="${60 - (n / peak) * 56}" width="40" height="${(n / peak) * 56 + 0.5}" rx="2"/>`).join('')
  const x = 6 + (t.mean / 128) * 384
  const hand = hands && t.hands.R.n && t.hands.L.n ? ` · right hand ${Math.round(t.hands.R.mean)}, left ${Math.round(t.hands.L.mean)}` : ''
  const regs = (['low', 'mid', 'high'] as const).filter((r) => t.regions[r].n >= 4)
  const where = regs.length >= 2 ? ` · ${regs.map((r) => `${r === 'mid' ? 'middle' : r} keys ${Math.round(t.regions[r].mean)}`).join(', ')}` : ''
  return `<div>
    <svg class="hist" viewBox="0 0 396 82" role="img" aria-label="Loudness, soft to hard, average ${Math.round(t.mean)}">${bars}<line class="mid" x1="${x}" x2="${x}" y1="0" y2="62"/><text x="6" y="80">soft</text><text x="390" y="80" text-anchor="end">hard</text></svg>
    <div style="color:var(--ink-2)">Loudness: average <b>${Math.round(t.mean)}</b> of 127 (${band(t.mean, settings.edges)}), spread ±${Math.round(t.sd)}${hand}${where}.</div></div>`
}

/** The bars of the marks of these kinds, in brackets for a line: " (bars 7 and 12)"; nothing when there are none. */
const at = (ms: Mark[], ...kinds: Mark['kind'][]) => {
  const bars = [...new Set(ms.filter((m) => kinds.includes(m.kind)).map((m) => m.bar + 1))]
  return bars.length && bars.length < 4 ? ` (${barList(bars)})` : ''
}

/** The paper's own run marks, drawn small for the legend (staff.ts draws them on the score). */
const CROSS = 'M-3.4,-3.4 L3.4,3.4 M3.4,-3.4 L-3.4,3.4'
const TRI = 'M-3,-3.8 L3.6,0 L-3,3.8Z'
const pm = (cls: string, d: string, more = '') => `<svg class="pm ${cls}" viewBox="-7 -6 14 12" aria-hidden="true">${more}<path d="${d}"/></svg>`

/** One line of the card: what was measured, in plain counts, and whether it decides that the run counts. */
const measure = (name: string, text: string, status = '') => `<div><dt>${name}</dt><dd>${text}</dd><dd class="cnt">${status}</dd></div>`

/** The song card. `go`: Continue. `from`: the page the Back button returns to, named on it. `ctx`: the piece and the marks the run left on its score, for the bars and the Mark list,
 *  its worst bars, and the pace step when Continue is not it (for More). */
export function results(r: Result, go?: Cont, note = '', from = 'Songs', ctx?: { song: Song; marks: Mark[]; worst?: { a: number; b: number } | null; step?: Next | null }) {
  const ms = ctx?.marks ?? []
  const bins = new Array(13).fill(0) // -125..+125 in 20 ms steps
  for (const o of r.offs) bins[Math.min(12, Math.max(0, Math.round((o + 125) / 20)))]++
  const peak = Math.max(1, ...bins)
  const mean = r.offs.length ? r.offs.reduce((a, b) => a + b, 0) / r.offs.length : 0
  const bias = r.timing ? r.timing.bias : mean
  const lean = `${Math.abs(bias) < 8 ? 'neither early nor late' : `about ${Math.round(Math.abs(bias))} ms ${bias > 0 ? 'late' : 'early'}`} on average${r.timing ? `, steady within ±${Math.round(r.timing.spread)} ms` : ''}`
  const hist = bins
    .map((n, i) => `<rect x="${i * 30 + 6}" y="${60 - (n / peak) * 56}" width="24" height="${(n / peak) * 56 + 0.5}" rx="2"/>`)
    .join('')
  const perform = r.mode === 'perform'
  const waited = r.first >= 0 // Learn, waiting: every note is played in the end, so accuracy is always 100% and says nothing; what shows is how many came right first
  const id = ctx?.song.id ?? ''
  const right = rightOf(r)
  const even = r.even ? evenBlock(r.even) : null
  // The figure leads with a count; the percentage is for Details and the Over time chart
  const accuracy = waited ? `Right first time <b>${r.first === 1 ? 100 : Math.min(99, Math.round(r.first * 100))}%</b>` : `Accuracy <b>${Math.round(r.acc * 100)}%</b>`
  const more =
    `<p class="line">${accuracy}${perform ? ` · most in a row <b>${r.maxCombo}</b>` : ''}</p>` +
    (perform
      ? `<div><div class="counts"><span>${jg('perfect')}Perfect ${r.counts.perfect}</span><span>${jg('great')}Great ${r.counts.great}</span><span>${jg('good')}Good ${r.counts.good}</span>${r.counts.late ? `<span>${jg('late')}Late ${r.counts.late}</span>` : ''}<span>${jg('miss')}Miss ${r.counts.miss}</span></div>
      <svg class="hist" viewBox="0 0 396 82" role="img" aria-label="Timing: ${lean}">${hist}<line class="mid" x1="198" x2="198" y1="0" y2="62"/><text x="198" y="80" text-anchor="middle">on the beat</text><text x="6" y="80">early</text><text x="390" y="80" text-anchor="end">late</text></svg></div>`
      : '') +
    (r.touch.n >= 4 ? touchBlock(r.touch, !r.voice) : '') +
    (even?.chart ?? '')
  // One line for each thing measured, each saying whether it decides that the run counts. What counts follows the rules the app has today: notes, and timing in Perform; the exercises add touch.
  const hits = r.counts.perfect + r.counts.great + r.counts.good + r.counts.late
  const touch = [
    even?.line,
    r.dyn === 'even' && r.touch.n >= 4 && `Spread <b>±${Math.round(r.touch.sd)}</b>.`,
    r.touchPct >= 0 && `<b>${Math.round(r.touchPct * 100)}%</b> of notes in range.`,
  ].filter(Boolean)
  const lines = [
    // the figure says how many were right: the line says what went wrong, and where
    measure('Notes', [r.wrong > 0 && `<b>${r.wrong}</b> ${r.wrong === 1 ? 'wrong key' : 'wrong keys'}${at(ms, 'wrong')}`, !waited && r.counts.miss > 0 && `<b>${r.counts.miss}</b> missed${at(ms, 'miss')}`].filter(Boolean).join(' · ') || (waited ? 'No wrong key.' : 'No wrong key, none missed.'), 'counts'),
    waited ? measure('Time', 'The song waited, so time is not measured.') : hits ? measure('Time', `<b>${r.counts.perfect + r.counts.great}</b> of ${hits} on the beat · ${lean}`, perform ? 'counts' : 'not counted yet') : '',
    r.holds >= 0 ? measure('Holds', `<b>${Math.round(r.holds * 100)}%</b> released on time`, 'not counted yet') : '',
    touch.length ? measure('Touch', touch.join(' '), (id.startsWith('tech:') && r.touchPct >= 0) || (id.startsWith('scale:') && r.even) ? 'counts' : 'not counted yet') : '',
  ].join('')
  const slips = ms.filter((m) => m.kind === 'wrong' || m.kind === 'miss')
  const slipBars = [...new Set(slips.map((m) => m.bar + 1))]
  const head = r.clean
    ? `Clean${waited ? ', with the song waiting' : ''}${r.rate < 1 ? ` at ${Math.round(r.rate * 100)}% tempo` : ''}.`
    : `Not clean yet${slips.length ? `: ${plural(slips.length, 'slip')} in ${barList(slipBars)}` : ''}.`
  // what went right, only when it is true and says something: the bars with no slip, as runs
  const bars = ctx?.song.bars.length ?? 0
  const runs: string[] = []
  for (let b = 1; b <= bars; b++) if (!slipBars.includes(b) && (b === 1 || slipBars.includes(b - 1))) {
    let e = b
    while (e < bars && !slipBars.includes(e + 1)) e++
    runs.push(e > b ? `${b} to ${e}` : `${b}`)
  }
  const went = slips.length && runs.length ? `<p class="went">${runs.length > 3 ? `${bars - slipBars.length} of ${bars} bars` : `${runs.length > 1 || runs[0].includes(' ') ? 'Bars' : 'Bar'} ${runs.length > 1 ? `${runs.slice(0, -1).join(', ')} and ${runs.at(-1)}` : runs[0]}`} had no slips.</p>` : ''
  // the coaching points, by priority (docs/research/practice-path.md 2.2): why the lamp loops the bars it does, then a lean worth checking. A clean run gets none.
  // The loop is Continue, the footer's lamp, not a second button here: one action, one place.
  const w = ctx?.worst
  const loopBars = w ? slips.filter((m) => m.bar >= w.a && m.bar <= w.b) : []
  const where = w && (w.b > w.a ? `Bars ${w.a + 1} and ${w.b + 1}` : `Bar ${w.a + 1}`)
  const first = loopBars.find((m) => m.kind === 'wrong' && m.written !== undefined && m.written !== m.p) ?? loopBars[0]
  const points = [
    !r.clean && where && `<li><p>${loopBars.length ? `${where} had ${loopBars.length === slips.length ? (slips.length === 1 ? 'the slip' : `all ${slips.length} slips`) : `${loopBars.length} of the ${slips.length} slips`}. ${esc(markLine(first, ctx!.song))}` : `${where} held you up longest.`}</p></li>`,
    !waited && r.timing && Math.abs(r.timing.bias) >= 30 && `<li><p>Most notes came about ${Math.round(Math.abs(r.timing.bias))} ms ${r.timing.bias > 0 ? 'late' : 'early'}. If they felt on the beat, calibrate Delay in Set up.</p></li>`,
  ].filter(Boolean)
  const c = cont(go)
  const review = ms.length
    ? `<button class="btn" id="review" aria-expanded="false">Review on the score</button><details class="all marklist"><summary>Mark list</summary><ol>${ms.map((m, i) => `<li><button class="lnk" data-m="${i}">${esc(markLine(m, ctx!.song))}</button></li>`).join('')}</ol></details>`
    : ''
  const reviewbar = ms.length
    ? `<div class="reviewbar"><button class="btn" id="unfold">Results</button><button class="btn icon ghost" id="markPrev" aria-label="Previous mark">${icon('back')}</button><span id="markAt"></span><button class="btn icon ghost" id="markNext" aria-label="Next mark">${icon('back')}</button><p id="markSay" aria-live="polite"></p>
    ${perform && r.counts.great ? `<label class="switch"><input type="checkbox" id="allTiming"><i></i>Show all timing</label>` : ''}
    <p class="legend">${pm('x', CROSS)}missed · ${pm('x', CROSS, '<ellipse rx="6.4" ry="4.7" transform="rotate(-20)"/>')}wrong key, at the pitch played · ${pm('', 'M3,-3.8 L-3.6,0 L3,3.8Z')}a little early · ${pm('', TRI)}a little late · ${pm('o', TRI)}late</p></div>`
    : ''
  return `
  <div class="results on-stage"><div class="card song-res" role="region" aria-label="Results">
    <h2>${head}</h2>
    <div class="big-grade"><b>${right} of ${r.total}</b><span class="hcap">${waited ? 'right first time' : 'notes right'}</span></div>
    <div class="stats">
    ${went}
    ${note ? `<p class="line">${note}</p>` : ''}
    <dl class="measures">${lines}</dl>
    ${points.length ? `<ol class="points">${points.join('')}</ol>` : ''}
    ${coachLines(r, liveMarks === 'none' && !!r.even)}
    <div class="reviewrow">${review}<details class="all more"><summary>Details</summary>${more}</details></div>
    ${reviewbar}
    </div>
    <div class="row">
      ${c[0]}
      <button class="btn icon${go ? '' : ' primary'}" id="again" aria-label="Again" title="Again">${icon('restart')}</button>
      <div class="pop"><button class="btn icon" data-more aria-label="More" aria-expanded="false" aria-controls="resMenu">${icon('more')}</button><div class="popmenu" id="resMenu" hidden>${ctx?.step ? `<button class="btn ghost" id="pace">${ctx.step.label}</button>` : ''}</div></div>
      <button class="btn ghost" id="toLib">Back to ${from}</button>
      ${c[1]}
    </div>
  </div></div>`
}

/** A Sight run's footer: Continue, Again as the restart icon, the way back. */
const runRow = (go?: Cont) => {
  const c = cont(go)
  return `<div class="row">${c[0]}<button class="btn icon${go ? '' : ' primary'}" id="runAgain" aria-label="Again" title="Again">${icon('restart')}</button><button class="btn ghost" id="toStages">Back to Read</button>${c[1]}</div>`
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
  fast: boolean // a Fluent set: before, after and solid are the Fluent tier
  goalMs: number
}

export function drillResults(d: DrillSummary, go?: Cont) {
  const c = cont(go)
  const secs = (ms: number) => (ms / 1000).toFixed(1) + ' s'
  return `
  <div class="results"><div class="card" style="grid-template-columns:1fr" role="region" aria-label="Drill results">
    <h2>${esc(d.stage)}: set complete</h2>
    <p class="line"><b>${d.cards}</b> cards · <b>${Math.round(d.clean * 100)}%</b> first try · typical <b>${secs(d.medianMs)}</b> a card</p>
    <div>
      <p class="line" style="margin-bottom:6px">${d.fast ? 'Fluent' : 'Stage mastery'} went from <b>${Math.round(d.before * 100)}%</b> to <b>${Math.round(d.after * 100)}%</b>${
        d.solid
          ? d.fast ? '. Fluent.' : '. Solid. Next is Fluent: the same cards, answered faster. Choose Faster on the stage list.'
          : `. It is ${d.fast ? 'fluent' : 'solid'} when every card is right first try, in under ${secs(d.goalMs)}.`
      }</p>
      <div class="mrow" style="max-width:420px">${meter(d.after, d.solid, `${d.fast ? 'Fluent' : 'Stage mastery'} after this set`)}<b>${Math.round(d.after * 100)}%</b></div>
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
      ${c[0]}
      ${d.solid ? `<button class="btn${go ? '' : ' primary'}" id="nextSet">Next stage</button>` : `<button class="btn icon${go ? '' : ' primary'}" id="nextSet" aria-label="Another set" title="Another set">${icon('restart')}</button>`}
      <button class="btn ghost" id="toStages">All stages</button>
      ${c[1]}
    </div>
  </div></div>`
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

export function runResults(d: RunSummary, go?: Cont) {
  const secs = (ms: number) => (ms / 1000).toFixed(1) + ' s'
  const top = Math.max(800, ...d.notes.map((n) => n.ms / n.n))
  const strip = [...d.notes]
    .sort((a, b) => a.p - b.p)
    .map((n) => `<div class="hbar" style="--h:${Math.round(((n.ms / n.n) / top) * 100)}%;--m:${Math.round((n.miss / n.n) * 100)}%" title="${esc(noteName(n.p, d.spec.fifths))}: ${secs(n.ms / n.n)}, ${n.miss} missed of ${n.n}"><i></i>${n.miss ? jg('miss') : ''}<span>${esc(noteName(n.p, d.spec.fifths))}</span></div>`)
    .join('')
  return `
  <div class="results"><div class="card" style="grid-template-columns:1fr" role="region" aria-label="Run results">
    <h2>Run complete</h2>
    <p class="line"><b>${esc(d.spec.name ?? runTitle(d.spec))}</b></p>
    <p class="line"><b>${d.arc.cards}</b> cards · <b>${d.arc.cards ? Math.round((d.arc.clean / d.arc.cards) * 100) : 0}%</b> first try · most in a row <b>${d.arc.best}</b> · typical <b>${secs(d.medianMs)}</b> a card${d.record ? ' <span class="tag next">Most yet on this range</span>' : d.best ? ` · your most in a row here is ${d.best.streak}` : ''}</p>
    ${strip ? `<div><p class="line" style="margin-bottom:6px">Every note you met: taller is slower, × marks a note you missed, redder is missed more.</p><div class="hstrip" role="img" aria-label="Speed and misses for each note">${strip}</div></div>` : ''}
    ${d.weakest.length ? `<p class="line">Needs the most work: <b>${d.weakest.map(esc).join(', ')}</b></p>` : ''}
    ${runRow(go)}
  </div></div>`
}

export interface PacedSummary {
  spec: RunSpec
  n: number // cards judged
  hit: number // of them on the beat
  cells: (boolean | undefined)[] // each card: on the beat, missed, not reached
  missed: string[] // the missed cards by name, in order
  timing: Timing | null
  wrong: number // keys struck that were no note on the beat
  note: string // what the tempo rule says
}

/** A paced run's results: cards on the beat in plain numbers, the run as a strip of cards, timing, the notes missed and the next tempo. No score, no rank. */
export function pacedResults(d: PacedSummary, go?: Cont) {
  const first = d.cells.findIndex((c) => c === undefined)
  const strip = d.cells.map((c, i) => `<i class="${c === true ? 'on' : c === false ? 'off' : ''}"${c === false ? ` title="Card ${i + 1}: missed"` : ''}></i>`).join('')
  const cardWord = d.spec.every === 1 ? 'every beat' : 'every two beats'
  return `
  <div class="results"><div class="card" style="grid-template-columns:1fr" role="region" aria-label="Run results">
    <h2>Run complete</h2>
    <p class="line"><b>${esc(d.spec.name ?? runTitle(d.spec))}</b></p>
    <p class="line">Hit <b>${d.hit} of ${d.n}</b> on the beat at <b>${d.spec.pace} bpm</b>, a card ${cardWord}${first >= 0 ? `. You finished after ${first} of ${d.cells.length} cards.` : '.'}</p>
    <div><p class="line" style="margin-bottom:6px">The run, card by card: filled is on the beat, empty is missed.</p><div class="pstrip" role="img" aria-label="${d.hit} of ${d.n} cards on the beat${d.missed.length ? `; missed ${d.missed.length}` : ''}">${strip}</div></div>
    ${d.timing ? `<p class="line">${timingLine(d.timing)}</p>` : ''}
    <p class="line">${d.missed.length ? `Missed: <b>${d.missed.map(esc).join(', ')}</b>. The pulse carried on without them.` : 'No card missed.'}${d.wrong ? ` ${d.wrong} ${d.wrong === 1 ? 'key was' : 'keys were'} struck off the beat or wrong.` : ''}</p>
    <p class="line">${esc(d.note)}</p>
    ${runRow(go)}
  </div></div>`
}
