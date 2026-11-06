import { memTag } from './memory'
import './library-view.css'
import { catalog, gradeOf, local, net, piece, pieceBytes, retry, search, searchIndex } from './catalog'
import { active, counts, type FacetId, FORMS, label, LANES, LENGTHS, KEYS, meets, NOTES, PERIODS, type Lane, type Sel, type Value, values, ways } from './facets'
import type { Piece } from './catalog-types'
import { licenceName } from './credits'
import { type DamagedSong, wireRecovery } from './recovery'
import type { Song } from './song'
import type { Progress } from './store'
import { coverHtml, drawCovers, keep, paint, pieceMeta, surname } from './cover'
import { head, mmss, notice, rowMenu, type Row } from './ui'
import { icon } from './icons'
import { noMusic } from './empty'
import { esc } from './util'

// The open library on the Songs page: search, level and composer filters, and a list shown a page at a time,
// so thousands of pieces never become thousands of rows. Covers drawn as rows scroll in: from the score for a file on the device, an empty staff in the catalogue's key for the rest.

const PAGE = 50
const SEARCH = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>'
const ui = { q: '', sel: { lane: 'piece' } as Sel, laneSet: false, more: false, shown: PAGE, saving: false } // lane: Pieces until the player picks another; laneSet: picked by hand
const meta = new Map<string, number>() // the length of each file read this session, in seconds
const todo: Piece[] = []
let busy = false
let load: (p: Piece) => Promise<Song>


function row(p: Piece, prog: Map<string, Progress>) {
  const best = prog.get(`lib:${p.id}`)?.best
  const len = p.sec || meta.get(p.id)
  const cover = coverHtml(`lib:${p.id}`, 'thumb', pieceMeta(p, catalog.composers[p.composer]?.name), true)
  return `<tr class="open" data-lib="${esc(p.id)}"><td class="thumb">${cover}</td><td class="name">${esc(p.title)}${(prog.get(`lib:${p.id}`)?.days?.length ?? 0) >= 2 ? ' <span class="tag">Ready</span>' : ''}${memTag(prog.get(`lib:${p.id}`))}<small><span>${esc(surname(catalog.composers[p.composer]?.name ?? ''))}</span> · <span>Level ${gradeOf(p)}</span> · <span>${esc(licenceName(catalog.licences[p.licence]?.id ?? '').replace('Public Domain', 'Public domain'))}</span> <span class="len">${len ? `· ${mmss(len)}` : ''}</span></small></td><td class="num">${best ? `<b>${Math.round(best.acc * 100)}%</b>` : ''}</td><td class="acts"><div class="row-actions">
    <button class="btn ghost" data-libplay="${esc(p.id)}" data-mode="learn" aria-label="Learn ${esc(p.title)}">${icon('play')}Learn</button>
    ${rowMenu(p.title, `<button class="btn ghost" data-libplay="${esc(p.id)}" data-mode="perform">Perform</button>
    <button class="btn ghost" data-listen="lib:${esc(p.id)}">Listen</button>
    <button class="btn ghost" data-rt="lib:${esc(p.id)}">Read through</button>
    <button class="btn ghost" data-mem="lib:${esc(p.id)}">Memorise</button>`)}</div></td></tr>`
}

/** Read a file already on the device for its cover and a length, one at a time and only for rows scrolled into view:
 *  parsing all ~40 bundled files on arrival took ~1.2 s of CPU at 4x and held up the next tap. */
