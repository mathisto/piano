# Graces and the end of the piece: the two loosenings of lyreader.md, decided on evidence (branch feature/grace)

Follows `lyreader.md`, which measured two loosenings of the `.ly` reader's safeguard and left them out: a 1/64-note tolerance where the reading has graces (11 pieces) and an end-of-piece bar count a bar off (7). Nothing was pushed, deployed or published. The live catalogue and the main repo's cache were only read (live was fetched into `.cache/library/live` of this worktree, 2241 files, every sha256 checked). Live `built` is **9de3ddcb0f3cb09b**, as expected. The candidate is `.cache/library/out-grace` (`built 78e5f1c66ea9f407`).

Verdict: **the grace tolerance goes in, but not as "beside the grace"; the end-of-piece one goes in for 2 of 7 pieces and stays out for 5.** Neither is the blanket loosening lyreader.md measured.

## Grace tolerance: the premise "adjacent to a grace" is false, the shift is from the first grace to the end

`ly-coverage.mjs --id mutopia-N` now prints `near`: every MIDI onset the reading has no note at (within a tick) and no grace note just before, grouped by the signed distance in ticks to the nearest note of the reading (reading minus MIDI; 1536 ticks to a whole note, so 1/64 = 24 ticks), and `ng`, `end`, `tail` (graces in the reading, where its last note ends, its last four notes).

What the MIDI does after a `\grace`: the rest of the voice runs a few ticks off the grid, and **it stays off**; each grace adds to it. In 589 (Mendelssohn op. 102/3, eight graces) the MIDI is 2 ticks early after the first, 4 after the second ... 14 after the last, and 205 onsets sit at +14, thousands of ticks away from any grace. A window beside the grace would catch none of them. What holds on all the readings is the other direction: **no shifted onset comes before the reading's first grace.**

