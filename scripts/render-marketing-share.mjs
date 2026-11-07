import { chromium } from 'playwright-core'
import { createServer } from 'vite'

const server = await createServer({ logLevel: 'error', server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 756 }, deviceScaleFactor: 5 / 6 })
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.goto(new URL('marketing/', server.resolvedUrls.local[0]).href, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'public/share-card.png' })
} finally {
  await browser.close()
  await server.close()
}
