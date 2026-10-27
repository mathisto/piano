import './memory.css'
import { pcName } from './chord'
import { icon } from './icons'
import { barList, slipped } from './readthrough'
import { noteName } from './spell'
import type { Song } from './song'
import type { Progress } from './store'

// Memorise: Learn (the song waits) with the score fading by bars. Players lean on finger memory, which fails under nerves;
// seeing the shape (analysis), hearing it and knowing where the hands go hold up better. So the card asks you to look
// at the piece first, the score fades in stages, and the bars you stumble in come back as weak spots.

export const TOP = 4 // stage 4: no staff at all
export const STAGES = ['Full score', 'Every 4th bar hidden', 'Every 2nd bar hidden', 'Barlines only', 'No staff']
export const CLEAN_TO_ADVANCE = 2 // clean passes in a row at a stage move you on
export const DROP_OVER = 3 // more slips than this in one pass step you back

/** Whether a bar's notes are hidden at a stage (bars 0-based): stage 1 hides bars 4, 8, 12..., stage 2 every even bar, 3 and up all. */
export const hidden = (stage: number, bar: number) => (stage >= 3 ? true : stage === 2 ? bar % 2 === 1 : stage === 1 ? bar % 4 === 3 : false)

export interface MemState {
  stage: number
  clean: number // clean passes in a row at this stage
}

/** After a pass: two clean passes in a row move up a stage, more than three slips move down one; `cleared` is the stage just passed. */
export function afterPass(s: MemState, pass: { clean: boolean; slips: number; peeks: number }): MemState & { moved: -1 | 0 | 1; cleared?: number } {
  if (pass.slips > DROP_OVER) return { stage: Math.max(0, s.stage - 1), clean: 0, moved: s.stage > 0 ? -1 : 0 }
  if (!pass.clean || pass.peeks > 0) return { stage: s.stage, clean: 0, moved: 0 } // a peek is not from memory
  if (s.clean + 1 < CLEAN_TO_ADVANCE) return { stage: s.stage, clean: s.clean + 1, moved: 0 }
  return { stage: Math.min(TOP, s.stage + 1), clean: 0, moved: s.stage < TOP ? 1 : 0, cleared: s.stage }
}

/** Where a memorise session starts: the highest stage cleared (a review checks it still holds), at least `floor`. */
export const startStage = (p: Progress | undefined, floor = 0) => Math.min(TOP, Math.max(floor, p?.memStage ?? 0))

/** The bars to look at again: up to `n` with the most trouble this pass, in bar order. */
export const weakSpots = (heat: number[], n = 3) =>
  slipped(heat)
    .sort((a, b) => heat[b] - heat[a] || a - b)
    .slice(0, n)
    .sort((a, b) => a - b)

/** "G major", "E minor", or both with the signature when neither the last nor the first bass note is a tonic. */
export function keyName(song: Song): string {
  const f = song.fifths
  const major = (((f * 7) % 12) + 12) % 12
  const minor = (major + 9) % 12
  const ts = song.notes.map((n) => n.t)
  const bassAt = (t: number) => Math.min(...song.notes.filter((n) => Math.abs(n.t - t) < 0.05).map((n) => n.p)) % 12 // lowest note of that chord
  const bass = [bassAt(Math.max(...ts)), bassAt(Math.min(...ts))].find((pc) => pc === major || pc === minor)
  const sig = f === 0 ? 'no sharps or flats' : `${Math.abs(f)} ${f > 0 ? 'sharp' : 'flat'}${Math.abs(f) > 1 ? 's' : ''}`
  const change = song.keys?.find((k) => k.bar > 0 && k.fifths !== f)
  const name = bass === major ? `${pcName(major, f)} major` : bass === minor ? `${pcName(minor, f)} minor` : `${pcName(major, f)} major or ${pcName(minor, f)} minor, ${sig}`
  return change ? `${name}, changes in bar ${change.bar + 1}` : name
}

/** Bars (0-based) whose pitches, in order, are the same as an earlier bar's. Empty bars do not count. */
export function repeats(song: Song): number[] {
  const by: number[][] = song.bars.map(() => [])
  for (const n of [...song.notes].sort((a, b) => a.t - b.t || a.p - b.p)) by[n.bar]?.push(n.p)
  const seen = new Set<string>()
  return by.flatMap((ps, i) => {
    const k = ps.join(',')
    if (!ps.length) return []
    if (seen.has(k)) return [i]
    seen.add(k)
    return []
  })
}

/** The 'analyse first' facts: a few plain things to notice before playing from memory. */
export function facts(song: Song): [string, string][] {
  const meters = [...new Set(song.bars.filter((b) => !b.ql).map((b) => `${b.n}/${b.den}`))]
  const span = (h: 'R' | 'L') => {
    const ps = song.notes.filter((n) => n.h === h).map((n) => n.p)
    return ps.length ? `${noteName(Math.min(...ps), song.fifths)} to ${noteName(Math.max(...ps), song.fifths)}` : ''
  }
  const rep = repeats(song)
  const out: [string, string][] = [
    ['Key', keyName(song)],
    ['Time', meters.join(', ') || `${song.bars[0]?.n ?? 4}/${song.bars[0]?.den ?? 4}`],
    ['Bars', String(song.bars.length)],
    ['Right hand', span('R')],
    ['Left hand', span('L')],
    ['Repeats', rep.length ? `${rep.length} ${rep.length === 1 ? 'bar is' : 'bars are'} the same as an earlier bar${rep.length <= 6 ? `: ${barList(rep)}` : ''}` : 'No bar repeats an earlier one'],
  ]
  return out.filter(([, v]) => v)
}

