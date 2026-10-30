// Small pure helpers several features need. Keep each one here, not copied into the feature that uses it.

/** HTML-escape text for innerHTML, attribute values included. */
export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

/** The middle value; the mean of the two middle ones when the count is even; 0 for none. */
export const median = (xs: number[]) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export const pct = (x: number) => `${Math.round(x * 100)}%`

export const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

/** The two neighbouring bars with the most trouble, inside the piece's `bars`: heat past the end is from a longer version of it. */
export function worstBars(heat: number[], bars: number): { a: number; b: number } | null {
  let best = 0
  let at = -1
  const h = (i: number) => (i < bars ? (heat[i] ?? 0) : 0)
  for (let i = 0; i < Math.min(heat.length, bars); i++)
    if (h(i) + h(i + 1) > best) {
      best = h(i) + h(i + 1)
      at = i
    }
  return at < 0 ? null : { a: at, b: Math.min(bars - 1, at + 1) }
}
