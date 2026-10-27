import { memTag } from './memory'
import './library-view.css'
import { catalog, gradeOf, local, net, piece, pieceBytes, retry, search, searchIndex } from './catalog'
import type { Piece } from './catalog-types'
import { licenceName } from './credits'
import type { Song } from './song'
import type { Progress } from './store'
import { thumb } from './thumb'
import { art, esc, mmss, notice } from './ui'

// The open library on the Songs page: search, level and composer filters, and a list shown a page at a time,
// so thousands of pieces never become thousands of rows. Thumbnails only for files already on the device, as rows scroll in.

const PAGE = 50
const SEARCH = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>'
const ui = { q: '', grade: undefined as number | undefined, composer: undefined as number | undefined, shown: PAGE, saving: false }
const meta = new Map<string, { thumb: string; len: number }>() // kept across visits
const todo: Piece[] = []
let busy = false
let load: (p: Piece) => Promise<Song>

const surname = (name: string) => name.split(' ').pop()!
const sig = (f: number) => (f > 0 ? `${f}♯ · ` : f < 0 ? `${-f}♭ · ` : '')

/** Key, metre and bars from the catalogue, where a piece not yet on the device has no thumbnail. */
const facts = (p: Piece) => (p.bars ? `<span class="pfacts">${sig(p.fifths)}${esc(p.meter)}<br>${p.bars} bars</span>` : '')

function row(p: Piece, prog: Map<string, Progress>) {
  const m = meta.get(p.id)
  const best = prog.get(`lib:${p.id}`)?.best
  const len = p.sec || m?.len
  return `<tr class="open" data-lib="${esc(p.id)}"><td class="thumb">${art(`lib:${p.id}`)}${m?.thumb ?? (local(p.id) ? '' : facts(p))}</td><td class="name">${esc(p.title)}${(prog.get(`lib:${p.id}`)?.days?.length ?? 0) >= 2 ? ' <span class="tag">Ready</span>' : ''}${memTag(prog.get(`lib:${p.id}`))}<small><span>${esc(catalog.composers[p.composer]?.name ?? '')}</span> · <span>Level ${gradeOf(p)}</span> · <span>${esc(licenceName(catalog.licences[p.licence]?.id ?? ''))}</span> <span class="len">${len ? `· ${mmss(len)}` : ''}</span></small></td><td class="num">${best ? `<b>${Math.round(best.acc * 100)}%</b>` : ''}</td><td class="acts"><div class="row-actions">
    <button class="btn ghost" data-libplay="${esc(p.id)}" data-mode="learn" aria-label="Learn ${esc(p.title)}">Learn</button>
    <button class="btn ghost" data-libplay="${esc(p.id)}" data-mode="perform" aria-label="Perform ${esc(p.title)}">Perform</button>
    <button class="btn ghost" data-rt="lib:${esc(p.id)}" aria-label="Read through ${esc(p.title)}">Read through</button>
    <button class="btn ghost" data-mem="lib:${esc(p.id)}" aria-label="Memorise ${esc(p.title)}">Memorise</button></div></td></tr>`
}

/** Read a file already on the device for a thumbnail and a length, one at a time and only for rows scrolled into view:
 *  parsing all ~40 bundled files on arrival took ~1.2 s of CPU at 4x and held up the next tap. */
async function fill() {
  if (busy) return
  busy = true
  for (let p; (p = todo.shift()); ) {
    if (meta.has(p.id)) continue
    try {
      const song = await load(p)
      meta.set(p.id, { thumb: thumb(song), len: song.end })
      const tr = document.querySelector(`#library tr[data-lib="${CSS.escape(p.id)}"]`)
      tr?.querySelector('.thumb')!.insertAdjacentHTML('beforeend', meta.get(p.id)!.thumb)
      if (tr && !p.sec) tr.querySelector('.len')!.textContent = `· ${mmss(song.end)}`
    } catch {
      /* a piece that will not parse still opens and reports its own error */
    }
  }
  busy = false
}

