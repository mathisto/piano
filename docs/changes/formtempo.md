# A pace from the form, for scores that name none (branch feature/formtempo)

Follows `tempo.md` and `tempo2.md`. Nothing was pushed, deployed or published; quartz was not touched. The candidate catalogue is `.cache/library/out-formtempo` (worktree `piano-wt-formtempo`).

## Finding first: the form predicts the pace for five forms, and for the rest nothing beats a flat 100

Checked against the live catalogue (2,241 pieces): 1,945 of them state their pace (no `no-tempo`/`tempo-estimated` flag: a number in the .ly, a metronome mark, a `<sound tempo>`), 633 Mutopia, 1,201 Lieder, 111 Chopin. Error = median absolute log-ratio of guess to stated quarter-note bpm (0.223 = 25%), then the share within +-25%. Reproduce with `node scripts/library/formtempo-eval.mjs --from <published out>` (about 30 s).

**Part 1, held out**: each form's guess is the median of the *other works'* stated paces (leave one work out), slowed by the playability cap below, against the same cap on a flat 100. Forms with 4+ pieces from 3+ works:

| form | pieces | works | form guess | flat 100 | form's median |
|---|---|---|---|---|---|
| **mazurka** | 33 | 7 | 0.105 / 85% | 0.365 / 12% | 144 |
| **waltz** (waltz, walzer, valse) | 15 | 11 | 0.097 / 67% | 0.405 / 13% | 150 |
| **etude** (etude, study) | 42 | 25 | 0.236 / 50% | 0.416 / 24% | 138 |
| **allemande** | 4 | 4 | 0.105 / 75% | 0.329 / 50% | 80 |
| **bourrée** | 5 | 5 | 0.000 / 100% | 0.610 / 0% | 184 |
| minuet | 18 | 18 | 0.216 / 56% | 0.223 / 61% | 108 |
| polonaise | 4 | 4 | 0.209 / 75% | 0.049 / 75% | 100 |
| nocturne | 12 | 9 | 0.347 / 42% | 0.174 / 58% | 84 |
| prelude | 53 | 52 | 0.370 / 23% | 0.371 / 32% | 80 |
| fugue | 30 | 28 | 0.312 / 40% | 0.274 / 50% | 82 |
| invention | 30 | 30 | 0.161 / 57% | 0.223 / 57% | 80 |
| sonata | 86 | 69 | 0.223 / 51% | 0.278 / 44% | 120 |
| sonatina, march, rag, rondo, impromptu, lullaby, hymn | | | no better, mostly worse | | |

The rule for the table: held-out median error at least 0.05 lower and within-25% at least 5 points higher than flat 100, and a spread narrow enough that one number means something (the middle half of the form within a factor of 1.5; this drops sonata, 82 to 140). That keeps the five in bold. **Not in the table because the data say the form word does not name the pace**: minuet, sarabande, gigue, courante, gavotte, polonaise, nocturne, prelude, fugue, invention, sonata, sonatina, march, rag, rondo, impromptu, lullaby, hymn, and song (the Lieder: 1,201 pieces, median 92, the form guess is worse than 100). Two of the five rest on very little: allemande is 4 pieces (the Suite/Partita movements named only "Movement 2" in the catalogue cannot be counted, see `mine` below) and four of the five bourrées are one editor's `2=92`, so 168 is pulled toward the fifth's 160. Both are flagged guesses like the rest.

**Tried and not shipped** (exploration scripts, not committed; numbers over the same 1,945, 2-fold by work): note density, median inter-onset interval, meter class, composer era, as a regression or a rule. A piece's pace is nearly independent of how busy its notes are (the coefficient of log density on log bpm is -0.13: twice as dense, 9% slower), the onset rate at the stated pace has a spread (sd of ln 0.5) wider than the paces themselves (0.41), and meter or era moved the error by 0.00 to 0.02 (cut time runs 130 against 90 for duple in Mutopia, and a 120 for cut time gains 0.016). So there is no density or era term: **apart from the five forms, the table is no better than a flat 100, and the code says so** (`DEFAULT_BPM`).

**The playability cap stays**, as asked, and is neutral: the guess is slowed until the median gap between onsets plays at 8 a second or less (90% of the stated-pace pieces play at 7.7 or slower at their stated pace), and never under 40. On the stated set it changes nothing overall (0.223 / 54% with or without) and Mutopia gets slightly better (0.231 / 50% against 0.239 / 49%). It is what keeps a piece of unbroken 32nds from being guessed at 100.

**Part 2, the shipped estimator by source** (in-sample for the five table values, which were read off these pieces; Part 1 is the held-out evidence):

