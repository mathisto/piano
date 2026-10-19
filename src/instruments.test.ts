import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pickSample } from './audio'
import { INSTRUMENTS, PIANO, instrument, instrumentId } from './instruments'

describe('instrument registry', () => {
  it('has unique ids, the old piano and synth among them', () => {
    const ids = INSTRUMENTS.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('piano')
    expect(ids).toContain('synth')
  })
  it('points every root at a real, nonempty file, with unique names and pitches', () => {
    for (const i of INSTRUMENTS.filter((i) => i.base)) {
      expect(i.roots.length).toBeGreaterThan(0)
      expect(new Set(i.roots.map((r) => r.name)).size).toBe(i.roots.length)
      expect(new Set(i.roots.map((r) => r.midi)).size).toBe(i.roots.length)
      for (const r of i.roots) {
        const f = `public/samples/${i.base}/${r.name}.mp3`
        expect(existsSync(f), f).toBe(true)
        expect(statSync(f).size, f).toBeGreaterThan(1000)
      }
    }
  })
  it('keeps each lazy-loaded instrument small', () => {
    for (const i of INSTRUMENTS.filter((i) => i.base && i.id !== 'piano')) {
      const bytes = i.roots.reduce((n, r) => n + statSync(`public/samples/${i.base}/${r.name}.mp3`).size, 0)
      expect(bytes, i.id).toBeLessThan(600_000)
    }
  })
  it('gives sustained instruments sane loops inside the file', () => {
    for (const id of ['organ', 'strings']) {
      for (const r of instrument(id).roots) {
        expect(r.loop, `${id} ${r.name}`).toBeDefined()
        const [a, b] = r.loop!
        expect(a).toBeGreaterThan(0.1)
        expect(b - a).toBeGreaterThan(0.5)
      }
    }
    expect(instrument('harp').roots.every((r) => !r.loop)).toBe(true)
  })
  it('picks across any instrument, bending at most a tritone-and-a-half, and carries the loop', () => {
    for (const i of INSTRUMENTS.filter((i) => i.roots.length)) {
      for (let p = 36; p <= 96; p++) expect(Math.abs(Math.log2(pickSample(p, i).rate) * 12)).toBeLessThanOrEqual(1.5)
    }
    const o = instrument('organ')
    const s = pickSample(60, o)
    expect(s).toEqual({ name: 'C4', rate: 1, loop: o.roots.find((r) => r.name === 'C4')!.loop })
    expect(pickSample(60).name).toBe('C4') // the piano by default
    expect(pickSample(21, o).name).toBe('C2') // below the range: the lowest recording, bent down
    expect(pickSample(21, PIANO).name).toBe('A0')
  })
})

describe('saved instrument', () => {
  afterEach(() => vi.unstubAllGlobals())
  const load = async (saved: string) => {
    vi.stubGlobal('localStorage', { getItem: () => saved, setItem: () => {} })
    vi.resetModules()
    return (await import('./settings')).settings.instrument
  }
  it('maps ids', () => {
    expect(instrumentId('synth')).toBe('synth')
    expect(instrumentId('organ')).toBe('organ')
    expect(instrumentId('theremin')).toBe('piano')
    expect(instrumentId(undefined)).toBe('piano')
  })
  it('keeps a saved piano or synth, and falls back to the piano for anything unknown or missing', async () => {
    expect(await load('{"instrument":"synth"}')).toBe('synth')
    expect(await load('{"instrument":"piano"}')).toBe('piano')
    expect(await load('{"instrument":"organ"}')).toBe('organ')
    expect(await load('{"instrument":"gone"}')).toBe('piano')
    expect(await load('{}')).toBe('piano')
  })
})
