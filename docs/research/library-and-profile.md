# The library and the player profile: a long-term record, a natural progression, and a Songs page with a cover for every piece

Compiled 2026-11-01 for the owner's request of the same day: research a long-term profile of the player that grows as they play; find out whether the Apple Developer account gives access to Apple Intelligence and whether it can make recommendations; organise the repertoire and the curriculum into a more natural progression; research ways to organise and present 2,241 pieces, since sorting by composer is no use; and give every entry a small thumbnail, even an imperfect one, with a general sheet-music placeholder where nothing better exists.

It is a synthesis of three research passes run the same day (Apple Intelligence and the player profile, re-grading and linking the catalogue, the Songs page and thumbnails). It was checked against the code at HEAD 4302efd and against the re-analysed catalogue of 30 October (2,241 pieces, the same count as live). It builds on `docs/research/practice-path.md`: all ten of that plan's decisions are accepted and its phase 1 is being built now on `feature/path1`. Nothing here replaces that plan. Where this plan needs its phase 1 or phase 2 to carry something extra, section 7 says so.

Evidence labels are the ones `practice-path.md` uses: **MA** meta-analysis or systematic review, **EXP** controlled experiment, **OBS** observational, survey or dataset study, **REV** narrative review or theory, **PRAC** teacher, syllabus, board or publisher document, **IND** product behaviour or vendor claim (Apple's own pages and sessions count as IND), **INF** our own inference with no direct study. One label is added: **REPO**, measured or read in this repo during this pass. A source read only as an abstract or a search summary is marked (unv).

---

## 1. The recommendation on one page

**Apple Intelligence: no.** The owner's iPad Air 4 (A14) cannot run it. Apple's list of supported iPads is "iPad mini (A17 Pro), iPad models with M1 or later" (read on Apple's support page for this pass, IND). The on-device model needs no developer account at all, and the new server model (Private Cloud Compute) "is only available on Apple Intelligence devices" (WWDC26 session 319, read for this pass, IND). The paid account changes neither. And even on an eligible iPad the model should only reword sentences. It should never choose the lesson: a sampled choice cannot be replayed or tested, and it would differ from device to device. Instead the profile's weekly note comes from code, with the same words on every device. The conditions for revisiting are in section 2.

**What to build.** Four tracks. They share one engine and run alongside practice-path's five phases.

1. **Keep the evidence.** Three small additions to practice-path phase 1's log, which cannot be added later: the pitch played on a missed card, the timing spread of a run, and card rows kept by month instead of in a ring that drops them after about 100 days. Phase 2 adds one field, the rule that chose each lesson. After that the profile reads raw rows on demand. There is no aggregation layer until a view measures slow.
2. **Fix the catalogue.** Three changes. The `mode` field is empty on all 2,241 pieces: `reanalyse.mjs` never copies it, even though the pipeline now writes it. One word fixes that and gives 723 pieces a stated key (REPO). Each piece gets a `kind`, so the 1,299 Lieder accompaniments and 39 studies leave the piece ladder. And the first three bars of every piece go into one lazy sidecar file, 281 KB gzipped (REPO, measured).
3. **A cover for every piece, then a Songs page you can browse.** The app's own engraver draws every library row from the sidecar. The blank staff stays only as a rare fallback, for example offline before the sidecar has arrived. The Songs page becomes Option D: a home page of a few shelves led by "Fits you now". Each shelf is a saved filter over one faceted grid (Level, Length, Key, Kind, Period, Composer). Composer stops being the main control.
4. **One difficulty scale and a natural progression.** A continuous internal level, `lvl` (0 to 9, matched to Henle's published levels and fitted to named anchor pieces rather than cut by percentile), is shown as the Path's Level 1 to 5. Skill tags and `needs` link each piece to the Read, Scales and Technique units that make it playable. One `fit()` then picks a piece for three roles: sight-read (nothing new, well below you), consolidate (nothing new, just below), and stretch (exactly one new thing, just above). The same function serves `nextUp()`'s piece step, the Songs shelves and the ladder.

**Why this order.** The log fields come first because they are the only thing that cannot be done later. The catalogue fixes and thumbnails come next because they are independent of the practice-path work, cheap, and answer the owner's most visible complaint. The re-grade must come before `fit()`, and the shelves need `fit()`. The profile views are gated by weeks of data, not by build time.

**The four calls that shape it.**

- **The model words the note; it never picks the lesson.** Deterministic recommendation is the right design even on an eligible device (section 2.3).
- **Raw rows, not rollups.** A year of card rows is about 3.6 MB on the device (INF, from practice-path's 50 bytes a row at 200 cards a day). Reading it takes milliseconds, so storing raw is lossless and needs no aggregator to keep in step. The monthly rollup design from the research pass is the named upgrade (section 3.2).
- **Fitted to anchors, not cut by percentile.** A level should mean "playable after this much study", not "rank in this library". The reason for keeping percentile cuts on 27 October was to keep browsing by level even. That reason goes away once browsing is by fit and facets, and the accompaniments and studies have their own lanes.
- **Build on what exists.** `incipit()`, `keep()`, `drawCovers(root, load)` and `draw(song)` already do everything a thumbnail needs except supply the notes. `judge()` already computes the difficulty terms. `nextUp()` already has a piece step. `practice:days` already holds a lifetime of habit data.

---

## 2. Apple Intelligence

### 2.1 The verdict for the owner's iPad

- **The device.** Apple's "How to get Apple Intelligence" page, read for this pass, lists "iPad mini (A17 Pro), iPad models with M1 or later" for iPadOS 27. The iPad Air 4 has an A14 and is not on the list (IND, https://support.apple.com/en-us/121115). Apple's iPad guide gives the same list (IND, https://support.apple.com/guide/ipad/aside/ipadd1bec1d9/ipados). The Air 4 does install iPadOS 27; it just gets no Apple Intelligence (IND (unv), ithinkdiff). This matches the line already in `docs/research/ios-native.md`.
- **The on-device model** (Foundation Models framework, about 3 billion parameters) "runs only on Apple Intelligence-enabled devices in supported regions" (WWDC25 session 286, IND). On the Air 4, `SystemLanguageModel.default.availability` reports the device as not eligible. The framework needs no account, no key and no entitlement. Eligibility is set by the hardware, the language and a user setting.
- **The server model** (Private Cloud Compute for third-party apps, new at WWDC26) is the only part that involves the developer account. You apply for it on the developer website, it is "available for apps with less than 2M downloads", and there are "no token costs to you, the developer", with a daily limit per user's iCloud account. But: "just like with the on-device model, PCC is only available on Apple Intelligence devices" (WWDC26 session 319, read for this pass, IND). There is no way to borrow Apple's server model from an ineligible iPad.
- **The web.** Chrome's Prompt API (Gemini Nano) is desktop Chrome only, needs at least 22 GB free and a capable GPU, and WebKit opposes it. Safari and the iPad's web view will not get it (IND, https://developer.chrome.com/docs/ai/prompt-api; the WebKit position read only through commentary). The owner's Mac could run Foundation Models only from a native Mac app, which Piano Forte is not.

**So the owner can never see an Apple Intelligence feature on the current iPad, and building one means building for a device nobody in the loop owns.** By Directive 3 that is the wrong order.

### 2.2 What an on-device 3B model is good and bad at here

| Task | Fit | Why |
|---|---|---|
| Rewording 3 to 4 computed facts into 2 to 3 friendly sentences | Good | Summarising supplied facts is what it is built for; guided generation guarantees the output's shape (IND, sessions 286, 301) |
| Explaining why a lesson was chosen | No need | The rule's own reason line already says it, exactly and testably |
| Computing trends, percentages, counts | Bad | Small quantized models are unreliable at arithmetic (IND, Apple's 2025 model report notes the regression) |
| Choosing the next lesson | Bad | See 2.3 |
| Anything needing knowledge of music or teaching | Bad | "Not designed for world knowledge or advanced reasoning" (IND, session 286); it would state wrong fingerings with confidence |

### 2.3 Why recommendation stays deterministic, on any device

1. Every recommendation names its reason and the rule that chose it, so a bad pick can be found and changed (practice-path 2.6). A sampled choice cannot be replayed.
2. The output changes with each OS update. Greedy sampling is deterministic only within one model version (IND, session 301). The same log would give different lessons on the iPad and on a stranger's iPhone.
3. Practice-path phase 5 plans a replay test that checks any change against the log before it ships. That test needs a pure function.
4. Eligible devices are a minority, so model-based logic would split the product in two.
5. Forgetting, difficulty and the 85% band are numeric. A language model is the wrong tool for them.

The Anthropic and Google Swift packages announced at WWDC26 run on any iPad, but they need a key or a backend and would send the practice log off the device. That breaks principle 5 (local, no account) and triggers App Review's consent rule for third-party AI (IND (unv), TechCrunch on the November 2025 guidelines). Not recommended.

### 2.4 What to do instead

- **`narrate(facts)`**, a pure function in `src/profile.ts` (lazy). It takes facts that code has already computed and writes the profile's two-to-four-line note from templates, with three to five wordings for each line, picked by week number. Example: "You played 5 of 7 days. Bass-clef reading went from 62% to 81% in four weeks. F2 and G2 still take you longest. Next: Bass landmarks." It is accurate, testable and the same on every device. It is built in profile phase R5 (section 7).
- **The phrase bank is written by a model at build time.** Claude in a session (or Apple's `fm` command-line tool on an Apple Silicon Mac) drafts the varied wordings, and they are reviewed and committed. That gives the one real benefit of a model, wording that does not repeat every Monday, with no runtime cost, no device dependency and nothing new for App Review.

### 2.5 When to revisit

Revisit when **both** of these hold:

1. An Apple Intelligence device is the practice screen: any iPad with M1 or later, or an iPad mini with the A17 Pro. Or the app is on the App Store and its users have such devices.
2. `narrate()` exists and the profile has twelve weeks or more of facts worth wording.

The build is then half a session. Add a `note` method on the existing CoreMIDI plugin, guarded by `#if canImport(FoundationModels)` and an availability check (the deployment target is iOS 15, so it must be weak-linked). The model gets only a JSON of computed facts, never free text the player typed and never an imported file's title (a MusicXML title is a plausible prompt injection, a risk Apple names, IND). A validator checks the output: every numeral must appear in the facts, every name must come from the facts, no word from the copy rules' banned list, and a length cap. Any failure falls back to `narrate()`. A Settings switch turns it on, default off, and the note is marked as written on the iPad by Apple Intelligence. Testing uses Xcode's "Simulate Apple Foundation Models Availability" for the unavailable states and the Evaluations framework for output quality (IND, sessions 319, 241).

---

## 3. The player profile

### 3.1 What exists, and the gap

Persisted today (`src/store.ts`, REPO): `practice:days` (seconds per day, never trimmed, a full lifetime), `snap:<week>` (weekly Read mastery per stage and the count of solid techniques, a lifetime series), `history:log` (the last 600 rows; practice-path raises this to 3,000 and adds `id, notes, ok, lv, as, rate, then`), `touch:log` (the last 300 rows), `prog:<id>`, `drill:stats` (moving averages that forget after three or four sightings), `take:<id>` (the last three runs of each piece, every key), and the trainer stats. Practice-path phase 1 adds `log:cards`, a ring of 20,000 rows of `{ ts, k, y, rt }`, about 100 days at 200 cards a day.

The gap for a profile that spans years:

1. The card ring drops rows after about 100 days.
2. Nothing records **what was played instead** of a missed card's note. Without it there is no "F2 played as G2", which is what tells a reading slip from a misread clef.
3. Timing spread is not logged per run (bias is, as `bias`).
4. Nothing records **which rule chose** a lesson, so practice-path's measures of overrides and rule quality would have nothing to read.

### 3.2 Data: what must start now, and why

| Field | Where | Why it cannot wait | Ships with |
|---|---|---|---|
| `got?: number` on a card row: the pitch played (Read, Sight run) or the answer given (Theory) on a miss | `log:cards` | The confusion map (section 3.4) needs it, and a missed answer that was not recorded cannot be recovered | practice-path phase 1 |
| Card rows keyed by month, `log:cards:<YYYY-MM>`, never dropped, instead of one 20,000-row ring | store, `backup.ts` FIELDS (merge `byTs` per month key), `clearAll` prefix `log` | The ring starts dropping rows after about 100 days; anything dropped is gone. Per-month keys also keep each read-modify-write small (about 6,000 rows at most) | practice-path phase 1, or at the latest before the ring would first wrap (about 3 months after phase 1 ships) |
| `sp?: number` on a history row: timing spread in ms (sd of offsets after removing the lean) | `history:log` | Lean drifts with calibration, so spread is the stable long-term timing trend. Takes keep only the last three runs | practice-path phase 1 |
| `by?: string` on a history row: the `nextUp()` step or `fit()` role that offered the unit, or `own` when the player picked it | `history:log` | Practice-path's measures 1 and 5 (Continue, Again, Back, and overrides) and this plan's fit check (section 4.6) read it | practice-path phase 2 |

Nothing else is needed. Habits come from `practice:days`, back to the first day. Read mastery history comes from `snap:`. Piece first reads come from the first history row with a piece's `id`. Tempo ceilings come from `rate` and `ok`.

**Why raw rows and not the research pass's monthly rollups.** The research pass proposed `roll:<YYYY-MM>:<strand>` records (sums of attempts, successes, log response time, error counts and tempo ceilings), plus a `rebuildRolls()` to repair them. That is an aggregator, a second source of truth and a consistency test, all to avoid reading a few MB. At practice-path's 50 bytes a row, a heavy year of 200 cards a day is about 3.6 MB on the device and in the export (INF). The Progress page is lazy, and a year of rows is tens of thousands of objects, which takes milliseconds to scan (INF, not measured on the iPad). `ponytail:` profile metrics are computed from raw rows on demand. Rollups are the upgrade if a Progress view measures slower than 50 ms on the iPad, or the export passes 20 MB. History rows stay one key at practice-path's cap of 3,000 (about 300 KB, roughly a year at ten rows a day). The month-key move for history is filed for the month the cap is first reached.

### 3.3 The research behind a learner profile

- **Open learner models.** Showing learners the system's model of them supports self-assessment and planning (Bull and Kay 2013, REV). Effects are mixed, and drill-down did not always improve self-assessment (OBS, small). Taken: show each claim with its evidence one tap below, and let the player dispute it ("I know this note"); the dispute is itself data.
- **Learning-analytics dashboards** are rarely grounded in learning theory and seldom show strategy (Matcha et al. 2020, MA). Learners pick activity totals when given the choice, and need guidance to act (Jivet, OBS). Taken: no wall of totals. Every panel ends in a handle, a button that does the suggested thing.
- **Self-regulation in music**: forethought, performance, reflection (McPherson and Zimmerman, REV). The app logs performance automatically, which avoids self-report bias. A weekly look back is the reflection step.
- **Spacing** is the strong finding (Cepeda et al. 2006, MA, in `learning-science.md`), so the retention panel earns its place. The 85% target is theory (Wilson et al. 2019).
- **Products** (IND, no outcome evidence): Garmin's named training states ("Unproductive": the load is fine but there is no gain) are the model for a plateau flag. Chess.com Insights compares the player's period with their own past period. Duolingo's year in review is the loved artefact; its streak is the harmful one. Whoop's daily score invites compulsive checking, so there is no daily readiness score here.

### 3.4 The metrics

All are pure functions in `src/profile.ts`, lazy, over the raw rows. Strands are practice-path's `read, run, scale, tech, theory, piece`.

1. **Success rate with honest uncertainty.** `(ok + 1) / (n + 2)` per window, with a Wilson interval. Nothing is shown below `n = 20`. "Up" or "down" only when the last 28 days' interval and the 28 days before it do not overlap; otherwise "holding steady" (the thresholds are INF).
2. **Fluency.** The geometric mean of response time divided by the stage's goal time. Geometric because response times are right-skewed.
3. **Tempo ceiling per piece or scale.** The highest `rate` with at least two counted runs on different days in the last 60 days. Different days guards against one lucky run. Shown as a step line against the written tempo.
4. **Where it goes wrong.** For each pitch, interval, key, hand and clef, a miss rate shrunk toward the strand mean, `(miss + 8·e) / (n + 8)` (standard shrinkage; the prior strength of 8 is INF). It is ranked against the strand mean among keys with `n >= 10`, and the top three are shown. With `got`, a played-for-written map says whether F2 is mistaken for G2 (one step, a reading slip) or for A2 (a third, a clef misread). The labels for causes are INF.
5. **Lean and spread.** The monthly median of `sp` is the trend. Lean is shown only after a recent calibration.
6. **Plateau.** Over a unit's last six counted sessions, the Theil–Sen slope of first-try share and of log response time. It is a plateau when both slopes' intervals include zero and the mean is under target. This agrees with practice-path 4.4's five-sessions-no-gain rule and shares its code in practice-path phase 4. The handle changes the task (a smaller loop, another key, a rhythm drill first).
7. **Retention.** For each return after a gap of `g` days, the first session's success over the steady success before the gap, fitted as `2^(-g/h)` per strand. Shown only with 20 or more returns, shrunk to a prior half-life (21 days for reading, 45 for scales; both guesses, flagged as such). This is half-life regression (Settles and Meeder 2016, vendor-run) over spacing evidence (strong). Its fit to piano skills is INF.
8. **Habit.** Days a week, active days in the last 28, the median and longest gap, and **returns** (times practice resumed after four or more days off), all from `practice:days`. "Back after 9 days, 3 times this year" is shown as a strength. No flame.
9. **Repertoire.** Pieces at Learning and Ready over time, and the **repertoire ceiling**: the highest Path level with three or more pieces Ready (PRAC: three pieces a grade is the exam convention). It uses the new `lvl` (section 4).
10. **The story.** The last 28 days against the 28 before, per strand. Facts are ranked by standardised change (Cohen's h for shares, log ratio for times) with a minimum `n`. Up to three gains and two things still hard are emitted, plus the next step from `nextUp()`. It always leads with a gain, then a handle, then a plan. The words come from `narrate()`.

Cut, with when to add: consistency (the coefficient of variation of success, when plateau flags prove too coarse); a training-load model in the style of Strava (validity for skill is INF, and it reads as fitness); player-set goals beyond the existing weekly goal (when the owner asks).

### 3.5 The Progress page

The rules: paper and ink, one brass lamp for the one Start, sparklines in Ink, no radar charts, no leaderboards, no red. Every panel has a headline claim, its evidence one tap below, and one handle. Each panel appears only when its data exists, so a new player sees today's page. The chart palette and accessibility pass go through the `dataviz` and `impeccable` skills when built.

**View 1. Progress, top level (iPad landscape, 1180 x 820).**

```
+----------------------------------------------------------------------------------------+
| Progress                                             [ 4 weeks | 6 months | Year ]     |
+----------------------------------------------------------------------------------------+
|  This month                                                                            |
|  You played 5 of 7 days, up from 3. Bass clef went from 62% to 81% in four weeks.      |
|  F2 and G2 still take you longest.        Next: Bass landmarks, 12 cards   [ Start ]   |
+---------------------------------+------------------------------------------------------+
|  This week                      |  Skills                  12 weeks       Level        |
|  M  T  W  T  F  S  S   4 of 5   |  Reading, treble   ____/'''''          6 of 8 solid  |
|  ●  ●  ○  ●  ●  ○  ·            |  Reading, bass     __/'''              3 of 8 solid  |
|  98 min                         |  Time              ~~~~~~~~~~          holding steady|
+---------------------------------+  Scales and keys   ___/''              Learning      |
|  How you practise  (26 weeks)   |  Technique         __/'                Learning      |
|  ▪▪▪ ▪▪ ▪▪▪▪ ▪ ▪▪▪ ▪▪ ▪▪▪ ▪▪▪   |  Pieces   7 Ready · 3 Learning · ceiling Level 2     |
|  back after 9 days, 3 times     |                                        Details  >    |
+---------------------------------+---------------------------+--------------------------+
|  Where it goes wrong   Open map |  What you keep            |  Stuck                   |
|  F2 · G2 · keys with 3 flats    |  Scales: about 5 weeks    |  Bass five-finger:       |
|  [ Practise these ]             |  Reading: about 2 weeks   |  5 sessions, no change   |
+---------------------------------+---------------------------+  [ Try it in G ]         |
                                                              +--------------------------+
```

**View 2. Where it goes wrong (Reading, bass clef).** Tapping a position opens the attempts behind it.

```
+----------------------------------------------------------------------------------------+
|  <  Progress    Bass clef, last 8 weeks                 shading: misses against your   |
|                                                         own average; numbers are counts|
|   E2   F2   G2   A2   B2   C3   D3   E3   F3   G3   A3   B3   C4                       |
|   31%  34%  29%  12%   9%   8%   6%   7%   5%   8%   6%  11%   4%       (n >= 10 only) |
|   ███  ███  ███  ▒    ░    ░    ░    ░    ░    ░    ░    ▒    ░                        |
|                                                                                        |
|   Mixed up most:   F2 played as G2 (11 times)   E2 played as F2 (7 times)              |
|   By interval:     steps 6%   thirds 9%   leaps over a fifth 27%                       |
|   By key:          no sharps or flats 7%   one or two flats 10%   three or more 29%    |
|                                                                                        |
|   [ Practise F2, G2 and E2 ]   (a card set of exactly these)     This is wrong  >      |
+----------------------------------------------------------------------------------------+
```

**View 3. The year (shown after three months of data).**

```
+----------------------------------------------------------------------------------------+
|  Your year                                                                             |
|  212 days practised · 61 hours · 14 pieces Ready · ceiling from Level 1 to Level 3     |
|                                                                                        |
|  Reading stages solid                         Tempo ceiling: Gymnopédie no. 1          |
|  18 |                    ____----             72 |                 ___*  written 72    |
|  12 |           ____---''                     54 |        ____---''                    |
|   6 |   ___---''                              36 |  __--''                             |
|   0 +--J--F--M--A--M--J--J--A--S--O--N--D     +--J--F--M--A--M--J--J--A                |
|                                                                                        |
|  Pieces reaching Ready:  o   o  o   oo   o   o  oo     (each dot opens the piece)      |
|  [ Copy a one-page summary ]   (text only, no ids: for a teacher or a friend)          |
+----------------------------------------------------------------------------------------+
```

### 3.6 Privacy

Everything is derived on the device from local logs (principle 5): no analytics and no upload. It is in the JSON export and in the backup already planned (`ios-native.md`). A profile is behavioural data and an iPad may be shared, so add **Clear profile** (the logs and snaps) beside Clear all data, and one Settings line saying what is kept and for how long (decision 21). The year summary is text the player chooses to copy, which is the honest substitute for social features.

---

## 4. Repertoire and curriculum progression

### 4.1 What is wrong with the grade today (REPO)

- `judge()` in `scripts/library/pipeline.ts` sums seven capped terms into `D`: onset rate, the busiest bar, the largest chord, chord span, range, out-of-key share, and tuplets and 16ths. `D` is cut at percentiles (`CUTS = [3.52, 5.47, 7.07, 8.19]`, aiming for 8/22/30/25/15%). It ranks the 159 hand labels at Spearman 0.84. Adding the catalogue's other numeric fields raises that only to 0.855. More of the same features will not help.
- **Systematic blind spots, not noise.** Slow pieces that are hard to play grade easy: Chopin Prelude Op. 28 No. 6 (ABRSM Grade 6) is grade 2, and Nocturne Op. 37 No. 1 (ABRSM Grade 8) is grade 3. Tchaikovsky's Morning Prayer Op. 39 No. 1 (ABRSM Grade 4) is grade 1. Drills grade hard: the Hanon pieces are all grade 4. Re-checked here on the 30 October catalogue.
- **The mix.** 1,299 of 2,241 pieces (58%) are Lieder accompaniments, and 1,166 of those sit at grade 3 or above. 39 pieces are tagged `technique`. Without them, the pieces per grade are 48, 168, 270, 210 and 207 (REPO, re-checked). Level 5 is a heap of 570 pieces stretching from ABRSM Grade 8 to concert works.
- **Order inside progressive sets is poor.** Schumann Op. 68's own numbering against `D` is Spearman 0.65 (n = 20).
- **The ceiling of the field.** The best published symbolic model on Henle's nine levels (CIPI, 652 public-domain scores) gets 39.5% exact and 87.3% within one level (Ramoneda et al. 2024, OBS). Experts themselves agree at about tau-c 0.81 (PSyllabus, OBS). So plan for "within one level". A five-band display is honest; a nine-level display claims more than the data holds.

### 4.2 One difficulty scale

- **Internal: `lvl`, a float from 0.0 to 9.0, one decimal, matched to Henle's levels 1 to 9.** Henle publishes the rationale (level 1 is what a student can play after about a year of good lessons; "when in doubt, the lower level is chosen"), named anchor pieces for each level, and a public-domain dataset (CIPI) to check against (PRAC, https://www.henle.de/Levels-of-Difficulty/). The range 0 to 1 sits below Henle's lowest level and holds the starters, first-rung pieces and generated pieces. ABRSM lists are the best anchors but cannot be an open scale (a list places pieces; it does not score them). PianoSyllabus's 11 levels have no public crosswalk to anything.
- **Store `lvlSd`**, the model's uncertainty from the cross-validation residual, so `fit()` can distrust thin evidence.
- **Shown as the Path's Level 1 to 5**, a band of `lvl`, so every surface that uses levels keeps working. The pipeline still writes `grade`, set to the band of `lvl`, and `catalog.ts`, the Songs filter, the ladder test and the covers' difficulty rule read it unchanged. This settles audit item CP-29 as "Level 1 to 5" (decision 12).
- **The cut points are absolute and fitted, not percentiles.** The first guess (INF) comes from the repo's own label banding (`labels.json`: 1 = exam grades 1 and 2, 2 = grade 3, 3 = grades 4 and 5, 4 = grades 6 and 7, 5 = grade 8 and up): Level 1 below 2.0, Level 2 from 2.0 to 3.0, Level 3 from 3.0 to 4.0, Level 4 from 4.0 to 5.5, Level 5 from 5.5. The bottom of the crosswalk is unsettled. The research pass's own crosswalk ("Henle 2 is about ABRSM 3") and its anchor table (Schumann Op. 68 No. 1, Henle 2, expected at Level 1) disagree by about one Henle level. Isotonic regression from model score to anchor level settles it with data; the bands are then read off the fitted map.

### 4.3 The re-grade

1. **Features**, computed in `judge()` from the `Song` the pipeline already builds. The raw values are stored, not only the capped terms, so a refit needs no rebuild. Hand motion is the term the literature says matters most and the current seven lack: jumps over an octave within two beats per hand (Sebastien et al. 2012's strongest term), position shifts per bar, and the share of bars in a five-finger position. Fingering-derived features lift accuracy 7 to 14 points over note counts alone (Ramoneda et al. 2022, OBS, small). Also: hand independence (the overlap of the two hands' onsets), rhythmic variety (entropy of written lengths, dotted and syncopated shares), tempo-normalised speed (the shortest common value at the tempo), ledger-line share per clef, and voices per hand. Grade the whole piece, with the local maxima as extra features: training on fragments drops accuracy by more than 10 points (CIPI, OBS).
2. **Model.** An ordinal, monotone, additive fit on about 25 features (ridge or ordinal logistic, non-negative weights on features that make a piece harder). It is trained on the 159 hand labels, the anchors, and pair constraints from progressive sets (Burgmüller Op. 100, Schumann Op. 68, the Anna Magdalena notebook, Czerny, Clementi sonatinas). Not a neural net: a few hundred labels, and the app must be able to say why.
3. **Priors for what features cannot see.** A composer-or-collection residual, shrunk hard (if three Chopin preludes sit two bands under their anchors, the rest of Op. 28 moves up by the shrunk mean), and a hand-set form prior for nocturnes, ballades, fugues and sonata first movements (INF). Sebastien's teachers rated advanced pieces higher than the system did for exactly this reason: "pianists also take expression into account" (OBS). `gradeOverride`, unused today, becomes the top authority and is set on every anchor.
4. **Anchors.** The seed is ten placements found inside the catalogue (the research pass's table 2.3, among them Bach's Musette, Burgmüller's Arabesque, the Tchaikovsky pair, Chopin Op. 28 No. 6 and Op. 37 No. 1, and Schumann Op. 68 Nos. 1, 2, 3 and 5), grown to 60 to 100. The growth comes from Henle's level pages looked up one piece at a time (by hand or by an agent reading one page at a time, never scraped) and from the free ABRSM and RCM list PDFs. The owner reviews the anchor table (decision 12). The Anna Magdalena numbering of Anh. 114 and 115 still needs a hand check.
5. **Run.** Through `reanalyse.mjs` (it keeps every id, file and hash), then `catalog-diff.mjs` to read the level changes by hand (the 50 largest shifts, and every Chopin, Bach and Schumann Album piece) before `combine.mjs` and the publish. Fingering cost (Nakamura-style rarity of finger transitions, or the MIT-licensed Pianoplayer) is the one further feature, added only if the anchor hold-out stalls. A deep model trained on CIPI is not planned: its data licence is research use on request, and label noise caps any gain.

### 4.4 Kind, skills and needs

**`kind`** (one field, cheap rules, part of the catalogue fix in section 7):

- `piece`: the default.
- `study`: the `technique` tag (Hanon and Virtuoso Pianist, 39 pieces), plus any piece that is one repeated figure. Off the ladder and the piece picker; listed under Technique and still searchable (decision 14).
- `accomp`: the Lieder. `lvl` is computed from the piano part only (each note keeps its `part`), not the folded voice. They get their own lane ("Accompany a voice", which accompaniment practice already supports) and form the large pool of unseen music for read-through at two levels below. Off the ladder: the order of a song cycle is not a teaching order (decision 13).
- `fragment`: under 16 bars, or flagged `length` or `bar-length`. Allowed, and marked.

**`skills`**, a short list of stable tags, plus a small object of the numbers behind them. Every tag is computed from `Song` fields the pipeline already has (`h`, `p`, `qb`, `qd`, `tuplet`, `tieNext`, `voice`, `grace`, `art`, `slur`, `part`, `keys`, `stated.mode`). The thresholds are starting points, tuned on a 60-piece audit.

| Tag | Rule (starting point) | Unit it needs |
|---|---|---|
| `key:<tonic><mode>`, `modulates` | `fifths` plus the stated mode (estimated, and marked as estimated, where none is stated) | Read `keys-*`; Scales `s1`, `s3`, `s4` |
| `five-finger` | each hand within 7 semitones in 90% of bars, few shifts | Technique `five`; Read `t-five`, `b-five` |
| `extended` | a hand spans 8 to 12 semitones in 25% of bars | Read `t-oct`, `b-oct` |
| `ledger-high`, `ledger-low` | share of notes on ledger lines, per clef | Read `t-led1`, `t-led2`, `b-led1`, `b-led2` |
| `accidentals` | over 8% of notes outside the key | Read `sharps`, `flats` |
| `alberti`, `broken-chord`, `scale-run` | the left-hand low-high-mid-high figure in 40% of bars; runs by thirds; 5+ steps in one direction in the key | Technique `arp`, `scale`; Scales `s11` |
| `block-chords` | 3+ notes at once in a hand at over 25% of onsets | Theory chords |
| `compound`, `triplets`, `dotted`, `syncopation` | metre; existing tag; value shares; off-beat held onsets | Technique `rhythm` 1 to 3 |
| `hands-independent` | the hands' onsets overlap under 50%, or a 3:2 | Technique `balance` |
| `two-voice`, `ornaments`, `octaves`, `fast`, `long` | as the research pass defines them | feed `lvl`; `long` is read-through only |

Plus each hand's pitch range (5th to 95th percentile), so "fits you now" can ask whether the left hand stays inside the bass notes the player has made solid. The owner is still learning the bass clef, and the catalogue cannot answer this today: no piece is treble-only (REPO).

**`needs`**: the unit ids derived from the tags, never entered by hand. A unit is met when its Path state is `solid` (`grades.ts`).

Honest limits. The 748 MIDI pieces carry no articulation, slurs, dynamics or pedal, so their `legato` and `staccato` tags are absent rather than guessed. Pedal cannot be tagged until the written pedal is imported (ROADMAP item 9). Technique has no recipe for compound metre, ornaments or syncopation beyond rhythm levels 1 to 3; these are filed in the ROADMAP item (Directive 6).

### 4.5 The fit function and the role windows

```ts
// src/fit.ts, lazy (or inside next.ts). Pure: catalogue rows and a player summary in, ranked candidates out.
export type Role = 'sight' | 'consol' | 'stretch'
export function fit(pieces: Piece[], me: { a: number; met: Set<string>; bass: [number, number]; seen: Map<string, number> }, role: Role): { p: Piece; why: string }[]
```

- `a`, the player's piece ability on the `lvl` scale, starts at the middle of their Path level's band. It moves by an Elo step after each counted piece run, the update practice-path phase 5 already plans (Pelánek 2016, REV).
- `gap(p)` is `needs(p)` minus `met`, plus one gap if the left hand's range leaves the solid bass range.

| Role | Rule | Teaching sense |
|---|---|---|
| sight-read | no gap; `lvl` between `a − 2` and `a − 1.2`; never played | read-through two levels below (PRAC/INF; the rule in `readthrough.ts`) |
| consolidate | no gap; `lvl` between `a − 1` and `a − 0.2`; played, not Ready | the polish piece |
| stretch | exactly one gap; `lvl` between `a − 0.3` and `a + 0.8` | one new thing, which the curriculum is teaching now (Bruner's spiral, REV; the challenge point, Guadagnoli and Lee 2004, REV) |

Score: closeness to the middle of the window, minus `0.4 · lvlSd`, minus penalties for repeats and for a neighbour played in the last three days (INF). The reason line names the one new thing, built from the tags: "In G major, which you just made solid, with a broken-chord left hand like your arpeggio exercise. Level 2, a step up from where you are." If a role is empty (the thin start of the ladder) it says so and falls back to the nearest role, never to nothing, as `nextUp()` step 9 requires.

**One engine, three surfaces.** `nextUp()` step 9 calls `fit()` in place of "the ladder's next, else `pickPiece`". The Songs shelves "Fits you now", "A step up" and "To sight-read" are the three roles. The 19-piece ladder stays as the pinned teaching pieces inside the graph, and its test pins `lvl` bands instead of grades. When the frontier step in `nextUp()` turns a unit solid, the stretch candidates whose one gap was that unit give the unlock moment for free: "You made G major solid. Here is a piece in G."

### 4.6 Supply: the thin first rung

Non-Lieder, non-study pieces by the current grade and key group (REPO):

| grade | C or A minor | G or F | 2 accidentals | 3 | 4 or more | total |
|---|---|---|---|---|---|---|
| 1 | 16 | 18 | 7 | 2 | 5 | 48 |
| 2 | 35 | 57 | 42 | 11 | 23 | 168 |
| 3 | 41 | 80 | 54 | 39 | 56 | 270 |

With at most 32 bars and at most one sharp or flat, 50 pieces sit at grades 1 and 2 (REPO). After the re-grade these rows will probably get thinner (the Tchaikovsky pieces rise). A role window about one level wide, filtered to no gap and the player's keys, needs about 24 pieces per half-level to leave four to six candidates (INF, derived from the picker, not from a source).

**Order:** re-grade, then count each Level 1 and Level 2 window. Only if a window holds fewer than 24 pieces does the app write short pieces from rules, the route `starters.ts` already takes by hand. These are CC0 pieces with five-finger melodies in C, G and F over a drone or blocked fifths, 8 to 16 bars, in a named metre, credited "Written for Piano Forte". Their tags and needs are exact by construction. The owner hears a sample before any ship (decision 15). In parallel, the public-domain method books the pipeline has not reached are filed as a manual sourcing list: Beyer Op. 101, Türk's Handstücke, Czerny Op. 599 and Op. 823, Gurlitt Op. 117, Köhler. Whether Mutopia or PDMX hold any of them is unchecked (INF). IMSLP stays manual (`public-domain-sources.md`), and PDF reading was dropped.

### 4.7 Validation

1. **Anchor hold-out.** Five-fold cross-validation on 60 to 100 anchors, reporting Spearman and the share within half a level and within one level. Targets (OBS, not promises): Spearman of at least 0.9, and 85% within one Henle level. The ten seed anchors' misses of two bands go to at most one. Beating the literature's 87.3% would suggest leakage.
2. **Pair order** on progressive sets (Op. 68 is 0.65 today). The re-grade must improve it.
3. **Regressions.** `ladder.test.ts` repinned to `lvl` bands, no `study` or `accomp` on the ladder, and the hand-read diff.
4. **Tag audit.** 60 pieces checked by eye for precision and recall on the five tags a player acts on (key, five-finger, Alberti, ledger, compound), plus synthetic `Song` fixtures in `library-pipeline.test.ts` for each rule, so thresholds cannot move silently.
5. **Fit in use**, from the log (with `by`): the first read-through of recommended pieces should land in the 75 to 92% band; stretch should land lower than consolidate, and sight-reading highest. If stretch lands above consolidate, `lvl` is wrong in that region.
6. **The owner's tap.** After a read-through or a first Learn run of a piece: "Easier than expected / About right / Harder". One optional tap, the cheapest ground truth there is, used to fit a per-piece offset (decision 22).

### 4.8 Stale and missing catalogue data to fix

| # | What | Evidence | Fix |
|---|---|---|---|
| 1 | `mode` is empty on all 2,241 | REPO: the pipeline writes it since 88dfea6 (1 Nov), but the catalogue was built on 30 Oct. **`reanalyse.mjs`'s `ANALYSIS` set does not include `mode`**, so re-running it, as ROADMAP's Known gaps expects, still would not write it | add `'mode'` to `ANALYSIS` and re-run. 723 pieces state a mode (REPO, measured) and gain a key name on their covers; the rest keep the metre alone, by the key-honesty rule |
| 2 | `meter` written whether stated or not | ROADMAP Known gaps (2) | gate on `Song.stated.meter`: 2,237 of 2,241 state it (REPO), so 4 covers change |
| 3 | percentile `CUTS` | section 4.1 | absolute bands of `lvl` (4.2) |
| 4 | `gradeOverride` unused | REPO | set on every anchor |
| 5 | only the capped terms are stored | `gradeWhy` | store the raw features |
| 6 | no `kind`, `lvl`, `lvlSd`, `skills`, `needs`, hand ranges, period, form | REPO | sections 4.2 to 4.4; period from the composers' dates (all 181 have them), form from titles plus a collection map (about 80% by title alone, INF) |
| 7 | Lieder graded with the folded voice in the right hand | `voice-folded` on 859 | grade the piano part only (`kind: accomp`) |
| 8 | `.cache/library/out-kern/catalog.json` holds 1,988 pieces | REPO | stale; use `out-reanalyse` or live. The grade counts differ by a few pieces between the 27 Oct, 30 Oct and live builds, so cite the build id with any count |
| 9 | PRODUCT.md credits Mishra 2014 with "sight-reading grows with volume of new easy music" | `learning-science.md` records the training types that helped as aural, controlled reading, creative and singing | a one-line correction to PRODUCT.md, and relabel the "two levels below" rule as PRAC/INF |

---

## 5. The Songs page

### 5.1 What it is today (REPO)

Top to bottom: the head with Add files; 8 starter pieces; Your files; then the Open library, which is a search field, a composer `<select>` of 179 names, a Level segment, and pages of 50 rows ranked by grade, then quality. There is no sort control and no other facet. On a fresh install the 2,241 pieces start below the fold. A zero result says "No piece matches" without naming the filter that emptied it. 98% of rows show a blank staff (section 6).

### 5.2 What the evidence says about organising a large catalogue

- **Facets with search.** Combining faceted navigation with keyword search "has become especially successful" for collections (Hearst, *Search User Interfaces*, ch. 8, REV). In the Flamenco study about 90% of 32 users preferred facets to search alone (Yee et al. 2003, EXP, small, an image collection).
- **Browsing is a different task from looking up** (Marchionini 2006, REV). The search box solves lookup. "Go through these things" needs structure.
- **Choice overload is not established.** The mean effect is "virtually zero" across 50 experiments (Scheibehenne et al. 2010, MA). A later meta-analysis reportedly finds an effect when preferences are unclear, which is a beginner's case (unv, not identified). So 2,241 is a findability problem, not proven paralysis: give a recommended start and counts, and hide nothing.
- **Progressive disclosure**: primary options first, the rest one tap away (Nielsen, IND). **Facet hygiene**: counts on every value, zero values disabled, and a zero result that names the filter and offers a one-tap undo (IND, Baymard and vendor guides, unv).
- **Rows ("shelves")** with a "See all" are Netflix's model for a large catalogue (Alvino and Basilico 2015, IND). The evidence against carousels is about auto-advancing heroes, not rows the user drives (IND).
- **What products lead with** (IND): learning apps lead with level, then genre, plus search (Yousician, Skoove, flowkey). Classical catalogues lead with composer, period and genre (Apple Music Classical, IMSLP). Henle pins each level to named pieces. Nobody leads a learner with composer.

### 5.3 The axes the catalogue can feed (REPO)

| Axis | Today | After section 4 |
|---|---|---|
| Fits you now | grade only | `fit()` roles: level, needs, the bass range |
| Level 1 to 5 | `grade`, every piece | band of `lvl` |
| Length | `sec`: under 1 min 379, 1 to 2 min 805, 2 to 4 min 773, over 4 min 284 | same |
| Key signature | `fifths`, every piece; no mode | "one sharp"; "G major" only for the 723 that state it |
| Kind | none | Pieces, Studies, Songs with voice (`accomp`), Written for Piano Forte |
| Form | none; titles name it for about 53% of non-Lieder pieces | title rules plus a collection map |
| Period | era tags on 700 | from composers' dates, every piece |
| Teaches | none | `skills` |
| Composer | the 179-name dropdown | a facet under More, and search |
| Mood | none | not planned: it would be editorial, and nothing measures it |

### 5.4 The options

Canvas: iPad landscape, 1180 x 820, under the 56 px top bar, in the One Measure's 1100 px column. Every option keeps search in the head. Cards are the identity spec's 300 x 200 cover, three to a row (3 x 300 plus two 20 px gutters is 940 px, so no new cover size); list rows keep the 56 x 42 thumbnail.

**Option A. Shelves of collections.**

```
+----------------------------------------------------------------------------------------+
| Songs                                   [ Title, composer or opus ........ ]  [ Add ]  |
+----------------------------------------------------------------------------------------+
|  Continue                                                                              |
|  [thumb] Minuet in G · Bach · Level 1 · bars 7 to 8 slipped last time      [ Learn ]   |
|                                                                                        |
|  Short and gentle · under 2 minutes, Levels 1 and 2                    See all 185  >  |
|  +----------------------+  +----------------------+  +----------------------+          |
|  | BACH · BWV ANH. 114  |  | SCHUMANN · OP. 68    |  | TCHAIKOVSKY · OP. 39 |          |
|  | Minuet in G          |  | Melody               |  | Old French Song      |          |
|  |  =|=o==o=|==o=o|=    |  |  =|=o=o==|=o===|=    |  |  =|==o=o=|o==o=|=    |          |
|  +----------------------+  +----------------------+  +----------------------+          |
|  Dances: minuets, waltzes, marches                                      See all 51  >  |
|  [ card ]                  [ card ]                  [ card ]                          |
|  Songs with the voice line                                           See all 1,299  >  |
|  [ card ]                  [ card ]                  [ card ]                          |
|  Written for Piano Forte (8)   ·   Your files (3)                                      |
+----------------------------------------------------------------------------------------+
```

**Option B. The level ladder.**

```
+----------------------------------------------------------------------------------------+
| Songs                                   [ Title, composer or opus ........ ]  [ Add ]  |
+--------------+-------------------------------------------------------------------------+
| Level 1   48 |  Level 2 · 168 pieces                                  You are here     |
| Level 2  168 |  At this level: steady pulse, small hand shifts, keys of G and F        |
| Level 3  270 |  Named pieces:                                                          |
| Level 4  210 |  [ card ] Minuet in G     [ card ] Melody        [ card ] Arabesque      |
| Level 5  207 |                                                                         |
| ------------ |  All of Level 2      Length v   Kind v   Period v      Show as list    |
| Songs with   |  [thumb] Bourrée in E minor · Bach · 1 min 10                [ Learn ]  |
|  voice 1,299 |  [thumb] Sonatina Op. 36 No. 1, i · Clementi · 2 min         [ Learn ]  |
| Studies   39 |  [thumb] ...                                                            |
+--------------+-------------------------------------------------------------------------+
```

**Option C. A faceted list with "Fits you now".**

```
+----------------------------------------------------------------------------------------+
| Songs                                   [ Title, composer or opus ........ ]  [ Add ]  |
+--------------------+-------------------------------------------------------------------+
| Fits you now  [on] |  312 pieces                          Order: Fits you first  v     |
| Level   1 2 3 4 5  |  [thumb] Minuet in G           Bach · Level 1 · 1 min   [ Learn ] |
| Length  <1 1-2 2-4 |  [thumb] Melody, Op. 68 No. 1  Schumann · Level 1      [ Learn ]  |
| Key     0  1  2  3+|  [thumb] Old French Song       Tchaikovsky · Level 2   [ Learn ] |
| Kind    Pieces 903 |  [thumb] Bourrée in E minor    Bach · Level 2          [ Learn ]  |
|         Songs 1,299|  [thumb] ...                                                      |
|         Studies 39 |                                                                   |
| Period  Baroque 276|                                                                   |
| More v  Form       |                                                                   |
|         Composer   |  Show 50 more                                       50 of 312     |
+--------------------+-------------------------------------------------------------------+
```

**Option D. Shelves in front, facets behind "See all" (recommended).**

```
Home                                                     See all (after a tap)
+-----------------------------------------------------+  +-----------------------------------+
| Songs            [ Title, composer, opus.. ]  [Add] |  | < Songs   Fits you now     312    |
|  Continue                                           |  | Level 1 2 3 4 5   Length v        |
|  [thumb] Minuet in G · bars 7 to 8      [ Learn ]   |  | Key v  Kind v  Period v  More v   |
|                                                     |  | [thumb] Minuet in G     [ Learn ] |
|  Fits you now · Level 1, keys you know  See all 312>|  | [thumb] Melody          [ Learn ] |
|  [ card ]        [ card ]        [ card ]           |  | [thumb] Old French Song [ Learn ] |
|  A step up · one new thing each         See all 41 >|  | [thumb] ...                       |
|  [ card ]        [ card ]        [ card ]           |  |                                   |
|  To sight-read · well below you         See all 96 >|  | Show 50 more          50 of 312   |
|  [ card ]        [ card ]        [ card ]           |  +-----------------------------------+
|  Browse:  Short pieces · Dances · Songs with voice  |
|           · Studies · By period · By composer       |  A zero result names its filter:
|  Written for Piano Forte (8)  ·  Your files (3)     |  "Nothing in Baroque at Level 1.
+-----------------------------------------------------+   [ Remove Baroque (+34) ]"
```

### 5.5 Comparison

| | A. Shelves | B. Level ladder | C. Faceted list | D. Shelves and facets |
|---|---|---|---|---|
| Answers "what should I play?" | partly (editorial) | yes, by level only | yes, with Fits you on | yes, three roles first |
| Answers "Baroque, short, one sharp" | no | partly | yes | yes, one tap in |
| Uses the progression (section 4) | no | level only | yes | yes: the shelves are `fit()` roles |
| Holds at 20,000 pieces | yes | no (the middle levels swell) | yes | yes |
| New data it needs | form, curated id lists | `lvl`, a skills line | period, form, kind | the union of A and C |
| Surfaces to build and test | one | one | one | two (home, grid) and the states |
| Build | about 1 session | about 1 session | about 1 session | about 1.5 sessions (C first, then the home) |
| Boot JS | none | none | none | none (all in `library-view.ts`, which is lazy) |
| Main risk | goes stale; nothing combines | over-claims a percentile level as a teaching order; repeats the Path | a blank-feeling start for a beginner | more states to get right |

### 5.6 Recommendation

**Option D, built engine first:** C's facets and list, then the home shelves as saved filters over it. Why not B: it repeats the Path and gives the least help in the crowded middle levels. Why not A alone: nothing combines. Why not C alone: a beginner should be greeted with what fits, not with a filter panel.

The details that make it work. The home has at most five shelves of three cards each, plus Browse chips; no shelf scrolls sideways. "See all" opens the list with its filters set. Composer moves under More, with counts. Every facet value shows its count against the other active filters, and values with nothing behind them are disabled. A zero result names its filter and offers a one-tap removal showing the count it would restore. Starters become the "Written for Piano Forte" link at the foot, and Your files keep their table there. Rows stay the Songs row grammar. The four-actions-per-row problem (ROADMAP Next 3) is solved separately by the start card carrying Perform, Read through and Memorise. Facet logic lives in `library-view.ts` (lazy, in `bundle.test.ts`'s list), never in `catalog.ts`, which is in the boot chunk (boot is 221,833 of 223,000 bytes, REPO, measured for this pass). Until section 4 lands, "Fits you now" uses the cheap rule: Level at or below the Path level, at most two sharps or flats, at most four minutes. "A step up" and "To sight-read" appear once `fit()` exists.

---

## 6. A thumbnail for every entry

### 6.1 Why 98% of rows look unloaded today (REPO)

A cover is drawn only from a score already on the device: 8 starters, your files, 38 bundled pieces, and anything opened or saved. The other roughly 2,200 library rows draw the honest stub: the clef, the catalogue's key signature and time signature, and no notes. That follows the spec's rule never to fetch a score just for its cover, but it reads as an image that failed to load. Parsing a score costs 10.5 ms on average in Node, and the 22.4 MB corpus is far too much to fetch for covers.

### 6.2 The chosen approach: store the opening bars, engrave on the device

The pipeline already holds each parsed `Song`. It writes `incipit(song)`, the exact first three bars `src/cover.ts` already keeps for every cover (`COVER.keep`), into **one sidecar file**, content-addressed and named in `catalog.json` (`incipits: 'i/<hash>.json'`). On the device, `drawCovers(root, load)` already accepts a loader. Its `load` becomes: the score on the device if there is one, else the sidecar's notes for that id. `keep()` and `draw()` are unchanged. The `local()` test that sends off-device rows to the stub goes. So the engraving is always the play screen's own engraver. A change to the layout redraws every cover with nothing to rebuild, which keeps DESIGN.md's rule that "the cover and the staff cannot drift apart".

Rejected: pre-engraving SVGs at build time. It needs a headless browser in the build, comes to about 0.45 MB gzipped at one size per file, and drifts from the engraver after every layout change unless the whole corpus is rebuilt (Directive 8) (decision 18).

### 6.3 Sizes, measured

| Quantity | Value | Source |
|---|---|---|
| Notes in the first three bars | mean 40, median 36, p90 69, max 200; 90,536 in all | research pass, REPO |
| Sidecar, compact integers, three bars (bar, onset and length in 48ths, pitch, a flag byte for hand, tie, second voice, grace, accidental and tuplet, plus a grace's time and a tuplet's ratio; each bar's metre, pickup length and duration) | **1.38 MB raw, 281 KB gzipped, 195 KB brotli** for all 2,241; 100-piece shards 12.6 KB mean, 17.5 KB max gzipped | measured for this pass over the 30 Oct catalogue, 0 failures |
| The same as plain JSON with every field | 694 KB gzipped | measured; not used |
| The research pass's figure (two bars; pitch, onset, length and hand only) | 142 KB gzipped | not used: it drops ties, tuplets, voices and accidentals, so covers would be drawn wrong |
| The catalogue, for scale | 1.88 MB raw, 305 KB gzipped | research pass |
| Drawing a thumbnail, desktop Chrome | median 2.6 ms, mean 4.6 ms, worst 26 ms | research pass, REPO |
| Thumbnail SVG / card SVG | mean 2.3 KB / 6.6 KB | research pass, REPO |

**Delivery.** One file of about 281 KB gzipped, fetched once when Songs first draws a library cover and kept by the service worker as an immutable file. The page draws stubs until it arrives, then fills them in the existing one-at-a-time queue. Sharding by catalogue index would be worse: a page sorted by level touches rows scattered across many shards. `ponytail:` one file; split it by Level (five shards of about 56 KB) if the first Songs visit on the iPad measures slow. The cover cache stays per session, as now. A small LRU on the drawn SVGs is added if scrolling the whole list ever shows memory pressure (about 5 MB of strings for all thumbnails, INF).

**What is unproven, and the test that proves it.** The sidecar drops each note's performed time (rebuilt from the bar and the onset, except for graces, whose time is kept) and its source part (the cover's painter dims no parts). A test draws 40 sampled pieces both from the sidecar and from `incipit()` of the parsed file and requires the SVG strings to be equal. If they differ, the encoding gains the missing field before anything ships.

### 6.4 The placeholder rule

My reading of the request: entries with no fixed score (generated exercises) would get a general sheet-music placeholder. The answer is that almost nothing needs one:

| Entry | Thumbnail |
|---|---|
| Every library piece (2,241) | its own first bars, from the sidecar |
| Starters, your files, bundled pieces | their own first bars, as today |
| Today's piece rows `again` and `sight` (ROADMAP Known gaps, covers 7) | the piece's own cover, the same call as the piece row |
| Generated exercises (scales, technique) wherever a cover is shown | their own generated notes, which `exerciseMeta` already engraves on the start card and in the Technique preview; the header names a key truthfully, since their mode is known by construction |
| Read stages and Theory trainers | no cover: their rows are about a skill, not a score |
| A library row offline before the sidecar has ever arrived, or a file that will not parse | the existing blank engraved staff (clef, key signature, metre): the general sheet-music placeholder the owner asked for, already inside the identity spec |

### 6.5 What the identity spec allows

- The incipit must be the piece's own bars, in Bravura ink, with beaming, clefs, key, metre and voices kept (SPEC, Library cover system). The sidecar satisfies this.
- "Never silently present inference as source metadata": the header names a key only for the 723 pieces that state a mode, after fix 1 in section 4.8.
- Only two graphics exist ("No keyboard connected", "No music here yet"). A generic sheet-music glyph would be a third, which is a spec change (decision 19). The blank staff needs no change.
- Voice-and-piano covers show what the app plays (the voice folded or dropped), as today. The spec's three-staff covers wait for a third staff in the layout engine (ROADMAP Known gaps, covers 1).
- The spec's sizes stay three. The shelves use the 300 x 200 card three across, so no fourth size is needed (decision 17).

---

## 7. How it slots into practice-path's phases

### 7.1 Pace

There are 486 commits since 18 October, on seven working days: 88 on 19 October, 234 on 27 October and 45 on 1 November (REPO, `git log`). Practice-path calibrated a phase as one agent session of two to four hours, and a multi-part feature landing as one agent branch in that time. The same unit is used here. The owner's look on the iPad has been the slower step, and the profile phases are gated by weeks of data, not by build time.

### 7.2 One combined plan

**P** marks practice-path's phases (unchanged, listed for order); **L, C, S, G, R** are this plan's.

| # | Phase | Builds | Estimate | Tests it leaves | Needs |
|---|---|---|---|---|---|
| 1 | **P1** + **L1** (in flight) | practice-path phase 1, plus `got` on card rows, `sp` on history rows, card rows under `log:cards:<YYYY-MM>` with no ring | P1 as planned; L1 adds about 30 lines | `backup` round trip with month keys and `got`; `clearAll` removes `log:cards:*`; merging two exports keeps every row once | **must ship with P1** (section 7.3) |
| 2 | **C1** Catalogue fix and sidecar | `mode` in `reanalyse.mjs`'s `ANALYSIS`; `meter` only when stated; `kind`; period from composer dates; form from titles; raw grade features stored; the incipit sidecar written by `reanalyse.mjs` and the pipeline, named in `catalog.json`; re-publish | 1 session, plus the owner's read of `catalog-diff` | pipeline test: a MusicXML fixture with `<mode>` keeps it through `reanalyse`; `kind` rules on fixtures; sidecar encode and decode round trip on synthetic songs | nothing; can run now, beside P1 |
| 3 | **S1** Covers for everyone, facets | `drawCovers` loads from the sidecar; the `local()` gate goes; cover on Today's `again` and `sight` rows; the facet engine and list (Option C) with counts, disabled empties and the named zero state; composer under More | 1 session | browser test: 40 sidecar covers equal their full-score covers, string for string; e2e: a library row not on the device shows noteheads; a zero result names its filter and its removal restores the count; `bundle.test` unchanged | C1 |
| 4 | **P2** + **L2** | practice-path phase 2, plus `by` on every history row | P2 as planned; L2 about 10 lines | `next.test`: every offered unit carries `by`; a player's own pick logs `own` | **must ship with P2** |
| 5 | **R1** Habit panel | How you practise (26 weeks), days a week, returns, gaps from `practice:days`; streak number moves off Progress (kept on Today) | 1 session | `profile.test`: returns, gaps and days per week on synthetic days, including a DST change and midnight | nothing; works on day one with the owner's lifetime of days |
| 6 | **G1** Re-grade | the anchor table (60 to 100, owner reviewed); new features; ordinal monotone fit; isotonic map to `lvl`; absolute bands into `grade`; `lvlSd`; Lieder graded on the piano part; `gradeOverride` on anchors | 2 sessions, plus about an hour of the owner's review | anchor hold-out report (target Spearman 0.9, 85% within one level); Op. 68 and Op. 100 pair order better than now; `ladder.test` on `lvl` bands; no study or accomp on the ladder | C1 |
| 7 | **P3** | practice-path phase 3 | as planned | as planned | P2 |
| 8 | **G2** + **S2** Skills, fit, shelves | `skills`, hand ranges and `needs` in the pipeline; `fit()` and its three roles; `nextUp()` step 9 calls it; the Songs home (Option D) with Continue, Fits you now, A step up, To sight-read and Browse; the after-read tap | 2 sessions | tag fixtures (an Alberti bar, a five-finger bar, a scale run, compound metre); 60-piece tag audit; `fit.test`: stretch has exactly one gap, the other roles none, an empty role falls back and never returns nothing; e2e: home shelves show counts and See all opens the list with its filter set | G1, P2 |
| 9 | **G3** First rung | count the Level 1 and 2 windows; if any is under 24, a rule-based writer of CC0 first pieces; the sourcing list | 1 session, plus the owner listening | every written piece passes the pipeline's gates, its tags match its construction, `lvl` below 2 | G2; decision 15 |
| 10 | **R3** Skills table | Skills rows with stage counts, 12-week sparklines from `snap:` and the rows, tempo ceilings | 1 session | Wilson floor (nothing under n = 20); ceiling needs two days | about 3 weeks of L1 data |
| 11 | **P4** + **R4** | practice-path phase 4 (drop back, plateau, lag), plus Where it goes wrong (View 2), "Practise these" as a card set, the Stuck panel on the same plateau code | P4 as planned, plus 1 session | shrinkage ranks a true weak pitch over a noisy one on a synthetic log; the confusion map from `got`; one plateau rule shared by `next.ts` and the profile | about 6 weeks of data |
| 12 | **P5** | practice-path phase 5; the piece Elo starts from `lvl` | as planned | as planned | G1; about 50 sessions a strand |
| 13 | **R5** Story and year | `narrate()` with a reviewed phrase bank; retention half-lives; View 3; Copy a summary; Clear profile | 2 sessions | `narrate` validator: every numeral in the note is in the facts, banned words absent; half-life returns the prior below 20 returns | about 12 weeks of data |

**This plan's new build: about 13 sessions** (C1 1, S1 1, R1 1, G1 2, G2 and S2 2, G3 1, R3 1, R4 1, R5 2, plus about an hour for L1 and L2), on top of practice-path's own. At the observed pace that is two to three weeks of sessions for the catalogue, Songs and progression tracks (C1 to G3). The profile's last views wait about three months for data whatever the pace. Calendar time is set by the owner's reviews (anchors, the diff, listening to G3) and by iPad checks.

**Dependencies.** C1 before S1 and G1. G1 before G2 and P5. P2 before G2. L1 before R3, R4 and R5. P4 and R4 share the plateau code, so build them together.

### 7.3 What must ship alongside practice-path phase 1 or 2

These cannot be backfilled. Hand them to the `feature/path1` builder now:

1. **With phase 1:** `got` on each card row (the pitch played or the answer given on a miss).
2. **With phase 1:** `sp` (timing spread in ms) on each history row that has timing.
3. **With phase 1, or at the latest before about 100 days of card rows exist:** card rows kept by month (`log:cards:<YYYY-MM>`) and never dropped, instead of the 20,000-row ring. It is the same lines as the ring under a different key, and the export's `FIELDS` row merges each month by `ts`.
4. **With phase 2:** `by` on each history row: the `nextUp()` step that offered the unit, or `own`.

Everything else (catalogue fields, `lvl`, the sidecar, the profile views) can be rebuilt from scores or from these rows at any time.

---

## 8. Decisions for the owner

Answer by number. Each has a recommended answer and the alternative. The numbering continues from practice-path's 1 to 10.

11. **Apple Intelligence.** Recommended: don't build it; your iPad Air 4 cannot run it, and the weekly note is written by code, the same on every device. Revisit when an M1 or later iPad is your practice screen and the profile has twelve weeks of facts. Alternative: build the optional narrator now and test it on a borrowed M-series iPad.
12. **One difficulty scale.** Recommended: an internal level from 0 to 9 lined up with Henle's published levels, fitted to 60 to 100 named anchor pieces you review, and shown as the Path's Level 1 to 5 with fixed cut points. This settles CP-29 as "Level 1 to 5". Alternative: keep the percentile grades and fix only the known misses with overrides.
13. **The 1,299 Lieder.** Recommended: their own lane, "Songs with the voice", graded on the piano part, used for read-through, and kept off the ladder and the recommended piece. Alternative: keep them in the main list and the recommendations as now.
14. **Hanon and the other studies.** Recommended: list them under Technique, off the piece ladder and the recommended piece, still searchable. Alternative: keep them as songs, tagged Study.
15. **The thin first rung.** Recommended: after the re-grade, count the pieces at Levels 1 and 2. If any window has fewer than 24, the app writes short free pieces from rules (five fingers, C, G or F, 8 to 16 bars), credited "Written for Piano Forte", and you hear a sample before any ship. Alternative: only hand-written starters, plus sourcing public-domain method books by hand.
16. **The Songs page.** Recommended: Option D, a home of "Fits you now", "A step up" and "To sight-read" shelves, with Browse chips into a faceted list. Alternative: Option C, the faceted list alone (A and B are in section 5.4).
17. **Card size on the shelves.** Recommended: the spec's 300 by 200 card, three to a shelf, with See all opening list rows with small thumbnails. Alternative: add a fourth cover size, 240 by 160, for four to a shelf (an identity spec change).
18. **How every piece gets its thumbnail.** Recommended: ship each piece's first three bars of notes in one lazy file of about 280 KB, drawn by the app's own engraver. Alternative: pre-draw every thumbnail at build time (about 450 KB, and it drifts from the engraver after layout changes).
19. **The placeholder.** Recommended: no new graphic; the blank engraved staff stays for the rare row with no notes yet, and generated exercises draw their own notes. Alternative: a generic sheet-music glyph, which is a change to the identity spec.
20. **Composer.** Recommended: a facet under More, with counts, plus search; no longer the main dropdown. Alternative: keep the dropdown in the tools row.
21. **The Progress page and your data.** Recommended: add the panels in View 1 as the data allows, move the streak number off Progress (it stays on Today), and add Clear profile beside Clear all data. Alternative: keep Progress as it is and add only the Skills table.
22. **A one-tap rating after a first read.** Recommended: yes, an optional "Easier than expected / About right / Harder", used to tune each piece's level for you. Alternative: no tap; infer it from first-read accuracy alone.

---

## 9. Risks, unknowns, and what to measure

**Risks.**

- *The re-grade moves levels the owner is used to.* Path pieces may change level and the ladder may reshuffle. The diff is read by hand before publishing, and the change note lists every ladder and Path piece that moved.
- *Label noise caps accuracy* at about 87% within one level. The display stays at five bands, and `lvlSd` makes `fit()` cautious where evidence is thin.
- *Composer residuals can freeze a mistake.* They are shrunk hard, shown in the diff, and `gradeOverride` wins.
- *Supply, not scoring, may limit Levels 1 and 2.* That is measured in G3 before anything is written.
- *Generated first pieces could read as exercises, not music.* The owner listens first, and they are credited openly.
- *Small-n illusions in the profile.* One learner and weeks of data: the n floors and intervals are the guard. A profile that overstates certainty teaches the wrong thing (Bjork and Bjork, REV).
- *Assisted rows* (waiting, names shown) inflate success. The profile reads `as` and leaves them out, as Over time does.
- *A "weak area" can discourage an adult beginner.* Each is phrased as a handle, never a grade, any panel can be hidden, and "This is wrong" is one tap.
- *Sidecar fidelity.* Covers drawn from the sidecar could differ from covers drawn from the score. The equality test in S1 is the gate.
- *The first Songs visit pays 281 KB.* It is lazy and after first paint, and the stubs stand in until it arrives. If it measures slow on the iPad, split it by Level.
- *Storage.* Raw rows grow by about 3.6 MB a year at a heavy 200 cards a day. If a Progress view passes 50 ms on the iPad or the export passes 20 MB, add rollups.

**Unknowns.**

- Where Henle's lowest levels sit against exam grades (section 4.2), until the anchors are fitted.
- Whether the layout engine needs any field the sidecar drops. The S1 test answers it.
- How fast the profile scans a year of rows on the iPad Air 4. It is measured in R3, not estimated.
- Not opened at the primary text: Apple's Foundation Models reference pages (they render in JavaScript), Magrath's levels, any ABRSM, RCM or Henle crosswalk, the later choice-overload meta-analysis, and Baymard's zero-result guidance (paywalled).

**What to measure** (all local, all in the export):

1. Fit in use: first read-throughs of recommended pieces landing in 75 to 92%, by role (from `by` and the history row). Stretch below consolidate below sight-read.
2. The after-read tap against `lvl`: the share answered "About right" by Level. If it is under half at a Level, that band's cut points are wrong.
3. Songs: shelf taps against See all and search, and zero results with and without the one-tap removal.
4. "Practise these" from the error map: first-try rate on exactly those keys two weeks later, against keys never offered. This is the profile's one hard test.
5. "This is wrong" taps per claim. A high rate means the n floors or thresholds are wrong.
6. iPad timings: the first Songs paint with and without the sidecar cached, and the Progress page's scan time.

**What would change the main calls.**

- *No Apple Intelligence*: an eligible iPad in the loop, and `narrate()`'s notes judged stale by the owner after eight weeks.
- *Raw rows, not rollups*: the scan or export limits above.
- *Henle-aligned `lvl`*: a published, usable exam-board crosswalk, or the owner preferring exam-board words for the cut points. Only the isotonic map changes.
- *Option D*: shelf taps far below See all and search after four weeks. Then C alone is the simpler page.

---

## 10. Sources

Grouped and deduplicated. Labels as at the top; (unv) means read as an abstract or summary only. "Read for this pass" marks the two Apple claims checked by this synthesis.

**Apple Intelligence and on-device models** (IND throughout)
- Apple, How to get Apple Intelligence (iPadOS 27 devices, languages, storage, regions); read for this pass. https://support.apple.com/en-us/121115
- Apple, iPad models that support Apple Intelligence. https://support.apple.com/guide/ipad/aside/ipadd1bec1d9/ipados
- WWDC26 session 319, Build with the new Apple Foundation Model on Private Cloud Compute; read for this pass. https://developer.apple.com/videos/play/wwdc2026/319/
- WWDC26 session 241, What's new in Foundation Models. https://developer.apple.com/videos/play/wwdc2026/241
- WWDC26 session 8016, Foundation Models Q&A. https://developer.apple.com/videos/play/wwdc2026/8016/
- WWDC26 iOS guide. https://developer.apple.com/wwdc26/guides/ios/
- WWDC25 session 286, Meet the Foundation Models framework; session 301, Deep dive. https://developer.apple.com/videos/play/wwdc2025/286/ ; https://developer.apple.com/videos/play/wwdc2025/301/
- Apple Machine Learning Research, foundation models 2025 updates. https://machinelearning.apple.com/research/apple-foundation-models-2025-updates
- Acceptable use requirements for the Foundation Models framework. https://developer.apple.com/support/terms/acceptable-use-requirements-for-the-foundation-models-framework/
- Chrome Prompt API. https://developer.chrome.com/docs/ai/prompt-api ; MDN. https://developer.mozilla.org/docs/Web/API/Prompt_API
- iPadOS 27 supported iPads (unv, secondary). https://www.ithinkdiff.com/ipados-27-supported-ipads-apple-intelligence/
- App Review and third-party AI consent, November 2025 (unv, press). https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai

**Learner profiles and dashboards**
- Bull, S., and Kay, J. (2013). Open learner models as drivers for metacognitive processes. REV. https://research.birmingham.ac.uk/en/publications/open-learner-models-as-drivers-for-metacognitive-processes/
- Open learner models in higher education, systematic review (2025). MA (unv). https://public-pages-files-2025.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1760183/pdf
- Open learner model drill-down and self-assessment (thesis). OBS (unv). https://etheses.bham.ac.uk/id/eprint/8590/
- Matcha, W., et al. (2020). Learning analytics dashboards from a self-regulated learning perspective. MA. https://der.monash.edu/a-systematic-review-of-empirical-studies-on-learninganalytics-dashboards-a-self-regulated-learning-perspective/
- Jivet, I., et al. Learner choice of dashboard indicators. OBS (unv). https://www.learning-analytics.info/index.php/JLA/article/download/9303/7978/48995
- McPherson, G., and Zimmerman, B. Self-regulation of musical learning. REV. https://findanexpert.unimelb.edu.au/scholarlywork/339794-self-regulation-of-musical-learning--a-social-cognitive-perspective-on-developing-performance-skills
- Osborne, M., et al. A microanalysis intervention with musicians. OBS, small (unv). https://findanexpert.unimelb.edu.au/scholarlywork/1448953-using-a-microanalysis-intervention-to-examine-shifts-in-musicians'-self-regulated-learning
- Jørgensen and Hallam, practice quality review. REV (unv). https://periodicos.ufmg.br/index.php/permusi/article/view/54675
- Hallam, S., et al. (2012). Practice strategies. OBS. https://discovery.ucl.ac.uk/id/eprint/1497551/
- Miksza, P. Self-regulated practice measures. OBS (unv). https://kb.osu.edu/items/d31d3661-f1e9-4ffc-9b40-a190d82413f6
- Settles, B., and Meeder, B. (2016). Half-life regression. EXP, vendor-run. https://aclanthology.org/P16-1174/
- Cepeda et al. (2006), Lally et al. (2010), Wilson et al. (2019), Bjork and Bjork (2011): see `learning-science.md` and `practice-path.md`.
- Products (IND): Strava Fitness and Freshness https://support.strava.com/hc/en-us/articles/216918477-Fitness-and-Freshness ; Garmin Training Status https://www8.garmin.com/manuals/webhelp/GUID-3B607AEB-9EB5-4BF3-A38D-1F9926BB9F65/EN-US/GUID-6F81BF5B-B49A-4506-95E2-0F4A04D8B319.html ; Whoop Recovery https://www.whoop.com/au/en/thelocker/how-does-whoop-recovery-work-101/ ; Chess.com Insights https://support.chess.com/en/articles/8708925-what-is-insights ; Lichess Insights https://lichess.org/@/lichess/blog/chess-insights/VmZbaigA ; Duolingo year in review https://uxdesign.cc/duolingo-wrapped-your-year-in-languages-streaks-and-progress-43f7f95c3eac

**Difficulty, grading and curriculum**
- Henle Verlag, Levels of Difficulty. PRAC. https://www.henle.de/Levels-of-Difficulty/
- ABRSM Piano Syllabus 2019-20. PRAC. https://www.lessonface.com/sites/default/files/teaching-materials/64893/piano_syllabus_2019_2020_complete.pdf
- Royal Conservatory, Piano Syllabus 2022. PRAC. https://teacherportal.rcmusic.com/getattachment/57f3734d-97e5-4777-b67e-4b1111ee31a3/piano-syllabus-2022-edition.pdf
- Piano Syllabus (site). PRAC. https://www.pianosyllabus.com
- Magrath, J. The Pianist's Guide to Standard Teaching and Performance Literature. PRAC (unv). https://www.goodreads.com/book/show/277481
- Sebastien, V., et al. (2012). Score Analyzer. ISMIR. OBS, n = 50. https://ismir2012.ismir.net/authors/event/papers/571_ISMIR_2012.pdf
- Ramoneda, P., et al. (2022). Mikrokosmos difficulty. ICASSP. OBS, small. https://arxiv.org/abs/2203.13010
- Ramoneda, P., et al. (2024). CIPI: combining piano performance dimensions for difficulty. ESWA 238. OBS. https://arxiv.org/abs/2306.08480
- Ramoneda, P., et al. (2023). Difficulty from sheet-music images. ISMIR. OBS. https://arxiv.org/abs/2309.16287
- Ramoneda, P., et al. (2025). PSyllabus, audio difficulty. OBS. https://arxiv.org/abs/2403.03947 ; dataset https://zenodo.org/records/14794592
- Nakamura, E., and Yoshii, K. (2018); Nakamura, Ono and Sagayama (2014). Fingering-cost difficulty. OBS (unv). https://arxiv.org/abs/1808.05006 ; https://archives.ismir.net/ismir2014/paper/000251.pdf
- Middle-C and mixed intervallic reading, thesis. OBS, small. https://ruor.uottawa.ca/items/91b91a8b-a32c-4b1c-b5d2-6127d321ef65
- Bruner (1960), spiral curriculum; Harden and Stamper (1999). REV. https://en.wikipedia.org/wiki/Spiral_approach
- Guadagnoli, M. A., and Lee, T. D. (2004). Challenge point framework. REV (unv). https://experts.mcmaster.ca/scholarly-works/1313883
- Mishra, J. (2014). Sight-reading meta-analysis. MA (abstract only). https://journals.sagepub.com/doi/10.1177/0305735612463770
- Pelánek, R. (2016). Elo rating in adaptive educational systems. REV. https://www.fi.muni.cz/~xpelanek/publications/CAE-elo.pdf

**Organising a catalogue**
- Hearst, M. Search User Interfaces, ch. 8, Integrating navigation with search. REV. https://searchuserinterfaces.com/book/sui_ch8_navigation_and_search.html
- Yee, K.-P., Swearingen, K., Li, K., and Hearst, M. (2003). Faceted metadata for image search and browsing. EXP, small. https://courses.cs.washington.edu/courses/cse454/13wi/papers/yee-chi03.pdf
- Hearst on faceted finding. REV. https://boxesandarrows.com/faceted-finding-with-super-powered-breadcrumbs/
- Marchionini, G. (2006). Exploratory search. REV. https://ils.unc.edu/courses/2018_fall/inls509_001/Reading/Marchionini06.pdf
- Scheibehenne, B., Greifeneder, R., and Todd, P. (2010); reply (2011). Choice overload. MA. https://abcwest.cogs.indiana.edu/pmwiki/pdf/scheibehenne.options.2010.pdf ; https://abcwest.cogs.indiana.edu/pmwiki/pdf/scheibehenne.reply.2011.pdf
- Ranganathan, Colon Classification. REV. https://en.wikipedia.org/wiki/Colon_classification ; https://isko.org/cyclo/colon_classification
- Nielsen Norman Group, progressive disclosure. IND. https://www.nngroup.com/videos/progressive-disclosure/
- Filtering practice and zero results (unv, vendor summaries). IND. https://docs.tweakwise.com/docs/best-practises-filtering ; https://baymard.com/research-articles/no-results-page
- Alvino, C., and Basilico, J. (2015). Learning a personalized homepage (Netflix). IND. https://gwern.net/doc/www/netflixtechblog.com/2f5717e8bbdc98d2caf5c7a972359fbb7e7c0b28.html
- Gomez-Uribe, C., and Hunt, N. (2015). The Netflix recommender system. ACM TMIS. IND. https://gwern.net/doc/reinforcement-learning/exploration/2015-gomezuribe.pdf
- Carousel use on mobile (unv). IND. https://www.smashingmagazine.com/2015/02/carousel-usage-exploration-on-mobile-e-commerce-websites
- content-visibility. IND. https://web.dev/articles/content-visibility
- Products (IND; store text and help pages, unv where noted): Apple Music Classical https://support.apple.com/guide/apple-music-classical/dev8de5fc472/web ; IMSLP browse https://IMSLP.org/wiki/Browse_by_genre ; Yousician filters https://yousician.com/blog/new-on-yousician-song-genres-and-enhanced-song-filters ; Skoove https://help.skoove.com/en/articles/5417614-what-songs-does-skoove-offer ; flowkey (unv) https://apps.apple.com/app/flowkey/id1020357408 ; Simply Piano (unv) https://www.hellosimply.com/sheet-music

**In the repo** (REPO): `design/identity/SPEC.md`, `DESIGN.md` (Cover, Library tools, Progress page), `src/cover.ts` (`incipit`, `keep`, `drawCovers`, `paint`), `src/cover-draw.ts` (`draw`), `src/store.ts` (`HISTORY_KEEP`, `TOUCH_KEEP`, `practice:days`, `snap:`), `src/bundle.test.ts` (budget 223,000; boot measured at 221,833), `scripts/library/pipeline.ts` (`judge`, the `mode` write at line 392), `scripts/library/reanalyse.mjs` (`ANALYSIS`), `scripts/library/labels.json`, `.cache/library/out-reanalyse/catalog.json` (30 Oct, 2,241 pieces), `docs/research/practice-path.md`, `learning-science.md`, `ios-native.md`, `public-domain-sources.md`.
