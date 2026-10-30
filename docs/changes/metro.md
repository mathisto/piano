# Practice metronome and tempo ladder

Teachers' consensus: practise with a metronome, and raise the tempo after clean runs.

## What changed
- Dock **Metronome** button (key **B**) cycles off, beats, beats with eighths. Remembered in `settings.metro`. Off by default.
  In Perform it sits in the first dock row (this is also the standalone metronome in Technique exercises, which are songs with a bpm);
  in Learn it moves to the aids row. Hidden in Read drills. Read-through is a Perform pass, so it works there.
- Accent on a full bar's first beat; a pickup bar has none. 6/8, 9/8, 12/8 count dotted quarters (eighths then come three to a beat).
  Beat dots in the dock show the beat of the bar.
- Volume: the existing click level (Settings, now labelled "Click volume", covers count-in and metronome). Eighths play at half level.
  A silent count-in (0) still gets the 0.6 fallback the rhythm trainer uses, so the metronome is never mute by accident.
- Tempo ladder: the existing `Pace` (3 clean loop passes +5%, 2 messy -10%) is now a visible dock button, "Ladder on/off",
  next to the tempo, shown in Learn once a loop is set. It replaces the Auto tempo row in the Aids popover.

## How it keeps time
- `src/metronome.ts`: pure `ticks(bars, a, z, eighths)` (half-open window, so windows chain with no repeat or gap) and `beatAt`.
  Beat times come from each bar's own t0..t1, so tempo changes, pickups and meter come free. Tests in `metronome.test.ts`.
- `Game.metronome()` runs from `frame()` with the count-in's look-ahead (100 ms; 250 ms since 2026-10-30, `enginefix.md`, which also stops clicks already handed ahead on a pause, seek or loop wrap): clicks go to the audio clock as
  `(beat - game.t) / rate`. The window ends at the loop end, and in wait mode at the next pending note, so nothing sounds
  while the song stalls (the beat sounds when you play the note). Any `seek` (loop wrap, jump, restart) resets the cursor.
- `audio.click` now reads the audio clock from `getOutputTimestamp()` (paired with `performance.now()`) instead of the
  render-quantised `currentTime`: click jitter in headless Chrome fell from 3-14 ms to 0.2 ms. It falls back to `currentTime`.
  The count-in and the ear trainer use the same function and gain the same accuracy.

## Not verified
- Real audio timing on the iPad (output latency, `getOutputTimestamp` on iOS Safari).
- Under heavy CPU load a frame longer than the 100 ms look-ahead makes that click late (same limit as the count-in).
- Pausing lets a click already handed to the audio clock (up to 100 ms ahead) sound.
