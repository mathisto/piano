# The pickup from the .ly (branch feature/partial)

Follows `pickup2.md` ("Not done", first item): where a Mutopia piece's .ly is in hand, `\partial` is the answer and the detector in `quantize()` only has to cover MIDI with no .ly. Nothing was pushed, deployed or published; the live catalogue copy (`.cache/library/out-ly` in the main repo) and its `http` cache were only read (the cache was copied into this worktree's `.cache`). The detector in this branch is the one on `main` (`pickup2`'s is not merged); nothing here depends on which one it is.

## What was built

- **`Piece.pickup?: number`** (`src/catalog-types.ts`): quarter notes in the short first bar. `0` means "the .ly says there is none", absent means "not known, detect it". Same pattern as `Piece.tempo`.
- **`lyPickup(bytes, ly, matched)`** (`scripts/library/repeats.ts`), next to `plays()` and using the same reading (`score()`):
  - Undefined unless that reading plays the file (`ok`, the 2% onset test of `plays()`), or `matched` (see below).
  - Looks only at the events at or before the first note: the last `\time` there gives the bar length `L`, a `\partial` there (any duration `plays()` can read: `8`, `8*3`, `4.`, `4*3/2`, `2...`) or a `Timing.measurePosition` / `Score.measurePosition` (`make-moment n d` or `n/d`, the part of the bar already gone) gives the pickup. Whole notes times 4 = quarters, in any meter (`\partial 8` is 0.5 in 4/4 and in 6/8; `\partial 4.` in 12/8 is 1.5). A pickup as long as the bar is 0. A `\partial` or `\time` after the first note (a new section after a repeat) is not the first bar's.
  - Undefined when `L` is not the MIDI's first time signature, or when the reading's length is more than a bar off the file's (a sibling movement's .ly that covers a sparse movement's onsets: `pickLy`'s fallback).
  - No `\partial` at all: 0 only if the .ly has no other `\time` or `\partial` anywhere, the MIDI has one time signature, and the .ly's length gives the same number of bars as the MIDI's last note off does (`ceil(len / L)` against `ceil(until / bar)`); else undefined.
  - `matched`: `withRepeats` read the volta .ly against the original MIDI before unfolding it, and the rewritten `\repeat unfold` text no longer reads like the unfolded file (an `\alternative` is read as all endings in a row). So for those pieces (48 of the 444 only get a pickup because of this, e.g. mutopia-23 and 441) the trust comes from `withRepeats`, and the pickup-0 bar count is not claimed unless it still agrees.
- **Import** (`quantize(.., { pickup })`, `fromMidi(.., tempo, pickup)`, `Stored.pickup`, `libSong`): a defined pickup `0 <= p < bar` replaces the detector; undefined (or out of range) falls back to it unchanged.
- **Pipeline**: `analyse()` calls `lyPickup`, `Analysis.pickup`, emitted in the catalogue entry when defined (0 included). Bars, sec, keys, flags, grade follow from the song built with it.
- **A bug the patch exposed** (`fromMidi`, keys): a key written at tick 0 was placed with the `ppq/8` slack, which jumps over a pickup bar shorter than the slack, so its first bar fell back to C (mutopia-475-18, a 64th-note pickup, went from -5 to 0 fifths, got the `key` flag and grade 5). A key at tick 0 is bar 0's now. Test in `quantize.test.ts`; it fails without the line.
- **Reader**: `\set Score.measurePosition` is read like `Timing.measurePosition` (the cache holds no such piece; it was asked for).
- **Tools** (`scripts/library/`): `reanalyse.mjs --pickup-only` (below), `pickup-check.mjs` (the agreement check), `ANALYSIS` in `reanalyse.mjs` gains `pickup` (a plain full re-analysis keeps it too), and reanalyse now sets `matched` as a build does.

## Tests

