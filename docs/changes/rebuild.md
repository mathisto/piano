# Re-analysing the published catalogue (branch feature/rebuild)

Goal: give the 1,988 published pieces (`.cache/library/out-kern`) the analysis of `tempo.md` and `tempo2.md` (`flags`, `bpm`, `tempo`, `grade`) without changing a single id, file path or sha256. Nothing was pushed, deployed or published; the main repo's `.cache/library/http` and `out-kern` were only read.

## From scratch cannot do it; so a re-analysis patch

Rebuilt offline from the cache (`build.mjs --set mutopia|lieder`, no `--merge-with`, network blocked to prove it):

| set | result vs the published catalogue |
|---|---|
| lieder | 1,063 ship; the 1,062 published are all there with the same sha256, and **every analysis field equals the patch below**. One extra piece (lieder-lc6482032). |
| mutopia | 754 ship; 748 published: 2 missing (mutopia-100-9, 475-23), 8 not in the catalogue (2 of them its aliases), and **18 files differ in sha256** (see the first open item). On the 728 pieces with the same sha256 every analysis field equals the patch below. |
| chopin | **cannot run**: the first-edition fetch cache (LICENSE.txt, git tree, 512 `.krn`) is not in `.cache/library/http`. A cold re-fetch is 515 requests, about 9 minutes. |

So content addressing cannot be held by a rebuild (Mutopia changes 18 files, Chopin has no source offline). `scripts/library/reanalyse.mjs` does what the preferred route would have, from the published bytes:

```
npx vite build --config scripts/library/vite.config.mjs
node scripts/library/reanalyse.mjs --from <published out> --out <candidate out>      # 55 s, offline, byte-identical rerun
node scripts/library/catalog-diff.mjs <published out> <candidate out> [--all]         # identity check + every changed field, exit 1 if identity breaks
```

Per piece it builds the `Input` from the catalogue entry and the published file (Mutopia: the original MIDI and `.ly` from the cache through `sourceOf`, now in `lib.mjs` and shared with `repeats-patch.mjs`), runs the real `run()` on it alone (so `analyse`, `judge`, the emit code are the pipeline's own), and copies back only `ANALYSIS` fields: `fifths keys meter bars sec bpm notes lo hi tracks pick tempo grade gradeWhy gradeOverride quality flags`. Title, composer, licence, tags, file, bytes, sha256, the tables and the aliases stay as published. A Mutopia piece gets the same `.ly` treatment as in a build (`withRepeats`: volta read as unfold) only when that unfold gives the published bytes, so the repeats flag comes out as a fresh build would give it.

## Candidate: `.cache/library/out-rebuilt` (this worktree)

`catalog.json` (1,988 pieces, new `built` f47dcfae7cb6373b), `LICENSES.md` (identical), `p/` (a copy of the 2,120 published files; 132 are older superseded ones, as in out-kern). `catalog-diff.mjs` against out-kern: same ids in the same order, same `file`, `bytes`, `sha256`, `title`, `composer`, `licence`, `tags`, composer and licence tables, 234 aliases, LICENSES.md, same `p/` file names, every file hashes to its name and its sha256. A hand structural check (all required keys and types, indexes, 7 `gradeWhy` terms, aliases resolve to shipped pieces) found no problem. `npx tsc --noEmit` clean, `npx vitest run` 671 passed, 1 skipped.

**712 pieces change.** Field by field (full per-piece list: `.cache/library/diff.txt`, from `catalog-diff.mjs --all`; no `level` field exists in the catalogue):

| field | pieces | why |
|---|---|---|
| `bpm` | 391 | 301 pieces in 6/8, 9/8, 12/8: beat rate (dotted quarter) instead of quarters (ratio about 0.67; `tempo.md` 5). 4 more of those carry a `tempo`. 86 in other meters: better tempo words (lieder 23, Chopin 20) and `tempo` overrides (Mutopia 43). |
| `sec` | 319 | follows the pace (the bpm cases) and, for Mutopia, the new bar grid. 130 change with the same bars and bpm (127 Mutopia): not traced one by one, consistent with the pickup detector moving the last bar (mutopia-4: 100 to 101.8 s, same 28 bars). Largest: mutopia-1778 -33%, lieder-lc5052787 -12%. |
| `flags` | 317 | below |
| `gradeWhy` | 275 | onset rate and bar density follow the new seconds and bars |
| `quality` | 174 | +3 for 129 (a flag gone), -3 for 41, -13 for 2 (mutopia-2072, 2082 gain `length`), -9 for one, +6 for one |
| `bars` | 64 | Mutopia only, 48 lose a bar, 16 gain one: the new pickup detector, whose result the catalogue stores. 3 of them move `keys` (mutopia-998, 445, 2001) |
| `tempo` | 49 | the new field, all Mutopia, quarter bpm from the `.ly` (39 a tempo word, flagged `tempo-estimated`; 10 a markup metronome mark, no flag). 184 at most (mutopia-1217, 1519), 46 at least (1515, 1517) |
| `grade` | 45 | 38 up, 7 down (mutopia-493 4 to 3, 1723-13, 1938-76, lieder-lc5062118, lc4978488, lc5051724, lc6164142); 3 to 4: 14, 4 to 5: 13, 3 to 5: 4, 2 to 3: 5, 1 to 2: 2, 3 to 2: 3, 4 to 3: 4. Mutopia 32, Lieder 11, Chopin 2. Grades 1 to 5 were 71/282/618/547/470, now 69/282/606/544/487 |
| `keys` | 3 | see `bars` |

Unchanged for all 1,988: `notes lo hi fifths meter tracks pick tags` and everything identity.

**Flags** (totals): `no-tempo` 385 to 129, `tempo-estimated` 0 to 148, `repeats` 62 to 84, `dc-ds` 61 to 62, `length` 6 to 8.
- `no-tempo` removed from 270: 68 Chopin and 41 Lieder became `tempo-estimated` (the 109 of `tempo.md`); of 161 Mutopia, 27 became `tempo-estimated`, 10 took a metronome number from the `.ly` (`tempo` set, no flag), 124 were never without a tempo (a number in the `.ly`, or a non-60 MIDI: `tempo2.md`).
- `no-tempo` added to 14 Mutopia MIDI at LilyPond's default 60 whose `.ly` names no pace (Clementi's Art of Playing 12, Chopin Prelude Op. 28 No. 1, Moonlight 3rd movement): the old test took any tempo event as a tempo. 129 remain: Mutopia 76 (as `tempo2.md` counted), Lieder 38, Chopin 15.
- `tempo-estimated` added to 12 more Mutopia pieces that had no `no-tempo` (39 in all; the source `.ly` word is the guess).
- `length` added to mutopia-2072 and 2082 (Eight-Measure Exercises No. 9 and 16): their new tempi (182, 118) make them 7.9 and 8.1 s.
- `dc-ds` added to mutopia-276-2 (Moonlight 2nd movement: a D.C. mark, found because the right `.ly` is now picked; it also gets `tempo` 112).
- `repeats`: 5 dropped (374, 804-2, 804-3, 989, 1080-1: the stale flags `libgrow.md` listed, their MIDI has nothing to play twice and the file is unchanged), **27 added** (next section).

