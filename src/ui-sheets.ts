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
    <div class="credlist">${SOUNDS.map((t) => `<pre>${links(esc(t))}</pre>`).join('')}</div><h3>Icons</h3>
    <div class="credlist"><pre>${links(esc('Lucide, by Lucide Contributors (lucide.dev)\nLicence: ISC (https://github.com/lucide-icons/lucide/blob/main/LICENSE)'))}</pre></div>
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

/** The Help sheet's text: ui.ts draws its title, main.ts fills this in when it first opens. */
export const HELP = `<h3>What each tab is for</h3>
    <dl>
      <dt>Today</dt><dd>A plan for the day, 5 to 45 minutes, and your week.</dd>
      <dt>Songs</dt><dd>Starter pieces, your own files and a free library. Open one to play it.</dd>
      <dt>Read</dt><dd>Name the notes on the staff and find them on your keys. Sight Run is a longer run of new notes.</dd>
      <dt>Scales</dt><dd>Scales and arpeggios with fingering, a stage at a time.</dd>
      <dt>Theory</dt><dd>Chords, keys, intervals, cadences, ear and rhythm, answered on your keyboard.</dd>
      <dt>Technique</dt><dd>Short exercises for steady timing and an even touch.</dd>
      <dt>Progress</dt><dd>Your week, accuracy over time and the notes you read well.</dd>
    </dl>
    <h3>Lead sheet</h3>
    <p class="fine">On a piece with a left hand, Notes shown can be Lead sheet: the melody (the voice line of a melody-and-piano song, else the top note of the right hand) with a chord symbol above it where the chord changes. The chords are read from the harmony of the notes, one guess for each bar or half bar, so they are an aid and not the composer's marks, and a passing note can fool them. "App plays the chords" sounds a block chord, bass below, on each one, and is remembered. A run at any Notes shown level but Full is not the whole piece, so it does not count toward Ready.</p>
    <h3>How the touch coach works</h3>
    <p class="fine">Your keyboard reports how hard each key was struck and when. The coach compares each note with its neighbours and marks one that is clearly louder or softer: a small triangle over for louder, under for softer. It also measures timing and note length.</p>
    <p class="fine">It cannot see your fingers, wrist or posture, so even numbers do not prove good technique. Treat the marks as measurements, and ask a teacher about what they cannot show. The marks fade as your touch evens out, and some runs have none on purpose. A keyboard set to a fixed touch cannot be measured.</p>
    <h3>How a scale counts as solid</h3>
    <p class="fine">Three runs in a row at a tempo, each with every note right, in time and not uneven in touch. A run that misses starts the count again. A stage is solid when all its scales are.</p>
    <h3>How review spacing works</h3>
    <p class="fine">A card or piece you get right comes back later: after about 1 day, then 2, 4, 8 and 16. One you miss comes back sooner. Anything due shows a Due tag. Spreading reviews out is one of the better-supported ways to remember; the exact days are our choice, not a proven best.</p>
    <h3>Keyboard shortcuts</h3>
    <div class="sc"><kbd>Space</kbd><span>Play, pause</span><kbd>V</kbd><span>Staff, both, falling</span><kbd>- +</kbd><span>Staff size</span><kbd>B</kbd><span>Metronome</span><kbd>N</kbd><span>Note names</span><kbd>M</kbd><span>Hide controls</span><kbd>[ ]</kbd><span>Tempo down, up</span><kbd>Esc</kbd><span>Back</span><kbd>?</kbd><span>This help</span></div>
    <p class="fine">Hearing every note twice? Turn Local Control off on the keyboard. No keyboard: <kbd>A</kbd> to <kbd>;</kbd> play the white keys, <kbd>W E T Y U O P</kbd> the black, <kbd>Z X</kbd> shift the octave.</p>`
