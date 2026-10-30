# Ear and rhythm trainers (feature/ear)

Four trainers in the Theory tab, answered on the MIDI keyboard, in the existing 15-card session (spaced-review stats via `record()`, results, `logHistory` kind `theory`). No claims are made in the UI about transfer to playing.

- **Ear: play it back** (6 levels): 2 to 5 notes in a key (steps in C, thirds, leaps, other major keys, minor, a note off the scale); play the pitch classes back in order, any octave. 90 fixed phrases per level (seeded, so spaced review finds them again).
- **Ear: intervals** (5 levels: 2nds/3rds, 4th/5th, 6ths/7ths, octave, all): hear two notes (up, down, together); the first is named, play the second (the higher one when together). The octave level needs the exact octave.
- **Ear: scale degrees** (3 levels): I-IV-V-I sets the key, then one note; play it back. A miss names the degree.
- **Rhythm echo** (4 levels: quarters/halves, eighths, dotted, syncopation): one 4/4 bar clapped on a click, then a bar of click for the taps on any key. Each tap's offset from the grid is taken after subtracting the bar's mean offset. Bias (late or early, ms) and spread (sd, ms) are reported apart, per card and over the session. Pass = every tap within `RHYTHM.window` of the grid and bias within `RHYTHM.maxBias`.

A miss shows the answer and plays the prompt again; Replay counts (shown on the button, summed on the results). Keys are ignored while a prompt plays. Response time starts when the prompt ends; rhythm results show bias and spread instead of median time, and log no `ms`.

## Sound
Prompts always use the app's own piano (`noteOn(..., force)`), clap and click (`audio.clap`, `audio.click(..., force)`), whatever `settings.sound` or `settings.click` say. The player's own presses sound only when `settings.sound` is on, as in the other trainers. Events run on a 10 ms timer; clicks and claps carry their exact time to the audio clock. Leaving the tab stops the prompt.

## Tunables (`src/ear.ts` `RHYTHM`)
`bpm` 80, `window` 110 ms, `maxBias` 250 ms, `merge` 60 ms (a chord's keys are one tap), `grace` 400 ms (wait for a stray extra tap).

## Files
New: `src/ear.ts`, `src/ear.test.ts`, `src/ear-play.ts`, `src/ear.css`. Small edits: `theory.ts` (trainer ids, `Step.abs`, card `play` and `name`, deck dispatch), `main.ts` (Theory section: prompt, tap routing, `finishTheory` split out of `judgeTheory`), `ui.ts` (4 spots in `theoryView`), `audio.ts` (`clap`, `click` force).

## Not verified
Real sound on the iPad output; a real keyboard (tested with synthetic key presses in headless Chrome); taps have the calibration offset taken off (since 2026-10-30, `enginefix.md`), so a calibrated setup's Bluetooth or speaker latency does not show up as bias; an uncalibrated one's still does. Dev-only `window.__ear` exposes the live card and tap clock for tests.