`src/library-repeats.test.ts`, `describe('the anacrusis a .ly states')`: `\partial 4` with and without `\time` and in either order, `8`, `4.`, `8*3`, 6/8 with `\partial 8`, `Timing.` and `Score.measurePosition`, `\partial 1` = 0, a reading that misses the MIDI, a longer sibling .ly, another meter, 0 with agreeing bar count, 0 refused when the .ly counts an extra bar / has a later `\time` / a later `\partial` / the MIDI is in 3/4, a first `\partial` followed by a later one, and `analyse()` carrying `pickup` and the bars (`bars[0].ql`), and no `pickup` without a .ly or with a wrong one. `src/quantize.test.ts`: the caller's pickup beats the detector both ways (detector finds a beat, score says none; detector finds none, score says a beat; 6/8 1.5), undefined leaves it alone, a value of a bar or more and a negative one are ignored, and the tick-0 key. `npx tsc --noEmit` clean; `npx vitest run`: 691 passed, 1 skipped.

## The catalogue patch

`node scripts/library/reanalyse.mjs --pickup-only --from LIVE --out OUT`. Why not the plain run: re-analysing the live catalogue with today's pipeline changes more than the pickup (4 pieces differ before any pickup code: mutopia-186 and 211 gain a `repeats` flag, 276-2 loses its `tempo` 112 and gets `no-tempo` with sec 226.6 -> 423, 1509 loses `repeats`; `reanalyse` also prints "fresh build would ship other bytes: mutopia-186 mutopia-211"). That is somebody else's question and 276-2 would be a regression. So `--pickup-only` analyses every piece twice, with the .ly's pickup and without (`Input.noPickup`), and puts only the difference into the live entry. `tags` stay as published (they carry the style; 16 pieces' derived `ties` tag would move with the barlines, and plain `reanalyse` leaves tags alone too). ids, order, files, bytes, sha256, p/, LICENSES.md and tables are LIVE's own.

Output in this worktree: `/Users/mathisto/projects/piano-wt-partial/.cache/library/out-partial` (from `out-ly` as it stood at 12:32 on 27 Oct), `built` 05619bbca8ad0239.

`catalog-diff.mjs out-ly out-partial`: 2241 pieces -> 2241, files 2385 -> 2385, **identity holds**. 444 pieces differ:

| field | pieces |
|---|---|
| pickup | 444 (all new) |
| sec | 65 |
| gradeWhy | 51 |
| bars | 28 |
| grade | 2 (mutopia-374 4 -> 3, 372 4 -> 5) |
| keys | 2 (1612 loses a spurious `[0,3]`; 445 `[0,1,4,6,-5,0]` -> `[-3,0,1,4,6,-5]`) |
| bpm | 1 (mutopia-504 58 -> 64) |
| flags | 1 (475-18 loses `chord`) |
| quality | 1 (475-18 87 -> 97) |

`fifths`, `meter`, `tracks`, `tempo` and every identity field: 0. The 1,493 non-Mutopia pieces (no .ly, or MusicXML) and 304 Mutopia ones are untouched.

### Pickup against the detector (`pickup-check.mjs`)

Of the 748 Mutopia pieces, 444 get a `pickup` (141 with a pickup, 303 with 0). The detector (run on the published bytes alone) against the .ly, over those 444:

| | pieces |
|---|---|
| detector and .ly agree, no pickup | 294 |
| detector and .ly agree, same pickup | 82 |
| **pickup gained** (detector found none, .ly states one) | **53** |
| **false pickup removed** (detector found one, .ly states none) | **9**: mutopia-72, 675, 1389, 1510, 1888, 1935-6, 55, 59, 1419 |
| wrong length corrected | 6: 100-1, 659, 1080-2, 23, 475-18, 1515 |

(Three pieces, 165, 1497-5 and 1616, differ from the detector in the pickup but have the same bar count and sec.) Pickups range from 1/16 to 3 quarters (`\partial 16` ... `2.`); the table of `\partial` text against the value is spot-checked in the session, e.g. `4` in 3/4 and 4/4 = 1, `8` in 6/8 and 2/4 = 0.5, `4.` in 12/8 and 6/4 = 1.5, `16*11` = 2.75, `2.` = 3, mutopia-1422's `make-moment` = 0.5. The nine removed pieces have no `\partial` or `measurePosition` in their .ly.

**Held-out check:** for the 376 pieces where detector and .ly agree, the new entry equals the live one in every field except the added `pickup` (the script prints `AGREE BUT CHANGED` for any exception: none). The 304 pieces with nothing defined are not in the diff at all. So everything that moved is a piece where the notes and the .ly disagree. This is an invariance check, not a held-out accuracy test: no constant is fitted, the .ly is the ground truth.

