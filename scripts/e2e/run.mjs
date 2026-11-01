// End-to-end suite: `npm i --no-save playwright-core axe-core`, then `npm run e2e`. Starts its own Vite dev server
// (the dev hooks window.__piano and window.__ear exist only in dev) unless E2E_URL points at one. E2E_HEADED=1 shows the browser.
// Every feature drives the real UI with synthetic key presses and fails on any console or page error. Docs: docs/changes/e2e.md.
// E2E_PULSE=1 adds a lane with the three pulse trainers (about 8 minutes on its own, so use E2E_ONLY with it; the watchdog then allows 14 minutes, else 10).
import { createHash } from 'node:crypto'
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const { chromium } = await import('playwright-core')
const { Midi } = await import('@tonejs/midi').then((m) => m.Midi ? m : m.default)
const AXE = readFileSync(new URL('../../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8')
const OUT = mkdtempSync(join(tmpdir(), 'piano-e2e-'))
const T0 = Date.now()
const running = new Set() // the features in flight, named by the watchdog
const LIMIT = process.env.E2E_PULSE ? 14 : 10
setTimeout(() => (console.log(`e2e: watchdog, over ${LIMIT} minutes; still running: ${[...running].join(' | ') || 'none'}`), process.exit(2)), LIMIT * 60e3).unref()

let server
if (!process.env.E2E_URL) {
  const { createServer } = await import('vite')
  // fs: a worktree's node_modules may be a symlink; cacheDir: its own pre-bundled deps, so another dev server re-optimizing the shared ones cannot reload this one mid-run.
  // port: E2E_PORT, else 5213; Vite takes the next free port when it is busy, so runs in two worktrees do not collide
  server = await createServer({ logLevel: 'error', cacheDir: join(tmpdir(), `piano-e2e-vite${process.cwd().replace(/\W+/g, '-')}`), server: { port: Number(process.env.E2E_PORT ?? 5213), fs: { strict: false } } })
  await server.listen()
}
const URL_ = process.env.E2E_URL ?? server.resolvedUrls.local[0]

// In every page: a seeded Math.random so decks deal the same cards each run, the download path for Export (no share sheet),
// axe, and the players that answer the game.
const INIT = `
{
  let a = 20261027
  Math.random = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  Object.defineProperty(Navigator.prototype, 'canShare', { value: undefined })
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const P = () => window.__piano
  const tap = (p, v = 0.6, hold = 30) => { P().key(p, v); setTimeout(() => P().up(p), hold) }
  window.__e2e = {
    hook() { if (!this.hooked) P().game.on((e) => (e.type === 'done' && (window.__last = e.result), e.type === 'auto' && window.__auto?.push(e.note.h))); this.hooked = true },
    // wait mode (Read, Learn): play every note the song is waiting for, until until() or the end
    follow(until = 'false', limit = 90000) {
      const stop = new Function('g', 'return ' + until)
      return new Promise((res, rej) => {
        const g = P().game, t0 = performance.now()
        const id = setInterval(() => {
          try {
            if (stop(g) || g.phase === 'done') return clearInterval(id), res(true)
            if (performance.now() - t0 > limit) return clearInterval(id), rej(new Error('follow timed out in phase ' + g.phase))
            if (g.phase === 'waiting') for (const i of g.judge.required(g.t)) tap(g.song.notes[i].p)
          } catch (e) { clearInterval(id); rej(e) }
        }, 15)
      })
    },
    // Perform: once the count-in starts, every note is pressed on its beat by the game's own clock; skip lists note indices left out
    // pedal: [{ t, down }] sent as CC64 through the MIDI parser at song second t
    // stray: [{ i, p }] a wrong key p struck 180 ms after note i
    perform({ skip = [], loud = -1, pedal = [], stray = [] } = {}) {
      return new Promise((res) => {
        const g = P().game, sk = new Set(skip)
        window.__last = undefined
        let started = false
        window.__marks = 0
        // a mark lives only until the staff window moves on: count the ones added, not the ones standing when polled
        const mo = new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && (n.classList.contains('devmark') || n.querySelector?.('.devmark')) && window.__marks++)))
        mo.observe(document.querySelector('#staff'), { childList: true, subtree: true })
        const id = setInterval(() => {
          if (!started && (g.phase === 'countin' || g.phase === 'playing')) {
            started = true
            const now = performance.now()
            for (const e of pedal) setTimeout(() => P().pedal(e.down), g.anchorPerf + ((e.t - g.anchorT) / g.rate) * 1000 - now)
            // each key carries the time it was meant for, as a MIDI packet carries the time it was struck: a timer that fires late under load is not a late note
            for (const x of stray) {
              const at = g.anchorPerf + ((g.song.notes[x.i].t + 0.18 - g.anchorT) / g.rate) * 1000
              setTimeout(() => P().key(x.p, 0.55, at), at - now)
              setTimeout(() => P().up(x.p, at + 60), at + 60 - now)
            }
            g.song.notes.forEach((n, i) => {
              if (sk.has(i) || g.modeOf(n) !== 'play') return // the app plays the rest (Listen, or the part it accompanies)
              const at = g.anchorPerf + ((n.t - g.anchorT) / g.rate) * 1000
              const up = at + (n.d / g.rate) * 970
              setTimeout(() => P().key(n.p, i === loud ? 0.9 : 0.55 + (i % 3) * 0.006, at), at - now)
              setTimeout(() => P().up(n.p, up), up - now)
            })
          }
          if (g.phase === 'done' && window.__last) clearInterval(id), mo.disconnect(), res(window.__last)
        }, 5)
      })
    },
    // Theory: answer every card of the session in progress (or the first upTo), ear cards once their prompt has played
    async theory(limit = 150000, upTo = Infinity) {
      const t0 = performance.now(), why = []
      for (;;) {
        const T = P().theory()
        if (!T && performance.now() - t0 < 3000) { await sleep(20); continue } // the session deals its cards after a store read
        if (!T) throw new Error('no Theory session')
        if (T.i >= Math.min(upTo, T.cards.length)) return { ok: T.ok, n: Math.min(upTo, T.cards.length), why: [...new Set(why)].join('; ') }
        if (performance.now() - t0 > limit) throw new Error('Theory stuck on card ' + (T.i + 1))
        const c = T.cards[T.i], i = T.i, step = T.step
        if (T.answered === 'miss') why.push(T.ears.last || c.show), document.querySelector('#thNext')?.click()
        if (T.answered || performance.now() < T.ears.deaf) { await sleep(20); continue }
        if (c.play?.kind === 'pulse') {
          const B = 60000 / c.play.bpm, now = performance.now()
          for (const b of c.play.want) setTimeout(() => P().key(60, 0.6), T.ears.t0 + b * B - now)
        } else if (c.play?.kind === 'rhythm') {
          const B = 2 * (T.ears.t0 - T.ears.deaf) // the keyboard opens half a beat before the bar
          const now = performance.now()
          for (const o of c.play.onsets) setTimeout(() => P().key(60, 0.6), T.ears.t0 + (o * B) / 2 - now)
        } else if (c.play?.kind === 'qa') {
          // two bars back on the click: the phrase's own rhythm (so echo levels pass), every note the tonic or dominant it must end on
          const B = 2 * (T.ears.t0 - T.ears.deaf), now = performance.now()
          const p = 60 + ((c.play.tonic + (c.play.end === 'tonic' ? 0 : 7)) % 12)
          for (const o of c.play.cells) setTimeout(() => P().key(p, 0.6), T.ears.t0 + (o * B) / 2 - now)
        } else {
          const st = c.steps[step]
          const ps = st.abs !== undefined ? [st.abs] : st.pcs.map((pc) => (st.bass === pc ? 48 : 60) + pc)
          for (const p of ps) P().key(p, 0.6) // no key-ups: Theory ignores them, and with no song open one throws (feature 0b)
        }
        while (P().theory() === T && T.i === i && T.step === step && !T.answered) await sleep(10)
      }
    },
    async axe(sel) { return (await window.axe.run(sel ? document.querySelector(sel) : document, { resultTypes: ['violations'] })).violations.map((v) => v.id + ' (' + v.nodes.length + ')') },
    // one IndexedDB entry: read it, or write v (seeding records the app would build over days)
    async idb(k, v) {
      const db = await new Promise((r, j) => { const q = indexedDB.open('keyval-store'); q.onsuccess = () => r(q.result); q.onerror = j })
      const os = db.transaction('keyval', v === undefined ? 'readonly' : 'readwrite').objectStore('keyval')
      const out = await new Promise((r, j) => { const q = v === undefined ? os.get(k) : os.put(v, k); q.onsuccess = () => r(q.result); q.onerror = j })
      db.close()
      return out
    },
    // every IndexedDB entry and the settings, minus song files and the catalogue cache
    async snapshot() {
      const db = await new Promise((r, j) => { const q = indexedDB.open('keyval-store'); q.onsuccess = () => r(q.result); q.onerror = j })
      const all = (m) => new Promise((r) => { const q = db.transaction('keyval').objectStore('keyval')[m](); q.onsuccess = () => r(q.result) })
      const [ks, vs] = [await all('getAllKeys'), await all('getAll')]
      db.close()
      const out = {}
      ks.forEach((k, i) => { if (!/^(song:|libfile:|catalog$)/.test(k)) out[k] = JSON.stringify(vs[i]) })
      return { idb: out, keys: ks.map(String), ls: { ...localStorage } }
    },
  }
}
${AXE}`

const browser = await chromium.launch({ channel: 'chrome', headless: !process.env.E2E_HEADED, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] })

