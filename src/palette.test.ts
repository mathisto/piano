import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { C } from './palette'

// The tokens come from style.css :root, so a changed CSS value that palette.ts does not follow (or the reverse) fails too.
// A token that differs by mode is light-dark(Matinée, Nocturne); T reads either side, and the one value of a token that does not differ.
const root = readFileSync(new URL('./style.css', import.meta.url), 'utf8').match(/:root \{([\s\S]*?)\n\}/)![1]
type Mode = 'dark' | 'light'
const T = (n: string, mode: Mode = 'dark') => {
  const m = root.match(new RegExp(`--${n}:\\s*(?:light-dark\\(\\s*(#[0-9a-fA-F]{6})\\s*,\\s*(#[0-9a-fA-F]{6})\\s*\\)|(#[0-9a-fA-F]{6}))`))!
  return (m[mode === 'light' ? 1 : 2] ?? m[3]).toLowerCase()
}
const num = (hex: string) => parseInt(hex.slice(1), 16)

const hex = (c: number) => '#' + c.toString(16).padStart(6, '0')
/** fg at alpha a over bg (#rrggbb) */
const over = (fg: number, a: number, bg: string) => hex([16, 8, 0].reduce((n, s) => n | (Math.round(((fg >> s) & 255) * a + ((num(bg) >> s) & 255) * (1 - a)) << s), 0))

