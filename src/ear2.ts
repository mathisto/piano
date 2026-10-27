import { MAJOR, MINOR, RHYTHM, beatMs, biasText, noteAt, pc, scoreTaps, seeded, tonicMidi } from './ear'
import { INV, NAMES, QUAL, cadenceCards, type TCard } from './theory'

/** Chord ear and question-and-answer phrases. Pure generators and checkers; the sound and the clock are in ear-play.ts. Note: top-level code here must not touch ear.ts or theory.ts (an import cycle). */

// ---- chord ear ----
/** The pitch classes stacked upward from the first one, which sits at or above `low`. */
const stack = (pcs: number[], low: number) => {
  const out: number[] = []
  for (const p of pcs) {
    const from = out.length ? out[out.length - 1] : low - 1
    out.push(from + ((((p - from) % 12) + 12) % 12 || 12))
  }
  return out
}

/** Arpeggiated slowly, then blocked. */
const arpeggio = (ns: number[]): { p: number[]; at: number; dur: number }[] => [...ns.map((n, i) => ({ p: [n], at: i * 450, dur: 420 })), { p: ns, at: ns.length * 450 + 150, dur: 1700 }]

const ASK_CHORD = 'Listen, then play the chord back in any octave and order, or just its root.'
const VERBS = ['Listen: major or minor?', 'Listen: which chord?', 'Listen: which note is lowest?', 'Listen: a short progression', 'Listen: a seventh chord']

/** 1 major or minor on C (three registers); 2 every root; 3 triad inversions (the lowest note matters); 4 I–IV–V–I and I–V–vi–IV in every key, a chord at a time; 5 dominant 7ths. */
export function chordEarCards(level: number): TCard[] {
  if (level === 4)
    return cadenceCards(3)
      .filter((c) => /^cad:(I–IV–V–I|I–V–vi–IV):/.test(c.id))
      .map((c) => {
        const [, label, tonic] = c.id.split(':')
        const low = tonicMidi(Number(tonic)) - 12
        return { id: `ear:prog:${label}:${tonic}`, prompt: VERBS[3], name: `${label} in ${NAMES[Number(tonic)]} major`, steps: c.steps, show: c.show, ask: 'Listen, then play each chord in turn, in any octave.', play: { kind: 'notes', ev: c.steps.map((s, i) => ({ p: stack(s.pcs, low), at: i * 1200, dur: 1100 })) } }
      })
  const out: TCard[] = []
  const quals = level === 5 ? ['dom7'] : ['maj', 'min']
  for (const root of level === 1 ? [0] : NAMES.keys())
    for (const q of quals)
      for (const inv of level === 3 ? [1, 2] : [0])
        for (const low of level === 1 ? [48, 60, 72] : level === 5 ? [48, 60] : [55]) {
          const [label, iv] = QUAL[q]
          const pcs = iv.map((i) => pc(root + i))
          const lowest = pcs[inv]
          const ns = stack([...pcs.slice(inv), ...pcs.slice(0, inv)], low)
          out.push({
            id: `ear:chord:${level}:${q}:${root}:${inv}:${low}`,
            prompt: VERBS[level - 1],
            name: `${NAMES[root]} ${label}${inv ? `, ${INV[inv]}` : ''}`,
            steps: [{ pcs, bass: inv ? lowest : undefined, root: inv ? undefined : root }],
            show: `${NAMES[root]} ${label}: ${pcs.map((p) => NAMES[p]).join(' ')}${inv ? `, with ${NAMES[lowest]} lowest` : ''}`,
            ask: inv ? 'Listen, then play the chord back with the same note lowest.' : ASK_CHORD,
            play: { kind: 'notes', ev: arpeggio(ns) },
          })
        }
  return out
}

// ---- question and answer ----
const QA_LEVELS = [
  { keys: [0], minor: false, echo: false },
  { keys: [0, 7, 5, 2, 10, 9, 4, 3, 8, 11, 1, 6], minor: false, echo: false },
  { keys: [9, 4, 2, 7, 0, 5], minor: true, echo: false },
  { keys: [0, 7, 5, 2, 10, 9], minor: false, echo: true },
]
const BARS = 16 // eighth-note cells in two bars of 4/4
const MIN_NOTES = 4

