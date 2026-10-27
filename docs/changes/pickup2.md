# Pickup detector, second pass (branch feature/pickup2)

Follows `tempo2.md` section 2. Goal: a detector whose constants were not fitted on the set it is scored on, with more evidence than metric weight alone, and no more false pickups (a false pickup moves every barline). Nothing pushed, deployed or published.

## Result in one paragraph

False pickups fall from 17 to 5 over the set, and that holds in both directions of the split. Correct matches are about level, not clearly up: +6 on the held-out half, but training on the other half and testing on this one gives -6 against the old detector (which had its three constants tuned on the whole set, so it has the advantage in both comparisons). Fewer true pickups are found (61 of 128 against 68). The detector is now safer rather than sharper; the evidence available to it (notes only, 128 positives) does not separate the missed pickups, see "Not done".

## Ground truth and split

Same idea as `tempo2.md`: each cached Mutopia MIDI (raw, repeats not unfolded) against the `\partial` of its own .ly, one `\score` and one consistent value or none. 444 pieces here (424 there; the count differs because ids and the "consistent" rule were rebuilt from `lib.mjs` `sourceOf`). Two reader fixes against the obvious version: `\partial8` with no space, and `\set Timing.measurePosition = #(ly:make-moment n d)` (mutopia-897 and 1422 are pickups of 0.5 that a plain `\partial` grep calls "none"; they are not false pickups). Pieces with fewer than 6 chords in the first meter (48) are never given a pickup, before or after.

Split: hash (FNV-1a) of the **work number** (the N of `mutopia-N-k`, so movements of one work never straddle the split), low bit. Half 0 = tune, 229 pieces, 67 pickups; half 1 = held-out, 215 pieces, 59 pickups. I first split by full id, saw that siblings (1497-3..7, 1935-x) leaked across, and switched before fitting the final model. Exploration of which features exist looked at both halves; the weights and the bias were fitted and chosen on half 0 only, and half 1 was scored once with the final code. Honest caveat: that is a cleaner protocol than before but not a blind test set.

Harness and data (raw MIDI, .ly, per-piece results) live in the session scratchpad, not in the repo; they are rebuilt from the cache with `sourceOf()`.

## Confusion tables (detected vs the .ly)

ok = same length, miss = none detected, false = pickup where there is none, wrong = a pickup of the wrong length.

| | tune (229) | held-out (215) | whole (444) |
|---|---|---|---|
| before | ok 188, miss 32, false 5, wrong 4 | ok 174, miss 28, false 12, wrong 1 | ok 362, miss 60, false 17, wrong 5 |
| after | ok 190, miss 36, false 1, wrong 2 | ok 180, miss 31, false 4, wrong 0 | ok 370, miss 67, false 5, wrong 2 |

Pickup / no pickup only, whole set: truth pickup 128, truth none 316. Before: 68 found, 60 missed, 17 false. After: 61 found, 67 missed, 5 false.

By true length (whole set, exact matches before -> after): none 299 -> 311 of 316; 0.5 or less 32 -> 34 of 57; 1 beat 23 -> 18 of 46; 1.25 to 1.5 3 -> 3 of 9; 2 or more 5 -> 4 of 16.

Reverse direction (fit on half 1, test on half 0, same features, bias 0.65, short-head pieces left out of both sides): ok 168, miss 35, false 0, wrong 0 against the old detector's 174 / 20 / 5 / 4 on the same 203 pieces.

Over all 747 cached MIDI (not only those with ground truth): 672 identical, 75 change pickup, 32 change bar count. Of the 44 changed ones with ground truth: 23 now match and did not, 15 matched and no longer do, 6 wrong both times. The 31 changed ones without ground truth: 23 pickup -> none, 7 none -> pickup, 1 other length. Without ground truth, 68 pieces had a pickup before and 52 after, of 303.

Regressions (matched, now not): mutopia-85, 161, 163, 379, 511, 83, 993, 1483, 1622 (pickup of 1 beat or 0.5 now missed), 972, 1955 (0.5 missed), 1650 (2 missed), 913 (2 -> 0.5), 1497-7 and 1687 (no pickup -> false pickup of 1). Fixed: 23, among them 220, 236, 964, 994, 1741, 2033 (the right-hand-late bug below). `src/pickup.test.ts` loses its rows for 85 and 163 for that reason.

## What was there, what was found

