import './readthrough.css'
import { icon } from './icons'
import type { Progress } from './store'

// Read through: a look-through, then one no-stop pass of a new, easy piece. Sight-reading grows with volume of new music
// a level or two under what you practise (Mishra 2014); late or wrong notes are missed and the music carries on.

export const LOOK = 30 // seconds of look-through before the count-in
export const LEVELS = ['First notes', 'Beginner', 'Elementary', 'Intermediate'] // starters and the library manifest share these names

export interface RtPiece {
  id: string
  title: string
  level: string
}

const rank = (level: string) => Math.max(0, LEVELS.indexOf(level))

/** The level you play at: the hardest piece with a Perform result or a clean run. Beginner before anything counts. */
export function playerLevel(pieces: RtPiece[], prog: Map<string, Progress>): number {
  const ranks = pieces.filter((p) => prog.get(p.id)?.best || prog.get(p.id)?.days?.length).map((p) => rank(p.level))
  return ranks.length ? Math.max(...ranks) : 1
}

/** The next piece to read: one you have not played, two levels under yours but no easier than Beginner (else the nearest
 * level under that, then above);
 * when every piece has been played, the one played longest ago. */
export function pickPiece(pieces: RtPiece[], prog: Map<string, Progress>, skip = ''): { piece: RtPiece; fresh: boolean; why: string } | undefined {
  const lv = playerLevel(pieces, prog)
  const target = Math.max(1, lv - 2) // First notes is a warm-up, not a piece: Beginner is the floor
  const cost = (p: RtPiece) => (rank(p.level) <= target ? target - rank(p.level) : 10 * (rank(p.level) - target))
  const pool = pieces.filter((p) => p.id !== skip)
  const unplayed = pool.filter((p) => !prog.get(p.id)?.last)
  const fresh = unplayed.length > 0
  const piece = (fresh ? unplayed : pool).map((p, i) => ({ p, i })).sort((a, b) => cost(a.p) - cost(b.p) || (fresh ? 0 : prog.get(a.p.id)!.last - prog.get(b.p.id)!.last) || a.i - b.i)[0]?.p
  if (!piece) return undefined
  const why = !fresh
    ? 'You have played every piece here, so this is the one you played longest ago.'
    : rank(piece.level) < lv
      ? `You play ${LEVELS[lv]} pieces. Reading improves with plenty of new music that is easier than what you practise, so this is a new ${piece.level} piece.`
      : `A new ${piece.level} piece you have not played yet.`
  return { piece, fresh, why }
}

/** The tempo a read-through starts at: 70% of written, never faster than your fastest clean read-through. */
export const startRate = (best?: number) => Math.min(0.7, best ?? 0.7)

/** Bars (0-based) with any trouble in this pass, in order. */
export const slipped = (heat: number[]) => heat.flatMap((h, i) => (h > 0 ? [i] : []))

/** "3", "3 and 7", "3, 7 and 8" (1-based bar numbers). */
export function barList(bars: number[]): string {
  const s = bars.map((b) => String(b + 1))
  return s.length < 2 ? s.join('') : `${s.slice(0, -1).join(', ')} and ${s[s.length - 1]}`
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
export const pct = (r: number) => `${Math.round(r * 100)}%`

/** The look-through card on the stage; the timer, tempo and switch are updated in place by id. */
export function lookCard(o: { title: string; left: number; rate: number; ahead: boolean; why: string; credit?: string }) {
  return `<b>${esc(o.title)}</b>
    <span class="hint">Look it through: the key, the time, the bars that look hard. Nothing counts yet. Once it starts, the music does not stop for you.</span>
    <div class="rt-timer" role="timer" aria-label="Look-through time left"><i style="--f:${o.left / LOOK}" id="rtMeter"></i><span id="rtLeft">0:${String(o.left).padStart(2, '0')}</span></div>
    <div class="rt-row">
      <div class="rt-tempo" role="group" aria-label="Tempo"><span class="cap">Tempo</span>
        <button class="btn icon sm" id="rtSlower" aria-label="Slower">${icon('minus')}</button><span id="rtRate">${pct(o.rate)}</span><button class="btn icon sm" id="rtFaster" aria-label="Faster">${icon('plus')}</button>
      </div>
      <label class="switch"><input type="checkbox" id="rtAhead"${o.ahead ? ' checked' : ''}><i></i>Only the next two bars</label>
      <button class="btn" id="rtGo">${icon('play')}Start now</button>
    </div>
    ${o.why ? `<span class="rt-why">${esc(o.why)}</span>` : ''}${o.credit ? `<span class="rt-why">${esc(o.credit)}</span>` : ''}`
}

export interface Summary {
  title: string
  acc: number
  rate: number
  caught: number
  total: number
  wrong: number
  heat: number[] // this pass, per bar
  bars: number
  worst: { a: number; b: number } | null
  next?: { piece: RtPiece; why: string }
}

/** The end-of-run card: accuracy, the bars that slipped, a way to fix them, and the next piece to read. */
export function summaryCard(s: Summary) {
  const bad = slipped(s.heat)
  const max = Math.max(1, ...Array.from(s.heat, (h) => h ?? 0)) // the heat array has holes where nothing slipped
  const cells = Array.from({ length: s.bars }, (_, i) => {
    const h = s.heat[i] ?? 0
    return `<i class="${h > 0 ? 'hot' : ''}" style="--h:${(h / max).toFixed(2)}" title="Bar ${i + 1}${h > 0 ? ': slipped' : ''}"></i>`
  }).join('')
  return `<div class="results"><div class="card rt-card" role="dialog" aria-label="Read-through summary">
    <div class="big-grade">${pct(s.acc)}</div>
    <h2>Read through${s.rate < 1 ? ` at ${pct(s.rate)} tempo` : ''}</h2>
    <p class="line"><b>${pct(s.acc)}</b> accuracy · <b>${s.caught}</b> of ${s.total} notes caught · <b>${s.wrong}</b> wrong ${s.wrong === 1 ? 'note' : 'notes'}</p>
    <div class="rt-bars-wrap"><div class="rt-bars" role="img" aria-label="${bad.length ? `Slipped in bars ${barList(bad)}` : 'No bar slipped'}">${cells}</div>
      <p class="line rt-sub">${bad.length ? `Slipped in ${bad.length === 1 ? 'bar' : 'bars'} ${barList(bad)}.` : 'No bar slipped. Keep going like that.'}</p></div>
    ${s.worst ? `<p class="line">Bars ${s.worst.a + 1} to ${s.worst.b + 1} slipped most. Loop them slowly, then read on.</p>` : ''}
    ${s.next ? `<p class="line rt-sub">Next: <b>${esc(s.next.piece.title)}</b> · ${esc(s.next.piece.level)}. ${esc(s.next.why)}</p>` : ''}
    <div class="row">
      ${s.next ? `<button class="btn primary big" id="rtNext">${icon('play')}Next piece</button>` : ''}
      ${s.worst ? `<button class="btn${s.next ? '' : ' primary big'}" id="rtFix">${icon('loop')}Fix these</button>` : ''}
      <button class="btn" id="toLib">Songs</button>
    </div>
  </div></div>`
}
