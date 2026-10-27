// Small pure helpers several features need. Keep each one here, not copied into the feature that uses it.

/** HTML-escape text for innerHTML, attribute values included. */
export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

/** The middle value; the mean of the two middle ones when the count is even. */
export const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export const pct = (x: number) => `${Math.round(x * 100)}%`

export const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`
