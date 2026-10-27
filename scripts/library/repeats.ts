// Unfold \repeat volta in a Mutopia MIDI. LilyPond's MIDI plays a volta repeat once unless the score says \unfoldRepeats,
// so the .ly is read for where each repeat sits (durations only, pitches are never read), the reading is checked against
// the MIDI (its onsets must land where the .ly puts notes), and the repeated stretches are copied forward into a new MIDI
// with tempo, meter, key and pedal state carried to each jump. One level of repeat, with or without \alternative endings,
// and one D.C. or D.S. jump (al Fine, al Coda) played in the order src/playorder.ts gives MusicXML. Nested or overlapping
// repeats, \repeat segno and 2.24's \volta are left alone.
import { Midi } from '@tonejs/midi'
import { fromMidi } from '../../src/midi-tracks'
import { expand, type Unit } from '../../src/playorder'

type Ev =
  | { k: 'on'; at: number; d: number } // d: how long it sounds
  | { k: 'grace'; at: number }
  | { k: 'rep'; at: number; body: number; alts: number[]; n: number }
  | { k: 'bad'; at: number; why: string }
  | { k: 'mark'; at: number; m: string; own: boolean } // a D.C./Fine/segno text; own: written on the note before `at`, not as a \mark
  | { k: 'bar'; at: number; len?: number; d?: number; pos?: number } // \time (len), \partial (d), Timing.measurePosition (pos), whole notes
type Rec = { len: number; ev: Ev[]; unfolded?: boolean; delay?: number } // unfolded: the score applies \unfoldRepeats, so its MIDI plays every repeat
type Tok = { t: string; v: string; d?: string }

const DUR = String.raw`(?:\d+|\\breve|\\longa)\.*(?:\*\d+(?:/\d+)?)*(?::\d*)?`
const TOK = new RegExp(String.raw`\s+|\x01(\d+)\x01|(<<|>>|\\\\|[{}<>=])|\\([a-zA-Z]+)|\\.|[-^_](?:\d+|[.>^+!_|-])?|([a-zA-Z]+(?:[.-][a-zA-Z]+)*)[',]*[!?]?(?:=(?:[',]+|(?=\d)))?(${DUR})?|\d+\.\d+|(\d+(?:/\d+)?\.*(?:\*\d+(?:/\d+)?)*(?::\d*)?)|.`, 'y')

