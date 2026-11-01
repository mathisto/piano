// Packs on the page (docs/changes/studies-packs.md): Studies at the top of Technique, the other packs behind a Packs chip on Songs, a pack's list in a sheet,
// and bringing one in by file or by link, or sending one on. Loaded the first time Technique or Songs is drawn, never at boot.
import * as lib from '../catalog'
import { dayNum } from '../drill'
import { del, get, keys } from '../kv'
import { nextOf, type Pack, packFragment, packFromFragment, parsePack, type Row, rows, type Ctx } from '../pack'
import { nextCard, scaleSong, STAGES as SCALES } from '../scales'
import { settings } from '../settings'
import * as store from '../store'
import { exercise } from '../technique'
import { icon } from '../icons'
import { $, rowMenu } from '../ui'
import { esc } from '../util'
import { current, game, hooks, staff, stageById } from './state'
import { syncMode } from './stage'

type From = 'app' | 'file' | 'link'
interface Rec { pack: Pack; from: From; opened?: number }

/** The packs that come with the app: the files in src/packs, read by the same parser as any other. */
const ORDER = ['hanon-warmup', 'burgmuller-op100', 'czerny-op821', 'czerny-op840', 'clementi-op42', 'schumann-op68', 'anna-magdalena']
export const FIRST: Pack[] = Object.values(import.meta.glob('../packs/*.pfpack', { query: '?raw', import: 'default', eager: true }) as Record<string, string>)
  .map(parsePack)
  .sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id))

/** Every pack: the app's, then the ones you brought, each with when you last started something in it. A stored pack that no longer reads is left out. */
async function all(): Promise<Rec[]> {
  const kept = new Map<string, { pack?: unknown; from?: string; opened?: number }>()
  for (const k of await keys()) if (String(k).startsWith('pack:')) kept.set(String(k).slice(5), (await get(k)) ?? {})
  const out: Rec[] = FIRST.map((pack) => ({ pack, from: 'app', opened: kept.get(pack.id)?.opened }))
  for (const [id, r] of kept) {
    if (!r.pack || FIRST.some((p) => p.id === id)) continue
    try {
      out.push({ pack: parsePack(JSON.stringify(r.pack)), from: r.from === 'link' ? 'link' : 'file', opened: r.opened })
    } catch {
      /* damaged or from a newer app: skipped, kept for an export */
    }
  }
  return out
}

async function ctx(): Promise<Ctx> {
  const [prog, tech, drill, scales] = await Promise.all([store.allProgress(), store.getTech(), store.getDrill(), store.getScales()])
  return { piece: lib.piece, prog, tech, drill, scales, day: dayNum(), dayOf: (ts) => dayNum(new Date(ts)) }
}

/** Where a pack stands: its rows, today's or the next item, what a Start opens, and one line that says so. */
function where(r: Rec, c: Ctx) {
  const rs = rows(r.pack, c)
  const { next, today } = nextOf(r.pack, rs, c)
  const live = rs.filter((x) => x.state !== 'missing')
  const go = next ?? today[0] ?? live[0]
  const done = live.filter((x) => x.state === 'done').length
  const word = live.every((x) => x.item.piece) ? 'ready' : 'done'
  const and = (xs: Row[]) => xs.map((x) => x.title).join(' and ')
  const line = r.pack.warmup ? `${next ? 'Today' : 'Done for today'}: ${and(today)}` : next ? `Next: ${next.title}${done ? ` · ${done} of ${live.length} ${word}` : ''}` : `All ${live.length} ${word}`
  return { rs, next, go, line }
}

const page = (p: Pack) => (p.kind === 'study' ? 'technique' : 'songs')
let songsOpen = false // the Packs chip on Songs, open or not: kept while the app is open
let said = '' // the sheet's status line after an import

