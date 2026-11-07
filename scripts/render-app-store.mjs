import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'

let chromium
try {
  ;({ chromium } = await import('playwright-core'))
} catch {
  throw new Error('playwright-core is required: npm i --no-save playwright-core axe-core')
}

const ROOT = process.cwd()
const OUT = join(ROOT, 'app-store/screenshots/13-inch')
const APP_SIZE = { width: 1376, height: 860 }
const FINAL_SIZE = { width: 1376, height: 1032 }
const SCALE = 2
mkdirSync(OUT, { recursive: true })

const server = await createServer({
  logLevel: 'error',
  cacheDir: join(tmpdir(), `pth-app-store-${process.pid}`),
  server: { port: 0, strictPort: false },
})
await server.listen()
const appUrl = server.resolvedUrls.local[0]
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
})

const font = readFileSync(join(ROOT, 'design/identity/fonts/Newsreader-Variable.ttf')).toString('base64')
const mark = readFileSync(join(ROOT, 'design/identity/output/mark.svg')).toString('base64')

const init = ({ theme }) => {
  localStorage.setItem('piano.setup', '1')
  localStorage.setItem('piano.settings', JSON.stringify({ theme, osk: false }))
  const input = { id: 'app-store-keyboard', name: 'Roland FP-10', manufacturer: 'Roland', state: 'connected', connection: 'open', type: 'input', onmidimessage: null, open: async () => input, close: async () => input }
  const access = { inputs: new Map([[input.id, input]]), outputs: new Map(), sysexEnabled: false, onstatechange: null }
  Object.defineProperty(navigator, 'requestMIDIAccess', { configurable: true, value: async () => access })
  if (navigator.permissions) Object.defineProperty(navigator.permissions, 'query', { configurable: true, value: async () => ({ state: 'granted', onchange: null }) })
}

async function open(theme = 'light', platform = 'web') {
  const context = await browser.newContext({ viewport: APP_SIZE, deviceScaleFactor: SCALE, colorScheme: theme })
  await context.addInitScript(init, { theme })
  const page = await context.newPage()
  page.on('pageerror', (error) => console.error(`pageerror: ${error.message}`))
  page.on('console', (message) => message.type() === 'error' && console.error(`console: ${message.text()}`))
  await page.goto(`${appUrl}${platform === 'ios' ? '?platform=ios' : ''}`)
  await page.waitForFunction(() => window.__piano && document.querySelector('#today.on .plan'))
  await page.waitForFunction(() => document.querySelector('#dev')?.classList.contains('ok'))
  await page.evaluate(() => document.fonts.ready)
  return { context, page }
}

async function nav(page, tab) {
  await page.click(`label:has(input[name=nav][value=${tab}])`)
  const id = tab === 'songs' ? 'library' : tab
  await page.waitForSelector(`#${id}.on > :not(.wait)`)
}

async function runToResults(page) {
  await page.evaluate(() => window.__piano.open(7, 'perform'))
  await page.waitForSelector('#ready:not([hidden])')
  await page.click('#go')
  await page.waitForFunction(() => ['countin', 'playing'].includes(window.__piano.game.phase))
  await page.evaluate(
    ({ skip }) =>
      new Promise((resolve, reject) => {
        const p = window.__piano
        const g = p.game
        const omitted = new Set(skip)
        const startedAt = performance.now()
        let started = false
        let todo = []
        const when = (t) => g.anchorPerf + ((t - g.anchorT) / g.rate) * 1000
        const id = setInterval(() => {
          if (!started && ['countin', 'playing'].includes(g.phase)) {
            started = true
            const offsets = [-0.028, 0.018, 0.007, -0.015, 0.034]
            g.song.notes.forEach((note, i) => {
              if (omitted.has(i) || g.modeOf(note) !== 'play') return
              const offset = offsets[i % offsets.length]
              todo.push(
                { t: note.t + offset, go: (ts) => p.key(note.p, i % 2 ? 0.74 : 0.43, ts) },
                { t: note.t + note.d * 0.92 + offset, go: (ts) => p.up(note.p, ts) },
              )
            })
            const stray = g.song.notes[Math.min(8, g.song.notes.length - 1)]
            todo.push(
              { t: stray.t + 0.16, go: (ts) => p.key(stray.p + 1, 0.6, ts) },
              { t: stray.t + 0.24, go: (ts) => p.up(stray.p + 1, ts) },
            )
          }
          const now = performance.now()
          todo = todo.filter((event) => (when(event.t) <= now ? (event.go(Math.min(now, when(event.t))), false) : true))
          if (g.phase === 'done') {
            clearInterval(id)
            resolve(true)
          } else if (now - startedAt > 30000) {
            clearInterval(id)
            reject(new Error(`result run timed out in ${g.phase}`))
          }
        }, 5)
      }),
    { skip: [2, 7, 14] },
  )
  await page.waitForFunction(() => {
    const result = document.querySelector('#res')
    return result && !result.hidden && result.childElementCount > 0
  })
}

