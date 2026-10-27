// A small original MusicXML piece for the touch coach: staccato, a slur, a crescendo hairpin and accents. Test and dev support only.

const note = (step: string, oct: number, inner = '') => `<note><pitch><step>${step}</step><octave>${oct}</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type>${inner}</note>`
const dyn = (d: string) => `<direction placement="below"><direction-type><dynamics><${d}/></dynamics></direction-type></direction>`
const wedge = (type: string) => `<direction placement="below"><direction-type><wedge type="${type}"/></direction-type></direction>`
const art = (a: string) => `<notations><articulations><${a}/></articulations></notations>`
const slur = (type: string) => `<notations><slur type="${type}" number="1"/></notations>`
const bar = (n: number, body: string) => `<measure number="${n}">${body}</measure>`
const line = (names: string) => names.split(' ').map((x) => [x[0], Number(x[1])] as const)

/**
 * Ten bars of quarters at 120: bars 1-2 staccato (p), bars 3-4 under one slur, bars 5-8 a crescendo hairpin from p to the f
 * of bar 9, bars 9-10 with an accent on beats 1 and 3.
 */
export function touchPiece(): string {
  const stac = line('C4 D4 E4 F4 G4 F4 E4 D4').map(([s, o]) => note(s, o, art('staccato')))
  const sl = line('C4 D4 E4 F4 G4 A4 G4 F4').map(([s, o], i) => note(s, o, i === 0 ? slur('start') : i === 7 ? slur('stop') : ''))
  const cr = line('C4 D4 E4 F4 G4 A4 B4 C5 D5 C5 B4 A4 G4 F4 E4 D4').map(([s, o]) => note(s, o))
  const ac = line('C5 B4 A4 G4 A4 B4 C5 G4').map(([s, o], i) => note(s, o, i % 2 ? '' : art('accent')))
  const head = '<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>120</per-minute></metronome></direction-type><sound tempo="120"/></direction>'
  const bars = [
    bar(1, head + dyn('p') + stac.slice(0, 4).join('')),
    bar(2, stac.slice(4).join('')),
    bar(3, sl.slice(0, 4).join('')),
    bar(4, sl.slice(4).join('')),
    bar(5, wedge('crescendo') + cr.slice(0, 4).join('')),
    bar(6, cr.slice(4, 8).join('')),
    bar(7, cr.slice(8, 12).join('')),
    bar(8, cr.slice(12).join('') + wedge('stop')),
    bar(9, dyn('f') + ac.slice(0, 4).join('')),
    bar(10, ac.slice(4).join('')),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${bars.join('')}</part></score-partwise>`
}