| piece | graces in the reading | shifted onsets (ticks, count) | left over (misses) | result |
|---|---|---|---|---|
| 589 | 8 | +2 x16, +4 x2, +5 x32, +7 x100, +9 x16, +11 x2, +12 x32, +14 x205 | 0 | plays, pickup 0 |
| 611 (not in lyreader.md's list) | 3 | +3 x43, +5 x68, +7 x204 | 0 | plays; time signatures not the MIDI's, no pickup |
| 617 | 2 | +2 x109, +4 x68 | 0 | plays, pickup 0 |
| 619 | 6 | +2 x6, +3 x151, +4 x30, +5 x6, +6 x49 | 0 | plays, pickup 0 |
| 620 | 24 | +4 x47 | 0 | plays, pickup 0 |
| 778 | 8 | +3 x4, +5 x430, +8 x4, +10 x275 | 2 (-41, -36) | plays, pickup 0 |
| 779 | 3 | +3 x309, +4, +5 x2, +6, +7 x105, +10 x258 | 0 | plays, pickup 2.5 |
| 1610-2 | 4 | -5 x74 | 4 (a run of four notes 1/36 apart at 21.78: -43, -86, -129, -173) | plays, pickup 1 |
| 1958 | 7 | +19 x32, -13 x2 | 7 (+-32, -96, -33: a run the reader does not place) | plays, pickup 0.25 |
| 276-3 | 29 | +14 x55, -38 x6, +36 x6 | 46 of 4863 (26 of them one passage at bar 187, 'far') | plays, pickup 0, **repeat played out** |
| 2220 | 8 | -24 x10, +24 x10, -48 x10, +44, +22 | 11 of 560 (1.96%) | **false cover**, see below |
| 1938-32 | 2 | -24 x16, +22 x6, -4 x2 (17 of the 24 come before the first grace) | 17 of 268 | does not play |
| 898 (in lyreader.md's list) | 0 | none near: 1423 of 1428 onsets are 6 to 58 ticks from any note | 1423 | does not play, **not a grace case** |

Reading the table:

- **Explained by graces and within 1/64: 589, 611, 617, 619, 620, 778, 779.** Every shifted onset is 2 to 14 ticks (at most 1/110 of a whole note) after the reading's first grace; the few left over are single notes far from the grid (graces' own notes in another voice and the like), absorbed by the 2%.
- **1610-2, 1958, 276-3** have the same drift (-5, +19, +14 ticks) and a few runs of notes the reader does not place. They need the tolerance to get under 2%: 276-3 is 101 misses (2.08%) without it, 46 with.
- **1938-32 and 2220 are not graces.** The MIDI of both has ornaments played as runs of 64th notes that the reading does not have (1938-32: four 64ths before the second note of the piece, at 0.1875, 0.2031, 0.2188, 0.2344; the book has 493 `\trill`/`\turn` marks and no `articulate.ly`; 2220 includes `articulate.ly` in its first lines, and the runs sit at its `\trill`s). Those notes land within 24 ticks of other notes by accident. I did not find how LilyPond comes to play the 1938-32 ones. In 1938-32, 17 of the 24 shifted onsets come before the reading's first grace, so the rule below keeps it out, as it should. 2220 gets through: the shifts are after its first graces and its misses are 11 of 560, 1.96%.
- **898 is in lyreader.md's list and does not belong.** It has no graces in the reading, and 1423 of its 1428 onsets are 6 to 58 ticks from the nearest note: the reading is another rhythm altogether. With the 1/64 tolerance applied globally on today's live catalogue 12 pieces are added (the 11 less 898, plus 611 and 2220); I could not reproduce 898 and have not found why (lyreader.md measured against a catalogue and `.ly` state I do not have).

### The rule

`score()` in `repeats.ts` (`lost`): an onset at or after the reading's first `grace` event (any voice, `\grace`, `\acciaccatura`, `\appoggiatura`, `\slashedGrace`, `\afterGrace`) may be up to `W / 64` ticks from a note of the reading; before it, one tick, as before. The window for the grace notes themselves (`W / 8` before the grace) is untouched. A reading with no grace is exactly what it was: 659 - 11 = 648 of the live pickups, every other piece's `plays()`, `pickLy` choice and field are unchanged (below).

Known ceiling (a `ponytail:` comment in the code): a reading dense in 64th notes with one grace would match nearly anything within 1/64. The 2% budget and the length test (`off`) are all that stand against it. 2220 is that case in the small: it plays now, then `pickupWhy` says "length differs by more than a bar", and nothing in the catalogue changes. A tighter tolerance would drop 2220 (its shifts are +-24 and +-48) but also 1958 (+19 x32) and the 14 ticks of 276-3, so the evidence does not give a better number than 1/64 (24 ticks at ppq 384; the genuine shifts measured are 2 to 19).

## End of the piece: 2 of 7 explained, 5 rejected

`pickupWhy` claims pickup 0 when the `.ly` has no `\partial` and counts the same bars as the MIDI at the end, both counted in the `.ly`'s own layout. The seven that fail only that test (`reading` for each: where the reading's last note ends and the MIDI's, in whole notes):

| piece | reading ends | MIDI ends | what it is | verdict |
|---|---|---|---|---|
| 1723-2 | 51.7500 (the barline) | 51.7533 | the MIDI's last chord ends 5 ticks past the barline; 38 graces in the reading | **explained** (grace drift) |
| 1723-7 | 21.7500 (the barline) | 21.7643 | 22 ticks past, under 1/64 = 24; 15 graces | **explained** (grace drift) |
| 1938-47 | 16.1250 | 16.2344 | the MIDI ends with ornament notes (0.109 long, at 16.125) the reading does not have, as in 1938-32; they cross a barline | rejected: no grace tolerance covers 0.109 |
| 2032 | 18.2500 | 18.0000 | the reading has a note at 17.5 (0.75 long) the MIDI does not, and misses one at 16.25 | rejected: real mismatch |
| 2126 | 12.2500 | 12.0000 | the reading has a note at 11.75 the MIDI does not | rejected: real mismatch (a reader error in a four-part chorale) |
| 2174 | 57.0267 | 57.0000 | the reading's last chord is staggered 13 ticks per note (55.5, 55.5133, 55.5267) where the MIDI's is not; 41 ticks past the barline, over 1/64 | rejected: not the drift |
| 1218 | 142.8750 | 142.7500 | the reading has a note at 142.125 the MIDI does not; 23 misses of 3748 | rejected: real mismatch |

So "a bar off at the end" is three different things. Two are the same drift as the onsets: the MIDI's last note ends a few ticks over a barline that the `.ly`'s ends on. Five are the reading having music at the end the MIDI does not play, or the other way, which is a reason to say nothing. The rule: when the reading has a grace, the MIDI's end may be 1/64 later (`pickupWhy`, `slack`); no grace, no slack. 1723-2 and 1723-7 get pickup 0; the five stay "bar count differs".

## Tests

`src/library-repeats.test.ts`, `describe('graces shift the voice after them')`, a synthetic MIDI (ppq 480, W / 64 = 30 ticks) against `c4 d e f | \grace f16 g4 a b c | d1`: shifts of +5, -5 and exactly 1/64 after the grace play; 40 ticks does not; a second note 5 ticks off before the grace does not; the same shift with no `\grace` in the `.ly` does not; the last note ending 10 ticks past the barline gets pickup 0 with a grace in the `.ly` and "bar count differs" without, and 40 ticks past is "bar count differs" with it. `npx tsc --noEmit` clean; `npx vitest run`: 739 passed, 1 skipped.

## The candidate

```
npx vite build --config scripts/library/vite.config.mjs
node scripts/library/reanalyse.mjs --ly-only --from .cache/library/live --out .cache/library/out-grace   # 1 min 48 s
node scripts/library/catalog-diff.mjs .cache/library/live .cache/library/out-grace
```

```
pieces 2241 -> 2241, files 2241 -> 2242, built 9de3ddcb0f3cb09b -> 78e5f1c66ea9f407
1 pieces with a new file: 276-3
15 pieces differ in:
  pickup: 11
      mutopia-619: undefined -> 0
      mutopia-778: undefined -> 0
      mutopia-1610-2: undefined -> 1
      mutopia-1723-2: undefined -> 0
      mutopia-1723-7: undefined -> 0
      mutopia-276-3: undefined -> 0
  quality: 4
      mutopia-2072: 80 -> 73
      mutopia-2082: 80 -> 73
      mutopia-422: 87 -> 80
      mutopia-475-18: 104 -> 111
  bars: 3
      mutopia-276-3: 201 -> 264
      mutopia-779: 123 -> 124
      mutopia-1958: 42 -> 43
  sec: 3
      mutopia-276-3: 482.4 -> 633.6
      mutopia-779: 177.8 -> 178.7
      mutopia-1958: 184.2 -> 184.7
  gradeWhy: 2
      mutopia-276-3: [2.89,2,1.5,1.25,1,0.45,0.86] -> [2.87,2,1.5,1.25,1,0.48,0.82]
      mutopia-779: [2.74,2,1.5,1.25,1,0.54,0.29] -> [2.79,2,1.5,1.25,1,0.54,0.41]
  notes: 1
      mutopia-276-3: 4863 -> 6461
identity holds: ids, order, tables, aliases, LICENSES.md, every old p/ file, and every file, bytes and sha256 but the new files above
```

The 11 pickups (the full list is `catalog-diff.mjs --all`): 589 0, 617 0, 619 0, 620 0, 778 0, 779 **2.5**, 1610-2 **1**, 1723-2 0, 1723-7 0, 276-3 0, 1958 **0.25**. Mutopia pickups 648 -> **659**; pieces the reader still has no pickup for: 748 - 659 = 89.

**The 648 live pickups and every other field.** 644 of the 648 live entries that have a `pickup` are identical in the candidate; the other four (2072, 2082, 422, 475-18) differ in `quality` only, and **that is not this change**: the same code without it (`git stash`, rebuild, the same `reanalyse`, `.cache/library/out-base`) differs from live in exactly those four `quality` values and nothing else, and `catalog-diff.mjs out-base out-grace` lists only the 11 pickups and the fields that follow from them (`bars`, `sec`, `gradeWhy` for 779, 1958 and 276-3; `notes` and the new file for 276-3). `fifths`, `meter`, `tracks`, `lo`, `hi`, `pick`, `tags`, `flags`, `tempo`, `bpm` and every identity field do not move. The reason for the four `quality` values is not found (`feb7d0b`, "movement pace as published", came after the candidate that was published, and none of the four is a movement; not checked further): filed below.

### Newly covered pieces whose pickup disagrees with the detector (`pickup-check.mjs --old live --new out-grace --fresh`)

```
agree: none: 8  mutopia-619 mutopia-778 mutopia-1723-2 mutopia-1723-7 mutopia-276-3 mutopia-589 mutopia-617 mutopia-620
agree: pickup: 1  mutopia-1610-2
pickup gained: 2  mutopia-779 mutopia-1958
disagree:
  mutopia-779 detector 0 .ly 2.5
  mutopia-1958 detector 0 .ly 0.25
```

- **779** (Sonata No. 5, 3rd movement): the `.ly` says `\partial 8*5` and the MIDI has five eighths and then a half note on a beat; the detector finds nothing because five eighths of 4/4 is an odd pickup. The `.ly` wins, as for the 19 of lyreader.md.
- **1958** (Rachmaninoff op. 23/1): `\partial 16 \afterGrace s16 { s4*2/3 }`, a silent sixteenth (a spacer) and a grace; the MIDI's first real note is at 1/16 (graces at 0.009 and 0.028 before it). The `.ly` wins by the same rule, but this pickup is silent: it is the lead's call whether a spacer counts as a pickup.

### 276-3 (Moonlight, 3rd movement) now has its repeats played out

Not asked for: the piece plays now, so `reanalyse --ly-only` ran it through `run()` and it unfolded (`repeats played out, new files: mutopia-276-3`): 4863 -> 6461 notes, 201 -> 264 bars, 482 -> 634 s, new content-addressed file. `unfold()`'s own checks passed (note count, keys, the barlines the app lays with the `.ly`'s pickup); the exposition repeat is 63 bars longer, which is the shape of that repeat. Not heard. If the lead does not want it with this publish, `276-3` would have to be put back in the candidate by hand (its old entry and no new `p/` file); it does not fall out of the rule.