async function open(opts = {}, routes) {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, acceptDownloads: true, ...opts })
  await ctx.addInitScript(INIT)
  await routes?.(ctx) // before the first load, so a chunk the page prefetches is held or refused too
  const page = await ctx.newPage()
  page.errs = []
  page.on('pageerror', (e) => page.errs.push(`pageerror: ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && page.errs.push(`console: ${m.text()}`))
  page.on('dialog', (d) => d.accept(d.type() === 'prompt' ? 'E2E run' : undefined)) // Save this run's name; Clear's confirm
  await boot(page)
  return page
}

async function boot(page) {
  await page.goto(URL_)
  await page.waitForFunction(() => window.__piano && document.querySelector('#today.on .plan'))
  await page.evaluate(() => window.__e2e.hook())
}

// ---------------------------------------------------------------- helpers

const rows = []
const axeFound = []
const ok = (cond, msg) => {
  if (!cond) throw new Error(msg)
}
const ONLY = new RegExp(process.env.E2E_ONLY ?? '') // run a subset while debugging: E2E_ONLY='^3 |rhythm'
async function feature(name, page, fn) {
  if (!ONLY.test(name)) return
  running.add(name)
  const t = Date.now()
  const e0 = page.errs.length
  let err = ''
  try {
    await fn()
  } catch (e) {
    const ls = e.message.split('\n')
    err = [ls[0], ls.find((l) => /waiting for|^\s+at /.test(l))?.trim()].filter(Boolean).join(' / ')
    await page.screenshot({ path: join(OUT, `${name.replace(/\W+/g, '-')}.png`) }).catch(() => {})
    await boot(page).catch(() => {}) // the next feature starts from a fresh page, not from wherever this one stopped
  }
  const errs = page.errs.slice(e0)
  if (!err && errs.length) err = errs[0]
  running.delete(name)
  rows.push({ name, ok: !err, s: (Date.now() - t) / 1000, err })
  console.log(`${err ? 'FAIL' : 'ok  '} ${name} (${((Date.now() - t) / 1000).toFixed(1)} s)${err ? `: ${err}` : ''}`)
}
const ev = (page, fn, arg) => page.evaluate(fn, arg)
const wait = (page, fn, arg, timeout = 30000) => page.waitForFunction(fn, arg, { timeout, polling: 50 })
// song rows and results cards keep one or two actions on show; the others are in a More menu, opened first when the target is in there
const rowClick = async (page, sel) => {
  const b = page.locator(sel).first()
  if (await b.evaluate((e) => !!e.closest('.popmenu[hidden]'))) await b.locator('xpath=ancestor::*[contains(concat(" ", @class, " "), " popmenu ")][1]/preceding-sibling::button[@data-more][1]').click()
  await b.click()
}
async function nav(page, tab) {
  await page.click(`label:has(input[name=nav][value=${tab}])`)
  await wait(page, (id) => document.querySelector(`#${id}.on > :not(.wait)`), tab === 'songs' ? 'library' : tab)
}
// a page visited before keeps its old content until the new one is drawn: wait for the new one
async function redraw(page, tab) {
  if (await page.$(`#${tab}.on`)) await nav(page, tab === 'today' ? 'read' : 'today')
  await ev(page, (t) => document.querySelectorAll(`#${t} > *`).forEach((e) => (e.dataset.old = '1')), tab)
  await nav(page, tab)
  await wait(page, (t) => document.querySelector(`#${t}.on > :not([data-old])`), tab)
}
const ready = (page) => wait(page, () => window.__piano.game.phase === 'ready' && !document.querySelector('#ready').hidden && document.querySelector('#play.on'))
const res = (page, label) => page.waitForSelector(`#res:not([hidden]) [aria-label="${label}"]`, { timeout: 60000 })
const text = (page, sel) => page.textContent(sel)
async function axe(page, where, sel) {
  const v = await ev(page, (s) => window.__e2e.axe(s), sel)
  if (v.length) axeFound.push(`${where}: ${v.join(', ')}`)
}
// the Set up sheet never opens for automation (navigator.webdriver) unless asked: close it if it did
const skipSetup = async (page) => {
  if (await page.waitForSelector('dialog#setup[open]', { timeout: 1500 }).catch(() => null)) await page.keyboard.press('Escape')
}
const running_ = (page) => ev(page, () => ['countin', 'playing', 'waiting'].includes(window.__piano.game.phase))
const leave = async (page, back) => {
  if (await running_(page)) { // the first Escape pauses a run (feature 23)
    await page.keyboard.press('Escape')
    await wait(page, (id) => window.__piano.game.phase === 'paused' || document.querySelector(`#${id}.on`), back)
  }
  if (!(await page.$(`#${back}.on`))) await page.keyboard.press('Escape')
  await wait(page, (id) => document.querySelector(`#${id}.on`), back)
}

// ---------------------------------------------------------------- the main profile: one player's day, then Progress, export, clear, import

async function mainFlow() {
  const page = await open()
  const first = await open() // its own page: ?setup stays in that URL and would reopen the sheet on every reload
  await feature('0 first run: Set up sheet', first, async () => {
    await first.goto(`${URL_}?setup`) // automation never gets the sheet unprompted; ?setup asks for it
    await first.waitForSelector('dialog#setup[open]', { timeout: 5000 })
    await axe(first, 'Set up sheet', '#setup')
    await first.keyboard.press('Escape')
    ok(!(await first.isVisible('dialog#setup[open]')), 'Set up did not close on Escape')
  })
  await first.context().close()
  if (await page.isVisible('dialog#setup[open]')) await page.keyboard.press('Escape') // when 0 was filtered out
  await feature('0b a key played before any song is open', page, async () => {
    await ev(page, () => (window.__piano.key(60, 0.5), window.__piano.up(60))) // only an error can fail this
  })

  await feature('1 Read: a stage set, then Another set', page, async () => {
    await nav(page, 'read')
    await page.click('#read button[data-stage].primary')
    await ready(page)
    const n = await ev(page, () => window.__piano.game.song.notes.length)
    ok(n >= 10, `a drill of ${n} notes`)
    await page.$eval('#tempo', (e) => ((e.value = '125'), e.dispatchEvent(new Event('input')))) // the slider: a quicker set
    await page.click('#go')
    await ev(page, () => window.__e2e.follow('false', 60000))
    const r = await res(page, 'Drill results')
    ok(/set complete/.test(await r.textContent()), 'no "set complete"')
    ok((await text(page, '#hCards')) === `${n}/${n}`, `cards ${await text(page, '#hCards')}`)
    await axe(page, 'drill results', '#res')
    await page.click('#nextSet')
    await wait(page, () => ['countin', 'playing', 'waiting'].includes(window.__piano.game.phase) && document.querySelector('#res').hidden)
    ok(/^0\//.test(await text(page, '#hCards')), 'the new set did not start at card 0')
    await leave(page, 'read')
  })

  await feature('2 Sight Run: a set, Finish, results, presets', page, async () => {
    await nav(page, 'read')
    await page.click('label:has(input[name=readTab][value=run])')
    await page.waitForSelector('#rStart')
    await page.selectOption('#rClef', 'bass')
    await page.waitForSelector('#read [data-rr="48:60"]') // the form redraws with the bass ranges
    await page.selectOption('#rAhead', '2')
    await page.click('#rStart')
    await ready(page)
    const first = await ev(page, () => window.__piano.game.song.notes.length)
    await page.click('#go')
    await ev(page, (n) => window.__e2e.follow(`document.querySelector('#hCards').textContent === '${n}'`), first)
    // the set ended and the next one was dealt and started by itself
    await wait(page, (n) => document.querySelector('#hCards').textContent === String(n) && ['countin', 'playing', 'waiting'].includes(window.__piano.game.phase), first)
    await page.mouse.move(600, 300) // a pointer wakes the hushed bar (which is inert while hushed)
    await page.click('#stagesBtn') // Finish
    const r = await res(page, 'Run results')
    ok(new RegExp(`${first}\\s*cards`).test(await r.textContent()), 'results do not count the set')
    ok(await page.isVisible('.hstrip'), 'no per-note strip')
    await axe(page, 'run results', '#res')
    const best = await ev(page, () => window.__e2e.snapshot().then((s) => JSON.parse(s.idb['run:state'] ?? '{}')))
    ok(Object.keys(best.best ?? {}).length === 1, 'best streak not saved')
    await page.click('#toStages')
    await page.waitForSelector('#rSave')
    await page.click('#rSave') // named by the dialog handler
    await page.waitForSelector('#read [data-runp="0"]')
    ok(/E2E run/.test(await text(page, '#read .plan')), 'saved run not listed by name')
    await page.click('#read [data-runp="0"]')
    await ready(page)
    ok(/^Bass/.test(await text(page, '#title')), 'preset did not start its own setup')
    await leave(page, 'read')
    await page.click('#read [data-rund="0"]')
    await wait(page, () => !document.querySelector('#read [data-runp]'))
  })

  await feature('2b Sight Run paced: a steady run with two cards skipped, results, the tempo kept', page, async () => {
    const bests = await ev(page, () => window.__e2e.snapshot().then((s) => JSON.parse(s.idb['run:state'] ?? '{}')).then((s) => JSON.stringify(s.best ?? {})))
    await nav(page, 'read')
    await page.click('label:has(input[name=readTab][value=run])')
    await page.waitForSelector('#rStart')
    await page.selectOption('#rPaced', '1')
    await page.waitForSelector('#rPace')
    ok(/^(\d\d|100) bpm$/.test(await text(page, '#rPaceV')), 'the offered tempo is not a tempo') // 50 with no history is in paced.test.ts; the main flow's Read history moves it here
    await axe(page, 'paced builder', '#read')
    await page.$eval('#rPace', (e) => ((e.value = '100'), e.dispatchEvent(new Event('input', { bubbles: true })), e.dispatchEvent(new Event('change', { bubbles: true }))))
    ok((await text(page, '#rPaceV')) === '100 bpm', 'the slider does not speak')
    await page.click('#rStart')
    await ready(page)
    ok(await ev(page, () => window.__piano.game.paced && !window.__piano.game.wait && document.querySelector('#tempoPop').hidden), 'not a paced game')
    await page.click('#go')
    await wait(page, () => document.querySelectorAll('#beatBar i.on').length === 1 && !document.querySelector('#beats i')) // the beat shows in the bar above the staff, not in the dock
    await ev(page, () => window.__e2e.perform({ skip: [2, 9] })) // every other card on its beat, two never played: the pulse carries on
    const r = await res(page, 'Run results')
    const t = await r.textContent()
    ok(/Hit\s*14 of 16\s*on the beat at\s*100 bpm/.test(t), 'coverage: ' + t.replace(/\s+/g, ' ').trim().slice(0, 160))
    ok(/Missed:/.test(t) && (await page.$$('.pstrip i.off')).length === 2, 'the two missed cards are not shown')
    await axe(page, 'paced results', '#res')
    const st = await ev(page, () => window.__e2e.snapshot().then((s) => JSON.parse(s.idb['run:state'])))
    ok(Object.values(st.paced ?? {}).some((m) => m.bpm === 100 && m.days.length === 0), 'tempo memo: ' + JSON.stringify(st.paced)) // 14 of 16 is not clean: it stays, and counts no day
    ok(JSON.stringify(st.best ?? {}) === bests, 'a paced run set a longest streak')
    await page.click('#toStages')
    await page.waitForSelector('#rStart')
    ok((await text(page, '#rPaceV')) === '100 bpm', 'the builder forgot the tempo')
    await page.selectOption('#rPaced', '0')
    await page.waitForSelector('#rWiden')
  })

  await feature('3 Scales: stage run, Choose a scale, Quiz', page, async () => {
    await nav(page, 'scales')
    await page.click('#scales button[data-sstage].primary')
    await ready(page)
    const id = await ev(page, () => window.__piano.game.song.id)
    ok(/^scale:/.test(id), id)
    await page.click('#go')
    const r = await ev(page, () => window.__e2e.perform().then((r) => ({ acc: r.acc, clean: r.clean, even: r.even?.rating })))
    ok(r.clean && r.acc >= 0.95, `run not clean: ${JSON.stringify(r)}`)
    const card = await res(page, 'Results')
    ok(/A clean run at \d+ bpm: 1 of 3 in a row/.test(await card.textContent()), 'the clean run was not counted')
    await axe(page, 'scale results', '#res')
    const st = await ev(page, () => window.__e2e.snapshot().then((s) => JSON.parse(s.idb['scale:stats'])))
    ok(Object.values(st).some((x) => x.streak === 1 && x.n === 1), 'scale:stats not recorded')
    await page.click('#toLib')
    await wait(page, () => document.querySelector('#scales.on'))

    await page.click('label:has(input[name=scaleTab][value=pick])')
    for (const [form, hands, want] of [['major', 'contrary', /contrary motion/], ['chromatic', 'both', /hands together/], ['arpMajor', 'R', /right hand/]]) {
      await page.selectOption('#sgForm', form)
      await page.selectOption('#sgHands', hands)
      await page.click('#sgStart')
      await ready(page)
      const s = await ev(page, () => ({ id: window.__piano.game.song.id, title: document.querySelector('#title').textContent, hands: [...new Set(window.__piano.game.song.notes.map((n) => n.h))].join('') }))
      ok(s.id.startsWith(`scale:${form}:`) && want.test(s.title) && s.hands.length === (hands === 'R' ? 1 : 2), `${form} ${hands}: ${JSON.stringify(s)}`)
      await leave(page, 'scales')
    }

    await page.click('label:has(input[name=scaleTab][value=quiz])')
    for (let i = 0; i < 10; i++) {
      await wait(page, (i) => document.querySelector('#scales [aria-label=Quiz] .fine')?.textContent.startsWith(`Card ${i + 1} of`) && !document.querySelector('#qNext'), i)
      for (let p = 60; p < 72 && !(await page.$('#qNext')); p++) await ev(page, (p) => (window.__piano.key(p, 0.6), window.__piano.up(p)), p)
      ok(await page.$('#qNext'), `quiz card ${i + 1} took no answer from the keyboard`)
      await page.click('#qNext')
    }
    await page.waitForSelector('#scales [aria-label="Quiz results"]')
    ok(/\d+ of 10/.test(await text(page, '#scales [aria-label="Quiz results"] h2')), 'no quiz score')
  })

  await theory(page, ['chords', 'cadences'])

  await feature('5 Read through: look-through, start early, play, summary, Loop these bars', page, async () => {
    await nav(page, 'songs')
    await rowClick(page, '#library [data-rt^=starter-twinkle]')
    await ready(page)
    ok(await page.isVisible('#rtGo'), 'no look-through card')
    await wait(page, () => document.querySelector('#rtLeft')?.textContent !== '0:30', undefined, 3000) // the look-through counts down
    await axe(page, 'look-through card', '#ready')
    for (let i = 0; i < 11; i++) await page.click('#rtFaster')
    ok((await text(page, '#rtRate')) === '125%', `tempo ${await text(page, '#rtRate')}`)
    await page.click('#rtGo')
    const skip = await ev(page, () => window.__piano.game.song.notes.flatMap((n, i) => (n.bar === 2 ? [i] : [])))
    const r = await ev(page, (skip) => window.__e2e.perform({ skip }).then((r) => ({ miss: r.counts.miss, wrong: r.wrong })), skip)
    const card = await res(page, 'Read-through summary')
    ok(skip.length && r.miss === skip.length && !r.wrong, `${r.miss} missed, ${r.wrong} wrong, ${skip.length} left out`)
    ok(/Slipped in bar 3/.test(await card.textContent()), 'the left-out bar is not named')
    await axe(page, 'read-through summary', '#res')
    await page.click('#rtFix')
    await wait(page, () => window.__piano.game.mode === 'learn' && window.__piano.game.loop && Math.abs(window.__piano.game.rate - 0.7) < 1e-6)
    await leave(page, 'library')
  })

  await feature('6 Technique: evenness marks, faint and test runs', page, async () => {
    await nav(page, 'technique')
    await page.selectOption('#tPattern', 'five')
    await page.selectOption('#tBpm', '120')
    const seen = []
    for (let run = 1; run <= 5; run++) {
      await page.click('#tStart')
      await ready(page)
      await page.click('#go')
      const r = await ev(page, () => window.__e2e.perform({ loud: 4 }).then((r) => ({ even: r.even?.rating, acc: r.acc })))
      const marks = await ev(page, () => ({ dev: window.__marks, faint: document.querySelector('#staff').classList.contains('marks-faint') }))
      const card = await res(page, 'Results')
      const test = /A test run/.test(await card.textContent())
      seen.push(`${run}:${r.even}/${marks.dev ? 'marks' : 'none'}${marks.faint ? '/faint' : ''}${test ? '/test' : ''}`)
      ok(await card.$('svg.even'), `run ${run}: no evenness strip`)
      if (run === 1) await axe(page, 'technique results', '#res')
      await page.click('#toLib')
      await wait(page, () => document.querySelector('#technique.on'))
    }
    // three even runs with live marks, the 4th a test run with none, the 5th faint
    ok(seen.join() === '1:even/marks,2:even/marks,3:even/marks,4:even/none/test,5:even/marks/faint', seen.join(' '))
    const tech = await ev(page, () => window.__e2e.snapshot().then((s) => JSON.parse(s.idb['tech:stats'] ?? '{}')))
    ok(Object.values(tech).some((x) => x.runs === 5), `tech:stats ${JSON.stringify(tech)}`)
  })

  await feature('7b Songs: start card Notes shown, saved', page, async () => {
    await nav(page, 'songs')
    await page.click('#library tr.open[data-open="starter-greensleeves"]')
    await ready(page)
    await page.waitForSelector('#ready label:has(input[name=level][value="2"])')
    await axe(page, 'start card', '#ready')
    await ev(page, () => (document.querySelector('#ready b').dataset.old = '1'))
    await page.click('#ready label:has(input[name=level][value="2"])')
    // the piece opens again with fewer notes: wait for the new card, or Escape races the reopen
    await wait(page, () => document.querySelector('#ready b:not([data-old])') && document.querySelector('#ready input[name=level][value="2"]')?.checked)
    await leave(page, 'library')
  })

  await feature('8 Progress: Over time, Notes you know, Path', page, async () => {
    await nav(page, 'progress')
    const h = await ev(page, () => [...document.querySelectorAll('#progress h2.sec')].map((x) => x.textContent))
    for (const want of ['Over time', 'Notes you know', 'Path']) ok(h.includes(want), `no ${want} (${h.join(', ')})`)
    const charts = await ev(page, () => [...document.querySelectorAll('#progress .otc .label')].map((x) => x.textContent))
    for (const k of ['Theory', 'Technique']) ok(charts.includes(k), `no ${k} chart: ${charts.join(', ')}`)
    ok(await page.$('#progress svg.known rect.seen'), 'no note drawn as known')
  })

  let file
  let before
  await feature('9a Export', page, async () => {
    before = await ev(page, () => window.__e2e.snapshot())
    for (const k of ['drill:stats', 'run:state', 'scale:stats', 'scale:quiz', 'theory:stats', 'history:log', 'coach:stats', 'tech:stats', 'touch:log', 'practice:days']) ok(before.idb[k], `nothing stored under ${k} before export`)
    await page.click('#settingsBtn')
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#sExport')])
    file = join(OUT, 'export.json')
    await dl.saveAs(file)
    ok(JSON.parse(readFileSync(file, 'utf8')).version === 1, 'export is not a version 1 file')
  })

  await feature('10 Clear all data', page, async () => {
    ok(file, 'no export to restore afterwards')
    await page.click('#drawer [data-more]') // Delete all data is in the Data row's More menu
    await Promise.all([page.waitForEvent('load'), page.click('#sClear')]) // confirm accepted by the dialog handler
    await page.waitForFunction(() => window.__piano && document.querySelector('#today.on .plan'))
    await ev(page, () => window.__e2e.hook())
    const after = await ev(page, () => window.__e2e.snapshot())
    const left = after.keys.filter((k) => !/^(catalog$|libfile:|snap:)/.test(k)) // Today writes this week's snapshot again on boot
    ok(!left.length, `left after Clear: ${left.join(', ')}`)
    ok(!after.ls['piano.settings'], 'settings left after Clear')
    const ls = Object.keys(after.ls)
    if (ls.length) console.log(`     note: localStorage after Clear still has ${ls.join(', ')}`)
  })

  await feature('9b Import restores everything exported', page, async () => {
    if (!file) throw new Error('no export file')
    await page.click('#settingsBtn')
    await Promise.all([page.waitForEvent('load'), page.setInputFiles('#sFile', file)])
    await page.waitForFunction(() => window.__piano && document.querySelector('#today.on .plan'))
    const after = await ev(page, () => window.__e2e.snapshot())
    const lost = Object.keys(before.idb).filter((k) => !after.idb[k]) // this week's snap: is written again on boot; older weeks would show here
    const changed = Object.keys(before.idb).filter((k) => after.idb[k] && after.idb[k] !== before.idb[k] && !/^(snap:|practice:)/.test(k))
    ok(after.ls['piano.settings'] === before.ls['piano.settings'], 'settings not restored')
    ok(!lost.length && !changed.length, `${lost.length ? `not restored: ${lost.join(', ')}` : ''}${changed.length ? ` changed: ${changed.join(', ')}` : ''}`)
  })
  return page
}

const isPulse = (t) => ['keepbeat', 'subdiv', 'holdrhythm'].includes(t)
const LEVEL = { chords: '3', cadences: '3', earchord: '3' } // chords and chord ear 3: inversions, the lowest note matters
async function theory(page, trainers) {
  await feature(`4 Theory: ${trainers.join(', ')}`, page, async () => {
    await nav(page, 'theory')
    for (const t of trainers) if (LEVEL[t]) await page.selectOption(`select[data-tlevel=${t}]`, LEVEL[t])
    for (const t of trainers) {
      await page.click(`button[data-trainer=${t}]`)
      const r = await ev(page, () => window.__e2e.theory(240000))
      ok(r.ok === r.n, `${t}: ${r.ok} of ${r.n} (${r.why})`)
      await page.waitForSelector('#theory [aria-label="Session results"]')
      ok((await text(page, '#theory h2')).startsWith(`${r.n} of ${r.n}`), `${t} results`)
      if (t === 'chords') await axe(page, 'Theory results', '#theory')
      if (t === 'rhythm' || isPulse(t)) ok(/Over the session/.test(await text(page, '#theory')), 'no rhythm summary')
      await page.click('#thMenu')
    }
    if (trainers.some((t) => t.startsWith('ear'))) ok(await ev(page, () => !!window.__ear), 'the __ear hook never appeared')
  })
}

// ---------------------------------------------------------------- side profiles, run alongside: the ear trainers are slow by design

async function side(trainers) {
  if (!ONLY.test(`4 Theory: ${trainers.join(', ')}`)) return
  const page = await open()
  await skipSetup(page)
  await theory(page, trainers)
}

async function songsFlow() {
  if (!ONLY.test('7 Songs')) return
  const page = await open()
  await skipSetup(page)
  await feature('7 Songs: 5,000-row search, paging, bundled piece, fix-it chain', page, async () => {
    await ev(page, () => window.__piano.catalog(5000))
    await page.check('input[name=libLane][value=all]', { force: true }) // the list opens on Pieces: the synthetic catalogue has Lieder and studies too
    await wait(page, () => document.querySelector('#libCount')?.textContent === '5,000')
    ok((await page.$$('#libRows tr[data-lib]')).length === 50, 'first page is not 50 rows')
    await page.click('#libMore')
    await wait(page, () => document.querySelectorAll('#libRows tr[data-lib]').length === 100)
    await page.fill('#libQ', 'nocturne')
    await wait(page, () => Number(document.querySelector('#libCount').textContent.replace(/,/g, '')) < 5000)
    const n = Number((await text(page, '#libCount')).replace(/,/g, ''))
    const shown = await page.$$eval('#libRows tr[data-lib] td.name', (t) => t.map((x) => x.textContent.toLowerCase()))
    ok(n > 0 && shown.length === Math.min(50, n) && shown.every((t) => t.includes('nocturne')), `search: ${n} hits, ${shown.length} shown`)
    ok(await ev(page, () => document.activeElement?.id === 'libQ'), 'search lost focus')
    await axe(page, 'Songs with 5,000 rows', '#library')

    await boot(page) // the synthetic catalogue lives in memory only: back to the bundled one
    await nav(page, 'songs')
    await page.click('#library tr[data-lib] [data-libplay][data-mode=learn] >> nth=0')
    await ready(page)
    ok((await ev(page, () => window.__piano.game.mode)) === 'learn', 'not in Learn')
    const bars = await ev(page, () => window.__piano.game.song.bars.length)
    ok(bars >= 4, `${bars} bars`)
    // drag the scrubber across bars 1 and 2: a loop
    const x = await ev(page, () => {
      const r = document.querySelector('#scrub').getBoundingClientRect()
      const s = window.__piano.game.song
      const at = (b) => r.left + ((s.bars[b].t0 + s.bars[b].t1) / 2 / s.end) * r.width
      return { a: at(0), b: at(1), y: r.top + r.height / 2 }
    })
    await page.mouse.move(x.a, x.y)
    await page.mouse.down()
    await page.mouse.move(x.b, x.y, { steps: 5 })
    await page.mouse.up()
    const b0 = await ev(page, () => window.__piano.game.loop?.b)
    ok(b0, 'dragging the scrubber made no loop')
    await page.click('#go')
    await ev(page, (b0) => window.__e2e.follow(`g.loop && g.loop.b > ${b0}`, 120000), b0)
    ok(/Clean three times/.test(await text(page, '#banner')), 'no fix-it message')
    await leave(page, 'library')
  })
  // a synthetic catalogue whose sidecar is served from the page: every piece's opening bars are the first starter's
  const sidecar = (page) =>
    ev(page, async () => {
      const [{ encode }, { fromSpec }, { STARTERS }] = await Promise.all([import('/src/incipit.ts'), import('/src/song.ts'), import('/src/starters.ts')])
      const enc = encode(fromSpec(STARTERS[0].spec))
      const orig = window.fetch
      window.fetch = (u, ...a) => (String(u).includes('/i/synthetic.json') ? Promise.resolve(new Response(JSON.stringify({ v: 1, p: Object.fromEntries(Array.from({ length: 5000 }, (_, i) => [`syn-${i}`, enc])) }))) : orig(u, ...a))
    })
  await feature('7 Songs: a library row not on the device shows noteheads from the sidecar', page, async () => {
    await boot(page)
    await sidecar(page)
    await ev(page, () => window.__piano.catalog(300))
    await wait(page, () => document.querySelector('#libRows tr[data-lib]'))
    await page.locator('#libRows').scrollIntoViewIfNeeded() // covers are drawn as their rows come into view
    await wait(page, () => document.querySelectorAll('#libRows .cover[data-drawn]').length >= 3)
    const rows = await page.$$eval('#libRows .cover[data-drawn]', (cs) => cs.map((c) => ({ id: c.dataset.cv, heads: c.querySelectorAll('text.head').length })))
    ok(rows.every((r) => r.id.startsWith('lib:syn-') && r.heads > 0), `rows without noteheads: ${JSON.stringify(rows)}`) // none of these pieces is on the device
    await axe(page, 'Songs with covers from the sidecar', '#library')
  })
  await feature('7 Songs: a zero result names its filters, and one tap on a removal brings the count back', page, async () => {
    await boot(page)
    await sidecar(page)
    await ev(page, () => window.__piano.catalog(300))
    await wait(page, () => document.querySelector('#libRows tr[data-lib]'))
    const count = async () => Number((await text(page, '#libCount')).replace(/,/g, ''))
    const all = await count()
    await page.selectOption('#libPeriod', 'baroque')
    const baroque = await count()
    ok(baroque > 0 && baroque < all, `Baroque: ${baroque} of ${all}`)
    await page.fill('#libQ', 'zzqq')
    await wait(page, () => document.querySelector('#libRows td.zero'))
    const zero = await text(page, '#libRows td.zero')
    ok(/zzqq/.test(zero) && /Baroque/.test(zero), `the zero state does not name its filters: ${zero}`)
    ok((await count()) === 0, 'count is not zero')
    await page.click('#libRows td.zero [data-rm=q]')
    await wait(page, () => document.querySelector('#libRows tr[data-lib]'))
    ok((await count()) === baroque, `clearing the search gave ${await count()}, not ${baroque}`)
    ok(await ev(page, () => document.activeElement?.id === 'libQ'), 'focus did not return to the search box')
    // a filter that is the cause: Studies, with the title of a piece that is not one
    const title = await page.$eval('#libRows tr[data-lib] td.name', (t) => t.firstChild.textContent.trim())
    await page.click('#libChips [data-rm=period]')
    await page.check('input[name=libLane][value=study]', { force: true })
    await page.fill('#libQ', title)
    await wait(page, () => document.querySelector('#libRows td.zero'))
    const w = await page.$eval('#libRows td.zero [data-rm=lane]', (b) => b.textContent)
    const n = Number(/\+([\d,]+)/.exec(w)[1].replace(/,/g, ''))
    await page.click('#libRows td.zero [data-rm=lane]')
    await wait(page, () => document.querySelector('#libRows tr[data-lib]'))
    ok((await count()) === n, `showing every kind gave ${await count()}, the button said ${n}`)
    // the Studies lane has its own note and lists only studies
    await page.fill('#libQ', '')
    await page.check('input[name=libLane][value=study]', { force: true })
    await wait(page, () => /exercises, not pieces/.test(document.querySelector('#libNote')?.textContent ?? ''))
    ok((await page.$$('#libRows tr[data-lib]')).length > 0, 'no study listed')
    await axe(page, 'Songs, Studies lane', '#library')
  })
  await feature('7 Songs: 40 covers drawn from their sidecar entries equal the ones drawn from their scores, string for string', page, async () => {
    await boot(page)
    const r = await ev(page, async () => {
      const [inc, store, { settings }, { draw }, { fromSpec }, { STARTERS }] = await Promise.all([import('/src/incipit.ts'), import('/src/store.ts'), import('/src/settings.ts'), import('/src/cover-draw.ts'), import('/src/song.ts'), import('/src/starters.ts')])
      const man = await (await fetch('/library/manifest.json')).json()
      const songs = [...STARTERS.map((s) => fromSpec(s.spec))]
      for (const m of man) songs.push(await store.toSong({ id: m.id, title: m.title, bytes: await (await fetch('/library/' + m.file)).arrayBuffer(), added: 0, kind: m.format === 'midi' ? 'midi' : 'xml' }, settings.split))
      const bad = []
      for (const song of songs) {
        const got = inc.decode(JSON.parse(JSON.stringify(inc.encode(song))), { id: song.id, title: song.title, fifths: song.fifths, lo: song.lo, hi: song.hi })
        for (const size of ['thumb', 'card']) if (draw(inc.incipit(song), undefined, size) !== draw(got, undefined, size)) bad.push(`${song.id} ${size}`)
      }
      return { n: songs.length, bad }
    })
    ok(r.n >= 40, `only ${r.n} scores`)
    ok(!r.bad.length, `${r.bad.length} of ${r.n} differ: ${r.bad.slice(0, 5)}`)
  })
}

// ---------------------------------------------------------------- later features, each on a fresh profile of its own, closed when done

async function fresh(fs, opts, routes) {
  const names = Object.keys(fs).filter((n) => ONLY.test(n))
  if (!names.length) return
  const page = await open(opts, routes)
  await skipSetup(page)
  for (const n of names) await feature(n, page, () => fs[n](page))
  await page.context().close()
}
const openStarter = async (page, id, mode = 'perform') => {
  await nav(page, 'songs')
  await rowClick(page, `#library button[data-play="${id}"][data-mode=${mode}]`)
  await ready(page)
}

const guideFlow = () => fresh({
  async '12 Start here: card, Start, Skip, Hide; Help'(page) {
    const card = '#today section.guide'
    ok(/Day 1 of 7/.test(await text(page, card)), 'no Start here card at day 1 on a fresh profile')
    await axe(page, 'Start here card', card)
    await page.click(`${card} li.gstep.now button[data-today=guide]`)
    await ready(page)
    ok((await ev(page, () => window.__piano.game.song.id)) === 'drill:t-land', 'Start did not open Treble landmarks')
    await leave(page, 'read')
    await nav(page, 'today')
    await page.click(`${card} button[data-guide=skip][data-n="1"]`)
    await wait(page, () => /Skipped/.test(document.querySelector('#today .guide li.gstep')?.textContent))
    await boot(page)
    ok(/Skipped/.test(await text(page, `${card} li.gstep`)), 'Skip not remembered')
    await page.click(`${card} button[data-guide=hide]`)
    await wait(page, () => !document.querySelector('#today .guide'))
    await boot(page)
    ok(!(await page.$(card)), 'Hide not remembered')
    await page.keyboard.press('?')
    await page.waitForSelector('dialog#help[open] h2')
    await wait(page, () => /How touch feedback works/.test(document.querySelector('#help').textContent), undefined, 5000) // the text arrives with ui-sheets
    await axe(page, 'Help sheet', '#help')
    await page.keyboard.press('Escape')
    await page.waitForSelector('dialog#help:not([open])', { state: 'attached' })
    await page.click('#settingsBtn')
    await page.click('#sHelp')
    await page.waitForSelector('dialog#help[open]')
    await page.keyboard.press('Escape')
    await page.waitForSelector('dialog#help:not([open])', { state: 'attached' })
    await page.keyboard.press('Escape') // the drawer
  },
})

// level 1's three pieces are bundled, so Start needs no network
const ladderFlow = () => fresh({
  async '13 Path ladder: Not started, Learning, Ready; Start opens a piece'(page) {
    await ev(page, async () => {
      await window.__e2e.idb('prog:lib:mutopia-647', { plays: 2, last: Date.now(), heat: [] })
      await window.__e2e.idb('prog:lib:mutopia-1806', { plays: 4, last: Date.now(), heat: [], days: [20380, 20381] })
    })
    await nav(page, 'progress')
    const lv = await ev(page, () => {
      const d = document.querySelector('#progress button[data-ladder="mutopia-75"]').closest('details')
      d.open = true
      return { sum: d.querySelector('summary').textContent, st: Object.fromEntries([...d.querySelectorAll('button[data-ladder]')].map((b) => [b.dataset.ladder, b.closest('li').querySelector('.rqs span').textContent])) }
    })
    ok(lv.st['mutopia-75'] === 'Not started' && lv.st['mutopia-647'] === 'Learning' && lv.st['mutopia-1806'] === 'Ready', JSON.stringify(lv.st))
    ok(/1 of 3 pieces ready/.test(lv.sum), lv.sum)
    await axe(page, 'Path with pieces', '#progress')
    await page.click('#progress button[data-ladder="mutopia-75"]')
    await ready(page)
    const s = await ev(page, () => ({ id: window.__piano.game.song.id, mode: window.__piano.game.mode }))
    ok(s.id === 'lib:mutopia-75' && s.mode === 'learn', JSON.stringify(s))
    await leave(page, 'progress') // back where it was opened from (feature 23)
  },
})

// docs/changes/studies-packs.md: Studies on Technique, a pack started, a pack brought in by link and by file. The corpus is a one-piece catalogue:
// Hanon No. 1 played from a bundled file's bytes, so the Hanon pack has a piece to start without the network.
const hanonBytes = readFileSync(new URL('../../public/library/mutopia-2080.mid', import.meta.url))
const packsFlow = () => fresh({
  async '25 Packs: Technique opens on Studies; the Hanon warm-up starts No. 1 slow, and its row then holds the lamp'(page) {
    await wait(page, () => import('/src/catalog.ts').then((m) => !!m.piece('mutopia-2037-1')))
    await nav(page, 'technique')
    await page.waitForSelector('#technique [data-pk-go=hanon-warmup]')
    const h = await ev(page, () => [...document.querySelectorAll('#technique h2.sec')].map((x) => x.textContent))
    ok(h[0] === 'Studies' && h[1] === 'Exercises', h.join(', '))
    ok(/Today: No\. 1$/.test(await text(page, '#technique .packs .prow span:not(.pn):not(.tag)')), await text(page, '#technique .packs .prow')) // the one Hanon piece this catalogue has
    await page.click('#technique [data-pk-go=hanon-warmup]')
    await ready(page)
    const s = await ev(page, () => ({ id: window.__piano.game.song.id, mode: window.__piano.game.mode, rate: window.__piano.game.rate }))
    ok(s.id === 'lib:mutopia-2037-1' && s.mode === 'learn' && s.rate === 0.6, JSON.stringify(s))
    await leave(page, 'technique')
    await page.waitForSelector('#technique .packs button.primary[data-pk-go=hanon-warmup]')
    ok(!(await page.$('#tStart.primary')), 'two lamps on Technique')
    await page.click('#technique [data-pk-list=hanon-warmup]')
    await page.waitForSelector('dialog#pack[open] li')
    ok((await page.$$('dialog#pack li')).length === 20, 'the Hanon list is not 20 long')
    ok(!/Level/.test(await text(page, 'dialog#pack')), 'a level shown for Hanon (decision 26)')
    await axe(page, 'pack sheet', 'dialog#pack')
    await page.keyboard.press('Escape')
    await axe(page, 'technique with studies', '#technique')
  },
  async '25b Packs: a link adds a pack and opens its list, its first item starts with note names off; a file adds one too; both are kept'(page) {
    const frag = await ev(page, () => import('/src/pack.ts').then((m) => m.packFragment({ pf: 1, id: 'teacher', title: 'Week one', by: 'Ms Lee', items: [{ piece: 'mutopia-647', note: 'Left hand alone first.', rate: 0.7, view: { names: false } }, { read: 't-land' }, { piece: 'not-here' }] })))
    await page.goto(`${URL_}#${frag}`)
    await page.waitForSelector('dialog#pack[open] #pkTitle')
    ok((await text(page, '#pkTitle')) === 'Week one' && /Added from a link/.test(await text(page, '#pkSay')), await text(page, 'dialog#pack'))
    ok(/From a link/.test(await text(page, 'dialog#pack header')), 'origin not shown')
    ok(await page.$('dialog#pack li.missing'), 'an unknown id is not greyed')
    ok(!(await ev(page, () => location.hash)), 'the link stays in the address')
    await page.click('dialog#pack footer .primary')
    await ready(page)
    const s = await ev(page, () => ({ id: window.__piano.game.song.id, aids: window.__piano.game.song.aids, rate: window.__piano.game.rate }))
    ok(s.id === 'lib:mutopia-647' && s.aids?.names === false && s.rate === 0.7, JSON.stringify(s))
    await leave(page, 'library')
    await page.waitForSelector('#pkChip[aria-expanded=true]')
    ok(/Week one/.test(await text(page, '#pkSongs')), 'the pack is not on Songs')
    await page.setInputFiles('#pkSongs [data-pk-input]', { name: 'week-two.pfpack', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ pf: 1, id: 'week-two', title: 'Week two', by: 'Ms Lee', kind: 'study', items: [{ drill: { pattern: 'five', tonic: 0, dyn: 'soft', hands: 'L', bpm: 60 } }] })) })
    await page.waitForSelector('#technique.on')
    await page.waitForSelector('dialog#pack[open]')
    ok((await text(page, '#pkTitle')) === 'Week two', await text(page, '#pkTitle'))
    await page.keyboard.press('Escape')
    const idb = (await ev(page, () => window.__e2e.snapshot())).idb
    ok(JSON.parse(idb['pack:teacher']).from === 'link' && JSON.parse(idb['pack:week-two']).pack.title === 'Week two', Object.keys(idb).filter((k) => k.startsWith('pack:')).join())
  },
}, {}, async (ctx) => {
  const sha = createHash('sha256').update(hanonBytes).digest('hex')
  const hanon = { id: 'mutopia-2037-1', title: 'The Virtuoso Pianist (Part I): Movement 1', composer: 0, fifths: 0, bars: 8, sec: 20, bpm: 100, notes: 64, lo: 48, hi: 79, tracks: 1, kind: 'study', grade: 4, gradeWhy: [], tags: ['technique'], source: 'mutopia', sourceUrl: 'https://www.mutopiaproject.org/', licenceEvidence: 'e2e', licence: 0, edition: 'e2e', quality: 1, flags: [], format: 'midi', file: 'p/hanon1.mid', bytes: hanonBytes.length, sha256: sha }
  await ctx.route('**/corpus/catalog.json', (r) => r.fulfill({ json: { v: 1, built: 'e2e-packs', composers: [{ name: 'C. L. Hanon', died: 1900 }], licences: [{ id: 'Public Domain', url: 'https://creativecommons.org/publicdomain/mark/1.0/' }], pieces: [hanon] } }))
  await ctx.route('**/corpus/p/hanon1.mid', (r) => r.fulfill({ body: hanonBytes, contentType: 'audio/midi' }))
})

