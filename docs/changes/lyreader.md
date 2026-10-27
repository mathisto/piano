# The .ly reader reads more (branch feature/lyreader)

Follows `partial.md`, `tempo2.md`, `repeats.md`, `dc.md`: the reader in `scripts/library/repeats.ts` (`readLy`, `score`, `plays`, `lyPickup`, `unfold`) found no usable .ly for 304 of the 748 Mutopia pieces. Nothing was pushed, deployed or published; the live catalogue and the main repo's `http` cache were only read (the cache was copied into this worktree). The candidate catalogue is `.cache/library/out-lyreader` in this worktree.

**The safeguard is the one it was**: a piece gets a pickup, a pace or its repeats played out only from a reading whose onsets are the MIDI's (`plays()`: at most 2% of the MIDI's onsets missed, one tick of slack), and the 0 claim still needs the .ly's bar count to be the MIDI's. Two things that would have covered 18 more pieces were measured and left out (below); they are the lead's call.

## The 8192 bytes of mutopia-998 are not a truncation

`K545-1.ly` is **8195 bytes** on the server (`Content-Length: 8195`) and 8195 bytes in the cache. `get()` in `lib.mjs` writes the whole body; no cached file is cut at a block size. 998 was unreadable for another reason (`\tag #'first/#'second` inside variables, `\transpose`, read before any `\keepWithTag`); it reads now. So nothing to refetch.

## Result (748 Mutopia pieces, live catalogue `built 6eda6e66` against the candidate)

| field | live | candidate |
|---|---|---|
| `pickup` (the .ly states the first bar) | 444 | **648** (+204; 141 -> 177 with a pickup above 0) |
| not covered by the reader (`ly-coverage.mjs`) | 304 | 101 |
| `tempo` (a pace the .ly names) | 124 | 130 (+6: 108, 446, 1029, 422, 1496, 1563) |
| `tempo-estimated` / `no-tempo` flags | 114 / 1 | 120 / 0 |
| `repeats` flag | 37 | 27 |
| repeats **played out** (new content-addressed file) | - | **34**: 108, 446, 1477, 1483, 1614, 2012, 2037-1..20 (all 20 Hanon exercises), 2114-2..7 (six Partita 4 movements), 314, 497 |
| `dc-ds` flag | 35 | 45 (10 pieces whose .ly was never read: 2147-2154, 2177, 482) |

Of the five repeats pieces you named, **1477, 1483 and 1614 now unfold**: `unfold()` checked the copies' barlines against the app's detector, which had no pickup for them; with the `.ly`'s pickup (`Piece.pickup` hands it to the app anyway) as a third grid to try (after the old two, so every earlier result is byte for byte what it was) they pass. **1080-2** (the two voices disagree on the last repeat's length, 32 against 33.5 q) and **443** (a bare "D.C." with no Fine in the score: a human decision) do not; both now carry a pickup.

### The 304 by cause, before and after (`node scripts/library/ly-coverage.mjs --from DIR [--ids]`)

| cause | before | after |
|---|---|---|
| no .ly in the cache | 43 | 7 |
| no `\midi` score found | 126 | 5 |
| reading misses more than 2% of the onsets | 77 | 69 |
| second `\time` (bar count not claimed) | 31 | 0 |
| bar count differs | 14 | 7 |
| length differs by more than a bar | 9 | 7 |
| first `\time` is not the MIDI's | 1 | 6 |
| a `\partial` after the first note | 2 | 0 |
| two time signatures in the MIDI | 1 | 0 |
| **not covered** | **304** | **101** |

