import './report.css'
import type { Catalog, Piece } from './catalog-types'
import { creditLine } from './credits'
import { STAGES as READ, mastery as readMastery, nextStage as readNext, weakest, dayNum, type Stats } from './drill'
import { STAGES as SCALES, mastery as scaleMastery, nextStage as scaleNext, type ScaleStats } from './scales'
import { MIN_SEC, dayOfKey, streak } from './streak'
import { SYLLABUS, stateOf, type TechStats } from './syllabus'
import { dayKey } from './week'
import type { HistoryEntry, Progress, TouchEntry } from './store'
import { mean, pct, plural } from './util'

declare const __COMMIT__: string | undefined // set in vite.config.ts; absent under other tools

/**
 * Where a problem report goes. An address (contains @) opens the mail app; a URL opens that page with title and body in the query.
 * Nothing is sent by the app: the link only opens the user's mail or browser. The owner may swap in a mailto address here.
 */
const REPORT_TO = 'https://github.com/mathisto/piano/issues/new'

const PROMPT = 'What is wrong? (wrong note, wrong rhythm, wrong key, wrong hand, missing bars, other)'

/** The text of a report for one library piece, from its catalogue row. `bar` is the 1-based bar the player was at, if known. */
export function reportText(cat: Catalog, p: Piece, bar?: number, version = typeof __COMMIT__ === 'string' ? __COMMIT__ : ''): { title: string; body: string } {
  return {
    title: `Problem with ${p.title} (${p.id})`,
    body: [
      `Piece: ${p.title} (${p.id})`,
      `Credit: ${creditLine(cat, p)}`,
      `Source: ${p.sourceUrl}`,
      `File sha256: ${p.sha256}`,
      `App version: ${version || 'unknown'}`,
      `Catalogue built: ${cat.built || 'bundled with the app'}`,
      `Importer flags: ${p.flags.join(', ') || 'none'}`,
      `Bar: ${bar ?? 'not started'}`,
      '',
      PROMPT,
      '',
      '',
    ].join('\n'),
  }
}

/** The link the Report a problem button follows. */
export function reportHref(cat: Catalog, p: Piece, bar?: number, to = REPORT_TO, version?: string): string {
  const { title, body } = reportText(cat, p, bar, version)
  const q = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  return to.includes('@') ? `mailto:${to}?${q({ subject: title, body })}` : `${to}?${q({ title, body })}`
}

/** An anchor like the Credits links (target _blank, which the iPad app hands to the system), so mail or the browser opens outside the web view. */
export const reportLink = (cat: Catalog, p: Piece, bar?: number) =>
  `<a class="report" href="${reportHref(cat, p, bar).replace(/&/g, '&amp;')}" target="_blank" rel="noopener">Report a problem</a>`

// ---------------------------------------------------------------- practice summary

/** What exportAll writes, as far as the summary reads it. */
export interface SummaryData {
  practice?: Record<string, number>
  history?: HistoryEntry[]
  reading?: Stats
  scales?: ScaleStats
  technique?: TechStats
  touch?: TouchEntry[]
  progress?: Record<string, Progress>
}

