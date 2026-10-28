# Chord evaluation, round two: real ground truth, and a better chord match

Branch `feature/chordeval2`. Follows `chordeval.md`, which found no written harmony in our own corpus and stopped. This one fetched analysed corpora, scored `src/lead.ts` against them, and retuned the match on half the pieces, reading the other half only to report.

**Result.** On 256 analysed pieces (23,177 half-bar windows) the Lead sheet's chords had the right root in 64.6% of windows, root and triad quality in 63.1%, and exact (seventh too) in 54.7%. After retuning, on the held-out half of the pieces (128 pieces, 12,295 windows, never used to choose anything): **root 62.3 -> 70.1, triad 60.7 -> 68.5, exact 52.8 -> 62.8.** Nothing was heard, and no browser or iPad was touched.

## Data

Evaluation only. Nothing from these corpora is in the repo; they live in `.cache/chordeval/` (already git-ignored by `.cache`). Fetched with `git clone --depth 1`.

| Source | What | Licence (checked in the repo) |
|---|---|---|
| When in Rome, `MarkGotham/When-in-Rome` | Roman-numeral analyses (`analysis.txt`, rntxt text) beside a `score.mxl` | README: new content and conversions CC BY-SA 4.0; analyses that came from elsewhere keep their source licence |
| ...its Mozart sonata analyses (54 movements) | converted from DCML | CC BY-NC-SA 4.0 (the file header says so) |
| ...its OpenScore Lieder analyses (176 read) | by M. Gotham and "Working in Harmony" contributors; scores CC0 | repo's CC BY-SA 4.0 |
| ...its Bach WTC I (24) and Chopin (3) | M. Gotham | repo's CC BY-SA 4.0 |
| `DCMLab/mozart_piano_sonatas` | harmony tables, used only to check my reader | CC BY-NC-SA 4.0 |

The NC clause is not a "free licence" in the usual sense, so I checked whether the result depends on it: the same search without any Mozart piece gives the same seven constants (below). The shipped numbers do not come from NC data alone.

Used: every folder of `Piano_Sonatas`, `Keyboard_Other` and `OpenScore-LiederCorpus` that has both a local `score.mxl` and an `analysis.txt` (260 folders; 256 read, 4 failed: `K282/2`, and three Lieder, where `fromMusicXml` plays 152 bars for 76 measures, 36 for 20, 24 for 12 and 38 for 20; I did not chase why). Not used: Beethoven sonatas (the corpus has the analyses, but the scores are remote MuseScore 3 files and there is no converter here; see Open), the 70 string-quartet movements (not keyboard-reducible), the Textbooks examples and the four Variations and Grounds.

By corpus: Lieder 176 pieces (Schubert 46, Reichardt 29, Schumann R. and C. 28, Hensel 19, 20 more composers), Mozart sonatas 53, Bach WTC I 24 (preludes), Chopin 3.

## How it was scored

`src/chordeval.ts` (pure, tested in `src/chordeval.test.ts`) reads rntxt into chords by measure and beat: root pitch class and a class of `M m dim aug 7 maj7 m7`, in absolute pitch, with the key in force.
- Secondary chords by the key they point to (`V65/V`, `viio7/ii`, nested `V/V/V`); inversions and figures; `[no3][add4]` ignored; `N` as a major triad on the flat second; `Ger` as a dominant seventh on the flat sixth; half-diminished and diminished sevenths both as `dim` (the app has no half-diminished shape); `Cad64` as the dominant it stands for.
- Skipped and counted: Italian, French and Swiss sixths and anything unparsed: **172 of 27,241 labels (0.6%)**. A skipped label leaves an unknown chord in the timeline, so the one before does not carry over it; those windows are not scored.
- `m5-8 = m1-4` copy lines, `Time Signature:` changes (6/8 beats are dotted quarters), keys, pickups (`m0`), `Form:` sections.

**The reader was checked against its source.** For the 53 Mozart movements I compared it with the DCML harmony tables the analyses came from (their `root` is independent of my Roman-numeral code): 14,888 chords, **root agrees in 99.1%, class in 99.1%** (`dcml-check.txt` lists the rest; they look like version drift between the two files, not reader errors). The check caught one real bug (beats written to two decimals, `b1.67`, landing a hair after the quarter) and made me look at what `Cad64` should mean.

