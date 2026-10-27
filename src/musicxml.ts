import { build, estimateFifths, type Bar, type Hand, type Raw, type Song } from './song'

// ---- a small XML reader: enough for MusicXML, runs in the browser and in node tests ----

interface El {
  n: string
  a: Record<string, string>
  c: El[]
  t: string
}

const ENT: Record<string, string> = { '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&apos;': "'" }
const unent = (s: string) => s.replace(/&(lt|gt|amp|quot|apos);/g, (m) => ENT[m])

export function parseXml(src: string): El {
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>[]*(?:\[[\s\S]*?\])?\s*>|<!\[CDATA\[([\s\S]*?)\]\]>|<\/([^\s>]+)\s*>|<([^\s/>]+)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g
  const root: El = { n: '#root', a: {}, c: [], t: '' }
  const stack = [root]
  for (let m = re.exec(src); m; m = re.exec(src)) {
    const top = stack[stack.length - 1]
    if (m[1] !== undefined) top.t += m[1]
    else if (m[2]) {
      if (stack.length > 1) stack.pop()
    } else if (m[3]) {
      const e: El = { n: m[3], a: {}, c: [], t: '' }
      for (const at of (m[4] ?? '').matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) e.a[at[1]] = unent(at[2] ?? at[3] ?? '')
      top.c.push(e)
      if (!m[5]) stack.push(e)
    } else if (m[6] !== undefined) top.t += unent(m[6])
  }
  const first = root.c[0]
  if (!first) throw new Error('This is not a MusicXML file.')
  return first
}

const kids = (e: El | undefined, n: string) => (e ? e.c.filter((x) => x.n === n) : [])
const kid = (e: El | undefined, n: string) => (e ? e.c.find((x) => x.n === n) : undefined)
const num = (e: El | undefined, n: string) => {
  const v = Number(kid(e, n)?.t.trim())
  return Number.isFinite(v) ? v : undefined
}

// ---- .mxl is a zip: read the central directory, inflate with the platform's DecompressionStream ----

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function unzip(u: Uint8Array): Promise<Map<string, Uint8Array>> {
  const v = new DataView(u.buffer, u.byteOffset, u.byteLength)
  let eocd = u.length - 22
  while (eocd >= 0 && v.getUint32(eocd, true) !== 0x06054b50) eocd--
  if (eocd < 0) throw new Error('This .mxl file is damaged.')
  const count = v.getUint16(eocd + 10, true)
  let p = v.getUint32(eocd + 16, true)
  const out = new Map<string, Uint8Array>()
  for (let i = 0; i < count; i++) {
    if (v.getUint32(p, true) !== 0x02014b50) break
    const method = v.getUint16(p + 10, true)
    const csize = v.getUint32(p + 20, true)
    const nlen = v.getUint16(p + 28, true)
    const xlen = v.getUint16(p + 30, true)
    const clen = v.getUint16(p + 32, true)
    const local = v.getUint32(p + 42, true)
    const name = new TextDecoder().decode(u.subarray(p + 46, p + 46 + nlen))
    const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true)
    const raw = u.subarray(start, start + csize)
    out.set(name, method === 0 ? raw : await inflateRaw(raw))
    p += 46 + nlen + xlen + clen
  }
  return out
}

const dec = (b: Uint8Array) => new TextDecoder().decode(b)

/** The score text from either a plain MusicXML file or a compressed .mxl. */
export async function xmlText(buf: ArrayBuffer): Promise<string> {
  const u = new Uint8Array(buf)
  if (u[0] !== 0x50 || u[1] !== 0x4b) return dec(u)
  const files = await unzip(u)
  const c = files.get('META-INF/container.xml')
  let root = c ? /full-path\s*=\s*["']([^"']+)["']/.exec(dec(c))?.[1] : undefined
  root ??= [...files.keys()].find((k) => /\.(xml|musicxml)$/i.test(k) && !k.startsWith('META-INF'))
  const f = root ? files.get(root) : undefined
  if (!f) throw new Error('No score found inside this .mxl file.')
  return dec(f)
}

// ---- score -> Song ----

const STEP: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

