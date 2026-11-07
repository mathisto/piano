import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

const html = readFileSync('marketing/index.html', 'utf8')

test('publishes one canonical, shareable launch page', () => {
  expect(html).toContain('<link rel="canonical" href="https://pagetohand.com/"')
  expect(html).toContain('<meta property="og:image" content="https://pagetohand.com/share-card.png"')
  expect(html).toContain('<meta name="twitter:card" content="summary_large_image"')
  expect(html).toContain('<link rel="icon" href="/favicon.svg"')
  expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png"')

  const png = readFileSync('public/share-card.png')
  expect(png.subarray(1, 4).toString()).toBe('PNG')
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
})

test('advertises only the canonical public pages to crawlers', () => {
  expect(readFileSync('public/robots.txt', 'utf8')).toBe('User-agent: *\nAllow: /\n\nSitemap: https://pagetohand.com/sitemap.xml\n')
  const sitemap = readFileSync('public/sitemap.xml', 'utf8')
  expect([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])).toEqual([
    'https://pagetohand.com/',
    'https://pagetohand.com/support/',
    'https://pagetohand.com/privacy/',
  ])
})
