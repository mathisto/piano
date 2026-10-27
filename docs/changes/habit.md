# Session and habit (ROADMAP items 5 and 6)

## Built
- **Plans of 30 and 45 minutes** (`src/plan.ts`). Blocks by time, a slot lists alternatives and the first that exists wins:
  5 warm 2, read 3 | 10 warm 2, read 2, piece 6 | 20 warm 4, theory-or-read 3, piece 10, again/fix/review 3 |
  30 warm 3, scale 3, read 5, piece 14, fix 2, again/theory/path/review 3 |
  45 warm 5, scale 5, read 5, theory/path/run 3, piece 20, fix 3, again/review 4.
  Minutes of a slot with nothing to offer go to the piece. New Today rows: Scales (next stage), Theory (cards due),
  Sight Run, Path (next requirement, when it is not a scale).
- **Break reminder** (`src/rest.ts`, `breakToast` in `src/habit-ui.ts`): after 30 minutes of playing with no pause over 5 minutes,
  a quiet toast "Stretch your wrists" with Dismiss (gone after 90 s). Fed by `practised()` in main.ts, the same place
  `sessionSec` for `flushPractice` grows. Theory answers now count as practice time too.
- **Day streak** (`src/streak.ts`): replays `practice:days` (60 s counts as a day), one freeze per 7 practised days in a row,
  cap 2, a missed day spends one or ends the streak. Today is never judged until it is over. Nothing is stored. Shown as
  "N-day streak . 1 freeze" in the week card on Today and Progress; absent at zero.
- **Path** (`src/grades.ts`): Level 1 to 5, 30 requirements; scales come from `scales.ts` stages by id (s1..s6),
  technique from `SYLLABUS` by pattern, reading from drill stages, theory from card stats. Not started / Learning / Solid,
  "Level N: x of y solid", Start on each level's next requirement (primary on the overall next). Progress section "Path".

## Honest gaps
- Chromatic scales, contrary motion in other keys and arpeggios in every key are listed as "coming": no feature trains them.
  Another branch adds those stages to `scales.ts`; wire them in `REQS` by stage id after merge.
- Scales have no review dates, so there is no spaced review of scales yet (pieces and reading stages have).
- A theory requirement is solid at 80% of its cards answered twice at 80% first try (a `ponytail:` note, not Leitner boxes).
- The 10-minute plan no longer carries the second-piece review row ("again"); it starts at 20 minutes.
- Scale songs now tick a new `scale` step, not `warm` (warm is Technique only).
- Break timing and the streak midnight edge are unit-tested; the 30-minute toast was not waited out live.

## Files
New: `src/plan.ts`, `rest.ts`, `streak.ts`, `grades.ts`, `habit-ui.ts`, `habit.css` and a `.test.ts` for each logic file.
Edited: `src/main.ts` (data, handlers, `practised`), `src/ui.ts` (Today rows, week block, Path section), `src/settings.ts` (type).