/** Append the open library to the Songs page. Filters survive leaving and coming back. */
export function mountLibrary(host: HTMLElement, prog: Map<string, Progress>, read: (p: Piece) => Promise<Song>) {
  const ps = catalog.pieces
  // the corpus could not be fetched and nothing is stored: say so, with another go. With no pieces at all (the bundled list failed too) this is the whole section.
  const lost = net.ok === false && !net.have
  const again = '<button class="btn ghost" data-libretry>Try again</button>'
  const wire = (el: ParentNode) =>
    el.querySelector<HTMLButtonElement>('[data-libretry]')?.addEventListener('click', (e) => {
      ;(e.target as HTMLButtonElement).disabled = true
      ;(e.target as HTMLButtonElement).textContent = 'Trying…'
      void retry()
    })
  if (!ps.length) {
    host.insertAdjacentHTML('beforeend', `<section class="biglib" aria-label="Open library">${notice('The open library could not be loaded. Check the connection.', again)}</section>`)
    return wire(host)
  }
  load = read
  const grades = [...new Set(ps.map(gradeOf))].sort((a, b) => a - b)
  const per = new Map<number, number>()
  for (const p of ps) per.set(p.composer, (per.get(p.composer) ?? 0) + 1)
  const who = [...per.keys()].filter((c) => catalog.composers[c]).sort((a, b) => surname(catalog.composers[a].name).localeCompare(surname(catalog.composers[b].name)))
  if (ui.grade !== undefined && !grades.includes(ui.grade)) ui.grade = undefined
  if (ui.composer !== undefined && !per.has(ui.composer)) ui.composer = undefined
  const radio = (v: string, label: string, on: boolean) => `<label><input type="radio" name="libGrade" value="${v}"${on ? ' checked' : ''}><span>${label}</span></label>`

  host.insertAdjacentHTML(
    'beforeend',
    `<section class="biglib" aria-labelledby="libCap">
    <p class="label cap" id="libCap">Open library <span id="libCount"></span></p>
    ${lost ? notice('Showing the pieces that come with the app. The rest of the open library needs a connection.', again) : ''}
    <div class="libtools">
      <label class="libq">${SEARCH}<input type="search" id="libQ" placeholder="Title, composer or opus" aria-label="Search the open library" autocomplete="off" spellcheck="false" value="${esc(ui.q)}"></label>
      ${who.length > 1 ? `<select id="libWho" aria-label="Composer"><option value="">All composers</option>${who.map((c) => `<option value="${c}"${ui.composer === c ? ' selected' : ''}>${esc(catalog.composers[c].name)} (${per.get(c)})</option>`).join('')}</select>` : ''}
      <div class="seg" role="radiogroup" aria-label="Level">${radio('', 'All levels', ui.grade === undefined)}${grades.map((g) => radio(String(g), String(g), ui.grade === g)).join('')}</div>
      <button class="btn ghost sr-only" id="libSkip"></button>
    </div>
    <table class="songs"><caption class="sr-only">Open library</caption><colgroup><col><col><col style="width:60px"><col class="acol"></colgroup><tbody id="libRows"></tbody></table>
    <p class="sr-only" id="libFound" role="status"></p>
    <div class="libmore" id="libEnd" tabindex="-1" role="group" aria-label="After the list"><p class="fine" id="libShown" role="status"></p><button class="btn ghost" id="libMore">Show ${PAGE} more</button><button class="btn ghost" id="libSave" hidden></button></div>
  </section>`,
  )
  const el = host.querySelector<HTMLElement>('.biglib')!
  const $ = <T extends HTMLElement>(s: string) => el.querySelector(s) as T
  const save = $<HTMLButtonElement>('#libSave')
  const seen = new IntersectionObserver((es) => {
    for (const e of es.filter((e) => e.isIntersecting)) {
      seen.unobserve(e.target)
      todo.push(piece((e.target as HTMLElement).dataset.lib!)!)
    }
    void fill()
  }, { rootMargin: '200px' })
  const away = () => (ui.grade === undefined ? [] : search(searchIndex, '', { grade: ui.grade }).map((i) => ps[i]).filter((p) => !local(p.id)))

  const draw = () => {
    const hits = search(searchIndex, ui.q, { grade: ui.grade, composer: ui.composer })
    const page = hits.slice(0, ui.shown).map((i) => ps[i])
    $('#libRows').innerHTML = page.length ? page.map((p) => row(p, prog)).join('') : `<tr><td colspan="4" class="empty">No piece matches. Try fewer words${ui.grade === undefined && ui.composer === undefined ? '' : ', or clear the filters'}.</td></tr>`
    $('#libCount').textContent = hits.length.toLocaleString()
    $('#libFound').textContent = ui.q || ui.grade !== undefined || ui.composer !== undefined ? (hits.length ? `${hits.length.toLocaleString()} ${hits.length === 1 ? 'piece' : 'pieces'} found` : 'No piece found') : '' // a screen reader hears the result of a search or filter
    $('#libShown').textContent = hits.length > page.length ? `${page.length.toLocaleString()} of ${hits.length.toLocaleString()}` : ''
    $('#libMore').hidden = hits.length <= page.length
    $('#libSkip').hidden = !page.length
    $('#libSkip').textContent = `Skip the ${page.length} ${page.length === 1 ? 'piece' : 'pieces'} listed`
    if (!ui.saving) {
      save.hidden = !away().length
      save.disabled = false
      save.textContent = `Save level ${ui.grade} for offline`
    }
    todo.length = 0
    seen.disconnect()
    for (const tr of $('#libRows').querySelectorAll<HTMLElement>('tr[data-lib]')) if (local(tr.dataset.lib!) && !meta.has(tr.dataset.lib!)) seen.observe(tr)
  }

  $<HTMLInputElement>('#libQ').addEventListener('input', (e) => {
    ui.q = (e.target as HTMLInputElement).value
    ui.shown = PAGE
    draw()
  })
  el.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement
    if (t.name === 'libGrade') ui.grade = t.value ? Number(t.value) : undefined
    else if (t.id === 'libWho') ui.composer = t.value ? Number(t.value) : undefined
    else return
    ui.shown = PAGE
    draw()
  })
  $('#libSkip').onclick = () => $('#libEnd').focus() // 50 rows of four buttons is 200 tab stops: a way past them (WCAG 2.4.1)
  $('#libMore').onclick = () => {
    ui.shown += PAGE
    draw()
  }
  // ponytail: one level at a time, four files in flight; no pause or resume, a second press after a failure retries what is missing
  save.onclick = async () => {
    const todo = away()
    const n = todo.length
    let done = 0
    let failed = 0
    ui.saving = true
    save.disabled = true
    const next = async (): Promise<void> => {
      const p = todo.shift()
      if (!p) return
      await pieceBytes(p).catch(() => failed++)
      save.textContent = `Saving ${++done} of ${n}`
      return next()
    }
    await Promise.all([next(), next(), next(), next()])
    ui.saving = false
    save.disabled = !failed
    save.textContent = failed ? `${failed} not saved. Try again` : 'Saved for offline'
  }
  wire(el)
  draw()
}
