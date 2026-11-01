// The words under a run's results: the timing line, legato or staccato, voicing, and the card's coach lines. Loaded with the results card, not at boot.
import { LEGATO_BLUR, LEGATO_GAP, ON_BEAT, type Artic, type Timing, type Voicing } from './coach'
import { settings } from './settings'

export function timingLine(x: Timing) {
  const b = Math.round(Math.abs(x.bias))
  const lean = Math.abs(x.bias) < ON_BEAT ? 'on the beat on average' : `on average <b>${b} ms</b> ${x.bias > 0 ? 'late' : 'early'}`
  return `Timing: ${lean}; spread <b>±${Math.round(x.spread)} ms</b>.`
}

function articLine(a: Artic) {
  if (a.kind === 'staccato') return `Staccato: <b>${a.ok} of ${a.n}</b> notes short; you hold about <b>${Math.round(a.typical * 100)}%</b> of each note's value.`
  const t = Math.round(Math.abs(a.typical))
  const how = a.typical < -LEGATO_GAP ? `you lift about <b>${t} ms</b> before the next note` : a.typical > LEGATO_BLUR ? `keys overlap by about <b>${t} ms</b>, which blurs` : `keys overlap by about <b>${Math.max(0, Math.round(a.typical))} ms</b>`
  return `Legato: <b>${a.ok} of ${a.n}</b> joins smooth; ${how}.`
}

export function voiceLine(x: Voicing) {
  const g = Math.round(Math.abs(x.gap))
  const [m, o] = x.melody === 'R' ? ['right', 'left'] : ['left', 'right']
  const said = g < 1 ? 'the hands came out level' : x.gap > 0 ? `the melody (${m} hand) ran <b>${g}</b> louder than the ${o}` : `the ${o} hand ran <b>${g}</b> louder than the melody (${m} hand)`
  return `Voicing: ${said}; aim for the melody at least <b>${x.aim}</b> louder.`
}

/** The extra results lines. Timing is the card's own Time line. */
export function coachLines(r: { timing: Timing | null; artic: Artic | null; voice: Voicing | null; fixed?: number; mode: string; follow?: string[]; pedal?: string | null }, test: boolean) {
  const out: string[] = [...(r.follow ?? [])]
  if (r.pedal) out.push(r.pedal)
  if (test) out.push('A test run: no touch marks while you played.')
  if (r.artic) out.push(articLine(r.artic))
  if (r.voice && r.fixed === undefined) out.push(voiceLine(r.voice)) // every note equally loud: no voicing to speak of
  if (r.fixed !== undefined)
    out.push(settings.keyTouch === 'Fixed' ? `Key touch is Fixed: every note came in at ${r.fixed}, so evenness cannot be measured.` : `Every note came in equally loud (${r.fixed}). If your keyboard's key touch is set to Fixed, evenness cannot be measured.`)
  return out.length ? `<div class="coachlines">${out.map((l) => `<p>${l}</p>`).join('')}</div>` : ''
}
