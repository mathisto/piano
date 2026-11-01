# The practice path: graded results, marks on the score, and one "what next"

Compiled 2026-11-01 for the owner's request of the same day: keep the wrong-note marks on the staff after a run and show how early or late each note was; make the results screen useful and graded properly, with right keys, timing and evenness weighed differently by level; replace Again and Back with a Continue to the next recommended lesson; give Today, and each section, one "start here, it meets you where you are" lesson; and let the recommendations grow smarter from the player's own record.

It is a synthesis of five research passes run the same day (an inventory of the code, assessment pedagogy, adaptive curricula, feedback science, and a survey of 17 products), checked against the code at HEAD 5d0b8ce. Where the passes disagreed, the call is made here with the evidence for it and what would change it. `docs/research/learning-science.md` and `products-and-ux.md` are taken as read and not repeated.

Evidence labels, as in `learning-science.md`: **MA** meta-analysis or systematic review, **EXP** controlled experiment, **OBS** observational, survey or qualitative, **REV** narrative review or theory, **PRAC** teacher, syllabus or board document, **IND** product behaviour or vendor claim, **INF** our own inference with no direct study. A source read only as an abstract or search summary is marked (unv), as there.

---

## 1. The recommendation on one page

**What to build.** Five phases, each shippable alone.

1. **Honest grade and marks that stay** (one session). Fix the accuracy figure so a wrong key costs what a missed note costs (today it costs nothing: mashing scores as well as playing). Keep every wrong key's time and pitch, and when the run ends draw them on the staff as crosses at the pitch played, beside the misses and grade shapes the staff already keeps; shift each grade shape left or right of its note for early or late. Move the results card off the staff so the marked score is the review. Replace the 88 px percentage with a sentence and plain counts (Notes, Time, Touch) that say which of them counted at the player's level. Start logging what each run and card was, by id, because no later model can be fitted to a history that was never written.
2. **One "what next"** (one session). A pure function, `nextUp()`, in a new lazy module, behind three surfaces: the lamp row on Today (always present, also after the plan is done), Continue on every results card, and the first-week step (so a first run points one way). It is a short cascade over the pickers the app already has (due review, the plan's next row, the worst bars, the Path's next requirement, a piece), and it always says why.
3. **The level sets the standard** (one session). Strictness and Touch coach gain an Auto value, the new default, that follows the Path level: wide windows and no hold or evenness grading at level 1, tighter at each level after. Each section's page head gets one lamp, "Start", from `nextUp(section)`; Theory's levels are stored so its Start can meet the player where they are.
4. **Adapting from the record** (one to two sessions, useful after two or three weeks of log). Rules on the log: two sessions under 70% on a unit suggest one step back; five sessions with no gain change the task; the strand furthest behind gets the free slot. The review gains "bar 7: late in 4 of the last 5 runs" from the takes already kept.
5. **A learner model, when the data is there** (two sessions, not before about 50 sessions per strand). An Elo-style ability per strand to choose between candidates near an 85% success rate, a 60 to 90 second placement for new players, and a replay test that checks any change against the log before it ships.

**Why this order.** Phase 1 is what the owner sees first and fixes a real scoring bug; it also starts the data clock, the one thing that cannot be done later. Phase 2 is the largest single gain in use: it ends three open owner items at once (UX-6, UX-25 and the missing Continue) with one function. Phase 3 delivers "weights by level" through knobs that already exist rather than a new formula. Phases 4 and 5 need the data that phases 1 and 2 begin to collect.

**The four calls that shape it.**

- **No blended grade.** Notes, time and touch are shown and judged separately, and the player's level decides which of them count and how strictly. The evidence: a big number frames the person, not the task, and grades shown with comments do no better than grades alone (Butler, EXP; Kluger and DeNisi, MA); exam boards mark the same criteria at every grade and raise the bar through repertoire and tempo, and no board or study publishes level-dependent weights (ABRSM, Trinity, RCM, PRAC; 2024 review, MA); a compensatory average lets good timing hide wrong keys, the most repeated complaint against Yousician's stars and Simply Piano's all-green notes (IND). "Right keys first" becomes a strict gate on notes and a loose one on time at level 1, not a 55% weight.
- **Pulse counts from day one, loosely.** Notes gate hardest for a beginner, but time is never dropped: RCM gives rhythm half the sight-reading marks at its first level (PRAC), beginners left alone improve pitch and neglect pulse (Pike and Carter 2010, EXP, small), and rhythm not being checked is Simply Piano's top complaint (IND).
- **Build on what exists.** The judge already keeps each note's grade and offset until the next restart, the staff already redraws miss marks after every rebuild, the take already records every key, and Today already computes every candidate a recommender needs. The new code is a list of wrong keys, a drawing pass, a cascade and a log, not a subsystem.
- **Recommend, never lock** (PRODUCT principle 7). Every recommendation names its reason, Again stays one tap away, and the player's own pick is never overridden.

---

## 2. The six wants

### 2.1 Wrong-note marks that stay, and how early or late each note was

**What exists.** The judge keeps, per written note, its state, grade and offset in ms (`judge.ts:41-43`, set at `judge.ts:172-176`) until `rescore()` builds a new judge (`game.ts:217-224`, on restart, a loop pass, a hand or mode change). The staff's `build()` already redraws from that state after every rebuild: a crimson cross under each missed head and a grade shape under each past note, ● great, ▲ good, ▹ late (`staff.ts:371-380`, `flag` and `shape` at `staff.ts:545-567`). So misses and grades already persist after the run; the results overlay hides them (`.results { position: fixed; inset: 56px 0 0; background: var(--scrim) }`, `style.css:1775-1783`). What does not persist is the wrong key: `Judge.stray(p)` (`judge.ts:206-210`) only counts it, the event `{ k: 'wrong', p }` carries no time, and the live cross is a ghost that removes itself after 760 ms (`staff.ghostBad`, `staff.ts:519-526`). Direction is not on any persistent mark; it shows only in the transient popup (`‹ early`, `late ›`). The take (`take.ts:5-20`) records every key with pitch, velocity, time, length and the note it played (-1 for a wrong key), the last three runs of each piece.

**Design.**