// docs/changes/shellfix.md: Escape, stale opens, the way back, focus kept across redraws, a second Songs render
const shellFlow = () => fresh({
  async '23 Shell: Escape in Aids stays, first Escape pauses, back to where it was opened, focus kept, stale open, one library'(page) {
    const focusIn = (sel) => ev(page, (s) => !!document.activeElement?.closest(s) && document.activeElement !== document.body, sel)
    await openStarter(page, 'starter-greensleeves', 'learn')
    await page.click('#aidsBtn')
    await page.focus('#aidsMenu input')
    await page.keyboard.press('Escape')
    ok(await ev(page, () => document.querySelector('#aidsMenu').hidden && document.querySelector('#play.on')), 'Escape in Aids left the piece')
    // a tap or click leaves focus on the button, not in the menu: Escape there closes the menu and stays (UX-2, A11Y-1)
    for (const id of ['tempoBtn', 'aidsBtn']) {
      await page.click(`#${id}`)
      ok(await ev(page, () => !!document.querySelector('#dock .popmenu:not([hidden])')), `${id} did not open its menu`)
      await page.keyboard.press('Escape')
      ok(await ev(page, (b) => !document.querySelector('#dock .popmenu:not([hidden])') && document.querySelector('#play.on') && document.activeElement?.id === b, id), `Escape on ${id} left the piece, or dropped focus`)
    }
    // Staff view: the start card goes over the paper and holds Perform | Learn and Notes shown whole (UX-1); the way back is on the bar, named for where it goes (UX-3)
    await ev(page, () => window.__piano.setView('sheet'))
    await page.waitForTimeout(500)
    ok(await ev(page, () => {
      const r = document.querySelector('#ready').getBoundingClientRect()
      const k = (s) => document.querySelector(`#ready ${s}`)?.getBoundingClientRect()
      const [seg, shows] = [k('.seg'), k('.shows')]
      const stage = document.querySelector('#stage').getBoundingClientRect()
      const inside = (b) => b && b.height > 0 && b.top >= r.top - 1 && b.bottom <= r.bottom + 1
      return r.bottom <= stage.top && inside(seg) && inside(shows) && document.querySelector('#ready input[name=modeSheet][value=perform]') && r.top > document.querySelector('.bar').getBoundingClientRect().bottom
    }), 'the Staff view start card is cut off or on the keys')
    await ev(page, () => window.__piano.setView('both'))
    ok(await ev(page, () => document.querySelector('#stagesBtn').offsetWidth > 0 && /^Back to /.test(document.querySelector('#stagesBtn').getAttribute('aria-label') ?? '')), 'no visible way back on the play screen')
    // the start card redraws on a choice: focus stays on it, so arrow keys walk the group
    await page.focus('#ready input[name=modeSheet]:checked')
    await page.keyboard.press('ArrowLeft')
    await wait(page, () => window.__piano.game.mode === 'perform')
    ok(await ev(page, () => document.activeElement?.matches('#ready input[name=modeSheet][value=perform]')), 'focus lost after Perform/Learn')
    await page.focus('#ready input[name=level]:checked')
    await page.keyboard.press('ArrowRight')
    await wait(page, () => document.querySelector('#ready input[name=level][value="1"]')?.checked)
    await wait(page, () => document.activeElement?.matches('#ready input[name=level][value="1"]'), undefined, 5000)
    await page.keyboard.press('ArrowLeft')
    await wait(page, () => document.querySelector('#ready input[name=level][value="0"]')?.checked && document.activeElement?.matches('#ready input[name=level][value="0"]'), undefined, 5000)
    // the drawer redraws on Sound: focus stays inside it
    await page.click('#settingsBtn')
    await page.focus('#drawer input[name=sound]:checked')
    await page.keyboard.press('ArrowRight')
    ok(await focusIn('#drawer'), 'focus left the drawer after Sound')
    await page.keyboard.press('Escape')
    // Escape mid-run pauses, the next one leaves, to Songs (opened there), and the PF button is Today again
    // Play pressed while a Notes shown choice reloads the piece: the run keeps going on the notes it started with
    await page.evaluate(() => (document.activeElement.blur(), document.querySelector('#ready input[name=level][value="4"]').click(), window.__piano.game.toggle()))
    await wait(page, () => ['countin', 'playing'].includes(window.__piano.game.phase))
    await page.waitForTimeout(1500)
    ok(await ev(page, () => ['countin', 'playing'].includes(window.__piano.game.phase)), `the reopen reset the run: ${await ev(page, () => window.__piano.game.phase + ' ' + window.__piano.game.song.notes.length + ' ' + document.querySelector('#play.on')?.id)}`)
    await page.keyboard.press('Escape')
    ok(await ev(page, () => window.__piano.game.phase === 'paused' && document.querySelector('#play.on')), 'the first Escape did not pause')
    await page.keyboard.press('Escape')
    await wait(page, () => document.querySelector('#library.on'))
    ok((await page.getAttribute('#brand', 'aria-label')) === 'Piano Forte: Today', 'PF still says leave this piece')
    // opened from Today, back to Today
    await nav(page, 'today')
    await ev(page, () => window.__piano.open(0, 'learn'))
    await ready(page)
    await page.keyboard.press('Escape')
    await wait(page, () => document.querySelector('#today.on'))
    // a piece still opening when another page is chosen stays off the screen
    await ev(page, () => (window.__piano.open(2, 'learn'), document.querySelector('#nav input[value=read]').click()))
    await page.waitForTimeout(2000)
    ok(await ev(page, () => document.querySelector('#read.on') && !document.querySelector('#play.on') && !document.querySelector('#nav').hidden), 'a stale open took over the Read page')
    // two Songs renders in flight: one open library
    await ev(page, () => (document.querySelector('#nav input[value=songs]').click(), window.__piano.catalog(300)))
    await page.check('input[name=libLane][value=all]', { force: true }) // the synthetic catalogue has Lieder and studies, and the list opens on Pieces
    await wait(page, () => document.querySelector('#libCount')?.textContent === '300')
    await page.waitForTimeout(500)
    ok((await page.$$('#libQ')).length === 1, `${(await page.$$('#libQ')).length} search boxes`)
    // the Read tabs and the Sight Run form keep focus
    await nav(page, 'read')
    await page.focus('#read input[name=readTab]:checked')
    await page.keyboard.press('ArrowRight')
    await wait(page, () => document.querySelector('#rClef') && document.activeElement?.matches('#read input[name=readTab][value=run]'), undefined, 5000)
    await page.focus('#rClef')
    await page.selectOption('#rClef', 'bass')
    await wait(page, () => document.activeElement?.id === 'rClef', undefined, 5000)
    // leaving right after the last note: the results code must not throw (any page error fails this feature)
    await ev(page, () => window.__piano.open(0, 'perform'))
    await ready(page)
    await ev(page, () => window.__piano.game.on((e) => e.type === 'done' && document.querySelector('#play.on') && document.querySelector('#brand').click()))
    await page.click('#go')
    await ev(page, () => window.__e2e.perform())
    await wait(page, () => document.querySelector('#read.on'))
    await page.waitForTimeout(500)
  },
})

