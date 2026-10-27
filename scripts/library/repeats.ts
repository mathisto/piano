// Unfold \repeat volta in a Mutopia MIDI. LilyPond's MIDI plays a volta repeat once unless the score says \unfoldRepeats,
// so the .ly is read for where each repeat sits (durations only, pitches are never read), the reading is checked against
// the MIDI (its onsets must land where the .ly puts notes), and the repeated stretches are copied forward into a new MIDI
// with tempo, meter, key and pedal state carried to each jump. Simple cases only: one level of repeat, with or without
// \alternative endings. Nested or overlapping repeats, D.C./D.S./Fine, \repeat segno and 2.24's \volta are left alone.
import { Midi } from '@tonejs/midi'
import { fromMidi } from '../../src/song'

type Ev = { k: 'on' | 'grace'; at: number } | { k: 'rep'; at: number; body: number; alts: number[]; n: number } | { k: 'bad'; at: number; why: string }
type Rec = { len: number; ev: Ev[] }
type Tok = { t: string; v: string; d?: string }

const DUR = String.raw`(?:\d+|\\breve|\\longa)\.*(?:\*\d+(?:/\d+)?)*(?::\d*)?`
const TOK = new RegExp(String.raw`\s+|\x01(\d+)\x01|(<<|>>|\\\\|[{}<>=])|\\([a-zA-Z]+)|\\.|[-^_](?:\d+|[.>^+!_|-])?|([a-zA-Z]+(?:[.-][a-zA-Z]+)*)[',]*[!?]?(?:=(?:[',]+|(?=\d)))?(${DUR})?|(\d+(?:/\d+)?\.*(?:\*\d+(?:/\d+)?)*(?::\d*)?)|.`, 'y')

function tokens(src: string): Tok[] {
  const strs: string[] = []
  src = src.replace(/"(?:\\.|[^"\\])*"|%\{[\s\S]*?%\}|%[^\n]*/g, (m) => (m[0] === '"' ? `\x01${strs.push(m.slice(1, -1)) - 1}\x01` : ' '))
  const out: Tok[] = []
  for (let i = 0; i < src.length; ) {
    if (src[i] === '#' || src[i] === '$') {
      // a Scheme value: #t, #'sym, #-2, #(...), #{ ... #}
      while (/[#$'`,]|\s/.test(src[i] ?? '')) i++
      if (src[i] === '(') for (let depth = 0; i < src.length; i++) {
        if (src[i] === '(') depth++
        else if (src[i] === ')' && !--depth) { i++; break }
      }
      else if (src[i] === '{') i = src.indexOf('#}', i) + 2 || src.length
      else while (i < src.length && !/[\s{}()<>]/.test(src[i])) i++
      out.push({ t: 'scm', v: '' })
      continue
    }
    TOK.lastIndex = i
    const m = TOK.exec(src)!
    i = TOK.lastIndex
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

const BLOCK = new Set(['with', 'header', 'paper', 'layout', 'midi', 'lyricmode', 'lyrics', 'addlyrics', 'figuremode', 'figures', 'chordmode', 'chords', 'drummode', 'markuplist'])
const GRACE = new Set(['grace', 'acciaccatura', 'appoggiatura', 'slashedGrace'])

/** The music of each score with a \midi block (LilyPond writes one MIDI file each), in whole notes from its start: note
 * onsets, grace notes and volta repeats. */
export function readLy(src: string): Rec[] {
  const T = tokens(src)
  let p = 0
  let last = 0.25 // LilyPond's default duration is parser state, so it carries lexically, as here
  let ev: Ev[] = []
  const vars = new Map<string, Rec>()
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
  const put = (r: Rec, at: number, k = 1) => r.ev.forEach((e) => ev.push({ ...e, at: at + e.at * k }))
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
    else p++
  }
  const value = () => (is('cmd', 'markup') ? (p++, markup()) : p++)
  const frac = () => {
    const [a, b] = (T[p++]?.v ?? '1/1').split('/').map(Number)
    return a / (b || 1)
  }
  const score = () => {
    let r: Rec = { len: 0, ev: [] }
    let midi = false
    if (!is('{')) return { ...r, midi }
    p++
    while (p < T.length && !is('}')) {
      if (is('cmd', 'midi')) midi = true
      if (is('cmd') && BLOCK.has(T[p].v)) (p++, block())
      else {
        const m = sub(() => music(0))
        if (m.len || m.ev.length) r = m
      }
    }
    p++
    return { ...r, midi }
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
      while (p < T.length && !is('>')) p++
      p++
      if (is('num')) last = dur(T[p++].v)
      ev.push({ k: 'on', at })
      return last
    }
    if (k.t === 'note') {
      if (!k.d && is('num') && !T[p].v.includes('/')) k.d = T[p++].v // 'e 8' is e8
      while (k.d && is('x', '*') && T[p + 1]?.t === 'num') (k.d += `*${T[p + 1].v}`), (p += 2) // 's2. * 2' is s2.*2
      if (k.d) last = dur(k.d)
      if (!/^[rRs]$/.test(k.v)) ev.push({ k: 'on', at })
      return last
    }
    if (k.t === 'num') {
      last = dur(k.v)
      ev.push({ k: 'on', at })
      return last
    }
    if (k.t !== 'cmd') return 0
    const c = k.v
    const v = vars.get(c)
    if (v) return put(v, at), v.len
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
      case 'markup':
        return markup(), 0
      case 'mark':
      case 'tweak':
        if (c === 'tweak') p++
        return value(), 0
      case 'set':
      case 'override':
      case 'property':
        while (p < T.length && !is('=')) p++
        p++
        return value(), 0
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
      case 'time':
      case 'partial':
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
        sub(() => music(0))
        return len
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
        if (type === 'volta') {
          if ([body, ...alts].some((x) => x.ev.some((e) => e.k === 'rep'))) ev.push({ k: 'bad', at, why: 'nested repeats' })
          put(body, at)
          alts.reduce((x, a) => (put(a, x), x + a.len), at + body.len)
          ev.push({ k: 'rep', at, body: body.len, alts: alts.map((a) => a.len), n })
          return body.len + sum
        }
        if (type !== 'unfold' && type !== 'percent' && type !== 'tremolo') ev.push({ k: 'bad', at, why: `\\repeat ${type}` })
        for (let i = 0; i < n; i++) put(body, at + i * body.len)
        alts.reduce((x, a) => (put(a, x), x + a.len), at + n * body.len)
        return n * body.len + sum
      }
    }
    if (GRACE.has(c)) return ev.push({ k: 'grace', at }), sub(() => music(0)), 0
    return 0
  }

  while (p < T.length) {
    const k = T[p]
    if ((k.t === 'note' || k.t === 'str') && T[p + 1]?.t === '=') {
      p += 2
      if (is('cmd', 'markup')) (p++, markup())
      else if (is('scm') || is('str') || is('num')) p++
      else vars.set(k.v, sub(() => music(0)))
      continue
    }
    p++
    if (k.t !== 'cmd') continue
    if (k.v === 'score') scores.push(score())
    else if (BLOCK.has(k.v)) block()
    else if (['version', 'include', 'language'].includes(k.v)) p++
  }
  return scores.filter((s) => s.midi)
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
const DC = /D\.\s?[CS]\.|[Dd]a [Cc]apo|[Dd]al [Ss]egno|\\segno|\\coda|\\repeat\s+segno|\\volta\b|\bFine\b/

