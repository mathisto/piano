// End-to-end suite: `npm i --no-save playwright-core axe-core`, then `npm run e2e`. Starts its own Vite dev server
// (the dev hooks window.__piano and window.__ear exist only in dev) unless E2E_URL points at one. E2E_HEADED=1 shows the browser.
// Every feature drives the real UI with synthetic key presses and fails on any console or page error. Docs: docs/changes/e2e.md.
import { readFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const { chromium } = await import('playwright-core')
const AXE = readFileSync(new URL('../../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8')
const OUT = mkdtempSync(join(tmpdir(), 'piano-e2e-'))
const T0 = Date.now()
setTimeout(() => (console.log('e2e: watchdog, over 8 minutes'), process.exit(2)), 8 * 60e3).unref()

let server
if (!process.env.E2E_URL) {
  const { createServer } = await import('vite')
  // fs: a worktree's node_modules may be a symlink; cacheDir: its own pre-bundled deps, so another dev server re-optimizing the shared ones cannot reload this one mid-run
  server = await createServer({ logLevel: 'error', cacheDir: join(tmpdir(), 'piano-e2e-vite'), server: { port: 5213, fs: { strict: false } } })
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
    hook() { if (!this.hooked) P().game.on((e) => e.type === 'done' && (window.__last = e.result)); this.hooked = true },
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
    perform({ skip = [], loud = -1 } = {}) {
      return new Promise((res) => {
        const g = P().game, sk = new Set(skip)
        window.__last = undefined
        let started = false
        window.__marks = 0
        const id = setInterval(() => {
          if (!started && (g.phase === 'countin' || g.phase === 'playing')) {
            started = true
            const now = performance.now()
            g.song.notes.forEach((n, i) => {
              if (sk.has(i) || g.hands[n.h] !== 'play') return
              const at = g.anchorPerf + ((n.t - g.anchorT) / g.rate) * 1000 - now
              setTimeout(() => P().key(n.p, i === loud ? 0.9 : 0.55 + (i % 3) * 0.006), at)
              setTimeout(() => P().up(n.p), at + (n.d / g.rate) * 970)
            })
          }
          window.__marks = Math.max(window.__marks, document.querySelectorAll('#staff .devmark').length)
          if (g.phase === 'done' && window.__last) clearInterval(id), res(window.__last)
        }, 5)
      })
    },
    // Theory: answer every card of the session in progress, ear cards once their prompt has played
    async theory(limit = 150000) {
      const t0 = performance.now(), why = []
      for (;;) {
        const T = P().theory()
        if (!T && performance.now() - t0 < 3000) { await sleep(20); continue } // the session deals its cards after a store read
        if (!T) throw new Error('no Theory session')
        if (T.i >= T.cards.length) return { ok: T.ok, n: T.cards.length, why: [...new Set(why)].join('; ') }
        if (performance.now() - t0 > limit) throw new Error('Theory stuck on card ' + (T.i + 1))
        const c = T.cards[T.i], i = T.i, step = T.step
        if (T.answered === 'miss') why.push(T.ears.last || c.show), document.querySelector('#thNext')?.click()
        if (T.answered || performance.now() < T.ears.deaf) { await sleep(20); continue }
        if (c.play?.kind === 'rhythm') {
          const B = 2 * (T.ears.t0 - T.ears.deaf) // the keyboard opens half a beat before the bar
          const now = performance.now()
          for (const o of c.play.onsets) setTimeout(() => P().key(60, 0.6), T.ears.t0 + (o * B) / 2 - now)
        } else {
          const st = c.steps[step]
          const ps = st.abs !== undefined ? [st.abs] : st.pcs.map((pc) => (st.bass === pc ? 48 : 60) + pc)
          for (const p of ps) P().key(p, 0.6) // no key-ups: Theory ignores them, and with no song open one throws (feature 0b)
        }
        while (P().theory() === T && T.i === i && T.step === step && !T.answered) await sleep(10)
      }
    },
    async axe(sel) { return (await window.axe.run(sel ? document.querySelector(sel) : document, { resultTypes: ['violations'] })).violations.map((v) => v.id + ' (' + v.nodes.length + ')') },
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

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, acceptDownloads: true })
  await ctx.addInitScript(INIT)
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
  rows.push({ name, ok: !err, s: (Date.now() - t) / 1000, err })
  console.log(`${err ? 'FAIL' : 'ok  '} ${name} (${((Date.now() - t) / 1000).toFixed(1)} s)${err ? `: ${err}` : ''}`)
}
const ev = (page, fn, arg) => page.evaluate(fn, arg)
const wait = (page, fn, arg, timeout = 30000) => page.waitForFunction(fn, arg, { timeout, polling: 50 })
async function nav(page, tab) {
  await page.click(`label:has(input[name=nav][value=${tab}])`)
  await wait(page, (id) => document.querySelector(`#${id}.on`)?.children.length, tab === 'songs' ? 'library' : tab)
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
const leave = async (page, back) => {
  await page.keyboard.press('Escape')
  await wait(page, (id) => document.querySelector(`#${id}.on`), back)
}

// ---------------------------------------------------------------- the main profile: one player's day, then Progress, export, clear, import

async function mainFlow() {
  const page = await open()
  await feature('0 first run: Set up sheet', page, async () => {
    await page.goto(`${URL_}?setup`) // automation never gets the sheet unprompted; ?setup asks for it
    await page.waitForSelector('dialog#setup[open]', { timeout: 5000 })
    await axe(page, 'Set up sheet', '#setup')
    await page.keyboard.press('Escape')
    ok(!(await page.isVisible('dialog#setup[open]')), 'Set up did not close on Escape')
  })
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
    ok(/A clean run, 1 of 3/.test(await card.textContent()), 'the clean run was not counted')
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

  await feature('5 Read through: look-through, start early, play, summary, Fix these', page, async () => {
    await nav(page, 'songs')
    await page.click('#library [data-rt^=starter-twinkle]')
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
    await page.keyboard.press('v') // falling notes only: at 1180x820 the both-panes stage is too short for the full card
    await page.waitForSelector('#ready label:has(input[name=level][value="2"])')
    await axe(page, 'start card', '#ready')
    await ev(page, () => (document.querySelector('#ready b').dataset.old = '1'))
    await page.click('#ready label:has(input[name=level][value="2"])')
    // the piece opens again with fewer notes: wait for the new card, or Escape races the reopen
    await wait(page, () => document.querySelector('#ready b:not([data-old])') && document.querySelector('#ready input[name=level][value="2"]')?.checked)
    for (const v of ['sheet', 'both']) await page.keyboard.press('v'), await wait(page, (v) => JSON.parse(localStorage.getItem('piano.settings')).view === v, v)
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

async function theory(page, trainers) {
  await feature(`4 Theory: ${trainers.join(', ')}`, page, async () => {
    await nav(page, 'theory')
    await page.selectOption('select[data-tlevel=chords]', '3') // inversions: the lowest note matters
    await page.selectOption('select[data-tlevel=cadences]', '3')
    for (const t of trainers) {
      await page.click(`button[data-trainer=${t}]`)
      const r = await ev(page, () => window.__e2e.theory(240000))
      ok(r.ok === r.n, `${t}: ${r.ok} of ${r.n} (${r.why})`)
      await page.waitForSelector('#theory [aria-label="Session results"]')
      ok((await text(page, '#theory h2')).startsWith(`${r.n} of ${r.n}`), `${t} results`)
      if (t === 'chords') await axe(page, 'Theory results', '#theory')
      if (t === 'rhythm') ok(/Over the session/.test(await text(page, '#theory')), 'no rhythm summary')
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
}

const [page] = await Promise.all([mainFlow(), songsFlow(), side(['keys', 'intervals', 'degrees']), side(['earplay']), side(['earint']), side(['eardeg']), side(['rhythm'])])
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