(The lead's 43 + 43 + 124 + 94 regroup into these by what `pickupWhy` says: the 43 with a `\partial` somewhere but none for bar 1 were a mix of the rows above.)

## What was fixed, in the order it paid (increments are the coverage count at the time, not additive)

1. **Includes** (`lib.mjs`, `inlineIncludes`). 121 of the 126 "no score" pieces are in five works whose movement .ly files `\include` .ily files in the same zip (Clementi op. 42, Royer, Couperin, Hanon, Bach Partita 4). The candidates were the zip's `.ly` files as written; they now have every `\include` replaced by the zip's file, found as LilyPond does (beside the including file, above it, else by name), and Royer's `\includeScore "X"` as `X/global.ily` (as `\global`) and `X/score.ily`. +21 and the base of everything after.
2. **43 pieces with only a `-lys.zip`** (no `.ly` link on their page: 108, 446, 463 ...). `build.mjs` and `sourceOf` took `m.ly` only. `pieceLy()` now reads the zip and keeps a `.ly` only when `pickLy(.., strict)` finds one that plays the file (`pickLy`'s fallback to the first is for movements, which have a sibling). +28 (7 of the 43 have no .ly that plays them).
3. **The anacrusis is read where the .ly was checked** (`withRepeats`): the unfolded file no longer reads like its .ly (a D.C. is not in it), so `withRepeats` reads `lyPickup` from the original MIDI and .ly and hands it on as `Input.pickup`. +8 (the D.C. pieces 191, 215, 217 ...).
4. **The "0" claim by layout, not by one meter** (`pickupWhy`): the .ly's `\time` changes must be the MIDI's (same bar length at the same places), the bars are counted with `\time` and mid-piece `\partial` laid out (`barAt`, shared with `plan`), and the .ly's length is where its last note ends, not its trailing rests or spacers (`on` events now carry their length). A pickup is still read from the first bar only. +49.
5. **Which score of a book** (`score`): among scores that fit, the one nearest in length, by the last sound; before, the first with the fewest misses, so a long sibling movement covering a short one's onsets won. +32.
6. **`\unfoldRepeats` in the voice that writes the repeat** (`readLy(src, unfoldAll)`, a file that says it is read both ways): a repeat only one staff writes extends only that staff (the Schumann *Album*: 676, 687, 788, 904 ...). `\repeat unfold n { } \alternative { }` is read with the endings in turn (LilyPond's order; it was all passes then all endings). +30.
7. **Scores**: one with neither `\layout` nor `\midi` is played; a file whose scores all say `\layout` only has its MIDI from them (803, 1959, 2002 ...); `\tag`, `\keepWithTag`, `\removeWithTag` (a variable is read again from its tokens under the filter that uses it; 998, 2191, 2012 ...); `\parallelMusic` (Debussy, 1778); `\keys`. +8.
8. **Reader bugs found on the way**, each hiding a block of pieces: `\markup \fermata` ate the brace that closed the music; `<>` had the length of a note (every Eight-Measure Exercise); `Prop=0.5` made the `=` part of a pitch and the next `=` in the file closed it; `7.75` was a duration; the tokens were changed when read (`s1 * 6` read twice was `*36`). +18.

Everything else is the same code, and `ly-coverage.mjs` prints `published pickup not reproduced` for any piece whose published pickup the reader no longer gives: none.

### Left out, measured

- **A tolerance of 1/64 whole note where the reading has graces** would cover 11 more: 1610-2, 1938-32, 1958, 276-3, 589, 617, 619, 620, 778, 779, 898. LilyPond's MIDI runs a few ticks (up to 24 at ppq 384) off in the voice after a grace note, so these misses are rounding, but it moves the onset test, so it is not in (the `[-1, 0, 1]` in `score`'s `lost`).
- **A bar count a bar off at the end** would cover 7 more (1218, 1723-2, 1723-7, 1938-47, 2032, 2126, 2174): onsets all match and the length is within a bar, the last note just sits the other side of a barline.

## The newly covered pieces whose detector pickup disagrees with the .ly (the bugs this fixes)

`pickup-check.mjs --old LIVE --new CANDIDATE --fresh`: of the 204 pieces that gained a `pickup`, 163 agree on "none", 22 agree on the pickup, **19 disagree** (the .ly wins):

| detector found | .ly states | pieces |
|---|---|---|
| none | a pickup (13) | 108 (1), 211 (1.25), 662 (0.5), 602-2 (1), 752-1 (1), 752-2 (1), 757 (1), 803 (1.5), 1938-23 (1), 1938-37 (2), 1938-49 (0.5), 1938-69 (2), 1938-76 (0.5) |
| a pickup (5) | none | 475-11 (1), 475-13 (2), 475-16 (3), 663 (1.5), 1938-73 (1) |
| 0.5 | 2 | 1723-9 |

(475-16 keeps its layout either way.) The other 25 lines `pickup-check` prints as "AGREE BUT CHANGED" are pace and flag moves on pieces whose pickup agrees (the `tempo` and `dc-ds` rows below).

## The candidate catalogue

`node scripts/library/reanalyse.mjs --ly-only --from <live out> --out .cache/library/out-lyreader` (`out-ft`, `built 6eda6e66`, is the live one). `--ly-only` is `--pickup-only` for everything the reader gives: each piece is analysed with and without the .ly's pickup and pace (`Input.noPickup`, `Input.noPace`) and only the difference goes into the published entry, so the four drifts between the live catalogue and today's pipeline (186, 211, 276-2, 1509) stay out. Added:

- **Repeats**: a piece whose published file is still the original MIDI and whose .ly plays it goes through `run()` as a build does it (the mechanics of `repeats-patch.mjs`), and takes the fresh entry and file if it unfolds; a piece that does not unfold takes the `repeats` and `dc-ds` flags of that run (not a movement's: its .ly is its book's text, and a `Coda` in another movement is not this file's).
- **Pace**: a non-movement piece takes the .ly's `tempo`/`bpm`/`no-tempo`/`tempo-estimated`. **A movement keeps its published pace** (`Input.pace`): its candidate is a book with every movement's `\tempo` in it, `lyPace` reads text and not the score that plays this file, and with the includes inlined the Clementi movements suddenly all "had a number" (12 would have lost their `tempo-estimated` 100). `analyse` also no longer takes a pace from a sibling's or a book's .ly that does not play the file (`given: false`, not `true`).
- `quality` follows the review items and flags the entry really has (the old `--pickup-only` formula counted a flag twice when the published entry already had it).

`catalog-diff.mjs` now allows a new `file`/`bytes`/`sha256` (listed apart; the new file must exist and hash to its name and sha, LICENSES.md must be the old one with the names swapped, and no old `p/` file may go). Its output:

```
pieces 2241 -> 2241, files 2241 -> 2275, built 6eda6e669ed6568d -> 9de3ddcb0f3cb09b
34 pieces with a new file: 108 446 1477 1483 1614 2012 2037-1 2037-2 ... 2037-20 2114-2 2114-3 2114-4 2114-5 2114-6 2114-7 314 497
210 pieces differ in:
  pickup: 204        (mutopia-108: undefined -> 1, 149: -> 0, 186: -> 0, 191: -> 0, 207: -> 0, 211: -> 1.25 ...)
  sec: 55            (108: 256 -> 232, 211: 174.6 -> 173.5, 446: 64 -> 147.7, 475-11: 45.7 -> 45, 475-13: 30 -> 28.6, 662: 136.9 -> 127.9 ...)
  gradeWhy: 51
  bars: 41           (108: 128 -> 217, 446: 16 -> 32, 475-11: 13 -> 12, 475-13: 9 -> 8, 1477: 26 -> 52, 1483: 38 -> 76 ...)
  notes: 34          (the 34 played out: 108: 1614 -> 2700, 446: 266 -> 532, 1477, 1483, 1614: 355/355/357 -> 710/710/714, 2012: 1229 -> 1859 ...)
  quality: 28
  flags: 26          (108 +tempo-estimated, 446 +tempo-estimated, 1029 no-tempo -> tempo-estimated, 1477/1483 -repeats, 1614 -repeats, 2012 -repeats, 2114-2..7 -repeats, 2147-2154 +dc-ds ...)
  bpm: 6             (108: 60 -> 112, 446: 60 -> 52, 1029: 60 -> 138, 422: 40 -> 73, 1496: 60 -> 100, 1563: 60 -> 100)
  tempo: 6           (108: 112, 446: 52, 1029: 138, 422: 109, 1496: 100, 1563: 100)
  grade: 5           (108: 3 -> 4, 1029: 4 -> 5, 1938-76: 2 -> 3, 314: 5 -> 4, 1496: 4 -> 5)
identity holds: ids, order, tables, aliases, LICENSES.md, every old p/ file, and every file, bytes and sha256 but the new files above
```

(full per-piece lists: `catalog-diff.mjs LIVE CANDIDATE --all`.) `fifths`, `meter`, `tracks`, `lo`, `hi`, `pick`, `tags` and every identity field do not move. `repeats` flag 37 -> 27; the 27 left are bundled (pinned) pieces, which are never played out, and pieces the reader cannot: 37 75 79 202 203 214 218 221 232 288 354 443 504 635 931 998 1080-2 1080-4 1446 1497-1 1497-3 1497-4 1497-6 1509 1612 1613 2114-1 (443 and 1080-2 are the two of your five that stay).

Not heard. The 34 files passed `unfold()`'s own checks (note count, keys, the barlines the app lays with the .ly's pickup); that is all that was checked. The Hanon exercises (bars 30 -> 58) are a whole exercise written `\repeat volta 2`, played twice.

## Publish (not run)

`combine.mjs` is the wrong tool here: it takes the overlay's entry only where the file or the flags differ, which would drop the 176 changes that are no new file. The candidate is the whole live catalogue with the old `p/` files and the 34 new ones (2275), so it is published as it is, if the live catalogue is still the one it was made from:

1. Merge `feature/lyreader` into `main` (scripts, tests and `docs/` only; `.cache` is untracked): `npx tsc --noEmit && npx vitest run` (736 passed, 1 skipped). The app needs nothing new: `Piece.pickup` and `Piece.tempo` are in it already.
2. Check that live has not moved: `curl -s https://pianoforte.mattkelly.io/corpus/catalog.json | jq -r .built` must print `6eda6e669ed6568d`. If it prints another value, re-derive from the new live copy (a directory with its `catalog.json`, `LICENSES.md` and `p/`) instead: `npx vite build --config scripts/library/vite.config.mjs && node scripts/library/reanalyse.mjs --ly-only --from <live copy> --out <new out>` (the cached sources are in `.cache/library/http` of this worktree: copy it, or the run fetches the 43 zips again, one request a second), then `catalog-diff.mjs <live copy> <new out>` must say `identity holds`.
3. From the main checkout (the script and the ssh key live there): `LIBRARY_OUT=/Users/mathisto/projects/piano-wt-lyreader/.cache/library/out-lyreader scripts/deploy-library.sh`. `p/` goes up `--ignore-existing` (34 new files), `LICENSES.md`, then `catalog.json` last by rename; `built` changes, so clients refetch.
4. Check: `curl -s .../catalog.json | jq '[.pieces[]|select(.source=="mutopia" and .pickup!=null)]|length'` is 648 and `jq '[.pieces[]|select(.id=="mutopia-2037-1")|.bars]'` is 60; open mutopia-108 (Rondo alla Turca: 112, 217 bars, pickup 1) and mutopia-475-11 (pickup gone) and look at bar 1.

## Tests

`src/library-repeats.test.ts`, `describe('what the .ly reader reads')`: `\tag` under `\keepWithTag`/`\removeWithTag` (a variable too, a tag list, a spaced duration read twice), `\parallelMusic`, unfold with endings in turn and a repeat in one voice, `<>`, `Prop=0.5`, a decimal, a score with neither/only `\layout`, a trailing rest and a note a bar late, `pickupWhy`'s causes; `describe('\include from a zip')`: beside / above / by name, a comment, a file the zip does not hold, a cycle, `\includeScore`. The `lyPickup` block gained a later `\time` that the MIDI has (and not), a trailing rest (0), a later `\partial` (0). `npx tsc --noEmit` clean; `npx vitest run`: 736 passed, 1 skipped.

## Not done / filed

- **101 pieces still without a reading** (`ly-coverage.mjs --ids` lists them): 69 miss more than 2% of the onsets: about 25 are Clementi op. 42 movements (the one I opened, 1938-4, plays under `\articulate`, which writes trills out as notes the reader does not place; not checked for the rest), 353-1..4, 475-10/23/24 (the reading is 16.5 whole notes where the MIDI is 88 to 174), the Rachmaninoff preludes 1958..1996 and the Partita 1497-x (tuplets, `\skip`, `\times` by the hundred: the cause is not found), the rest singly; 9 Royer movements (his macros, `\alternatives`...); 7 where no `.ly` of the zip plays the file (1022: `\pianoone` is defined in `lvb_sonate_111_1_1.ly`, which the main file does not include; the others not looked at). Each is a reader or a zip question, not a pickup one.
- **A movement's pace** is still read from the whole text of its book. The fix is `\tempo` and `\tempoWholesPerMinute` as events of the score `plays()` picks (the reader already walks them), then `lyPace` from those; until then `--ly-only` keeps movements as published.
- **`analyse` changed for fresh builds**: a movement whose .ly does not play it now has `given: false` where it had the text's answer. A full rebuild of the movement pieces can differ from the published pace for that reason; `reanalyse --ly-only` does not.
- **`unfold()` has a third grid** (the .ly's pickup); 1477, 1483, 1614 pass on it. 165, 1497-5, 1616 (unfolded by `dc.md` on the detector's grid) are byte for byte what they were: the third grid is tried last.
- **`lyCandidates` inlines every .ly of a zip** (megabytes for Clementi, 40 s on a cold cache); `score()` reads each candidate once (`readLyOnce`, four kept).
- The 16 `ties` tags and the four drifts of `partial.md` are untouched, as before.