async function fill() {
  if (busy) return
  busy = true
  for (let p; (p = todo.shift()); ) {
    if (meta.has(p.id)) continue
    try {
      const song = await load(p)
      meta.set(p.id, song.end)
      keep(`lib:${p.id}`, song)
      const tr = document.querySelector(`#library tr[data-lib="${CSS.escape(p.id)}"]`)
      const cv = tr?.querySelector<HTMLElement>('.cover')
      if (cv) await paint(cv)
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
  host.querySelector('.biglib')?.remove() // two Songs renders in flight both mount: the last one is the one kept
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
  const vs = values(catalog)
  const per = new Map<number, number>()
  for (const p of ps) per.set(p.composer, (per.get(p.composer) ?? 0) + 1)
  const who = [...per.keys()].filter((c) => catalog.composers[c]).sort((a, b) => surname(catalog.composers[a].name).localeCompare(surname(catalog.composers[b].name)))
  if (ui.sel.composer !== undefined && !per.has(ui.sel.composer as number)) delete ui.sel.composer
  const total = (f: FacetId) => new Set(vs.map((v) => v[f]).filter((x) => x !== undefined))
  const grades = [...total('grade')].sort() as number[]
  const forms = FORMS.filter(([f]) => total('form').has(f))
  const radio = (name: string, v: string, label: string) => `<label><input type="radio" name="${name}" value="${v}"><span>${label}<small></small></span></label>`

  host.insertAdjacentHTML(
    'beforeend',
    `<section class="biglib" aria-labelledby="libCap">
    <h2 class="sec" id="libCap">Open library<span id="libCount"></span></h2>
    ${lost ? notice('Showing the pieces that come with the app. The rest of the open library needs a connection.', again) : ''}
    <div class="libtools">
      <label class="libq">${SEARCH}<input type="search" id="libQ" placeholder="Title, composer or opus" aria-label="Search the open library" autocomplete="off" spellcheck="false" value="${esc(ui.q)}"></label>
      <div class="seg lanes" role="radiogroup" aria-label="Kind">${LANES.map(([l, name]) => radio('libLane', l, name)).join('')}</div>
    </div>
    <p class="fine lanenote" id="libNote" hidden></p>
    <div class="libtools facets" role="group" aria-label="Filters">
      <div class="seg" role="radiogroup" aria-label="Level">${radio('libGrade', '', 'All levels')}${grades.map((g) => radio('libGrade', String(g), String(g))).join('')}</div>
      <select id="libLen" aria-label="Length"></select>
      <select id="libKey" aria-label="Key signature"></select>
      <select id="libPeriod" aria-label="Period"></select>
      <button class="btn ghost" id="libFacets" aria-expanded="false" aria-controls="libExtra">More</button>
      <span class="libextra" id="libExtra" hidden>
        ${forms.length ? '<select id="libForm" aria-label="Form"></select>' : ''}
        ${who.length > 1 ? '<select id="libWho" aria-label="Composer"></select>' : ''}
      </span>
      <button class="btn ghost sr-only" id="libSkip"></button>
    </div>
    <div class="libchips" id="libChips" role="group" aria-label="Chosen filters" hidden></div>
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

  /** The selection as it applies now: typing in the search box looks in every lane, unless a lane was chosen by hand. */
  const eff = (): Sel => ({ ...ui.sel, lane: ui.q && !ui.laneSet ? 'all' : ui.sel.lane })
  const n = (x: number) => x.toLocaleString()
  const select = (id: string, all: string, list: [Value, string][], f: FacetId, c: Map<Value, number>, sel: Sel) => {
    const e = $<HTMLSelectElement>(id)
    if (e)
      e.innerHTML = `<option value="">${all}</option>${list.map(([v, name]) => `<option value="${v}"${sel[f] === v ? ' selected' : ''}${c.get(v) || sel[f] === v ? '' : ' disabled'}>${esc(name)} (${n(c.get(v) ?? 0)})</option>`).join('')}`
  }
  const choose = (name: string, value: string, count: number, on: boolean) => {
    const i = el.querySelector<HTMLInputElement>(`input[name=${name}][value="${value}"]`)!
    i.checked = on
    i.disabled = !count && !on
    i.setAttribute('aria-label', `${i.nextElementSibling!.firstChild!.textContent}, ${count} ${count === 1 ? 'piece' : 'pieces'}`)
    i.nextElementSibling!.querySelector('small')!.textContent = n(count)
  }

  const draw = () => {
    const sel = eff()
    const byQ = search(searchIndex, ui.q)
    const hits = byQ.filter((i) => meets(vs[i], sel))
    if (!ui.q && (sel.lane === 'accomp' || sel.lane === 'study')) {
      const name = (i: number) => catalog.composers[ps[i].composer]?.name ?? ''
      hits.sort((a, b) => name(a).localeCompare(name(b)) || ps[a].id.localeCompare(ps[b].id, 'en', { numeric: true })) // a collection reads in its own order
    }
    const page = hits.slice(0, ui.shown).map((i) => ps[i])
    // the facets: every value with the pieces it would leave under all the others; a value with none behind it is off
    const c = (f: FacetId) => counts(vs, byQ, sel, f)
    const lanes = c('lane')
    for (const [l] of LANES) choose('libLane', l, l === 'all' ? [...lanes.values()].reduce((a, b) => a + b, 0) : lanes.get(l) ?? 0, sel.lane === l)
    const gc = c('grade')
    choose('libGrade', '', [...gc.values()].reduce((a, b) => a + b, 0), sel.grade === undefined)
    for (const g of grades) choose('libGrade', String(g), gc.get(g) ?? 0, sel.grade === g)
    select('#libLen', 'Any length', LENGTHS.map((l, i) => [i, l]), 'len', c('len'), sel)
    select('#libKey', 'Any key', KEYS.map((l, i) => [i, l]), 'key', c('key'), sel)
    select('#libPeriod', 'Any period', PERIODS, 'period', c('period'), sel)
    select('#libForm', 'Any form', forms, 'form', c('form'), sel)
    select('#libWho', 'Any composer', who.map((w) => [w, catalog.composers[w].name]), 'composer', c('composer'), sel)
    const more = $<HTMLButtonElement>('#libFacets')
    const open = ui.more || sel.form !== undefined || sel.composer !== undefined
    more.setAttribute('aria-expanded', String(open))
    $('#libExtra').hidden = !open
    const note = $('#libNote')
    note.textContent = NOTES[sel.lane]
    if (sel.lane === 'study') note.insertAdjacentHTML('beforeend', ' <button class="link" data-go="technique">In order, as packs: Technique</button>') // the lane is the pile; a pack is the order
    note.hidden = !NOTES[sel.lane]
    const on = active(sel)
    const chips = $('#libChips')
    chips.hidden = !on.length
    chips.innerHTML = on.length ? `${on.map((f) => `<button class="chip-btn on" data-rm="${f}" aria-label="Remove ${esc(label(f, sel[f]!, catalog))}">${esc(label(f, sel[f]!, catalog))}${icon('x')}</button>`).join('')}<button class="btn ghost sm" data-rm="*">Clear filters</button>` : ''
    $('#libRows').innerHTML = page.length ? page.map((p) => row(p, prog)).join('') : `<tr><td colspan="4" class="empty zero">${zero(sel, byQ)}</td></tr>`
    $('#libCount').textContent = n(hits.length)
    const said = [ui.q && `“${ui.q}”`, ...on.map((f) => label(f, sel[f]!, catalog)), sel.lane !== 'all' && label('lane', sel.lane, catalog)].filter(Boolean)
    $('#libFound').textContent = said.length > 1 || ui.q || on.length ? (hits.length ? `${n(hits.length)} ${hits.length === 1 ? 'piece' : 'pieces'} found` : 'No piece found') : '' // a screen reader hears the result of a search or filter
    $('#libShown').textContent = hits.length > page.length ? `${n(page.length)} of ${n(hits.length)}` : ''
    $('#libMore').hidden = hits.length <= page.length
    $('#libSkip').hidden = !page.length
    $('#libSkip').textContent = `Skip the ${page.length} ${page.length === 1 ? 'piece' : 'pieces'} listed`
    if (!ui.saving) {
      save.hidden = sel.grade === undefined || !away(hits).length
      save.disabled = false
      save.textContent = `Save level ${sel.grade} for offline`
    }
    drawCovers($('#libRows')) // every row from the sidecar (an empty staff stands in until it arrives); a file on the device is also drawn as it is read, below
    todo.length = 0
    seen.disconnect()
    for (const tr of $('#libRows').querySelectorAll<HTMLElement>('tr[data-lib]')) if (local(tr.dataset.lib!) && !meta.has(tr.dataset.lib!)) seen.observe(tr)
  }
  const away = (hits: number[]) => hits.map((i) => ps[i]).filter((p) => !local(p.id))

  /** No piece: what was asked, and each way to take one thing away with the pieces it would bring back. */
  const zero = (sel: Sel, byQ: number[]) => {
    const names = [ui.q && `“${esc(ui.q)}”`, ...active(sel).map((f) => esc(label(f, sel[f]!, catalog))), sel.lane !== 'all' && esc(label('lane', sel.lane, catalog))].filter(Boolean) as string[]
    const w = ways(vs, byQ, sel).map(({ facet, gain }) => ({ rm: facet, text: facet === 'lane' ? 'Show every kind' : `Remove ${label(facet, sel[facet]!, catalog)}`, gain }))
    const bare = ui.q ? ps.map((_, i) => i).filter((i) => meets(vs[i], sel)).length : 0
    if (bare) w.push({ rm: 'q' as FacetId, text: 'Clear the search', gain: bare })
    return `<p>No piece matches ${names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] ?? 'this'}.</p>${w.length ? `<p class="ways">${w.sort((a, b) => b.gain - a.gain).slice(0, 3).map((x) => `<button class="btn ghost" data-rm="${x.rm}">${esc(x.text)} (+${n(x.gain)})</button>`).join('')}</p>` : ''}`
  }

  $<HTMLInputElement>('#libQ').addEventListener('input', (e) => {
    ui.q = (e.target as HTMLInputElement).value
    if (!ui.q) ui.laneSet = false // the box emptied: back to the default lane
    ui.shown = PAGE
    draw()
  })
  const num: FacetId[] = ['grade', 'len', 'key', 'composer']
  const set = (f: FacetId, raw: string) => {
    if (f === 'lane') (ui.sel.lane = raw as Lane), (ui.laneSet = true)
    else if (!raw) delete ui.sel[f]
    else ui.sel[f] = num.includes(f) ? Number(raw) : raw
    ui.shown = PAGE
    draw()
  }
  el.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement
    const f = ({ libLane: 'lane', libGrade: 'grade', libLen: 'len', libKey: 'key', libPeriod: 'period', libForm: 'form', libWho: 'composer' } as Record<string, FacetId>)[t.name || t.id]
    if (f) set(f, t.value)
  })
  el.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-go]')) return document.querySelector<HTMLInputElement>('#nav input[value=technique]')?.click()
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-rm]')
    if (!b) return
    const f = b.dataset.rm!
    const focus = f === '*' || f === 'q' ? '#libQ' : null
    if (f === '*') for (const k of active(ui.sel)) delete ui.sel[k]
    else if (f === 'q') (ui.q = ''), ($<HTMLInputElement>('#libQ').value = ''), (ui.laneSet = false)
    else if (f === 'lane') (ui.sel.lane = 'all'), (ui.laneSet = true)
    else delete ui.sel[f as FacetId]
    ui.shown = PAGE
    draw()
    if (focus) $(focus).focus()
  })
  $('#libFacets').onclick = () => {
    ui.more = $('#libExtra').hidden === true
    draw()
  }
  $('#libSkip').onclick = () => $('#libEnd').focus() // 50 rows of four buttons is 200 tab stops: a way past them (WCAG 2.4.1)
  $('#libMore').onclick = () => {
    ui.shown += PAGE
    draw()
  }
  // ponytail: one level at a time, four files in flight; no pause or resume, a second press after a failure retries what is missing
  save.onclick = async () => {
    const sel = eff()
    const todo = away(search(searchIndex, ui.q).filter((i) => meets(vs[i], sel)))
    const total = todo.length
    let done = 0
    let failed = 0
    ui.saving = true
    save.disabled = true
    const next = async (): Promise<void> => {
      const p = todo.shift()
      if (!p) return
      await pieceBytes(p).catch(() => failed++)
      save.textContent = `Saving ${++done} of ${total}`
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

// the Songs page's tables: the starters and your files (the open library's rows are below in row())

function table(caption: string, rows: Row[], empty: string) {
  const best = rows.some((r) => r.prog?.best) // no column of dashes before the first score
  const body = rows.length
    ? rows
        .map(
          (r) => `<tr class="open" data-open="${esc(r.id)}">
        <td class="thumb">${coverHtml(r.id, 'thumb', r.cover)}</td>
        <td class="name">${esc(r.title)}${(r.prog?.days?.length ?? 0) >= 2 ? ' <span class="tag">Ready</span>' : ''}${memTag(r.prog)}<small>${esc(r.sub)}${r.len ? ` · ${mmss(r.len)}` : ''}</small></td>
        ${best ? `<td class="num">${r.prog?.best ? `<b>${Math.round(r.prog.best.acc * 100)}%</b>` : '—'}</td>` : ''}
        <td class="acts"><div class="row-actions">
          <button class="btn${r.cont ? ' primary' : ' ghost'}" data-play="${esc(r.id)}" data-mode="learn" aria-label="Learn ${esc(r.title)}">${icon('play')}Learn</button>
          ${rowMenu(r.title, `<button class="btn ghost" data-play="${esc(r.id)}" data-mode="perform">Perform</button>
            <button class="btn ghost" data-listen="${esc(r.id)}">Listen</button>
            <button class="btn ghost" data-rt="${esc(r.id)}">Read through</button>
            <button class="btn ghost" data-mem="${esc(r.id)}">Memorise</button>
            ${r.tracks ? `<button class="btn ghost" data-tracks="${esc(r.id)}">Options</button>` : ''}`)}
        </div></td></tr>`,
        )
        .join('')
    : `<tr><td colspan="${best ? 4 : 3}" class="empty">${empty}</td></tr>`
  const id = `sec${caption.replace(/\W/g, '')}`
  return `<h2 class="sec" id="${id}">${caption}${rows.length ? `<span>${rows.length}</span>` : ''}</h2><table class="songs" aria-labelledby="${id}">
    <colgroup><col><col>${best ? '<col style="width:90px">' : ''}<col class="acol"></colgroup>
    ${rows.length ? `<thead><tr><th scope="col"><span class="sr-only">Preview</span></th><th scope="col">Piece</th>${best ? '<th scope="col" class="num">Best</th>' : ''}<th scope="col"><span class="sr-only">Actions</span></th></tr></thead>` : ''}
    <tbody>${body}</tbody></table>`
}

export function library(el: HTMLElement, starters: Row[], mine: Row[], err = '', damaged: DamagedSong[] = [], redraw?: () => void) {
  const bad = damaged.length === 1 ? `${damaged[0].title} could not be read, so it was skipped.` : `${damaged.length} files could not be read, so they were skipped.`
  el.innerHTML = `
    ${head('Songs', `<button class="btn" id="addFiles">${icon('plus')}Add files</button><input id="file" type="file" accept=".mid,.midi,.musicxml,.xml,.mxl,.pthpack,audio/midi" multiple hidden>`, 'Bring your own MIDI or MusicXML. Files stay on this device.')}
    <p class="err" role="alert" id="drop">${esc(err)}</p>
    ${damaged.length ? notice(bad, `<button class="btn ghost" data-forget-damaged>Remove damaged ${damaged.length === 1 ? 'copy' : 'copies'}</button>`) : ''}
    ${table('Starter pieces', starters, '')}
    ${table('Your files', mine, noMusic('Add a MIDI or MusicXML file, or drop one anywhere on this page.'))}`
  const add = el.querySelector?.('#addFiles') as HTMLButtonElement | undefined
  if (add) add.onclick = () => el.querySelector<HTMLInputElement>('#file')!.click()
  if (redraw) wireRecovery(el, damaged, redraw)
}