const lum = (hex: string) => {
  const [r, g, b] = [16, 8, 0].map((s) => (num(hex) >> s) & 255).map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('palette mirrors the CSS tokens', () => {
  const pairs: [keyof typeof C, string][] = [
    ['ground', 'ground'], ['ink', 'ink'], ['R', 'R'], ['L', 'L'], ['LEdge', 'L-edge'], ['perfect', 'perfect'],
    ['great', 'great'], ['good', 'good'], ['bad', 'bad'], ['missOnKey', 'paper-miss'], ['lamp', 'lamp'],
  ]
  it.each(pairs)('C.%s = --%s (Nocturne)', (k, css) => expect(C[k]).toBe(num(T(css))))
})

describe('Nocturne contrast (text 4.5:1, graphics 3:1)', () => {
  const text = 4.5
  const graphic = 3
  const cases: [string, string, string, number][] = [
    ['ink', 'ink', 'panel', text], ['ink', 'ink', 'panel-2', text],
    ['ink-2', 'ink-2', 'panel', text], ['ink-2', 'ink-2', 'panel-2', text],
    ['ink-3', 'ink-3', 'panel', text], ['ink-3', 'ink-3', 'panel-2', text],
    ['lamp-ink', 'lamp-ink', 'lamp', text],
    ['lamp-ink', 'lamp-ink', 'lamp-hi', text],
    ['accent', 'accent', 'panel', text],
    ['edge', 'edge', 'panel', graphic], ['edge', 'edge', 'panel-2', graphic], ['edge', 'edge', 'panel-3', graphic], // Settings' groups are panel-3
    ['perfect', 'perfect', 'panel', text], ['great', 'great', 'panel', text], ['good', 'good', 'panel', text], ['bad', 'bad', 'panel', text],
    ['R', 'R', 'panel', text], ['L', 'L', 'panel', text], ['L-edge', 'L-edge', 'panel', text],
    ['paper-ink', 'paper-ink', 'paper', text], ['paper-line', 'paper-line', 'paper', graphic], ['paper-played', 'paper-played', 'paper', graphic],
    ['paper-cursor', 'paper-cursor', 'paper', graphic], ['paper-awaited', 'paper-awaited', 'paper', text],
    ['paper-perfect', 'paper-perfect', 'paper', text], ['paper-great', 'paper-great', 'paper', graphic], ['paper-good', 'paper-good', 'paper', text],
    ['paper-miss', 'paper-miss', 'paper', text],
  ]
  it.each(cases)('%s on %s', (_n, fg, bg, min) => expect(ratio(T(fg), T(bg))).toBeGreaterThanOrEqual(min))

  // the highway: both hands and every judgement read on both lanes; ground-ink on a hand's note body (the key name on a note)
  const lanes = [C.laneA, C.laneB].map((c) => '#' + c.toString(16).padStart(6, '0'))
  it.each(lanes)('hands and judgements on lane %s', (lane) => {
    for (const c of [C.R, C.L, C.perfect, C.great, C.good, C.bad, C.lamp]) expect(ratio(hex(c), lane)).toBeGreaterThanOrEqual(graphic)
  })
  it('ground on the right-hand note, ink on the left-hand note', () => {
    expect(ratio(hex(C.ground), hex(C.R))).toBeGreaterThanOrEqual(text)
    for (const lane of lanes) expect(ratio(hex(C.ink), over(C.L, 0.6, lane))).toBeGreaterThanOrEqual(text) // the left body is the hue at 60% over the lane
  })
  it('the keys: ivory against ebony, the wrong-key cross on ivory', () => {
    expect(ratio(hex(C.keyWhite), hex(C.keyBlack))).toBeGreaterThanOrEqual(text)
    expect(ratio(hex(C.missOnKey), hex(C.keyWhite))).toBeGreaterThanOrEqual(text)
    expect(ratio(hex(C.bad), hex(C.keyBlack))).toBeGreaterThanOrEqual(graphic)
  })
  it('late is Good at 60%: still text-legible on the panel', () => expect(ratio(over(num(T('good')), 0.6, T('panel')), T('panel'))).toBeGreaterThanOrEqual(text))
  it('the key names: muted on ivory', () => expect(ratio(hex(C.muted), hex(C.keyWhite))).toBeGreaterThanOrEqual(text))
})

// Matinée: the same tokens, light side. The judgement hues, the hands and the lamp line are marks (3:1), not words: the words beside them are Ink.
describe('Matinée contrast (text 4.5:1, graphics 3:1)', () => {
  const text = 4.5
  const graphic = 3
  const L = (n: string) => T(n, 'light')
  const surfaces = ['ground', 'panel', 'panel-2', 'panel-3']
  const on = (fg: string, min: number, bgs = surfaces) => bgs.map((bg): [string, string, number] => [fg, bg, min])
  const cases = [
    ...on('ink', text), ...on('ink-2', text), ...on('ink-3', text), ...on('accent', text),
    ...on('good', text), ...on('bad', text), ...on('perfect', text, ['ground', 'panel', 'panel-3']),
    ...on('perfect', graphic), ...on('great', graphic), ...on('R', graphic), ...on('L', graphic), ...on('L-edge', graphic),
    ...on('edge', graphic), ...on('paper-cursor', graphic), // --lamp-line is paper-cursor here
    ['lamp-ink', 'lamp', text], ['lamp-ink', 'lamp-hi', text],
  ] as [string, string, number][]
  it.each(cases)('%s on %s (%d:1)', (fg, bg, min) => expect(ratio(L(fg), L(bg))).toBeGreaterThanOrEqual(min))

  const paper = L('paper')
  const paperCases: [string, number][] = [
    ['paper-ink', text], ['paper-line', graphic], ['paper-played', graphic], ['paper-cursor', graphic], ['paper-awaited', text],
    ['paper-perfect', text], ['paper-great', graphic], ['paper-good', text], ['paper-miss', text],
  ]
  it.each(paperCases)('%s on the Matinée paper', (fg, min) => expect(ratio(L(fg), paper)).toBeGreaterThanOrEqual(min))
  // #staff derives its aids and words from the ink: Ink Soft 72%, Ink Faint 60% (aids are text)
  it.each([72, 60])('the staff ink at %d%% on the Matinée paper', (pct) => expect(ratio(over(num(L('paper-ink')), pct / 100, paper), paper)).toBeGreaterThanOrEqual(text))

  // late is Good faded: a glyph that must still read on every surface
  const pct = Number(root.match(/--late:\s*light-dark\(color-mix\(in srgb, var\(--good\) (\d+)%/)![1])
  it.each(surfaces)('late (Good at %d%%) on %s', (bg) => expect(ratio(over(num(L('good')), pct / 100, L(bg)), L(bg))).toBeGreaterThanOrEqual(graphic))

  it('the paper in Matinée is #fbf8f1', () => expect(paper).toBe('#fbf8f1'))
  it('the highway ground behind the canvas is C.ground', () => expect(num(T('night'))).toBe(C.ground))
})
