// A piece on the stage: opening it, leaving it, the start card, and the game's events. Features hook in through state.hooks.
import * as audio from '../audio'
import { chooserHtml, choices } from '../accomp'
import * as lib from '../catalog'
import * as coach from '../coach'
import { creditLine } from '../credits'
import type { GameEvent, Mode } from '../game'
import { facts, startCard } from '../memory'
import { knownPitches } from '../quiet'
import { paceHint } from '../paced'
import { lookCard } from '../readthrough'
import { save, settings } from '../settings'
import { autoLevel, canLead, type Level, LEVELS, simplify } from '../simplify'
import { barAt, type Song } from '../song'
import { STARTERS } from '../starters'
import * as store from '../store'
import { writtenTargets } from '../touch'
import { $, art } from '../ui'
import { esc } from '../util'
import { calibrating, current, dock, drill, drillStats, game, highway, hooks, mem, resOpen, rt, say, setCalibrating, setCurrent, setDock, setDrill, setHighway, setRun, setStaff, staff, starters } from './state'
import { flash, updateBanner } from './banner'
import { applyLayout, chordUpdate, feel, felt, fixChain, flushPractice, frame, popup, screenKeys, shown, syncMode, view, wake, zen } from './stage'
import { libSong, showLibrary } from './library'

/** Open a piece in Learn with two worst bars looped at a lower tempo. */
export async function fixBars(id: string, a: number, b: number) {
  await openById(id, 'learn')
  if (!current || current.song.id !== id) return
  const bars = current.song.bars
  a = Math.min(a, bars.length - 1) // a suggestion made for a longer version of the piece
  b = Math.min(Math.max(a, b), bars.length - 1)
  if (a < 0) return
  game.setRate(0.7)
  game.setLoop({ a: bars[a].t0, b: bars[b].t1 })
  syncMode()
  onPhase()
}

/** The play screen's code (Pixi, the staff, the dock, the recorder): fetched at idle after boot, awaited by the first piece. */
export const stageCode = () => Promise.all([import('../highway'), import('../staff'), import('../dock'), import('./take-ui'), import('../report'), import('../ui-results')])
let reportLink: typeof import('../report').reportLink // for the start card, which only shows once the stage is built

// one build, shared by pieces opened at once; a failed one (offline, chunk not fetched) is tried again by the next piece
let staging: Promise<void> | undefined
const ensureStage = () => (staging ??= buildStage().catch((e) => ((staging = undefined), Promise.reject(e))))

async function buildStage() {
  const [[{ Highway }, { Staff }, { Dock }, , report]] = await Promise.all([stageCode(), document.fonts.load('700 16px "Barlow Condensed"'), document.fonts.load('40px Bravura')])
  reportLink = report.reportLink
  const h = setHighway(new Highway($('#stage'), game))
  await h.init()
  h.onFrame = frame
  screenKeys(h.app.canvas)
  setStaff(new Staff($('#staff'), game))
  staff.onDense = () => void stepSimplify()
  setDock(new Dock($('#dock'), game))
  dock.onNote = flash
  dock.onHands = () => staff.render()
}