const fluentFlow = () => fresh({
  async '19 Read: Fluent tag, then Faster once only Solid'(page) {
    await ev(page, () => window.__piano.solidUpTo(3)) // three stages answered in 1.2 s a card: inside the Fluent clock
    const tags = () => ev(page, () => [...document.querySelectorAll('#read tr')].filter((r) => r.querySelector('button[data-stage]')).slice(0, 4).map((r) => (r.querySelector('td.name .tag:not(.next)')?.textContent ?? '-') + (r.querySelector('button[data-fast]') ? '/speed' : '')))
    ok((await tags()).join() === 'Fluent,Fluent,Fluent,-', `rows ${(await tags()).join()}`)
    await ev(page, async () => { const s = await window.__e2e.idb('drill:stats'); for (const k in s) s[k].rt = 2000; await window.__e2e.idb('drill:stats', s) }) // Solid (2.5 s) but not Fluent (1.5 s)
    await redraw(page, 'read')
    ok((await tags()).join() === '-/speed,-/speed,-/speed,-', `rows ${(await tags()).join()}`)
    ok(/Solid · Fluent under 1.5 s a card/.test(await text(page, '#read table')), 'no "Fluent under" line')
    await page.click('#read button[aria-label="Practise Treble landmarks faster"]')
    await ready(page)
    ok((await text(page, '#title')).includes('for speed'), 'Faster did not start a speed set')
    await leave(page, 'read')
  },
})

