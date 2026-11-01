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

- Judge the pointing shapes (Polish, below) on the iPad from the stand.
- (Closed in Polish: the stray over a written head, and Escape.)

## Polish (branch `feature/polish1`)

A design pass with impeccable (critique, audit, polish) on the results card, the run marks, Review, the Mark list and the mark pop, in Nocturne and Matinée at 1180x820, 820x1180 and 390x844, driven by real runs of Canon in D with misses, early and late notes and wrong keys.

- **The paper opens on the first slip.** It stayed on the last window of the run (bar 8 of Canon in D, two harmless triangles) while the headline named bars 2, 6 and 7, so the "marked score is the review" claim held only for a one-window piece. `review()` brings the first wrong key or miss into the window when the card opens.
- **No mark pop.** Its 268px card at the foot of the paper covered the bass staff, and on a phone the very mark it described. The sentence now lives in the review bar (`#markSay`, `aria-live`) and, with the card up, in the Mark list's current row; the ring alone points at the paper. A tap on a mark folds into Review.
- **Review gives the room to the paper.** Folded, the view is the Staff layout (`game.reviewing` is now `false | 'both' | 'sheet'`), fitted from bar 1 (the old fit started at whatever bar the last step revealed, so bar 1 was cut), the zoom set for the review only and never saved, and the bar is the key strip (the frozen highway of a finished run is gone). It opens on the first slip; ← → step, Escape takes the ring away then unfolds; the ring follows a resize.
- **Decision 10 settled: pointing shapes, centred.** On dense music the 5-unit shift was about 3px at the review's size and put a Good shape under the gap to the next eighth, so whose mark it was had to be guessed. A Good note is now a filled triangle centred under its head pointing ◂ early or ▸ late (the live word's ‹ ›), Late stays the outlined ▹. Neither smaller (worse at reading distance) nor the barbed line (a line under quick notes crosses their neighbours' space, and needs a length scale nobody can read) was better.
- **A wrong key on a written head's column** a step or less from it stands beside the head as an engraver sets a second (14 units, on the side it was played), with its accidental left of the written head.
- **The card.** What went right ("Bars 1, 3 to 5 and 8 had no slips."), and the coaching points of 2.2: why the lamp loops the bars it does, with their first slip in a sentence, and a lean of 30 ms or more with "calibrate Delay in Set up". Holds and touch points were not built: Holds does not count yet, and the touch coach lines already say the touch point. The Notes line no longer repeats the figure; the Time line no longer says "on the beat" twice ("neither early nor late on average"); the loop says its tempo ("Loop bars 6 to 7 at 70%", not "slowly"); a wrong key's offset is in ms as the early and late notes are; no voicing line when every note came in equally loud (it contradicted the fixed-velocity line under it). The footer is sticky, so the next step is never scrolled away; on a phone the card is one column. The HUD's percentage hides while the card is up; Show all timing shows only when some note was Great; a missed head no longer flashes crimson again on every rebuild after the run; the legend draws the paper's own marks.
- **The loop is not on its point.** 2.2's wireframe gives the first point its own Loop button and the footer a Continue that, after a run that was not clean, is the same loop (2.3, rule 1): two buttons for one action. The point says why; the footer's lamp is the action, and Continue takes that place in phase 2 with nothing to undo.

Boot JS 222,068 bytes (222,038 before; `game.reviewing` is the only boot change), budget 223,000 untouched; everything else is in the lazy results, review and staff chunks. The paper cursor hides while the card is up (a finished run has no "now"); an opened Mark list or Details scrolls clear of the sticky footer; Escape on the Show all timing switch unfolds rather than leaving. e2e 24 now finds the miss on the paper as the card opens (the stray in bar 5 is checked in Review), Review opening on a mark, the sentence in the bar, and Escape twice.

Not done: the Learn loop still comes from the heat (`worstBars(r.heat)`: misses, wrong keys and long waits), so its bars can differ from the headline's slip bars; the point says which ("Bars 2 and 3 had 1 of the 2 slips", or "held you up longest"). Taking the loop from the slips alone is phase 2's call with Continue.