/** Draw the packs into a page: Studies after Technique's head, or the Packs chip and its list on Songs. */
export async function mount(el: HTMLElement, where_: 'technique' | 'songs') {
  const [recs, c] = await Promise.all([all(), ctx()])
  if (!el.isConnected) return
  const mine = recs.filter((r) => page(r.pack) === where_)
  const ws = new Map(mine.map((r) => [r, where(r, c)]))
  // the lamp: the pack you started something in last, when it has a next step; then Technique's own Start steps down
  const lit = where_ === 'technique' ? mine.filter((r) => r.opened && ws.get(r)!.next).sort((a, b) => b.opened! - a.opened!)[0] : undefined
  const row = (r: Rec) => {
    const w = ws.get(r)!
    const n = r.pack.items.length
    return `<div class="prow${w.go ? '' : ' done'}"><div class="pwho"><b><span class="pn">${esc(r.pack.title)}</span>${r === lit ? ' <span class="tag next">Next</span>' : ''}</b><span>${esc(w.line)}</span></div>
      <div class="pact"><button class="btn ghost" data-pk-list="${esc(r.pack.id)}" aria-label="All ${n} in ${esc(r.pack.title)}">All ${n}</button>${w.go ? `<button class="btn${r === lit ? ' primary' : ' ghost'}" data-pk-go="${esc(r.pack.id)}" aria-label="Start ${esc(w.go.title)}, ${esc(r.pack.title)}">${icon('play')}Start</button>` : ''}</div></div>`
  }
  const bring = `<div class="prow"><div class="pwho"><b>Bring a pack</b><span>A .pfpack file. A pack link adds its pack when you open it.</span></div><div class="pact"><button class="btn ghost" data-pk-file>${icon('plus')}Choose file</button><input type="file" accept=".pfpack,.json,application/json" hidden data-pk-input></div></div>`
  el.querySelector('.packs')?.remove()
  el.querySelector('#pkChip')?.remove()
  const list = `<div class="plan">${mine.map(row).join('')}${bring}</div>`
  if (where_ === 'technique') {
    el.querySelector('.lib-head')!.insertAdjacentHTML('afterend', `<section class="packs" aria-labelledby="pkStudies"><h2 class="sec" id="pkStudies">Studies</h2>${list}</section><h2 class="sec">Exercises</h2>`)
    if (lit) el.querySelector('#tStart')?.classList.remove('primary')
  } else {
    el.querySelector('.head-actions')!.insertAdjacentHTML('afterbegin', `<button class="btn" id="pkChip" aria-expanded="${songsOpen}" aria-controls="pkSongs">Packs<small>${mine.length}</small></button>`)
    el.querySelector('.lib-head')!.insertAdjacentHTML('afterend', `<section class="packs" id="pkSongs" aria-label="Packs"${songsOpen ? '' : ' hidden'}>${list}</section>`)
    $('#pkChip', el).onclick = () => {
      songsOpen = !songsOpen
      $('#pkChip', el).setAttribute('aria-expanded', String(songsOpen))
      $('#pkSongs', el).hidden = !songsOpen
    }
  }
  const sec = el.querySelector<HTMLElement>('.packs')!
  const input = $<HTMLInputElement>('[data-pk-input]', sec)
  sec.onclick = (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button')
    const r = mine.find((x) => x.pack.id === (b?.dataset.pkList ?? b?.dataset.pkGo))
    if (b?.hasAttribute('data-pk-file')) input.click()
    else if (r && b?.dataset.pkList) void sheet(r.pack.id)
    else if (r) void start(r, ws.get(r)!.go!)
  }
  input.onchange = () => {
    const f = input.files?.[0]
    input.value = ''
    if (f) void fromFile(f).catch((err) => hooks.showSection(where_, (err as Error).message))
  }
}

/** The sheet a pack's list opens in: made the first time, beside the app's other sheets. */
function sheetEl() {
  let d = document.querySelector<HTMLDialogElement>('#pack')
  if (!d) {
    d = Object.assign(document.createElement('dialog'), { id: 'pack', className: 'sheet' })
    d.setAttribute('aria-labelledby', 'pkTitle')
    document.querySelector('#tracks')!.after(d)
  }
  return d
}

/** A pack's list in a sheet: each item with its state, the next as the one primary in the footer; Share and Remove in the header's More. */
async function sheet(id: string) {
  const d = sheetEl()
  const [recs, c] = await Promise.all([all(), ctx()])
  const r = recs.find((x) => x.pack.id === id)
  if (!r) return
  const w = where(r, c)
  const p = r.pack
  const origin = [`By ${p.by}`, p.licence === 'CC0-1.0' ? 'CC0' : p.licence === 'CC-BY-4.0' ? 'CC BY' : '', r.from === 'link' ? 'From a link' : r.from === 'file' ? 'From a file' : ''].filter(Boolean).join(' · ')
  const item = (x: Row) => {
    const sub = [x.word, x.level && `Level ${x.level}`, x.item.note].filter(Boolean).join(' · ')
    return `<li class="prow${x.state === 'done' ? ' done' : ''}${x.state === 'missing' ? ' missing' : ''}"><span class="plead">${x.state === 'done' ? icon('check') : ''}</span><div class="pwho"><b><span class="pn">${esc(x.title)}</span>${x === w.next ? ' <span class="tag next">Next</span>' : ''}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div>
      <div class="pact">${x.state === 'missing' ? '' : `<button class="btn ghost" data-pk-start="${x.i}" aria-label="Start ${esc(x.title)}">${icon('play')}Start</button>`}</div></li>`
  }
  d.innerHTML = `<header><div><h2 id="pkTitle">${esc(p.title)}</h2><p>${esc(origin)}</p></div><span class="pop">${rowMenu(p.title, `<button class="btn ghost" data-pk-share="file">Share as a file</button><button class="btn ghost" data-pk-share="link">Share as a link</button>${r.from === 'app' ? '' : '<button class="btn ghost" data-pk-rm>Remove this pack</button>'}`)}</span><button class="btn icon ghost" data-close aria-label="Close">${icon('x')}</button></header>
    <div class="body">${p.about ? `<p class="fine">${esc(p.about)}</p>` : ''}<p class="fine pksay" id="pkSay" role="status">${esc(said)}</p><ol class="plan pklist">${w.rs.map(item).join('')}</ol></div>
    ${w.next ? `<footer><span class="grow"></span><button class="btn primary" data-pk-start="${w.next.i}">${icon('play')}Start ${esc(w.next.title)}</button></footer>` : ''}`
  said = ''
  d.onclick = async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button')
    if (b?.dataset.pkStart) return void start(r, w.rs[Number(b.dataset.pkStart)])
    if (b?.dataset.pkShare) return void share(p, b.dataset.pkShare as 'file' | 'link')
    if (b?.hasAttribute('data-pk-rm') && confirm(`Remove ${p.title} from this device?`)) {
      await store.serial(() => del(`pack:${p.id}`))
      d.close()
      void hooks.showSection(page(p))
    }
  }
  if (!d.open) d.showModal()
  d.querySelector<HTMLElement>('footer .primary')?.focus()
}

