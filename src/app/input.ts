import * as audio from '../audio'
import { type MidiMsg, onMidi, onPedal, typingKeyboard } from '../midi'
import { degreeOfPitch } from '../scales'
import { save, settings } from '../settings'
import { $ } from '../ui'
import { current, dock, drill, game, played, setPlayed } from './state'
import { chipFlash, updateBanner } from './banner'
import { setView, setZoom, zen, ZOOM } from './stage'
import { leave } from './play'
import { theoryUi } from './lazy'
import { answerQuiz, quiz, quizOpen } from './scales-ui'
import { calNote } from './technique-ui'
import { closeDrawer } from './drawer'
import { mountOsk } from './osk-ui'

export const fromKeyboard = (m: MidiMsg) => {
  if (m.on) {
    chipFlash(m.p)
    if (!played) {
      setPlayed(true)
      updateBanner()
    }
    if (!m.virtual && calNote(m.v)) return
    const sound = () => (settings.sound || m.virtual) && audio.noteOn(m.p, m.v, true) // the screen and computer keys have no speaker of their own
    if (theoryUi?.theoryOpen()) {
      sound()
      theoryUi.theoryNote(m.p, m.ts)
      return // the trainer owns the keyboard while a card is open
    }
    if (quizOpen()) {
      sound()
      const c = quiz!.cards[quiz!.i]
      const d = c ? degreeOfPitch(c.tonic, c.form, m.p) : 0
      if (d) answerQuiz(d)
      return // the quiz owns the keyboard while it is open
    }
    if (drill && game.phase === 'ready' && $('#res').hidden && !game.start(m.p)) return void sound() // on a reading drill the first key is the Play button
    game.press(m.p, m.v, m.ts, m.virtual)
  } else game.release(m.p, m.ts, m.virtual)
}
onMidi(fromKeyboard)
mountOsk(fromKeyboard)
onPedal((d, ts) => game.sustain(d, ts))
typingKeyboard()

addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement
  const typing = /INPUT|SELECT|TEXTAREA/.test(t.tagName) && (t as HTMLInputElement).type !== 'range' && (t as HTMLInputElement).type !== 'radio' && (t as HTMLInputElement).type !== 'checkbox'
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return
  if ((e.target as HTMLElement).closest('dialog')) return
  if (e.key === '?') ($('#help') as HTMLDialogElement).showModal()
  else if (e.key === 'm' && current) zen()
  else if (e.key === 'n') {
    settings.names = !settings.names
    save()
  } else if (e.key === 'Escape') {
    if (!closeDrawer() && current) leave()
  } else if (e.key === ' ' && current && !/BUTTON/.test(t.tagName) && $('#res').hidden) {
    e.preventDefault()
    game.toggle()
  } else if ((e.key === '-' || e.key === '=' || e.key === '+') && current) {
    setZoom(settings.zoom * (e.key === '-' ? 1 / ZOOM.step : ZOOM.step))
  } else if (e.key === 'b' && current && game.mode !== 'read') {
    dock.cycleMetro()
  } else if (e.key === 'v' && current && game.mode !== 'read') {
    const order = ['sheet', 'both', 'falling'] as const
    setView(order[(order.indexOf(settings.view) + 1) % 3])
  } else if ((e.key === '[' || e.key === ']') && current && game.mode === 'learn') {
    game.setRate(game.rate + (e.key === ']' ? 0.05 : -0.05))
    dock.sync()
  }
})
