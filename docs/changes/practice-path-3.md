# The practice path, phase 3: the level sets the standard; a Start on every page

Branch `feature/path3`. Phase 3 of `docs/research/practice-path.md` (sections 2.5, 3.2, 3.3 and 5), with the owner's decisions 3 and 5 as recommended.

## Built

- **Auto, the new default of Timing and Touch feedback** (decision 3, `src/settings.ts`). `AUTO` maps the Path level onto the settings that already existed: Timing Easy at level 1 (windows ×1.3, no hold grading), Standard at 2 to 4 (holds lenient), Strict at 5; Touch feedback Gentle at 1 to 3, Standard at 4, Strict at 5. `strictness()` and `touchCoach()` give the value in force (the one picked by hand, or Auto's), and every reader goes through them: the judge's windows and holds (`game.cfg`), the evenness and the follow-the-score lines at the end of a run, the live touch marks, `coached`. A value picked by hand stays.
- **The level** (`settings.lv`) is the level of the Path's next requirement, 5 past the last, worked out wherever the Path is (`levelOf` in `app/today.ts`: Today, Progress, each Continue and each page's Start) and kept in the settings, so a run opened at boot is judged without waiting for every store. History rows of songs, scales and technique carry it (`lv`, the standard the run was judged at; phase 1 had left it for now).
- **Settings says what Auto is doing**: each row's line opens with "Auto: Easy, from your level 1." in bold. Touch feedback's five choices go under the name across the row; on a phone every choice row does (the four-choice rows overflowed the 390px drawer before this too).
- **The saved settings move to Auto once.** Every profile saved before held `strict: 'standard'` and `coach: 'gentle'`, chosen or not, so a saved Standard Timing and a saved Gentle Touch feedback become Auto; a value only a hand could have picked (Easy, Strict, Off, Standard touch) stays. `ver: 2` marks the move done, so a Standard picked again afterwards stays Standard. A player who wants Standard at level 1 picks it again.
- **Evenness by level** (decision 5, `unevenCounts` in `src/even.ts`). From level 2 an uneven touch stops a scale run (`scales.ts passed`) and a technique run (`syllabus.ts goodRun`, which had no evenness term before) counting; at level 1 it is shown and does not count; on a piece it never counts. The Scales lede says so: "Solid after three clean runs in a row, in time, and from level 2 even".
- **The results card's labels follow the standard**: Touch says "counts" only in Perform, on a technique exercise with targets, or on a scale or exercise from level 2 when evenness was measured; a Learn run's touch, which no rule reads, says "not counted yet". Holds stays "not counted yet" (no rule reads it) and is absent at Easy, which grades none.
- **A Start in every page head** (`nextUp(snap, strand)` in `src/next.ts`, `hooks.lamp` in `app/today.ts`). Songs, Read, Read's Sight run, Scales (Stages), Technique and Theory get one lamp under the title: Start, and beside it what it starts and why ("Bass landmarks · 12 cards due", "Triads on the white keys · Next on your Path, level 1"). The strand filter keeps every cascade step to the page's strand (`Unit.strand`, the history kind a unit leads to): the first week's step, the plan's next row, the most due, then the Path's first requirement of that strand not solid (`frontier`, from the Path rows on the snapshot), then the strand's own row (`by: 'next'`). A strand Today has no row for comes back empty, and the page picks: Theory's first trainer not started at its level, else the one due back soonest.
- **One lamp a page.** The head's Start takes over: a stage row's Practise and Songs' Learn on the last piece go ghost, the Sight run and Technique builders' Start become plain buttons, and the Next tags go (the Start's line names the stage). Technique's head Start is the pack in hand while it has a next step (the studies decision: the pack you last started something in holds the lamp), else Technique's `nextUp`. If the snapshot cannot load, the page keeps its old row lamp.
- **The Sight run on offer** is the last one set up at the tempo its history has reached (`lastRun`): a paced run's tempo memo (raised after clean runs on two days) now reaches Today's row, the Start and Continue, which used to start the stale tempo of the form. Today's Sight run row names it ("Treble C4 to C5 at 54 bpm") instead of "Fresh notes in a row, at your range"; the exercise row says "Exercise, next in the syllabus".
- **Theory's levels are stored** (`settings.tlv`): the pop-up, the Path and Today set them through `setLevel`, and the trainer list and its Start open at the level the player left.

## Calls where the plan and the code differed or were silent

- **Level 1 touch is measured, Gentle**, not Off: the table in 3.2 says "measured, never counts", so the live marks and the evenness strip stay and nothing counts them.
- **Technique gains evenness from level 2.** Section 3.3 says the technique rule is unchanged, decision 5 says evenness counts on technique from level 2; the decision wins. Velocity targets (`touchPct`) still count at every level, as 3.3 says.
- **The level is cached in Settings** rather than recomputed per run: the Path needs four stores, the judge needs its windows at once. It is refreshed whenever the Path is computed, so it is at most one page visit stale.
- **The Start line sits under the title**, not among the head's actions: the right side already holds the segmented controls, and the line has to stay with its button at 390px.
- **The Next tag goes from page rows** rather than moving to the row the Start opens: the Start's own line names it, and a tag on a row without the primary would break the Tag Rule.
- **No "Time counts loosely" headline** at level 1 (a wording sample in 2.2): Time says "counts" and Settings says Easy.
- **No "your level moved" line on the card** (risk in section 7): not built; Settings names the level.
- Each page's Start has its own id (`readStart`, `libraryStart`...): every page stays in the document, and a shared id made the reason line describe another page's button.

## Boot budget

221,583 bytes before (test mode), 222,709 after; budget 223,000 untouched. The cost is `settings.ts` (the Auto map and the move), the snapshot's strands and level, and the Start's hook in `app/today.ts`; the frontier and the Start's drawing live in the lazy `next.ts`. Margin left: 291 bytes, so the next boot change should move weight out first (`docs/changes/perf3.md` names `scales.ts`).

## Tested

`settings.test` (the Auto map by level, kept inside 1 to 5, a hand-picked value stays; the saved Standard and Gentle move to Auto once), `scales.test` (the pass rule by level), `syllabus.test` (an uneven exercise counts at level 1, not at 2), `next.test` (the strand filter: the first week, the plan, the most due, the strand's Path step, its own row, nothing for Theory with nothing), `ui-results.test` (Touch counts by level, and not in Learn). e2e 26: each page head's Start (Songs, Read, Sight run, Scales, Technique, Theory) opens something and is the page's one lamp with a reason line; a level-1 player's uneven scale run counts ("1 of 3 in a row", Touch "not counted yet", no holds graded). e2e 1, 3 and 25 now start from the head's Start. Full run: 47 of 47 passed; vitest 1018 passed, 4 skipped.

## Open

- Judge on the iPad from the stand: the Start's line beside its button, and the Settings rows with Auto.
- The level signal is coarse (section 7): a good reader held at level 1 by a theory row gets Easy windows on songs.
