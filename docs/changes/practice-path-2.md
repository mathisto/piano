# The practice path, phase 2: one "what next"

Branch `feature/path2`. Phase 2 of `docs/research/practice-path.md` (sections 2.3, 2.4, 4.1 and 5), with the owner's decisions 6, 7 and 8 as recommended, and L2 of `docs/research/library-and-profile.md` (`by` on every history row).

## Built

- **`nextUp()`** (`src/next.ts`, lazy, pure). A cascade over the pickers the app already had, the first that applies: the fix after a run that was not clean (the loop of its worst bars, offered three times a day at most), the first week's step for today, the plan's first row not ticked, the row with most due, the Path's next requirement, the piece. It never returns nothing: there is always a piece (a starter on an empty profile). Every unit carries its reason line (the Today row's sub-line) and `by`, the step that chose it. The drop-back, plateau and strand-lag rules (phase 4) slot in before the Path step.
- **`snapshot()` and `hooks.next`** (`app/today.ts`). Today's gather is now `snapshot()`: the rows Today can offer (`todayRows`, each with the data of the button that starts it), the plan's keys, the day's ticks, the first week's step and which row does the Path's next requirement. `hooks.next(after)` re-gathers it (so a stage that just went solid is not offered again), runs the cascade and returns the unit with `start()`, which ends the drill or read-through that just finished, leaves the play screen first for a page (Theory, Progress), says what offered it, and starts it through the one launcher Today's buttons use. `results` and `drill` sit below `today`, so they reach it through the hook; no module moved.
- **Continue on every results card**: the song card (pieces, scales, technique), a reading set, a Sight run (paced or not) and a Theory session. It is the lamp, with where it goes in a line under the actions ("Loop bars 6 to 7 at 70%", "Review: Bass landmarks · 12 cards due"), tied to the button by `aria-describedby`. Again is the restart icon (on a reading set "Another set"; a solid stage keeps a plain Next stage), Back to <page> the ghost. Each card's history row gets `then`: `c` Continue, `a` Again, `b` Back, `o` other (Next stage, the pace step, Try it from memory). If the next chunk cannot load, the card shows without Continue and Again is the lamp.
- **Decision 6.** After a run that was not clean, Continue is the loop of its worst bars, in place (the old lamp's handler), at most three times a day for that piece, then it moves on and the loop waits in More. After a clean run Continue moves to the day's next thing; the pace step ("Try 75% tempo", "Try it without waiting") is in More, and the piece keeps it (`Progress.pace`): Today's piece row reads it as its reason and its Continue opens the piece at that tempo or without waiting.
- **One source of truth for the loop's bars** (Known quirks). The loop now takes the two neighbouring bars with most slips (wrong keys and misses, from `marksOf`), the same marks the headline counts, so "Not clean yet: 3 slips in bars 6 and 7" and "Loop bars 6 to 7" agree. Only a run with no slip, held up by long waits, loops on its heat ("Bars 2 and 3 held you up longest.").
- **Decision 7.** The card's footer is Continue, Again (icon), More, Back (ghost). The old loop lamp is Continue now, so nothing duplicates it; under the card the dock's Loop worst bars, Clear loop and Tempo hide (`#play.resopen`), which settles the "ten visible actions under a Learn card" quirk.
- **Decision 8 and UX-25, Today.** The lamp is `nextUp()`. In the first week the Start here step for today takes it and every plan row is ghost until it is done (UX-6: one first step). Later Start here steps have a ghost Start (nothing locked). While the plan has undone rows the lamp is the first of them, as before. Once every row is ticked the plan is one line, "Today's plan is done." with a ghost "Make it 20 min" (the next length), and the lamp row under it names what comes next. There is never a Today without a lamp.
- **`by` on history rows** (L2). Today's buttons (the plan rows `plan`, the Start here steps `guide`, the lamp row its own step) and Continue (`fix`, `guide`, `plan`, `due`, `path`, `piece`) say what offered the next thing (`store.offered`); the next history row of that kind carries it, every other row says `own`. Leaving a piece before its run ends clears the offer. `logHistory` returns the setter for `then`.
- `fixBars` became `openAt(id, { rate, nowait, loop })`, used by Today's fix and piece rows, Continue and a read-through's Loop these bars.

## Calls where the plan and the code differed or were silent

- No strand filter on `nextUp` yet: nothing calls it with one until phase 3's section Starts.
- The offer count is in memory (`ponytail:` in `app/results.ts`): a reload starts the day's count again. The log could give it, but a Learn run that waited and was clean is logged `ok: false`, so the log cannot tell a clean waiting run from a slipped one without another field.
- Read-through and Memorise cards keep their own next step (Next piece, Again): the brief named the song, Read, Sight run, scales, technique and Theory cards. A read-through's Next piece already is its Continue.
- History rows of reading sets, Sight runs and Theory still have no `id` (phase 1 gave ids to song, scale and technique rows only); `by` matches an offer to a row by its kind.
- The plan's done rows are not shown once the whole plan is done (the plan "collapses to one line"); the week strip keeps the minutes.
- Today's rows and view moved from `ui.ts` (boot) to the lazy `ui-views.ts`, which Today now loads with the covers' chunk it already waited for.

## Boot budget

222,068 bytes before (test mode), 219,923 after: moving Today's rows and view out of boot freed more than `snapshot()`, the launcher, the hooks and the store fields cost. Budget 223,000 untouched; `next` is on the must-stay-lazy list.

## Tested

`next.test` (each cascade step, the fix offered three times then the day goes on, a clean run moves on, never empty on an empty profile), `today.test` (the lamp on the plan, the first week's step with the rows ghost and a later step startable, the plan done with Make it 20 min and the lamp on what comes next, the pace step on the piece row), `ui-results.test` (Continue and its line, the pace step in More, Again the lamp without Continue, the drill and Sight run footers), `store.test` (`by` from an offer, `own` otherwise, `then` edited on), `bundle.test` (lazy list). e2e 25: a clean run's Continue opens the plan's next row, its `then` is `c`, the next row's `by` is `plan`; a finished plan shows one lamp, on the row after the plan-done line.

## Design pass

impeccable critique (two isolated assessments: design review, and the detector with the browser overlay) on the results footer and Today in Nocturne and Matinée at 1180x820, 820x1180 and 390x844: 26 of 40, no P0, the changed files and the page clean in the detector (its one overlay hit, cream-palette, is the paper ground). Polished:

- Where Continue goes is the words that decide the next tap, read from the stand: Ink Soft at 17px, not Ink Faint at 15px.
- The lamp row after a finished plan is the row's own title with the Next tag (the Tag Rule), and no ring, since it is not a plan step: "Up next: Scales: the easy keys" over "Next: C major" stacked colons and said next twice.
- On a phone the way back wraps under Continue's line on every card (the drill's All stages and Theory's All trainers too), so the line stays with its button.
- Later Start here steps' Start lines up under the day's Start, and on a phone keeps beside its title.

Kept, against the critique, because the owner decided them: Continue is the word on the lamp even when it loops (decision 7; the loop's verb is in the line under it), and a clean run below full tempo moves on rather than climbing (decision 6; the step is in More and on Today's piece row). Ten Starts on a first-week Today is UX-25's fix (nothing locked). Both are in DESIGN.md's Known quirks to judge on the iPad.

## Open

- Judge on the iPad from the stand: the Continue line's size, and the slip card at 1180x820, whose Review row opens half under the two-line sticky footer.
- Read-through and Memorise cards have no Continue yet; history rows of reading sets, Sight runs and Theory have no `id`.
- Songs still puts its own lamp on the last piece (UX-6's third "first thing"): phase 3's section Starts.
