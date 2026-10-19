const MIN = 0.25
const STEP_UP = 0.05
const STEP_DOWN = 0.1
const round = (r: number) => Math.round(r * 20) / 20

/** Moves the tempo with the player: three clean passes of a loop speed it up, two messy ones slow it down. */
export class Pace {
  private good = 0
  private bad = 0

  reset() {
    this.good = this.bad = 0
  }

  /** Feed one finished pass; returns the new tempo (1 = full) when it should change. */
  pass(clean: boolean, rate: number): number | undefined {
    if (clean) {
      this.bad = 0
      if (++this.good >= 3 && rate < 1) {
        this.good = 0
        return Math.min(1, round(rate + STEP_UP))
      }
    } else {
      this.good = 0
      if (++this.bad >= 2 && rate > MIN) {
        this.bad = 0
        return Math.max(MIN, round(rate - STEP_DOWN))
      }
    }
    return undefined
  }
}

export interface Next {
  kind: 'nowait' | 'faster' | 'loop'
  rate?: number
  label: string
}

const LADDER = [0.5, 0.75, 1]

/** The one thing to try after a run: lose the wait, climb the tempo ladder, or loop the worst bars slowly. */
export function nextStep(o: { clean: boolean; wait: boolean; rate: number; worst: { a: number; b: number } | null }): Next | null {
  if (o.clean) {
    if (o.wait) return { kind: 'nowait', label: 'Try it without waiting' }
    const up = LADDER.find((r) => r > o.rate + 1e-6)
    return up ? { kind: 'faster', rate: up, label: `Try ${Math.round(up * 100)}% tempo` } : null
  }
  if (o.worst) return { kind: 'loop', rate: Math.min(o.rate, 0.7), label: `Loop bars ${o.worst.a + 1} to ${o.worst.b + 1} slowly` }
  return null
}
