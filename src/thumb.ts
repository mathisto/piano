import type { Song } from './song'
import { BOTTOM_STEP, clefFor, spell } from './spell'

/** A tiny grand staff of the first bars, noteheads only: enough to tell pieces apart at a glance. */
export function thumb(song: Song): string {
  const base = { treble: 17, bass: 38 } // y of each clef's bottom line in the 112x44 box
  const stepY = 1.5
  const upTo = song.bars[Math.min(1, song.bars.length - 1)].t1
  const lines = (['treble', 'bass'] as const)
    .map((c) => [0, 1, 2, 3, 4].map((i) => `<line class="ln" x1="3" x2="109" y1="${base[c] - i * 3}" y2="${base[c] - i * 3}"/>`).join(''))
    .join('')
  const heads = song.notes
    .filter((n) => n.t < upTo)
    .slice(0, 80)
    .map((n) => {
      const clef = clefFor(n.p, n.h)
      const y = base[clef] - (spell(n.p, song.fifths).step - BOTTOM_STEP[clef]) * stepY
      if (y < 1 || y > 43) return ''
      return `<ellipse class="nt" cx="${(8 + (n.t / upTo) * 98).toFixed(1)}" cy="${y.toFixed(1)}" rx="2" ry="1.5"/>`
    })
    .join('')
  return `<svg viewBox="0 0 112 44" aria-hidden="true">${lines}${heads}</svg>`
}
