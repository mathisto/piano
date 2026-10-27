// Humdrum **kern -> MusicXML: a partwise score, one piano part on (at most) two staves. The app reads that with its own
// importer (fromMusicXml), so a kern file plays exactly as the .mxl the library ships from it (build.mjs --set chopin).
// Strict: more than two **kern spines (staves), *+ or *x, a line whose tokens do not match its spines, a section label
// inside a bar or an expansion label with no bars is an error. A note token it cannot read is skipped and counted.
// Kept: pitch and spelling, durations (dots, tuplets as reciprocals, N%M), rests, chords, ties, grace notes, slurs,
// articulations, *k[] keys, *M meters, *MM and !!!OMD tempo, *clef, **dynam letters and hairpins, spine splits and joins
// (each subspine a voice of its staff), pickups and short bars (implicit), repeats: a *>[A,A,B] expansion list is played
// out here, else :| and |: barlines go into the score and the importer plays them. Ignored: beams, stems, layout, ornaments,
// **fing, **text, and *cue (Chopin's small-note cadenzas are played), *rscale and ottava marks (kern writes sounding pitch).
import { fromMusicXml } from './musicxml'
import type { Song } from './song'

type Frac = [number, number]
interface Nt {
  step: string
  oct: number
  alter: number
  q: number // quarters it sounds (0 for a grace)
  u: Frac // undotted value in quarters, for the written type and tuplet
  dots: number
  tie: string // '[' start, ']' end, '_' both
  art: string
  open: number // slurs
  close: number
  rest?: boolean
  hide?: boolean // an invisible rest or spacer ('4ryy', a bare '4'), or a token it could not read: it only keeps time
  slash?: boolean
  bad?: string // why it could not be read
}
interface Ev {
  q: number // from the start of its bar
  staff: number
  voice: number
  notes: Nt[] // shortest first: the first one moves the cursor
  grace: boolean
}
interface Bar {
  t0: number
  len: number
  n: number
  den: number
  fifths: number
  sec: string
  clefs: Record<number, string>
  evs: Ev[]
  dirs: { q: number; xml: string }[]
  on?: boolean // has data: its meter, key and section are fixed
  fwd?: boolean
  bwd?: boolean
}
export interface Kern {
  xml: string
  refs: Record<string, string> // the !!! reference records before the data, repeats joined with '; ' (OTL, OPS, COM, OMD...)
  notes: number
  skipped: Record<string, number> // why -> how many
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const TYPES: Record<number, string> = { 16: 'long', 8: 'breve', 4: 'whole', 2: 'half', 1: 'quarter', 0.5: 'eighth', 0.25: '16th', 0.125: '32nd', 0.0625: '64th', 0.03125: '128th', 0.015625: '256th' }
const DYNS = new Set(['pppp', 'ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff', 'ffff', 'sf', 'sfz', 'sffz', 'fz', 'fp', 'sfp', 'rf', 'rfz'])
const ARTS: [RegExp, string][] = [[/\^\^/, 'strong-accent'], [/(?<!\^)\^(?!\^)/, 'accent'], [/'/, 'staccato'], [/`/, 'staccatissimo'], [/~/, 'tenuto']]
// signifiers it reads or knowingly ignores; any other character is counted (the note is still read)
const KNOWN = /[\d.%a-gA-Gr#\-n[\]_(){}&'`~^qQLJKk/\\Xxyz<>;:TtMmWwSs$OoNijPpv?]/g
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Written type, extra dots and tuplet ratio of an undotted value: 1/3 is a triplet eighth, 3/5 a dotted eighth of a 5:4. */
function written([a, b]: Frac) {
  let o = b
  while (o % 2 === 0) o /= 2
  const tup = o > 1 ? { num: o, den: 2 ** Math.floor(Math.log2(o)) } : undefined
  const w = (a * (tup?.num ?? 1)) / (b * (tup?.den ?? 1))
  const [f, dots] = ([[1, 0], [1.5, 1], [1.75, 2]] as const).find(([f]) => TYPES[w / f]) ?? [0, 0]
  return { type: f ? TYPES[w / f] : undefined, dots, tup }
}

/** One note of a token ('8.cc#L', '[4B-', '16qdd', '4ryy'); one it cannot read keeps its time as a hidden rest. */
function note(x: string): Nt | string {
  const d = /(\d+)(?:%(\d+))?(\.*)/.exec(x)
  const ps = x.match(/[a-gA-G]+/g) ?? []
  const P0 = ps[0] ?? ''
  const grace = /q/i.test(x)
  if (!d && !grace) return 'token without a duration'
  const bad = x.includes('r') || !ps.length ? '' : ps.length > 1 || !/^(.)\1*$/.test(P0) ? 'token without one pitch' : ''
  const rest = !!bad || x.includes('r') || !ps.length // a rest may carry a pitch (where to draw it); a bare duration is a spacer
  // '4' a quarter, '12' a triplet eighth, '20%3' three twentieths of a whole, '0' a breve; dots
  const k = d?.[3].length ?? 0
  let [a, b] = !d ? [1, 2] : Number(d[1]) === 0 ? [8 * d[1].length, 1] : [4 * Number(d[2] ?? 1), Number(d[1])]
  const g = gcd(a, b)
  ;[a, b] = [a / g, b / g]
  const q = grace ? 0 : ((a / b) * (2 ** (k + 1) - 1)) / 2 ** k
  const P = rest ? '' : P0
  const acc = /[a-gA-G]+(#+|-+|n)?/.exec(x)?.[1] ?? ''
  return {
    step: P[0]?.toUpperCase() ?? '',
    oct: P >= 'a' ? 3 + P.length : 4 - P.length, // c is middle C, cc above it, C below
    alter: acc[0] === '#' ? acc.length : acc[0] === '-' ? -acc.length : 0,
    q,
    u: [a, b],
    dots: k,
    tie: /_/.test(x) ? '_' : /\[/.test(x) ? '[' : /\]/.test(x) ? ']' : '',
    art: ARTS.filter(([re]) => re.test(x)).map(([, t]) => `<${t}/>`).join(''),
    open: x.split('(').length - 1,
    close: x.split(')').length - 1,
    ...(rest && { rest: true }),
    ...(rest && (!!bad || /y/.test(x) || !x.includes('r')) && { hide: true }),
    ...(bad && { bad }),
    ...(grace && !/qq/.test(x) && { slash: true }),
  }
}

export function kernToMusicXml(src: string, rights?: string): Kern {
  const refs: Record<string, string> = {}
  const skipped: Record<string, number> = {}
  const skip = (why: string) => void (skipped[why] = (skipped[why] ?? 0) + 1)
  let spines: { kind: string; staff: number; voice: number; end: number }[] | undefined
  let voices = 0
  let notes = 0
  const st = { n: 4, den: 4, fifths: 0, sec: '', clefs: {} as Record<number, string> }
  let expand: string[] | undefined
  let pend = '' // a section label written at the end of a bar: it starts at the barline
  const bars: Bar[] = []
  let t = 0
  const fresh = (): Bar => ({ t0: t, len: 0, n: 4, den: 4, fifths: 0, sec: '', clefs: {}, evs: [], dirs: [] })
  let bar = fresh()
  const start = () => !bar.on && Object.assign(bar, { n: st.n, den: st.den, fifths: st.fifths, sec: st.sec, clefs: { ...st.clefs }, on: true })
  const dir = (xml: string) => {
    const q = t - bar.t0
    if (!bar.dirs.some((d) => d.xml === xml && Math.abs(d.q - q) < 1e-9)) bar.dirs.push({ q, xml }) // each spine states it
  }
  const words = (w: string) => `<direction placement="above"><direction-type><words>${esc(w)}</words></direction-type></direction>`
  const close = () => {
    bar.len = t - bar.t0
    const keep = bar.evs.length > 0 || bar.len > 1e-9
    if (keep) {
      start()
      bars.push(bar)
    }
    const { fwd, dirs } = bar // a bar with nothing in it (before the first barline) hands its repeat and marks on
    if (pend) [st.sec, pend] = [pend, '']
    bar = fresh()
    if (!keep) Object.assign(bar, { fwd, dirs })
  }

  for (const [ln, line] of src.split(/\r?\n/).entries()) {
    const at = `line ${ln + 1}`
    if (line.startsWith('!!')) {
      const m = /^!!!([^:]+):\s*(.*)$/.exec(line)
      if (m && !spines) refs[m[1]] = refs[m[1]] ? `${refs[m[1]]}; ${m[2].trim()}` : m[2].trim() // '[half] = 112; Presto.'
      else if (m?.[1] === 'OMD') dir(words(m[2].trim())) // a tempo change in the body
      else if (m && !(m[1] in refs)) refs[m[1]] = m[2].trim()
      continue
    }
    if (!line.trim()) continue
    const tk = line.split('\t')
    if (!spines) {
      if (!tk[0].startsWith('**')) throw new Error(`${at}: data before the ** header`)
      const kern = tk.filter((x) => x === '**kern').length
      if (kern < 1 || kern > 2) throw new Error(`${kern} **kern spines: a piano score has one or two staves`)
      let s = kern // spines run from the lowest staff up: the last **kern is staff 1
      spines = tk.map((kind) => ({ kind, staff: kind === '**kern' ? s-- : 0, voice: voices++, end: 0 }))
      continue
    }
    if (tk.length !== spines.length) throw new Error(`${at}: ${tk.length} tokens for ${spines.length} spines`)
    if (tk[0][0] === '!') continue
    if (tk[0][0] === '=') {
      if (/:[|!]/.test(tk[0])) bar.bwd = true
      const fwd = /[|!]:/.test(tk[0])
      close()
      bar.fwd ||= fwd
      continue
    }
    if (tk[0][0] === '*') {
      const bad = tk.find((x) => x === '*+' || x === '*x' || x.startsWith('**'))
      if (bad) throw new Error(`${at}: ${bad} is not supported`)
      if (tk.some((x) => x === '*^' || x === '*v' || x === '*-')) {
        const next: typeof spines = []
        for (let i = 0; i < tk.length; i++) {
          const s = spines[i]
          if (tk[i] === '*^') next.push(s, { ...s, voice: voices++ })
          else if (tk[i] === '*v') {
            let end = s.end
            while (tk[i + 1] === '*v') end = Math.max(end, spines[++i].end) // a run of *v joins into its first spine
            next.push({ ...s, end })
          } else if (tk[i] !== '*-') next.push(s)
        }
        spines = next
        continue
      }
      tk.forEach((x, i) => {
        const s = spines![i]
        if (s.kind !== '**kern') return
        let m: RegExpExecArray | null
        if ((m = /^\*staff(\d+)$/.exec(x))) s.staff = Number(m[1])
        else if ((m = /^\*k\[(.*)\]$/.exec(x))) st.fifths = (m[1].match(/#/g)?.length ?? 0) - (m[1].match(/-/g)?.length ?? 0)
        else if ((m = /^\*M(\d+)\/(\d+)$/.exec(x))) [st.n, st.den] = [Number(m[1]), Number(m[2])]
        else if ((m = /^\*MM(\d+(?:\.\d+)?)$/.exec(x))) dir(`<sound tempo="${m[1]}"/>`)
        else if ((m = /^\*clef([GFC])v?(\d)$/.exec(x))) st.clefs[s.staff] = m[1] + m[2]
        else if ((m = /^\*>\[(.*)\]$/.exec(x))) expand ??= m[1].split(',').map((l) => l.trim())
        else if ((m = /^\*>([^[\]]+)$/.exec(x))) {
          if (bar.on) pend = m[1]
          else st.sec = m[1]
        }
      })
      continue
    }
    // data: each spine's new token starts now; the line lasts until the first note on it or still sounding ends. A spine
    // whose note just ended holds the clock only on a line where no note starts (a null or dynamics line: it lasts 0)
    if (pend) throw new Error(`${at}: section ${pend} starts inside a bar`)
    start()
    let L = Infinity
    const fresh = tk.some((x, i) => x !== '.' && spines![i].kind === '**kern')
    tk.forEach((x, i) => {
      const s = spines![i]
      if (x === '.') {
        if (s.kind === '**kern' && (s.end > t + 1e-9 || (!fresh && s.end > t - 1e-9))) L = Math.min(L, Math.max(0, s.end - t))
        return
      }
      if (s.kind === '**dynam') {
        for (const d of x.split(' '))
          if (DYNS.has(d)) dir(`<direction placement="below"><direction-type><dynamics><${d}/></dynamics></direction-type></direction>`)
          else if (d === '<' || d === '>') dir(`<direction><direction-type><wedge type="${d === '<' ? 'crescendo' : 'diminuendo'}"/></direction-type></direction>`)
          else if (/^[[\]]+$/.test(d)) dir('<direction><direction-type><wedge type="stop"/></direction-type></direction>')
        return
      }
      if (s.kind !== '**kern') return
      for (const ch of new Set(x.replace(KNOWN, '').replace(/ /g, ''))) skip(`signifier ${ch}`)
      const all: Nt[] = []
      let dur = ''
      for (let sub of x.split(' ')) {
        if (!/\d|q/i.test(sub) && dur) {
          skip('chord note without a duration: took the one before')
          sub = dur + sub
        }
        dur = /\d+(?:%\d+)?\.*/.exec(sub)?.[0] ?? dur
        const n = note(sub)
        if (typeof n === 'string') skip(n)
        else {
          if (n.bad) skip(n.bad)
          all.push(n)
        }
      }
      const ns = all.filter((n) => !n.bad).length ? all.filter((n) => !n.bad) : all.slice(0, 1)
      if (!ns.length) return
      ns.sort((a, b) => a.q - b.q)
      ;[ns[0].open, ns[0].close] = [Math.max(...ns.map((n) => n.open)), Math.max(...ns.map((n) => n.close))] // one slur a chord
      for (const n of ns.slice(1)) n.open = n.close = 0
      const grace = ns[0].q === 0
      notes += ns.filter((n) => !n.rest).length
      bar.evs.push({ q: t - bar.t0, staff: s.staff, voice: s.voice, notes: ns, grace })
      s.end = t + ns[0].q
      L = Math.min(L, ns[0].q)
    })
    t += L === Infinity ? 0 : L
  }
  close()
  if (!spines) throw new Error('no **kern header')

  // play out the expansion list (a file without labels has only its barline repeats): the bars before any label, then
  // each labelled section in the list's order
  let seq = bars
  if (expand && bars.some((b) => b.sec)) {
    seq = [
      ...bars.filter((b) => !b.sec),
      ...expand.flatMap((l) => {
        const xs = bars.filter((b) => b.sec === l)
        if (!xs.length) throw new Error(`expansion label ${l} has no bars`)
        return xs
      }),
    ].map((b) => ({ ...b, fwd: false, bwd: false }))
  }
  // a short bar before a repeat and the pickup played after it make one full bar
  const nom = (b: Bar) => (b.n * 4) / b.den
  const merged: Bar[] = []
  for (const b of seq) {
    const a = merged[merged.length - 1]
    if (merged.length > 1 && a.len < nom(a) - 1e-9 && b.len < nom(b) - 1e-9 && Math.abs(a.len + b.len - nom(a)) < 1e-9 && a.n === b.n && a.den === b.den && a.fifths === b.fifths && !a.bwd && !b.fwd)
      merged[merged.length - 1] = { ...a, len: nom(a), evs: [...a.evs, ...b.evs.map((e) => ({ ...e, q: e.q + a.len }))], dirs: [...a.dirs, ...b.dirs.map((d) => ({ ...d, q: d.q + a.len }))] }
    else merged.push(b)
  }

  // staves: the kern staff numbers in use, top first, as 1 and 2
  const used = [...new Set(merged.flatMap((b) => b.evs.map((e) => e.staff)))].sort((a, b) => a - b)
  if (used.length > 2) throw new Error(`${used.length} staves`)
  const staffOf = (s: number) => used.indexOf(s) + 1
  // divisions: every value is a whole number of them
  let D = 1
  for (const b of merged) for (const e of b.evs) for (const n of e.notes) if (n.q) D = (D / gcd(D, n.u[1] * 2 ** n.dots)) * n.u[1] * 2 ** n.dots
  const I = (q: number) => Math.round(q * D)
  const tempo = merged.some((b) => b.dirs.some((d) => d.xml.startsWith('<sound')))
  const mm = /\[([a-z -]+)\]\s*=\s*(\d+)/.exec(refs.OMD ?? '') // '[quarter] = 132', '[half-dot] = 69'
  const omd = mm ? Number(mm[2]) * ({ quarter: 1, half: 2, 'half-note': 2, 'half note': 2, 'half-dot': 3, 'dotted-half': 3, 'quarter-dot': 1.5, eighth: 0.5 }[mm[1]] ?? 0) : 0
  if (refs.OMD && merged.length) merged[0] = { ...merged[0], dirs: [{ q: 0, xml: words(refs.OMD) }, ...(!tempo && omd ? [{ q: 0, xml: `<sound tempo="${omd}"/>` }] : []), ...merged[0].dirs] }

  const measures = merged.map((b, i) => {
    const prev = merged[i - 1]
    const x: string[] = []
    if (b.fwd) x.push('<barline location="left"><bar-style>heavy-light</bar-style><repeat direction="forward"/></barline>')
    const att = [
      !prev && `<divisions>${D}</divisions>`,
      (!prev || prev.fifths !== b.fifths) && `<key><fifths>${b.fifths}</fifths></key>`,
      (!prev || prev.n !== b.n || prev.den !== b.den) && `<time><beats>${b.n}</beats><beat-type>${b.den}</beat-type></time>`,
      !prev && used.length > 1 && '<staves>2</staves>',
      ...used.map((s) => b.clefs[s] && (!prev || prev.clefs[s] !== b.clefs[s]) && `<clef number="${staffOf(s)}"><sign>${b.clefs[s][0]}</sign><line>${b.clefs[s][1]}</line></clef>`),
    ].filter(Boolean)
    if (att.length) x.push(`<attributes>${att.join('')}</attributes>`)
    let cur = 0
    const move = (to: number) => {
      if (to > cur) x.push(`<forward><duration>${to - cur}</duration></forward>`)
      if (to < cur) x.push(`<backup><duration>${cur - to}</duration></backup>`)
      cur = to
    }
    const streams = used.flatMap((s) => [...new Set(b.evs.filter((e) => e.staff === s).map((e) => e.voice))].map((v, k) => ({ s, v, no: (staffOf(s) - 1) * 4 + k + 1 })))
    streams.forEach(({ s, v, no }, k) => {
      const items = [...(k === 0 ? b.dirs : []), ...b.evs.filter((e) => e.staff === s && e.voice === v)].map((e, j) => ({ e, j })).sort((a, b) => a.e.q - b.e.q || +('notes' in a.e) - +('notes' in b.e) || a.j - b.j)
      for (const { e } of items) {
        move(I(e.q))
        if (!('notes' in e)) {
          x.push(e.xml)
          continue
        }
        if (e.notes[0].hide) continue // the next move steps over it
        e.notes.forEach((n, c) => {
          const w = written(n.u)
          const ties = n.tie === '[' ? ['start'] : n.tie === ']' ? ['stop'] : n.tie === '_' ? ['stop', 'start'] : []
          const nots = [...ties.map((y) => `<tied type="${y}"/>`), ...Array(n.close).fill('<slur type="stop"/>'), ...Array(n.open).fill('<slur type="start"/>'), n.art && `<articulations>${n.art}</articulations>`].filter(Boolean)
          x.push(
            `<note>${e.grace ? `<grace${n.slash ? ' slash="yes"' : ''}/>` : ''}${c ? '<chord/>' : ''}` +
              (n.rest ? '<rest/>' : `<pitch><step>${n.step}</step>${n.alter ? `<alter>${n.alter}</alter>` : ''}<octave>${n.oct}</octave></pitch>`) +
              (e.grace ? '' : `<duration>${I(Math.min(n.q, b.len - e.q))}</duration>`) + // clipped at the barline, as the lines time it
              ties.map((y) => `<tie type="${y}"/>`).join('') +
              `<voice>${no}</voice>${w.type ? `<type>${w.type}</type>${'<dot/>'.repeat(w.dots + n.dots)}` : ''}` +
              (w.tup && !e.grace ? `<time-modification><actual-notes>${w.tup.num}</actual-notes><normal-notes>${w.tup.den}</normal-notes></time-modification>` : '') +
              `<staff>${staffOf(s)}</staff>${nots.length ? `<notations>${nots.join('')}</notations>` : ''}</note>`,
          )
        })
        if (!e.grace) cur += I(Math.min(e.notes[0].q, b.len - e.q))
      }
    })
    if (!streams.length) for (const d of b.dirs) x.push(d.xml)
    move(Math.max(cur, I(b.len)))
    if (b.bwd) x.push('<barline location="right"><bar-style>light-heavy</bar-style><repeat direction="backward"/></barline>')
    return `<measure number="${i + 1}"${b.len < nom(b) - 1e-9 ? ' implicit="yes"' : ''}>${x.join('')}</measure>`
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
${refs.OTL ? `<work><work-title>${esc(refs.OTL)}</work-title></work>\n` : ''}<identification>${refs.COM ? `<creator type="composer">${esc(refs.COM)}</creator>` : ''}${rights ? `<rights>${esc(rights)}</rights>` : ''}<encoding><software>Piano Forte src/kern.ts</software></encoding></identification>
<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
<part id="P1">
${measures.join('\n')}
</part>
</score-partwise>
`
  return { xml, refs, notes, skipped }
}

/** A **kern file as a Song, through the MusicXML it converts to (so it is the Song of the shipped .mxl). */
export const fromKern = (src: string, title: string, id: string): Song => fromMusicXml(kernToMusicXml(src).xml, title, id)
