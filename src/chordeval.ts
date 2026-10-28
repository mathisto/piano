import { beatQ, type Bar } from './song'

/** Evaluation only: reads Roman-numeral analyses (the .txt "rntxt" format of the When in Rome corpus) into absolute chords. Nothing here is used by the app. */

export type Cls = 'M' | 'm' | 'dim' | 'aug' | '7' | 'maj7' | 'm7' // the classes the evaluation compares; extensions above the seventh are dropped
export interface Ann {
  m: number // measure number as the analysis writes it (0 is a pickup)
  q: number // quarters into that measure
  root: number // pitch class; -1 for a label this reader cannot turn into a chord (the previous chord must not carry over it)
  cls: Cls
  key: number // tonic pitch class of the key in force
  minor: boolean
  alt: number // a second root that also counts as right (the tonic of a Cad64, which sounds as the tonic chord over the dominant bass), else -1
  form: string // the section the analysis names (exposition, development, verse ...), '' before any
}

const MAJ = [0, 2, 4, 5, 7, 9, 11]
const MIN = [0, 2, 3, 5, 7, 8, 10]
const DEG: Record<string, number> = { i: 0, ii: 1, iii: 2, iv: 3, v: 4, vi: 5, vii: 6 }
const LET: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }
// accidental, numeral, quality mark, figure, [no3][add4] modifiers, "/target"
const NUM = /^([#b-]*)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(o|ø|%|\/o|\+|M)?(\d+(?:\/\d+)*)?((?:\[[^\]]*\])*)(?:\/(.+))?$/
const SPECIAL = /^(Ger|Fr|It|Sw|N|Cad)(\d+(?:\/\d+)*)?((?:\[[^\]]*\])*)(?:\/(.+))?$/
const SEVENTH = /^(7|65|43|42|2|9|11|13|6\/5|4\/3|4\/2)$/
const shift = (acc: string) => [...acc].reduce((s, c) => s + (c === '#' ? 1 : -1), 0)

/** The key a "/target" names, as [tonic, minor]: "V/V" is the key of the dominant, "viio/ii" the key of the supertonic (lower case is minor). Null if unreadable. */
function sub(t: string | undefined, tonic: number, minor: boolean): [number, boolean] | null {
  if (!t) return [tonic, minor]
  const g = NUM.exec(t)
  const k = g && sub(g[6], tonic, minor)
  return g && k ? [degree(g[1], g[2], g[3], k), g[2] === g[2].toLowerCase()] : null
}

function degree(acc: string, rn: string, q: string | undefined, [tonic, minor]: [number, boolean]) {
  const d = DEG[rn.toLowerCase()]
  // ponytail: a diminished vii in a minor key is the leading-tone chord, so its root is raised without a written #; the corpus writes #viio for it, a bare viio would otherwise sit a semitone low
  const s = minor && d === 6 && /^(o|ø|%|\/o)$/.test(q ?? '') && !acc ? 11 : (minor ? MIN : MAJ)[d]
  return (tonic + s + shift(acc) + 120) % 12
}

/** One label as [root pitch class, class] in the key (tonic, minor), or null for what is not supported: Italian, French and Swiss sixths and anything unparsed. German sixths are read as a dominant seventh on the flat sixth; the Neapolitan as a major triad on the flat second; the cadential six-four as the dominant its analyst means (the tonic triad it sounds as is `Ann.alt`). */
export function chordOf(label: string, tonic: number, minor: boolean): [number, Cls, number?] | null {
  const sp = SPECIAL.exec(label)
  if (sp) {
    const k = sub(sp[4], tonic, minor)
    if (!k) return null
    if (sp[1] === 'Ger') return [(k[0] + 8) % 12, '7']
    if (sp[1] === 'N') return [(k[0] + 1) % 12, 'M']
    if (sp[1] === 'Cad') return [(k[0] + 7) % 12, 'M', k[0]]
    return null
  }
  const g = NUM.exec(label)
  const k = g && sub(g[6], tonic, minor)
  if (!g || !k) return null
  const [, acc, rn, q = '', fig = ''] = g
  const root = degree(acc, rn, q, k)
  const seventh = SEVENTH.test(fig)
  const cls: Cls = /^(o|ø|%|\/o)$/.test(q) ? 'dim' : q === '+' ? 'aug' : q === 'M' ? (seventh ? 'maj7' : 'M') : rn === rn.toUpperCase() ? (seventh ? '7' : 'M') : seventh ? 'm7' : 'm'
  return [root, cls]
}

export const keyOf = (tok: string): [number, boolean] | null => {
  const g = /^([A-Ga-g])([#b-]*):$/.exec(tok)
  return g ? [(LET[g[1].toLowerCase()] + shift(g[2]) + 120) % 12, g[1] === g[1].toLowerCase()] : null
}

/** An analysis file into chords by measure and beat. `total` counts the chord labels, `skipped` those that became root -1. */
export function parseRn(src: string): { anns: Ann[]; total: number; skipped: number } {
  const anns: Ann[] = []
  let total = 0
  let skipped = 0
  let bq = 1
  let form = ''
  let key: [number, boolean] = [0, false]
  for (const line of src.split('\n')) {
    const t = line.trim().split(/\s+/)
    const ts = /^Time Signature:\s*(\d+)\/(\d+)/i.exec(line.trim())
    form = /^Form:\s*(\S+)/i.exec(line.trim())?.[1].toLowerCase() ?? form
    if (ts) bq = beatQ({ n: +ts[1], den: +ts[2] } as Bar)
    const cp = /^m(\d+)(?:-(\d+))?\s*=\s*m(\d+)(?:-(\d+))?\s*$/.exec(line.trim()) // "m5-8 = m1-4": the same chords again
    if (cp) {
      const [a, c, d] = [+cp[1], +cp[3], +(cp[4] ?? cp[3])]
      const from = anns.filter((x) => x.m >= c && x.m <= d)
      for (const x of from) anns.push({ ...x, m: x.m - c + a })
      const last = from[from.length - 1]
      if (last) key = [last.key, last.minor]
      continue
    }
    if (!/^m\d+$/.test(t[0])) continue
    const m = +t[0].slice(1)
    let q = 0
    for (const tok of t.slice(1)) {
      const b = /^b(\d+(?:\.\d+)?)$/.exec(tok)
      const k = keyOf(tok)
      if (b) q = (+b[1] - 1) * bq
      else if (k) key = k
      else if (/^[|:]+$/.test(tok)) continue // repeat and double bars
      else {
        total++
        const c = chordOf(tok, ...key)
        if (!c) skipped++
        anns.push({ m, q, root: c ? c[0] : -1, cls: c ? c[1] : 'M', key: key[0], minor: key[1], alt: c?.[2] ?? -1, form })
      }
    }
  }
  return { anns: anns.sort((a, b) => a.m - b.m || a.q - b.q), total, skipped }
}

/** Beats are written to two decimals (b1.67 for a third of a beat), so positions closer than this are the same moment. */
export const EPS = 0.02

/** The chord sounding at measure m, quarter q: the last one written at or before it. Undefined before the first. */
export const annAt = (anns: Ann[], m: number, q: number) => anns.findLast((a) => a.m < m || (a.m === m && a.q <= q + EPS))

/** Triad class of a class, for the root-plus-triad score: sevenths count as their triad. */
export const triad = (c: Cls) => (c === '7' || c === 'maj7' ? 'M' : c === 'm7' ? 'm' : c)
