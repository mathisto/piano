import './library-view.css'
import { catalog, gradeOf, local, pieceBytes, search, searchIndex } from './catalog'
import type { Piece } from './catalog-types'
import { licenceName } from './credits'
import type { Song } from './song'
import type { Progress } from './store'
import { thumb } from './thumb'
import { art, esc, mmss } from './ui'

// The open library on the Songs page: search, level and composer filters, and a list shown a page at a time,
// so thousands of pieces never become thousands of rows. Thumbnails only for files already on the device.

const PAGE = 50
const SEARCH = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>'
const ui = { q: '', grade: undefined as number | undefined, composer: undefined as number | undefined, shown: PAGE, saving: false }
const meta = new Map<string, { thumb: string; len: number }>()
const filling = new Set<string>()

const surname = (name: string) => name.split(' ').pop()!
const sig = (f: number) => (f > 0 ? `${f}♯ · ` : f < 0 ? `${-f}♭ · ` : '')

/** Key, metre and bars from the catalogue, where a piece not yet on the device has no thumbnail. */
const facts = (p: Piece) => (p.bars ? `<span class="pfacts">${sig(p.fifths)}${esc(p.meter)}<br>${p.bars} bars</span>` : '')

function row(p: Piece, prog: Map<string, Progress>) {
  const m = meta.get(p.id)
  const best = prog.get(`lib:${p.id}`)?.best
  const len = p.sec || m?.len
  return `<tr class="open" data-lib="${esc(p.id)}"><td class="thumb">${art(`lib:${p.id}`)}${m?.thumb ?? (local(p.id) ? '' : facts(p))}</td><td class="name">${esc(p.title)}<small><span>${esc(catalog.composers[p.composer]?.name ?? '')}</span> · <span>Level ${gradeOf(p)}</span> · <span>${esc(licenceName(catalog.licences[p.licence]?.id ?? ''))}</span></small></td><td class="num len">${len ? mmss(len) : ''}</td><td class="num">${best ? `<b>${Math.round(best.acc * 100)}%</b>` : ''}</td><td class="acts"><div class="row-actions">
    <button class="btn ghost" data-libplay="${esc(p.id)}" data-mode="learn" aria-label="Learn ${esc(p.title)}">Learn</button>
    <button class="btn ghost" data-libplay="${esc(p.id)}" data-mode="perform" aria-label="Perform ${esc(p.title)}">Perform</button></div></td></tr>`
}

/** Read the files already on the device, four at a time, for a thumbnail and a length. */
async function fill(ps: Piece[], load: (p: Piece) => Promise<Song>) {
  const todo = ps.filter((p) => local(p.id) && !meta.has(p.id) && !filling.has(p.id))
  todo.forEach((p) => filling.add(p.id))
  const next = async (): Promise<void> => {
    const p = todo.shift()
    if (!p) return
    try {
      const song = await load(p)
      meta.set(p.id, { thumb: thumb(song), len: song.end })
      const tr = document.querySelector(`#library tr[data-lib="${CSS.escape(p.id)}"]`)
      tr?.querySelector('.thumb')!.insertAdjacentHTML('beforeend', meta.get(p.id)!.thumb)
      if (tr && !p.sec) tr.querySelector('.len')!.textContent = mmss(song.end)
    } catch {
      /* a piece that will not parse still opens and reports its own error */
    }
    filling.delete(p.id)
    return next()
  }
  await Promise.all([next(), next(), next(), next()])
}

/** Append the open library to the Songs page. Filters survive leaving and coming back. */
export function mountLibrary(host: HTMLElement, prog: Map<string, Progress>, load: (p: Piece) => Promise<Song>) {
  const ps = catalog.pieces
  if (!ps.length) return
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
    <div class="libtools">
      <label class="libq">${SEARCH}<input type="search" id="libQ" placeholder="Title, composer or opus" aria-label="Search the open library" autocomplete="off" spellcheck="false" value="${esc(ui.q)}"></label>
      <div class="seg" role="radiogroup" aria-label="Level">${radio('', 'All levels', ui.grade === undefined)}${grades.map((g) => radio(String(g), String(g), ui.grade === g)).join('')}</div>
      ${who.length > 1 ? `<select id="libWho" aria-label="Composer"><option value="">All composers</option>${who.map((c) => `<option value="${c}"${ui.composer === c ? ' selected' : ''}>${esc(catalog.composers[c].name)} (${per.get(c)})</option>`).join('')}</select>` : ''}
    </div>
    <table class="songs"><caption class="sr-only">Open library</caption><colgroup><col><col><col style="width:100px"><col style="width:60px"><col style="width:200px"></colgroup><tbody id="libRows"></tbody></table>
    <div class="libmore"><p class="fine" id="libShown" role="status"></p><button class="btn ghost" id="libMore">Show ${PAGE} more</button><button class="btn ghost" id="libSave" hidden></button></div>
  </section>`,
  )
  const el = host.querySelector<HTMLElement>('.biglib')!
  const $ = <T extends HTMLElement>(s: string) => el.querySelector(s) as T
  const save = $<HTMLButtonElement>('#libSave')
  const away = () => (ui.grade === undefined ? [] : search(searchIndex, '', { grade: ui.grade }).map((i) => ps[i]).filter((p) => !local(p.id)))

  const draw = () => {
    const hits = search(searchIndex, ui.q, { grade: ui.grade, composer: ui.composer })
    const page = hits.slice(0, ui.shown).map((i) => ps[i])
    $('#libRows').innerHTML = page.length ? page.map((p) => row(p, prog)).join('') : `<tr><td colspan="5" class="empty">No piece matches. Try fewer words${ui.grade === undefined && ui.composer === undefined ? '' : ', or clear the filters'}.</td></tr>`
    $('#libCount').textContent = hits.length.toLocaleString()
    $('#libShown').textContent = hits.length > page.length ? `${page.length.toLocaleString()} of ${hits.length.toLocaleString()}` : ''
    $('#libMore').hidden = hits.length <= page.length
    if (!ui.saving) {
      save.hidden = !away().length
      save.disabled = false
      save.textContent = `Save level ${ui.grade} for offline`
    }
    void fill(page, load)
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
  draw()
}
