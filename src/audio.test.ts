import { describe, expect, it, vi } from 'vitest'
import { mix } from './audio'

const all = () => true

describe('mix: which recordings a hit blends', () => {
  it('a soft hit is the soft recording alone, a hard hit the hard one', () => {
    expect(mix(0.05, all)).toEqual([[0, 1]])
    expect(mix(1, all)).toEqual([[2, 1]])
  })
  it('between two recordings the gains are equal-power: their squares sum to one', () => {
    const m = mix(0.38, all)
    expect(m.map(([k]) => k)).toEqual([0, 1])
    expect(m.reduce((a, [, g]) => a + g * g, 0)).toBeCloseTo(1)
  })
  it('uses what has loaded: the medium layer alone while the others are still coming', () => {
    expect(mix(0.9, (k) => k === 1)).toEqual([[1, 1]])
    expect(mix(0.9, () => false)).toEqual([])
  })
  it('two recordings (soft, hard) split the strengths between them', () => {
    expect(mix(0.1, all, 2)).toEqual([[0, 1]])
    expect(mix(1, all, 2)).toEqual([[1, 1]])
    expect(mix(0.54, all, 2).map(([k]) => k)).toEqual([0, 1])
  })
})

// A stand-in audio context that records when each source starts and stops. Its currentTime lags the output clock by 10 ms, as a real one does between render quanta.
function fakeContext() {
  const sources: { start?: number; stop?: number; kind: string }[] = []
  const param = () => ({ value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} })
  const node = (kind: string) => {
    const rec: { start?: number; stop?: number; kind: string } = { kind }
    const n = { gain: param(), frequency: param(), Q: param(), playbackRate: param(), connect: (x: unknown) => x, disconnect() {}, start: (t = 0) => (rec.start = t), stop: (t = 0) => (rec.stop = t), onended: null }
    if (kind !== 'gain' && kind !== 'filter') sources.push(rec)
    return n
  }
  class Ctx {
    currentTime = 9.99
    state = 'running'
    sampleRate = 8000
    destination = {}
    getOutputTimestamp = () => ({ contextTime: 10, performanceTime: performance.now() })
    resume = async () => {}
    createGain = () => node('gain')
    createBiquadFilter = () => node('filter')
    createConvolver = () => node('filter')
    createOscillator = () => node('osc')
    createBufferSource = () => node('buffer')
    createBuffer = (_: number, n: number) => ({ getChannelData: () => new Float32Array(n) })
    decodeAudioData = async () => ({})
  }
  return { Ctx, sources }
}

describe('the audio clock', () => {
  it('claps, clicks and the app’s notes are timed from the output clock, and hush() stops what is ahead', async () => {
    const { Ctx, sources } = fakeContext()
    vi.stubGlobal('AudioContext', Ctx)
    vi.stubGlobal('navigator', {})
    const audio = await import('./audio')
    const { settings } = await import('./settings')
    settings.instrument = 'synth'
    audio.clap(0.5)
    expect(sources[0].start).toBeCloseTo(10.5, 2) // not currentTime + 0.5
    sources.length = 0
    audio.noteOn(60, 0.7, true, undefined, { after: 0.2, dur: 0.5 })
    expect(sources.map((s) => s.start?.toFixed(2))).toEqual(['10.20', '10.20'])
    expect(sources[0].stop).toBeCloseTo(10.2 + 0.5 + 0.3 + 0.05, 2) // held for its length, then the damper
    audio.click(true, 0.2)
    const click = sources.slice(2)
    audio.hush()
    for (const s of [...sources.slice(0, 2), ...click]) expect(s.stop).toBeLessThan(10.2) // stopped before they were due
  })
})