- *Data.* `Judge` gains `strays: { p: number; t: number }[]`; `stray(p, t)` pushes to it (the press already has `t`, `judge.ts:139`). It lives on the judge, so `rescore()` clears it exactly when it clears misses, per loop pass included, and nowhere else. No new store: the run just played is in memory, and a run played earlier is in its take.
- *Drawing.* In `build()`, after the miss flags, draw each stray inside the window as a mark at `place(p, t)` (`staff.ts:454`, the same placement the ghost and the Ghost-of-last-run dots use): a hollow notehead drawn like the ghost (dashed Paper Ink, ledger lines and accidental as needed) with the existing cross through it, in `--paper-miss`, `class="stray"`. It differs from a missed note by shape and place: a missed note is a written head with a cross under it; a wrong key is an unwritten, dashed head at the pitch you played, at the moment you played it. Position carries both facts: how high is what you played, how far left or right of the written note is how early or late.
- *Direction on hits.* `shape()` takes the offset and moves the shape 5 units left of the head's centre for early, 5 right for late (the Late ▹ is always right). Size is in the shape already (● within 80 ms, ▲ within 125 ms, ▹ up to a beat late, all scaled by tempo and Strictness). Milliseconds are in the tap popover and the Mark list, never on the paper.
- *Bandwidth.* After the run, ● (Great, inside the tolerance) is hidden; ▲, ▹, misses and wrong keys stay. Nothing on a note means it was fine. A "Show all timing" switch in the review puts the ● back. During the run nothing changes: the live marks keep their fade schedule.
- *The review surface is the staff itself.* The results card covers the falling-notes pane only (it means nothing once the run is over); the staff pane above it stays live. If the staff pane is under 40% of the room (the divider, `app/stage.ts:94`, `PANE.def` 0.4), the card opens with the divider at 0.45 and puts it back on Again. In Falling-only view the card opens with Both. A Review button (or tapping the paper) folds the card to a thin bar and fits the staff (the existing Fit) so every mark of a short piece shows at once; for a long piece the Mark list steps through the window.
- *Tap a mark* (hit area: the whole chord column of that bar, 44 pt or more): a popover, text only. "Bar 7, beat 2, right hand. Played E4 where F4 is written, about 0.2 s early." / "Bar 9, beat 1: 48 ms late." with Loop this bar at 70% and Hear this bar. Escape closes; `aria-expanded` on the column.
- *Mark list* (a disclosure under the paper, built from the same array that draws the marks): one sentence per mark in reading order, each a button that selects its column. VoiceOver reads this, not the SVG. The paper's accessible description is one summary sentence: "Two wrong keys in bars 7 and 12, one missed note in bar 12, three notes late in bar 9."
- *Pure core.* `marksOf(judge, song)` returns `{ kind: 'wrong' | 'miss' | 'early' | 'late'; bar; beat; hand; p; written?; ms }[]` (a wrong key names the nearest written note of its hand within a beat as `written`). It feeds the paper, the popover, the list and the summary, and is the unit-tested part.

**Wireframe: the annotated-score review (iPad landscape, 1180 x 820).**

```
+----------------------------------------------------------------------------------------+
| <  Minuet in G                                    Review    mark 3 of 6      [ Done ]   |
+----------------------------------------------------------------------------------------+
|  PAPER (Fit: the whole piece, marks on)                                                |
|   1        2        3        4        5        6        7          8                   |
|  =|=======|=======|=======|=======|=======|=======|========|========|==                |
|    o  o o   o  o     o o o  o   o   o o o   o  o   o  (x)  o    o  o                   |
|                 ▲>                            <▲     ¦E     ▹                          |
|  =|=======|=======|=======|=======|=======|=======|========|========|==                |
|    o     o   o      o   o   o     o    o     o    o     x    o                          |
|                                                         ^ missed                       |
|              +-------------------------------------------+                             |
|              | Bar 7, beat 2, right hand                 |                             |
|              | Played E4 where F4 is written, 0.2 s early|                             |
|              | [ Loop this bar at 70% ]  [ Hear it ]     |                             |
|              +-------------------------------------------+                             |
+----------------------------------------------------------------------------------------+
|  [ < Previous ]  [ Next > ]     Mark list v      [ ] Show all timing                    |
|  (x) wrong key at the pitch played   x missed   ▲ left: early   ▲ right: late           |
+----------------------------------------------------------------------------------------+
```

