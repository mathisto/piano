import { describe, expect, it } from 'vitest'
import { between, look, pulse, swell } from './beatpulse'
import type { Game } from './game'
import { settings } from './settings'
import type { Bar } from './song'

const bar = (i: number, t0: number, t1: number, n = 4, den = 4, ql?: number): Bar => ({ i, t0, t1, n, den, ql })
const four = [bar(0, 0, 2), bar(1, 2, 4)] // 4/4 at 120 bpm: a beat every 0.5 s

describe('swell', () => {
  it('peaks on the beat, rises into it for longer than it fades after it, and is still between beats', () => {
    expect(swell(0)).toBe(1)
    expect(swell(0.5)).toBe(0)
    expect(swell(-0.3)).toBe(0)
    expect(swell(0.2)).toBeGreaterThan(0)
    expect(swell(-0.2)).toBeGreaterThan(0)
    expect(swell(0.2)).toBeGreaterThan(swell(-0.2) * 0.5) // the approach is the long side
    for (let i = 11; i > 0; i--) expect(swell((i - 1) * 0.04)).toBeGreaterThan(swell(i * 0.04)) // it only grows into the beat
  })
})

describe('pulse', () => {
  it('is full on a downbeat, 0.6 on the other beats and dark between them', () => {
    expect(pulse(four, 0)).toBe(1)
    expect(pulse(four, 0.5)).toBeCloseTo(0.6)
    expect(pulse(four, 1.5)).toBeCloseTo(0.6)
    expect(pulse(four, 2)).toBeCloseTo(1)
    expect(pulse(four, 0.25)).toBe(0)
  })
  it('swells into the next bar\'s downbeat before the bar line', () => {
    expect(pulse(four, 1.95)).toBeGreaterThan(0.6)
    expect(pulse(four, 1.95)).toBeLessThan(1)
  })
  it('counts dotted quarters in 6/8 and gives a pickup no downbeat', () => {
    const six = [bar(0, 0, 1.5, 6, 8)] // a dotted quarter every 0.75 s
    expect(pulse(six, 0.75)).toBeCloseTo(0.6)
    expect(pulse(six, 0.375)).toBe(0)
    const pick = [bar(0, 0, 1, 4, 4, 2), bar(1, 1, 3)] // two quarters of pickup, then 4/4
    expect(pulse(pick, 0)).toBeCloseTo(0.6)
    expect(pulse(pick, 1)).toBe(1)
  })
  it('is nothing outside the song', () => {
    expect(pulse(four, -1)).toBe(0)
    expect(pulse(four, 4)).toBe(0)
  })
  it('measures a beat from the last and to the next, so a hop can land on each', () => {
    expect(between(four, 0.6)).toEqual({ d0: expect.closeTo(0.2), d1: expect.closeTo(0.8), w0: 0.6, w1: 0.6 })
    expect(between(four, 1.9)).toMatchObject({ w0: 0.6, w1: 1 })
  })
})

describe('look', () => {
  const g = (o: Partial<Game>) => ({ phase: 'playing', paced: false, mode: 'perform', calib: false, ...o }) as Game
  it('shows the chosen look only while the metronome runs and the song moves', () => {
    settings.pulse = 'edge'
    settings.metro = 'silent'
    expect(look(g({}))).toBe('edge')
    expect(look(g({ phase: 'waiting' }))).toBe('off') // Wait for me holds the song: no beat to show
    expect(look(g({ phase: 'countin' }))).toBe('off')
    expect(look(g({ mode: 'read' }))).toBe('off')
    expect(look(g({ mode: 'read', paced: true }))).toBe('edge')
    settings.metro = 'off'
    expect(look(g({}))).toBe('off')
  })
})