interface Ev {
  v?: number // velocity from the last dynamics mark, 0..1
  m: number
  q: number // quarter notes from the start of its measure
  dq: number
  p: number
  track: number
  h?: Hand
  acc?: -1 | 0 | 1 // as written
  tuplet?: { num: number; den: number }
  gn?: number // a grace note: how many graces before its main note it is played (1 = just before)
  also?: number // another part wrote this note too (a voice doubled by the piano): it belongs to both
  at: number // quarters from the start of its part, for hairpins
  art?: 'stac' | 'ten' | 'acc'
  slur?: boolean
  wg?: number // the hairpin it sits under (index into W)
  wp?: number // which pass through that hairpin: the played index of its first measure
}

const ART: Record<string, Ev['art']> = { staccato: 'stac', staccatissimo: 'stac', accent: 'acc', 'strong-accent': 'acc', tenuto: 'ten' }
const ART_RANK = ['stac', 'acc', 'ten'] // a note marked twice keeps the first: length is the surer thing to judge
const WEDGE_STEP = 0.15 // a hairpin with no dynamic at its end rises or falls about one mark (p to mp)

const HAIRPIN_WORD = /(?<!\p{L})(?:(cresc)|(decresc|dim)(?:in)?)(?:u?endo|\.)?(?!\p{L})/iu // 'cresc.' 'crescendo' 'dim.' 'diminuendo' 'decresc.': a hairpin in words
const WORD_BARS = 4 // a word with no dynamic after it reaches this far
const DYN: Record<string, number> = { pppp: 0.1, ppp: 0.15, pp: 0.25, p: 0.35, mp: 0.48, mf: 0.62, f: 0.78, ff: 0.9, fff: 0.96, sf: 0.9, sfz: 0.9, fz: 0.9, fp: 0.7 }

// Quarter-note bpm for a tempo word when the score gives no number: the first word names the pace, the rest of the text bends it
// ('Allegro ma non troppo', 'Nicht zu schnell', 'Sehr langsam'), a compound meter (6/8, 12/8) beats a dotted quarter so runs faster in quarters.
// ponytail: the bend is a flat 12%, there is no word for 'Tempo di valse' or 'L'istesso'; a table per meter if it matters.
const TEMPI: Record<string, number> = {
  prestissimo: 200, presto: 176, vivace: 152, allegro: 132, allegretto: 112, moderato: 108, andantino: 92, andante: 84, adagietto: 72, adagio: 66, larghetto: 63, lento: 52, largo: 46, grave: 40, maestoso: 80, tranquillo: 76,
  schnell: 160, rasch: 144, geschwind: 144, lebhaft: 132, munter: 120, bewegt: 108, mässig: 96, mäßig: 96, massig: 96, gefällig: 92, gemächlich: 80, zart: 76, gemessen: 72, ruhig: 66, innig: 66, langsam: 60, getragen: 60, feierlich: 56, schleppend: 56,
  vif: 144, modéré: 100, lent: 56, vivo: 152, animato: 120, allo: 132, // Allo. is Allegro in the Chopin Institute's editions
}
const WORD = (alts: string) => new RegExp(`(?<!\\p{L})(?:${alts})(?!\\p{L})`, 'iu')
const TEMPO_RE = new RegExp(`(?<!\\p{L})(${Object.keys(TEMPI).join('|')})(?!\\p{L})`, 'iu')
const AWAY = WORD('molto|assai|sehr|très|\\p{L}+issimo') // pushes the pace away from moderate
const TOWARD = WORD('non\\s+(?:troppo|tanto)|ma\\s+non|nicht\\s+zu|ziemlich|etwas|moderato') // and these toward it
const BRISK = WORD('con\\s+(?:moto|brio)|animato|agitato|mosso|appassionato')
const BROAD = WORD('sostenuto|cantabile|retenu|soutenu')
const TEMPO_I = WORD('tempo\\s+(?:i|primo|1)') // back to the first pace
const bend = (bpm: number, away: boolean) => (bpm > 96 === away ? bpm * 1.12 : bpm / 1.12)

