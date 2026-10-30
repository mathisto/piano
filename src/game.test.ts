import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as audio from './audio'
import { Game } from './game'
import { build, fromSpec, type Bar, type Raw } from './song'

vi.mock('./audio', () => ({ preload: vi.fn(), noteOn: vi.fn(), noteOff: vi.fn(), click: vi.fn(), unlock: vi.fn(), sustain: vi.fn(), keyUp: vi.fn(), hush: vi.fn() }))
beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers() // performance.now() too: the game anchors its clock to it
})
afterEach(() => vi.useRealTimers())

/** A frame every 10 ms for `ms` of the clock. */
function run(g: Game, ms: number, each?: (at: number) => void) {
  for (let k = 0; k <= ms; k += 10) {
    g.frame(performance.now())
    each?.(k)
    vi.advanceTimersByTime(10)
  }
}

describe('the notes the app plays for you', () => {
  it('go to the audio clock with their own length, and stop on a loop wrap and a pause instead of by a timer', () => {
    const s = fromSpec({ id: 'y', title: 'y', bpm: 60, fifths: 0, rh: 'C5:1 D5:1 E5:1 F5:1', lh: 'C3:4' })
    const g = new Game()
    g.load(s, 'learn')
    g.setWait(false)
    g.setHand('L', 'listen')
    g.setLoop({ a: 0, b: 1 }) // the first beat only; C3 is written 4 beats long
    g.toggle()
    run(g, 7000)
    const c3 = vi.mocked(audio.noteOn).mock.calls.filter((c) => c[0] === 48)
    expect(c3.length).toBe(2) // two passes of the loop
    for (const c of c3) expect(c[4]!.dur).toBe(s.notes.find((n) => n.p === 48)!.d) // its whole written length, though the loop is one beat
    expect(vi.getTimerCount()).toBe(0) // no noteOff timer left to cut a later pass
    expect(vi.mocked(audio.hush).mock.calls.length).toBeGreaterThanOrEqual(2) // each wrap
    vi.mocked(audio.hush).mockClear()
    g.toggle()
    expect(g.phase).toBe('paused')
    expect(audio.hush).toHaveBeenCalled()
  })

  it('are handed over a quarter of a second ahead, timed from the song position', () => {
    const s = fromSpec({ id: 'z', title: 'z', bpm: 60, fifths: 0, rh: 'C5:4', lh: 'C3:1 D3:1 E3:1 F3:1' })
    const g = new Game()
    g.load(s, 'perform')
    g.accomp({ R: 'play', L: 'listen' }, [])
    g.toggle()
    g.seek(0.9)
    g.frame(performance.now())
    const d3 = vi.mocked(audio.noteOn).mock.calls.find((c) => c[0] === 50)!
    expect(d3[4]!.after).toBeCloseTo(0.1, 1)
  })
})

/** Song times of the count-in clicks (the metronome is off by default), and whether each was accented. */
function clicks(g: Game, ms: number) {
  const out: [number, boolean][] = []
  run(g, ms, () => {
    for (const c of vi.mocked(audio.click).mock.calls.splice(0)) if (!c[2]) out.push([+(g.t + (c[1] ?? 0) * g.rate).toFixed(3), c[0]])
  })
  return out
}

describe('the count-in', () => {
  const q = 0.5 // 120 bpm
  /** 4/4 after a pickup of `ql` quarters, `n` full bars, eighth notes all through. */
  const piece = (ql: number, n: number, slow = -1) => {
    const bars: Bar[] = [{ i: 0, t0: 0, t1: ql * q, n: 4, den: 4, ql }]
    for (let i = 1; i <= n; i++) {
      const t0 = bars[i - 1].t1
      bars.push({ i, t0, t1: t0 + 4 * q * (i === slow ? 2 : 1), n: 4, den: 4 })
    }
    const raw: Raw[] = []
    for (const b of bars) for (let t = b.t0; t < b.t1 - 1e-6; t += (b.t1 - b.t0) / (barQ(b) * 2)) raw.push({ t, d: 0.2, p: 60, v: 0.7, track: 0 })
    return build('x', 'x', raw, bars, 0)
  }
  const barQ = (b: Bar) => b.ql ?? 4

  it('into a loop lands on the loop bar’s own beats, after a half-beat pickup', () => {
    const s = piece(0.5, 6)
    const g = new Game()
    g.load(s, 'learn')
    g.setWait(false)
    g.setLoop({ a: s.bars[3].t0, b: s.bars[4].t1 }) // 4.25 s
    g.toggle()
    expect(clicks(g, 1100)).toEqual([[3.25, true], [3.75, false]])
  })

  it('into the song counts back from the first full bar, so a one-beat pickup comes in on beat four', () => {
    const g = new Game()
    g.load(piece(1, 2), 'perform')
    g.toggle()
    expect(clicks(g, 1600)).toEqual([[-1.5, true], [-1, false], [-0.5, false]])
  })

  it('into the song after a half-beat pickup gives the four beats before it, the last one half a beat before the pickup', () => {
    const g = new Game()
    g.load(piece(0.5, 2), 'perform')
    g.toggle()
    expect(clicks(g, 2000).map(([t]) => t)).toEqual([-1.75, -1.25, -0.75, -0.25])
  })

  it('a pickup that leaves under half a bar to count gets a bar more', () => {
    const g = new Game()
    g.load(piece(3, 2), 'perform')
    g.toggle()
    expect(clicks(g, 2600).map(([t]) => t)).toEqual([-2.5, -2, -1.5, -1, -0.5])
  })

  it('counts at the tempo of the bar it leads into', () => {
    const s = piece(0.5, 4, 2) // bar 2 at half the speed
    const g = new Game()
    g.load(s, 'learn')
    g.setWait(false)
    g.setLoop({ a: s.bars[2].t0, b: s.bars[2].t1 })
    g.toggle()
    const a = s.bars[2].t0
    expect(clicks(g, 2100).map(([t]) => t)).toEqual([a - 2, a - 1])
  })

  it('the HUD counts the clicks down to 1', () => {
    const g = new Game()
    g.load(piece(1, 2), 'perform')
    g.toggle()
    const seen = new Set<number>()
    run(g, 1600, () => seen.add(g.count))
    expect([...seen]).toEqual([3, 2, 1, 0])
  })
})