async function capture(scene) {
  const { context, page } = await open(scene.theme, scene.platform)
  try {
    await scene.prepare(page)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(250)
    return await page.screenshot({ type: 'png' })
  } finally {
    await context.close()
  }
}

const scenes = [
  {
    file: '01-practice-next.png',
    title: 'Know what to practice next.',
    sub: 'A focused plan turns scores, reading, technique, and theory into one calm session.',
    theme: 'light',
    prepare: async () => {},
  },
  {
    file: '02-real-piano.png',
    title: 'Play the score on your real piano.',
    sub: 'USB or Bluetooth MIDI turns each note into immediate, readable feedback.',
    theme: 'dark',
    prepare: async (page) => {
      await page.evaluate(() => window.__piano.open(3, 'perform'))
      await page.waitForSelector('#ready:not([hidden])')
      await page.click('#go')
      await page.waitForFunction(() => ['countin', 'playing'].includes(window.__piano.game.phase))
      await page.evaluate(() => {
        const p = window.__piano
        const g = p.game
        let todo = []
        let loaded = false
        const when = (t) => g.anchorPerf + ((t - g.anchorT) / g.rate) * 1000
        const id = setInterval(() => {
          if (!loaded && ['countin', 'playing'].includes(g.phase)) {
            loaded = true
            g.song.notes.forEach((note) => {
              if (g.modeOf(note) !== 'play') return
              todo.push(
                { t: note.t, go: (ts) => p.key(note.p, 0.62, ts) },
                { t: note.t + note.d * 0.92, go: (ts) => p.up(note.p, ts) },
              )
            })
          }
          const now = performance.now()
          todo = todo.filter((event) => (when(event.t) <= now ? (event.go(Math.min(now, when(event.t))), false) : true))
          if (g.phase === 'done') clearInterval(id)
        }, 5)
      })
      await page.waitForFunction(() => window.__piano.game.phase === 'playing')
      await page.waitForTimeout(1200)
    },
  },
  {
    file: '03-fix-the-bars.png',
    title: 'See what slipped—and what to do next.',
    sub: 'Accuracy, timing, touch, and the exact bars worth another pass.',
    theme: 'light',
    prepare: runToResults,
  },
  {
    file: '04-import-your-score.png',
    title: 'Bring the music you already own.',
    sub: 'Import MIDI or MusicXML. Your files and history stay on your device.',
    theme: 'light',
    prepare: async (page) => {
      await nav(page, 'songs')
      await page.locator('#file').setInputFiles({
        name: 'Mozart — Sonata in C.mid',
        mimeType: 'audio/midi',
        buffer: readFileSync(join(ROOT, 'public/library/mutopia-998.mid')),
      })
      await page.waitForFunction(() => document.querySelector('#library')?.textContent?.includes('Mozart — Sonata in C'))
      await page.locator('tr[data-open]', { hasText: 'Mozart — Sonata in C' }).click()
      await page.waitForSelector('#ready:not([hidden])')
    },
  },
  {
    file: '05-build-the-skill.png',
    title: 'Build the skill behind the piece.',
    sub: 'Sight reading, scales, technique, theory, and ear work move at your pace.',
    theme: 'light',
    prepare: async (page) => {
      await page.evaluate(() => window.__piano.solidUpTo(2))
      await page.waitForSelector('#read.on > :not(.wait)')
    },
  },
  {
    file: '06-own-your-practice.png',
    title: 'Own the app. Keep your practice.',
    sub: 'No subscription, ads, or account. Back up locally or sync through iCloud Drive.',
    theme: 'light',
    platform: 'ios',
    prepare: async (page) => {
      await page.click('#settingsBtn')
      await page.waitForSelector('#drawer:not([hidden]) #sRemindAt')
      await page.waitForFunction(() => document.querySelector('#sSync')?.textContent === 'Use iCloud Drive')
      await page.locator('#drawer').evaluate((el) => {
        el.style.scrollBehavior = 'auto'
        el.scrollTop = el.scrollHeight
      })
    },
  },
]