function tokens(src: string): Tok[] {
  const strs: string[] = []
  src = src.replace(/"(?:\\.|[^"\\])*"|%\{[\s\S]*?%\}|%[^\n]*/g, (m) => (m[0] === '"' ? `\x01${strs.push(m.slice(1, -1)) - 1}\x01` : ' '))
  const out: Tok[] = []
  for (let i = 0; i < src.length; ) {
    if (src[i] === '#' || src[i] === '$') {
      // a Scheme value: #t, #'sym, #-2, #(...), #{ ... #}
      while (/[#$'`,]|\s/.test(src[i] ?? '')) i++
      const from = i
      if (src[i] === '(') for (let depth = 0; i < src.length; i++) {
        if (src[i] === '(') depth++
        else if (src[i] === ')' && !--depth) { i++; break }
      }
      else if (src[i] === '{') i = src.indexOf('#}', i) + 2 || src.length
      else while (i < src.length && !/[\s{}()<>]/.test(src[i])) i++
      out.push({ t: 'scm', v: src.slice(from, i).replace(/\x01(\d+)\x01/g, (_, n) => strs[+n]) })
      continue
    }
    TOK.lastIndex = i
    const m = TOK.exec(src)!
    const start = i
    i = TOK.lastIndex
    if (m[4] && /[.-]/.test(m[4]) && m[0].includes('=')) {
      // force-hshift=0.5: a property, not a pitch with an octave check: the = is its own token
      out.push({ t: 'note', v: m[4] })
      i = start + m[0].indexOf('=')
      continue
    }
    if (m[1]) out.push({ t: 'str', v: strs[+m[1]] })
    else if (m[2]) out.push({ t: m[2], v: m[2] })
    else if (m[3]) out.push({ t: 'cmd', v: m[3] })
    else if (m[4]) out.push({ t: 'note', v: m[4], d: m[5] })
    else if (m[6]) out.push({ t: 'num', v: m[6] })
    else if (/\S/.test(m[0])) out.push({ t: 'x', v: m[0] })
  }
  return out
}

/** '4.' is 0.375 of a whole note, '1*3/4' 0.75, '\breve' 2; a tremolo ':16' does not change the length. */
function dur(s: string): number {
  const m = /^(\d+|\\breve|\\longa)(\.*)((?:\*\d+(?:\/\d+)?)*)/.exec(s)!
  let d = (m[1] === '\\breve' ? 2 : m[1] === '\\longa' ? 4 : 1 / Number(m[1])) * (2 - 0.5 ** m[2].length)
  for (const [, a, b] of m[3].matchAll(/\*(\d+)(?:\/(\d+))?/g)) d *= Number(a) / Number(b ?? 1)
  return d
}

// what a text on the music says about the order of play; a text that names one of these words but is none of them is '?'
const MARKS: [string, RegExp][] = [
  ['ds', /\bD\.\s?S\.|\bdal\s+segno\b/i],
  ['dcn', /\w{3}[.\s]*(?:D\.\s?C\.|da\s+capo)/i], // "Menuet da Capo", "Men.D.C.": the D.C. of a named movement, which may be another file
  ['dc', /\bD\.\s?C\.|\bda\s+capo\b/i],
  ['tocoda', /^\s*to\s+coda\.?\s*$/i],
  ['coda', /^\s*coda\.?\s*$/i],
  ['fine', /^\s*fine\.?\s*$/i],
  ['segno', /^\s*segno\.?\s*$|scripts\.segno/i],
  ['sign', /scripts\.coda/],
  ['trio', /^\s*trio\.?\s*$/i],
]
const MENTION = /\b(segno|coda|fine|capo)\b|\bD\.\s?[CS]\./i
const markOf = (text: string) => MARKS.find(([, re]) => re.test(text))?.[0] ?? (MENTION.test(text) ? `?${text}` : undefined)

const BLOCK = new Set(['with', 'header', 'paper', 'layout', 'midi', 'lyricmode', 'lyrics', 'addlyrics', 'figuremode', 'figures', 'chordmode', 'chords', 'drummode', 'markuplist'])
const GRACE = new Set(['grace', 'acciaccatura', 'appoggiatura', 'slashedGrace'])

/** The music of each score with a \midi block (LilyPond writes one MIDI file each), in whole notes from its start: note
 * onsets, grace notes and volta repeats. `unfoldAll`: every volta repeat is read as an unfold, in its own voice (what a score that says
 * \unfoldRepeats plays: a repeat that only one voice writes extends only that voice). */
function readLy(src: string, unfoldAll = false): Rec[] {
  const T = tokens(src)
  let p = 0
  let last = 0.25 // LilyPond's default duration is parser state, so it carries lexically, as here
  let ev: Ev[] = []
  // a variable keeps the tokens it was read from: music with a \tag in it is read again under the \keepWithTag or \removeWithTag that uses it
  const vars = new Map<string, Rec & { from: number; last: number; tagged: boolean }>()
  const filters: { keep: boolean; tags: string[] }[] = []
  const shown = (tags: string[]) => filters.every((f) => (f.keep ? tags.some((t) => f.tags.includes(t)) : !tags.some((t) => f.tags.includes(t))))
  const texts = new Map<string, string>() // name = "string", used as ^\name
  const scores: (Rec & { midi: boolean })[] = []
  const is = (t: string, v?: string) => T[p]?.t === t && (v === undefined || T[p].v === v)
  const sub = (f: () => number): Rec => {
    const keep = ev
    ev = []
    const len = f()
    const r = { len, ev }
    ev = keep
    return r
  }
  const put = (r: Rec, at: number, k = 1) => r.ev.forEach((e) => ev.push({ ...e, at: at + e.at * k, ...(e.k === 'on' && { d: e.d * k }) }))
  /** The words of the tokens a..b: strings, Scheme strings (\musicglyph #"scripts.segno") and \segno, \coda. */
  const words = (a: number, b: number) => T.slice(a, b).map((t) => (t.t === 'cmd' ? (['segno', 'coda'].includes(t.v) ? `scripts.${t.v}` : '') : t.t === 'str' || t.t === 'scm' ? t.v : '')).join(' ')
  const mark = (at: number, own: boolean, text: string) => {
    const m = markOf(text)
    if (m) ev.push({ k: 'mark', at, m, own })
  }
  const attached = (i: number) => T[i]?.t === 'x' && /^[-^_]$/.test(T[i].v)
  const block = () => {
    if (!is('{')) return
    for (let depth = 0; p < T.length; ) {
      if (is('{')) depth++
      if (is('}')) depth--
      p++
      if (!depth) return
    }
  }
  const markup = () => {
    while (is('cmd') || is('scm')) p++
    if (is('{')) block()
    else if (!is('}') && !is('>>')) p++ // \markup \fermata ends with the command: the brace after it closes the music
  }
  const value = () => (is('cmd', 'markup') ? (p++, markup()) : p++)
  const frac = () => {
    const [a, b] = (T[p++]?.v ?? '1/1').split('/').map(Number)
    return a / (b || 1)
  }
  const score = () => {
    let r: Rec = { len: 0, ev: [] }
    let [midi, layout] = [false, false]
    if (!is('{')) return { ...r, midi }
    const from = p++
    while (p < T.length && !is('}')) {
      if (is('cmd', 'midi')) midi = true
      if (is('cmd', 'layout')) layout = true
      if (is('cmd') && BLOCK.has(T[p].v)) (p++, block())
      else {
        const m = sub(() => music(0))
        if (m.len || m.ev.length) r = m
      }
    }
    p++
    midi ||= !layout // a score with neither \layout nor \midi is engraved and played
    const unfolded = T.slice(from, p).some((t) => (t.t === 'cmd' && t.v === 'unfoldRepeats') || (t.t === 'scm' && /unfold-repeats/.test(t.v)))
    return { ...r, midi, ...(unfolded && { unfolded }) }
  }

  function music(at: number): number {
    const k = T[p++]
    if (!k) return 0
    if (k.t === '{') {
      let len = 0
      while (p < T.length && !is('}')) len += music(at + len)
      p++
      return len
    }
    if (k.t === '<<') {
      let len = 0
      while (p < T.length && !is('>>')) len = Math.max(len, music(at))
      p++
      return len
    }
    if (k.t === '<') {
      if (is('>')) return p++, 0 // <> carries marks (a dynamic, a text) and has no length
      while (p < T.length && !is('>')) p++
      p++
      if (is('num')) last = dur(T[p++].v)
      ev.push({ k: 'on', at, d: last })
      return last
    }
    if (k.t === 'note') {
      let d = k.d // (the tokens are read again for a \keepWithTag: never change one)
      if (!d && is('num') && !T[p].v.includes('/')) d = T[p++].v // 'e 8' is e8
      while (d && is('x', '*') && T[p + 1]?.t === 'num') (d += `*${T[p + 1].v}`), (p += 2) // 's2. * 2' is s2.*2
      if (d) last = dur(d)
      if (!/^[rRs]$/.test(k.v)) ev.push({ k: 'on', at, d: last })
      return last
    }
    if (k.t === 'num') {
      last = dur(k.v)
      ev.push({ k: 'on', at, d: last })
      return last
    }
    if (k.t === 'str') return attached(p - 2) && mark(at, true, k.v), 0
    if (k.t !== 'cmd') return 0
    const c = k.v
    const v = vars.get(c)
    if (v) {
      const keep = [p, last]
      if (v.tagged && filters.length) (p = v.from), (last = v.last)
      const r = v.tagged && filters.length ? sub(() => music(0)) : v
      if (r !== v) [p, last] = keep
      return put(r, at), r.len
    }
    if (texts.has(c)) return mark(at, attached(p - 2), texts.get(c)!), 0
    if (BLOCK.has(c)) return block(), 0
    switch (c) {
      case 'relative':
      case 'fixed':
        if (is('note') && !T[p].d) p++
        return music(at)
      case 'transpose':
        p += 2
        return music(at)
      case 'new':
      case 'context':
        p++
        if (is('=')) p += 2
        if (is('cmd', 'with')) (p++, block())
        return music(at)
      case 'lyricsto':
        p++
        return block(), 0
      case 'markup': {
        const a = p
        return markup(), mark(at, attached(a - 2), words(a, p)), 0
      }
      case 'mark': {
        const a = p
        return value(), mark(at, false, words(a, p)), 0
      }
      case 'tag':
      case 'keepWithTag':
      case 'removeWithTag': {
        const t = T[p++]
        const tags = t?.t === 'scm' ? (t.v.match(/[\w-]+/g) ?? []) : t ? [t.v] : [] // #'a, #'(a b) or a bare word
        if (c === 'tag') return shown(tags) ? music(at) : (sub(() => music(0)), 0) // a tag that is filtered out is read for its durations and plays nothing
        filters.push({ keep: c === 'keepWithTag', tags })
        const len = music(at)
        filters.pop()
        return len
      }
      case 'tweak':
        p++
        return value(), 0
      case 'set':
      case 'override':
      case 'property': {
        const name = T[p]?.v
        while (p < T.length && !is('=')) p++
        p++
        const a = p
        value()
        const m = /make-moment\s+(\d+)(?:\s+(\d+)|\/(\d+))?/.exec(words(a, p))
        if (c === 'set' && /^(Timing|Score)\.measurePosition$/.test(name) && m) ev.push({ k: 'bar', at, pos: Number(m[1]) / Number(m[2] ?? m[3] ?? 1) })
        return 0
      }
      case 'unset':
      case 'revert':
        p++
        if (is('scm')) p++
        return 0
      case 'change':
      case 'shape':
        p += c === 'shape' ? 2 : 3
        return 0
      case 'key':
      case 'keys': // Royer's Premier livre writes \keys re \major
        p++
        if (is('cmd')) p++
        return 0
      case 'clef':
      case 'accidentalStyle':
      case 'barNumberCheck':
      case 'tupletSpan':
      case 'ottava':
      case 'omit':
      case 'hide':
      case 'bar':
      case 'octaveCheck':
      case 'transposition':
      case 'version':
      case 'include':
      case 'language':
        p++
        return 0
      case 'tempo':
        if (is('str')) p++
        else if (is('cmd', 'markup')) (p++, markup())
        if (is('num') && T[p + 1]?.t === '=') p += 3
        if (is('x', '-')) p += 2
        return 0
      case 'time':
        if (is('num') && T[p].v.includes('/')) ev.push({ k: 'bar', at, len: frac() })
        else p++
        return 0
      case 'partial':
        if (is('num')) ev.push({ k: 'bar', at, d: dur(T[p++].v) })
        return 0
      case 'skip':
        return (last = dur(T[p++].v))
      case 'times':
      case 'scaleDurations':
      case 'tuplet': {
        const f = c === 'tuplet' ? 1 / frac() : frac()
        if (c === 'tuplet' && is('num')) p++
        const r = sub(() => music(0))
        put(r, at, f)
        return r.len * f
      }
      case 'afterGrace': {
        if (is('num') && T[p].v.includes('/')) p++
        const len = music(at)
        while (is('x') || (is('cmd') && !vars.has(T[p].v))) p++ // articulations on the main note: ^\trill
        sub(() => music(0))
        return ev.push({ k: 'grace', at: at + len }), len // the graces sound just before the next beat
      }
      case 'partcombine':
      case 'partCombine':
        return Math.max(music(at), music(at))
      case 'score': {
        const r = score()
        put(r, at)
        return r.len
      }
      case 'alternative':
      case 'volta':
        ev.push({ k: 'bad', at, why: `\\${c} outside a \\repeat` })
        return 0
      case 'repeat': {
        const type = T[p]?.v
        const n = T[p++]?.d ? Number(T[p - 1].d) : is('num') ? Number(T[p++].v) : NaN // 'volta2' is volta 2
        const body = sub(() => music(0))
        const alts: Rec[] = []
        if (is('cmd', 'alternative') && T[p + 1]?.t === '{') {
          p += 2
          while (p < T.length && !is('}')) {
            const a = sub(() => music(0))
            if (a.len) alts.push(a)
          }
          p++
        }
        const sum = alts.reduce((s, a) => s + a.len, 0)
        if (!(n >= 1)) ev.push({ k: 'bad', at, why: 'a \\repeat without a count' })
        if (type === 'volta' && !unfoldAll) {
          if ([body, ...alts].some((x) => x.ev.some((e) => e.k === 'rep'))) ev.push({ k: 'bad', at, why: 'nested repeats' })
          put(body, at)
          alts.reduce((x, a) => (put(a, x), x + a.len), at + body.len)
          ev.push({ k: 'rep', at, body: body.len, alts: alts.map((a) => a.len), n })
          return body.len + sum
        }
        if (type !== 'volta' && type !== 'unfold' && type !== 'percent' && type !== 'tremolo') ev.push({ k: 'bad', at, why: `\\repeat ${type}` })
        // each pass is the body and its ending: the first ending serves the first passes, the last the last (n - k + 1 of them on the first)
        let x = at
        for (let i = 0; i < n; i++) {
          put(body, x)
          x += body.len
          const a = alts[Math.min(alts.length - 1, Math.max(0, i - (n - alts.length)))]
          if (a) (put(a, x), (x += a.len))
        }
        return x - at
      }
    }
    if (GRACE.has(c)) return ev.push({ k: 'grace', at }), sub(() => music(0)), 0
    return 0
  }

  /** name = music: read here, and kept with its place in the tokens for a read under a \\keepWithTag. */
  const define = (name: string) => {
    const [from, l0] = [p, last]
    const r = sub(() => music(0))
    vars.set(name, { ...r, from, last: l0, tagged: T.slice(from, p).some((t) => t.t === 'cmd' && (t.v === 'tag' || vars.get(t.v)?.tagged)) })
  }
  while (p < T.length) {
    const k = T[p]
    if ((k.t === 'note' || k.t === 'str') && T[p + 1]?.t === '=') {
      p += 2
      if (is('cmd', 'markup')) (p++, markup())
      else if (is('str')) texts.set(k.v, T[p++].v)
      else if (is('scm') || is('num')) p++
      else define(k.v)
      continue
    }
    p++
    if (k.t !== 'cmd') continue
    if (k.v === 'parallelMusic' && is('scm') && T[p + 1]?.t === '{') {
      // \parallelMusic #'(a b) { bar-a | bar-b | bar-a | bar-b }: the bars, cut at the barchecks, go to the variables in turn
      const names = T[p++].v.match(/\w+/g) ?? []
      const [from] = [p]
      block()
      const bars: Tok[][] = [[]]
      let depth = 0
      for (const t of T.slice(from + 1, p - 1)) {
        depth += +(t.t === '{' || t.t === '<<') - +(t.t === '}' || t.t === '>>')
        bars[bars.length - 1].push(t)
        if (!depth && t.t === 'x' && t.v === '|') bars.push([])
      }
      const keep = p
      names.forEach((name, i) => {
        const from = T.length
        T.push({ t: '{', v: '{' }, ...bars.filter((_, j) => j % names.length === i).flat(), { t: '}', v: '}' })
        p = from
        define(name)
      })
      p = keep
    } else if (k.v === 'score') scores.push(score())
    else if (BLOCK.has(k.v)) block()
    else if (['version', 'include', 'language'].includes(k.v)) p++
  }
  // a file whose scores all say \layout and none \midi (the midi line commented out, or added by Mutopia's build) has its MIDI from them
  return scores.some((s) => s.midi) ? scores.filter((s) => s.midi) : scores.filter((s) => s.len)
}

/** midi.toArray(), but @tonejs/midi 2.0.28 writes a key signature as its table index + 7 where the file wants the fifths
 * (index - 7): put them right. The check after writing in unfold() would catch a stray match. */
export function encode(midi: Midi): Uint8Array {
  const b = midi.toArray()
  for (let i = 0; i + 4 < b.length; i++) if (b[i] === 0xff && b[i + 1] === 0x59 && b[i + 2] === 2) b[i + 3] = (b[i + 3] - 14) & 0xff
  return b
}

const ab = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer
type Seg = [number, number, number] // source ticks [from, to), output tick
type Bars = { t: number; len: number }[] // start tick and length of each bar
type Rep = Extract<Ev, { k: 'rep' }>
const repEnd = (x: Rep) => x.at + x.body + x.alts.reduce((s, a) => s + a, 0)

type BarEv = Extract<Ev, { k: 'bar' }>
const barEvents = (r: Rec): BarEv[] => r.ev.flatMap((e) => (e.k === 'bar' ? [e] : [])).sort((a, b) => a.at - b.at || Number(!a.len) - Number(!b.len))
/** The bar a position (whole notes) is in, as where it began and how long it is: \time sets the length, \partial or Timing.measurePosition where the bar began. */
function barAt(bars: BarEv[], t: number) {
  let [a, L, set] = [0, 1, false]
  for (const b of bars) {
    if (b.at > t + 1e-9) break
    if (b.len) (a = set && b.len === L ? a : b.at), (L = b.len), (set = true)
    else a = b.at - (b.pos ?? L - b.d!)
  }
  return { a, L }
}

/**
 * The order a reading is played in, as segments of its own ticks: the repeats with their endings, then the one D.C. or D.S.
 * jump (src/playorder.ts, the order MusicXML gets). The reading is cut into units at every repeat sign, ending and mark;
 * a mark sits on the bar the \time and \partial it follows give it. `until`: where the last unit ends. `repsOnly`: leave
 * the marks out (a score that applies \unfoldRepeats has its repeats played, not its jumps).
 */
function plan(r: Rec, W: number, until: number, repsOnly = false): { segs: Seg[]; bars: Bars; delay: number } | { why: string } {
  const tick = (x: number) => Math.round(x * W)
  const bad = r.ev.find((e) => e.k === 'bad')
  if (bad) return { why: bad.why }
  // one repeat read in several voices: the longest reading wins (a voice may stop early, or hold only skips)
  const byAt = new Map<string, Rep>()
  for (const e of r.ev) if (e.k === 'rep' && (byAt.get(e.at.toFixed(6))?.body ?? -1) < e.body) byAt.set(e.at.toFixed(6), e)
  const reps = [...byAt.values()].sort((a, b) => a.at - b.at)
  // ... unless it runs past the last note: its extra length is then rests (or a misread) that the second pass would wait out
  const long = r.ev.find((e) => e.k === 'rep' && byAt.get(e.at.toFixed(6))!.body > e.body + 1e-6 && repEnd(byAt.get(e.at.toFixed(6))!) * W > until + 1)
  if (long) return { why: 'voices disagree on the length of the last repeat' }
  if (reps.some((x, i) => i && repEnd(reps[i - 1]) > x.at + 1e-9)) return { why: 'voices disagree on the repeats' }
  if (reps.some((x) => x.alts.length > x.n)) return { why: 'more endings than passes' }

  // the bar a position is in: \time sets the length, \partial or Timing.measurePosition where the bar began
  const bars = barEvents(r)
  const bar = (t: number) => barAt(bars, t)
  const floor = (t: number) => (({ a, L }) => a + L * Math.floor((t - a) / L + 1e-6))(bar(t))
  const ceil = (t: number) => (({ a, L }) => a + L * Math.ceil((t - a) / L - 1e-6))(bar(t))
  // a mark is on the bar it ends (D.C., Fine, To Coda) or starts (segno, Coda, Trio)
  const all = r.ev.flatMap((e) => (e.k === 'mark' ? [e] : []))
  const marks = repsOnly || !all.some((m) => /^d[cs]/.test(m.m)) ? [] : all // a Coda, Fine or Trio with no jump to it is a label
  const unknown = marks.find((m) => m.m[0] === '?')
  if (unknown) return { why: `a mark I cannot place: "${unknown.m.slice(1)}"` }
  const starts = new Set(['segno', 'coda', 'sign', 'trio'])
  // ... but never past the end of the repeat or ending it is in
  const stops = reps.flatMap((x) => [x.at + x.body, ...x.alts.map((_, i) => x.at + x.body + x.alts.slice(0, i + 1).reduce((s, a) => s + a, 0))])
  // and a mark in a first ending is the repeat's last ending's: nobody jumps away before the repeat is played
  const early = (t: number) => reps.find((x) => x.alts.length > 1 && t > x.at + x.body + 1e-6 && t < repEnd(x) - x.alts[x.alts.length - 1] + 1e-6)
  // a sign starts its bar, or the repeat or ending that starts inside that bar (a Trio that begins on a pickup)
  const opens = reps.flatMap((x) => [x.at, ...x.alts.map((_, i) => x.at + x.body + x.alts.slice(0, i).reduce((s, a) => s + a, 0))])
  const sign = (m: { at: number; own: boolean }) => ((f) => Math.max(f, ...opens.filter((b) => b > f - 1e-6 && b < m.at - 1e-6)))(floor(m.at + (m.own ? -1e-6 : 1e-6)))
  // (or to its end when only rests are left in it: the D.C. is written on the last note, the repeat is played first)
  const sounds = (a: number, b: number) => r.ev.some((e) => e.k === 'on' && e.at > a - 1e-9 && e.at < b - 1e-9)
  const ends = (t: number) => {
    const [c, stop] = [ceil(t), Math.min(...stops.filter((b) => b >= t - 1e-6))]
    return stop > c && !sounds(c, stop) ? stop : Math.min(c, stop)
  }
  // a D.C. or D.S. written on the next to last bar jumps after the last one (a bar is all that is left to play of the piece)
  const jumpEnd = (m: { m: string; at: number }) => {
    const [c, stop] = [ceil(m.at), Math.min(...stops.filter((b) => b >= m.at - 1e-6), r.len)]
    return /^d/.test(m.m) && stop > c && stop - c <= bar(c).L + 1e-6 ? stop : ends(m.at)
  }
  const at = marks.map((m) => tick(starts.has(m.m) ? sign(m) : early(m.at) ? repEnd(early(m.at)!) : jumpEnd(m)))

  const End = tick(r.len)
  const cuts = new Set([0])
  const cut = (x: number) => cuts.add(Math.min(Math.max(0, tick(x)), End))
  for (const x of reps) [x.at, x.at + x.body, ...x.alts.map((_, i) => x.at + x.body + x.alts.slice(0, i + 1).reduce((s, a) => s + a, 0))].forEach(cut)
  at.forEach((t) => cuts.add(Math.min(t, End)))
  const xs = [...cuts].sort((a, b) => a - b)
  if (xs[xs.length - 1] === End && xs.length > 1) xs.pop() // a cut at the very end starts nothing
  const units: Unit[] = xs.map(() => ({ marks: new Set<string>() }))
  const from = (t: number) => xs.indexOf(Math.min(t, xs[xs.length - 1])) // the unit that starts at t
  const to = (t: number) => (t >= End ? xs.length - 1 : xs.indexOf(t) - 1) // the unit that ends at t
  for (const x of reps) {
    units[from(tick(x.at))].forward = true
    const k = x.alts.length
    if (!k) Object.assign(units[to(tick(x.at + x.body))], { backward: true, times: x.n })
    let a = x.at + x.body
    x.alts.forEach((len, i) => {
      const ending = i ? [x.n - k + 1 + i] : Array.from({ length: x.n - k + 1 }, (_, j) => j + 1)
      for (let j = from(tick(a)); j <= to(tick(a + len)); j++) units[j].ending = ending
      if (i < k - 1) Object.assign(units[to(tick(a + len))], { backward: true, times: x.n })
      a += len
    })
  }
  marks.forEach((m, i) => units[starts.has(m.m) ? from(at[i]) : to(at[i])].marks.add(m.m))
  const has = (k: string) => units.some((u) => u.marks.has(k))
  // a named D.C. with nothing in this score to stop at (no Fine, To Coda or Trio) is played in another file: not a jump here
  const named = (k: string) => units.forEach((u) => u.marks.has('dcn') && (u.marks.delete('dcn'), k && u.marks.add(k)))
  named(has('fine') || has('tocoda') || has('trio') ? 'dc' : '')
  const trio = units.findIndex((u) => u.marks.has('trio'))
  if (has('dc') && !has('fine') && !has('tocoda') && trio > 0) units[trio - 1].marks.add('fine') // Menuetto D.C.: back to the Trio
  const { order, any, ok } = expand(units, false)
  if (any && !ok) return { why: 'a D.C., D.S. or coda jump I cannot place (no segno, no Coda, or two jumps)' }
  if ((has('dc') || has('ds')) && !has('fine') && !has('tocoda')) return { why: 'D.C. or D.S. with no Fine or To Coda to stop at' }
  const segs: Seg[] = []
  let out = 0
  for (const i of order) {
    // a stretch from the top starts after the delay: the grace note that made it is heard once
    const [s, e] = [i || !segs.length ? xs[i] : tick(r.delay ?? 0), i + 1 < xs.length ? xs[i + 1] : Math.max(End, until)]
    if (segs.length && segs[segs.length - 1][1] === s) segs[segs.length - 1][1] = e
    else segs.push([s, e, out])
    out += e - s
  }
  // the barlines of the score itself, from tick 0 (a pickup is a short first bar)
  const lines = [0]
  for (let x = 0; lines.length < 5000 && tick(x) < End; ) {
    const { a, L } = bar(x + 1e-9)
    lines.push(tick((x = a + L * (Math.floor((x - a) / L + 1e-6) + 1))))
  }
  return { segs, delay: tick(r.delay ?? 0), bars: lines.slice(0, -1).map((t, i) => ({ t, len: lines[i + 1] - t })) }
}

/** A reading of a score that applies \unfoldRepeats, played out the way its MIDI is (repeats only, no jumps). */
function replay(r: Rec, W: number, until: number): Rec {
  const p = plan(r, W, until, true)
  if ('why' in p) return r
  const tick = (x: number) => Math.round(x * W)
  const ev = p.segs.flatMap(([s, e, o]) => r.ev.flatMap((x) => (x.k !== 'rep' && tick(x.at) >= s && tick(x.at) < e ? [{ ...x, at: (o + tick(x.at) - s) / W }] : [])))
  const [s, e, o] = p.segs[p.segs.length - 1]
  return { len: (o + Math.min(e, tick(r.len)) - s) / W, ev, unfolded: true }
}

const readings = new Map<string, Rec[]>() // a work's book is read once for all its movements (a candidate .ly is megabytes with its includes)
const readLyOnce = (ly: string) => {
  // a file that says \unfoldRepeats is read both ways: its volta kept (the old reading of a score played out by replay) and unfolded in place
  if (!readings.has(ly)) (readings.size > 3 && readings.clear(), readings.set(ly, [...readLy(ly), ...(/\\unfoldRepeats|unfold-repeats/.test(ly) ? readLy(ly, true) : [])]))
  return readings.get(ly)!
}
/** The \midi score of the .ly that plays this MIDI, and how many of the MIDI's onsets its reading misses: a reading matches
 * when every onset is where the .ly puts a note, or just before one with grace notes (LilyPond writes one file a score). */
function score(midi: Midi, ly: string) {
  const W = 4 * midi.header.ppq
  const tick = (x: number) => Math.round(x * W)
  const notes = midi.tracks.flatMap((t) => t.notes)
  const until = Math.max(0, ...notes.map((n) => n.ticks + n.durationTicks))
  // ponytail: one tick. LilyPond's MIDI runs up to a 64th off in the voice after a grace note; a tolerance of W / 64 where the reading has graces
  // would take 11 more pieces (docs/changes/lyreader.md). Left strict until someone decides the safeguard may move.
  const lost = (r: Rec) => {
    const on = new Set(r.ev.flatMap((e) => (e.k === 'on' ? [tick(e.at)] : [])))
    const grace = r.ev.flatMap((e) => (e.k === 'grace' ? [tick(e.at)] : []))
    return notes.filter((n) => ![-1, 0, 1].some((d) => on.has(n.ticks + d)) && !grace.some((g) => n.ticks < g && n.ticks >= g - W / 8))
  }
  const misses = (r: Rec) => lost(r).length
  // LilyPond starts the music late by the length of a grace note it opens with: the reading is tried delayed as well
  const heads = [...new Set(notes.map((n) => n.ticks))].sort((a, b) => a - b).slice(0, 3)
  const delay = (x: Rec): Rec[] => {
    const on = tick(Math.min(...x.ev.flatMap((e) => (e.k === 'on' ? [e.at] : []))))
    return [x, ...heads.filter((t) => t > on && t - on <= W / 8).map((t) => ({ ...x, delay: (t - on) / W, len: x.len + (t - on) / W, ev: x.ev.map((e) => ({ ...e, at: e.at + (t - on) / W })) }))]
  }
  // a score that fits the onsets, the nearest in length (a long score covers a short one's onsets: a sibling movement in a book), else the one that misses least
  const lim = 0.02 * notes.length
  const gap = (x: Rec) => Math.abs(tick(Math.max(0, ...x.ev.flatMap((e) => (e.k === 'on' ? [e.at + e.d] : [])))) - until) // by the last sound: rests and spacers after it are no part of the music
  const [r, miss = Infinity] = readLyOnce(ly).map((x) => (x.unfolded ? replay(x, W, until) : x)).flatMap(delay).map((x) => [x, misses(x)] as const).sort((x, y) => Number(x[1] > lim) - Number(y[1] > lim) || (x[1] > lim ? x[1] - y[1] : gap(x[0]) - gap(y[0]) || x[1] - y[1]))[0] ?? []
  const off = r ? gap(r) : Infinity // length mismatch, ticks
  return { r, miss, off, until, notes: notes.length, ok: miss <= 0.02 * notes.length, lost: r ? [...new Set(lost(r).map((n) => n.ticks / W))].sort((a, b) => a - b) : [] }
}

/** The best reading of this .ly against the MIDI, for scripts/library/ly-coverage.mjs: the numbers `score` has, the first MIDI onsets (in whole notes) the reading has no note at, and the reading's length. */
export function reading(bytes: Uint8Array, ly: string) {
  const x = score(new Midi(ab(bytes)), ly)
  return { ok: x.ok, miss: x.miss, notes: x.notes, off: x.off, until: x.until, len: x.r && x.r.len, missed: x.lost.slice(0, 12) }
}

/** Whether this .ly's reading matches the MIDI's onsets, i.e. it is the score that plays this file (pickLy falls back to the first .ly when none is). */
export const plays = (bytes: Uint8Array, ly: string) => score(new Midi(ab(bytes)), ly).ok

/**
 * The anacrusis the .ly states for this MIDI, in quarters (the app's unit, whatever the meter): `\partial N`, or a
 * `Timing.measurePosition` set before the first note. 0 when the .ly states none, its time signatures are the MIDI's and the bars
 * its music fills are as many as the MIDI's. undefined when this .ly does not play the file (the 2% onset test of `score`, unless
 * `matched`), or it is anything else: a meter the MIDI does not have, a bar count that disagrees. Only the first bar is read; a
 * later \partial (after a repeat) does not move the barlines of the first.
 */
export const lyPickup = (bytes: Uint8Array, ly: string, matched = false) => pickupWhy(bytes, ly, matched).pickup

/** lyPickup, and when it is undefined the cause (the coverage table of scripts/library/ly-coverage.mjs groups by it). */
export function pickupWhy(bytes: Uint8Array, ly: string, matched = false): { pickup?: number; why?: string } {
  const midi = new Midi(ab(bytes))
  const { r, ok, until, off, miss, notes } = score(midi, ly)
  if (!r) return { why: 'no score with \\midi' }
  if (!(ok || matched)) return { why: `reading misses ${miss} of ${notes} onsets` } // matched: withRepeats read this .ly against the file before unfolding it (its alternatives read differently once unfolded)
  const start = Math.min(...r.ev.flatMap((e) => (e.k === 'on' ? [e.at] : [])))
  const bars = r.ev.flatMap((e) => (e.k === 'bar' ? [e] : [])).sort((a, b) => a.at - b.at || Number(!a.len) - Number(!b.len))
  const first = bars.filter((b) => b.at <= start + 1e-9)
  const L = first.reduce((l, b) => b.len ?? l, 1) // wholes; LilyPond's default is 4/4
  const sig = midi.header.timeSignatures[0]?.timeSignature ?? [4, 4]
  if (Math.abs(L - sig[0] / sig[1]) > 1e-6) return { why: 'first \\time is not the MIDI\'s' }
  if (!matched && off > L * 4 * midi.header.ppq + 1) return { why: 'length differs by more than a bar' } // a sibling movement's .ly can cover a sparse movement's onsets (pickLy's fallback); its length gives it away
  const part = first.find((b) => b.d !== undefined || b.pos !== undefined)
  if (part) {
    const d = part.d ?? L - (part.pos! % L) // measurePosition is how far into the bar the music starts
    return { pickup: d < L - 1e-6 ? Math.round(d * 4 * 1e6) / 1e6 : 0 }
  }
  // no \partial in the first bar: a full one, if the MIDI's time signatures are the .ly's (same bars at the same places) and the
  // bars the .ly's music fills (its last note's end, not the rests after it) are as many as the MIDI's
  const W = 4 * midi.header.ppq
  const shift = r.delay ?? 0
  const lay = bars.map((b) => ({ ...b, at: b.at - shift }))
  const metres = (xs: number[][]) => xs.filter((x, i) => !i || Math.abs(x[1] - xs[i - 1][1]) > 1e-6) // [where, bar length]: a change of length only
  const sigs = metres(bars.reduce((xs, b) => (b.len ? (b.at - shift < 1e-9 ? [[0, b.len]] : [...xs, [b.at - shift, b.len]]) : xs), [[0, 1]]))
  const heard = metres(midi.header.timeSignatures.map((t) => [t.ticks / W, t.timeSignature[0] / t.timeSignature[1]]))
  if (sigs.length !== heard.length || sigs.some((x, i) => Math.abs(x[0] - heard[i][0]) > 1e-3 || Math.abs(x[1] - heard[i][1]) > 1e-6)) return { why: "the .ly's time signatures are not the MIDI's" }
  const count = (end: number) => {
    let n = 0
    for (let x = 0; x < end - 1e-6 && n < 1e5; n++) {
      const { a, L } = barAt(lay, x + 1e-9)
      x = a + L * (Math.floor((x - a) / L + 1e-6) + 1)
    }
    return n
  }
  const end = Math.max(...r.ev.flatMap((e) => (e.k === 'on' ? [e.at + e.d] : [])))
  return count(end - shift) === count(until / W - shift) ? { pickup: 0 } : { why: 'bar count differs' } // (a bar of difference is 7 more pieces: docs/changes/lyreader.md)
}

/** Of a multi-movement work's .ly files, the one whose reading matches this movement's MIDI, closest in length (a dense
 * movement can cover a sparse one's onsets); the first when none matches. Zips may number the MIDI files by the master .ly's
 * scores and the .ly files by movement (BWV 827, 830). `strict`: none when none matches (a piece with one MIDI has no sibling to fall back to). */
export function pickLy(bytes: Uint8Array, lys: string[], strict = false): string | undefined {
  const midi = new Midi(ab(bytes))
  const fit = lys.map((ly) => ({ ly, ...score(midi, ly) })).filter((x) => x.ok)
  return fit.sort((a, b) => a.off - b.off)[0]?.ly ?? (strict ? undefined : lys[0])
}

/** Barlines of a MIDI as the app lays them out (src/quantize.ts), with the pickup the .ly states when it states one: start tick and length of each bar. */
function barGrid(midi: Midi, bytes: Uint8Array, pickup?: number): Bars {
  const t = (s: number) => Math.round(midi.header.secondsToTicks(s))
  return fromMidi(ab(bytes), '', '', 60, undefined, undefined, pickup).bars.map((b) => ({ t: t(b.t0), len: t(b.t1) - t(b.t0) }))
}

/** A bar of `ticks` as a time signature, or undefined when no n/4, n/8, n/16 or n/32 has that length. */
function sigOf(ticks: number, ppq: number): [number, number] | undefined {
  for (const den of [4, 8, 16, 32]) {
    const n = (ticks / ppq) * (den / 4)
    if (n >= 1 && Math.abs(n - Math.round(n)) < 1e-6) return [Math.round(n), den]
  }
}

/** The MIDI with its volta repeats and its D.C./D.S. jump played out (the same bytes when there is nothing to play twice), or why not. */
export function unfold(bytes: Uint8Array, ly: string): { bytes: Uint8Array } | { why: string } {
  const midi = new Midi(ab(bytes))
  const ppq = midi.header.ppq
  const { r, miss, until, notes, ok } = score(midi, ly)
  if (!r) return { why: 'no score with \\midi' }
  if (!ok) return { why: `the .ly reading misses ${miss} of ${notes} MIDI onsets` }
  if (r.unfolded && Math.abs(until - 4 * ppq * r.len) > 0.05 * until) return { why: 'the MIDI is not as long as the score with its repeats played out' } // the onset match runs one way
  const p = plan(r, 4 * ppq, until)
  if ('why' in p) return p
  if (p.segs.length === 1) return { bytes }
  const lost = midi.tracks.flatMap((t) => t.notes).filter((n) => !p.segs.some(([s, e]) => n.ticks >= s && n.ticks < e)).length
  if (lost) return { why: `${lost} notes the order of play never reaches` } // no repeat in this MIDI's score, or only \repeat volta 1: a sign, nothing to play twice
  // the bars of the result are laid out by the app from the notes and time signatures (src/quantize.ts), so the barlines the
  // copies make are checked against what it lays out: first against the bars it finds in this MIDI, else against the score's own
  const first = write(bytes, p.segs, barGrid(midi, bytes), p.delay, until)
  if ('bytes' in first || !/^(bars|a repeat)/.test(first.why)) return first
  const second = write(bytes, p.segs, p.bars, p.delay, until)
  if ('bytes' in second) return second
  // last: the bars with the first bar the .ly states, which the catalogue hands to the app (Piece.pickup) for this file and its result
  const pickup = pickupWhy(bytes, ly).pickup
  if (pickup === undefined) return first
  const third = write(bytes, p.segs, barGrid(midi, bytes, pickup), p.delay, until, pickup)
  return 'bytes' in third ? third : first
}

/** The MIDI played in the order `segs` says, its barlines (`src`, in the source's ticks) carried along. */
function write(bytes: Uint8Array, segs: Seg[], src0: Bars, delay: number, until: number, pickup?: number): { bytes: Uint8Array } | { why: string } {
  const midi = new Midi(ab(bytes))
  const ppq = midi.header.ppq
  let src = src0
  // A join that cuts a bar short (a pickup after a full bar, a bar ending early) leaves a bar of its own length, which the
  // result states as a time signature; a join that completes the bar needs nothing.
  // the source lays no barline after its last note; the copies of its last stretch go on past it
  for (let end = Math.max(...segs.map(([, e]) => e)); src[src.length - 1].t + src[src.length - 1].len < end; ) src = [...src, { t: src[src.length - 1].t + src[src.length - 1].len, len: src[src.length - 1].len }]
  const lines = src.map((b) => b.t)
  const barOf = (x: number) => src.findLast((b) => b.t <= x) ?? src[0]
  const pick = src.length > 1 && src[0].len < src[1].len ? src[1].len - src[0].len : 0 // the first bar is a pickup: how short
  const full = (x: number) => (x < src[0].len && pick ? src[1].len : barOf(x).len) // the bar's length if it were whole
  const expected: number[] = []
  const fixes: { a: number; b: number }[] = []
  // `delay`: the notes sit this far after the bar they belong to (a grace note opened the score), as the app snaps them; the
  // bars below are in the snapped frame: a stretch starting after 0 begins `delay` earlier there
  const nom = (x: number) => (x > 0 ? x - delay : 0)
  segs.forEach(([s, e, o], k) => {
    let skip = false
    const [ns, ne, J] = [nom(s), nom(e), o - (s > 0 ? delay : 0)] // J: where the stretch starts in the result
    if (k) {
      const e0 = nom(segs[k - 1][1])
      const into = (x: number) => (x - barOf(x).t >= barOf(x).len ? 0 : x - barOf(x).t) // the last barline is not laid when nothing sounds after it
      const [pe, ps] = [into(e0), ns === 0 && pick ? pick : into(ns)]
      const rem = ps ? (lines.find((t) => t > ns) ?? ns - ps + barOf(ns).len) - ns : 0
      skip = ps > 0 && pe === ps && full(e0) === full(ns) // a pickup that completes the bar before it has no barline of its own
      if (pe + rem && !skip) {
        fixes.push({ a: J - pe, b: J + rem })
        if (!pe) expected.push(J)
      }
    }
    for (const t of lines) if (t >= ns && t < ne && !(skip && t === ns) && (k < segs.length - 1 || t + delay <= until)) expected.push(J + t - ns) // the app lays no barline after the last note
  })
  if (fixes.some((f) => !sigOf(f.b - f.a, ppq) || f.b - f.a > Math.max(...src.map((x) => x.len)))) return { why: 'a repeat that is not whole bars' }
  // ponytail: a grace note just before a repeat's first beat belongs to the stretch before it, so the second pass plays
  // without it; move graces within W/8 of a jump target into the repeat if anyone hears the difference
  const copies = (t: number) => segs.filter(([s, e]) => t >= s && t < e).map(([s, , o]) => o + t - s)
  // header and controller events: copied with their stretch, and the state at each jump restated (redundant ones dropped)
  const remap = <E extends { ticks: number }>(xs: E[], key?: (x: E) => string): E[] => {
    const sorted = [...xs].sort((a, b) => a.ticks - b.ticks)
    const res: E[] = []
    for (const [s, e, o] of segs) {
      const st = key && sorted.filter((x) => x.ticks <= s).pop()
      if (st) res.push({ ...st, ticks: o })
      for (const x of sorted) if (x.ticks >= s && x.ticks < e && x !== st) res.push({ ...x, ticks: o + x.ticks - s })
    }
    res.sort((a, b) => a.ticks - b.ticks)
    return key ? res.filter((x, i) => !i || key(x) !== key(res[i - 1])) : res
  }
  const h = midi.header
  h.tempos = remap(h.tempos, (x) => `${x.bpm}`)
  h.timeSignatures = remap(h.timeSignatures, (x) => `${x.timeSignature}`)
  h.keySignatures = remap(h.keySignatures, (x) => `${x.key} ${x.scale}`)
  h.meta = remap(h.meta)
  for (const f of fixes) {
    const was = h.timeSignatures.filter((x) => x.ticks <= f.b).pop()
    h.timeSignatures = [...h.timeSignatures.filter((x) => x.ticks < f.a || x.ticks > f.b), { ticks: f.a, timeSignature: sigOf(f.b - f.a, ppq)! }, ...(was ? [{ ticks: f.b, timeSignature: was.timeSignature }] : [])] as typeof h.timeSignatures
  }
  h.timeSignatures = h.timeSignatures.sort((a, b) => a.ticks - b.ticks).filter((x, i, all) => !i || `${x.timeSignature}` !== `${all[i - 1].timeSignature}`)
  let want = 0
  for (const t of midi.tracks) {
    const ns = t.notes
    t.notes = []
    for (const n of ns) for (const at of copies(n.ticks)) t.addNote({ midi: n.midi, ticks: at, durationTicks: n.durationTicks, velocity: n.velocity, noteOffVelocity: n.noteOffVelocity }), want++
    for (const [num, ccs] of Object.entries(t.controlChanges)) {
      t.controlChanges[+num] = []
      for (const cc of remap(ccs, (x) => `${x.value}`)) t.addCC({ number: +num, ticks: cc.ticks, value: cc.value })
    }
    const pbs = remap(t.pitchBends)
    t.pitchBends = []
    for (const pb of pbs) t.addPitchBend({ ticks: pb.ticks, value: pb.value })
  }
  const outBytes = encode(midi)
  // checks on the written file: every copied note and key is there, and the app's barlines are the copied ones
  const back = new Midi(ab(outBytes))
  if (back.tracks.reduce((s, t) => s + t.notes.length, 0) !== want) return { why: 'note count after writing' }
  if (JSON.stringify(back.header.keySignatures) !== JSON.stringify(h.keySignatures.map(({ key, scale, ticks }) => ({ key, scale, ticks })))) return { why: 'keys after writing' }
  const want2 = [...new Set(expected)].sort((a, b) => a - b)
  const got = barGrid(back, outBytes, pickup).map((b) => b.t).filter((t) => t <= want2[want2.length - 1] + 1)
  // the app finds a pickup of its own, so a result with no short bars to state may start its bars at another phase than the
  // source did; every barline is then the copies' one moved by the same amount
  const shift = got.length > 1 ? got[1] - want2[1] : 0
  const same = (x: number) => (t: number, i: number) => Math.abs(t - want2[i] - x) <= 1
  if (got.length !== want2.length || (!got.every(same(0)) && !(fixes.length === 0 && got.slice(1).every((t, i) => same(shift)(t, i + 1))))) return { why: `bars: the written file lays ${got.length} barlines where the copies make ${want2.length}` }
  return { bytes: outBytes }
}

/** A Mutopia input with its volta repeats played out, and its .ly read as \repeat unfold (what the MIDI now plays), so the
 * analysis no longer flags it. Unchanged when there is nothing to unfold or it cannot be done. The anacrusis is read here, from
 * the MIDI and .ly that the reading was checked against: the unfolded file no longer reads like its .ly (a D.C. is not in it). */
export function withRepeats<E extends { bytes: Uint8Array; ly?: string; matched?: boolean; pickup?: number }>(e: E): E {
  if (!e.ly || !/\\repeat\s+"?volta/.test(e.ly) || /\\unfoldRepeats/.test(e.ly)) return e
  const u = unfold(e.bytes, e.ly)
  if ('why' in u) return e
  const pickup = lyPickup(e.bytes, e.ly)
  return { ...e, bytes: u.bytes, matched: true, ...(pickup !== undefined && { pickup }), ly: e.ly.replace(/\\repeat\s+"?volta"?/g, '\\repeat unfold') }
}