- **Bug, `head[0]`.** The old guard `head[0].x < u - 0.2` meant "the first onset is inside the pickup", but `head` is the right hand's chords followed by the left hand's, so `head[0]` was the first *right-hand* chord. A piece whose right hand rests first (bass or left-hand pickup first) could never get a pickup. Now the minimum over both hands. Alone this fixes 5 misses and adds 5 false pickups with the old scoring (measured), so it only pays with the rest.
- **The classic end signature was only a hint.** The old code used one fact about the end: the last onset on a barline, worth 0.02 per onset. Measured on the single-meter pieces: of 255 pieces without pickup, 67% end on a whole number of bars (file length `T` a multiple of the bar); of 100 pieces with a pickup, 50% do too (bar 1 plus the last bar make a full bar: the "engraved signature") and 24% end a whole bar after the pickup (`T - u` a multiple of the bar), 26% neither. So "bar 1 + last bar = one bar" cannot tell a pickup from none (it holds for both); only the second case, `T - u` on a bar, is evidence, and it is now a feature (`tail`).
- **The old ratio test is lenient.** Old rule: pickup if `S(u) / (1 + 0.1 * onsets before) > 0.9 * S(0)`. Where `S(u)` equals `S(0)` (same note value everywhere) one onset in front gives 0.909 > 0.9, so it needs almost no evidence. I did not isolate how much of the old 17 false pickups this explains: a synthetic all-quarters file does not trigger it on the old code (the test below passes on both).

## The detector (`pickupOf()` in `quantize.ts`)

Still a small pure function over the first meter's chords, half-beat candidates `u`, no dependency. It now takes the argmax of a sum of cues and requires it to beat no pickup by `bias`:

| cue | weight | meaning |
|---|---|---|
| `lr` | 2.3 | log ratio of duration-weighted onsets on `u`'s barlines to those on grid 0 (the old measure, as a log) |
| `before` | -1.65 | times log(1 + onsets in front of `u`): a pickup is a fragment |
| `last` | 1.5 | the last onset sits on a barline of this grid |
| `lone` | 1.5 | the left hand has not played before `u` and plays later (texture entry) |
| `long` | 1.3 | a note on `u` longer than 1.5 times the mean before it |
| `tail` | 1.2 | the file ends a whole number of bars after `u` (only when the meter never changes) |
| `at`, `at2` | -0.9, -0.8 | times `u/B` and `(u/B)^2`: long pickups are rare |
| `bias` | 0.65 | pickup must beat no pickup by this |

Weights are a conditional logit (softmax over candidates per piece, L2 = 1) fitted on half 0, rounded to 2 digits. `bias` = the fitted intercept for "no pickup" (0.39) plus a margin of 0.25, the margin chosen on half 0 alone (cost = misses + 2 false + wrong, five-fold by work over half 0; 0.65 was lowest of 0.35 to 1.0). Forward selection by cross-validated log-likelihood on half 0, over about 25 candidate cues, picked `last`, `lone`, `long`, `tail` first and then the position terms; later picks (below) added too little.

Tried and dropped (no cross-validated gain, or too little for the code): bass placement (lowest notes on the barline), thick chords on the barline, harmonic change at the barline (bass pitch class changes there more than elsewhere: small gain, kept out), phrase restarts after a rest on the barline, a first onset played by the left hand only (it gained a little in cross-validation, but I could not give it a musical reason, so it stays out), peak rank of `S(u)` among all shifts, a density jump at the downbeat, quarter-beat candidates (0.25, 0.75: more false pickups for the same hits, again).

## Tests

`src/quantize.test.ts`: a pickup played by the left hand alone (fails on the old code: the `head[0]` bug); no pickup from plain quarters in both hands; a one-beat pickup from the left hand entering plus a closing chord on the barline (both pass on the old code too, kept as guards). Two existing synthetic cases changed: "three eighths in 6/8" and "two beats in 4/4" (the ones with a short mid-bar note) closed on a chord half way into the last bar, which now reads as "the file ends on a barline of grid 0" and wins; they close on the barline now (`closeMid = false`). With a mid-bar close and a pickup that long the detector returns none. `src/pickup.test.ts` drops two rows (85, 163). `npx tsc --noEmit` and `npx vitest run` (684 passed, 1 skipped) are clean; the cache-backed `pickup.test.ts` rows were not run here (no `.cache/library/*/p/` in this checkout), but the same 35 rows were run by hand against raw MIDI: pickup and bar-1 notes agree for all of them (bar counts differ only because raw MIDI is not repeat-unfolded).

## Not done

- 67 of 128 true pickups are still missed, mostly one-beat pickups in 3/4 and 4/4 whose `S` ratio is 0.9 to 1.05: the notes do not say. Candidates for more evidence are the .ly-free ones we cannot see in a MIDI (velocity is constant, no dynamics, no slurs), or the harmony. Where a .ly exists, `\partial` itself is the answer and the pipeline could read it (the catalogue builder already holds the .ly): that is the direct fix for Mutopia, and the detector then only matters for MIDI without a .ly. Not built, not asked.
- Sixteenth-note pickups (0.25, 0.75, 1.25; 11 of 128) are not tried.
- The weights come from 59 + 67 positives in one corpus (mostly Baroque and Classical engraved keyboard music); performed MIDI is only covered by the old jittered fixtures. A pickup longer than a beat in a file closing mid-bar is missed by construction (see Tests).
- Ground truth carries noise: some "none" pieces are movements given a sibling's .ly by `pickLy`, and mutopia-475-x (Pictures at an Exhibition) are still scored as false pickups of 3 against a .ly that states none.