Each score is read by the app's own `fromMusicXml` with repeat and volta marks stripped (otherwise a repeated bar is two bars for one analysed measure), then walked with `windows()` from `pedal.ts`, the Lead sheet's own half bars. The truth at a window is the chord the analysis has sounding at the window's **start** (last label at or before it, measure number and quarter-note offset). Bars are mapped to analysis measure numbers through the XML `number` attributes (a pickup is `0`).

Scores: **root** = same pitch class; **triad** = root and the triad class (sevenths count as their triad); **exact** = root and the same class including the seventh (`aug` is never predicted, so it always misses).

Baselines (all given advantages the app does not have):
- *tonic (key signature)*: the major tonic of the signature, always. Honest, no annotation.
- *tonic (local key, oracle)*: the tonic of the key the analysis says is in force, major or minor.
- *tonic/dominant, best fit (oracle)*: per window, whichever of I and V of the local key fits the notes better.
- *tonic then dominant by half bar (oracle)*: I on the first half of the bar, V on the second. (The task said "tonic/dominant by bar"; I took both readings.)

## Results (all 256 pieces, 23,177 windows; percent: root / triad / exact)

| | root | triad | exact |
|---|---|---|---|
| Lead sheet, before | 64.6 | 63.1 | 54.7 |
| **Lead sheet, after** | **71.8** | **70.2** | **64.4** |
| tonic of the key signature | 25.2 | 23.8 | 22.0 |
| tonic of the local key (oracle) | 42.2 | 40.2 | 39.0 |
| tonic or dominant, best fit (oracle) | 59.6 | 57.4 | 44.6 |
| tonic then dominant by half bar (oracle) | 41.1 | 39.5 | 33.5 |

Each piece counted once instead of each window: 71.4 / 70.0 / 63.8 after.

Held-out half only (128 pieces; the tune half is 128 other pieces):

| | root | triad | exact |
|---|---|---|---|
| before | 62.3 | 60.7 | 52.8 |
| **after** | **70.1** | **68.5** | **62.8** |
| tonic or dominant, best fit (oracle) | 58.4 | 56.1 | 44.2 |

The split is by piece, shuffled with mulberry32 seed 20261027, first half tunes. Movements of one sonata can fall on both sides, so there is some leakage of style between halves; piece-level, not composer-level.

**By corpus and composer, after (before in brackets), root / exact:** Lieder 74.7 / 67.5 (68.4 / 57.7); Mozart sonatas 69.1 / 62.1 (60.9 / 52.9); Bach WTC and Chopin 66.8 / 56.6 (59.3 / 44.3). Schubert 78.5 / 72.4 (73.8 / 64.3), Schumann 69.0 / 61.3 (61.7 / 51.7), Bach 63.8 / 53.4 (55.1 / 42.0), Brahms 69.3 / 60.7 (57.7 / 49.2), Wolf 60.8 / 48.9 (54.2 / 42.8, 7 pieces). Mozart by movement: first 70.8 / 63.2, slow 66.3 / 58.9, finale 68.5 / 62.2. Lieder sections named "verse": 77.5 / 70.4. Every composer with 300 or more windows improved on root and exact. The full tables (all composers, by corpus, by section) are what `CHORDEVAL=1` prints into `.cache/chordeval/report.txt`.

**The resolution ceiling.** In 8,546 of 23,177 windows (37%) the analysis changes chord inside the window. There the Lead sheet is right on root 63.5% (was 50.8%); where the window holds one chord, 76.6% (was 72.7%), exact 71.1%. A half bar cannot name two chords, so finer windows are the largest thing left (Open, 1).

**Cadential six-four.** The analysts label `Cad64` and mean V; the notes sound as I over a dominant bass. I scored it as V (3.5% of the labels are `Cad64`). If the tonic is also accepted, root goes 71.8 -> 74.1.

**What the errors are** (held-out, after): of windows with the wrong root, the largest group by far is a root a fourth above the truth (945 of 12,295 windows): the tonic named where the analysis says V. Accepting the six-four's tonic recovers 2.3 points of the roughly 28 lost, so it is only part of this group; I did not break the rest down. Then the relative-minor and third-up confusions (a C chord read as Am or Em). Among right-root windows, `M -> 7` (457) is now more common than `7 -> M` (129): the match over-calls dominant sevenths a little.