/** Two-bar stepwise phrases, 60 per level. A "question" phrase from the app ends on the dominant and you answer on the tonic; the app's closing phrase ends on the tonic and you ask back, ending on the dominant. The ids hold the notes and the rhythm, so spaced review finds a phrase again. */
export function qaCards(level: number): TCard[] {
  const L = QA_LEVELS[level - 1]
  const rnd = seeded(3000 + level)
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]
  const out = new Map<string, TCard>()
  for (let guard = 0; out.size < 60 && guard < 5000; guard++) {
    const tonic = pick(L.keys)
    const answer = rnd() < 0.5 // the player answers (ends on the tonic) or asks (ends on the dominant)
    const lens: number[] = []
    for (let sum = 0; sum < BARS; ) {
      const l = Math.min(BARS - sum, pick([1, 2, 2, 2, 2, 4]))
      lens.push(l)
      sum += l
    }
    if (lens.length < 5 || lens.length > 8 || lens[lens.length - 1] < 2) continue
    const ks = [answer ? pick([4, 11]) : pick([0, 7])] // the app's phrase ends here; build it backwards by steps
    for (let i = 1; i < lens.length; i++) {
      let d = pick([1, 1, 1, 2, 0]) * (rnd() < 0.5 ? -1 : 1)
      if (ks[0] + d < -2 || ks[0] + d > 9) d = -d
      ks.unshift(ks[0] + d)
    }
    const onsets = lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0))
    const sc = L.minor ? MINOR : MAJOR
    const B = beatMs() / 2
    const key = `${NAMES[tonic]} ${L.minor ? 'minor' : 'major'}`
    const end = answer ? 'tonic' : 'dominant'
    const endName = NAMES[pc(tonic + (answer ? 0 : 7))]
    const id = `ear:qa:${level}:${answer ? 'a' : 'q'}:${tonic}:${ks.join(',')}:${lens.join('')}`
    out.set(id, {
      id,
      prompt: `${answer ? 'Answer' : 'Ask back'} in ${key}: finish on ${endName}`,
      name: `${answer ? 'answer' : 'question'} in ${key}`,
      steps: [],
      show: `${L.echo ? 'The same rhythm, ' : ''}${MIN_NOTES} notes or more, all in ${key}, a steady pulse, ending on ${endName}`,
      ask: `Listen to the two bars, then play two of your own on the click: ${MIN_NOTES} notes or more, all in the key${L.echo ? ', in the same rhythm' : ''}.`,
      play: { kind: 'qa', ev: ks.map((k, i) => ({ p: [noteAt(tonic, sc, k)], at: onsets[i] * B, dur: lens[i] * B - 60 })), cells: onsets, tonic, minor: L.minor, end, echo: L.echo },
    })
  }
  return [...out.values()]
}

export interface QAResult {
  ok: boolean
  held: string[]
  broke: string[]
  bias: number
  spread: number
  text: string // plain words: what held, what did not, and the pulse offset
}

/** Judge an answer on form only, never taste. `notes` are pitches with ms from the start of the player's two bars. Notes within RHYTHM.merge of the last onset are one onset (a chord's keys), but every pitch counts for the key. The pulse is the RHYTHM maths: each onset to its nearest eighth, the mean offset taken out, every onset then within RHYTHM.window. */
export function checkQA(q: { tonic: number; minor: boolean; end: 'tonic' | 'dominant'; cells: number[]; echo: boolean }, notes: { p: number; t: number }[]): QAResult {
  const held: string[] = []
  const broke: string[] = []
  const say = (ok: boolean, yes: string, no: string) => (ok ? held : broke).push(ok ? yes : no)
  const onsets: { p: number; t: number }[] = []
  for (const n of notes) if (!onsets.length || n.t - onsets[onsets.length - 1].t >= RHYTHM.merge) onsets.push(n)
  say(onsets.length >= MIN_NOTES, `${onsets.length} notes`, `${onsets.length} note${onsets.length === 1 ? '' : 's'} (${MIN_NOTES} or more asked)`)
  const scale = (q.minor ? MINOR : MAJOR).map((s) => pc(q.tonic + s))
  const off = [...new Set(notes.filter((n) => !scale.includes(pc(n.p))).map((n) => NAMES[pc(n.p)]))]
  say(!off.length, 'all in the key', `${off.join(', ')} not in the key`)
  const target = pc(q.tonic + (q.end === 'tonic' ? 0 : 7))
  say(!!notes.length && pc(notes[notes.length - 1].p) === target, `ended on ${NAMES[target]}`, `did not end on ${NAMES[target]}`)
  const taps = onsets.map((n) => n.t)
  const cells = taps.map((t) => Math.round(t / (beatMs() / 2)))
  const r = taps.length ? scoreTaps(cells, taps) : { ok: false, bias: 0, spread: 0 }
  say(r.ok, 'pulse held', 'pulse wandered')
  if (q.echo) say(cells.length === q.cells.length && cells.every((c, i) => c === q.cells[i]), 'same rhythm', 'rhythm differed from the phrase')
  const timing = taps.length > 1 ? ` ${biasText(r.bias, r.spread)}.` : ''
  return { ok: !broke.length, held, broke, bias: r.bias, spread: r.spread, text: `${held.length ? `Held: ${held.join(', ')}.` : ''}${broke.length ? ` Did not hold: ${broke.join(', ')}.` : ''}${timing}`.trim() }
}
