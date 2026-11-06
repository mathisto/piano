if (import.meta.env.MODE !== 'test') void import('./sync') // this sheet bundle is preloaded at idle; sync then starts without joining boot JS
import { KEY_TOUCH_HINT, keyTouchSelect, rowMenu } from './ui'
import { icon } from './icons'
import { native } from './native-midi'
import { settings } from './settings'
import { COMFORT, density } from './song'
import type { Report, Selection, TrackInfo } from './midi-tracks'
import { DEFAULT_EDGES } from './touch'
import { esc } from './util'
import { noKeyboardArt } from './empty'
import { PRIVACY_URL, SUPPORT_URL } from './support'

const SOUNDS = [
  'Grand piano: Salamander Grand Piano by Alexander Holm\nLicence: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)',
  'Electric piano: Wurlitzer EP200 by Greg Sullivan (sullivang.net), mapped by kinwie\nLicence: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)',
  'Harp, church organ, strings: Versilian Community Sample Library (harp, organ sampled by Simon Dalzell of Ivy Audio) and VSCO 2 Community Edition, by Versilian Studios\nLicence: CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)',
  'Music box: MuseScore_General, from FluidR3 by Frank Wen, adapted by S. Christian Collins\nLicence: MIT (https://ftp.osuosl.org/pub/musescore/soundfont/MuseScore_General/MuseScore_General_License.md)',
]
// on escaped text; the iPad app hands _blank to the system browser. "Licence: CC BY 3.0 (url)" links the licence's name, a bare URL shows its site
const a = (u: string, t: string) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`
const links = (s: string) => s.replace(/Licence: ([^\n]+?) \((https?:\/\/[^\s)]+)\)/g, (_, n, u) => `Licence: ${a(u, n)}`).replace(/(?<!href=")https?:\/\/[^\s)<]+/g, (u) => a(u, new URL(u.replace(/&amp;/g, '&')).hostname))
export const ownershipCopy = (inApp = native) =>
  inApp ? 'One purchase. Everything included. No subscription, ads or account.' : 'Free in your browser. No subscription, ads or account.'
/** Credits: the sounds, then the scores you have played or saved (blocks), and where the full list of score licences lives. */
export function creditsDialog(blocks: string[], licences: { app: string; corpus: string }, after: (i: number) => string = () => '') {
  return `<header><h2>Credits</h2><button class="btn icon ghost" data-close aria-label="Close">${icon('x')}</button></header>
    <div class="body"><p class="fine free">${ownershipCopy()} ${a(SUPPORT_URL, 'Support')} · ${a(PRIVACY_URL, 'Privacy')}</p><h3>Sounds</h3>
    <div class="credlist">${SOUNDS.map((t) => `<pre>${links(esc(t))}</pre>`).join('')}</div><h3>Icons</h3>
    <div class="credlist"><pre>${links(esc('Lucide, by Lucide Contributors (lucide.dev)\nLicence: ISC (https://github.com/lucide-icons/lucide/blob/main/LICENSE)'))}</pre></div>
    <h3>Scores</h3><p class="fine">Public domain or openly licensed, each under its own licence. Every score and its licence: ${a(licences.app, 'pieces in the app')}, ${a(licences.corpus, 'the whole library')}.</p>
    <div class="credlist">${blocks.length ? blocks.map((b, i) => `<pre>${links(esc(b))}</pre>${after(i)}`).join('') : '<p class="fine">Pieces you play or save for offline appear here.</p>'}</div></div>`
}


/** First run, and Settings > Set up: five useful starts, each one skippable; the sheet is a list, not a wizard. */
export function setupDialog(midi: string, connected: boolean, delay: number, pair = '') {
  const e = settings.edges ?? DEFAULT_EDGES
  return `<header><div><h2>Set up</h2><p>Five steps. Skip any of them.</p></div><button class="btn icon ghost" data-close aria-label="Close">${icon('x')}</button></header>
    <div class="body"><div class="plan">
      <div class="prow">${noKeyboardArt()}<div class="pwho"><b>Keyboard</b><span id="suMidi">${esc(midi)}</span></div><div class="pact"><button class="btn" id="suConnect"${connected ? ' hidden' : ''}>Connect</button>${pair}</div></div>
      <div class="prow"><div class="pwho"><b>Your music</b><span>Bring your own MIDI or MusicXML. Files stay on this device.</span></div><div class="pact"><button class="btn" id="suAddFiles">${icon('plus')}Add files</button><input id="suFiles" type="file" accept=".mid,.midi,.musicxml,.xml,.mxl,.pthpack,audio/midi" multiple hidden></div></div>
      <div class="prow"><div class="pwho"><b>Touch range</b><span>${settings.edges ? 'Yours' : 'Default'}: soft to ${e.soft}, hard from ${e.hard}</span><span class="needs" data-needs${connected ? ' hidden' : ''}>Needs a keyboard: connect one first.</span></div><div class="pact"><button class="btn ghost" id="suTouch" data-needs${connected ? '' : ' disabled'}>Set touch range</button></div></div>
      <div class="prow"><div class="pwho"><b>Delay</b><span>${delay} ms</span><span class="needs" data-needs${connected ? ' hidden' : ''}>Needs a keyboard: connect one first.</span></div><div class="pact"><button class="btn ghost" id="suDelay" data-needs${connected ? '' : ' disabled'}>Calibrate</button></div></div>
      <div class="prow"><div class="pwho"><b>Key touch</b><span>${KEY_TOUCH_HINT}</span></div><div class="pact">${keyTouchSelect('suKeyTouch')}</div></div>
    </div></div>
    <footer><span class="fine free">${ownershipCopy()}</span><span class="grow"></span><button class="btn primary" data-close autofocus>Done</button></footer>`
}

// ---------- choosing the tracks of a MIDI file ----------

export function tracksDialog(title: string, r: Report | undefined, pick: Selection, noteName: (p: number) => string, facts: [string, string][], order: number[] = []) {
  const hand = (t: TrackInfo): string => pick.hands[t.index] ?? 'auto'
  const used = r ? r.tracks.filter((t) => pick.tracks.includes(t.index)) : []
  const busy = r ? density(used, r.bars) : 0
  const multi = !!r && r.tracks.length > 1
  return `
    <header><div><h2>Options</h2><p>${esc(title)}</p></div><div class="pop">${rowMenu(title, '<button class="btn ghost" id="tkShare">Share file</button><button class="btn ghost" id="tkRemove">Remove file</button>')}</div><button class="btn icon ghost" data-close aria-label="Close">${icon('x')}</button></header>
    <div class="body">
    <dl class="facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    ${
      multi
        ? `<h3>Tracks</h3><div class="tksum"><p class="fine" id="tkSum" role="status">${used.length} of ${r!.tracks.length} in use${busy > COMFORT ? '. Crowded: try fewer.' : ''}</p><button class="btn ghost sm" id="tkAuto">Pick for me</button></div>
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
    ${multi ? '<footer><button class="btn" id="tkCancel">Cancel</button><button class="btn primary" id="tkApply">Use these</button></footer>' : ''}`
}