const oskFlow = () => fresh({
  async '14 On-screen keys: Theory chord and Scales quiz by touch'(page) {
    const tap = async (p) => {
      const at = await page.$eval(`#osk i[data-p="${p}"]`, (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * (e.classList.contains('b') ? 0.4 : 0.85) } })
      await page.touchscreen.tap(at.x, at.y)
    }
    await nav(page, 'theory')
    ok(await page.isHidden('#osk'), 'keys shown on the Theory menu')
    await page.click('button[data-trainer=chords]')
    await page.waitForSelector('#osk:not([hidden]) i[data-p="60"]')
    const pcs = await ev(page, () => window.__piano.theory().cards[0].steps[0].pcs)
    for (const pc of pcs) await tap(60 + pc)
    await wait(page, () => window.__piano.theory()?.answered, undefined, 5000)
    ok((await ev(page, () => window.__piano.theory().answered)) === 'ok', `chord ${pcs} by touch was judged a miss`)
    await page.click('#thMenu')
    await wait(page, () => document.querySelector('#osk').hidden)
    await nav(page, 'scales')
    await page.click('label:has(input[name=scaleTab][value=quiz])')
    await page.waitForSelector('#osk:not([hidden]) i[data-p="60"]')
    for (let p = 60; p < 72 && !(await page.$('#qNext')); p++) await tap(p)
    ok(await page.$('#qNext'), 'the quiz card took no answer by touch')
  },
}, { hasTouch: true })