export async function openSong(base: Song, mode: Mode, paced = false) {
  game.endPass()
  // a busy arrangement opens at the mildest level that fits the staff; the start card can change it
  const level = mode === 'read' || base.id.startsWith('tech:') || base.id.startsWith('scale:') ? 0 : ((await store.getSimplify(base.id)) as Level | undefined) ?? autoLevel(base)
  const song = simplify(base, level, level === 4 ? (await import('../lead')).chordsOf : undefined) // lazy: the chord reader is not boot JS
  if (settings.asWritten && !song.dyn && mode !== 'read') {
    const w = writtenTargets(song.notes, settings.edges)
    if (w) song.notes.forEach((n, i) => (n.want = w[i]))
  }
  game.known = knownPitches(await store.getDrill())
  const back = shown()
  view('play')
  void audio.preload() // the piano is about to be wanted: Listen, the screen keys, browser sound
  try {
    await ensureStage()
  } catch {
    // the stage's code did not arrive (offline, a dropped connection): back to the page it was started from, with the reason, not an empty play screen
    // the browser remembers a failed import until the page reloads (checked in Chrome: a retry after the network is back fails the same way)
    const msg = 'The play screen could not load. Check the connection, then reload the page.'
    setDrill(undefined)
    setRun(undefined)
    hooks.rtEnd()
    hooks.memEnd()
    await hooks.showSection(!back || back === 'play' ? 'today' : back === 'library' ? 'songs' : back, msg)
    throw new Error(msg)
  }
  game.load(song, mode, paced)
  const prog = await store.getProgress(song.id, song.bars.length)
  setCurrent({ song, base, level, heat: prog.heat })
  $('#title').textContent = song.title
  $('#stagesBtn').hidden = mode !== 'read'
  document.body.classList.toggle('reading', mode === 'read')
  $('#brand').setAttribute('aria-label', 'Piano Forte: leave this piece')
  if (mode !== 'read') ($(`input[name=mode][value=${mode}]`) as HTMLInputElement).checked = true
  $('#modeSeg').hidden = mode === 'read'
  $('#play').classList.toggle('drill', mode === 'read')
  applyLayout()
  highway.layout()
  staff.render()
  dock.setSong(song, prog.heat)
  syncMode()
  dock.setPhase()
  resOpen(false)
  onPhase()
  if (!$('#ready').contains(document.activeElement)) $('#go').focus({ preventScroll: true }) // Play is the first stop of a new piece, not the ninth
  history.replaceState(null, '', mode === 'read' ? location.pathname : '#' + song.id)
}

export function leave() {
  if (document.body.classList.contains('zen')) zen()
  void flushPractice()
  document.body.classList.remove('hush')
  const wasDrill = !!drill
  const techSong = current?.song.id.startsWith('tech:')
  const scaleSong_ = current?.song.id.startsWith('scale:')
  if (drill) void store.saveDrill(drillStats)
  setDrill(undefined)
  setRun(undefined)
  hooks.rtEnd()
  hooks.memEnd()
  staff.lookahead = 0
  game.endPass()
  if (game.phase === 'countin' || game.phase === 'playing' || game.phase === 'waiting') game.toggle()
  if (calibrating) {
    settings.offset = calibrating.prevOffset
    setCalibrating(undefined)
  }
  setCurrent(undefined)
  $('#stagesBtn').hidden = true
  document.body.classList.remove('reading')
  $('#play').classList.remove('drill')
  history.replaceState(null, '', location.pathname)
  void hooks.showSection(wasDrill ? 'read' : scaleSong_ ? 'scales' : techSong ? 'technique' : 'songs')
}

game.on((e: GameEvent) => {
  switch (e.type) {
    case 'press':
      staff?.ghost(e.p, e.t)
      chordUpdate()
      break
    case 'release':
      staff?.ghostEnd(e.p)
      chordUpdate()
      break
    case 'hit':
      feel(e.note, e.v)
      highway.hit(e.note.p, e.grade, e.note.h)
      staff.ghostHit(e.note.p, e.note.id, e.grade)
      staff.mark(e.note.id, `hit-${e.grade}`)
      if (!game.paced) popup(e.grade, e.off, e.note.p, e.note.id, e.vel) // a paced run keeps the eyes on the staff: the marks are enough
      break
    case 'ok':
      feel(e.note, e.v)
      highway.hit(e.note.p, 'ok', e.note.h)
      staff.ghostHit(e.note.p, e.note.id, 'great')
      staff.mark(e.note.id, 'hit-ok')
      if (e.vel) popup(null, 0, e.note.p, e.note.id, e.vel)
      if (drill) hooks.drillOk(e.note.id, e.rt, e.clean)
      break
    case 'hold':
      if (e.grade === 'short') staff.cut(e.note.id)
      else if (e.grade === 'long') staff.over(e.note.id)
      break
    case 'miss':
      staff.mark(e.note.id, 'miss')
      if (!game.paced) popup('miss', 0, e.note.p, e.note.id)
      break
    case 'wrong':
      highway.wrong(e.p)
      staff.ghostBad(e.p)
      staff.uncover()
      break
    case 'loop':
      fixChain(e.clean)
      break
    case 'short':
      flash('Hold it a little longer')
      break
    case 'tempo':
      dock.sync()
      say(`Tempo ${Math.round(e.rate * 100)} percent`)
      flash(`Tempo ${Math.round(e.rate * 100)}%`)
      break
    case 'phase':
      onPhase()
      break
    case 'pass':
      if (current && game.mode !== 'read') void store.commit(current.song.id, e.heat, current.song.bars.length)
      break
    case 'done':
      void hooks.onDone(e.result)
      break
  }
})

