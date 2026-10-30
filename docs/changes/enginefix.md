# Engine fixes (2026-10-30)

Branch `feature/enginefix`. The defects an engine audit found in the clock, the judge, MIDI input and the coach, each fixed where every caller goes through it, each with a regression test (the audit's proof tests, rewritten as tests in `src/`). Nothing here has met a real FP-10, iPad or pedal: all checks are unit tests and headless Chrome.

## Fixed

- **A saved keyboard that is not plugged in** (`midi.ts` `bind`): every input was silenced while the chip named the first one. Now every input is listened to unless the saved one is connected. `midi.test.ts`.
- **One MIDI access** (`midi.ts` `connect`): a second Connect reuses it and replaces its state handler instead of making a new access each time.
- **Pedal hysteresis** (`midi.ts`): down at CC64 >= 64, up only below 40, so a foot resting near half way does not chatter. Reset on a device state change, so a keyboard plugged back in sends its pedal afresh.
- **Count-in on the bar's own beat grid** (`game.ts` `lead`, `metronome.ts` `grid`): it used the first bar's beat from t = 0, so after a pickup a loop's count-in fell between the beats, and a tempo change was counted at the old tempo. Now the clicks sit on the grid of the bar they lead into: two beats into a loop; into the song a bar (two bars of a two-beat metre) counted back from the first full bar, so a one-beat pickup comes in on beat four and a half-beat pickup's last click is half a beat before it; a bar more when a pickup would leave under half a bar to count. First click accented. The HUD numeral counts the clicks. The metronome counts a pickup bar back from its end too (half a beat of pickup is an off-beat with no click of its own). `game.test.ts`, `metronome.test.ts`.
- **Calibration** (`app/calibration.ts`, `Game.calib`): presses 150 ms late fell outside the window and left no sample; the click followed the Metronome and Count-in settings (silent by default for the metronome); and the saved offset was zeroed for the run, so a `save()` from anywhere mid-calibration persisted 0. Now the calibration song (`CALIBRATION` id) gets a +/-375 ms window (3x), the click forced on for the count-in and every beat, and an offset of 0 inside the game only. `settings.offset` changes only on Apply; Cancel and leaving need no restore (`calibrating` is a boolean now).
- **The app's own notes on the audio clock** (`game.ts` `frame`, `audio.ts` `noteOn`): Listen hands, voice parts and the chords ended by `setTimeout` keyed by pitch and never cleared, so a timer from before a loop wrap cut the next pass's note. Now they go to the audio clock 250 ms ahead (the metronome's pattern, `horizon()`), each with its own length (`noteOn(..., { after, dur })`), and `audio.hush()` stops them, with every click and clap not yet sounded, on a pause, seek, restart, loop wrap and leave. In Wait, the app's notes at the note it is about to stall on now sound when you play it, like the metronome's beat there. The lit keys of the app's notes (`autoUntil`) are now a from..until pair so they light when the note sounds, not when it is scheduled. `game.test.ts`, `audio.test.ts`.
- **The key that starts a reading drill** (`app/input.ts`, `Game.start`): it was then judged, so in a paced run (count-in) it was always a wrong note. It is judged only when it is the first card's note and not in a count-in.
- **Label textures** (`highway.ts`): every layout dropped the key-name texture cache without destroying it. The names do not depend on the layout, so the cache now stays. `highway.test.ts`.
- **Claps** (`audio.ts`): timed from `currentTime` while clicks use the output-timestamp clock; both use `audioTime()` now.
- **Click look-ahead** 100 to 250 ms; clicks and claps are kept in a set until they end, so a pause or seek can stop them.
- **Takes** (`app/take-ui.ts`, `take.ts`): key-ups were on the uncorrected clock while key-downs were offset-corrected, so every held time was off by the delay setting. Both now come from `Game.at(ts)`. The pedal is recorded (`Take.ped`, alternating down and up; even while paused, so the alternation holds) and Listen back plays it, with the listen-back's key-ups through `keyUp`, so a key let go under the pedal rings on. Old takes have no `ped`.
- **Keyboard disconnect** (`app/banner.ts`, `Game.letGo`): held keys and the pedal never sent their up. Now every key the game holds comes up (sampler voices damped, `sustain(false)`), with no hold grade, and the judge forgets them.
- **Ear and pulse taps** (`ear-play.ts`, `pulse-play.ts`): taps ignored the calibration offset, so a calibrated Bluetooth player was told they were late. The offset is taken off, as for presses in a piece. `ear-play.test.ts`; `pulse.md` and `ear.md` updated.

## Design changes

- **Late hits** (`judge.ts`): the right key up to a beat after the Good window closes (at most 500 ms) is a `late` hit, the worst grade (weight 0.25), not a miss plus a wrong note; a press in the next note's window still goes to that note. Misses wait for the grace. A loop pass and a run close open notes at their end (`tick(Infinity)`). Late counts are in `Result.counts.late`, shown on the results card when there are any; a late card in a paced run is struck but not on the beat.
- **Misses on the corrected clock** (`game.ts`, beyond the brief): `tick` ran on the raw song clock while presses are offset-corrected, so with a positive delay a note was missed before its corrected window closed. It now runs on the clock the presses are judged on.
- **Paced Sight Run window** -150/+250 ms (`PACED_EASE = [1.2, 2]`, `Cfg.ease` may be a pair, each side graded on its own width). `paced.md` updated.
- **Pedal coach** (`pedal.ts`): `LATE` is max(0.25 beat, 150 ms); lifts are measured from the player's own chord onsets (from the judge) when it has them, else from the written times; the change points come from the bass (the lowest note of a beat or more sounding at each half bar's start; a shorter bass is passing) instead of chord-label changes. The test fixture's F chord stands on its root now: as F/C over the C before it, the bass does not move and the coach sees no change (the ceiling, see open).

## Deleted

- The arcade score: `Judge.score`, `POINTS`, the per-note points, `HOLD_FLOOR`, `LONG_KEEP`, the hold event's `f`, `letter()`, `Result.score` and `Result.grade`, and the best's `score` and `grade` writes (`store.ts` types the best as `{ acc }`; records saved before keep their extra fields, unread). The HUD accuracy updates on the judged count. Also `Judge.hits` and `Judge.done` (no reader) and the `auto` game event (no listener).
- One median: `util.median` (the mean of the two middles), now 0 for no input; `app/state.ts` had an upper median. Its callers (Sight Run and drill medians, the Theory median, calibration's offset) now get the true median: on an even count it is half a gap lower at most, and nothing compares it with a stored upper median.

## Files of other branches touched (small, local)

- `src/app/play.ts` `leave()`: the offset restore after calibration is gone (`setCalibrating(false)`).
- `src/app/results.ts` `onDone`: commits `{ acc }` instead of `{ score, acc, grade }`.
- `src/store.ts`: the `best` type and `commitNow`'s parameter.

## Tested

- `npx tsc --noEmit`, `npx vitest run` (63 files, 790 tests), `npm run build`, and the boot budget (`bundle.test.ts`, 241 110 bytes of 241 200; the judge's fields set once by `init()` and `finish()` reading its settings once paid for the new code; the budget was not raised).
- New: `midi.test.ts` (3), `game.test.ts` (15: the app's notes, count-in after pickups and tempo changes, calibration, the start key, takes' clock, disconnect, late hits on the corrected clock, loop close), `highway.test.ts`, `audio.test.ts` (the audio clock), `ear-play.test.ts`, `util.test.ts`; added to `judge.test.ts` (late hits, the asymmetric window), `paced.test.ts`, `pedal.test.ts` (passing bass, the 150 ms floor, the player's onsets), `metronome.test.ts` (half-beat pickup).
- e2e `E2E_ONLY='^(1|2|2b|4|15|16|17b|20|21) '`: see the result at the end of this note. There is no calibration feature in the e2e suite.
- Commits between "The key that starts a reading drill" and "Ear and pulse taps" were over the boot budget; it is under again from "Judge: ... late hit".

## Not verified

- Any of it on the iPad or the FP-10: the 250 ms look-ahead against WKWebView's output latency, the hysteresis against a real pedal's CC64 stream, calibration end to end, the feel of a late hit and of the paced window. The -150/+250 window, the 500 ms late cap, the 0.25 late weight, the 150 ms pedal floor and the +/-375 ms calibration window are judgement calls, not fitted to a player.
- `audio.ts` scheduling is tested against a stand-in AudioContext (start and stop times), not heard. An app note's release is `setTargetAtTime` from whatever level it has decayed to; the synth fallback's own later ramps are not cancelled (its source stops at the release anyway).
- Listen back still runs on `setTimeout` (a few ms of jitter), not the audio clock.

## Open

- **CSS for the late grade**: `style.css` (another branch's file) has no `[data-g='late']` or `.hit-late` rule, so the Late popup word is in plain Ink and a late note's head is not coloured on the staff. Wanted: Good Orange at about 60%, a hollow diamond shape on the staff. DESIGN.md lines to add when it lands (see below).
- **Pedal coach ceiling**: a harmony that moves over a held bass (I to IV 6/4 over a tonic pedal) is not a change, and an accompaniment of short notes (Alberti) has no bass, so the coach says nothing there. Chord-label changes alongside the bass would cover the first.
- On a disconnect, notes sounded through the Theory and Quiz paths are not in the game's held keys; they decay on their own (piano and synth do; a looped instrument stops after 30 s).
- The pedal coach's 150 ms floor and the late-hit cap are in song seconds, so at reduced tempo they are a little more forgiving in real time.

## DESIGN.md lines (for the owner to apply)

- Colour (`Perfect Lime ... Miss Red`): "Late (the right key up to a beat after the window) shares Good Orange at 60%; its word is Late."
- `#judge`: "colour by grade (lime, mint, orange, faded orange for Late, red)"; "Beneath it a 15px early/late or touch line (none for Late: the word says it)".
- Pedal line: "how many changes of the bass it was changed with" instead of "chord changes".

## ROADMAP.md lines (for the owner to apply)

- Sight Run's Pace: "scores each card on the beat (a 200 ms window)" becomes "(150 ms early to 250 ms late)".
- Pedal follow-ups: "a stuck pedal after a disconnect stays down until the next CC64" is fixed.
- Truth pass: the arcade score internals are now deleted, not only the multiplier.