## Tuning

`chordAt()` in `lead.ts` is the old match (`pedal.ts`'s template fit: pitch-class weight by how long each note sounds, minus the other notes, minus 0.15 per missing tone, a seventh must beat its triad by 0.3) with terms added and the numbers in an exported `TUNE`. The search saw only the tune half (objective: mean of root and exact), a grid per term, three rounds of coordinate search, then backward elimination of any term worth under 0.3 points. Held-out numbers are shown beside each, never used to choose.

One term at a time from the old values (tune / held-out, root / triad / exact; start: tune 67.2 / 65.9 / 56.8, held 62.3 / 60.7 / 52.8):

| term | best on tune | held-out |
|---|---|---|
| root bonus: chord whose root is the lowest note sounding as the window opens | 0.3 | 66.8 / 64.8 / 56.8 |
| notes struck as the window opens weigh more | +2 (weight x3) | 64.2 / 62.5 / 54.9 |
| key-signature prior: chord inside the signature's scale | 0.1 | 62.8 / 61.5 / 53.6 |
| major-seventh penalty | 0.15 | 62.2 / 60.6 / 53.7 |
| minor-seventh penalty | 0.15 | 62.7 / 61.2 / 53.5 |
| seventh margin retuned (0.3 -> 0.2) | 0.2 | 62.1 / 60.5 / 51.4 |
| missing-tone penalty (0.15 -> 0) | 0 | 62.1 / 60.4 / 52.5 |

Tried and dropped, no gain on either half: weighting by duration to a power (1 to 3; passing tones are already short), a separate bass-pitch-class boost beyond the root bonus (under 0.15 points once the root bonus is there), a bonus for I, IV, V and the relative minor's i, iv, v (under 0.1), a bonus for notes on a quarter-note beat (0.2). Shipped, all together: **`seventh 0.05, maj7 0.3, m7 0.3, strong 2, root 0.1, dia 0.1, missing 0.15`** (tune 73.7 / 72.2 / 66.2; held-out 70.1 / 68.5 / 62.8).

Take one term out of the shipped set (held-out root / triad / exact): without the seventh margin 68.5 / 66.9 / 59.4; without strong 68.5 / 67.1 / 60.7; without root 66.8 / 65.5 / 60.1; without dia 69.7 / 67.7 / 61.6; without maj7 68.1 / 66.6 / 52.9; without m7 65.6 / 63.8 / 56.6. The key prior is the smallest: 0.4 root, 1.2 exact.

Checks that it is not a quirk of this split or of NC data:
- Searched on the *held-out* half instead: the same constants but `strong 3` and `missing 0.4`; the other half goes 67.2 / 65.9 / 56.8 -> 73.6 / 72.3 / 66.3.
- Searched without any Mozart piece (the NC-SA analyses): exactly the shipped constants; on the held-out non-Mozart pieces 64.3 / 62.4 / 53.4 -> 70.9 / 69.2 / 63.5.

One deliberate give-back. `strong` counts a note struck as the window opens only if it lasts a quarter of the window or is the lowest note sounding (a short Alberti-bass note on the beat is the chord; a 0.2 s melody note on the beat is an ornament). Without the exception held-out was 70.4 / 68.8 / 63.7 against the shipped 70.1 / 68.5 / 62.8, and the existing `lead.test.ts` case "a passing note does not turn a triad into a seventh" (a 0.2 s B on the beat of a held C chord) would read Cmaj7. I kept that test as it was. If the lead prefers 0.9 points of exact to that test's wording, drop `BIG` and the `n.p === low` test.

## What changed in code

- `src/lead.ts`: `chordAt(song, a, b, tune = TUNE, notes)` (the match, exported), `TUNE`, `SHAPES` exported; `chordsOf` unchanged in output shape and calls `chordAt`. Own template match now; it no longer uses `pedal.ts`'s.
- `src/pedal.ts`: `chordIn` lost its `shapes` and `extra` parameters and its export, which only the Lead sheet used; `changes()` and the pedal coach behave as before (`pedal.test.ts` and `coach.test.ts` pass unchanged).
- `src/lead.test.ts`: one new case (the chord struck on the beat wins over the notes that follow). The 9 old cases pass unchanged.
- `src/chordeval.ts`, `src/chordeval.test.ts` (11 tests): the Roman-numeral reader.
- `src/chordeval.run.test.ts`: the evaluation, skipped unless asked. `CHORDEVAL=1 npx vitest run src/chordeval.run.test.ts` writes `.cache/chordeval/report.txt` and `dcml-check.txt`; `CHORDTUNE=1` runs the search and writes `tune.txt`. About 40 s each. They read `.cache/chordeval/wir` (clone of When in Rome) and `.cache/chordeval/dcml-mozart` (clone of the DCML Mozart repo, for the check only).
- The boot-size ratchet (`bundle.test.ts`, 275,000) went over by 34 bytes with the first version; I trimmed the match until it passed. There is almost no room left in that budget.

## Verified

`npx tsc --noEmit` clean; `npx vitest run`: 57 files passed, 760 tests passed, 4 skipped (the 3 evaluation runs, which need the env variables, and the 1 that was skipped before). `lead.test.ts`, `pedal.test.ts`, `coach.test.ts` and `bundle.test.ts` pass. The evaluation numbers above come from the runs listed, on 2026-10-28.

## Not verified, and caveats

- **The truth is an analyst's functional reading, not a lead sheet.** Passing chords, suspensions and embellishments are not chords there. The scores measure agreement with harmonic analysis, which is what the Lead sheet's chord symbols claim to follow; a performer's lead sheet would differ (the six-four above is the clearest case).
- Repertoire is classical: Mozart, Schubert, Schumann, Bach preludes, Chopin, two dozen Lied composers. Nothing here says how it does on a hymn, a pop song or a Beethoven sonata's thick texture. Chopin has 3 pieces. The Lieder include the voice part in the notes, as the app does before it extracts the melody.
- Slash bass is not scored (analyses give inversions, but the Lead sheet's rule, 31% slash chords, is unchanged and unmeasured). The seventh classes are coarse: `dim` lumps dim7 and half-diminished; `aug` and ninths are not predicted.
- The key prior uses the key signature only. A detected local key was not built; the analysis's own key would be an oracle, and the one-term gain of the signature prior was small.
- Exact-match for sevenths is the weakest score (the analyst writes a seventh when it is structural, the template sees a seventh when it sounds).
- Four pieces did not map bars to measures and were dropped; 0.6% of labels are unsupported; windows before the first label are not scored.
- Overfitting: seven constants against 11,000 tune windows, two independent searches agree. The grid edges were extended until no best sat on one, except `strong` on the held-out search (3, the grid had 5).
- Nothing was run in a browser; the Lead sheet's UI strings are untouched. The e2e Lead sheet feature (21) was not run; it only checks that chord symbols exist (`.cname`).

## Open (ROADMAP candidates; I did not edit ROADMAP.md)

1. **Finer windows.** 37% of windows hold a chord change. Beat-level windows, or a window cut at the strongest onset change, is the single largest lever (root 76.6% where one chord, 63.5% where two). The harness already scores any window list; change `windows()` and read the table. Needs a design for how the staff draws two symbols in a bar (the Lead sheet already drops a symbol that would touch another).
2. **Beethoven sonatas** (and DCML's Corelli and Liszt tables): the analyses are in When in Rome, but the scores are MuseScore 3 files. The DCML repos publish `notes/*.tsv` and `measures/*.tsv`; a Song can be built from those with `build()` (about 100 more movements). Not done.
3. `pedal.ts`'s `changes()` still uses the old plain template match, so the pedal coach and the Lead sheet can now disagree about where a chord changes. The pedal coach has no ground truth to tune on (it would need recorded pedal data). Sharing `chordAt` is the likely move once the lead decides.
4. A selectable chord reading for `Cad64`-style six-fours: the sounding chord (C/G) or the function (G). Today the Lead sheet names what sounds.
5. Four pieces whose bars do not map to measures (`K282/2` and three Lieder): worth a look, they may be a `fromMusicXml` repeat bug (a piece with a `D.C.` or a jump).
6. A maj7 penalty of 0.3 means a clear major seventh chord with equal weight still names as Cmaj7 (the unit test says so) but a seventh that is partly passing will not; in the corpus a major seventh is 0.1% of chords. Material that is jazz or pop would want it lower.
