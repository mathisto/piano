import type { Rung } from './ladder-data'
import type { Progress } from './store'

export type PieceState = 'new' | 'learning' | 'ready'
export interface LadderPiece {
  id: string
  title: string
  composer: string
  why: string
  state: PieceState
}
export interface LadderLevel {
  level: number
  pieces: LadderPiece[]
  ready: number
}

/** Ready is a clean run on two different days (as the Songs tag), Learning is any play. Pieces `info` does not know yet (catalogue not loaded) are left out. */
export function ladderState(ladder: Rung[], progress: Map<string, Progress>, info: (id: string) => { title: string; composer: string } | undefined): LadderLevel[] {
  return [1, 2, 3, 4, 5].map((level) => {
    const pieces = ladder.flatMap((r): LadderPiece[] => {
      const i = r.level === level && info(r.id)
      const p = progress.get(`lib:${r.id}`)
      return i ? [{ id: r.id, ...i, why: r.why, state: (p?.days?.length ?? 0) >= 2 ? 'ready' : (p?.plays ?? 0) > 0 ? 'learning' : 'new' }] : []
    })
    return { level, pieces, ready: pieces.filter((p) => p.state === 'ready').length }
  })
}
