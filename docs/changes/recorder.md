# Recorder: listen back, compare with last time, ghost

Learners improve by judging by sound and by comparing runs (deliberate practice), so every run of a piece is kept.

## Takes
- Every Perform and Learn run of a piece that reaches the end records a take (`src/take.ts`): per key struck, its pitch, velocity (1..127), key down and held time in song ms, and the written note it played (-1 for a wrong key), plus the missed notes, tempo, whether the song waited, accuracy and clean. Hand comes from the note played, or the register for a wrong key.
- Recorded from the game's `press`/`hit`/`ok`/`release`/`miss` events, not `Game.presses`: those hold only matched notes, in performance time. Release times are read off the song clock, so they are good to a frame (about 16 ms).
- Not recorded: Read drills, Read through, Memorise, calibration, paused keys. A loop wrap starts the take again, so a looped stretch never mixes passes.
- The last 3 per piece in IndexedDB at `take:<id>` (`store.getTakes`/`addTake`), at most 4000 keys a take. About 15 bytes a key as stored (V8 structured clone of small-integer arrays), about 20 in the JSON export. Export, import and Clear carry them (the `EXTRA` and `clearAll` patterns); removing a song removes its takes.

## Results card
- **Listen back** plays the take through the app's piano (`audio.noteOn`, forced on) with each key's own timing and velocity, at the tempo it was played. The card steps aside, the staff cursor, falling notes and scrub head follow, and a bar says "Any key stops": any key, a MIDI key, a tap or Escape stops it (Escape no longer leaves the piece while listening).
- **Compare with last time** (from the second run) opens a strip per bar: right keys as two thin columns (last time dim, this run in ink, green when 15 points or more better, red when worse), and mean timing as two ticks about the beat line (late above). A line names the bars that changed and the mean timing of both runs. **Hear last time** plays the previous take.
- Per-bar "right keys" is right keys over right keys, missed notes and wrong keys, so Learn runs (which never miss) still compare. Timing is left out when either run waited. Takes from a different "Notes shown" level cannot be lined up and say so. `compareTakes` is pure; tests in `src/take.test.ts`.

## Ghost
- A "Ghost of last run" switch on the start card, once a piece has a take (remembered in `localStorage` `piano.ghost`). With it on, the last take shows as a dim dot on the staff behind each head (an on-time key hides under its note, an early or late one shows beside it) and as a thin trace in the falling-notes lanes: a tick where the key went down and a hairline while it was held. Never in Read drills or the special runs.
- `Game.ghost` carries the marks; `Staff` and `Highway` draw them. Glue in `src/app/take-ui.ts`, styles in `src/take.css`; results.ts gains one call.

## Verified
Headless Chrome, synthetic keys (`window.__piano.key/up`), Twinkle in Perform twice and the warm-up in Learn twice: takes saved and capped, the switch appears after the first take, ghost dots and traces drawn, compare strip and summary, listen-back counted 85 of 85 notes through `window.__take.sink` (dev only), Escape and a piano key stop it, export carries takes, no ghost in a Read drill. Screenshots at 1180x820 and 820x1180.

## Not verified
iPad audio (timers driving `audio.noteOn` in WKWebView, and how a long take sounds there). Listen-back timing rides `setTimeout` (a few ms of jitter), not the audio clock.
