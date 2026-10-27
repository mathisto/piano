import { describe, expect, it } from 'vitest'
import { builtin } from './catalog'
import { cards, cardKey, STAGES, type Stats } from './drill'
import { buildSummary, reportHref, reportText } from './report'
import type { LibraryEntry } from './credits'
import type { HistoryEntry } from './store'

const E: LibraryEntry = {
  id: 'mutopia-647',
  title: 'Melodie, Op. 68 No. 1',
  composer: 'Robert Schumann (1810–1856)',
  collection: 'Mutopia Project',
  typesetter: 'Philippe Hézaine',
  licence: 'CC-BY-SA-2.5',
  licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.5/',
  licenceEvidence: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=647',
  sourceUrl: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=647',
  sourceEdition: 'Peters',
  format: 'midi',
  file: 'mutopia-647.mid',
  level: 'Elementary',
  bytes: 2883,
  sha256: 'ab'.repeat(32),
}
const cat = { ...builtin([E]), built: '2026-10-20' }
const p = { ...cat.pieces[0], flags: ['repeats-unexpanded', 'key-changes'] }

describe('report a problem', () => {
  it('writes the piece, file, version, flags, bar and the question', () => {
    expect(reportText(cat, p, 12, 'abc1234')).toEqual({
      title: 'Problem with Melodie, Op. 68 No. 1 (mutopia-647)',
      body: `Piece: Melodie, Op. 68 No. 1 (mutopia-647)
Credit: Robert Schumann (1810–1856) · Mutopia Project, typeset by Philippe Hézaine · CC BY-SA 2.5
Source: https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=647
File sha256: ${'ab'.repeat(32)}
App version: abc1234
Catalogue built: 2026-10-20
Importer flags: repeats-unexpanded, key-changes
Bar: 12

What is wrong? (wrong note, wrong rhythm, wrong key, wrong hand, missing bars, other)

`,
    })
  })

  it('says so when the version, flags or bar are unknown', () => {
    const b = reportText({ ...cat, built: '' }, { ...p, flags: [] }, undefined, '').body
    expect(b).toContain('App version: unknown')
    expect(b).toContain('Catalogue built: bundled with the app')
    expect(b).toContain('Importer flags: none')
    expect(b).toContain('Bar: not started')
  })

  it('links to an issue form, or to mail when the address has an @', () => {
    const issue = new URL(reportHref(cat, p, 3, 'https://example.org/issues/new', 'v1'))
    expect(issue.origin + issue.pathname).toBe('https://example.org/issues/new')
    expect(issue.searchParams.get('title')).toBe('Problem with Melodie, Op. 68 No. 1 (mutopia-647)')
    expect(issue.searchParams.get('body')).toContain('Bar: 3')
    const mail = reportHref(cat, p, 3, 'owner@example.org', 'v1')
    expect(mail.startsWith('mailto:owner@example.org?subject=Problem%20with%20Melodie')).toBe(true)
    expect(decodeURIComponent(mail)).toContain('App version: v1')
  })
})

describe('practice summary', () => {
  const now = new Date(2026, 9, 27, 12) // Tuesday 27 Oct 2026
  const solidStage = STAGES[0]
  const reading: Stats = Object.fromEntries(cards(solidStage).map((c) => [cardKey(c), { n: 12, clean: 1, rt: 1000 }]))
  const weakCard = cards(STAGES[1]).find((c) => c.pitches[0] === 64)!
  reading[cardKey(weakCard)] = { n: 6, clean: 0.5, rt: 3500 }
  const h = (kind: HistoryEntry['kind'], accs: number[]): HistoryEntry[] => accs.map((acc, i) => ({ ts: i, kind, label: kind, acc }))
  const data = {
    practice: { '2026-09-01': 1500, '2026-10-24': 1800, '2026-10-25': 1200, '2026-10-26': 900, '2026-10-27': 30 },
    history: [...h('read', [0.6, 0.62, 0.65, 0.7, 0.72, 0.8, 0.82, 0.85, 0.88, 0.9]), ...h('song', [0.9, 0.95])],
    reading,
    scales: {},
    technique: {},
    touch: [
      { ts: 1, id: 'calibration', title: 'c', mode: 'cal', n: 20, mean: 40, sd: 5, R: { n: 20, mean: 40 }, L: { n: 0, mean: 0 }, bands: { soft: 20, medium: 0, hard: 0 } },
      { ts: 2, id: 'lib:a', title: 'A', mode: 'perform', n: 100, mean: 70, sd: 10, R: { n: 60, mean: 72 }, L: { n: 40, mean: 66 }, bands: { soft: 10, medium: 80, hard: 10 } },
      { ts: 3, id: 'lib:a', title: 'A', mode: 'perform', n: 100, mean: 80, sd: 14, R: { n: 50, mean: 82 }, L: { n: 50, mean: 78 }, bands: { soft: 10, medium: 60, hard: 30 } },
    ],
    progress: {
      'lib:a': { plays: 3, last: 0, heat: [], days: [20000, 20001], best: { score: 1, acc: 0.93, grade: 'A' } },
      'lib:b': { plays: 1, last: 0, heat: [], days: [20001] },
    },
  }

  it('turns the fixture into the expected text', () => {
    expect(buildSummary(data, { 'lib:a': 'Melodie', 'lib:b': 'Minuet' }, now)).toBe(`# Piano practice summary
Written 2026-10-27 by Piano Forte. Accuracy is the share of notes or answers right in a session.

## Practice
- Period: 2026-09-01 to 2026-10-27
- Days practised (a minute or more): 4, 1 h 31 min in all
- Last 28 days: 3 days, 1 h 6 min
- Current streak: 3 days

## Accuracy by area
- Reading: 10 sessions, average 75%, last five 85% (up 19 points on the five before)
- Songs: 2 sessions, average 93%, last five 93% (no trend yet)

## Reading
- Stages solid: 1 of ${STAGES.length} (Treble landmarks)
- Working on: Treble five-finger, 44%
- Weakest notes: E4, treble clef (50% right first time, 3.5 s)

## Scales and technique
- Scale stages solid: 0 of 13
- Working on: The easy keys, 0 of 10 scales at tempo
- Technique exercises solid: 0 of 31

## Songs
- Pieces played: 2
- Ready (clean on two different days): Melodie (best 93%)

## Touch
- Last 2 sessions on a keyboard (200 notes): average velocity 75 of 127, spread plus or minus 12 (smaller is more even)
- Right hand 77, left hand 73; soft 10%, medium 70%, hard 20%
`)
  })

  it('copes with nothing recorded', () => {
    const s = buildSummary({}, {}, now)
    expect(s).toContain('- No practice recorded yet.')
    expect(s).toContain('- No sessions recorded yet.')
    expect(s).toContain('- No keyboard sessions recorded yet.')
    expect(s).not.toMatch(/NaN|undefined|Infinity/)
  })
})