/** The Help sheet's text: ui.ts draws its title, main.ts fills this in when it first opens. */
export const HELP = `<h3>What each tab is for</h3>
    <dl>
      <dt>Today</dt><dd>Today's plan, 5 to 45 minutes, and your week.</dd>
      <dt>Songs</dt><dd>Starter pieces, your own files and the open library.</dd>
      <dt>Read</dt><dd>Name notes on the staff and find them on the keys. Sight run is a longer run of new notes.</dd>
      <dt>Scales</dt><dd>Scales and arpeggios with fingering, a stage at a time.</dd>
      <dt>Theory</dt><dd>Chords, keys, intervals, cadences, ear and rhythm, answered on the keys.</dd>
      <dt>Technique</dt><dd>Short exercises for steady timing and an even touch.</dd>
      <dt>Progress</dt><dd>Your week, accuracy over time and the notes you read well.</dd>
    </dl>
    <h3>Lead sheet</h3>
    <p class="fine">On a piece with a left hand, Notes shown can be Lead sheet: the melody with a chord symbol where the chord changes. The melody is the vocal line when there is one, otherwise the top note of the right hand. The chords are guessed from the notes a bar or half bar at a time, so a passing note can fool them; they are an aid, not the composer's. With App plays the chords on, the app plays each chord as a block, with its bass, at the tempo. A run with Notes shown set to anything but Full does not count toward Ready.</p>
    <h3>How touch feedback works</h3>
    <p class="fine">Your keyboard reports when each key is struck and how hard. Touch feedback marks a note clearly louder or softer than its neighbours with a small triangle: over the head for louder, under it for softer. Results also report timing and note length.</p>
    <p class="fine">It cannot see your fingers, wrist or posture, so even numbers do not prove good technique: ask a teacher about what the numbers cannot show. The marks fade as your touch evens out, and some runs have none on purpose. A keyboard set to fixed touch cannot be measured.</p>
    <h3>How a scale counts as solid</h3>
    <p class="fine">Three runs in a row at tempo, each with every note right, in time and even. A miss starts the count again. A stage is solid when all its scales are.</p>
    <h3>When a piece is Ready</h3>
    <p class="fine">After a clean run at 90% of the tempo or more, without Wait for me, on two different days. Runs with fewer notes shown, with only your part, or looped do not count.</p>
    <h3>How review spacing works</h3>
    <p class="fine">A card or piece you get right comes back after about 1 day, then 2, 4, 8 and 16; one you miss comes back sooner. Anything due shows a Due tag. Spaced review is one of the better-supported ways to remember; the exact days are our choice, not a proven best.</p>
    <h3>Keyboard shortcuts</h3>
    <div class="sc"><kbd>Space</kbd><span>Play, pause</span><kbd>V</kbd><span>Switch view: staff, both, falling notes</span><kbd>- +</kbd><span>Staff size</span><kbd>B</kbd><span>Metronome</span><kbd>N</kbd><span>Note names</span><kbd>M</kbd><span>Hide or show controls</span><kbd>[ ]</kbd><span>Tempo down, up</span><kbd>Esc</kbd><span>Back</span><kbd>?</kbd><span>This help</span></div>
    <p class="fine">Settings, Advanced, Keyboard shortcuts turns the single keys off.</p>
    <h3>Computer keys</h3>
    <p class="fine">With no piano connected, <kbd>A</kbd> to <kbd>;</kbd> play the white keys, <kbd>W E T Y U O P</kbd> the black keys, and <kbd>Z</kbd> and <kbd>X</kbd> shift the octave.</p>
    <h3>Hearing every note twice?</h3>
    <p class="fine">The keyboard and the app are both sounding. In Settings, set Sound from to Keyboard. Or, to hear only the app, turn the keyboard's Local Control off.</p>`
