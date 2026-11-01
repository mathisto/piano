import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { C } from './palette'

// The tokens come from style.css :root, so a changed CSS value that palette.ts does not follow (or the reverse) fails too.
const root = readFileSync(new URL('./style.css', import.meta.url), 'utf8').match(/:root \{([\s\S]*?)\n\}/)![1]
const T = (n: string) => root.match(new RegExp(`--${n}:\\s*(#[0-9a-fA-F]{6})`))![1].toLowerCase()
const num = (hex: string) => parseInt(hex.slice(1), 16)

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
  it.each(pairs)('C.%s = --%s', (k, css) => expect(C[k]).toBe(num(T(css))))
})

describe('contrast (text 4.5:1, graphics 3:1)', () => {
  const text = 4.5
  const graphic = 3
  const cases: [string, string, string, number][] = [
    ['ink', 'ink', 'panel', text], ['ink', 'ink', 'panel-2', text],
    ['ink-2', 'ink-2', 'panel', text], ['ink-2', 'ink-2', 'panel-2', text],
    ['ink-3', 'ink-3', 'panel', text], ['ink-3', 'ink-3', 'panel-2', text],
    ['lamp-ink', 'lamp-ink', 'lamp', text],
    ['lamp-ink', 'lamp-ink', 'lamp-hi', text],
    ['accent', 'accent', 'panel', text],
    ['edge', 'edge', 'panel', graphic],
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
  const hex = (c: number) => '#' + c.toString(16).padStart(6, '0')
  const over = (fg: number, a: number, bg: string) => hex([16, 8, 0].reduce((n, s) => n | (Math.round(((fg >> s) & 255) * a + ((num(bg) >> s) & 255) * (1 - a)) << s), 0))
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
