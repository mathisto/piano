// Offline check for the service worker: `npm run build && npx vite preview`, `npm i --no-save playwright-core`, then `node scripts/offline.mjs`.
// OFFLINE_URL overrides the address (default http://localhost:4173/). Visits once, goes offline, reloads, and opens a song. Exits non-zero on a failure.
const { chromium } = await import('playwright-core')
const URL = process.env.OFFLINE_URL ?? 'http://localhost:4173/'
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
let failed = 0
const check = (name, ok, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`)
}

await page.goto(URL)
await page.waitForSelector('#today.on')
await page.evaluate(() => navigator.serviceWorker.ready)
await page.waitForFunction(() => navigator.serviceWorker.controller) // clients.claim() after install
check('service worker controls the page', true)
const keys = await page.evaluate(async () => (await caches.keys()).sort())
check('caches', keys.some((k) => k.startsWith('pf-shell-')), keys.join())
const fetched = (u) => page.evaluate((u) => fetch(u).then((r) => r.status, () => 0), u)
const piece = (await fetched('/corpus/p/test.mid')) === 200

await ctx.setOffline(true)
await page.reload()
check('offline reload boots on Today', await page.waitForSelector('#today.on', { timeout: 10000 }).then(() => true, () => false))
check('offline: the shell is the same page, not the browser error page', (await page.title()) === 'Piano Forte')
await page.click('label:has(input[value=songs])')
await page.waitForSelector('tr.open[data-open]')
await page.click('tr.open[data-open] >> nth=0')
await page.waitForTimeout(1500)
check('offline: a song opens (lazy chunks come from the cache)', (await page.$$('canvas')).length >= 1)
if (piece) {
  check('offline: corpus piece served from cache', (await fetched('/corpus/p/test.mid')) === 200)
}
check('offline: the catalogue is not the worker\'s to keep (src/catalog.ts has its own copy)', (await fetched('/corpus/catalog.json')) === 0)
check('offline: an uncached request fails, not hangs', (await fetched('/corpus/p/never-seen.mid')) === 0)
// the edge answering for a server that is down (Cloudflare 502, 530): the cached shell, not the error page
await ctx.setOffline(false)
let bad = 0
await ctx.route((u) => u.pathname === '/', (r) => (bad++, r.fulfill({ status: 502, body: 'Bad gateway' })))
await page.reload()
check('a 502 for the page: the cached shell boots', bad > 0 && (await page.waitForSelector('#today.on', { timeout: 10000 }).then(() => true, () => false)), `${bad} answered 502`)
await ctx.unrouteAll()
check('no page errors', errors.length === 0, errors.join(' | '))
await browser.close()
process.exit(failed ? 1 : 0)
