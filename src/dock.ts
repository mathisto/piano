import './metronome.css'
import type { Game, HandMode } from './game'
import { icon } from './icons'
import { beatAt, METROS } from './metronome'
import { save, settings } from './settings'
import type { Song } from './song'

const HANDS: HandMode[] = ['play', 'listen', 'hide']

const handSeg = (h: 'R' | 'L') => `
  <div class="hand ${h}"><i class="sw"></i><span class="cap hlbl" style="font-weight:700">${h === 'R' ? 'Right' : 'Left'}</span>
    <div class="seg" role="radiogroup" aria-label="${h === 'R' ? 'Right' : 'Left'} hand">
      ${HANDS.map((m, i) => `<label><input type="radio" name="hand${h}" value="${m}"${i === 0 ? ' checked' : ''}><span>${m[0].toUpperCase() + m.slice(1)}</span></label>`).join('')}
    </div>
  </div>`

export class Dock {
  private scrub: HTMLElement
  private svg: SVGSVGElement
  private head: HTMLElement
  private tip: HTMLElement
  private loopEl: HTMLElement
  private go: HTMLButtonElement
  private tempo: HTMLInputElement
  private tempoVal: HTMLElement
  private wait: HTMLInputElement
  private song!: Song
  private heat: number[] = []
  private lastHeat = 0
  private beatKey = ''
  onNote = (_msg: string) => {}
  onHands = () => {}