/** The \\midi score of the .ly that plays this MIDI, and how many of the MIDI's onsets its reading misses: a reading matches
 * when every onset is where the .ly puts a note, or just before one with grace notes (LilyPond writes one file a score). */
function score(midi: Midi, ly: string) {
  const W = 4 * midi.header.ppq
  const tick = (x: number) => Math.round(x * W)
  const notes = midi.tracks.flatMap((t) => t.notes)
  const misses = (r: Rec) => {
    const on = new Set(r.ev.flatMap((e) => (e.k === 'on' ? [tick(e.at)] : [])))
    const grace = r.ev.flatMap((e) => (e.k === 'grace' ? [tick(e.at)] : []))
    return notes.filter((n) => ![-1, 0, 1].some((d) => on.has(n.ticks + d)) && !grace.some((g) => n.ticks < g && n.ticks >= g - W / 8)).length
  }
  const [r, miss = Infinity] = readLy(ly).map((x) => [x, misses(x)] as const).sort((x, y) => x[1] - y[1])[0] ?? []
  const off = r ? Math.abs(tick(r.len) - Math.max(0, ...notes.map((n) => n.ticks + n.durationTicks))) : Infinity // length mismatch, ticks
  return { r, miss, off, notes: notes.length, ok: miss <= 0.02 * notes.length }
}

/** Of a multi-movement work's .ly files, the one whose reading matches this movement's MIDI, closest in length (a dense
 * movement can cover a sparse one's onsets); the first when none matches. Zips may number the MIDI files by the master .ly's
 * scores and the .ly files by movement (BWV 827, 830). */
export function pickLy(bytes: Uint8Array, lys: string[]): string | undefined {
  const midi = new Midi(ab(bytes))
  const fit = lys.map((ly) => ({ ly, ...score(midi, ly) })).filter((x) => x.ok)
  return fit.sort((a, b) => a.off - b.off)[0]?.ly ?? lys[0]
}