/** "Memorised 3/4" for a Songs row, once any stage is cleared. */
export const memTag = (p?: Progress) => (p?.memStage ? ` <span class="tag">Memorised ${p.memStage}/${TOP}</span>` : '')

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const stageSeg = (stage: number) =>
  `<div class="seg mem-seg" role="radiogroup" aria-label="Stage">${STAGES.map((s, i) => `<label title="${s}"><input type="radio" name="memStage" value="${i}"${i === stage ? ' checked' : ''}><span>${i}</span></label>`).join('')}</div>`

/** The start card: the stage (set by hand too), then the facts to notice before you play. */
export function startCard(o: { title: string; stage: number; facts: [string, string][]; go: string }) {
  return `<b>${esc(o.title)}</b>
    <span class="cap">Memorise · stage</span>${stageSeg(o.stage)}
    <span class="hint" id="memName">${STAGES[o.stage]}. ${o.go}</span>
    <div class="mem-facts"><span class="cap">Look first</span><dl>${o.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>`
}

/** The strip over the staff while playing: stage, how this pass is going, and Peek. */
export const barHtml = (o: { stage: number; clean: number; right: number; slips: number; peeking: boolean }) =>
  `<span class="mem-st">Stage ${o.stage} · ${STAGES[o.stage]}</span><span class="mem-live" role="status"><b>${o.right}</b> right · <b>${o.slips}</b> ${o.slips === 1 ? 'slip' : 'slips'} · clean ${o.clean} of ${CLEAN_TO_ADVANCE}</span>${o.stage ? `<button class="btn sm" id="memPeek"${o.peeking ? ' disabled' : ''}>${icon('page')}Peek</button>` : ''}`

export interface PassReport {
  title: string
  from: number // the stage the pass was played at
  to: MemState & { moved: -1 | 0 | 1; cleared?: number }
  slips: number
  peeks: number
  clean: boolean
  heat: number[]
  bars: number
}

/** What a pass did to the stage, in one sentence. */
export function verdict(r: PassReport): string {
  if (r.to.moved < 0) return `More than ${DROP_OVER} slips: back to stage ${r.to.stage}, ${STAGES[r.to.stage].toLowerCase()}.`
  if (r.to.moved > 0) return `Clean twice: on to stage ${r.to.stage}, ${STAGES[r.to.stage].toLowerCase()}.`
  if (r.to.cleared === TOP) return 'Clean twice with no staff at all. Memorised.'
  if (r.clean && r.peeks) return 'Clean, but with a peek: it counts once you play it without one.'
  if (r.clean) return `Clean. One more clean pass moves you on.`
  return `Not clean yet: the count of clean passes starts again.`
}

/** The end-of-pass card: the verdict, slips and peeks, and the bars to look at again. */
export function passCard(r: PassReport) {
  const weak = weakSpots(r.heat)
  const bad = slipped(r.heat)
  const max = Math.max(1, ...Array.from(r.heat, (h) => h ?? 0))
  const cells = Array.from({ length: r.bars }, (_, i) => `<i class="${(r.heat[i] ?? 0) > 0 ? 'hot' : ''}" style="--h:${((r.heat[i] ?? 0) / max).toFixed(2)}" title="Bar ${i + 1}"></i>`).join('')
  return `<div class="results"><div class="card rt-card mem-card" role="dialog" aria-label="Memorise pass">
    <div class="big-grade" aria-label="Stage ${r.from} of ${TOP}">${r.from}<small>/${TOP}</small></div>
    <h2>${STAGES[r.from]}</h2>
    <p class="line"><b>${r.slips}</b> ${r.slips === 1 ? 'slip' : 'slips'} · <b>${r.peeks}</b> ${r.peeks === 1 ? 'peek' : 'peeks'}</p>
    <p class="line">${verdict(r)}</p>
    <div class="rt-bars-wrap"><div class="rt-bars" role="img" aria-label="${bad.length ? `Trouble in bars ${barList(bad)}` : 'No bar slipped'}">${cells}</div>
      <p class="line rt-sub">${weak.length ? `Weak spots: ${weak.length === 1 ? 'bar' : 'bars'} ${barList(weak)}. Look at ${weak.length === 1 ? 'it' : 'them'} with the score, then hide ${weak.length === 1 ? 'it' : 'them'} again.` : 'No weak spots this pass.'}</p></div>
    <div class="row">
      <button class="btn primary big" id="memAgain">${icon('restart')}Stage ${r.to.stage}</button>
      <button class="btn" id="toLib">Songs</button>
    </div>
  </div></div>`
}
