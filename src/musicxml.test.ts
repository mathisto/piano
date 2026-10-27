import { deflateRawSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { scoreFlags } from './flags'
import { figure } from './layout'
import { fromMusicXml, parseXml, unzip, xmlText } from './musicxml'
import { spell } from './spell'
import { touchPiece } from './score-fixtures'

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
<part id="P1">
 <measure number="1">
  <attributes><divisions>2</divisions><key><fifths>1</fifths></key><time><beats>3</beats><beat-type>4</beat-type></time><staves>2</staves></attributes>
  <direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>120</per-minute></metronome></direction-type><sound tempo="120"/></direction>
  <note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><tie type="start"/><staff>1</staff></note>
  <note><chord/><pitch><step>B</step><octave>4</octave></pitch><duration>4</duration><staff>1</staff></note>
  <note><pitch><step>A</step><octave>4</octave></pitch><duration>2</duration><staff>1</staff></note>
  <backup><duration>6</duration></backup>
  <note><pitch><step>G</step><octave>2</octave></pitch><duration>6</duration><staff>2</staff></note>
 </measure>
 <measure number="2">
  <note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><tie type="stop"/><staff>1</staff></note>
  <note><pitch><step>F</step><alter>1</alter><octave>4</octave></pitch><duration>2</duration><staff>1</staff></note>
  <note><rest/><duration>2</duration><staff>1</staff></note>
  <backup><duration>6</duration></backup>
  <note><grace/><pitch><step>C</step><octave>3</octave></pitch><staff>2</staff></note>
  <note><pitch><step>D</step><octave>3</octave></pitch><duration>6</duration><staff>2</staff></note>
 </measure>
</part></score-partwise>`

describe('musicxml', () => {
  it('reads elements, attributes and entities', () => {
    const e = parseXml('<?xml version="1.0"?><a x="1 &amp; 2"><b>t&lt;</b><c/><!-- no --></a>')
    expect(e.n).toBe('a')
    expect(e.a.x).toBe('1 & 2')
    expect(e.c[0].t).toBe('t<')
    expect(e.c).toHaveLength(2)
  })

  it('builds a two-staff song: hands, chords, ties, rests, grace notes, tempo, key', () => {
    const s = fromMusicXml(XML, 'x', 'id')
    expect(s.fifths).toBe(1)
    expect(s.bars).toHaveLength(2)
    expect(s.bars[0]).toMatchObject({ n: 3, den: 4 })
    expect(s.bars[0].t1).toBeCloseTo(1.5) // 3 quarters at 120 bpm
    expect(s.bars[1].t0).toBeCloseTo(1.5)
    const g4 = s.notes.filter((n) => n.p === 67)
    expect(g4).toHaveLength(1) // the tie merged two notes into one
    expect(g4[0].t).toBe(0)
    expect(g4[0].d).toBeCloseTo(1.5 * 0.96, 1) // a dotted half: 2 + 1 quarters
    expect(s.notes.find((n) => n.p === 71)?.t).toBe(0) // chord note shares the onset
    expect(s.notes.find((n) => n.p === 66)).toMatchObject({ h: 'R', bar: 1 }) // F sharp
    expect(s.notes.filter((n) => n.h === 'L').map((n) => n.p)).toEqual([43, 48, 50])
    expect(s.notes.find((n) => n.p === 48)).toMatchObject({ grace: true, bar: 1, qb: 0 }) // the grace note leads into the D
    expect(s.notes.find((n) => n.p === 48)!.t).toBeLessThan(1.5)
    expect(s.notes.find((n) => n.p === 50)?.t).toBeCloseTo(1.5)
    expect(s.notes.find((n) => n.p === 66)?.acc).toBe(1) // written F sharp
  })

  it('follows a tempo change', () => {
    const x = XML.replace('<note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><tie type="stop"/>', '<direction><sound tempo="60"/></direction><note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><tie type="stop"/>')
    const s = fromMusicXml(x, 'x', 'id')
    expect(s.bars[1].t1 - s.bars[1].t0).toBeCloseTo(3) // 3 quarters at 60 bpm
  })

  it('rejects things that are not scores', () => {
    expect(() => fromMusicXml('<html/>', 'x', 'id')).toThrow(/not a MusicXML/)
    expect(() => fromMusicXml('<score-partwise><part id="P1"><measure number="1"/></part></score-partwise>', 'x', 'id')).toThrow(/No notes/)
  })

  it('reads a compressed .mxl through its container file', async () => {
    const zip = makeZip({
      'META-INF/container.xml': '<container><rootfiles><rootfile full-path="score/a.xml"/></rootfiles></container>',
      'score/a.xml': XML,
    })
    expect((await unzip(zip)).has('score/a.xml')).toBe(true)
    expect(await xmlText(zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer)).toBe(XML)
    expect(await xmlText(new TextEncoder().encode(XML).buffer as ArrayBuffer)).toBe(XML)
  })
})

/** A just-enough zip writer for the test: deflated entries, one central directory. */
function makeZip(files: Record<string, string>): Uint8Array {
  const parts: Uint8Array[] = []
  const central: Uint8Array[] = []
  let off = 0
  for (const [name, text] of Object.entries(files)) {
    const nb = new TextEncoder().encode(name)
    const raw = new TextEncoder().encode(text)
    const def = deflateRawSync(raw)
    const lh = new DataView(new ArrayBuffer(30))
    lh.setUint32(0, 0x04034b50, true)
    lh.setUint16(8, 8, true)
    lh.setUint32(18, def.length, true)
    lh.setUint32(22, raw.length, true)
    lh.setUint16(26, nb.length, true)
    const local = cat(new Uint8Array(lh.buffer), nb, def)
    const ch = new DataView(new ArrayBuffer(46))
    ch.setUint32(0, 0x02014b50, true)
    ch.setUint16(10, 8, true)
    ch.setUint32(20, def.length, true)
    ch.setUint32(24, raw.length, true)
    ch.setUint16(28, nb.length, true)
    ch.setUint32(42, off, true)
    central.push(cat(new Uint8Array(ch.buffer), nb))
    parts.push(local)
    off += local.length
  }
  const cd = cat(...central)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true)
  end.setUint16(10, central.length, true)
  end.setUint32(12, cd.length, true)
  end.setUint32(16, off, true)
  return cat(...parts, cd, new Uint8Array(end.buffer))
}

function cat(...xs: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(xs.reduce((a, x) => a + x.length, 0))
  let o = 0
  for (const x of xs) {
    out.set(x, o)
    o += x.length
  }
  return out
}

describe('musicxml repeats and dynamics', () => {
  const wrap = (measures: string) => `<?xml version="1.0"?><score-partwise><part-list><score-part id="P1"/></part-list><part id="P1">${measures}</part></score-partwise>`
  const head = '<attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes><direction><direction-type><metronome><per-minute>60</per-minute></metronome></direction-type><sound tempo="60"/></direction>'
  const m = (n: number, step: string, o: { first?: boolean; left?: string; right?: string } = {}) =>
    `<measure number="${n}">${o.first ? head : ''}${o.left ? `<barline location="left">${o.left}</barline>` : ''}<note><pitch><step>${step}</step><octave>4</octave></pitch><duration>4</duration></note>${o.right ? `<barline location="right">${o.right}</barline>` : ''}</measure>`
  const FWD = '<repeat direction="forward"/>'
  const BACK = '<repeat direction="backward"/>'

  it('plays a repeated section twice', () => {
    const s = fromMusicXml(wrap(m(1, 'C', { first: true, left: FWD }) + m(2, 'D', { right: BACK }) + m(3, 'E')), 't', 'id')
    expect(s.notes.map((n) => n.p)).toEqual([60, 62, 60, 62, 64])
    expect(s.bars).toHaveLength(5)
    expect(s.notes.map((n) => n.t)).toEqual([0, 4, 8, 12, 16])
  })

  it('goes back to the start for a backward repeat with no forward sign', () => {
    const s = fromMusicXml(wrap(m(1, 'C', { first: true }) + m(2, 'D', { right: BACK }) + m(3, 'E')), 't', 'id')
    expect(s.notes.map((n) => n.p)).toEqual([60, 62, 60, 62, 64])
  })

  it('a first and second ending are each played on their own pass', () => {
    const x = wrap(
      m(1, 'C', { first: true }) +
        m(2, 'D', { left: '<ending number="1" type="start"/>', right: `<ending number="1" type="stop"/>${BACK}` }) +
        m(3, 'E', { left: '<ending number="2" type="start"/>', right: '<ending number="2" type="stop"/>' }) +
        m(4, 'F'),
    )
    expect(fromMusicXml(x, 't', 'id').notes.map((n) => n.p)).toEqual([60, 62, 60, 64, 65])
  })

  it('reads dynamics marks into note velocity', () => {
    const x = wrap(
      '<measure number="1"><attributes><divisions>1</divisions></attributes><direction><direction-type><dynamics><p/></dynamics></direction-type></direction><note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note><direction><direction-type><dynamics><ff/></dynamics></direction-type></direction><note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration></note></measure>',
    )
    const [a, b] = fromMusicXml(x, 't', 'id').notes
    expect(a.v).toBeLessThan(0.4)
    expect(b.v).toBeGreaterThan(0.85)
  })
})

describe('musicxml jumps, keys, spelling, tuplets, cues and tempo', () => {
  const wrap = (ms: string) => `<?xml version="1.0"?><score-partwise><part-list><score-part id="P1"/></part-list><part id="P1">${ms}</part></score-partwise>`
  const head = (div = 1, beats = 4, type = 4) => `<attributes><divisions>${div}</divisions><time><beats>${beats}</beats><beat-type>${type}</beat-type></time></attributes>`
  const note = (step: string, dur = 4, inner = '') => `<note><pitch><step>${step}</step><octave>4</octave></pitch><duration>${dur}</duration>${inner}</note>`
  const words = (w: string, sound = '') => `<direction><direction-type><words>${w}</words></direction-type>${sound ? `<sound ${sound}/>` : ''}</direction>`
  const sign = (s: 'segno' | 'coda') => `<direction><direction-type><${s}/></direction-type></direction>`
  const meas = (...body: string[]) => body.map((b, i) => `<measure number="${i + 1}">${i ? '' : head()}${b}</measure>`).join('')
  const read = (x: string) => fromMusicXml(wrap(x), 't', 'id')
  const ps = (x: string) => read(x).notes.map((n) => n.p)

  it('plays D.C. al Fine from the sound attributes', () => {
    const s = read(meas(note('C'), note('D') + words('Fine', 'fine="yes"'), note('E'), note('F') + words('D.C. al Fine', 'dacapo="yes"')))
    expect(s.notes.map((n) => n.p)).toEqual([60, 62, 64, 65, 60, 62])
    expect(scoreFlags(s)).toContain('dc-ds')
    expect(scoreFlags(s)).not.toContain('repeats-unexpanded')
  })

  it('plays D.S. al Coda from words and bare signs alone', () => {
    expect(ps(meas(note('C'), sign('segno') + note('D'), note('E') + sign('coda'), note('F') + words('D.S. al Coda'), sign('coda') + note('G')))).toEqual([60, 62, 64, 65, 62, 64, 67])
  })

  it('skips repeats and takes the last ending on the way back', () => {
    const x = meas(
      '<barline location="left"><repeat direction="forward"/></barline>' + note('C'),
      '<barline location="left"><ending number="1" type="start"/></barline>' + note('D') + '<barline location="right"><ending number="1" type="stop"/><repeat direction="backward"/></barline>',
      '<barline location="left"><ending number="2" type="start"/></barline>' + note('E') + '<barline location="right"><ending number="2" type="stop"/></barline>',
      note('F') + words('D.C.', 'dacapo="yes"'),
    )
    expect(ps(x)).toEqual([60, 62, 60, 64, 65, 60, 64, 65])
  })

  it('leaves a jump it cannot place unexpanded and says so', () => {
    const s = read(meas(note('C'), note('D'), note('E') + words('D.S. al Fine')))
    expect(s.notes.map((n) => n.p)).toEqual([60, 62, 64])
    expect(scoreFlags(s)).toEqual(expect.arrayContaining(['dc-ds', 'repeats-unexpanded']))
  })

  it('ends a strophic repeat at its Fine on the last pass', () => {
    expect(ps(meas(note('C'), note('D') + words('Fine.'), note('E') + '<barline location="right"><repeat direction="backward"/></barline>'))).toEqual([60, 62, 64, 60, 62])
  })

  it('reads key changes per measure, through a repeat', () => {
    const k = (f: number) => `<attributes><key><fifths>${f}</fifths></key></attributes>`
    const s = read(meas(k(0) + note('C'), k(-3) + note('E') + '<barline location="right"><repeat direction="backward"/></barline>', k(2) + note('D')))
    expect(s.fifths).toBe(0)
    expect(s.keys).toEqual([{ bar: 0, fifths: 0 }, { bar: 1, fifths: -3 }, { bar: 2, fifths: 0 }, { bar: 3, fifths: -3 }, { bar: 4, fifths: 2 }])
    expect(scoreFlags(s)).toContain('key-changes')
  })

  it('keeps the written spelling: E sharp, F natural in F sharp major; a double sharp is spelled by the key and flagged', () => {
    const p = (step: string, alter: number) => `<note><pitch><step>${step}</step><alter>${alter}</alter><octave>4</octave></pitch><duration>1</duration></note>`
    const s = read(meas('<attributes><key><fifths>6</fifths></key></attributes>' + p('E', 1) + p('F', 0) + p('F', 2) + p('D', -1)))
    const [eis, f, fisis, des] = s.notes
    expect([eis.p, f.p, fisis.p, des.p]).toEqual([65, 65, 67, 61])
    expect(spell(eis.p, 6, eis.acc)).toMatchObject({ letter: 2, acc: 1, oct: 4 }) // E sharp, not F
    expect(spell(f.p, 6, f.acc)).toMatchObject({ letter: 3, acc: 0 }) // F natural, not E sharp
    expect(spell(des.p, 6, des.acc)).toMatchObject({ letter: 1, acc: -1 }) // D flat, not C sharp
    expect(fisis.acc).toBeUndefined()
    expect(scoreFlags(s)).toContain('double-accidental')
  })

  it('takes tuplet ratios from the score: a quintuplet, and a duplet in 6/8', () => {
    const tm = (a: number, n: number) => `<time-modification><actual-notes>${a}</actual-notes><normal-notes>${n}</normal-notes></time-modification>`
    const quint = read(`<measure number="1">${head(20)}${Array.from({ length: 5 }, () => note('C', 4, tm(5, 4))).join('')}${note('D', 60)}</measure>`)
    const five = quint.notes.filter((n) => n.p === 60)
    expect(five.map((n) => n.qb)).toEqual([0, 0.2, 0.4, 0.6, 0.8])
    expect(five.every((n) => n.tuplet?.num === 5 && n.tuplet.den === 4 && Math.abs(n.qd! - 0.2) < 1e-9)).toBe(true)
    expect(scoreFlags(quint)).toContain('irregular-tuplet')
    const duo = read(`<measure number="1">${head(4, 6, 8)}${note('C', 3, tm(2, 3))}${note('D', 3, tm(2, 3))}${note('E', 6)}</measure>`)
    expect(duo.notes.slice(0, 2).map((n) => [n.qb, n.qd, n.tuplet])).toEqual([[0, 0.75, { num: 2, den: 3 }], [0.75, 0.75, { num: 2, den: 3 }]])
    expect(figure(0.75, '2:3')).toEqual(figure(0.5)) // written as eighths under a 2
  })

  it('skips cue notes but keeps their time', () => {
    const s = read(meas('<note><cue/><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration></note>' + note('D', 2)))
    expect(s.notes.map((n) => [n.p, n.qb])).toEqual([[62, 2]])
  })

  it('takes the tempo from a metronome mark, then a tempo word, else 100 and a flag', () => {
    const metro = `<direction><direction-type><metronome><beat-unit>half</beat-unit><per-minute>60</per-minute></metronome></direction-type></direction>`
    expect(read(meas(metro + note('C'))).bars[0].t1).toBeCloseTo(2) // 120 quarters a minute
    expect(read(meas(words('Andante con moto') + note('C'))).bars[0].t1).toBeCloseTo((4 * 60) / 84)
    expect(read(meas(words('Mässig') + note('C'))).bars[0].t1).toBeCloseTo((4 * 60) / 96)
    const none = read(meas(note('C')))
    expect(none.bars[0].t1).toBeCloseTo(2.4)
    expect(scoreFlags(none)).toEqual(['no-tempo'])
  })
})

describe('musicxml articulation and hairpins', () => {
  const s = fromMusicXml(touchPiece(), 'Touch', 'id')
  it('reads staccato, accents and slurs onto the notes', () => {
    expect(s.notes.slice(0, 8).every((n) => n.art === 'stac')).toBe(true)
    expect(s.notes.slice(8, 16).map((n) => !!n.slur)).toEqual([true, true, true, true, true, true, true, false]) // the slur's last note is not joined on
    expect(s.notes.slice(32).map((n) => n.art ?? '')).toEqual(['acc', '', 'acc', '', 'acc', '', 'acc', ''])
    expect(s.notes.slice(16, 32).some((n) => n.art || n.slur)).toBe(false)
  })
  it('a crescendo hairpin moves the level from p to the f at its end, note by note', () => {
    const v = s.notes.slice(16, 33).map((n) => n.v)
    expect(v[0]).toBeCloseTo(0.35)
    expect(v[16]).toBeCloseTo(0.78)
    for (let i = 1; i < v.length; i++) expect(v[i]).toBeGreaterThan(v[i - 1])
    expect(s.wedges).toEqual([{ t0: 8, t1: 15.5, up: true }])
    expect(s.curve![0]).toBeCloseTo(0.35)
    expect(s.curve![9]).toBeCloseTo(0.78)
    expect(s.curve![6]).toBeGreaterThan(s.curve![5])
  })
  it('a hairpin with no mark after it moves one step and holds', () => {
    const x = touchPiece().replace('<dynamics><f/></dynamics>', '<words>x</words>')
    const n = fromMusicXml(x, 't', 'id').notes
    expect(n[32].v).toBeCloseTo(0.5)
    expect(n[39].v).toBeCloseTo(0.5)
  })
  it('a repeated hairpin is two hairpins, and a repeated letter is written again', () => {
    const x = touchPiece().replace('<measure number="8">', '<measure number="8"><barline location="left"><repeat direction="forward"/></barline>').replace('</measure><measure number="9">', '<barline location="right"><repeat direction="backward"/></barline></measure><measure number="9">').replace('<measure number="8">', '<measure number="8"><direction><direction-type><dynamics><mf/></dynamics></direction-type></direction>')
    const r = fromMusicXml(x, 't', 'id')
    expect(r.wedges).toHaveLength(2)
    expect(r.marks?.map((m) => m.text)).toEqual(['p', 'mf', 'mf', 'f'])
  })
  it('keeps where the dynamic letters are written', () => {
    expect(s.marks).toEqual([{ t: 0, text: 'p' }, { t: 16, text: 'f' }])
  })
  it('no marks, no curve', () => {
    expect(fromMusicXml(XML, 't', 'id').curve).toBeUndefined()
    expect(fromMusicXml(XML, 't', 'id').marks).toBeUndefined()
  })
})