async function frame(scene, app) {
  const context = await browser.newContext({ viewport: FINAL_SIZE, deviceScaleFactor: SCALE, colorScheme: scene.theme })
  const page = await context.newPage()
  const dark = scene.theme === 'dark'
  const appData = `data:image/png;base64,${app.toString('base64')}`
  await page.setContent(`<!doctype html><html><head><style>
    @font-face{font-family:Newsreader;src:url(data:font/ttf;base64,${font}) format('truetype');font-weight:200 800}
    *{box-sizing:border-box} html,body{margin:0;width:100%;height:100%;overflow:hidden}
    body{background:${dark ? '#0c0e12' : '#f3efe6'};color:${dark ? '#f5f0e6' : '#191814'};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    .brand{position:absolute;left:52px;top:28px;display:flex;align-items:center;gap:14px;font:650 21px/1 Newsreader,serif;letter-spacing:-.01em}
    .brand img{width:34px;height:34px;${dark ? 'filter:invert(1)' : ''}}
    h1{position:absolute;left:52px;top:67px;margin:0;font:620 48px/1.02 Newsreader,serif;letter-spacing:-.025em}
    p{position:absolute;left:54px;top:126px;margin:0;max-width:940px;color:${dark ? '#c9c2b7' : '#5d584f'};font-size:19px;line-height:1.35;font-weight:500}
    .product{position:absolute;left:52px;top:190px;width:1272px;height:810px;object-fit:cover;object-position:top center;border-radius:15px;box-shadow:0 18px 46px ${dark ? '#0008' : '#2b241d2b'};outline:1px solid ${dark ? '#ffffff22' : '#29241d2e'};background:${dark ? '#0c0e12' : '#f3efe6'}}
  </style></head><body>
    <div class="brand"><img src="data:image/svg+xml;base64,${mark}" alt="">Page to Hand</div>
    <h1>${scene.title}</h1><p>${scene.sub}</p><img class="product" src="${appData}" alt="">
  </body></html>`)
  await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map((img) => img.decode())]))
  const path = join(OUT, scene.file)
  await page.screenshot({ path, type: 'png' })
  await context.close()
  console.log(`${scene.file} 2752x2064`)
}

try {
  const selected = process.env.APP_STORE_ONLY ? scenes.filter((scene) => new RegExp(process.env.APP_STORE_ONLY).test(scene.file)) : scenes
  for (const scene of selected) await frame(scene, await capture(scene))
} finally {
  await browser.close()
  await server.close()
}

const generated = scenes.map((scene) => scene.file)
writeFileSync(join(OUT, 'manifest.json'), `${JSON.stringify({ size: [FINAL_SIZE.width * SCALE, FINAL_SIZE.height * SCALE], files: generated }, null, 2)}\n`)