**Evidence.** Terminal summary feedback after a set of trials retains better than every-trial feedback (Schmidt et al. 1989, EXP, unv; the guidance hypothesis, Salmoni et al. 1984, REV; Winstein and Schmidt 1990, EXP). Bandwidth feedback, given only outside a tolerance, stabilises performance (Lee and Carnahan 1990, EXP, simple tasks). Real-time visual timing feedback hurt timing in the one close music study (Sadakata et al. 2008, 2011, EXP, small), so nothing new appears during the run. External focus wording (the note, the bar) over the hand (Chua et al. 2021, MA, contested by a bias-corrected reanalysis). Shape and position, never hue alone (WCAG 1.4.1 and 1.4.11; DESIGN "Word and Shape Rule"). Products that keep marks on the score are the education tools (Sight Reading Factory's glyphs ✗ ∅ ↔, SmartMusic and Noteflight noteheads, IND) and Piano Marvel's red and green after play (IND); none encodes direction, and SmartMusic folds early and late into one colour. No study tests persistent error marks on notation (gap, so measure: section 7).

**Builds on.** `judge.ts:139-158, 206-210`; `game.ts:217-224, 484-488`; `app/play.ts:193-197`; `staff.ts:371-380, 454-463, 465-475, 545-567`; `style.css:1216, 1266-1280, 1775-1783`; `app/stage.ts:94-110`; `take.ts:5-20` for runs played earlier (phase 4).

### 2.2 A results screen that is useful and graded properly

**What exists.** One song card for Perform and Learn (`ui-results.ts:47-108`, wired in `app/results.ts:30-116`): an 88 px figure (Perform `accuracy`, Learn `first time right`), a headline (`Piece complete`, `Run complete`, `Clean`, `Not clean yet`), a facts line (missed, wrong, most in a row, spread, touch in range, held), the lean line, coach lines, a Details disclosure, then the footer: the pace step as primary when there is one (`pace.ts:43-51`), Again, More, Back to the page. Known gaps it should close: "Not clean yet does not say why" (ROADMAP Known gaps), UX-9 and UX-12 (Learn and Perform results contradict or repeat the figure), UX-14 (four footers).

**Design: order of the card, top to bottom.**

1. **Headline sentence** (Newsreader, the existing h2 slot): what happened, in task words, never "wrong", "fail" or "error" as the headline. The figure top right shows a count, not a percentage (decision 1).
2. **What went right, one line**, only when true: "Bars 1 to 6 and 9 to 11 had no slips." (feedback after good trials, Chiviacowsky and Wulf 2007, EXP, small).
3. **The lines, one per thing measured**, each with "counts" or "not counted yet" at its right in Ink Faint (section 3 says which count at which level):
   - Notes: right keys, wrong keys, missed, with the bars.
   - Time (Perform, paced runs; absent when the song waited, with "The song waited, so time is not measured."): on the beat out of hit, the lean and the steadiness apart.
   - Holds (when graded), Touch (when measured).
4. **One to three coaching points**, each with its own button, by fixed priority: the bars with most slips (Loop bars 7 to 8 at 70%); then timing, lean first if it dominates ("About 30 ms late on most notes. If it felt on the beat, check Delay." with Open Delay); then holds or touch if they are the worst counted line. A clean run gets none.
5. **Review on the score**: the Review button and the Mark list (2.1).
6. **Details** (unchanged): counts with glyphs, the timing histogram, touch and evenness charts.
7. **Footer** (2.3): Continue, Again, More, Back.

**Wording samples.**

| Run | Headline | Figure |
|---|---|---|
| Perform, clean at 70% | Clean at 70% tempo. | 48 of 48 · notes right |
| Perform, notes clean, time loose | Notes clean; the time slipped in bars 9 to 12. | 48 of 48 · notes right |
| Perform, slips | Not clean yet: three slips in bars 7 and 8. | 45 of 48 · notes right |
| Learn, waited | Clean, with the song waiting. | 44 of 48 · right first time |
| Level 1, time counted loosely | Clean. Time counts loosely at your level. | 48 of 48 · notes right |

Lines (Perform, Path level 2):

```
Notes   46 of 48 right · 1 wrong key (bar 7) · 1 missed (bar 12)                 counts
Time    41 of 46 on the beat · about 18 ms late on average, steady within ±24 ms counts
Touch   even on 20 of 24 notes                                          not counted yet
```

**Wireframe: the results card (iPad landscape, staff pane kept above).**

```
+----------------------------------------------------------------------------------------+
| Minuet in G                                                                  Settings  |
+----------------------------------------------------------------------------------------+
|  PAPER (the run's marks on it, live; tap a mark)                                       |
|   5        6        7          8        9        10       11       12                  |
|  =|=======|=======|==(x)E=====|=======|=======|========|========|==x=====               |
|    o o o   o  o      o  o  o    o   o   o ▲> o  o  o    o o o    o  o                  |
|  =|=======|=======|===========|=======|=======|========|========|========               |
|  bar strip  [_][_][_][_][_][_][##][_][#][_][_][##]                                     |
+----------------------------------------------------------------------------------------+
|  Not clean yet: three slips in bars 7 and 8.                          45 of 48         |
|  Bars 1 to 6 and 9 to 11 had no slips.                                notes right      |
|                                                                                        |
|  Notes  45 of 48 right · 2 wrong keys (bar 7) · 1 missed (bar 8)             counts    |
|  Time   40 of 45 on the beat · 18 ms late on average, steady ±24 ms          counts    |
|  Touch  even on 20 of 24                                            not counted yet    |
|                                                                                        |
|  1  Bars 7 and 8 had 3 of the 3 slips. Bar 7: E played where F is written.             |
|                                                       [ Loop bars 7 to 8 at 70% ]      |
|  [ Review on the score ]   Mark list v                Details v                         |
|                                                                                        |
|  [ Continue ]  Bars 7 to 8 at 70%           [ ↻ Again ]  [ ⋯ ]          Back to Songs  |
+----------------------------------------------------------------------------------------+
```

**Evidence.** Feedback that keeps attention on the task helps and feedback that draws it to the self can hurt; more than a third of feedback interventions lowered performance (Kluger and DeNisi 1996, MA). Information content moderates the benefit (Wisniewski, Zierer and Hattie 2020, MA). Task comments beat grades, and grades plus comments did no better than grades alone (Butler 1987, 1988, EXP, children; one failed replication). Task, process and self-regulation feedback help, praise of the person does not (Hattie and Timperley 2007, REV). Lean is a property of the person and the chain, not an error: people tap tens of ms ahead of a beat (negative mean asynchrony, Repp and Su 2013, REV), and osu!'s Unstable Rate grades steadiness apart from the size of the errors (IND). Errors framed as information transfer better (Keith and Frese 2008, MA, workplace tasks). The last thing on the screen should be the next step (peak-end, Fredrickson and Kahneman 1993, EXP, for affective episodes; INF for practice).

**Builds on.** `ui-results.ts:47-108` (the card; `timingLine`, `coachLines`, `evenBlock`, `touchBlock` stay), `app/results.ts:30-116`, `pace.ts:43-51`, `util.ts` `worstBars`, `coach.ts` `timing` (bias and spread already apart), the bar strip of the read-through summary (`readthrough.ts:90`), `take-ui.ts` (Listen back, Compare stay in More).

### 2.3 Continue instead of Again and Back

**Design.** The footer, every results card (song, scale, technique, read-through, Memorise, drill set, Sight run, Theory session):

- **Continue** (the one lamp), with the destination beside it in words: "Continue · Read: Bass landmarks, 12 cards due". The destination is `nextUp({ after })` (section 4).
- **Again**, as the icon-only restart (a universal verb, DESIGN "Icons, Apple's way"), so one more pass is still one tap.
- **More** (⋯): Listen back, Compare with last time, Try it from memory, and the pace step when Continue is not it ("Try 75% tempo", "Try it without waiting").
- **Back to <place>** as the ghost at the right. It stays because the bar's back button is hidden while a results card shows (DESIGN "Results cards"): without it the only way out is Continue, which is a gate.

What Continue picks after a run (the first that applies):

1. The run was not clean and its worst bars exist: the loop, "Bars 7 to 8 at 70%" (Duke, Simmons and Cash 2009: stop, isolate, slow, repeat; the existing `nextStep` loop). After three loop offers on the same piece in a day without a clean pass, move on (a new rule: `after.offers` in 4.1; Auto tempo in `pace.ts:6-30` already slows a messy loop, but nothing yet says when to leave it).
2. The day's plan has an unticked row: that row, re-picked from the stores as they are now (so a stage that just went solid is not offered again).
3. Otherwise the day-done cascade (section 4): due review, then the strand furthest behind, then the Path's next requirement, then a piece.

A clean run therefore moves on rather than climbing the tempo ladder at once; the pace step waits in More and in the piece's Today row next time (spacing: Cepeda et al. 2006, MA; distributed practice for keyboard sequences, Simmons 2011, EXP, unv). Decision 6 holds the alternative.

**Evidence.** IND only: Rocksmith+ added Up Next to its results screen; Duolingo and Yousician end on one forward button. Its rationale (a named next step lowers the cost of deciding) is INF. No autoplay countdown, which is pressure (Rocksmith has one; not taken). Log taps on Continue, Again and Back (section 7).

**Builds on.** `app/results.ts:83-116` (the `#next` slot and its handler), `pace.ts:43-51`, `drill.ts:246` `nextStage` (the drill card's Next stage), `readthrough.ts:30` `pickPiece` (Next piece), the launchers `startReq` (`app/today.ts:132`), `openById`, `fixBars`, `readThrough`, `startRun`. Layering: `results` sits below `today` (DESIGN "Code structure", `app/state.ts` hooks), so Continue calls `hooks.next(after)`, which `today` provides; no module moves. The e2e greps `#next`, `#again` and `#toLib` (`scripts/e2e/run.mjs:343, 407, 906`): keep the ids.

### 2.4 Today always shows the next lesson

**What exists.** `showToday` (`app/today.ts:28-81`) gathers the last piece, the Read focus stage, the next technique recipe, a piece due, the last piece's worst bars, a second due stage, the next scale stage and card, Theory due, the Path's next requirement, a read-through pick and a Sight run row; `planOf` (`plan.ts:20-35`) fills slot templates with the first alternative that exists; the first undone row gets the lamp. When every row is ticked the page ends in silence (UX-25), and on day 1 three surfaces point three ways (UX-6).

**Design.**

- The lamp row is always `nextUp()`. While the plan has undone rows, that is the first of them (no change from today). When the plan is done, the plan collapses to one line, "Today's plan is done. 23 minutes.", with a ghost "Make it 20 min", and the lamp row under it reads "Up next: Bass landmarks · 12 cards due" from the day-done cascade. There is never a Today with no lamp.
- During the first week, `nextUp()` returns the Start here card's undone step for today, which then carries the lamp; the plan's rows are ghost until it is done (UX-6's proposed fix, through the one function rather than a special case). Later Start here steps get a ghost Start (UX-25's second half; nothing locked).
- Every row keeps its reason line ("12 cards due", "Next on your Path, level 2", "Bars 7 to 8 slipped last time").

**Evidence.** One recommended session as a default, never a gate (Melodics Weekly Goals, Yousician Continue Learning, IND; `products-and-ux.md`). Defaults steer strongly and a given reason supports autonomy (Johnson and Goldstein 2003, EXP, memory; Deci, Koestner and Ryan 1999, MA). "A daily generated session must adapt or it feels random" (`products-and-ux.md`, PRAC): the reason line is the guard.

**Builds on.** `app/today.ts:28-81` (the gather becomes `snapshot()`), `plan.ts:11-35`, `ui.ts` `todayView` (plan rows, the lamp rule), `guide.ts` (the first-week steps).

### 2.5 One "Start" per section that meets the player where they are

**Design.** Each page head gets one lamp, "Start", with the unit and its reason, from `nextUp({ strand })`. Tables and lists below keep their Next tags.

| Page | Start picks | Exists | Gap to fill |
|---|---|---|---|
| Read | due stage first, else the first stage not solid (`focus`, `drill.ts:208`) | yes, as a row tag | the head button |
| Sight run | the last run's spec at the tempo its history suggests (`paced.ts:30` `suggest`), else the default | yes, on Today | the head button |
| Scales | the next card of the first stage not solid (`scales.ts:246-248`) | yes, "Up next" | the head button |
| Technique | first due recipe, else first not solid (`syllabus.ts:82` `nextRecipe`) | listed | the chooser starts settings, not this |
| Theory | the trainer and level with most due (`plan.ts:37` `theoryDue`), else the Path's theory requirement, else the first unstarted trainer at level 1 | Today only | store the trainer levels (in memory only today, `app/theory-ui.ts:28`) |
| Songs | the piece in play (opened in the last 10 days, not Ready): its next step (the worst bars, the tempo step, Read through, a Memorise stage); else the ladder's next piece at the player's level; else `pickPiece` | lamp on the last row | it names the last piece, not a step in it |

"Meets you where you are" is already true of each picker: they read the player's own stats. What phase 4 adds is the drop-back and plateau rules (section 4).

**Evidence.** No product found shows a per-section recommendation in a multi-section app; they have one global button (IND, so this is ahead of the field and should be measured). Blocking a new unit's first cards, then mixing, follows contextual interference (Brady 2004, MA; Stambaugh 2011, EXP, clarinet, mixed in brass).

### 2.6 Recommendations that grow smarter with the record

**Design.** Three steps, each waiting for the data it needs (section 4): a log that names what was practised (phase 1), rules on that log (phase 4), a learner model fitted to it (phase 5). Every recommendation keeps its reason, and the log keeps which rule chose it, so a rule that picks badly can be found and changed.

**Evidence.** Elo-style learner models are simple, robust and online and suit tiny data (Pelánek 2016, REV; Klinkenberg et al. 2011, Math Garden, OBS at scale); with one learner, unit difficulty must be fixed from the curriculum and only ability learned (INF). Logistic models on success and failure counts are the growth path once there are hundreds of attempts (Pavlik et al. 2009; Gervet et al. 2020, MA of models). BKT, deep knowledge tracing and FSRS need many learners or thousands of reviews (REV). Knowledge-space "outer fringe" (ALEKS, IND at scale) is the idea for the frontier: units whose prerequisites are mastered.

---

## 3. The grading model

### 3.1 What a run is judged on

Four things are measured; each is shown on its own line, none is averaged into another.

| Line | Measured as | Exists |
|---|---|---|
| Notes | right keys, wrong keys, missed notes, by bar; in Learn, right first time | `Result.counts`, `wrong`, `first`, `heat` |
| Time | share of hits inside the Great window; lean (signed mean) and steadiness (spread) apart | `counts`, `offs`, `timing` (`coach.ts:27-33`) |
| Holds | share of held notes released on time | `holds` (graded by Strictness) |
| Touch | evenness against neighbours; velocity targets hit | `even`, `touchPct` |

A run **counts** (toward Ready, the review boxes, a scale's three in a row, a technique good run, a read-through) when every line that counts at the player's level passes. That is a conjunctive rule: a strong line cannot buy back a weak one, which repairs the known weakness of a weighted sum (the OECD/JRC composite handbook calls a linear sum compensatory; 2-grading's "pitch ceiling" patches the same hole). The pass lines themselves are the thresholds the app already uses (3.3), so nothing that counted yesterday stops counting because of this design, except through the precision fix (3.4).

### 3.2 What counts at each level: the standard rises, the criteria stay

The level is the Path level, `nextOf(path(ctx))?.level` (`grades.ts:159-168`), 1 to 5; past the last requirement it is 5. Strictness and Touch coach gain **Auto** (the new default), which maps the level onto the settings that already exist; a player who picks a value keeps it.

| Path level | Notes | Time: windows (Perfect / Great / Good ms at full tempo) | Holds | Touch | Shown as |
|---|---|---|---|---|---|
| 1 | counts: no missed note, at most one wrong key | counts loosely: Strictness Easy, ×1.3: 58 / 104 / 163 | not graded | measured, never counts | Notes counts, Time counts loosely, Touch not counted yet |
| 2 | counts | Standard, ×1: 45 / 80 / 125 | lenient | counts on scales and technique, Coach gentle (±12 of 127) | |
| 3 | counts | Standard | lenient | scales and technique, gentle | |
| 4 | counts | Standard | lenient | scales and technique, Coach steady (±8) | |
| 5 | counts | Strict, ×0.75: 34 / 60 / 94 | strict | scales and technique, Coach strict (±5) | |

Touch never counts on a song, at any level: velocity feedback has no controlled evidence (`learning-science.md`), and expert raters agree least on dynamics and legato (NeuroPiano, about 50% agreement within two points, OBS). The follow-the-score lines stay advice.

Why this shape and not 2-grading's weight table (Pitch 55 / Timing 25 / Continuity 20 at beginner, moving to 25 / 25 / 10 / 20 / 10 / 10):

- No board or study ties weights to a learner's level; a 2024 review of 26 assessment systems calls stage-specific criteria the gap (MA). Boards keep pitch, time and the rest at every grade and raise the bar through the pieces (ABRSM, Trinity, RCM, PRAC). The defensible lever is the standard, not the weights, and the app already has it as Strictness and Touch coach.
- "Right keys first" is honoured: at level 1 notes are the strict gate, time a wide one, holds and touch off. The weights table would also do that, but as a number the player cannot see into.
- Continuity, 2-grading's third dimension, is not a separate line: in Perform the music never stops, so a breakdown shows as a run of misses in Notes and in the bar strip, and the coaching point names it ("Bars 9 and 10: the run broke there, 7 notes missed in a row"). The read-through already reports slipped bars.

Windows that scale with the beat for slow pieces (timing discrimination is proportional above about 250 ms, Repp, REV, second-hand) are filed for phase 5, tuned from the log's offset histograms.

### 3.3 Every existing threshold, and what happens to it

| Where | Rule today | After |
|---|---|---|
| Ready and review boxes, `app/results.ts:49-55` | Perform: `acc >= 0.9 && clean`, Learn: `clean && !wait`; `rate >= 0.9`; not a part or a Notes shown level | unchanged rule; `acc` now includes wrong keys (3.4) and the windows follow Auto |
| Best on a piece, `store.ts:166-170`, shown on Today `app/today.ts:49` and Songs | highest `acc` of Perform runs | unchanged; new runs are at most a few points lower where they had wrong keys, so an old Best may stand longer (said in the change note) |
| Scale pass, `scales.ts:253` | `clean && acc >= 0.85 && even.rating !== 'uneven'` | the evenness term applies from level 2 (at level 1 it is shown, not counted) |
| Technique good run, `syllabus.ts:60-66` | `acc >= 0.85` and touch in range `>= 0.7` when targeted | unchanged; the precision fix closes the hole that let a run with many wrong keys count (this rule has no `clean`) |
| Read-through, `app/readthrough-ui.ts:87` | `acc >= 0.9 && clean && rate >= 0.9` | unchanged |
| Loop pass clean and Auto tempo, `game.ts:386`, `pace.ts:7-30` | no misses, at most one wrong key | unchanged |
| Reading mastery, `drill.ts:224-243` | per card `clean >= 0.85`, `rt <= goal`, `n >= need` | unchanged (a card is already not clean after any wrong key) |
| Paced run tempo, `paced.ts:77` | share on the beat `>= 0.9` twice up, `< 0.6` twice down | unchanged |
| History, Over time, take, weekly recap, teacher summary | `acc` as logged | unchanged meaning plus the fix; the Over time line may step down by a few points where wrong keys were common; old rows are not rewritten |
| The live line `say('Finished. N percent accuracy.')`, `app/results.ts:95` | | follows the headline sentence |

### 3.4 The wrong-key precision bug, and its fix

`accuracy = weightSum / judged` (`judge.ts:89-91`), where `judged` counts hits and misses only; a wrong key (`stray`, `judge.ts:206`) adds nothing to either. Pressing every key near each note therefore scores as well as playing carefully, and the technique rule, which has no `clean` test, counts such a run. In Learn the hero is `first`, which already loses a note to any wrong key before it, so the hole is Perform's.

Fix, in the judge, where every caller routes through:

```ts
get accuracy() {
  return this.judged ? this.weightSum / (this.judged + this.extra) : 1
}
```

`extra` counts a wrong key as one more judged note worth 0, as a miss is, **except** when a written note of the same pitch lies within a beat (capped at `LATE_CAP`) of it: that key was the note, struck too early or too late, and its note is already charged as a miss or a late hit, so a slip is not counted twice. `wrong` is unchanged, so `clean` (at most one wrong key) is unchanged. Wait mode still returns 1 while nothing is judged.

Effect on the rules that also need `clean`: at most one extra key, so `acc` moves by at most 1/(n+1), about 2 points on a 48-note piece. That is the bug being fixed, not a regression: a run with a wrong key was less accurate than it said. Tests to update: `judge.test.ts:26, 73, 232` expect `{ k: 'wrong', p }` with no `t`.

Full weight rather than 2-grading's half: a wrong key in a piece sounds as loud as a right one, and the same-pitch exception already spares the beginner who reaches a note slightly off its time. Decision 4 holds the alternative.

---

## 4. The learner model and the recommender

### 4.1 One function

```ts
// src/next.ts, loaded lazily (boot is 221 833 of 223 000 bytes, src/bundle.test.ts:9). Pure: no store, no DOM.
export type Strand = 'read' | 'run' | 'scale' | 'tech' | 'theory' | 'piece'
export interface Unit {
  id: string           // 'read:t-land', 'scale:<card>@60', 'tech:<recipe>', 'theory:chords:2', 'song:<id>', 'run'
  strand: Strand
  name: string
  why: string          // the reason line, always shown
  go: Go               // grades.ts Start plus { piece, mode, loop? } | { readthrough } | { run }
  state: 'new' | 'learning' | 'solid' | 'due'
  due?: number         // cards or items due
  level: number        // Path level of the unit
}
export interface Snap {
  day: number
  units: Unit[]                         // what Today already gathers, as units
  plan: { key: string; unit?: Unit; done: boolean }[]
  guide?: Unit                          // the first week's undone step for today
  piece?: Unit                          // the piece in play
  log: Row[]                            // section 4.2
  after?: { id: string; counted: boolean; fix?: Unit; offers: number }
}
export function nextUp(s: Snap, strand?: Strand): Unit
```

The cascade (the first that yields a unit wins; `strand` filters every step):

1. `after` not counted, with a fix, offered fewer than three times today: the fix.
2. The first week: `guide`.
3. The plan's first undone row, re-picked.
4. Due review: the unit with most due.
5. Drop back (phase 4): a unit under 70% in its last two sessions: its previous stage or easier variant.
6. Consolidate: a unit in `learning`, in the strand whose Path level is lowest (the strand furthest behind; phase 5 replaces this with Elo ability).
7. Frontier: the Path's next requirement (`nextOf`).
8. Maintenance: the solid unit seen longest ago.
9. The piece: `piece`, else the ladder's next, else `pickPiece`.

It never returns nothing: step 9 always has a piece (the starters ship with the app). Ponytail note: a cascade, not a weighted score; 3-curriculum's score (fit to 85%, urgency, gap, lag, variety) is the upgrade when the log shows the cascade's ties going badly.

**Wiring.** `app/today.ts` turns its gather into `snapshot()` and provides `hooks.next(after?, strand?)`; Today's lamp, each page head and Continue call it. `PATH_STEP` (`app/today.ts:40`) stays the one place that ticks the Path from a plan step, so nothing is counted twice. Add `src/next` to the lazy list in `src/bundle.test.ts`.

### 4.2 The log it needs

Two records, both on the device only, both in the export, both cleared by Clear all data.

**Session rows**: the existing `history:log` (`store.ts:276-291`), one row per results card of every kind, with new fields:

```ts
interface HistoryEntry {            // existing: ts, kind, label, acc, ms?, even?, bias?
  id?: string                       // NEW: the unit id (4.1); the label stays for display
  notes?: number                    // NEW: notes line, 0..1 (right over written plus extra; Learn: first)
  ok?: boolean                      // NEW: the run counted (3.1)
  lv?: number                       // NEW: Path level when played (the standard it was judged at)
  as?: 1                            // NEW: assisted (waited, names shown, Notes shown level, a part only)
  rate?: number                     // NEW: tempo
  then?: 'c' | 'a' | 'b' | 'o'      // NEW: what followed: Continue, Again, Back, other (edited onto the row)
}
```

Learn runs are logged too, with `as: 1`; the Over time charts skip assisted rows, so they keep their meaning. Cap: `HISTORY_KEEP` 600 → 3000 (about 300 KB). Merge: `byTs`, as now (`backup.ts:86`).

**Card rows**: a new key `log:cards`, for reading drill cards, unpaced Sight run cards and Theory cards:

```ts
type CardRow = { ts: number; k: string; y: 0 | 1; rt: number }   // k: the card key as drill.ts and theory-ui use it
```

Cap 20 000 rows (about 1 MB, about 100 days at 200 cards a day); oldest dropped first (`ponytail:` ring, compact old rows to per-unit daily sums if a fit needs more than 100 days). Export: a new `FIELDS` row in `backup.ts:77-87` (`['attempts', 'log:cards', 'array', (a, b) => byTs(a, b).slice(-CARD_KEEP)]`) and its getter in `exportAll`; clear: add `log` to the `clearAll` prefixes (`store.ts:234`). Written through `edit()` (`serial`, Web Locks), batched once per set, not per card. Why now and not in phase 5: the stats keep only moving averages (`drill.ts:92-101`), so a model fitted later has nothing to fit unless rows were kept from the start.

### 4.3 Cold start

- **A new player** gets the curriculum's own order: the first week's steps, then each strand's first stage, then the Path. That is what a teacher does and it needs no data. One first step on day 1 (2.4, UX-6).
- **Placement** (phase 5, decision 9): a 60 to 90 second staircase per clef, four cards at a stage, three of four within twice the goal time jumps three stages, a miss steps back two, stopping when the bracket is one stage wide; stages below are marked "inferred" and come up as three-card spot checks before they count as solid. ALEKS and Piano Marvel's choose-a-start-then-adapt are the precedents (IND).
- **The owner, with history and no log**: phases 1 to 4 read the existing stats, so nothing waits; the log starts filling on the day phase 1 ships, and no past rows are invented.

### 4.4 How it grows

| Log | What turns on | Checked by |
|---|---|---|
| 0 to 2 weeks | the cascade over the existing pickers | the unit tests, and the owner using it |
| 2 to 3 weeks (phase 4) | drop back (two sessions under 70%, `learning-science.md` §5), plateau (five sessions on a unit with no gain in first-try share or `rt`: say so, change the task: shrink the loop, change the key, add a rhythm pre-drill, `learning-science.md` §7), strand lag | rules unit-tested on synthetic logs; count how often each fires |
| about 50 sessions a strand (phase 5) | Elo ability per strand against a difficulty fixed from the Path level and the chain position; candidates chosen nearest an 85% predicted first-try rate, inside 75 to 92% | prequential: each prediction scored against the next outcome; calibration plot in a test |
| 500+ card rows a strand | a forgetting multiplier fitted to recall at the observed gaps; per-unit difficulty offsets, shrunk to the prior | adopt a change only if it predicts the most recent fifth of the log better |

The 85% target is a theoretical result for gradient-descent learners (Wilson et al. 2019, theory and simulation), not a tested human rule; Math Garden samples at about 75% (OBS). The band, and time spent above and below it, is what to log. A toy simulation of the Elo update (3-curriculum, 40 units, one static learner) reached the true ability within 0.1 to 0.3 logits in about 200 attempts at step 0.3 and held success near 82 to 84%; it does not model learning or forgetting, so it shows only that the update converges.

---

## 5. Build plan

Pace, from the history: 485 commits on 7 working days since 18 Oct; a multi-part feature (the recorder with Listen back, Compare and the Ghost; Memorise; Read through) landed as one agent branch in two to four hours, and a five-agent design round (Urtext) in one overnight session. A phase below is one such session, plus the owner's look on the iPad, which has been the slower step (ROADMAP Next 1). Estimates are build time; calendar time is set by device checks.

| Phase | Builds | Estimate | Tests it leaves | Needs |
|---|---|---|---|---|
| **1. Honest grade, marks that stay** | precision fix (3.4); `strays` with `t`; wrong-key marks and direction offsets in `build()`; Great hidden after the run; the card off the staff pane, Review (Fit) and the Mark list; `marksOf`; headline sentence and the three lines; history row fields and `log:cards` with export, merge and clear | one session (3 to 4 h), about 300 lines across `judge.ts`, `game.ts`, `staff.ts`, `ui-results.ts`, `app/results.ts`, `store.ts`, `backup.ts`, CSS | `judge.test`: a mashed run scores lower, a same-pitch late key is not counted twice, wait mode stays 1; `marksOf` unit test (kinds, bars, written note); `ui-results.test` new strings; `backup` round trip with `log:cards`; e2e: after a run with a deliberate wrong key, `.stray` is on the staff and `#res` does not cover `#staff` | nothing; boot may grow about 300 bytes (`judge`, `game`, `store` are boot), inside the 1.2 kB margin |
| **2. One what-next** | `src/next.ts`; `snapshot()` and `hooks.next`; Continue on every card with `then` logged; Today's lamp always present, plan-done line, first-week lamp | one session (3 h), about 200 lines | `next.test`: each cascade step, strand filter, never empty on an empty profile, the fix offered at most three times; `bundle.test` lazy list; e2e: Continue on the song card opens the plan's next row; a finished plan still shows a lamp | phase 1's `id` on rows |
| **3. The level sets the standard; section starts** | Strictness and Touch coach Auto; scale evenness from level 2; the "counts / not counted yet" labels; page-head Start on Read, Sight run, Scales, Technique, Theory, Songs; Theory levels stored | one session (2 to 3 h) | settings test for the Auto map by level; `scales.test` pass rule by level; e2e: each page head's Start opens something | phase 2 |
| **4. Adapting from the record** | drop back, plateau and lag rules in `next.ts`; "bar 7: late in 4 of the last 5 runs" in the review from the three takes | one to two sessions | rule tests on synthetic logs; a 30-day synthetic learner that learns and forgets, asserting success stays in 75 to 92%, no unit is offered with an unmet prerequisite, and `nextUp` never returns nothing | two to three weeks of log for the rules to bite (they can ship before) |
| **5. Learner model and placement** | Elo per strand, difficulty priors, 85% choice; placement staircase; beat-scaled windows tuned from offset histograms; replay harness over the exported log | two sessions | Elo convergence test (port of the toy simulation); placement brackets a synthetic reader within one stage; replay: log loss on the latest fifth | about 50 sessions a strand; decision 9 |

Each phase gets its `docs/changes/` note, DESIGN.md updates (Results card, Score marks, Plan row, page heads) and the `/impeccable critique` and `polish` pass before it is called done.

---

## 6. Decisions for the owner

Answer by number. Each has a recommended answer and the alternative.

1. **The big figure on the results card.** Recommended: a count, "45 of 48" with "notes right" (Learn: "right first time"), and the percentage only in Details and the Over time chart. Alternative: keep the 88 px percentage.
2. **One blended grade or separate lines.** Recommended: separate Notes, Time, Holds and Touch lines, each marked "counts" or "not counted yet" at your level, and a run counts only when every counted line passes. Alternative: one weighted percentage (pitch 55, timing 25, continuity 20 at the start, shifting with level) as the headline.
3. **Who sets the strictness.** Recommended: Strictness and Touch coach default to Auto, following your Path level (wide windows and no hold or evenness grading at level 1, Strict at level 5); any value you pick stays. Alternative: keep them manual and show a one-line suggestion.
4. **What a wrong key costs.** Recommended: the same as a missed note, except a key of the right pitch within a beat of its note (that is the note, early or late). Alternative: half a missed note.
5. **Evenness for beginners.** Recommended: at level 1 an uneven scale still counts (shown, not counted); from level 2 it counts on scales and technique; it never counts on songs. Alternative: keep today's rule, where an uneven scale run never counts.
6. **Continue after a clean run.** Recommended: move on to the day's next thing; the tempo step ("Try 75% tempo") goes to More and to the piece's row next time. After a run that was not clean, Continue is the loop. Alternative: Continue climbs the tempo ladder in the same piece first.
7. **Again and Back.** Recommended: keep both, quieter: Again as the restart icon, Back to Songs as the ghost at the right (without it a results card has no way out but Continue). Alternative: Continue only, with Again and Back in More.
8. **The first run (UX-6) and a finished day (UX-25).** Recommended: in the first week the Start here step takes the lamp and the plan rows go ghost until it is done; when the plan is done Today says so and shows "Up next" with the lamp. Alternative: keep the lamp on the plan and add only the closing line.
9. **Placement for new players.** Recommended: not yet; new players follow the curriculum's order, and a 60 to 90 second placement comes with the learner model in phase 5. Alternative: build it with phase 3.
10. **How early or late shows on a note.** Recommended: move the existing grade shape left (early) or right (late) of its note, milliseconds on tap; judge it on the iPad before it is locked. Alternative: a short barbed line beside the note, its length by milliseconds.

---

## 7. Risks, unknowns, and what to measure

**Risks.**

- *The level signal is coarse.* The Path level rises only when every requirement at a level is solid, so a good reader held at level 1 by a theory row gets Easy windows on songs. Auto shows its choice on the card ("Time counts loosely at your level") and Settings names the level; if it misfits, use the highest strand level instead (one line).
- *Silent standard changes.* Auto moving the windows on a level-up makes the same playing grade lower. The card says when the standard rose ("Your level moved to 2: time is judged on standard windows from now.") once.
- *Saved settings cannot tell a choice from the default.* Every saved profile holds `strict: 'standard'` and `coach: 'gentle'` (`settings.ts:58-59`), chosen or not. Phase 3 moves each to Auto once, says so in the change note, and a player who wants Standard picks it again.
- *Boot budget.* 221 833 of 223 000 bytes. Phase 1 adds to boot modules; if the margin runs out, move `scales.ts` (17 kB, the next candidate in `docs/changes/perf3.md`) behind `import()` before raising nothing.
- *History step.* Over time and Best read `acc`; the precision fix lowers runs with wrong keys by a few points from the day it ships. Said in the change note; old rows are not rewritten.
- *Mark clutter in dense music.* Shapes in dense treble systems can already touch neighbours (ROADMAP Next 11(c)). Hiding ● after the run helps; the offset shapes need the iPad check (decision 10).
- *A recommender that feels random* (`products-and-ux.md`): the reason line on every lamp, and Again and Back never removed.
- *The owner is the only tester.* Every tolerance here is tuned on one player and one keyboard; strangers will differ.

**Unknowns.**

- Level-dependent standards are a design choice with no validation in the literature (2024 review, MA): treat the table in 3.2 as a hypothesis.
- No study tests persistent error marks on notation, or a per-section recommendation; both are ahead of the products surveyed.
- The 85% target, the 70% drop-back line and the five-session plateau are theory or practitioner numbers.
- Whether moving on after a clean run beats climbing the tempo ladder at once has no direct test in music.
- Sources not opened at the primary text: current ABRSM and Trinity criteria, Shute 2008, Duke et al. 2009, Kulik et al. 1990, Simmons 2011, Friberg and Sundberg 1995.

**What to measure** (all local, all in the export, from the log fields in 4.2):

1. Continue, Again and Back taps after each kind of run (`then`). If Again dominates after clean runs, decision 6 was wrong.
2. Review and Mark list opens, mark taps and "Show all timing" per results card.
3. Share of card attempts inside 75 to 92% first try, per strand per week, and time spent above and below.
4. Days to Solid per Read stage before and after phase 4, and how often drop back and plateau fire and what follows.
5. How often the player starts something other than the lamp (overrides), per surface.
6. Lean and spread per week after calibration: if lean stays beyond the Great window, grade time around the player's own mean (osu!-style) rather than the beat.
7. A calibration check of the grading (2-grading's method): 20 to 30 runs the owner rates 1 to 7 as a teacher would; the counted verdict should agree within one band on 80% of them. If a blended number agrees better, decision 2 flips.

**What would change the main calls.**

- *No blended grade*: the calibration check above favouring a composite, or the owner finding the separate lines harder to read than one number after two weeks.
- *Standards, not weights*: a validated stage-specific rubric appearing, or the log showing that Easy windows let rhythm errors through that the owner hears.
- *Cascade, not model*: the cascade offering the same unit twice in a row or leaving a strand untouched for a week while it is behind, which the log will show.
- *Judge, not take, as the source of marks*: if marks are wanted on a run reopened from Songs in phase 1; the take already holds them, so phase 4's review covers it.

---

## 8. Sources

Grouped, deduplicated. Strength labels as at the top; (unv) read as an abstract or summary only.

**Feedback and motor learning**
- Kluger, A. N., and DeNisi, A. (1996). The effects of feedback interventions on performance. *Psychological Bulletin* 119(2). MA (unv). https://cris.huji.ac.il/en/publications/the-effects-of-feedback-interventions-on-performance-a-historical/
- Wisniewski, B., Zierer, K., and Hattie, J. (2020). The power of feedback revisited. *Frontiers in Psychology*. MA (unv). https://www.frontiersin.org/articles/10.3389/fpsyg.2019.03087/full
- Hattie, J., and Timperley, H. (2007). The power of feedback. *Review of Educational Research* 77(1). REV (unv, secondary). https://www.bera.ac.uk/blog/how-to-optimise-the-use-of-hattie-and-timperleys-feedback-levels-for-student-learning
- Butler, R. (1987, 1988). Task-involving and ego-involving properties of evaluation. EXP, children (unv). https://cris.huji.ac.il/en/publications/task-involving-and-ego-involving-properties-of-evaluation-effects/
- Shute, V. J. (2008). Focus on formative feedback. REV (text not read). https://www.ets.org/research/policy_research_reports/publications/report/2007/hslv.html
- Keith, N., and Frese, M. (2008). Effectiveness of error management training. MA, workplace (unv). https://fis.leuphana.de/en/publications/effectiveness-of-error-management-training-a-meta-analysis/
- Salmoni, Schmidt and Walter (1984); Winstein and Schmidt (1990): see `learning-science.md`. REV, EXP.
- Schmidt, Young, Swinnen and Shapiro (1989). Summary knowledge of results. EXP (unv). https://lirias.kuleuven.be/836415
- Lee, T. D., and Carnahan, H. (1990). Bandwidth knowledge of results. EXP, simple tasks (unv). https://vivo-cub.colorado.edu/display/pubid_105370
- Chiviacowsky, S., and Wulf, G. (2007). Feedback after good trials. EXP, small (unv). https://lida.sport-iat.de/ta/Record/4012854?lng=en
- Sigrist, R., et al. (2013). Augmented feedback in motor learning. REV (unv). https://www.doi.org/10.3758/S13423-012-0333-8
- Chua, L.-K., et al. (2021). External focus of attention. MA, contested by McKay et al. (preprint). https://pure.psu.edu/en/publications/superiority-of-external-attentional-focus-for-motor-performance-a/ ; https://sportrxiv.org/index.php/server/preprint/download/304/826
- Guadagnoli, M. A., and Lee, T. D. (2004). Challenge point framework. REV (unv). https://experts.mcmaster.ca/scholarly-works/1313883
- Sadakata, M., et al. (2008, 2011). Real-time visual feedback on rhythm and dynamics. EXP, small (unv). https://link.springer.com/article/10.1007/s00426-010-0291-6 ; https://eprints.whiterose.ac.uk/43005/
- Hamond, L., Welch, G., and Himonides, E. (2019). Visual feedback on a MIDI piano. OBS, six participants (unv). https://sysmus17.qmul.ac.uk/wp-content/uploads/2017/08/hamond_visual_feedback.pdf
- Repp, B. H., and Su, Y.-H. (2013). Sensorimotor synchronization. REV. https://doi.org/10.3758/s13423-012-0371-2
- Fredrickson, B., and Kahneman, D. (1993). Duration neglect (peak-end). EXP. https://bear.warrington.ufl.edu/brenner/mar7588/Papers/fredr-kahneman-jpsp1993.pdf

**Motivation**
- Deci, E. L., Koestner, R., and Ryan, R. M. (1999). Extrinsic rewards and intrinsic motivation. MA, contested. https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf
- Sisk, V. F., et al. (2018). Mindset and academic achievement. MA. https://englelab.gatech.edu/articles/2018/Sisk,%20Burgoyne%20et%20al.%20(2018)%20-%20Mindset%20and%20Academic%20Achievement.pdf

**Assessment and exam boards**
- ABRSM Piano Syllabus 2019-20, marking criteria pp. 40-43. PRAC (2021+ edition not re-read). https://www.lessonface.com/sites/default/files/teaching-materials/64893/piano_syllabus_2019_2020_complete.pdf
- Trinity College London, criteria card and mark split. PRAC. https://www.trinitycollege.com/resource?id=4767 ; https://blog.trinitycollege.co.uk/from-pass-to-distinction
- Royal Conservatory, Piano Syllabus 2022, pp. 118-119. PRAC. https://teacherportal.rcmusic.com/getattachment/57f3734d-97e5-4777-b67e-4b1111ee31a3/piano-syllabus-2022-edition.pdf
- AMEB grading descriptors. PRAC. https://www.uwa.edu.au/able/-/media/Faculties/FABLE/Docs/AMEB/Grading-Descriptors-Music.pdf
- Solo music performance assessment criteria, systematic review (2024). MA. https://pmc.ncbi.nlm.nih.gov/articles/PMC11496144/
- Thompson, S., and Williamon, A. (2003). Evaluating evaluation. OBS. https://researchonline.rcm.ac.uk/id/eprint/2170
- Zdzinski and Barnes (2002); Saunders and Holahan (1997). Rubric factors. OBS (unv). https://journals.sagepub.com/doi/abs/10.2307/3345801 ; https://journals.sagepub.com/doi/10.2307/3345585
- Sight-singing rater agreement (2018). OBS. https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2018.00837/full
- NeuroPiano (2024). Expert ratings of piano performance. OBS, preprint. https://arxiv.org/html/2410.03139v1
- Repp, B. H. (1996). The art of inaccuracy. OBS. https://labs.sonicfield.org/library/the-art-of-inaccuracy-why-pianists-errors-are-difficult-to-hear
- Palmer, C., and van de Sande, C. (1993). Units of knowledge in music performance. EXP. https://www.mcgill.ca/spl/files/spl/palmervds1993jep.pdf
- Lerch, A., et al. (2020). Music performance analysis survey. *TISMIR*. REV. https://doi.org/10.5334/tismir.53
- PercePiano (2024). Perceptual dimensions of piano performance. OBS. doi 10.1038/s41598-024-73810-0
- OECD/JRC (2008). Handbook on constructing composite indicators. REV. https://knowledge4policy.ec.europa.eu/sites/default/files/jrc47008_handbook_final.pdf
- Pike, P. D., and Carter, R. (2010). Pitch and rhythm drills before sight-reading, 43 beginning group-piano students. EXP, small. https://repository.lsu.edu/music_pubs/40
- Duke, R. A., Simmons, A. L., and Cash, C. D. (2009). Practice behaviour and retention. EXP, small (unv). https://www.musicmark.org.uk/news/8-things-top-practicers-do-differently/

**Curriculum, learner models, spacing**
- Pelánek, R. (2016). Elo rating in adaptive educational systems. REV. https://www.fi.muni.cz/~xpelanek/publications/CAE-elo.pdf
- Pelánek, R. (2017). Learner modelling overview. REV. https://www.fi.muni.cz/~xpelanek/publications/umuai-overview.pdf
- Klinkenberg, S., Straatemeier, M., and van der Maas, H. (2011). Math Garden. OBS at scale (unv). https://www.uva.nl/en/profile/k/l/s.klinkenberg/s.klinkenberg.html
- Pavlik, P., Cen, H., and Koedinger, K. (2009). Performance factors analysis. EXP (unv). https://digitalcommons.memphis.edu/facpubs/8350
- Gervet, T., et al. (2020). When is deep learning the best approach to knowledge tracing? MA of models. https://jedm.educationaldatamining.org/index.php/JEDM/article/download/451/123
- Corbett and Anderson (1995), BKT; Piech et al. (2015), DKT. REV. https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing ; https://www.arxiv.org/abs/1506.05908
- Doignon and Falmagne, knowledge spaces; ALEKS. REV, IND. https://arxiv.org/pdf/1511.06757 ; https://www.mheducation.com/content/dam/mhe/research/prek-12/essa-tier-4/aleks-assessing-learning-space.pdf
- Math Academy, knowledge frontier and implicit repetition. IND. https://mathacademy.com/how-our-ai-works ; https://justinmath.com/individualized-spaced-repetition-in-hierarchical-knowledge-structures/
- Duolingo Birdbrain. IND. https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain
- Settles and Meeder (2016), half-life regression; FSRS. EXP (vendor-run), IND. https://aclanthology.org/P16-1174/ ; https://docs.ankiweb.net/faqs/what-spaced-repetition-algorithm
- Wilson, R. C., et al. (2019). The eighty five percent rule. Theory and simulation. https://pmc.ncbi.nlm.nih.gov/articles/PMC6831579
- Bloom (1984); Slavin (1987). REV, disputed. https://www.gwern.net/doc/psychology/1984-bloom.pdf ; https://www.gwern.net/doc/psychology/1987-slavin.pdf
- Khan Academy mastery levels. IND. https://support.khanacademy.org/hc/en-us/articles/115002552631
- Bjork, E. L., and Bjork, R. A. (2011). Desirable difficulties. REV. https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf
- Procedural skill retention (2025). *Psychological Bulletin*. MA (unv). https://pubmed.ncbi.nlm.nih.gov/40455501/
- Stambaugh, L. A. (2011). Contextual interference in beginning clarinettists. EXP (unv). https://digitalcommons.georgiasouthern.edu/music-facpubs/2
- Carter, C. E., and Grahn, J. A. (2016). Interleaved practice in clarinettists. EXP, n = 10. https://pmc.ncbi.nlm.nih.gov/articles/PMC4989027/
- Brady (2004); Brunmair and Richter (2019); Cepeda et al. (2006): see `learning-science.md`. MA.
- Simmons, A. L. (2011). Distributed practice and consolidation in musicians. EXP (unv). https://cml.music.utexas.edu/online-resources/intelligent-music-practice
- Zhukov, K., et al. (2016). A hybrid sight-reading curriculum. EXP, small (unv). https://figshare.utas.edu.au/articles/journal_contribution/Improving_sight-reading_skills_in_advanced_pianists_a_hybrid_approach/22913330

**Products** (IND throughout; behaviour as documented, not outcomes)
- Piano Marvel Play Mode, scoring and SASR. https://pianomarvel.com/feature/play-mode ; https://support.pianomarvel.com/portal/en/kb/articles/scoring ; https://pianomarvel.com/sight-reading
- Sight Reading Factory auto assessment. https://static.sightreadingfactory.com/focus/autoAssessment
- Noteflight Learn SoundCheck (unv). https://www.noteflight.com/soundcheck
- SmartMusic educator guide (unv). https://www.makemusic.com/wp-content/uploads/2013/01/SM_13043_Educator.pdf
- Tonara. https://www.thestrad.com/accessories/the-tonara-teaching-and-practice-app/8477.article
- Melodics lesson scoring and progress. https://support.melodics.com/en/articles/15092017-lesson-scoring ; https://support.melodics.com/en/articles/15091765-understanding-your-progress-in-melodics
- Rocksmith+ Up Next. https://www.ubisoft.com/en-gb/game/rocksmith/plus/news-updates/3CdAiL4Ms6iWS8nGREcDhq/all-about-up-next
- osu! Unstable Rate and accuracy. https://osu.ppy.sh/wiki/en/Gameplay/Unstable_rate ; https://osu.ppy.sh/wiki/Accuracy
- Simply Piano: help page, reviews and JoyTunes patent US 9,492,756. https://piano-help.hellosimply.com/en/articles/7943490-learning-with-simply-piano-the-basics ; https://pianistscompass.org/?p=9588 ; https://patents.google.com/patent/US9492756
- Yousician: review and help (unv, 403). https://pianistscompass.org/?p=15355 ; https://support.yousician.com/hc/en-us/articles/208014795-Song-scoring-and-leaderboards
- Skoove and Simply Piano reviews. https://pianoers.com/skoove-review/ ; https://pianoers.com/simply-piano/
- Playground Sessions reviews. https://www.trustpilot.com/review/playgroundsessions.com
- Duolingo Music. https://blog.duolingo.com/p/fc0b9772-e1f6-4223-9a9f-ebf76b94b047/
- Tenuto. https://www.musictheory.net/products/tenuto

**Accessibility**
- WCAG 2.1, 1.4.1 Use of Color and 1.4.11 Non-text Contrast. https://www.digitala11y.com/understanding-sc-1-4-1-use-of-color/ ; https://dequeuniversity.com/resources/wcag2.1/1.4.11-non-text-contrast