### What is still undefined (304 Mutopia pieces keep the detector)

- 43: no .ly in the cache.
- 43 whose .ly has a `\partial` somewhere but no usable one for the first bar: a `\partial` that opens a later section (mutopia-1218), or a reading that misses the MIDI.
- 218 without any `\partial`, split by why 0 could not be claimed: 124 where `readLy` finds no `\midi` score at all (the .ly includes its music from another file or is a fragment; mutopia-998's cached .ly is exactly 8192 bytes, so it looks truncated in the cache), 45 whose reading misses more than 2% of the onsets, 25 with a second `\time` (kept: a later meter change makes the single-meter check not apply), 14 whose bar count differs (trailing rests, mostly), 9 whose length differs by more than a bar, 1 whose `\time` is not the MIDI's.

The 124 unreadable ones are the biggest block and are a `readLy` limit, not a pickup one; they are the same ones the tempo and repeat work cannot see either. Not chased here.

## Publish steps (not run)

The patch is only `catalog.json` (no new file in `p/`), and a client without the new app simply ignores `pickup`, so the order is not critical; app first lets the first fetch be correct.

1. Merge `feature/partial` into `main` (code and tests only; `.cache` is untracked). `npx tsc --noEmit && npx vitest run`.
2. Web app: `./scripts/deploy.sh` (clean tree; it runs the tests). iPad: the usual `ios:sync` build when wanted; an old build ignores the field.
3. In the main checkout, re-derive the patch from whatever the live catalogue is *then* (so nothing published in between is lost; the worktree's copy came from `out-ly` of 12:32):
   ```
   npx vite build --config scripts/library/vite.config.mjs
   node scripts/library/reanalyse.mjs --pickup-only --from .cache/library/out-ly --out .cache/library/out-pickup
   node scripts/library/catalog-diff.mjs .cache/library/out-ly .cache/library/out-pickup     # identity must hold; expect about 444 pieces with pickup
   node scripts/library/pickup-check.mjs --old .cache/library/out-ly --new .cache/library/out-pickup   # no "AGREE BUT CHANGED" line
   ```
   (`out-ly` is the last published catalogue; use `ssh quartz cat /opt/piano/corpus/catalog.json` and `p/` if it is not the live one.) Or skip the re-derivation and use the worktree's finished `out-partial` directly if live has not moved.
4. Publish: `LIBRARY_OUT=.cache/library/out-pickup ./scripts/deploy-library.sh` (the p/ rsync is `--ignore-existing`, LICENSES.md identical, catalog.json goes last by rename; `built` changes, so the app refetches).
5. Check: `curl -s https://pianoforte.mattkelly.io/corpus/catalog.json | jq '[.pieces[]|select(.pickup!=null)]|length'` is 444; open mutopia-1590 (12/8, 0.5) and mutopia-72 (no pickup) in the app and look at bar 1.

## Not done / filed

- **Bundled pieces**: `public/library/manifest.json` (the offline first-run catalogue: mutopia-37, 61, 67, 75, 79, 202 and the others bundled) has no `pickup`; the network catalogue wins once fetched, so they only use the detector offline before the first fetch. Not edited (it is generated by the bundle build; no new field there until the bundle step writes it).
- **Not heard**: the barlines were checked against the .ly, not by ear or in the app on a device; the iPad was not touched.
- **The remaining 304** above, in particular the 124 with no readable `\midi` score: the cure is in `readLy` (includes, books), shared with tempo and repeats.
- **16 `ties` tags** would change with the new barlines and are left as published (the same rule as the rest of `reanalyse`).
- **The 4 pre-existing drifts** between the live catalogue and today's pipeline (mutopia-186, 211, 276-2, 1509, above) are untouched by this patch and still wanted a look: 276-2 (Moonlight, second movement) in particular has a live `tempo-estimated` 112 that a full re-analysis would remove.
- The `pickup2` detector (more careful, fewer false pickups) is still unmerged; it now only matters for the 304 plus MIDI with no .ly.
