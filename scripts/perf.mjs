// Load bench: `npm run build`, then `node scripts/perf.mjs [runs=7]`. Serves dist/ with vite preview, loads it in headless Chrome
// with the CPU throttled 4x (a slow tablet) and off-machine requests blocked, and prints the median of each number:
//   today  = ms from navigation to the Today plan in the DOM (a MutationObserver marks it, so later idle work is not counted)
//   script = main-thread ms running JS (compile, module evaluation, callbacks) before that mark, from a Chrome trace
//   task   = main-thread ms busy at all (script, style, layout, GC) before that mark
//   nav    = ms from a tap on Songs to the library shown;  open = ms from a tap on the first piece to its start card
//   js     = JS kB fetched before the mark
// The first load warms Chrome and the server and is dropped. Docs: docs/changes/perf.md.
import { preview } from 'vite'

const { chromium } = await import('playwright-core')
const N = +(process.argv[2] ?? 7)
const server = await preview({ logLevel: 'error', build: { outDir: process.env.PERF_DIST ?? 'dist' }, preview: { port: 4317, strictPort: true } }) // PERF_DIST: another build, for an A/B
const URL_ = server.resolvedUrls.local[0]
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const MARK = `new MutationObserver((_, o) => {
  if (!document.querySelector('#today.on .plan')) return
  o.disconnect()
  performance.mark('today')
  window.__js = performance.getEntriesByType('resource').filter((e) => e.name.endsWith('.js')).reduce((s, e) => s + e.decodedBodySize, 0)
}).observe(document, { subtree: true, childList: true })`
const SCRIPT = new Set(['EvaluateScript', 'v8.evaluateModule', 'v8.callFunction', 'FunctionCall', 'v8.compile', 'v8.compileModule', 'TimerFire', 'FireAnimationFrame'])
// total length of the union of [a, b) intervals: nested trace events are counted once
const union = (xs) => xs.sort((p, q) => p[0] - q[0]).reduce((s, [a, b]) => (b > s.end ? { t: s.t + b - Math.max(a, s.end), end: b } : s), { t: 0, end: -Infinity }).t / 1000

const runs = []
for (let i = -1; i < N; i++) {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 } })
  await ctx.route((u) => !u.href.startsWith(URL_), (r) => r.abort())
  await ctx.addInitScript(MARK)
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const ev = []
  cdp.on('Tracing.dataCollected', (d) => ev.push(...d.value))
  const traced = new Promise((r) => cdp.once('Tracing.tracingComplete', r))
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,v8,blink.user_timing', transferMode: 'ReportEvents' })
  await page.goto(URL_)
  await page.waitForFunction(() => performance.getEntriesByName('today').length)
  const { today, js } = await page.evaluate(() => ({ today: performance.getEntriesByName('today')[0].startTime, js: window.__js }))
  await cdp.send('Tracing.end')
  await traced
  const mark = ev.find((e) => e.name === 'today')
  const main = (e) => e.pid === mark.pid && e.tid === mark.tid && e.ph === 'X' && e.ts < mark.ts
  const iv = (e) => [e.ts, Math.min(e.ts + (e.dur ?? 0), mark.ts)]
  const script = union(ev.filter((e) => main(e) && SCRIPT.has(e.name)).map(iv))
  const task = union(ev.filter((e) => main(e) && e.name === 'RunTask').map(iv))
  const t0 = await page.evaluate(() => performance.now())
  await page.click('label:has(input[value=songs])')
  await page.waitForSelector('#library.on')
  const nav = (await page.evaluate(() => performance.now())) - t0
  const t1 = await page.evaluate(() => performance.now())
  await page.click('tr.open[data-open] >> nth=0')
  await page.waitForFunction(() => document.activeElement?.id === 'go') // openSong focuses Play last
  const open = (await page.evaluate(() => performance.now())) - t1
  if (i >= 0) runs.push({ today, script, task, nav, open, js: js / 1024 })
  await ctx.close()
}
const med = (k) => runs.map((r) => r[k]).sort((a, b) => a - b)[runs.length >> 1].toFixed(0)
console.log(`median of ${N} at 4x CPU: today ${med('today')} ms, script ${med('script')} ms, task ${med('task')} ms, nav ${med('nav')} ms, open ${med('open')} ms, js ${med('js')} kB`)
console.log('today per run:', runs.map((r) => r.today.toFixed(0)).join(' '))
await browser.close()
await server.close()