## Publish (not run)

The candidate is the whole live catalogue plus one new `p/` file, so no `combine.mjs`, as for lyreader.md.

1. Merge `feature/grace` into `main` (scripts, tests, docs; `.cache` is untracked): `npx tsc --noEmit && npx vitest run`. The app needs nothing new.
2. `curl -s https://pianoforte.mattkelly.io/corpus/catalog.json | jq -r .built` must print `9de3ddcb0f3cb09b`. If it prints another value, re-derive from a fresh copy of live (a directory with `catalog.json`, `LICENSES.md`, `p/`): `npx vite build --config scripts/library/vite.config.mjs && node scripts/library/reanalyse.mjs --ly-only --from <live copy> --out <new out>`, then `catalog-diff.mjs <live copy> <new out>` must say `identity holds`. (The cache `http` is in `.cache/library/http` of this worktree.)
3. From the main checkout: `LIBRARY_OUT=/Users/mathisto/projects/piano-wt-grace/.cache/library/out-grace scripts/deploy-library.sh` (`p/` up `--ignore-existing`: one new file; `LICENSES.md`; `catalog.json` last by rename; `built` changes, so clients refetch).
4. Check: `curl -s .../catalog.json | jq '[.pieces[]|select(.source=="mutopia" and .pickup!=null)]|length'` is 659; `jq '.pieces[]|select(.id=="mutopia-276-3")|[.bars,.pickup]'` is `[264,0]`; `mutopia-779` has pickup 2.5; open mutopia-779 and mutopia-1958 and look at bar 1.

