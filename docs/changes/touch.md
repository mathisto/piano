# Timing and touch (ROADMAP "Approved 2026-10-27", item 4)

Branch `feature/touch`. New logic in `src/coach.ts` (+ `coach.test.ts`, `coach.css`).

## Built

- **Timing evenness** (`timing`): per hand, each gap between struck notes against its written gap (`off[i+1] - off[i]`, real ms), spread as MAD x 1.48. Bias is the mean offset, reported apart; a constant lag cannot move the spread. Any run that did not wait (Read excluded). Results: "Timing: your gaps vary by about 14 ms; you run 9 ms behind the beat." In Perform it replaces the old lean caption under the timing histogram.
- **Legato and staccato** (`articulation`): `Game.presses` records each struck note's key down and up (MIDI timestamps). Legato: overlap of each key with the next written note in its hand, smooth when between `-LEGATO_GAP` (30 ms) and `max(LEGATO_BLUR 120 ms, a third of the gap)`. Staccato: held share of the written value at the played tempo, short when at most `STACCATO_MAX` (0.5). Applied when `song.artic` is set (technique legato/staccato) and to every `scale:` run (scales are legato). No imported song carries articulation yet.
- **Voicing** (`voicing`): right-hand mean velocity minus left, aim at least `BALANCE_SHARE` (0.25) of the calibrated range (10 on default bands). Shown for the balance exercise and two-hand songs (melody assumed in the right hand). Other two-hand technique runs already get the hand gap from the evenness hint, so it is not repeated; the touch line drops its hand means when the voicing line shows.
- **Fixed key touch**: `evenness()` now returns null when every velocity is identical (it used to rate that "even", which fed the scale pass). Results say so, naming the setting when it is Fixed.
- **Fading live marks**: per exercise `{runs, even}` in IndexedDB (`coach:stats`, in export/import/clear). Three even runs in a row: the staff triangles drop to 35% opacity. Every 4th run: no live marks, a flash at the start, a results line. Advanced has "Always show touch marks"; Touch coach Off still turns all of it off.
- **Key touch setting** (`settings.keyTouch`, default Unknown) as a select under Touch coach with a one-line hint; stored with every touch log entry.
- **History**: `HistoryEntry.even` (share inside the band, 0..1) and `bias` (ms) on Perform runs. Progress UI untouched.
- Results card: the evenness strip and the new lines stack in the stats column; the overlay scrolls when the card is taller than the stage (it was cut off top and bottom in the split view at 820 px).
- Dev hook: `__piano.up(p)` releases a key.

## Tested

- `coach.test.ts`: bias vs spread, hands kept apart, legato overlap/gap/blur, a missed note, staccato at two tempos, voicing, fixed velocity, the fade schedule.
- Headless Chrome 1180x820 with synthetic keys: legato, staccato, balance and fixed runs; five runs of one exercise (full, full, full, test, faint); `npm run smoke` green.

## Not verified / open

- Real FP-10 release timing and the iPad: synthetic keys only. The thresholds are from the literature's direction ("slight overlap"), not fitted to a player.
- The live-mark fade is opacity, a guess at "fade"; the evidence (guidance hypothesis, M) does not settle the schedule.
- Drawer hint breaks DESIGN.md's "no sentences in the drawer" rule on request; the results card is still tall (ROADMAP item 8).