export function onPhase() {
  if (!dock || !current) return
  if (game.phase === 'ready') {
    for (const f of Object.values(felt)) (f.v = []), (f.t = -1)
    const s = game.song
    void coach.arm(s.id).then((m) => m === 'none' && coach.coached(s.id, s.dyn, game.mode) && flash('A test run: no touch marks this time'))
  }
  dock.setPhase()
  const r = $('#ready')
  r.hidden = game.phase !== 'ready'
  $('#modeSeg').hidden = game.mode === 'read' || game.phase === 'ready' // the start card carries the choice until play begins
  if (game.phase === 'ready') {
    resOpen(false)
    let legend = ''
    try {
      if (!localStorage.getItem('piano.legend') && !drill && !calibrating && !rt && game.view !== 'sheet') {
        legend = '<div class="legend"><span><i class="sw R"></i>Right hand</span><span><i class="sw L"></i>Left hand</span><span><i class="sw lamp"></i>Play this</span></div>'
        localStorage.setItem('piano.legend', '1') // the colours explain themselves after one song
      }
    } catch {
      /* private mode: the legend shows every time */
    }
    const go = matchMedia('(pointer: coarse)').matches ? 'Tap Play to start.' : 'Press Space to start.'
    const sheet = `<div class="seg" role="radiogroup" aria-label="Mode">${(['perform', 'learn'] as const).map((v) => `<label><input type="radio" name="modeSheet" value="${v}"${game.mode === v ? ' checked' : ''}><span>${v === 'perform' ? 'Perform' : 'Learn'}</span></label>`).join('')}</div><span class="hint">${game.mode === 'perform' ? 'Scored. The song does not wait.' : 'No score. The song waits for you.'} ${go}</span>`
    const lp = current.base.id.startsWith('lib:') ? lib.piece(current.base.id.slice(4)) : undefined
    const report = lp ? reportLink(lib.catalog, lp, game.t > 0 ? barAt(game.song.bars, game.t) + 1 : undefined) : ''
    const shows = current.base.notes.length > 0 && simplify(current.base, 3).notes.length < current.base.notes.length * 0.9
    const levels = shows ? `<div class="shows"><span class="cap">Notes shown</span><div class="seg" role="radiogroup" aria-label="Notes shown">${([0, 1, 2, 3, 4] as const).filter((l) => l < 4 || canLead(current!.base)).map((l) => `<label><input type="radio" name="level" value="${l}"${current!.level === l ? ' checked' : ''}><span>${LEVELS[l]}</span></label>`).join('')}</div></div>${current.level === 4 ? `<div class="chords"><label class="switch ghostsw" title="A block chord with its bass on each half bar, at the tempo"><input type="checkbox" id="compOn"${settings.comp ? ' checked' : ''}><i></i>App plays the chords</label><span class="hint">Chords from the harmony of the piece, not the composer's marks.</span></div>` : ''}` : ''
    r.innerHTML = mem
      ? startCard({ title: current.song.title, stage: mem.stage, facts: facts(current.song), go })
      : rt
      ? lookCard({ title: current.song.title, left: rt.left, rate: rt.rate, ahead: !!settings.readAhead, why: rt.why, credit: current.credit })
      : drill
      ? `<b>${esc(drill.title)}</b>${drill.run?.spec.pace ? `<span class="hint">${paceHint({ bpm: drill.run.spec.pace, every: drill.run.spec.every })}</span>` : ''}<span class="hint">${go}</span>`
      : calibrating
        ? `<b>Play middle C on every beat</b><span class="hint">${go}</span>`
        : `${art(current.song.id, 'art cover')}<b>${esc(current.song.title)}</b>${current.credit ? `<span class="hint">${esc(current.credit)}</span>` : ''}${sheet}${chooserHtml(current.song, game.hands, game.parts, esc)}${levels}${legend}${report}`
    r.querySelectorAll<HTMLInputElement>('input[name=level]').forEach((x) => (x.onchange = async () => {
      if (!current) return
      const { base, credit } = current
      const { you, parts } = game
      await store.setSimplify(base.id, Number(x.value))
      await openSong(base, game.mode)
      game.accomp(you, [...parts]) // the part you chose survives a change of notes shown
      if (current) current.credit = credit
      syncMode()
      onPhase()
    }))
    r.querySelector<HTMLInputElement>('#compOn')?.addEventListener('change', (e) => ((settings.comp = (e.target as HTMLInputElement).checked), save()))
    r.querySelectorAll<HTMLInputElement>('input[name=you]').forEach((x) => (x.onchange = () => {
      const c = choices(game.song).find((c) => c.id === x.value)
      if (!c) return
      game.accomp(c.hands, c.parts)
      syncMode()
      staff.render()
      onPhase()
      $<HTMLInputElement>(`#ready input[name=you][value="${c.id}"]`).focus()
    }))
    r.querySelectorAll<HTMLInputElement>('input[name=modeSheet]').forEach((x) => (x.onchange = () => chooseMode(x.value as Mode)))
    r.querySelectorAll<HTMLInputElement>('input[name=memStage]').forEach((x) => (x.onchange = () => hooks.memStage(Number(x.value))))
  }
  if (rt) hooks.rtPhase()
  wake()
  if (game.phase === 'paused') say('Paused')
  if (game.phase === 'waiting') say('Waiting for you')
  updateBanner()
}

