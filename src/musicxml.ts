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
  m: number
  q: number // quarter notes from the start of its measure
  dq: number
  p: number
  track: number
  h?: Hand
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
  const tempos: { m: number; q: number; bpm: number }[] = []
  let fifths: number | undefined

  parts.forEach((part, pi) => {
    let div = 1
    let staves = 1
    const open = new Map<string, Ev>() // tied notes still sounding, across barlines
    kids(part, 'measure').forEach((meas, m) => {
      for (const a of kids(meas, 'attributes')) {
        div = num(a, 'divisions') ?? div
        staves = num(a, 'staves') ?? staves
        const k = kid(a, 'key')
        if (k && fifths === undefined) fifths = num(k, 'fifths')
        const t = kid(a, 'time')
        if (t && pi === 0) sig[m] = { n: num(t, 'beats') ?? 4, den: num(t, 'beat-type') ?? 4 }
      }
      if (pi === 0) implicit[m] = meas.a.implicit === 'yes'
      let cur = 0 // divisions into the measure
      let start = 0 // where the last note began, for chords
      let top = 0
      const put = (q: number) => (maxQ[m] = Math.max(maxQ[m] ?? 0, q))
      for (const e of meas.c) {
        if (e.n === 'note') {
          if (kid(e, 'grace')) continue
          const dur = num(e, 'duration') ?? 0
          const chord = !!kid(e, 'chord')
          const s = chord ? start : cur
          if (!chord) {
            start = cur
            cur += dur
          }
          top = Math.max(top, s + dur)
          const pitch = kid(e, 'pitch')
          if (!pitch) continue // rests and unpitched percussion
          const p = 12 * ((num(pitch, 'octave') ?? 4) + 1) + (STEP[kid(pitch, 'step')?.t.trim() ?? 'C'] ?? 0) + (num(pitch, 'alter') ?? 0)
          const staff = num(e, 'staff') ?? 1
          const track = pi * 4 + staff - 1
          const ties = kids(e, 'tie').map((t) => t.a.type)
          const key = `${track}:${p}`
          const held = open.get(key)
          if (ties.includes('stop') && held) {
            held.dq += dur / div
            if (!ties.includes('start')) open.delete(key)
            continue
          }
          const ev: Ev = { m, q: s / div, dq: dur / div, p, track, h: staves >= 2 ? (staff === 1 ? 'R' : 'L') : undefined }
          evs.push(ev)
          if (ties.includes('start')) open.set(key, ev)
        } else if (e.n === 'backup') cur -= num(e, 'duration') ?? 0
        else if (e.n === 'forward') {
          cur += num(e, 'duration') ?? 0
          top = Math.max(top, cur)
        }
        for (const s of [e, ...kids(e, 'sound')]) {
          const bpm = Number(s.n === 'sound' ? s.a.tempo : NaN)
          if (bpm > 0 && pi === 0) tempos.push({ m, q: cur / div, bpm })
        }
      }
      put(Math.max(top, cur) / div)
    })
  })

  const measures = Math.max(...parts.map((p) => kids(p, 'measure').length))
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
    return { t, d: Math.max(secAt(mq[e.m] + e.q + e.dq) - t, 0.03) * 0.96, p: e.p, v: 0.7, track: e.track, h: e.h, q: mq[e.m] + e.q, dq: e.dq }
  })
  if (!raw.length) throw new Error('No notes found in this score.')
  return build(id, title, raw, bars, fifths ?? estimateFifths(raw))
}
