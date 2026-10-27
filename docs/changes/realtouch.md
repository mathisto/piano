# Touch on real pieces (ROADMAP item 4)

Branch `feature/realtouch`. On a song the question is "did you follow the written dynamics and articulation", not "be even".

## Built

- **Import** (`musicxml.ts`): `<articulations>` staccato and staccatissimo (`art: 'stac'`), accent and strong-accent (`'acc'`), tenuto (`'ten'`); a note with two keeps staccato first. `<slur>` per voice: `slur: true` means "joined to the next note of its hand", so a slur's last note has none. `<wedge>` hairpins move `v` note by note from the mark before to the mark at the end; with no mark there, one step (0.15) that holds until the next mark. `Song.curve` is the written level per bar, set only when the score writes dynamics; `Song.wedges` is each hairpin by its first and last note (the note it lands on is outside), once per pass through a repeat. MIDI files get none of this. All fields optional; stored songs are re-parsed from their bytes, so they pick it up.
- **Judging** (`coach.ts`, pure): `articulationReport(song, presses, rate)` reuses `articulation()` (new `only` filter) and its thresholds for staccato notes and slur joins. `shapeReport(song, samples, edges, coach)`: written levels go through `writtenTargets` onto your range; a hairpin is judged by a least-squares rise across its notes (each hand against its own mean), reported only when the written rise is at least twice the tolerance and yours is flat (within one tolerance) or backwards; bar-line changes between soft and loud outside hairpins; accents against the median of up to three unaccented neighbours (louder by half a tolerance). `levelRuns()` finds the one place evenness is the point: 8+ single notes in one hand, equal gaps, one written level, no accent; the existing `evenness()` judges only that stretch.
- **Results**: `Result.follow`, at most two lines (most repeated first), each from a pattern seen at least 3 times and in a third of its chances. No score, no red. Off with Touch coach Off, in Read, when waiting, and for exercises (they keep evenness). Fixed key touch silences the loudness lines.
- `src/score-fixtures.ts`: a ten-bar original score (staccato, a slur, a p-to-f hairpin, accents) for tests and the dev check.

## Tested

- `musicxml.test.ts`: marks onto notes, hairpin interpolation, a hairpin with no end mark, a repeated hairpin, no marks no curve.
- `coach.test.ts`: played as written says nothing; staccato held long; slurs lifted; flat and backwards crescendo; flat accents; two-line cap; the level run; bar-line changes; MIDI and Fixed say nothing.
- Headless Chrome 1180x820, fixture imported through Add files, Perform with synthetic keys: as written, no lines; flat, "You played the crescendo in bars 5 to 8 as a flat line." and "4 of 4 accents came out no louder than the notes around them."; staccato held, "8 of 8 staccato notes were held long (about 95% of their value)...". Smoke green.
- 220 real library scores parse with no errors: 214 carry articulation or slurs, 210 a dynamic curve, 3,520 hairpins.

## Not verified / open

- No human playing: the tolerances (hairpin flat = within one band, accent = half a band, a third of chances) are guesses, like the exercise thresholds. Real phrasing inside a run written at one level may trip the evenness line too often.
- The staff did not draw staccato dots, accents, slurs or hairpins when this was written; `marks.md` draws them now.
- Words (`cresc.`, `dim.`) are not read; a second hairpin after an end-less one starts from the old level. Lines name the stretch, not the moment: no marks on the staff after the run.