const accompFlow = () => fresh({
  async '15 Accompaniment: you play the right hand; a Lied, you play the piano'(page) {
    // the app's notes come as 'auto' events (game.ts plays each through audio.noteOn as it emits it); only yours are judged
    const run = async (choose, says) => {
      await page.click(choose)
      await wait(page, (s) => document.querySelector('#ready .accomp')?.textContent.includes(s), says)
      const want = await ev(page, () => { const g = window.__piano.game, n = g.song.notes; return { app: n.filter((x) => g.modeOf(x) === 'listen').length, you: n.filter((x) => g.modeOf(x) === 'play').length } })
      await ev(page, () => (window.__auto = []))
      await page.click('#go')
      const r = await ev(page, () => window.__e2e.perform().then((r) => ({ judged: r.counts.perfect + r.counts.great + r.counts.good + r.counts.miss, miss: r.counts.miss, auto: window.__auto.length })))
      ok(want.app && r.auto === want.app && r.judged === want.you && !r.miss, `app played ${r.auto} of ${want.app}; judged ${r.judged} of ${want.you}, ${r.miss} missed`)
      ok(/Judged on your part only/.test(await (await res(page, 'Results')).textContent()), 'results do not say only your part was judged')
      await leave(page, 'library')
    }
    await openStarter(page, 'starter-five-finger')
    await run('#ready label:has(input[name=you][value=R])', 'The app plays the left hand')
    await page.fill('#libQ', 'Die Rose, die Lilie')
    await rowClick(page, '#library [data-libplay="lieder-lc4976849"][data-mode=perform]')
    await ready(page)
    await ev(page, () => window.__piano.game.setRate(1.25)) // a long song: Perform at its top tempo
    await run('#ready .accomp label:has-text("Piano")', 'The app plays the voice part')
  },
})

const recorderFlow = () => fresh({
  async '16 Recorder: two runs, Compare, Listen back, Ghost; Listen to a piece'(page) {
    await openStarter(page, 'starter-five-finger')
    ok(!(await page.$('#ghostOn')), 'a Ghost switch before any run')
    await page.click('#go')
    await ev(page, () => window.__e2e.perform())
    await res(page, 'Results')
    await page.waitForSelector('#res #listenBack', { state: 'attached' })
    ok(!(await page.$('#res #cmpBtn')), 'Compare offered on the first run')
    await leave(page, 'library')
    await openStarter(page, 'starter-five-finger')
    await page.click('#ready label.ghostsw') // the last run, faintly, on the staff
    await wait(page, () => window.__piano.game.ghost)
    await page.click('#go')
    await ev(page, () => window.__e2e.perform())
    await res(page, 'Results')
    await rowClick(page, '#res #cmpBtn')
    await page.waitForSelector('#res .cmp-grid svg')
    const n = await ev(page, () => { window.__heard = 0; const s = window.__take.sink, on = s.on; s.on = (...a) => (window.__heard++, on(...a)); return window.__piano.game.song.notes.length })
    await rowClick(page, '#res #listenBack')
    await page.waitForSelector('.takebar')
    await page.waitForSelector('.takebar', { state: 'detached', timeout: 60000 })
    const heard = await ev(page, () => window.__heard)
    ok(heard === n, `listen back played ${heard} of ${n} notes`)
    await leave(page, 'library')
    // Listen, from a row's menu: the app plays the piece and judges nothing; at the end the start card is back and the hands are yours
    await rowClick(page, '#library [data-listen="starter-five-finger"]')
    await wait(page, () => window.__piano.game.hands.R === 'listen' && window.__piano.game.hands.L === 'listen' && ['countin', 'playing'].includes(window.__piano.game.phase))
    await wait(page, () => window.__piano.game.phase === 'ready' && window.__piano.game.hands.R === 'play', undefined, 60000)
    ok(await ev(page, () => document.querySelector('#res').hidden), 'a listen ended on a results card')
    await leave(page, 'library')
  },
})

