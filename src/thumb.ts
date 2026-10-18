import type { Song } from './song'
import { BOTTOM_STEP, clefFor, spell } from './spell'

/** A tiny grand staff of the first bars, noteheads only: enough to tell pieces apart at a glance. */
export function thumb(song: Song): string {
  const base = { treble: 19, bass: 44 } // y of each clef's bottom line in the 140x52 box
  const stepY = 1.7
  const upTo = song.bars[Math.min(1, song.bars.length - 1)].t1
  const lines = (['treble', 'bass'] as const)
    .map((c) => [0, 1, 2, 3, 4].map((i) => `<line class="ln" x1="3" x2="137" y1="${base[c] - i * 3.4}" y2="${base[c] - i * 3.4}"/>`).join(''))
    .join('')
  const heads = song.notes
    .filter((n) => n.t < upTo)
    .slice(0, 48)
    .map((n) => {
      const clef = clefFor(n.p, n.h)
      const y = base[clef] - (spell(n.p, song.fifths).step - BOTTOM_STEP[clef]) * stepY
      if (y < 2 || y > 50) return ''
      return `<ellipse class="nt" cx="${(8 + (n.t / upTo) * 126).toFixed(1)}" cy="${y.toFixed(1)}" rx="2.6" ry="1.9"/>`
    })
    .join('')
  return `<svg viewBox="0 0 140 52" aria-hidden="true">${lines}${heads}</svg>`
}