## Open (filed, not fixed here)

1. **27 pieces whose repeats are not played now carry `repeats`; 19 of them a fresh build would unfold into new files.** The repeats patch only looked at pieces already flagged, and `judge()` tested `\repeat\s+volta`, which misses LilyPond's quoted `\repeat "volta"`, so these were never flagged and never unfolded. I changed that regex to `"?volta` (`pipeline.ts`, one character, test in `library-pipeline.test.ts`): that is why 22 pieces gain the flag. The 27: mutopia-74 75 76 77 78 79 82 83 84 85 86 129 (quoted; 75, 79, 84, 129 are bundled and stay untouched), 100-9 100-10 100-11 100-12 100-13 100-14, 276-2, 474-5, 907-1, 1080-2, 1509, 2114-3 2114-4 2114-6 2114-7. The 18 whose unfolded file differs from the published one (74 76 77 78 82 83 85 86 100-10 100-11 100-13 100-14 474-5 907-1 1080-3 1080-5 1080-6 1509; 100-9 loses dedupe in a fresh build) would double their bars (mutopia-74: 33 to 65). Playing them needs new files, which this task forbids; `repeats-patch.mjs --from out-rebuilt` is the way (now that they are flagged), as a separate publish. Not run.
2. **Chopin cannot be rebuilt offline** (cache missing, above). Anything that needs the kern source (a converter change) needs the 9-minute fetch first, into a cache dir of its own.
3. The 38 bundled pieces' catalogue entries were re-analysed like the rest (their flags, bpm, grade); `public/library` and its manifest were not touched.
4. Nothing here was heard: the 148 `tempo-estimated` and 49 `tempo` values are table values (`tempo.md`, `tempo2.md`). The 14 new `no-tempo` and the 7 grade drops are as the pipeline computes them, not looked at by hand.

## Publish

From the main checkout (the script and ssh key live there), after a look at `.cache/library/diff.txt`:

```
LIBRARY_OUT=/Users/mathisto/projects/piano-wt-rebuild/.cache/library/out-rebuilt scripts/deploy-library.sh
```

`p/` goes up with `--ignore-existing` (all 2,120 files are already on quartz, nothing new), then `LICENSES.md`, then `catalog.json` last by rename. The new `built` makes clients refetch the catalogue; no piece file or device copy is invalidated. Clients without the `Piece.tempo` code (before `tempo2`) ignore the field and play the file's own tempo. To rebuild the candidate: the three commands at the top.
