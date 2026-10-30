import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as audio from './audio'
import { Game } from './game'
import { fromSpec } from './song'

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
