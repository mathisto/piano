# Sustain pedal (ROADMAP "Later": pedal timing from CC64)

Branch `feature/pedal`. New pure module `src/pedal.ts` (+ `pedal.test.ts`). Nothing here has met a real FP-10 or pedal.

## What already existed

- Web: `midi.ts` read CC64 (`d[2] >= 64` is down, so the half-pedal threshold was already 64) and `app/input.ts` passed it to `game.sustain`, which only set `game.pedal` for the judge (an early release is excused under the pedal).
- iPad: `PianoNative.swift` forwards every MIDI 1.0 channel-voice message (status 0x80 to 0xEF, so CC64 on any channel), and `native-midi.ts` hands them on to the same parser. No change needed.
- The sampler ignored the pedal: a key coming up always damped its note.
- Written pedal in a score is not read anywhere (MIDI CC64 and MusicXML `<pedal>` are dropped on import); `scripts/library/repeats.ts` only carries the pedal through repeats in the MIDI files it writes.

## Built

- **Sampler honours the pedal** (`audio.ts`): `sustain(down)` and `keyUp(p)`. With the pedal down a key coming up leaves its note ringing; pedal up lets the damper fall (the normal release) on every note whose key is already up. Striking a key again damps its own note first, as before. `game.release` now calls `keyUp` for the player's keys only; the app's own notes (Listen, ear trainers, listen back) still use `noteOff`.
- **Pedal events in song time** (`game.ts`): `Game.pedals` (`{t, down}`, song seconds at 100% tempo, with the delay setting applied as for keys; the held clock while paused). `sustain(down, ts)` ignores a repeat of the same state. Reset where `presses` is, with the state at the start kept.
- **Coach** (`pedal.ts`, pure: a `Song` and `PedalEv[]` in, one sentence out):
  - `changes(song)`: each bar is cut in halves (whole in odd metres), each half gets the best-fitting triad or dominant seventh or diminished chord by template match on pitch classes weighted by sounding time; a change is where the chord differs from the one before. (Since 2026-10-30, `enginefix.md`: a change is where the bass moves instead, the lowest note of a beat or more sounding at the window start; `LATE` is at least 150 ms; lifts are measured from the player's own chord onsets when the judge has them.)
  - `pedalReport(song, events)`: at each change, a lift between `EARLY` (0.5 beat) before and `LATE` (0.25 beat) after it is a change with the chord; down all through that window is a blur (the old chord still ringing when the new one lands); up all through it means the pedal was not in play there and the change is not counted. Null when the pedal never went down, or touched fewer than `MIN_CHANGES` (2) changes.
  - `pedalLine(report)`: "Pedal: you lifted it and pressed it again with the chord every time (3 of 3)." / "Pedal: you changed it with the chord 2 of 3 times; in bar 4 the old chord was still ringing under the new one." / "Pedal: it stayed down through all 3 chord changes, so the chords ran together. Lift it just as the next chord lands, then press it again." Bars are named, at most three then "and n more". No score.
- **Results**: `Result.pedal` goes in `coachLines` as one `<p>` in the existing coach-lines block (no new CSS). Only when the pedal was used; not in Read, with Touch coach Off, with Wait on, or in a loop. Works on any piece and exercise, not only ones that mark pedal, because the piece's own pedal marks are not read (see open).
- **Technique**: a pattern "Pedal changes" (key only; hands, dynamics and articulation are hidden like Rhythm's): four bars of triads, I IV V I, a chord a bar with its root below, to strike, pedal just after, and change as the next lands. Not in `SYLLABUS`: a player without a pedal would sit with an unfinished Path row, and the Path's "x of 31 solid" would shift.
- **Dev harness**: `__piano.pedal(down)` and `__piano.cc(n, v)` send raw MIDI through the real parser (`midi.ts` `feed`), so a test exercises the CC64 threshold too. The e2e `perform()` takes `pedal: [{t, down}]`.

## Tested

- `pedal.test.ts` (13): change finding (bar line, half bar, passing note), clean changes, early lift, held through all, late lift past and inside the grace, bars named and counted, pedal up at a change not counted, no pedal, pedal already down at the start, more than three bars, the Technique exercise in major and minor.
- e2e feature `20 Pedal` (`E2E_ONLY='^20 ' npm run e2e`, 38 s): the pedal exercise with CC64 sent through the parser, two changes made and one held through gives the 2 of 3 sentence naming bar 4; a run with no pedal has no Pedal line. Only this feature was run, not the suite.
- Headless Chrome (dev server, Sound on): with a note held and the pedal down, key-up leaves the note (0 dampers), the pedal going to 63 drops it (1), an unpedalled key is damped at once (1). Results screenshot looked at (1180x820): the sentence sits under the timing line in the coach block.
- `npx tsc --noEmit`, `npx vitest run` (50 files), `npm run smoke` green.

## Not verified

- A real FP-10 and pedal: whether the FP-10 sends CC64 on the USB and Bluetooth MIDI ports as assumed, with what resolution (a plain footswitch sends 0 and 127; a half-pedal-capable pedal sends the range), and the timing of the pedal events against the keys. Nothing was tried on the iPad: the CoreMIDI forwarding was read, not run.
- The thresholds (`EARLY`, `LATE`, `MIN_CHANGES`) and the chord detection are guesses, never fitted to a player. Half-bar windows miss a chord that changes on beat 2 or 3 and can read a melody-only bar as a change.
- The sampler under the pedal was heard by nobody: only the damper calls were counted. Sustained instruments (strings) still stop after 30 s.

## Open

- Written pedal is not imported (MIDI CC64, MusicXML `<pedal>` with start, change and stop): reading it would let the coach judge against where the score says to change, and say "the score marks pedal here" on a piece. Needs a `Song.pedal` field and the two parsers.
- Pedal pressed while the song waits or is paused is stamped at the held song time; Learn runs with Wait are not judged for pedal.
- Practising pedal needs a pedal: on a keyboard without one, the exercise only has the chords.
- A stuck pedal (the up message lost on a disconnect) stays down until the next CC64.

## Lines for DESIGN.md

Under Banner, Ready card, Results card (or the touch coach paragraph):

- "Pedal line: when the sustain pedal (CC64, down at 64 or more) was used in a Perform or Learn run without Wait or a loop, the results coach lines gain one sentence, 'Pedal: ...', in the same paragraph style as the timing and touch lines: how many chord changes it was changed with, and the bars where the old chord was still ringing under the new one. Plain words, no score, no colour, nothing when the pedal was not used."
- "Technique: the pattern chooser has 'Pedal changes' (Key and Tempo only): four bars of I IV V I triads, a chord a bar."

Under Sound / audio rules, if there is one: "The sampler honours the player's sustain pedal: with the pedal down a released key keeps ringing, and the dampers fall when it comes up. The app's own notes (Listen, ear trainers, Listen back) ignore it."

Under Known gaps: "Pedal (CC64) was built against synthetic events only; no FP-10 or pedal has been tried, nor the iPad."
