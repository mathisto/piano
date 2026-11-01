# The practice path, phase 1: an honest grade, marks that stay, the attempt log

Branch `feature/path1`. Phase 1 of `docs/research/practice-path.md` (section 5); all ten owner decisions in its section 6 taken as recommended.

## Built

- **The precision fix** (`judge.ts`, 3.4). `accuracy = weightSum / (judged + extra)`: a wrong key costs what a missed note costs, except a key of a written note's own pitch within a beat of it (the Late grace, capped at half a second) while that note is not yet struck: that key is the note early or late, already charged as a miss or a late hit. `wrong` and `clean` are unchanged; wait mode judges nothing, so it stays 1. `strays: {p, t}[]` keeps every wrong key with its song time until the next restart (a loop pass included). The technique pass rule (`syllabus.ts goodRun`, `acc >= 0.85`) needed no new term: it reads `acc`, which now carries the wrong keys, so a run that mashed round the notes no longer counts (test in `syllabus.test.ts`).
- **Marks that stay** (`staff.ts`, `marks.ts`). After the run a wrong key is a hollow dashed head with a cross at the pitch played and the time played (`notehead()`, shared with the live ghost); the grade shape sits 5 units left of its head for an early key and 5 right for a late one (decision 10); Great is hidden once the run is over (CSS `#play.resopen:not(.alltiming)`), Show all timing brings it back. `marksOf(judge, song)` is the one list (kind, bar, beat, hand, pitch, nearest written note, ms) behind the paper, the tap card, the Mark list and the paper's `aria-label` summary.
- **The results card off the staff** (`ui-results.ts`, `app/review-ui.ts`). The song card is `.results.on-stage`, over the falling notes only; the staff-only and falling-only views open as Both while it is up. Headline sentence, "45 of 48" over "notes right" ("right first time" when waiting), percentage only in Details; separate Notes, Time, Holds and Touch lines each marked "counts" or "not counted yet" by today's rules (Notes always; Time in Perform; Touch on a Technique exercise with targets and on a scale; Holds not yet). Review on the score folds the card to a bar and fits the paper; the Mark list, a tap on a mark, and the bar's arrows say a mark in a sentence. Again is the restart icon, Back to <place> the ghost.
- **The attempt log** (`store.ts`, `backup.ts`). History rows gain `id, notes, ok, as, rate, sp, then` (`HISTORY_KEEP` 3000); Learn runs are now logged, with `as: 1`, and the Over time charts and the teacher summary skip assisted rows. Card rows (`{ts, k, y, rt, got?}`) from reading drills, unpaced Sight run and Theory go under `log:cards:<YYYY-MM>`, never dropped; export carries them in `extra` (merged by time per month), Clear all data removes the `log` prefix. `got` is the pitches played on a miss; `sp` is the standard deviation of the hit offsets around their own mean (omitted when the song waited or under 8 notes were timed).

## Calls where the plan and the code differed or were silent

- No `lv` (Path level) on history rows: the level does not set the standard until phase 3, and computing it needs every store loaded. It lands with phase 3.
- Assisted (`as`) is a Learn run or a part or Notes shown run; "names shown" is not logged.
- A wrong-key stray that is a repeated strike of a note already struck is charged; the plan's wording exempted any same-pitch key within a beat.
- The `Result` has no new fields: `rightOf()` in `marks.ts` derives "notes right" from `total`, `counts.miss` and `first`.
- No pane change (plan: divider to 0.45): the card in a 0.4 pane fits at 1180x820; a phone scrolls the card.
- Not built (later phases or not asked): Continue, the "what went right" line, coaching buttons, Loop this bar and Hear this bar in the tap card, the Auto standard.
- Card rows of a reading set left half done are written with the next set; a paced Sight run writes no card rows (it has no per-card answer). Theory writes a row per card; a rhythm or ear card has no `got`. Months are UTC.
- `sp` is only on song, scale and technique rows; the paced Sight run row keeps `bias`.
- The Over time line and Best step down by a few points where wrong keys were common (about 1/(n+1) a key); old rows are not rewritten.
- Timing text of Learn results moved from a coach line to the Time line (`coachLines` lost it); `timingLine`, `articLine`, `voiceLine` and `coachLines` moved to the lazy `coach-lines.ts`.

## Boot budget

`src/bundle.test.ts` measures 222,534 bytes at HEAD in test mode (the plan's 221,833 is the figure outside it), 222,009 after: moving the coach lines out of `coach.ts` freed more than the judge, store, drill and results changes cost. The budget is untouched (223,000); it could drop to about 222,300. `coach-lines`, `marks` and `app/review-ui` are on the must-stay-lazy list.

## Tested

`judge.test` (mashed run lower, same-pitch key not counted twice, wait mode unchanged, strays kept), `marks.test`, `ui-results.test`, `syllabus.test`, `store.test` (export round trip with month keys, `got`, `sp`, merge, Clear all), e2e 24 (a wrong key on the paper after a run, `#res` clear of `#staff`, the Mark list, Review, Escape, the log row and `then`). Looked at in Nocturne and Matinée at 1180x820 and 390x844.

## Open

- Judge the shifted shapes on the iPad before decision 10 is locked; dense treble systems may need them smaller.
- Where a stray falls on a written note's column its dashed head overlaps that head; the ring and the sentence say which is which.
- The Escape key closes the tap card first; the card itself still has no Escape.
