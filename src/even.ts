import type { Edges } from './touch'
import { noteName } from './spell'
import type { Hand } from './song'

/** Touch evenness: how far each note's loudness sits from its neighbours', judged against the player's own soft-to-hard range. */
export interface Hit {
  v: number // key velocity 1..127
  t: number // when the note is written, seconds
  p: number
  h: Hand
}

export type Coach = 'off' | 'gentle' | 'steady' | 'strict'
/** Tolerance as a share of the calibrated range (soft edge to hard edge): 12, 8 and 5 on the default bands. */
const SHARE = { gentle: 0.3, steady: 0.2, strict: 0.12 } as const
export const tolerance = (e: Edges, c: Exclude<Coach, 'off'>) => Math.max(3, Math.round((e.hard - e.soft) * SHARE[c]))

export const MIN_V = 15 // softer than this the sensor is noise, not touch
export const MIN_RUN = 6 // a line shorter than this says nothing about evenness
const NEAR = 3 // neighbours either side that make the reference

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** One note per moment, per hand, in time order: a chord's top note stands for it. */
export function lines<T extends { t: number; p: number; h: Hand }>(hits: T[]): T[][] {
  return (['R', 'L'] as const)
    .map((h) => {
      const out: T[] = []
      for (const x of hits.filter((x) => x.h === h).sort((a, b) => a.t - b.t || a.p - b.p)) {
        const last = out[out.length - 1]
        if (last && x.t - last.t < 0.03) out[out.length - 1] = x
        else out.push(x)
      }
      return out
    })
    .filter((l) => l.length)
}

/** Each note against the median of its neighbours. A steady crescendo scores zero, one loud note stands out; the ends and noise are null. */
export function deviations(vs: number[]): (number | null)[] {
  return vs.map((v, i) => {
    if (i === 0 || i === vs.length - 1 || v < MIN_V) return null
    const ref = vs.filter((w, j) => j !== i && Math.abs(j - i) <= NEAR && w >= MIN_V)
    return ref.length >= 2 ? v - median(ref) : null
  })
}

export interface Evenness {
  n: number // notes compared
  spread: number // robust spread of the deviations (MAD x 1.48), in velocity units
  band: number
  inside: number // share within the band
  rating: 'even' | 'nearly' | 'uneven'
  devs: { t: number; p: number; h: Hand; d: number | null }[]
  hint?: string
}

/** The evenness of a run, or null when no line is long enough to judge. `label` names the kind of note a pattern belongs to. */
export function evenness(hits: Hit[], e: Edges, coach: Exclude<Coach, 'off'>, label: (h: Hit, i: number) => string = (h) => noteName(h.p)): Evenness | null {
  if (hits.every((x) => x.v === hits[0]?.v)) return null // Fixed key touch: one velocity says nothing about evenness
  const ls = lines(hits).filter((l) => l.length >= MIN_RUN)
  if (!ls.length) return null
  const band = tolerance(e, coach)
  const devs = ls.flatMap((l) => {
    const d = deviations(l.map((x) => x.v))
    return l.map((x, i) => ({ t: x.t, p: x.p, h: x.h, d: d[i] }))
  })
  const ds = devs.map((x) => x.d).filter((d): d is number => d !== null)
  if (ds.length < MIN_RUN - 2) return null
  const m = median(ds)
  const spread = median(ds.map((d) => Math.abs(d - m))) * 1.48
  const inside = ds.filter((d) => Math.abs(d) <= band).length / ds.length
  return { n: ds.length, spread, band, inside, rating: inside >= 0.85 ? 'even' : inside >= 0.65 ? 'nearly' : 'uneven', devs, hint: hint(ls, devs, band, label) }
}

/** One thing to try, only from a pattern that repeats: a hand that runs louder, or a kind of note that is off at least three times. */
function hint(ls: Hit[][], devs: Evenness['devs'], band: number, label: (h: Hit, i: number) => string): string | undefined {
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  if (ls.length === 2) {
    const [r, l] = ls[0][0].h === 'R' ? ls : [ls[1], ls[0]]
    const gap = mean(r.map((x) => x.v)) - mean(l.map((x) => x.v))
    if (Math.abs(gap) >= band) return `Your ${gap > 0 ? 'right' : 'left'} hand ran about ${Math.round(Math.abs(gap))} louder than the other.`
  }
  const groups = new Map<string, number[]>()
  let k = 0
  for (const l of ls)
    l.forEach((x, i) => {
      const d = devs[k++].d
      if (d !== null) groups.set(label(x, i), [...(groups.get(label(x, i)) ?? []), d])
    })
  let best: [string, number] | undefined
  for (const [name, ds] of groups) {
    if (ds.length < 3) continue
    const m = mean(ds)
    if (Math.abs(m) >= band * 0.6 && (!best || Math.abs(m) > Math.abs(best[1]))) best = [name, m]
  }
  return best ? `${best[0]} runs about ${Math.round(Math.abs(best[1]))} ${best[1] > 0 ? 'louder' : 'softer'} than the notes around it.` : undefined
}

/** Live: how far a note just struck is from the last few of its hand, or null while there is too little to compare. */
export function live(prev: number[], v: number): number | null {
  const ref = prev.slice(-5).filter((w) => w >= MIN_V)
  return v < MIN_V || ref.length < 3 ? null : v - median(ref)
}

/** Exercises where the same touch is the point; a song's dynamics are meant to move, and an accent or a melody over chords is uneven on purpose. */
export const judged = (id: string, dyn?: string) => /^(tech|scale):/.test(id) && dyn !== 'accent' && dyn !== 'balance'
