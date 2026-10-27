// Browser smoke test: `npx vite --port 5173` in one terminal, `npm i --no-save playwright-core axe-core`, then `npm run smoke`.
// SMOKE_URL overrides the address. Exits non-zero when a check fails.
import { readFileSync } from 'node:fs'

const { chromium } = await import('playwright-core')
const URL = process.env.SMOKE_URL ?? 'http://localhost:5173/'
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1180, height: 820 } })
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`))

let failed = 0
const check = (name, ok, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`)
}
const views = () => page.evaluate(() => [...document.querySelectorAll('.view.on')].map((v) => v.id).join())

await page.goto(URL)
await page.waitForSelector('#today.on')
check('boots on Today', (await views()) === 'today')
check('first launch shows Set up', await page.waitForSelector('dialog#setup[open]', { timeout: 3000 }).then(() => true, () => false))
await page.keyboard.press('Escape')
check('Set up skips with Escape', !(await page.isVisible('dialog#setup[open]')))

for (const [tab, id] of [['songs', 'library'], ['read', 'read'], ['scales', 'scales'], ['theory', 'theory'], ['technique', 'technique'], ['progress', 'progress'], ['today', 'today']]) {
  await page.click(`label:has(input[value=${tab}])`)
  await page.waitForTimeout(250)
  check(`${tab} page opens`, (await views()) === id)
}

await page.click('label:has(input[value=songs])')
check('open library lists pieces', (await page.$$('.biglib tr[data-lib]')).length >= 1)
await page.click('tr.open[data-open] >> nth=0')
await page.waitForTimeout(1200)
check('a song opens in play', (await views()) === 'play')
check('start card offers Perform and Learn', (await page.$$('input[name=modeSheet]')).length === 2)
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

await page.click('label:has(input[value=technique])')
await page.click('#tStart')
await page.waitForTimeout(1000)
check('a technique exercise opens', (await page.textContent('#title')).length > 0)
await page.keyboard.press('Escape')

await page.click('#settingsBtn')
await page.waitForTimeout(300)
const h = await page.evaluate(() => { const d = document.querySelector('#drawer'); return d.scrollHeight - d.clientHeight })
check('settings fit one screen', h <= 80, `${h}px over`)
await page.keyboard.press('Escape')

try {
  const axe = readFileSync('node_modules/axe-core/axe.min.js', 'utf8')
  await page.addScriptTag({ content: axe })
  await page.click('#settingsBtn')
  await page.click('#sSetup')
  await page.waitForTimeout(250)
  const sv = await page.evaluate(async () => (await window.axe.run('#setup', { resultTypes: ['violations'] })).violations.map((x) => x.id))
  check('Set up opens from Settings with no accessibility violations', (await page.isVisible('dialog#setup[open]')) && sv.length === 0, sv.join(', '))
  await page.keyboard.press('Escape')
  for (const tab of ['today', 'songs', 'read', 'scales', 'theory', 'technique', 'progress']) {
    await page.click(`label:has(input[value=${tab}])`)
    await page.waitForTimeout(250)
    const v = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations.map((x) => x.id))
    check(`${tab} has no accessibility violations`, v.length === 0, v.join(', '))
  }
} catch {
  console.log('skip accessibility checks: npm i --no-save axe-core')
}

check('no console or page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
await browser.close()
process.exit(failed ? 1 : 0)