/** Quarter-note bpm that a tempo word names, or undefined. */
export function tempoWord(text: string, compound = false): number | undefined {
  const m = TEMPO_RE.exec(text)
  if (!m) return undefined
  const rest = text.replace(m[0], ' ')
  let bpm = TEMPI[m[1].toLowerCase()]
  if (AWAY.test(rest)) bpm = bend(bpm, true)
  else if (TOWARD.test(rest)) bpm = bend(bpm, false)
  if (BRISK.test(rest)) bpm *= 1.08
  if (BROAD.test(rest)) bpm /= 1.08
  return Math.round(bpm * (compound ? 1.2 : 1))
}
const GRACE_S = 0.07 // a grace note sounds this long before the next one
const UNIT: Record<string, number> = { breve: 8, whole: 4, half: 2, quarter: 1, eighth: 0.5, '16th': 0.25, '32nd': 0.125 }

// D.C., D.S., Fine, To Coda and Coda as words; <sound dacapo|dalsegno|segno|tocoda|coda|fine> say the same in machine form
const JUMP: Record<string, RegExp> = { dc: /\bD\.\s?C\.|\bda\s+capo\b/i, ds: /\bD\.\s?S\.|\bdal\s+segno\b/i, tocoda: /\bto\s+coda\b/i, fine: /^\s*fine\.?\s*$/i, coda: /^\s*coda\s*$/i }

/**
 * The order measures are played in: repeat signs, first and second endings, then one D.C. or D.S. jump with al Fine or al Coda
 * (no repeats on the way back, last ending only). A jump it cannot place (no segno, a To Coda with no Coda, two jumps)
 * is left out and flagged 'repeats-unexpanded'. A Fine with no jump ends the last pass of a repeat (a strophic song's postlude).
 */
export function playOrder(parts: El[], flags: string[] = []): number[] {
  const ms = kids(parts[0], 'measure')
  const marks = ms.map(() => new Set<string>())
  for (const part of parts)
    kids(part, 'measure').forEach((meas, i) => {
      const mk = marks[i]
      if (!mk) return
      for (const d of kids(meas, 'direction')) {
        const dts = kids(d, 'direction-type')
        const words = dts.flatMap((dt) => kids(dt, 'words')).map((w) => w.t).join(' ')
        for (const [k, re] of Object.entries(JUMP)) if (re.test(words)) mk.add(k)
        if (dts.some((dt) => kid(dt, 'segno'))) mk.add('segno')
        if (dts.some((dt) => kid(dt, 'coda'))) mk.add('sign')
      }
      for (const s of [...kids(meas, 'sound'), ...kids(meas, 'direction').flatMap((d) => kids(d, 'sound'))]) {
        if (s.a.dacapo === 'yes') mk.add('dc')
        for (const k of ['dalsegno', 'segno', 'tocoda', 'coda', 'fine']) if (s.a[k]) mk.add(k === 'dalsegno' ? 'ds' : k)
      }
    })
  const at = (k: string) => marks.flatMap((m, i) => (m.has(k) ? [i] : []))
  // bare coda signs: the last is the Coda, an earlier one the To Coda
  const signs = at('sign')
  if (signs.length && !at('coda').length) marks[signs[signs.length - 1]].add('coda')
  if (signs.length > 1 && !at('tocoda').length) marks[signs[0]].add('tocoda')
  const jumps = [...at('dc'), ...at('ds')]
  const [tocoda, coda] = [at('tocoda')[0], at('coda')[0]]
  const any = jumps.length > 0 || tocoda !== undefined || coda !== undefined
  const target = jumps.length === 1 ? (marks[jumps[0]].has('ds') ? at('segno')[0] : 0) : undefined
  const ok = target !== undefined && target <= jumps[0] && (tocoda === undefined) === (coda === undefined) && (coda === undefined || (tocoda < coda && coda > jumps[0]))
  if (any) flags.push('dc-ds')
  if (any && !ok) flags.push('repeats-unexpanded')
  const jump = ok ? jumps[0] : undefined

  const info = ms.map((meas) => {
    const bars = kids(meas, 'barline')
    const rep = (loc: string, dir: string) => bars.some((b) => (b.a.location ?? 'right') === loc && kids(b, 'repeat').some((r) => r.a.direction === dir))
    const ends = bars.flatMap((b) => kids(b, 'ending'))
    return {
      forward: rep('left', 'forward'),
      backward: rep('right', 'backward'),
      times: Number(bars.flatMap((b) => kids(b, 'repeat')).find((r) => r.a.direction === 'backward')?.a.times) || 2,
      start: ends.find((e) => e.a.type === 'start')?.a.number,
      stop: ends.some((e) => e.a.type === 'stop' || e.a.type === 'discontinue'),
    }
  })
  // which ending numbers each measure belongs to, from a start mark to its stop
  const ending: (number[] | undefined)[] = []
  let cur: number[] | undefined
  info.forEach((m, i) => {
    if (m.start) cur = m.start.split(/[,\s]+/).map(Number).filter(Boolean)
    ending[i] = cur
    if (m.stop) cur = undefined
  })
  // after a jump only the last ending of each set is played
  const last = ending.map((e, i) => {
    if (!e) return false
    let a = i
    let b = i
    while (ending[a - 1]) a--
    while (ending[b + 1]) b++
    return e.includes(Math.max(...ending.slice(a, b + 1).flatMap((x) => x!)))
  })
  const order: number[] = []
  let from = 0
  let pass = 1
  let final = false // on the last pass of a repeat
  let jumped = false
  for (let i = 0; i < ms.length && order.length < 5000; ) {
    if (info[i].forward && i !== from) {
      from = i
      pass = 1
      final = false
    }
    if (ending[i] && !(jumped ? last[i] : ending[i]!.includes(pass))) {
      i++
      continue
    }
    order.push(i)
    if (info[i].backward && pass < info[i].times && !jumped) {
      pass++
      final = pass === info[i].times
      i = from
      continue
    }
    if (info[i].backward) {
      from = i + 1
      pass = 1
      final = false
    }
    if (marks[i].has('fine') && (jumped || (final && !any))) break
    if (jumped && i === tocoda) i = coda!
    else if (!jumped && i === jump) {
      jumped = true
      i = from = target!
    } else i++
  }
  return order
}