/** The MIDI with its volta repeats played out (the same bytes when its score has none), or why not. */
export function unfold(bytes: Uint8Array, ly: string): { bytes: Uint8Array } | { why: string } {
  if (DC.test(ly)) return { why: 'D.C., D.S., Fine, segno or \\volta' }
  const midi = new Midi(ab(bytes))
  const W = 4 * midi.header.ppq
  const tick = (x: number) => Math.round(x * W)
  const { r, miss, notes, ok } = score(midi, ly)
  if (!r) return { why: 'no score with \\midi' }
  if (!ok) return { why: `the .ly reading misses ${miss} of ${notes} MIDI onsets` }
  const bad = r.ev.find((e) => e.k === 'bad')
  if (bad) return { why: bad.why }
  type Rep = Extract<Ev, { k: 'rep' }>
  const end = (x: Rep) => x.at + x.body + x.alts.reduce((s, a) => s + a, 0)
  // one repeat read in several voices: the longest reading wins (a voice may stop early, or hold only skips)
  const byAt = new Map<string, Rep>()
  for (const e of r.ev) if (e.k === 'rep' && (byAt.get(e.at.toFixed(6))?.body ?? -1) < e.body) byAt.set(e.at.toFixed(6), e)
  const reps = [...byAt.values()].sort((a, b) => a.at - b.at)
  if (!reps.length) return { bytes } // this MIDI's score has no volta repeat (another score in the .ly does)
  if (reps.some((x, i) => i && end(reps[i - 1]) > x.at + 1e-9)) return { why: 'voices disagree on the repeats' }
  if (reps.some((x) => x.alts.length > x.n)) return { why: 'more endings than passes' }

  // play order: up to the repeat, then each pass of the body with its ending (the first ending serves the extra passes)
  const segs: Seg[] = []
  let from = 0
  let out = 0
  const play = (a: number, b: number) => {
    const [s, e] = [tick(a), tick(b)]
    if (e === s) return
    if (segs.length && segs[segs.length - 1][1] === s) segs[segs.length - 1][1] = e
    else segs.push([s, e, out])
    out += e - s
  }
  for (const x of reps) {
    play(from, x.at)
    const starts = x.alts.map((_, i) => x.at + x.body + x.alts.slice(0, i).reduce((s, a) => s + a, 0))
    for (let pass = 0; pass < x.n; pass++) {
      play(x.at, x.at + x.body)
      const i = Math.max(0, pass - (x.n - x.alts.length))
      if (x.alts.length) play(starts[i], starts[i] + x.alts[i])
    }
    from = end(x)
  }
  play(from, Infinity)
  if (segs.length === 1) return { bytes } // only \repeat volta 1: a sign, nothing to play twice

  // each repeat must add whole bars, or every barline after it would move
  const sigs = midi.header.timeSignatures
  const barAt = (t: number) => {
    const s = sigs.filter((x) => x.ticks <= t).pop()?.timeSignature ?? [4, 4]
    return (s[0] * W) / s[1]
  }
  let addBars = 0
  for (const x of reps) {
    const played = Array.from({ length: x.n }, (_, i) => x.body + (x.alts[Math.max(0, i - (x.n - x.alts.length))] ?? 0))
    const extra = tick(played.reduce((s, a) => s + a, 0) - (end(x) - x.at))
    let t = tick(x.at)
    while (t < tick(x.at) + extra) (t += barAt(t)), addBars++
    if (t !== tick(x.at) + extra) return { why: 'a repeat that is not whole bars' }
  }

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
  // checks on the written file: every copied note and key is there, and the bars grew by exactly the repeated bars
  const back = new Midi(ab(outBytes))
  if (back.tracks.reduce((s, t) => s + t.notes.length, 0) !== want) return { why: 'note count after writing' }
  if (JSON.stringify(back.header.keySignatures) !== JSON.stringify(h.keySignatures.map(({ key, scale, ticks }) => ({ key, scale, ticks })))) return { why: 'keys after writing' }
  const before = fromMidi(ab(bytes), '', '').bars.length
  const after = fromMidi(ab(outBytes), '', '').bars.length
  if (after !== before + addBars) return { why: `bars ${before} + ${addBars} repeated, the written file has ${after}` }
  return { bytes: outBytes }
}

/** A Mutopia input with its volta repeats played out, and its .ly read as \repeat unfold (what the MIDI now plays), so the
 * analysis no longer flags it. Unchanged when there is nothing to unfold or it cannot be done. */
export function withRepeats<E extends { bytes: Uint8Array; ly?: string }>(e: E): E {
  if (!e.ly || !/\\repeat\s+"?volta/.test(e.ly) || /\\unfoldRepeats/.test(e.ly)) return e
  const u = unfold(e.bytes, e.ly)
  return 'why' in u ? e : { ...e, bytes: u.bytes, ly: e.ly.replace(/\\repeat\s+"?volta"?/g, '\\repeat unfold') }
}
