// Latency calibration: play middle C on the beat, and the timing windows shift to match. The game takes the presses as they come
// while it runs (Game.calib), so the saved offset is only changed by Apply.
import { CALIBRATION, type Result } from '../game'
import { save, settings } from '../settings'
import { fromSpec } from '../song'
import { $ } from '../ui'
import { game, hooks, resOpen, setCalibrating } from './state'
import { leave, openSong } from './play'

export async function startCalibration() {
  hooks.closeDrawer()
  setCalibrating(true)
  const song = fromSpec({ id: CALIBRATION, title: 'Calibration', bpm: 80, fifths: 0, rh: Array(16).fill('C4:1').join(' '), lh: 'R:16' })
  await openSong(song, 'perform')
  $('#modeSeg').hidden = true
}

export function calibrated(r: Result) {
  const res = $('#res')
  const offs = r.offs.slice().sort((a, b) => a - b)
  const ok = offs.length >= 8
  const med = ok ? Math.round(offs[offs.length >> 1] / 5) * 5 : 0
  resOpen(true)
  res.innerHTML = `<div class="results"><div class="card" style="grid-template-columns:1fr" role="dialog" aria-label="Calibration result">
    <h2>${ok ? 'Calibration done' : 'Not enough notes'}</h2>
    <p style="margin:0;color:var(--ink-2)">${
      ok
        ? `Your setup runs about <b style="color:var(--ink)">${Math.abs(med)} ms ${med >= 0 ? 'late' : 'early'}</b> (from ${offs.length} notes). Applying ${med} ms shifts the timing windows to match.`
        : `Only ${offs.length} of 16 notes landed close enough. Try again and play on each beat.`
    }</p>
    <div class="row">${ok ? '<button class="btn primary" id="apply">Apply</button>' : ''}<button class="btn" id="retry">Try again</button><button class="btn ghost" id="cancel">Cancel</button></div>
  </div></div>`
  const end = () => {
    setCalibrating(false)
    resOpen(false)
    leave()
  }
  const apply = res.querySelector<HTMLButtonElement>('#apply')
  if (apply)
    apply.onclick = () => {
      settings.offset = med
      save()
      end()
    }
  $('#retry', res).onclick = () => {
    resOpen(false)
    game.restart()
  }
  $('#cancel', res).onclick = end
}