const reviewFlow = () => fresh({
  async '24 Review: a wrong key stays on the staff, the card leaves the paper alone, Review, the Mark list, the log'(page) {
    await openStarter(page, 'starter-five-finger')
    await page.click('#go')
    // the last note struck, then B4 where the piece has no B4, and the fourth note left out: a wrong key and a miss
    const r = await ev(page, () => window.__e2e.perform({ skip: [3], stray: [{ i: window.__piano.game.song.notes.length - 1, p: 71 }] }).then((r) => ({ wrong: r.wrong, miss: r.counts.miss, acc: r.acc, total: r.total })))
    ok(r.wrong === 1 && r.miss === 1, JSON.stringify(r))
    const card = await res(page, 'Results')
    await axe(page, 'song results with marks', '#res')
    // the marked score is the review: the paper opens on the first slip (the miss in bar 1; the stray in bar 5 shows in Review), and the card is under it, not over it
    ok((await page.$$('#staff .miss-mark')).length === 1, 'the paper did not open on the first slip')
    ok(await ev(page, () => document.querySelector('#staff').getBoundingClientRect().bottom <= document.querySelector('#res .results').getBoundingClientRect().top + 1), '#res covers #staff')
    const t = (await card.innerText()).replace(/\s+/g, ' ')
    ok(/Not clean yet: 2 slips/.test(t) && /\d+ of \d+ notes right/.test(t) && /had no slips\./.test(t) && /Notes 1 wrong key .* · 1 missed/.test(t) && /Time .* counts/.test(t), t.slice(0, 400))
    ok(!/%/.test(await page.innerText('.big-grade')), 'a percentage is the figure')
    // the Mark list says the same marks in words, one button each
    await page.click('#res .marklist summary')
    const list = await page.$$eval('#res .marklist button', (b) => b.map((x) => x.textContent))
    ok(list.length === 2 && list.some((x) => /^Bar \d+, beat \d, .* hand\. Played B4 where [A-G]\d is written/.test(x)) && list.some((x) => /was missed\.$/.test(x)), list.join(' | '))
    await page.click('#res .marklist button >> nth=0')
    ok(await page.isVisible('#staff .selring') && (await page.$$('#res .marklist button[aria-current]')).length === 1, 'a mark list row did not ring its mark on the paper')
    await page.click('#res .marklist summary')
    // Review folds the card to a bar under the paper alone, fitted, with the marks on it and the first slip said
    await page.click('#review')
    await wait(page, () => document.querySelector('#res .results.folded #markNext')?.offsetParent && window.__piano.game.view === 'sheet')
    ok(/^Bar \d/.test(await text(page, '#markSay')), 'Review opened on no mark')
    await page.click('#markNext')
    ok(/^\d of 2$/.test(await text(page, '#markAt')) && /^Bar \d/.test(await text(page, '#markSay')), 'stepping to a mark said nothing')
    ok((await page.$$('#staff .stray')).length === 1, 'the stray went when the card folded')
    await page.keyboard.press('Escape')
    ok(!(await page.isVisible('#staff .selring')) && (await page.isVisible('#unfold')), 'Escape closed more than the ring')
    await page.keyboard.press('Escape')
    await wait(page, () => !document.querySelector('#res .results.folded') && window.__piano.game.view === 'both' && !document.querySelector('#res').hidden)
    // the log: this run by id, and what the player did next
    await wait(page, async () => (await window.__e2e.idb('history:log'))?.at(-1)?.id === 'song:starter-five-finger')
    const h = (await ev(page, () => window.__e2e.idb('history:log'))).at(-1)
    ok(h?.id === 'song:starter-five-finger' && h.ok === false && h.notes > 0 && h.notes < 1 && !h.as && h.rate === 1 && h.sp >= 0, JSON.stringify(h))
    await page.click('#again')
    await wait(page, () => document.querySelector('#res').hidden && !document.querySelector('#staff .stray'))
    await wait(page, async () => (await window.__e2e.idb('history:log')).at(-1).then === 'a')
    await leave(page, 'library')
  },
  async "25 Continue: a clean run opens the plan's next row, its row says so; a finished plan still has a lamp"(page) {
    await nav(page, 'today')
    await page.click('#today .guide button[data-guide=hide]') // the first week's step would take the lamp (feature 12)
    await wait(page, () => !document.querySelector('#today .guide'))
    await openStarter(page, 'starter-five-finger')
    await page.click('#go')
    const r = await ev(page, () => window.__e2e.perform().then((r) => r.clean))
    ok(r, 'the run was not clean')
    await res(page, 'Results')
    // the piece is ticked, so Continue names the plan's next row: the Technique exercise, the first of a 10 minute plan
    const to = await text(page, '#res #nextTo')
    ok(await ev(page, () => document.activeElement?.id === 'next') && /Exercise$/.test(to), `Continue: ${to}`)
    await page.click('#res #next')
    await wait(page, () => window.__piano.game.song.id.startsWith('tech:') && window.__piano.game.phase === 'ready' && document.querySelector('#res').hidden)
    await wait(page, async () => (await window.__e2e.idb('history:log')).at(-1).then === 'c')
    await page.click('#go')
    await ev(page, () => window.__e2e.perform())
    await res(page, 'Results')
    await wait(page, async () => (await window.__e2e.idb('history:log')).at(-1)?.id?.startsWith('tech:'))
    const h = (await ev(page, () => window.__e2e.idb('history:log'))).map((e) => e.by)
    ok(h.at(-1) === 'plan' && h.at(-2) === 'own', `by: ${h.join()}`) // Continue offered the exercise; the piece was the player's own pick
    await page.click('#toLib') // the way back is still the page the piece was opened from
    await wait(page, () => document.querySelector('#library.on'))
    // every row ticked: the plan is one line, and the lamp moves to what comes next
    await ev(page, async () => { const d = new Date(); await window.__e2e.idb(`plan:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, ['warm', 'read', 'piece', 'scale', 'theory', 'sight', 'run', 'fix', 'again', 'review', 'path']) })
    await redraw(page, 'today')
    await page.waitForSelector('#today .plan-done')
    const lamps = await page.$$eval('#today .btn.primary', (b) => b.map((x) => [x.closest('.upnext') ? 'upnext' : 'other', x.dataset.by]))
    ok(lamps.length === 1 && lamps[0][0] === 'upnext' && ['due', 'path', 'piece'].includes(lamps[0][1]), JSON.stringify(lamps))
    await axe(page, 'Today, plan done', '#today')
  },
})

const memFlow = () => fresh({
  async '17 Memorise: two clean passes move stage 0 to 1'(page) {
    await nav(page, 'songs')
    await rowClick(page, '#library button[data-mem="starter-five-finger"]')
    await ready(page)
    ok(/Stage 0/.test(await text(page, '#memBar')), 'not at stage 0')
    for (let pass = 1; pass <= 2; pass++) {
      if ((await ev(page, () => window.__piano.game.phase)) === 'ready') await page.click('#go')
      await ev(page, () => window.__e2e.follow())
      await page.waitForSelector('#res:not([hidden]) #memAgain')
      if (pass === 1) await page.click('#memAgain'), await wait(page, () => window.__piano.game.phase !== 'done')
    }
    ok((await ev(page, () => window.__piano.mem().stage)) === 1 && /Stage 1/.test(await text(page, '#memBar')), `after two clean passes: ${await text(page, '#memBar')}`)
    await leave(page, 'library')
  },
  async '17b Metronome: B cycles it, the Practice menu shows it, the beat dots follow'(page) {
    await openStarter(page, 'starter-five-finger')
    const metro = (want) => wait(page, (w) => JSON.parse(localStorage.getItem('piano.settings')).metro === w && document.querySelector('input[name=metro]:checked')?.value === w, want)
    await page.click('#aidsBtn') // Off | Beats | Eighths in the Practice menu
    await page.click('label:has(input[name=metro][value=eighths])')
    await metro('eighths')
    await page.click('label:has(input[name=metro][value=off])')
    await metro('off')
    await page.click('#aidsBtn')
    await page.keyboard.press('b')
    await metro('beat')
    await page.click('#go')
    // one dot a beat of the bar, and the lit one moves: three different beats seen lit
    await wait(page, () => {
      const d = [...document.querySelectorAll('#beats i')]
      ;(window.__lit ??= new Set()).add(d.findIndex((i) => i.classList.contains('on')))
      return d.length === 4 && [...window.__lit].filter((i) => i >= 0).length >= 3
    })
    await page.keyboard.press('b')
    await metro('eighths')
    await page.keyboard.press('b')
    await metro('silent')
    await page.keyboard.press('b')
    await metro('off')
    ok(!(await page.$('#beats i')), 'beat dots left with the metronome off')
    await leave(page, 'library')
  },
  async '17c Pulse: a Silent metronome shows the beat in each look, and Off shows none'(page) {
    await openStarter(page, 'starter-ode-to-joy')
    await page.click('#aidsBtn')
    await page.click('label:has(input[name=metro][value=silent])')
    await page.click('#aidsBtn')
    for (const look of ['staff', 'edge', 'lines', 'off']) {
      if (await running_(page)) await ev(page, () => window.__piano.game.toggle()) // pause the last look's run
      await page.click('#settingsBtn')
      await page.click(`#drawer label:has(input[name=pulse][value=${look}])`)
      await wait(page, (l) => JSON.parse(localStorage.getItem('piano.settings')).pulse === l, look)
      await page.keyboard.press('Escape')
      await page.waitForSelector('#drawer', { state: 'hidden' })
      await ev(page, () => (window.__piano.game.restart(), window.__piano.game.toggle()))
      const t0 = 0
      // two bars on, with what each look draws sampled every frame: the ball on the staff moves, the edge swells and dies away
      const seen = await wait(page, (t0) => {
        const g = window.__piano.game
        const s = (window.__pulse ??= { y: new Set(), o: new Set() })
        const ball = document.querySelector('#staff .beatball')
        if (ball && ball.style.display !== 'none') s.y.add(Math.round(+ball.getAttribute('cy')))
        const edge = document.querySelector('.pulse-edge')
        if (edge) s.o.add(Math.round(+edge.style.opacity * 10))
        return g.t > t0 + 2 * (g.song.bars[1].t1 - g.song.bars[1].t0) && { y: s.y.size, o: [...s.o] }
      }, t0, 60000).then((h) => h.jsonValue())
      await ev(page, () => delete window.__pulse)
      if (look === 'staff') ok(seen.y > 3, `the ball did not move: ${seen.y} heights`)
      if (look === 'edge') ok(Math.max(...seen.o) >= 6 && seen.o.includes(0), `the edge did not swell and fade: ${seen.o}`)
      if (look === 'off' || look === 'lines') ok(seen.y === 0 && !seen.o.some((x) => x > 0), `a pulse showed with ${look}: ${JSON.stringify(seen)}`)
    }
    await ev(page, () => window.__piano.game.toggle()) // pause: a run fades the dock
    await page.click('#aidsBtn')
    await page.click('label:has(input[name=metro][value=off])')
    await page.click('#aidsBtn')
    await leave(page, 'library')
  },
})

const marksFlow = () => fresh({
  async '18 Staff marks: staccato, slur, hairpin; touch lines when played flat'(page) {
    const f = join(OUT, 'touch-marks.musicxml')
    writeFileSync(f, await ev(page, async () => (await import('/src/score-fixtures.ts')).touchPiece()))
    await nav(page, 'songs')
    await page.setInputFiles('#file', f)
    const id = await (await page.waitForSelector('#library tr.open[data-open]:not([data-open^="starter-"])')).getAttribute('data-open')
    await rowClick(page, `#library button[data-play="${id}"][data-mode=perform]`)
    await ready(page)
    // the staff shows a window of bars: note every kind of mark drawn while it moves
    await ev(page, () => {
      const seen = (window.__mk = new Set())
      const look = () => document.querySelectorAll('#staff .mk').forEach((m) => seen.add(m.classList.contains('slur') ? 'slur' : m.classList.contains('hp') ? 'hairpin' : /[]/.test(m.textContent) ? 'staccato' : /[]/.test(m.textContent) ? 'accent' : 'letter'))
      look()
      window.__mkT = setInterval(look, 50)
    })
    await page.click('#go')
    await ev(page, () => window.__e2e.perform()) // every key at one loudness, held 97% of its value: a flat crescendo, long staccatos (two lines at most)
    const card = await (await res(page, 'Results')).textContent()
    const seen = await ev(page, () => (clearInterval(window.__mkT), [...window.__mk].sort().join()))
    ok(seen === 'accent,hairpin,letter,slur,staccato', `marks seen: ${seen}`)
    ok(/crescendo in bars 5 to 8 as a flat line/.test(card) && /8 of 8 staccato notes were held long/.test(card), `no touch lines for a flat run: ${card.replace(/\s+/g, ' ').slice(0, 400)}`)
    await leave(page, 'library')
  },
})

const qaFlow = () => fresh({
  async '4 Theory: earqa level 4 (echo the rhythm), first 3 cards'(page) {
    await nav(page, 'theory')
    await page.selectOption('select[data-tlevel=earqa]', '4')
    await page.click('button[data-trainer=earqa]')
    const r = await ev(page, () => window.__e2e.theory(90000, 3)) // a card is 13 s of phrase and answer: three, not fifteen
    ok(r.ok === 3, `${r.ok} of 3 (${r.why})`)
    const last = await ev(page, () => window.__piano.theory().ears.last)
    ok(/same rhythm/.test(last) && !/Did not hold/.test(last), last)
    await page.click('#thMenu')
  },
})

const pedalFlow = () => fresh({
  async '20 Pedal: CC64 reaches the coach, one sentence in the results, only when used'(page) {
    await nav(page, 'technique')
    await page.selectOption('#tPattern', 'pedal')
    const run = async (used) => {
      await page.click('#tStart')
      await ready(page)
      await page.click('#go')
      // down after the first chord, changed on bars 2 and 3 as the chord lands, then held through the last change
      await ev(page, (u) => { const b = window.__piano.game.song.bars; return window.__e2e.perform({ pedal: u ? [{ t: 0.2, down: true }, ...[1, 2].flatMap((i) => [{ t: b[i].t0 + 0.07, down: false }, { t: b[i].t0 + 0.15, down: true }]), { t: b[3].t1 - 0.1, down: false }] : [] }) }, used)
      const card = (await (await res(page, 'Results')).textContent()).replace(/\s+/g, ' ')
      await page.click('#toLib')
      await wait(page, () => document.querySelector('#technique.on'))
      return card
    }
    const mixed = await run(true)
    ok(/Pedal: you changed it with the chord 2 of 3 times; in bar 4 the old chord was still ringing/.test(mixed), `mixed run: ${mixed.slice(0, 400)}`)
    ok(!/Pedal:/.test(await run(false)), 'a Pedal line with no pedal used')
  },
})

const leadFlow = () => fresh({
  async '21 Lead sheet: chord symbols, no left hand, the chord switch kept, a run is not the piece'(page) {
    const open = async () => {
      await nav(page, 'songs')
      await page.fill('#libQ', 'Die Rose, die Lilie')
      await rowClick(page, '#library [data-libplay="lieder-lc4976849"][data-mode=perform]')
      await ready(page)
    }
    await open()
    const hand = () => ev(page, () => window.__piano.game.song.notes.some((n) => n.h === 'L'))
    ok(await hand(), 'the piece opened with no left hand to drop')
    ok(!(await page.$('#compOn')), 'the chord switch offered before Lead sheet')
    await ev(page, () => (document.querySelector('#ready b').dataset.old = '1'))
    await page.click('#ready label:has(input[name=level][value="4"])') // the default Both view at 1180x820: the row must be on the card
    await wait(page, () => document.querySelector('#ready b:not([data-old])') && document.querySelector('#ready input[name=level][value="4"]')?.checked)
    ok(!(await hand()), 'a left-hand note in the lead sheet')
    ok((await ev(page, () => document.querySelectorAll('#staff .cname').length)) > 0, 'no chord symbols on the staff')
    await axe(page, 'start card, Lead sheet', '#ready')
    await page.click('#ready label.switch:has(#compOn)')
    await wait(page, () => JSON.parse(localStorage.getItem('piano.settings')).comp === true)
    await leave(page, 'library')
    await open() // the level and the switch come back with the piece
    ok(await page.isChecked('#compOn'), 'the chord switch was not kept')
    await ev(page, () => window.__piano.game.setRate(1.25)) // a long song: Perform at its top tempo
    await page.click('#go')
    await ev(page, () => window.__e2e.perform())
    const card = (await (await res(page, 'Results')).textContent()).replace(/\s+/g, ' ')
    ok(/Lead sheet, not the whole piece, so this run does not count toward Ready/.test(card), card.slice(0, 300))
    const p = await ev(page, () => window.__e2e.idb('prog:lib:lieder-lc4976849'))
    ok(!p?.days?.length && !p?.best && !p?.plays && !p?.box, JSON.stringify({ ...p, heat: undefined })) // heat is kept; Ready, Best and the review box are not
  },
})

const sheetsFlow = async () => {
  const twoTracks = () => {
    const m = new Midi()
    for (const [name, base] of [['Right hand', 72], ['Left hand', 48]]) {
      const t = m.addTrack()
      t.name = name
      for (let i = 0; i < 16; i++) t.addNote({ midi: base + (i % 5), time: i * 0.5, duration: 0.4 })
    }
    const f = join(OUT, 'two-track.mid')
    writeFileSync(f, m.toArray())
    return f
  }
  const sheet = (page, id) => page.waitForSelector(`dialog#${id}[open]`, { timeout: 5000 })
  const shut = async (page, id, how, back) => { // how: 'Escape' or the selector of a Close/Done button
    if (how === 'Escape') await page.keyboard.press('Escape')
    else await page.click(`#${id} ${how}`)
    await wait(page, (i) => !document.querySelector(`dialog#${i}[open]`), id)
    ok(await ev(page, (sel) => document.activeElement?.matches(sel), back), `focus did not return to ${back} after ${how}`)
  }
  await fresh({
    async '22 Sheets: Credits, Set up and Options open from Settings, close with focus back, axe clean'(page) {
      await page.click('#settingsBtn')
      await page.waitForSelector('#drawer:not([hidden])')
      await page.click('#sCredits')
      await sheet(page, 'credits')
      const c = await text(page, '#credits')
      ok(c.includes('Free, no subscription, no ads, no account.'), 'Credits: no free line')
      ok((await page.$$('#credits .credlist pre')).length >= 4 && /Salamander/.test(c) && /Wurlitzer/.test(c) && /Versilian/.test(c) && /MuseScore_General/.test(c), 'Credits: the four sounds blocks are not all there')
      const links = await page.$$eval('#credits a', (a) => a.map((x) => [x.target, x.rel, x.href]))
      ok(links.length >= 6 && links.every(([t, r, h]) => t === '_blank' && /noopener/.test(r) && /^https?:/.test(h)), `Credits: links ${JSON.stringify(links.filter(([t, r]) => t !== '_blank' || !/noopener/.test(r)))}`)
      ok(!/https?:\/\//.test(await ev(page, () => [...document.querySelectorAll('#credits pre')].map((p) => p.cloneNode(true)).map((p) => (p.querySelectorAll('a').forEach((a) => a.remove()), p.textContent)).join(' '))), 'Credits: a URL left as plain text')
      await axe(page, 'Credits', '#credits')
      await shut(page, 'credits', 'Escape', '#sCredits')
      await page.click('#sCredits')
      await sheet(page, 'credits')
      await shut(page, 'credits', 'header [data-close]', '#sCredits')

      await page.click('#sSetup') // closes the drawer, then the sheet
      await sheet(page, 'setup')
      ok(/Four checks/.test(await text(page, '#setup')) && (await page.$$('#setup .prow')).length === 4, 'Set up: not the four rows')
      await axe(page, 'Set up from Settings', '#setup')
      await shut(page, 'setup', 'footer [data-close]', '#settingsBtn') // Done

      await nav(page, 'songs')
      await page.setInputFiles('#file', twoTracks())
      await rowClick(page, '#library button[data-tracks]')
      await sheet(page, 'tracks')
      ok(/2 of 2 in use/.test(await text(page, '#tkSum')) && (await page.$$('#tracks .tkrow')).length === 2, 'Options: not two tracks, both in use')
      await page.click('#tracks .tkrow:first-child .switch')
      await wait(page, () => /1 of 2 in use/.test(document.querySelector('#tkSum')?.textContent))
      await axe(page, 'Options', '#tracks')
      await page.click('#tkCancel')
      await wait(page, () => !document.querySelector('dialog#tracks[open]'))
      ok(await ev(page, () => document.activeElement?.matches('#library button[data-more]')), 'Options: focus did not return to the Options button')
    },
  })

  // 22b: the page chunk is slow, then refused. A route handler awaits `gate`, so the title is checked while the body is certainly not there.
  if (ONLY.test('22b')) {
    let go
    const gate = new Promise((r) => (go = r))
    const slow = await open({}, (ctx) => ctx.route(/\/src\/(ui-(views|sheets)|app\/theory-ui)\.ts/, async (r) => (await gate, r.continue())))
    await skipSetup(slow)
    await feature('22b Slow chunk: the page title at once, the body when it arrives', slow, async () => {
      const tabs = ['scales', 'read', 'progress', 'theory']
      for (const t of tabs) {
        await slow.click(`label:has(input[name=nav][value=${t}])`)
        await wait(slow, (id) => document.querySelector(`#${id}.on > .lib-head.wait h1`), t, 3000)
        ok((await slow.$$(`#${t} > :not(.wait)`)).length === 0, `${t}: a body before the chunk arrived`)
      }
      await slow.waitForTimeout(1500) // the slow link
      go()
      for (const t of tabs) await wait(slow, (id) => document.querySelector(`#${id} > :not(.wait)`), t)
      ok(await slow.$('#progress h1'), 'Progress: no heading once drawn')
    })
    await slow.context().close()

    const dead = await open({}, (ctx) => ctx.route(/\/src\/(ui-(views|sheets)|app\/theory-ui)\.ts/, (r) => r.abort()))
    await skipSetup(dead)
    await feature('22b Refused chunk: plain words, no blank page, no unhandled rejection', dead, async () => {
      for (const t of ['scales', 'read', 'progress', 'theory']) {
        await nav(dead, t)
        ok(/This page could not load/.test(await text(dead, `#${t}`)), `${t}: no plain-words message`)
      }
      await nav(dead, 'songs')
      await dead.setInputFiles('#file', twoTracks())
      await dead.waitForSelector('#library button[data-tracks]', { state: 'attached' })
      await dead.click('#settingsBtn')
      for (const [btn, id] of [['#sCredits', 'credits'], ['#sSetup', 'setup']]) {
        if (!(await dead.isVisible('#drawer'))) await dead.click('#settingsBtn')
        await dead.click(btn)
        await sheet(dead, id)
        ok(/Check the connection, then reload the page\./.test(await text(dead, `#${id}`)), `${id}: no plain-words message`)
        await dead.click(`#${id} [data-close]`)
      }
      await rowClick(dead, '#library button[data-tracks]')
      await sheet(dead, 'tracks')
      ok(/Check the connection, then reload the page\./.test(await text(dead, '#tracks')), 'tracks: no plain-words message')
      await dead.click('#tracks [data-close]')
      await dead.keyboard.press('?')
      await wait(dead, () => /Check the connection, then reload the page\./.test(document.querySelector('dialog#help[open] .helpbody')?.textContent), undefined, 5000)
      ok(/Help/.test(await text(dead, '#help h2')), 'help: no title')
      await dead.keyboard.press('Escape')
      await nav(dead, 'today') // still usable
      const own = (e) => /ERR_FAILED|Failed to load resource|dynamically imported module/.test(e) // the refusals themselves, and the page catch that reports them
      ok(!dead.errs.some((e) => e.startsWith('pageerror')), `unhandled: ${dead.errs.find((e) => e.startsWith('pageerror'))}`)
      dead.errs.splice(0, dead.errs.length, ...dead.errs.filter((e) => !own(e)))
    })
    await dead.context().close()
  }
}

// three lanes at a time: seven browsers at once starve the clock-driven players and the main flow then stalls
const lane = async (...fs) => { for (const f of fs) await f() }
const [page] = await Promise.all([
  mainFlow().then(async (p) => (await lane(guideFlow, sheetsFlow, ladderFlow, fluentFlow, marksFlow, memFlow), p)),
  lane(songsFlow, packsFlow, () => side(['keys', 'intervals', 'degrees']), () => side(['earint']), () => side(['earchord']), oskFlow, accompFlow, recorderFlow, reviewFlow),
  lane(() => side(['earplay']), () => side(['eardeg']), () => side(['rhythm']), qaFlow, pedalFlow, leadFlow, shellFlow),
  ...(process.env.E2E_PULSE ? [lane(() => side(['keepbeat']), () => side(['subdiv', 'holdrhythm']))] : []),
])
await feature('11 accessibility: every page and the drawer', page, async () => {
  for (const tab of ['today', 'songs', 'read', 'scales', 'theory', 'technique', 'progress']) {
    await nav(page, tab)
    await axe(page, `${tab} page`)
  }
  await page.click('#settingsBtn')
  await page.waitForSelector('#drawer:not([hidden])')
  await axe(page, 'settings drawer', '#drawer')
  await page.keyboard.press('Escape')
  ok(!axeFound.length, axeFound.join(' | '))
})

await browser.close()
await server?.close()

const order = (r) => parseFloat(r.name)
rows.sort((a, b) => order(a) - order(b))
console.log(`\n${'feature'.padEnd(72)} result  seconds`)
for (const r of rows) console.log(`${r.name.padEnd(72)} ${r.ok ? 'pass' : 'FAIL'}    ${r.s.toFixed(1).padStart(5)}${r.ok ? '' : `\n    ${r.err}`}`)
const failed = rows.filter((r) => !r.ok).length
console.log(`\n${rows.length - failed} of ${rows.length} passed in ${((Date.now() - T0) / 1000).toFixed(0)} s${failed ? `; screenshots in ${OUT}` : ''}`)
process.exit(failed ? 1 : 0)
