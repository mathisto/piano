import { FREE, KEY_TOUCH_HINT, keyTouchSelect } from './ui'
import { icon } from './icons'
import { settings } from './settings'
import { COMFORT, density } from './song'
import type { Report, Selection, TrackInfo } from './midi-tracks'
import { DEFAULT_EDGES } from './touch'
import { esc } from './util'

const SOUNDS = [
  'Grand piano: Salamander Grand Piano by Alexander Holm\nLicence: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)',
  'Electric piano: Wurlitzer EP200 by Greg Sullivan (sullivang.net), mapped by kinwie\nLicence: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)',
  'Harp, church organ, strings: Versilian Community Sample Library (harp, organ sampled by Simon Dalzell of Ivy Audio) and VSCO 2 Community Edition, by Versilian Studios\nLicence: CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)',
  'Music box: MuseScore_General, from FluidR3 by Frank Wen, adapted by S. Christian Collins\nLicence: MIT (https://ftp.osuosl.org/pub/musescore/soundfont/MuseScore_General/MuseScore_General_License.md)',
]
const links = (s: string) => s.replace(/https?:\/\/[^\s)]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`) // on escaped text; the iPad app hands _blank to the system browser
/** Credits: the sounds, then the scores you have played or saved (blocks), and where the full list of score licences lives. */
export function creditsDialog(blocks: string[], licences: { app: string; corpus: string }, after: (i: number) => string = () => '') {
  return `<header><h2>Credits</h2><button class="btn icon ghost" data-close aria-label="Close">${icon('x')}</button></header>
    <div class="body"><p class="fine free">${FREE}</p><h3>Sounds</h3>
    <div class="credlist">${SOUNDS.map((t) => `<pre>${links(esc(t))}</pre>`).join('')}</div>
    <h3>Scores</h3><p class="fine">Scores in the open library are public domain or openly licensed. Each piece keeps its own licence. Every score and its licence: <a href="${licences.app}" target="_blank" rel="noopener">pieces in the app</a>, <a href="${licences.corpus}" target="_blank" rel="noopener">the whole library</a>.</p>
    <div class="credlist">${blocks.length ? blocks.map((b, i) => `<pre>${links(esc(b))}</pre>${after(i)}`).join('') : '<p class="fine">Pieces you play or save for offline appear here.</p>'}</div></div>
    <footer><button class="btn" data-close>Close</button></footer>`
}


/** First run, and Settings > Set up: four checks, each one skippable; the sheet is a list, not a wizard. */
export function setupDialog(midi: string, connected: boolean, delay: number, pair = '') {
  const e = settings.edges ?? DEFAULT_EDGES
  return `<header><div><h2>Set up</h2><p>Four checks. Skip any of them.</p></div><button class="btn icon ghost" data-close aria-label="Close">${icon('x')}</button></header>
    <div class="body"><div class="plan">
      <div class="prow"><div class="pwho"><b>Keyboard</b><span id="suMidi">${esc(midi)}</span></div><div class="pact"><button class="btn" id="suConnect"${connected ? ' hidden' : ''}>Connect</button>${pair}</div></div>
      <div class="prow"><div class="pwho"><b>Touch range</b><span>${settings.edges ? 'Yours' : 'Default'}: soft to ${e.soft}, hard from ${e.hard}</span></div><div class="pact"><button class="btn ghost" id="suTouch">Set touch range</button></div></div>
      <div class="prow"><div class="pwho"><b>Delay</b><span>${delay} ms</span></div><div class="pact"><button class="btn ghost" id="suDelay">Calibrate</button></div></div>
      <div class="prow"><div class="pwho"><b>Key touch</b><span>${KEY_TOUCH_HINT}</span></div><div class="pact">${keyTouchSelect('suKeyTouch')}</div></div>
    </div></div>
    <footer><span class="fine free">${FREE}</span><span class="grow"></span><button class="btn primary" data-close autofocus>Done</button></footer>`
}

// ---------- choosing the tracks of a MIDI file ----------

export function tracksDialog(title: string, r: Report | undefined, pick: Selection, noteName: (p: number) => string, facts: [string, string][], order: number[] = []) {
  const hand = (t: TrackInfo): string => pick.hands[t.index] ?? 'auto'
  const used = r ? r.tracks.filter((t) => pick.tracks.includes(t.index)) : []
  const busy = r ? density(used, r.bars) : 0
  const multi = !!r && r.tracks.length > 1
  return `
    <header><div><h2>Options</h2><p>${esc(title)}</p></div><button class="btn icon ghost" data-close aria-label="Close">${icon('x')}</button></header>
    <div class="body">
    <dl class="facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    ${
      multi
        ? `<h3>Tracks</h3><p class="fine" id="tkSum" role="status">${used.length} of ${r!.tracks.length} in use${busy > COMFORT ? '. Crowded: try fewer.' : ''}</p>
    <div class="tklist">${[...r!.tracks]
      .sort((a, b) => (order.indexOf(a.index) + 1 || 99) - (order.indexOf(b.index) + 1 || 99))
      .map((t) => {
        const on = pick.tracks.includes(t.index)
        return `<div class="tkrow${t.percussion ? ' perc' : ''}">
        <label class="switch"><input type="checkbox" data-tk="${t.index}"${on ? ' checked' : ''}><i></i><span><b>${esc(t.name)}</b><small>${esc(t.program)}${t.percussion ? ', drums' : ''} · ${t.notes} notes · ${noteName(t.lo)} to ${noteName(t.hi)}</small></span></label>
        ${on ? `<select data-tkh="${t.index}" aria-label="Hand for ${esc(t.name)}"><option value="auto"${hand(t) === 'auto' ? ' selected' : ''}>By pitch</option><option value="R"${hand(t) === 'R' ? ' selected' : ''}>Right hand</option><option value="L"${hand(t) === 'L' ? ' selected' : ''}>Left hand</option></select>` : ''}</div>`
      })
      .join('')}</div>`
        : ''
    }
    </div>
    <footer><button class="btn ghost" id="tkRemove" title="Remove this file from this browser">Remove</button><span class="grow"></span><button class="btn ghost" id="tkShare" title="Share the original file">Share</button>${multi ? '<button class="btn ghost" id="tkAuto">Pick for me</button>' : ''}<button class="btn" id="tkCancel">${multi ? 'Cancel' : 'Close'}</button>${multi ? '<button class="btn primary" id="tkApply">Use these</button>' : ''}</footer>`
}