/** Start one item the way its own page does, with the pack's tempo and aids. */
async function start(r: Rec, x: Row) {
  void store.edit<{ opened?: number }>(`pack:${r.pack.id}`, {}, (v) => ({ ...v, opened: Date.now() }))
  const d = sheetEl()
  if (d.open) d.close()
  const it = x.item
  const { openById, openSong } = hooks
  const aids = it.view && { ...it.view }
  if (it.piece) {
    const p = lib.piece(it.piece)
    if (!p) return
    await openById(`lib:${p.id}`, 'learn')
    if (current?.song.id !== `lib:${p.id}`) return // it did not open, or the player went elsewhere
    if (aids) {
      current.base.aids = current.song.aids = aids // the piece as opened carries them, and so does a reopen from the start card
      staff.render()
    }
    if (it.rate) {
      game.setRate(it.rate)
      syncMode() // the dock's Tempo says it
    }
  } else if (it.drill) await openSong({ ...exercise(it.drill, settings.edges), ...(aids && { aids }) }, 'perform')
  else if (it.read) await hooks.startDrill(stageById(it.read)!)
  else {
    const st = SCALES.find((s) => s.id === it.scale)!
    await openSong({ ...scaleSong(nextCard(st, await store.getScales()), Math.round(st.bpm * (it.rate ?? 1))), ...(aids && { aids }) }, 'perform')
  }
}

// ---------------------------------------------------------------- in and out

/** Keep a pack brought in, then show it on its page with its list open. One with the id of an app pack is refused: it would hide the app's. */
async function keep(p: Pack, from: 'file' | 'link') {
  if (FIRST.some((f) => f.id === p.id)) throw new Error(`It has the same id as "${FIRST.find((f) => f.id === p.id)!.title}", which comes with the app. Give it an id of its own.`)
  await store.edit<object>(`pack:${p.id}`, {}, (v) => ({ ...v, pack: p, from, added: Date.now() }))
  said = from === 'link' ? 'Added from a link.' : 'Added from a file.'
  await hooks.showSection(page(p))
  if (page(p) === 'songs' && !songsOpen) $('#pkChip')?.click()
  await sheet(p.id)
}

/** A .pfpack or .json file: the Choose file button, a drop, or a file opened from Mail, AirDrop or Files on the iPad (src/app/library.ts routes them here). */
export async function fromFile(f: File) {
  if (!/\.(pfpack|json)$/i.test(f.name)) throw new Error(`${f.name} is not a MIDI, MusicXML or pack file. Add a .mid, .musicxml, .mxl or .pfpack file.`)
  try {
    await keep(parsePack(await f.text()), 'file')
  } catch (e) {
    throw new Error(`${f.name}: ${(e as Error).message}`)
  }
  return 1
}

/** A link's fragment, `#pack=...`: read, kept, and taken off the address so a reload does not ask again. */
export async function fromLink(frag = location.hash) {
  history.replaceState(null, '', location.pathname + location.search)
  try {
    await keep(await packFromFragment(frag), 'link')
  } catch (err) {
    void hooks.showSection('technique', (err as Error).message)
  }
}

/** Send a pack on: as a file through the share sheet (or a download), or as a link that carries the whole pack. */
async function share(p: Pack, how: 'file' | 'link') {
  const say = (s: string) => ($('#pkSay').textContent = s)
  if (how === 'file') return hooks.shareFile(new File([JSON.stringify(p, null, 1) + '\n'], `${p.id}.pfpack`, { type: 'application/json' }))
  const site = /^https?:$/.test(location.protocol) ? location.origin + location.pathname : 'https://pianoforte.mattkelly.io/' // the iPad app's own address opens nothing elsewhere
  const url = `${site}#${await packFragment(p)}`
  if (navigator.share) {
    try {
      return await navigator.share({ title: p.title, url })
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    say(url.length > 2000 ? 'Link copied. It is long: some chat apps cut links this long, so a file is safer.' : 'Link copied.')
  } catch {
    $('#pkSay').innerHTML = `<input class="pklink" readonly aria-label="Pack link" value="${esc(url)}">`
    $<HTMLInputElement>('.pklink').select()
  }
}
