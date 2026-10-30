import { meter, runTitle } from './ui'
import type { Result } from './game'
import type { Next } from './pace'
import { icon } from './icons'
import { noteName } from './spell'
import { settings } from './settings'
import { coachLines, marks as liveMarks, timingLine, type Timing } from './coach'
import type { Evenness } from './even'
import { type RunSpec, type Tally } from './run'
import { band, type TouchStats } from './touch'
import { esc } from './util'

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
    line: `<p class="line sub">Evenness: <b>${word}</b>, ${Math.round(e.inside * 100)}% of ${e.n} notes within ±${e.band}.${e.hint ? ` ${esc(e.hint)}` : ''}</p>`,
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
    <svg class="hist" viewBox="0 0 396 82" role="img" aria-label="Key velocity, soft to hard, average ${Math.round(t.mean)}">${bars}<line class="mid" x1="${x}" x2="${x}" y1="0" y2="62"/><text x="6" y="80">soft</text><text x="390" y="80" text-anchor="end">hard</text></svg>
    <div style="color:var(--ink-2)">Touch: average <b>${Math.round(t.mean)}</b> (${band(t.mean, settings.edges)}), spread ±${Math.round(t.sd)}${hand}${where}.</div></div>`
}

/** `from`: the page the Back button returns to, named on it; a scale or exercise is a run, not a song. */
export function results(r: Result, next: Next | null, note = '', from = 'Songs') {
  const bins = new Array(13).fill(0) // -125..+125 in 20 ms steps
  for (const o of r.offs) bins[Math.min(12, Math.max(0, Math.round((o + 125) / 20)))]++
  const peak = Math.max(1, ...bins)
  const mean = r.offs.length ? r.offs.reduce((a, b) => a + b, 0) / r.offs.length : 0
  const lean = r.timing ? timingLine(r.timing) : Math.abs(mean) < 8 ? 'Your timing is centred.' : mean < 0 ? `You tend to play about ${Math.round(-mean)} ms early.` : `You tend to play about ${Math.round(mean)} ms late.`
  const hist = bins
    .map((n, i) => `<rect x="${i * 30 + 6}" y="${60 - (n / peak) * 56}" width="24" height="${(n / peak) * 56 + 0.5}" rx="2"/>`)
    .join('')
  const perform = r.mode === 'perform'
  const even = r.even ? evenBlock(r.even) : null
  // the sentences stay in view; the charts behind them, and the touch figures, fold under More
  const more =
    (perform
      ? `<div><div class="counts"><span><i style="background:var(--perfect)"></i>Perfect ${r.counts.perfect}</span><span><i style="background:var(--great);border-radius:50%"></i>Great ${r.counts.great}</span><span><i style="background:var(--good);transform:rotate(45deg) scale(.85)"></i>Good ${r.counts.good}</span>${r.counts.late ? `<span><i style="background:var(--late);transform:rotate(45deg) scale(.85)"></i>Late ${r.counts.late}</span>` : ''}<span><i style="background:var(--bad);clip-path:polygon(50% 0,100% 100%,0 100%)"></i>Miss ${r.counts.miss}</span></div>
      <svg class="hist" viewBox="0 0 396 82" role="img" aria-label="Timing: ${lean}">${hist}<line class="mid" x1="198" x2="198" y1="0" y2="62"/><text x="198" y="80" text-anchor="middle">on time</text><text x="6" y="80">early</text><text x="390" y="80" text-anchor="end">late</text></svg></div>`
      : '') +
    (r.touch.n >= 4 ? touchBlock(r.touch, !r.voice) : '') +
    (even?.chart ?? '')
  return `
  <div class="results"><div class="card song-res" role="dialog" aria-label="Results">
    <div class="big-grade">${perform ? `${Math.round(r.acc * 100)}%` : r.clean ? icon('check') : icon('loop')}</div>
    <div class="stats">
    <h2>${perform ? (from === 'Songs' ? 'Song complete' : 'Run complete') : r.clean ? 'Cleared' : 'Not clean yet'}${r.rate < 1 ? ` at ${Math.round(r.rate * 100)}% tempo` : ''}</h2>
    <p class="line"><b>${Math.round(r.acc * 100)}%</b> accuracy${perform ? ` · longest run <b>${r.maxCombo}</b> notes` : ''} · <b>${r.wrong}</b> wrong ${r.wrong === 1 ? 'note' : 'notes'}${r.dyn === 'even' && r.touch.n >= 4 ? ` · spread <b>±${Math.round(r.touch.sd)}</b>` : ''}${r.touchPct >= 0 ? ` · touch in range <b>${Math.round(r.touchPct * 100)}%</b>` : ''}${perform && r.holds >= 0 ? ` · held <b>${Math.round(r.holds * 100)}%</b>` : ''}</p>
    ${note ? `<p class="line">${note}</p>` : ''}
    ${perform ? `<p class="line sub">${lean}</p>` : ''}
    ${even?.line ?? ''}
    ${coachLines(r, liveMarks === 'none' && !!r.even)}
    ${more ? `<details class="all more"><summary>Details</summary>${more}</details>` : ''}
    </div>
    <div class="row">
      ${next ? `<button class="btn primary" id="next">${icon(next.kind === 'loop' ? 'loop' : 'play')}${next.label}</button>` : ''}
      <button class="btn${next ? '' : ' primary'}" id="again">${icon('restart')}Again</button>
      <div class="pop"><button class="btn icon" data-more aria-label="More" aria-haspopup="menu" aria-expanded="false">${icon('more')}</button><div class="popmenu" id="resMenu" role="menu" hidden></div></div>
      <button class="btn ghost" id="toLib">${from}</button>
    </div>
  </div></div>`
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

export function drillResults(d: DrillSummary) {
  const secs = (ms: number) => (ms / 1000).toFixed(1) + ' s'
  return `
  <div class="results"><div class="card" style="grid-template-columns:1fr" role="dialog" aria-label="Drill results">
    <h2>${esc(d.stage)}: set complete</h2>
    <p class="line"><b>${d.cards}</b> cards · <b>${Math.round(d.clean * 100)}%</b> first try · median <b>${secs(d.medianMs)}</b> a card</p>
    <div>
      <p class="line" style="margin-bottom:6px">${d.fast ? 'Fluent' : 'Stage mastery'} went from <b>${Math.round(d.before * 100)}%</b> to <b>${Math.round(d.after * 100)}%</b>${
        d.solid
          ? d.fast ? '. Fluent.' : '. Solid. The next tier is Fluent: the same cards, faster. Practice for speed from the stage list.'
          : `. It is ${d.fast ? 'fluent' : 'solid'} when every card is first-try right in under ${secs(d.goalMs)}.`
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
      <button class="btn primary" id="nextSet">${icon('restart')}${d.solid ? 'Next stage' : 'Another set'}</button>
      <button class="btn" id="toStages">All stages</button>
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

export function runResults(d: RunSummary) {
  const secs = (ms: number) => (ms / 1000).toFixed(1) + ' s'
  const top = Math.max(3000, ...d.notes.map((n) => n.ms / n.n))
  const strip = [...d.notes]
    .sort((a, b) => a.p - b.p)
    .map((n) => `<div class="hbar" style="--h:${Math.round(((n.ms / n.n) / top) * 100)}%;--m:${Math.round((n.miss / n.n) * 100)}%" title="${esc(noteName(n.p, d.spec.fifths))}: ${secs(n.ms / n.n)}, ${n.miss} missed of ${n.n}"><i></i><span>${esc(noteName(n.p, d.spec.fifths))}</span></div>`)
    .join('')
  return `
  <div class="results"><div class="card" style="grid-template-columns:1fr" role="dialog" aria-label="Run results">
    <h2>Run complete</h2>
    <p class="line"><b>${esc(d.spec.name ?? runTitle(d.spec))}</b></p>
    <p class="line"><b>${d.arc.cards}</b> cards · <b>${d.arc.cards ? Math.round((d.arc.clean / d.arc.cards) * 100) : 0}%</b> first try · best streak <b>${d.arc.best}</b> · median <b>${secs(d.medianMs)}</b> a card${d.record ? ' <span class="tag next">Longest yet on this range</span>' : d.best ? ` · your longest here is ${d.best.streak}` : ''}</p>
    ${strip ? `<div><p class="line" style="margin-bottom:6px">Every note you met: taller is slower, redder is missed more</p><div class="hstrip" role="img" aria-label="Speed and misses for each note">${strip}</div></div>` : ''}
    ${d.weakest.length ? `<p class="line">Needs the most work: <b>${d.weakest.map(esc).join(', ')}</b></p>` : ''}
    <div class="row"><button class="btn primary" id="runAgain">${icon('restart')}Run again</button><button class="btn" id="toStages">Back to Read</button></div>
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
export function pacedResults(d: PacedSummary) {
  const first = d.cells.findIndex((c) => c === undefined)
  const strip = d.cells.map((c, i) => `<i class="${c === true ? 'on' : c === false ? 'off' : ''}"${c === false ? ` title="Card ${i + 1}: missed"` : ''}></i>`).join('')
  const cardWord = d.spec.every === 1 ? 'every beat' : 'every two beats'
  return `
  <div class="results"><div class="card" style="grid-template-columns:1fr" role="dialog" aria-label="Run results">
    <h2>Run complete</h2>
    <p class="line"><b>${esc(d.spec.name ?? runTitle(d.spec))}</b></p>
    <p class="line">Hit <b>${d.hit} of ${d.n}</b> on the beat at <b>${d.spec.pace} bpm</b>, a card ${cardWord}${first >= 0 ? `. You finished after ${first} of ${d.cells.length} cards.` : '.'}</p>
    <div><p class="line" style="margin-bottom:6px">The run, card by card: filled is on the beat, empty is missed</p><div class="pstrip" role="img" aria-label="${d.hit} of ${d.n} cards on the beat${d.missed.length ? `; missed ${d.missed.length}` : ''}">${strip}</div></div>
    ${d.timing ? `<p class="line">${timingLine(d.timing)}</p>` : ''}
    <p class="line">${d.missed.length ? `Missed: <b>${d.missed.map(esc).join(', ')}</b>. The pulse carried on without them.` : 'No card missed.'}${d.wrong ? ` ${d.wrong} ${d.wrong === 1 ? 'key was' : 'keys were'} struck off the beat or wrong.` : ''}</p>
    <p class="line">${esc(d.note)}</p>
    <div class="row"><button class="btn primary" id="runAgain">${icon('restart')}Run again</button><button class="btn" id="toStages">Back to Read</button></div>
  </div></div>`
}