const AREA: [HistoryEntry['kind'], string][] = [['read', 'Reading'], ['run', 'Sight Run'], ['scale', 'Scales'], ['theory', 'Theory'], ['song', 'Songs'], ['tech', 'Technique']]
const mins = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`)

/** A plain-text report for a teacher: what was practised, how accurately, what is solid and what is weak. `titles` maps song ids to names. */
export function buildSummary(d: SummaryData, titles: Record<string, string> = {}, now = new Date()): string {
  const today = dayNum(now)
  const out: string[] = ['# Piano practice summary', `Written ${dayKey(now)} by Piano Forte. Accuracy is the share of notes or answers right in a session.`]
  const section = (name: string, ...lines: string[]) => out.push('', `## ${name}`, ...lines)

  const days = Object.entries(d.practice ?? {}).filter(([, s]) => s > 0).sort(([a], [b]) => (a < b ? -1 : 1))
  const total = (xs: [string, number][]) => Math.round(xs.reduce((a, [, s]) => a + s, 0) / 60)
  const played = days.filter(([, s]) => s >= MIN_SEC)
  const recent = days.filter(([k]) => dayOfKey(k) > today - 28)
  const st = streak(d.practice ?? {}, today)
  section(
    'Practice',
    days.length ? `- Period: ${days[0][0]} to ${days[days.length - 1][0]}` : '- No practice recorded yet.',
    `- Days practised (a minute or more): ${played.length}, ${mins(total(days))} in all`,
    `- Last 28 days: ${plural(recent.filter(([, s]) => s >= MIN_SEC).length, 'day')}, ${mins(total(recent))}`,
    `- Current streak: ${plural(st.n, 'day')}${st.freezes ? `, ${plural(st.freezes, 'freeze')} banked` : ''}`,
  )

  const h = d.history ?? []
  section(
    'Accuracy by area',
    ...AREA.flatMap(([k, name]) => {
      const xs = h.filter((e) => e.kind === k).map((e) => e.acc)
      if (!xs.length) return []
      const last = xs.slice(-5)
      const before = xs.slice(-10, -5)
      const delta = before.length >= 3 ? Math.round((mean(last) - mean(before)) * 100) : null
      const trend = delta === null ? 'no trend yet' : delta === 0 ? 'steady' : `${delta > 0 ? 'up' : 'down'} ${plural(Math.abs(delta), 'point')} on the five before`
      return [`- ${name}: ${plural(xs.length, 'session')}, average ${pct(mean(xs))}, last five ${pct(mean(last))} (${trend})`]
    }),
  )
  if (!h.length) out.push('- No sessions recorded yet.')

  const reading = d.reading ?? {}
  const rs = READ.filter((s) => readMastery(s, reading).solid)
  const nr = readNext(reading)
  const weak = weakest(reading, 5)
  section(
    'Reading',
    `- Stages solid: ${rs.length} of ${READ.length}${rs.length ? ` (${rs.map((s) => s.name).join(', ')})` : ''}`,
    `- Working on: ${nr.name}, ${pct(readMastery(nr, reading).pct)}`,
    weak.length ? `- Weakest notes: ${weak.map((w) => `${w.name} (${pct(w.clean)} right first time, ${(w.rt / 1000).toFixed(1)} s)`).join('; ')}` : '- Weakest notes: none standing out yet',
  )

  const scales = d.scales ?? {}
  const ss = SCALES.filter((s) => scaleMastery(s, scales).solid)
  const ns = scaleNext(scales)
  const tech = d.technique ?? {}
  const ts = SYLLABUS.filter((r) => stateOf(tech, r.id, today) === 'solid').length
  section(
    'Scales and technique',
    `- Scale stages solid: ${ss.length} of ${SCALES.length}${ss.length ? ` (${ss.map((s) => s.name).join(', ')})` : ''}`,
    `- Working on: ${ns.name}, ${scaleMastery(ns, scales).done} of ${scaleMastery(ns, scales).total} scales at tempo`,
    `- Technique exercises solid: ${ts} of ${SYLLABUS.length}`,
  )

  const prog = Object.entries(d.progress ?? {})
  const ready = prog.filter(([, p]) => (p.days?.length ?? 0) >= 2).map(([id, p]) => `${titles[id] ?? id}${p.best ? ` (best ${pct(p.best.acc)})` : ''}`).sort()
  section('Songs', `- Pieces played: ${prog.filter(([, p]) => p.plays > 0).length}`, `- Ready (clean on two different days): ${ready.length ? ready.join('; ') : 'none yet'}`)

  const t = (d.touch ?? []).filter((e) => e.id !== 'calibration' && e.n > 0).slice(-20)
  const wmean = (f: (e: TouchEntry) => [number, number]) => {
    const n = t.reduce((a, e) => a + f(e)[0], 0)
    return n ? Math.round(t.reduce((a, e) => a + f(e)[0] * f(e)[1], 0) / n) : null
  }
  const n = t.reduce((a, e) => a + e.n, 0)
  const band = (k: 'soft' | 'medium' | 'hard') => pct(t.reduce((a, e) => a + e.bands[k], 0) / Math.max(1, t.reduce((a, e) => a + e.bands.soft + e.bands.medium + e.bands.hard, 0)))
  section(
    'Touch',
    t.length
      ? `- Last ${plural(t.length, 'session')} on a keyboard (${plural(n, 'note')}): average velocity ${wmean((e) => [e.n, e.mean])} of 127, spread plus or minus ${wmean((e) => [e.n, e.sd])} (smaller is more even)`
      : '- No keyboard sessions recorded yet.',
    ...(t.length ? [`- Right hand ${wmean((e) => [e.R.n, e.R.mean]) ?? 'n/a'}, left hand ${wmean((e) => [e.L.n, e.L.mean]) ?? 'n/a'}; soft ${band('soft')}, medium ${band('medium')}, hard ${band('hard')}`] : []),
  )
  return out.join('\n') + '\n'
}
