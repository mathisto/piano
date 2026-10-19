import { deflateRawSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { fromMusicXml, parseXml, unzip, xmlText } from './musicxml'

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
    expect(s.notes.filter((n) => n.h === 'L').map((n) => n.p)).toEqual([43, 50])
    expect(s.notes.some((n) => n.p === 48)).toBe(false) // the grace note was skipped
    expect(s.notes.find((n) => n.p === 50)?.t).toBeCloseTo(1.5)
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
