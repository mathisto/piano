// The settings drawer's markup: loaded the first time Settings opens, so its words stay out of the boot bundle.
import { loadState, outputLatency } from './audio'
import { INSTRUMENTS, instrument } from './instruments'
import type { Input } from './midi'
import { icon } from './icons'
import { noteName } from './spell'
import { settings } from './settings'
import { KEY_TOUCH_HINT, keyTouchSelect, rowMenu } from './ui'

export function drawer(el: HTMLElement, inputs: Input[]) {
  const seg = (name: string, label: string, opts: [string, string][], cur: string) =>
    `<div class="seg" role="radiogroup" aria-label="${label}">${opts.map(([v, l]) => `<label><input type="radio" name="${name}" value="${v}"${cur === v ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div>`
  // a setting: its name, its control, and one line saying what it does
  const row = (label: string, ctl: string, note = '') => `<div class="srow"><span>${label}</span>${ctl}${note && `<p class="note">${note}</p>`}</div>`
  const device = settings.sound
  el.innerHTML = `
  <div class="dhead"><h2 id="drawerTitle" tabindex="-1">Settings</h2><button class="btn icon ghost" id="sClose" aria-label="Close settings">${icon('x')}</button></div>
  <h3 class="sgh">Playing</h3>
  <div class="sgroup">
    ${row('Timing', seg('strict', 'Timing', [['easy', 'Easy'], ['standard', 'Standard'], ['strict', 'Strict']], settings.strict), 'How close to the beat a note must land to count. Easy allows about a third more time; Strict a quarter less. In Perform, Standard and Strict also check how long you hold each note; Easy does not.')}
    ${row('Touch feedback', seg('coach', 'Touch feedback', [['off', 'Off'], ['gentle', 'Gentle'], ['steady', 'Standard'], ['strict', 'Strict']], settings.coach), 'Watches how loud each note is: marks notes much louder or softer than the ones around them, and adds evenness, dynamics and pedal lines to results. Gentle flags only big differences; Strict small ones too.')}
    ${row('Delay', `<div class="inl"><input id="sOffset" type="number" min="-300" max="300" step="5" value="${settings.offset}" aria-label="Delay in milliseconds"><small>ms</small><button class="btn" id="sCal"${inputs.length ? '' : ' disabled'}>Calibrate</button></div>`, `Makes up for the time your keyboard and speakers take, so notes are judged when you really played them. Calibrate measures it${inputs.length ? '.' : ', and needs a keyboard: connect one first.'}${outputLatency() > 0.08 ? ` This device's sound arrives about ${Math.round(outputLatency() * 1000)} ms late, as Bluetooth audio does; wired headphones or the built-in speakers are on time.` : ''}`)}
  </div>
  <h3 class="sgh">Sound</h3>
  <div class="sgroup">
    ${row('Sound from', seg('sound', 'Sound from', [['keyboard', 'Keyboard'], ['device', 'This device']], device ? 'device' : 'keyboard'), device ? 'The app plays what you press, with the instrument below.' : "Your keyboard's speakers play what you press. The app still sounds what it plays itself: Listen, the parts it plays for you, ear questions, the count-in and the metronome.")}
    ${
      device
        ? `${row('Instrument', `<select id="sInst" aria-label="Instrument">${INSTRUMENTS.map((i) => `<option value="${i.id}"${settings.instrument === i.id ? ' selected' : ''}>${i.label}</option>`).join('')}</select>`, loadState(settings.instrument) === 'failed' ? `${instrument(settings.instrument).label} did not load, so a simple synth is playing. Check the connection, then choose it again.` : '')}
    ${row('Volume', `<input id="sVol" type="range" min="0.1" max="1" step="0.05" value="${settings.volume}" aria-label="Volume">`)}`
        : ''
    }
    ${row('Click', `<input id="sClick" type="range" min="0" max="1" step="0.05" value="${settings.click}" aria-label="Click volume: count-in and metronome">`, 'The volume of the count-in and the metronome.')}
  </div>
  <h3 class="sgh">Display</h3>
  <div class="sgroup">
    ${row('Appearance', seg('theme', 'Appearance', [['auto', 'Auto'], ['dark', 'Dark'], ['light', 'Light']], settings.theme), "Auto follows this device's light or dark setting.")}
    ${row('Effects', seg('fx', 'Effects', [['0', 'Off'], ['1', 'Calm']], String(settings.fx)), 'A soft glow on the falling notes and keys as you play.')}
  </div>
  <h3 class="sgh">Your data</h3>
  <div class="sgroup">
    ${row('Backup', `<div class="inl"><button class="btn sm" id="sExport">Export</button><button class="btn sm" id="sImport">Import</button><span class="pop">${rowMenu('Data', '<button class="btn ghost" id="sSummary">Summary for a teacher</button><button class="btn ghost" id="sClear">Delete all data</button>')}</span><input id="sFile" type="file" accept="application/json,.json" hidden></div>`, 'Everything stays on this device. Export saves your progress, settings and files in one file; Import restores it, here or on another device.')}
  </div>
  <details><summary>Advanced</summary>
    <div class="sgroup">
    <label class="switch"><input id="sNames" type="checkbox"${settings.names ? ' checked' : ''}><i></i>Note names</label>
    <label class="switch sub"><input id="sFade" type="checkbox"${settings.fade ? ' checked' : ''}${settings.names ? '' : ' disabled'}><i></i>Fade names I know</label>
    <label class="switch"><input id="sFingers" type="checkbox"${settings.fingers ? ' checked' : ''}><i></i><span><b>Finger numbers</b><small>The fingering drawn on scales. A pack can turn it off for one item.</small></span></label>
    <label class="switch"><input id="sKeys" type="checkbox"${settings.shortcuts ? ' checked' : ''}><i></i><span><b>Keyboard shortcuts</b><small>Single keys such as N, M and V, and the computer keys that play notes. Turn off if you use voice control.</small></span></label>
    <label class="switch"><input id="sFull" type="checkbox"${settings.full ? ' checked' : ''}><i></i>All 88 keys</label>
    <label class="switch"><input type="checkbox" data-osk-sw${(settings.osk ?? inputs.length === 0) ? ' checked' : ''}><i></i>On-screen keys</label>
    <label class="switch"><input id="sMarks" type="checkbox"${settings.marks ? ' checked' : ''}><i></i>Always show touch marks</label>
    <label class="switch"><input id="sWritten" type="checkbox"${settings.asWritten ? ' checked' : ''}><i></i>Aim for the file's dynamics</label>
    ${row('Fall speed', `<span class="slider"><small>Slow</small><input id="sFall" type="range" min="1" max="5" step="0.5" value="${6.5 - settings.fall}" aria-label="Fall speed"><small>Fast</small></span>`)}
    ${row('Hand split', `<select id="sSplit" aria-label="Hand split">${[55, 57, 60, 62, 64].map((p) => `<option value="${p}"${p === settings.split ? ' selected' : ''}>${noteName(p)}${p === 60 ? ' (middle C)' : ''}</option>`).join('')}</select>`, 'In a one-track file, notes from here up go to the right hand.')}
    ${row('Key touch', keyTouchSelect('sKeyTouch'), KEY_TOUCH_HINT)}
    </div>
  </details>
  <p class="fine foot"><button class="link" id="sSetup">Set up</button><button class="link" id="sHelp">Help</button><button class="link" id="sCredits">Credits</button></p>`
}