  constructor(
    private host: HTMLElement,
    private game: Game,
  ) {
    host.innerHTML = `
      <div class="dock-row">
        <button class="btn primary big" id="go"></button>
        <button class="btn icon" id="restart" aria-label="Restart from the top" title="Restart">${icon('restart')}</button>
        <button class="btn icon ghost" id="zen" aria-label="Hide controls" aria-pressed="false" title="Hide controls (M)">${icon('focus')}</button>
        <div class="scrub" id="scrub" data-modes="perform learn">
          <svg viewBox="0 0 1000 44" preserveAspectRatio="none" aria-hidden="true"></svg>
          <div class="loop" hidden></div>
          <div class="head"></div>
          <div class="lbl tip" hidden></div>
        </div>
        <div class="metro" data-modes="perform learn">
          <button class="btn" id="metro" aria-pressed="false" title="Metronome: off, beats, beats and eighths (B)"></button>
          <span class="beats" id="beats" aria-hidden="true"></span>
        </div>
        <div class="dock-end" data-modes="learn">
          <button class="btn" id="loopWorst" hidden>${icon('loop')}Loop worst bars</button>
          <button class="btn" id="loopClear" hidden>Clear loop</button>
        </div>
      </div>
      <div class="dock-row aids" data-modes="learn read">
        <label class="switch" data-modes="learn"><input type="checkbox" id="wait" checked><i></i>Wait for me</label>
        <label class="switch" data-modes="read"><input type="checkbox" id="showNotes"><i></i>Falling notes</label>
        <label class="switch" data-modes="read"><input type="checkbox" id="showNames"><i></i>Note names</label>
        <div class="grp">
          <span class="cap">Tempo</span>
          <button class="btn icon sm touch-only" id="tempoDown" aria-label="Slower" title="Slower">−</button>
          <input class="tempo" id="tempo" type="range" min="25" max="125" step="5" value="100" aria-label="Tempo percent">
          <span class="tempo-val" id="tempoVal">100%</span>
          <button class="btn icon sm touch-only" id="tempoUp" aria-label="Faster" title="Faster">+</button>
          ${[50, 75, 100].map((t) => `<button class="btn sm" data-t="${t}" aria-label="Tempo ${t} percent">${t}</button>`).join('')}
          <button class="btn sm" id="ladder" aria-pressed="true" title="Three clean passes of the loop raise the tempo 5%; two messy ones lower it" hidden></button>
        </div>
        <div class="pop" data-modes="learn">
          <button class="btn" id="aidsBtn" aria-expanded="false" aria-haspopup="true" aria-controls="aidsMenu">Aids</button>
          <div class="popmenu" id="aidsMenu" hidden>
            <label class="switch"><input type="checkbox" id="hidePlayed"><i></i>Hide played</label>
            <label class="switch"><input type="checkbox" id="holdAdvance"><i></i>Hold to advance</label>
          </div>
        </div>
        <span class="dock-fill"></span>
        <div class="grp" data-modes="learn">${handSeg('R')}${handSeg('L')}</div>
      </div>`
    const q = <T extends HTMLElement>(s: string) => host.querySelector(s) as T
    this.scrub = q('#scrub')
    this.svg = host.querySelector('.scrub svg') as SVGSVGElement
    this.head = q('.head')
    this.tip = q('.tip')
    this.loopEl = q('.loop')
    this.go = q('#go')
    this.tempo = q('#tempo')
    this.tempoVal = q('#tempoVal')
    this.wait = q('#wait')

    this.go.onclick = () => game.toggle()
    q('#restart').onclick = () => game.restart()
    this.tempo.oninput = () => {
      game.setRate(Number(this.tempo.value) / 100)
      this.sync()
    }
    host.querySelectorAll<HTMLButtonElement>('[data-t]').forEach((b) => (b.onclick = () => {
      game.setRate(Number(b.dataset.t) / 100)
      this.sync()
    }))
    q('#tempoDown').onclick = () => (game.setRate(game.rate - 0.05), this.sync())
    q('#tempoUp').onclick = () => (game.setRate(game.rate + 0.05), this.sync())
    this.wait.onchange = () => game.setWait(this.wait.checked)
    q<HTMLInputElement>('#holdAdvance').onchange = (e) => (game.holdAdvance = (e.target as HTMLInputElement).checked)
    q<HTMLInputElement>('#hidePlayed').onchange = (e) => (game.hidePlayed = (e.target as HTMLInputElement).checked)
    q('#ladder').onclick = () => ((game.autoTempo = !game.autoTempo), this.sync())
    q('#metro').onclick = () => this.cycleMetro()
    this.syncMetro()
    q<HTMLInputElement>('#showNotes').onchange = (e) => (game.showNotes = (e.target as HTMLInputElement).checked)
    q<HTMLInputElement>('#showNames').onchange = (e) => (game.showNames = (e.target as HTMLInputElement).checked)
    for (const h of ['R', 'L'] as const) {
      host.querySelectorAll<HTMLInputElement>(`input[name=hand${h}]`).forEach((r) => (r.onchange = () => {
        game.setHand(h, r.value as HandMode)
        this.onHands()
      }))
    }
    q('#loopWorst').onclick = () => this.loopWorst()
    q('#loopClear').onclick = () => {
      game.setLoop(null)
      this.sync()
    }
    // the assist switches live in one popover: closes on an outside click or Escape
    const btn = q<HTMLButtonElement>('#aidsBtn')
    const menu = q('#aidsMenu')
    const set = (open: boolean) => {
      menu.hidden = !open
      btn.setAttribute('aria-expanded', String(open))
    }
    btn.onclick = () => set(menu.hidden === true)
    document.addEventListener('click', (e) => !(e.target as HTMLElement).closest('.pop') && set(false))
    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        set(false)
        btn.focus()
      }
    })
    this.pointer()
  }

  /** Bring the controls in line with the game after a mode or song change. */
  sync() {
    const g = this.game
    const learn = g.mode === 'learn'
    this.host.querySelectorAll<HTMLElement>('[data-modes]').forEach((e) => (e.hidden = !e.dataset.modes!.split(' ').includes(g.mode)))
    this.tempo.parentElement!.hidden = g.paced // a paced run's tempo is the one it was built with
    this.tempo.value = String(Math.round(g.rate * 100))
    this.tempoVal.textContent = `${Math.round(g.rate * 100)}%`
    this.wait.checked = g.wait
    const lad = this.host.querySelector<HTMLElement>('#ladder')!
    lad.hidden = !learn || !g.loop
    lad.setAttribute('aria-pressed', String(g.autoTempo))
    // in Learn the first row is full of loop buttons: the metronome joins the aids row
    const m = this.host.querySelector('.metro')!
    const row = this.host.querySelector(learn ? '.aids' : '.dock-row')!
    if (m.parentElement !== row) row.insertBefore(m, row.querySelector(learn ? '.dock-fill' : '.dock-end'))
    lad.textContent = g.autoTempo ? 'Ladder on' : 'Ladder off'
    this.syncMetro()
    ;(this.host.querySelector('#hidePlayed') as HTMLInputElement).checked = g.hidePlayed
    ;(this.host.querySelector('#holdAdvance') as HTMLInputElement).checked = g.holdAdvance
    for (const h of ['R', 'L'] as const) {
      const r = this.host.querySelector<HTMLInputElement>(`input[name=hand${h}][value=${g.hands[h]}]`)
      if (r) r.checked = true
    }
    ;(this.host.querySelector('#loopClear') as HTMLButtonElement).hidden = !g.loop
    this.showWorst()
    // in Perform the strip is a progress bar, not a control
    this.scrub.classList.toggle('still', !learn)
    this.scrub.setAttribute('role', learn ? 'slider' : 'progressbar')
    this.scrub.setAttribute('aria-label', learn ? 'Song position' : 'Song progress')
    this.scrub.tabIndex = learn ? 0 : -1
    this.drawLoop()
  }

  /** Off, on the beat, or with eighths between; remembered. */
  cycleMetro() {
    settings.metro = METROS[(METROS.indexOf(settings.metro) + 1) % METROS.length]
    save()
    this.syncMetro()
  }

  private syncMetro() {
    const on = settings.metro !== 'off'
    const b = this.host.querySelector('#metro')!
    b.setAttribute('aria-pressed', String(on))
    b.textContent = `Metronome: ${settings.metro === 'beat' ? 'beats' : settings.metro}`
    this.beatKey = ''
    this.host.querySelector<HTMLElement>('#beats')!.replaceChildren()
  }

  /** The beat dots: one per beat of the bar, the current one lit. Touches the page only when the beat changes. */
  private dots() {
    const b = settings.metro !== 'off' && this.game.phase !== 'ready' && this.game.phase !== 'done' ? beatAt(this.song.bars, this.game.t) : null
    const key = b ? `${b.n}:${b.k}` : ''
    if (key === this.beatKey) return
    this.beatKey = key
    const el = this.host.querySelector<HTMLElement>('#beats')!
    if (el.children.length !== (b?.n ?? 0)) el.replaceChildren(...Array.from({ length: b?.n ?? 0 }, () => document.createElement('i')))
    ;[...el.children].forEach((d, i) => d.classList.toggle('on', i === b?.k))
  }

  setPhase() {
    const p = this.game.phase
    const label = p === 'ready' ? 'Play' : p === 'paused' ? 'Resume' : p === 'done' ? 'Again' : 'Pause'
    this.go.innerHTML = `${icon(label === 'Pause' ? 'pause' : 'play')}${label}`
  }

  /** The worst-bars loop is offered only once there is a trouble spot to loop. */
  private showWorst() {
    ;(this.host.querySelector('#loopWorst') as HTMLButtonElement).hidden = !this.heat.some((h) => h > 0) && !this.game.heat.some((h) => h > 0)
  }

  setSong(song: Song, heat: number[]) {
    this.song = song
    this.heat = heat
    this.showWorst()
    this.scrub.setAttribute('aria-valuemax', String(song.bars.length))
    this.drawMap()
  }

  private barX(t: number) {
    return (t / this.song.end) * 100
  }

  private drawMap() {
    if (!this.song) return // a resize before any song is open
    const { bars, notes } = this.song
    const counts = bars.map((b) => notes.filter((n) => n.bar === b.i).length)
    const max = Math.max(1, ...counts)
    const heat = (i: number) => Math.min(1, (this.heat[i] ?? 0) / 3)
    this.svg.innerHTML = bars
      .map((b) => {
        const x = (b.t0 / this.song.end) * 1000
        const w = Math.max(((b.t1 - b.t0) / this.song.end) * 1000 - 1.5, 1)
        const h = 8 + (counts[b.i] / max) * 30
        const hot = heat(b.i)
        return (
          `<rect x="${x}" y="${44 - h}" width="${w}" height="${h}" style="fill:var(--ink-3)" opacity=".5"/>` +
          (hot > 0.05 ? `<rect x="${x}" y="0" width="${w}" height="44" style="fill:var(--bad)" opacity="${(hot * 0.55).toFixed(2)}"/>` : '')
        )
      })
      .join('')
  }

  liveHeat(session: number[]) {
    const now = performance.now()
    if (now - this.lastHeat < 600) return
    this.lastHeat = now
    const m = this.heat.map((v, i) => v + (session[i] ?? 0))
    for (let i = this.heat.length; i < session.length; i++) m[i] = session[i] ?? 0
    const prev = this.heat
    this.heat = m
    this.drawMap()
    this.heat = prev
    this.showWorst()
  }

  private drawLoop() {
    const l = this.game.loop
    this.loopEl.hidden = !l || !this.song
    if (l && this.song) {
      this.loopEl.style.left = `${this.barX(l.a)}%`
      this.loopEl.style.width = `${this.barX(l.b) - this.barX(l.a)}%`
    }
  }

  frame() {
    if (!this.song) return
    const t = Math.min(Math.max(this.game.t, 0), this.song.end)
    this.head.style.left = `${this.barX(t)}%`
    this.dots()
    this.scrub.setAttribute('aria-valuenow', String(Math.max(0, this.song.bars.findIndex((b) => b.t1 > t)) + 1))
  }

  private barAtX(clientX: number): number {
    const r = this.scrub.getBoundingClientRect()
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * this.song.end
    const i = this.song.bars.findIndex((b) => b.t1 > t)
    return i < 0 ? this.song.bars.length - 1 : i
  }

  private pointer() {
    let down: { i: number; x: number } | undefined
    this.scrub.onpointerdown = (e) => {
      if (this.game.mode !== 'learn') return
      this.scrub.setPointerCapture(e.pointerId)
      down = { i: this.barAtX(e.clientX), x: e.clientX }
    }
    this.scrub.onpointermove = (e) => {
      if (!this.song) return
      const i = this.barAtX(e.clientX)
      const r = this.scrub.getBoundingClientRect()
      this.tip.hidden = false
      this.tip.textContent = down && Math.abs(e.clientX - down.x) > 6 ? `Bars ${Math.min(down.i, i) + 1}–${Math.max(down.i, i) + 1}` : `Bar ${i + 1}`
      this.tip.style.left = `${Math.min(e.clientX - r.left + 10, r.width - 90)}px`
    }
    this.scrub.onpointerleave = () => (this.tip.hidden = true)
    this.scrub.onpointerup = (e) => {
      if (!down) return
      const i = this.barAtX(e.clientX)
      const bars = this.song.bars
      if (Math.abs(e.clientX - down.x) > 6) {
        const a = Math.min(down.i, i)
        const b = Math.max(down.i, i)
        this.game.setLoop({ a: bars[a].t0, b: bars[b].t1 })
      } else {
        this.game.jump(bars[i].t0 - this.song.spb * 2)
      }
      down = undefined
      this.sync()
    }
    this.scrub.onkeydown = (e) => {
      if (this.game.mode !== 'learn' || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
      const cur = Math.max(0, this.song.bars.findIndex((b) => b.t1 > this.game.t))
      const i = Math.min(this.song.bars.length - 1, Math.max(0, cur + (e.key === 'ArrowRight' ? 1 : -1)))
      this.game.jump(this.song.bars[i].t0 - this.song.spb * 2)
      e.preventDefault()
    }
  }

  /** The two-bar stretch with the most trouble. Returns false when there is none yet. */
  loopWorst(heat = this.heat, session = this.game.heat): boolean {
    const bars = this.song.bars
    const h = bars.map((_, i) => (heat[i] ?? 0) + (session[i] ?? 0))
    let best = -1
    let at = 0
    for (let i = 0; i < bars.length; i++) {
      const s = h[i] + (h[i + 1] ?? 0)
      if (s > best) {
        best = s
        at = i
      }
    }
    if (best <= 0) {
      this.onNote('No trouble spots yet. Play through once and the bars you miss show up in red.')
      return false
    }
    const end = Math.min(bars.length - 1, at + 1)
    this.game.setLoop({ a: bars[at].t0, b: bars[end].t1 })
    this.sync()
    return true
  }
}