/** Thin the notes one level, from the 'too dense' hint on the staff. */
async function stepSimplify() {
  if (!current || current.level >= 3) return
  const { base, credit } = current
  await store.setSimplify(base.id, current.level + 1)
  await openSong(base, game.mode)
  if (current) current.credit = credit
  onPhase()
}

function chooseMode(mode: Mode) {
  game.endPass()
  game.setMode(mode)
  ;($(`input[name=mode][value=${mode}]`) as HTMLInputElement).checked = true
  resOpen(false)
  syncMode()
  onPhase()
}

for (const r of document.querySelectorAll<HTMLInputElement>('input[name=mode]')) r.onchange = () => chooseMode(r.value as Mode)

document.addEventListener('visibilitychange', () => {
  if (document.hidden && (game.phase === 'playing' || game.phase === 'countin' || game.phase === 'waiting')) game.toggle()
})
addEventListener('pagehide', () => game.endPass())

/** Fetch a piece from the open library, then play it like any imported file, with its credit on the start card. */
export async function openLibrary(id: string, mode: Mode) {
  const p = lib.piece(id)
  if (!p) return
  try {
    await openSong(await libSong(p), mode)
    if (current) current.credit = creditLine(lib.catalog, p)
    onPhase()
  } catch (err) {
    void hooks.showSection('songs', (err as Error).message)
  }
}

export async function openById(id: string, mode: Mode) {
  if (id.startsWith('lib:')) return openLibrary(id.slice(4), mode)
  const i = STARTERS.findIndex((s) => s.spec.id === id)
  if (i >= 0) return openSong(starters[i], mode) // awaited: fixBars and readThrough look at the piece once it is open
  const row = (await store.listSongs()).find((s) => s.id === id)
  if (row) {
    try {
      await openSong(await store.toSong(row, settings.split), mode)
    } catch (err) {
      void showLibrary((err as Error).message)
    }
  }
}