## Not done / filed

- **The onset test is one-sided**: every MIDI onset must be in the reading (2% missed), but notes the reading has and the MIDI does not are never counted. 2032, 2126, 1218 and 2174 pass it with extra music at the end of the reading, and a reading with extra notes everywhere a MIDI onset is dense enough would pass too. A symmetric test (the reading's onsets, bounded by the MIDI's length, are in the MIDI) is the root fix for the false covers (2220) and the end-of-piece rejects; not done, because it moves the safeguard for every piece and wants its own measurement.
- **Ornaments played as notes** (1938-32, 1938-47, 2220, and the `\articulate` Clementi movements of lyreader.md): trills and turns in the MIDI that the reader does not place. The reader would have to realise them (for `articulate.ly`, its tables; for 1938-32 it is not known where they come from); until then those pieces stay out (or, for 2220, in by accident).
- **898** is not a grace case (above); its reading is wrong from the first note. Not looked at further.
- **Four `quality` values** (2072, 2082, 422, 475-18) in the live catalogue are not what today's code gives (80 vs 73, 80 vs 73, 87 vs 80, 104 vs 111). `reanalyse --ly-only` of unchanged `main` reproduces everything else byte for byte. Unexplained; whoever publishes next gets these four moved too (this candidate carries them), or `quality` in them is restored by hand.
- **`unfold()` on a piece that newly plays** (276-3) is the first time a grace-tolerant reading feeds the repeat unfolding. Listening to the file before publishing is the check that has not been done.
- The 5 end-of-piece rejects and the reader errors they show (2126, 2032, 1218) are reader bugs, each a block of music the reader sees and LilyPond does not play (or the reverse); not chased.