| | pieces | estimator | flat 100 | flat 60 (LilyPond's default) |
|---|---|---|---|---|
| Mutopia | 633 | 0.223 / 52% | 0.239 / 49% | 0.511 / 22% |
| Lieder | 1,201 | 0.182 / 58% | 0.182 / 58% | 0.427 / 26% |
| Chopin | 111 | 0.148 / 59% | 0.322 / 36% | 0.693 / 12% |
| all | 1,945 | 0.198 / 56% | 0.223 / 54% | 0.470 / 24% |
| a table form named | 98 | 0.134 / 65% | 0.392 / 20% | 0.875 / 6% |
| no table form | 1,847 | 0.223 / 56% | 0.223 / 55% | 0.449 / 25% |

Two things follow. The table is a real gain only on the 5% of pieces that name one of its forms. And **a MIDI left at LilyPond's 60 is the worst of the three**: on Mutopia pieces that state a pace, 60 is within 25% only 22% of the time, a flat 100 49%. That is why the 70 Mutopia files with no form get 100 (flagged) instead of staying at 60, which `tempo2.md` had left open ("not asked, and 60 is also what a genuine slow piece may carry": true for about one in five). It is a one-line decision to undo: the `formTempo` call in `analyse()` is the only place; or run the patch below on a catalogue and keep only the pieces whose `tempo` is not 100.

## What changed

- `src/formtempo.ts` (new, pure, no imports but a type): `FORMS` table (name, regex, quarter bpm), `formTempo(text, onsets)` -> `{ bpm, form? }`, `onsetsOf(song)` (quarter positions of distinct onsets, a chord once), `medianIoi`. The text is searched for the first form in the table; no form gives `DEFAULT_BPM` 100; the median-gap cap and the 40 floor apply to both. Tests in `src/formtempo.test.ts`.
- `scripts/library/pipeline.ts` `analyse()`:
  - **Mutopia MIDI** whose tempo events are all LilyPond's 60 (or none), whose .ly gives no number, no metronome mark and no tempo word: `tempo` is set (the catalogue override of `tempo2.md`: bytes, path and sha256 do not move) and the piece is flagged `tempo-estimated`. The text searched is the catalogue title plus the .ly's header `title`, `subtitle`, `piece`, `meter` strings; for a movement of a zip (`mutopia-N-k`) the header is read only when the .ly is this file's (`matched`, or `plays()` as in `tempo2.md`), else a sibling's "Courante" would name this file's dance.
  - **MusicXML** (`no-tempo`, 100 bpm): only when the *title* names a table form, since otherwise the guess would be the 100 it already plays at. `fromMusicXml(xml, title, id, tempo?)` (new fourth argument, `musicxml.ts`) starts its tempo map at the catalogue's bpm when the score has no number and no tempo word, and flags `tempo-estimated`. `store.toSong` now passes the stored `tempo` to it (it did so for MIDI only); `app/library.ts` already passed it for every format.
  - `Input.noFormTempo` switches the guess off, for the delta run below.
- `src/credits.ts`: the start-card line for `tempo-estimated` was "tempo guessed from its tempo word"; it is no longer only that: "tempo guessed, the score gives no number". `Piece.tempo` and `flags.ts` comments say the same.
- `scripts/library/reanalyse.mjs`: `--formtempo-only` (like `--pickup-only`: the piece analysed with and without the guess, only the difference lands in the published entry), and `--flag NAME` (only pieces carrying that flag are touched; the rest are the published objects). For flags and quality in both delta modes the delta is applied as a delta (flags added/removed, quality plus the difference) rather than the fresh list, so a flag today's pipeline sets or drops for other reasons stays as published (`partial.md` found mutopia-186 and 211 gaining `repeats`; 211 still reports "fresh build would ship other bytes").
- `scripts/library/formtempo-eval.mjs` (new): the evidence above.

## The candidate catalogue

Built from the live catalogue (`built 05619bbca8ad0239`, downloaded 2026-10-27 15:05 UTC, every file's sha256 checked against its entry):

```
npx vite build --config scripts/library/vite.config.mjs
node scripts/library/reanalyse.mjs --from .cache/library/live --out .cache/library/out-formtempo --flag no-tempo --formtempo-only
node scripts/library/catalog-diff.mjs .cache/library/live .cache/library/out-formtempo        # exit 0: identity holds
```

`catalog-diff`: 2,241 -> 2,241 pieces, 2,241 files, ids and order, file, bytes, sha256, composers, licences, aliases, LICENSES.md and every p/ file name and content unchanged. `built` c35e03cb70ca0765 (the app refetches on a new `built`). 82 pieces differ, in `flags`, `tempo`, and what the pace derives (`bpm` and `sec` 75, `gradeWhy` 75, `grade` 49, `quality` 4); nothing else moved (no bars, notes, pickup, keys or tags). `no-tempo` 143 -> 61, `tempo-estimated` 153 -> 235, pieces with `tempo` 49 -> 131.

| | pieces | pace |
|---|---|---|
| Mutopia, form in the table | 6 | mutopia-99-1 allemande 80; 99-2 and 1483 bourrée 168; 1682 and 1687 mazurka (Chopin Op. 33/1, Op. 6/1) 140; 1029 etude 138 |
| Mutopia, no form | 70 | 100 for 60 of them; **capped by the playability rule** at 80 for 3 (411, 1080-4, 1416) and at 60 for 7 (1411, 1419, 1420, 1497-2, 1497-3, 1497-4, 1938-33), which stay at their old speed but are now flagged a guess instead of `no-tempo` |
| Chopin MusicXML, form in the title | 6 | mazurka 140 (030-1-Sm-001, 033-1-BH-003, 033-1-BH-004), waltz 150 (042-1-P, 064_2-1-BR-002, WaltzEm-1b-SCH) |
| not touched | 61 | the 52 Lieder and 9 Chopin (sonata movements, polonaises, an impromptu, ecossaises) stay `no-tempo` at 100 |

Grades: 49 pieces go up one grade (a faster piece is harder), none down, none by two. Quality: 4 pieces lose 10 (the four short Clementi exercises, mutopia-1938-2, -9, -11, -51, now play under 10 s and take the `length` review); the swap of `no-tempo` for `tempo-estimated` costs the same 3 points, so no other quality moves.

Spot checks of the new paces: mutopia-99-2 Bourrée 241 s -> 86 s, mutopia-1682 mazurka 148 s -> 63 s, chopin-042 Waltz 520 s (at 100) -> 347 s (at 150), mutopia-1029 138 s -> 60 s.

## Not done, and what I would check by ear

- **Not heard.** All paces are table values or a flat 100. I believe the bourrées, the mazurkas and the waltzes. **mutopia-1029 (Scriabin Etude Op. 2 No. 1) at 138 is almost certainly too fast**: it is an Andante cantabile in 3/4 and the etude table is a median of Burgmuller and Chopin studies; the 60 it played at before may have been closer. The etude entry passes the test on average (0.236 / 50% held out) and is wrong for a slow study; there is no evidence in the file to tell them apart. Likewise mutopia-276-3 (Moonlight, finale, Presto agitato) at 100 is still slow, and Goldberg variations at 100 are a flat guess.
- The 70 no-form MIDI at 100 is a choice, argued above, and should be confirmed. To ship only the 12 pieces that name a table form, make the Mutopia branch of `analyse()` set `tempo` only when `formTempo(...).form` is there, then rerun the patch.
- The 52 Lieder and the 9 Chopin pieces named only by their work ("Sonata, Op. 35: Movement 2", the Marche funebre, a polonaise) stay `no-tempo` at 100: no form that predicts a pace is in their title.
- Old clients: `fromMusicXml` before this change ignores `tempo`, so a client on the old app that fetches the new catalogue plays those 6 MusicXML pieces at 100 as it does today (with the new flag); a client on the new app plays them at 140 or 150. Deploy the app first.
- The stated-pace set is mostly Lieder (62%), and for the forms the number of independent *works* is small (mazurka 7: the Chopin opus groups). The held-out figures are an estimate with that much slack.

## Publish steps (run 2026-10-27, catalogue built 6eda6e669ed6568d; mutopia-1029 kept at its old pace)

1. Rebuild the candidate from whatever is live at the time (another candidate may be published first: `partial.md`'s pickups, `rebuild.md`, ...). The run takes about 5 s from a downloaded copy:
   ```
   mkdir -p .cache/library/live/p && curl -s https://pianoforte.mattkelly.io/corpus/catalog.json -o .cache/library/live/catalog.json && curl -s https://pianoforte.mattkelly.io/corpus/LICENSES.md -o .cache/library/live/LICENSES.md
   node -e 'for (const p of require("./.cache/library/live/catalog.json").pieces) console.log(p.file.slice(2))' | xargs -P12 -I{} curl -s -o .cache/library/live/p/{} https://pianoforte.mattkelly.io/corpus/p/{}
   ```
   then the two commands above. `catalog-diff` must print "identity holds" (exit 0) and 82 or so differing pieces, only in flags, tempo, bpm, sec, gradeWhy, grade, quality.
2. Merge `feature/formtempo` and deploy the app (`scripts/deploy.sh`) so MusicXML pieces honour `tempo`.
3. `LIBRARY_OUT=/Users/mathisto/projects/piano-wt-formtempo/.cache/library/out-formtempo scripts/deploy-library.sh` (only adds files, which here is none; catalogue last, by rename).
4. Check: `curl -s https://pianoforte.mattkelly.io/corpus/catalog.json | node -e 'const c=JSON.parse(require("fs").readFileSync(0));console.log(c.pieces.filter(p=>p.flags.includes("no-tempo")).length)'` should print 61; open mutopia-99-2 and chopin-042-1-P on a device and hear the pace.