export function fromMusicXml(xml: string, title: string, id: string): Song {
  const root = parseXml(xml)
  if (root.n === 'score-timewise') throw new Error('Time-wise MusicXML is not supported. Export as partwise.')
  if (root.n !== 'score-partwise') throw new Error('This is not a MusicXML score.')
  const parts = kids(root, 'part')
  if (!parts.length) throw new Error('This score has no parts.')

  const evs: Ev[] = []
  const maxQ: number[] = [] // longest content of each measure across parts
  const implicit: boolean[] = []
  const sig: ({ n: number; den: number } | undefined)[] = []
  const tempos: { pi: number; m: number; q: number; bpm: number }[] = [] // <sound tempo> and <metronome>
  const worded: { pi: number; m: number; q: number; text: string }[] = [] // Allegro, Andante ...: only when no part gives a number
  const keyM: (number | undefined)[] = [] // key signature stated in each measure
  const flags: string[] = []
  const W: { a: number; b: number; up: boolean; m0: number; v0: number }[] = [] // hairpins, in part quarters
  let marked = false // the score writes any dynamics
  const dynM: { m: number; q: number; text: string }[] = [] // where the letters are written, to draw them

  parts.forEach((part, pi) => {
    let div = 1
    let staves = 1
    const open = new Map<string, Ev>() // tied notes still sounding, across barlines
    let curV = 0.7 // velocity from the last dynamics mark
    let base = 0 // quarters before this measure, in this part
    const marks: { at: number; v: number }[] = []
    const wOpen = new Map<string, (typeof W)[number]>()
    const said: (typeof W)[number][] = [] // hairpins written as words, their ends found when the part is read
    const starts: number[] = [] // where each measure begins, in part quarters
    const slurs = new Map<string, number>() // open slurs per voice
    const [evFrom, wFrom] = [evs.length, W.length]
    kids(part, 'measure').forEach((meas, m) => {
      for (const a of kids(meas, 'attributes')) {
        div = num(a, 'divisions') ?? div
        staves = num(a, 'staves') ?? staves
        const k = num(kid(a, 'key'), 'fifths')
        if (k !== undefined) keyM[m] ??= k
        const t = kid(a, 'time')
        if (t && pi === 0) sig[m] = { n: num(t, 'beats') ?? 4, den: num(t, 'beat-type') ?? 4 }
      }
      if (pi === 0) implicit[m] = meas.a.implicit === 'yes'
      starts[m] = base
      let cur = 0 // divisions into the measure
      let start = 0 // where the last note began, for chords
      let top = 0
      let run: Ev[] = [] // grace notes waiting for the note they lead into
      const land = () => {
        const n = run[run.length - 1]?.gn ?? 0
        for (const g of run) g.gn = n - g.gn! + 1
        run = []
      }
      const put = (q: number) => (maxQ[m] = Math.max(maxQ[m] ?? 0, q))
      for (const e of meas.c) {
        if (e.n === 'note') {
          const grace = !!kid(e, 'grace')
          const dur = grace ? 0 : (num(e, 'duration') ?? 0)
          const chord = !!kid(e, 'chord')
          const s = grace ? cur : chord ? start : cur
          if (!chord && !grace) {
            start = cur
            cur += dur
            land()
          }
          top = Math.max(top, s + dur)
          const pitch = kid(e, 'pitch')
          if (!pitch || kid(e, 'cue')) continue // rests, unpitched percussion, cue notes (another part's, printed small)
          const alter = num(pitch, 'alter') ?? 0
          if (Math.abs(alter) === 2) flags.push('double-accidental') // no glyph for it: spelled by the key instead
          const p = Math.round(12 * ((num(pitch, 'octave') ?? 4) + 1) + (STEP[kid(pitch, 'step')?.t.trim() ?? 'C'] ?? 0) + alter)
          const staff = num(e, 'staff') ?? 1
          const track = pi * 4 + staff - 1
          const ties = grace ? [] : kids(e, 'tie').map((t) => t.a.type)
          const key = `${track}:${p}`
          const held = open.get(key)
          const nots = kids(e, 'notations')
          const sl = nots.flatMap((x) => kids(x, 'slur')).map((x) => x.a.type)
          const vk = kid(e, 'voice')?.t.trim() ?? String(staff)
          slurs.set(vk, Math.max(0, (slurs.get(vk) ?? 0) + sl.filter((x) => x === 'start').length - sl.filter((x) => x === 'stop').length))
          const slur = !grace && slurs.get(vk)! > 0
          const arts = nots.flatMap((x) => kids(x, 'articulations')).flatMap((a) => a.c.map((x) => ART[x.n]))
          const art = ART_RANK.find((x) => arts.includes(x as Ev['art'])) as Ev['art']
          if (ties.includes('stop') && held) {
            held.dq += dur / div
            held.slur = slur || undefined
            if (!ties.includes('start')) open.delete(key)
            continue
          }
          const tm = kid(e, 'time-modification')
          const ev: Ev = {
            m,
            q: s / div,
            dq: dur / div,
            at: base + s / div,
            ...(!grace && art && { art }),
            ...(slur && { slur }),
            p,
            track,
            v: curV,
            h: staves >= 2 ? (staff === 1 ? 'R' : 'L') : undefined,
            ...(alter === 0 || alter === 1 || alter === -1 ? { acc: alter } : {}),
            ...(tm && { tuplet: { num: num(tm, 'actual-notes') ?? 3, den: num(tm, 'normal-notes') ?? 2 } }),
          }
          if (grace) {
            ev.gn = chord && run.length ? run[run.length - 1].gn : (run[run.length - 1]?.gn ?? 0) + 1
            run.push(ev)
          }
          evs.push(ev)
          if (ties.includes('start')) open.set(key, ev)
        } else if (e.n === 'direction') {
          const q = cur / div
          const told = kids(e, 'sound').some((s) => Number(s.a.tempo) > 0)
          for (const dt of kids(e, 'direction-type')) {
            for (const d of kids(dt, 'dynamics'))
              if (d.c[0] && d.c[0].n in DYN) {
                curV = DYN[d.c[0].n]
                marks.push({ at: base + q, v: curV })
                dynM.push({ m, q, text: d.c[0].n })
                marked = true
              }
            for (const w of kids(dt, 'wedge')) {
              const k = w.a.number ?? '1'
              if (w.a.type === 'crescendo' || w.a.type === 'diminuendo') wOpen.set(k, { a: base + q, b: 0, up: w.a.type === 'crescendo', m0: m, v0: curV })
              else if (w.a.type === 'stop' && wOpen.has(k)) {
                W.push({ ...wOpen.get(k)!, b: base + q })
                wOpen.delete(k)
                marked = true
              }
            }
            const mt = kid(dt, 'metronome')
            const pm = parseFloat(kid(mt, 'per-minute')?.t ?? '') // '132-144' reads as 132
            if (pm && !told) tempos.push({ pi, m, q, bpm: pm * (UNIT[kid(mt, 'beat-unit')?.t.trim() ?? ''] ?? 1) * (kid(mt, 'beat-unit-dot') ? 1.5 : 1) })
            for (const w of kids(dt, 'words')) {
              const h = HAIRPIN_WORD.exec(w.t)
              if (h) said.push({ a: base + q, b: 0, up: !!h[1], m0: m, v0: curV })
              if (TEMPO_RE.test(w.t) || TEMPO_I.test(w.t)) worded.push({ pi, m, q, text: w.t })
            }
          }
        } else if (e.n === 'backup') {
          cur -= num(e, 'duration') ?? 0
          land()
        } else if (e.n === 'forward') {
          cur += num(e, 'duration') ?? 0
          top = Math.max(top, cur)
          land()
        }
        for (const s of [e, ...kids(e, 'sound')]) {
          const bpm = Number(s.n === 'sound' ? s.a.tempo : NaN)
          if (bpm > 0) tempos.push({ pi, m, q: cur / div, bpm })
        }
      }
      land()
      put(Math.max(top, cur) / div)
      base += Math.max(top, cur) / div
    })
    // 'cresc.' and 'dim.' run to the next dynamic, else four bars, else the end of the part; a written hairpin or an earlier word already covers its own stretch
    said.forEach((w, i) => {
      const drawn = W.slice(wFrom).filter((x) => x.b > 0)
      if (drawn.some((x) => w.a >= x.a - 1e-6 && w.a <= x.b + 1e-6)) return
      const stops = [...marks.map((k) => k.at), ...drawn.map((x) => x.a), ...said.slice(i + 1).map((x) => x.a)].filter((at) => at > w.a + 1e-6)
      w.b = Math.min(starts[w.m0 + WORD_BARS] ?? base, ...stops)
      if (w.b > w.a + 1e-6) (W.push(w), (marked = true))
    })
    // hairpins: the level moves from the mark before to the mark at the end (or one step), note by note
    const mine = evs.slice(evFrom)
    for (let wi = wFrom; wi < W.length; wi++) {
      const w = W[wi]
      const end = marks.find((k) => k.at >= w.b - 1e-6 && k.at <= w.b + 4)
      const made = !end || end.v === w.v0 || end.v > w.v0 !== w.up
      const v1 = made ? Math.min(1, Math.max(0.1, w.v0 + (w.up ? WEDGE_STEP : -WEDGE_STEP))) : end.v
      const next = marks.find((k) => k.at > w.b + 1e-6)?.at ?? Infinity
      for (const ev of mine)
        if (ev.at >= w.a - 1e-6 && ev.at <= w.b + 1e-6) {
          ev.v = w.v0 + (v1 - w.v0) * (w.b > w.a ? (ev.at - w.a) / (w.b - w.a) : 1)
          if (!ev.gn && ev.at < w.b - 1e-6) ev.wg = wi // the note the hairpin lands on is not under it
        } else if (made && ev.at > w.b && ev.at < next) ev.v = v1 // no mark after: the new level holds until the next one
    }
  })

  // the same note written twice for one hand (a voice line doubled by the piano) is one note: keep the longer
  const first = new Map<string, Ev>()
  for (const ev of evs.splice(0)) {
    const k = `${ev.m}:${ev.q}:${ev.p}:${ev.h ?? ''}:${ev.gn ?? 0}`
    const had = first.get(k)
    if (!ev.h || !had) {
      if (ev.h) first.set(k, ev)
      evs.push(ev)
    } else {
      if (ev.dq > had.dq) had.dq = ev.dq
      if (ev.track >> 2 !== had.track >> 2) had.also = ev.track >> 2 // ponytail: a third part doubling it is not recorded
    }
  }

  // repeats: play the measures in order, so a repeated bar is a bar again in the song
  // numbers from the first part that has any, else tempo words; the key a measure is in, carried from the last one stated
  const firstPart = <T extends { pi: number }>(xs: T[]) => xs.filter((x) => x.pi === Math.min(...xs.map((y) => y.pi)))
  const sigAt = (m: number) => sig.slice(0, m + 1).findLast(Boolean)
  const wordBpm = firstPart(worded).flatMap((w) => {
    const s = sigAt(w.m)
    const bpm = tempoWord(w.text, !!s && s.den === 8 && s.n > 3 && s.n % 3 === 0)
    return bpm ? [{ ...w, bpm }] : TEMPO_I.test(w.text) ? [{ ...w, bpm: 0 }] : [] // 0: 'Tempo I', the first pace again
  })
  wordBpm.forEach((w) => (w.bpm ||= wordBpm.find((x) => x.bpm)?.bpm ?? 0))
  const estimated = !tempos.length && wordBpm.some((w) => w.bpm)
  const tempos1 = tempos.length ? firstPart(tempos) : wordBpm.filter((w) => w.bpm)
  tempos.length = 0
  tempos.push(...tempos1)
  if (!tempos.length) flags.push('no-tempo')
  else if (estimated) flags.push('tempo-estimated')
  let kc = keyM.find((k) => k !== undefined)
  const keyOf = Array.from({ length: kids(parts[0], 'measure').length }, (_, m) => (kc = keyM[m] ?? kc))
  for (let m = 1; m < keyOf.length; m++) sig[m] ??= sig[m - 1] // so a jump back lands in the right meter too

  const order = playOrder(parts, flags)
  if (order.some((o, i) => o !== i)) {
    const at = new Map<number, number[]>()
    order.forEach((o, k) => at.set(o, [...(at.get(o) ?? []), k]))
    const moved = evs.flatMap((ev) => (at.get(ev.m) ?? []).map((k) => ({ ...ev, m: k, wp: ev.wg === undefined ? undefined : k - ev.m + W[ev.wg].m0 })))
    evs.length = 0
    evs.push(...moved)
    const pick = <T,>(a: T[]) => order.map((o) => a[o])
    const q2 = pick(maxQ)
    const i2 = pick(implicit)
    const s2 = pick(sig)
    const k2 = pick(keyOf)
    maxQ.length = implicit.length = sig.length = keyOf.length = 0
    maxQ.push(...q2)
    implicit.push(...i2)
    sig.push(...s2)
    keyOf.push(...k2)
    const tmoved = tempos.flatMap((t) => (at.get(t.m) ?? []).map((k) => ({ ...t, m: k })))
    tempos.length = 0
    tempos.push(...tmoved)
    dynM.splice(0, Infinity, ...dynM.flatMap((d) => (at.get(d.m) ?? []).map((k) => ({ ...d, m: k }))))
  }
  const measures = Math.max(order.length, ...parts.slice(1).map((p) => kids(p, 'measure').length))
  let cs = { n: 4, den: 4 }
  const bars: Bar[] = []
  const mq: number[] = [0] // quarter position of each measure start
  const sigs: { n: number; den: number }[] = []
  for (let m = 0; m < measures; m++) {
    cs = sig[m] ?? cs
    sigs.push(cs)
    const nominal = (cs.n * 4) / cs.den
    const len = implicit[m] ? maxQ[m] || nominal : Math.max(maxQ[m] ?? 0, nominal)
    mq.push(mq[m] + len)
  }

  // quarter position -> seconds through the tempo map (first marking, else 100 bpm)
  const tm = tempos.map((t) => ({ q: mq[t.m] + t.q, bpm: t.bpm })).sort((a, b) => a.q - b.q)
  const map = tm.length && tm[0].q <= 1e-9 ? tm : [{ q: 0, bpm: tm[0]?.bpm ?? 100 }, ...tm]
  const secAt = (q: number) => {
    let s = 0
    for (let i = 0; i < map.length; i++) {
      const a = map[i].q
      const b = i + 1 < map.length ? map[i + 1].q : Infinity
      if (q <= a) break
      s += ((Math.min(q, b) - a) * 60) / map[i].bpm
      if (q <= b) break
    }
    return s
  }

  for (let m = 0; m < measures; m++) bars.push({ i: m, t0: secAt(mq[m]), t1: secAt(mq[m + 1]), n: sigs[m].n, den: sigs[m].den, ql: mq[m + 1] - mq[m] })

  const raw: Raw[] = evs.map((e) => {
    const t = secAt(mq[e.m] + e.q)
    const r: Raw = { t, d: Math.max(secAt(mq[e.m] + e.q + e.dq) - t, 0.03) * 0.96, p: e.p, v: e.v ?? 0.7, track: e.track, h: e.h, q: mq[e.m] + e.q, dq: e.dq, acc: e.acc, tuplet: e.tuplet, art: e.art, slur: e.slur }
    return e.gn ? { ...r, t: Math.max(0, t - e.gn * GRACE_S), d: GRACE_S * 0.9, dq: 0.125, grace: true, tuplet: undefined } : r
  })
  if (!raw.length) throw new Error('No notes found in this score.')
  // several parts (a voice and a piano, a duet's two players): each note keeps its part, so the app can play one for you
  const sounding = new Set(evs.map((e) => e.track >> 2))
  if (sounding.size >= 2) raw.forEach((r, i) => Object.assign(r, { part: evs[i].track >> 2 }, evs[i].also !== undefined && { also: evs[i].also }))
  const keys: { bar: number; fifths: number }[] = []
  keyOf.forEach((f, bar) => {
    if (f !== undefined && keys[keys.length - 1]?.fifths !== f) keys.push({ bar, fifths: f })
  })
  const song = build(id, title, raw, bars, keys[0]?.fifths ?? estimateFifths(raw))
  if (keys.length > 1) song.keys = keys
  if (flags.length) song.flags = [...new Set(flags)]
  if (sounding.size >= 2) {
    const names = new Map(kids(kid(root, 'part-list'), 'score-part').map((sp) => [sp.a.id, kid(sp, 'part-name')?.t.trim() ?? '']))
    song.parts = parts.map((pt, i) => names.get(pt.a.id) || `Part ${i + 1}`)
  }
  if (marked) {
    const sum = song.bars.map(() => [0, 0])
    for (const n of song.notes)
      if (!n.grace) {
        sum[n.bar][0] += n.v
        sum[n.bar][1]++
      }
    let last = 0.7
    song.curve = sum.map(([v, c]) => (last = c ? Math.round((v / c) * 100) / 100 : last))
    const ws = new Map<string, { t0: number; t1: number; up: boolean }>()
    evs.forEach((e, i) => {
      if (e.wg === undefined) return
      const k = `${e.wg}:${e.wp ?? W[e.wg].m0}`
      const w = ws.get(k) ?? { t0: raw[i].t, t1: raw[i].t, up: W[e.wg].up }
      ws.set(k, { ...w, t0: Math.min(w.t0, raw[i].t), t1: Math.max(w.t1, raw[i].t) })
    })
    if (ws.size) song.wedges = [...ws.values()].sort((a, b) => a.t0 - b.t0)
    // one letter a moment: a voice and the piano, or both staves, often write the same one (the first part's wins)
    const by = new Map<number, { t: number; text: string }>()
    for (const d of dynM) {
      const t = secAt(mq[d.m] + d.q)
      if (!by.has(Math.round(t * 100))) by.set(Math.round(t * 100), { t, text: d.text })
    }
    if (by.size) song.marks = [...by.values()].sort((a, b) => a.t - b.t)
  }
  return song
}
