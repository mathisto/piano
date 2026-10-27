# Load time: the play screen and three features load on first use

## Bench (`npm run build`, then `node scripts/perf.mjs [runs]`)
Headless Chrome, CPU throttled 4x, local preview of `dist/`, off-machine requests blocked; median of 7, warm-up dropped.
`today` = navigation to the Today plan in the DOM; `script`/`task` = main-thread ms in JS / in any task before that,
from a Chrome trace; `nav` = Songs tap to the library; `open` = first piece tap to its start card. `PERF_DIST=dir` A/Bs another build.

| interleaved A/B, 2 rounds | today | script | task | nav | open | JS at Today | entry chunk |
|---|---|---|---|---|---|---|---|
| main (def6e33) | 654-659 ms | 419-428 | 577-588 | 471-564 | 3006-3539 | 852 kB | 664 kB (222 gzip) |
| this branch | 456-466 ms | 260-263 | 416-419 | 502-523 | 2880-3151 | 302 kB | 308 kB (111 gzip) |

Today is up about 30% sooner and runs 38% less script. `nav` and `open` are within noise (the machine was shared).
## What moved out of the entry
- Pixi + `highway`, `staff` + `layout`, `dock`, and the recorder (`app/take-ui`): `play.ts` `stageCode()`, awaited by
  `ensureStage()` before the first `game.load`. Every play path (songs, drills, calibration, scales, technique,
  read-through, memorise) already goes through `openSong` -> `ensureStage`, so none needed changes. `ensureStage` is now
  one shared promise (reset on failure): two pieces opened at once used to build two stages; now one (checked: 1 canvas).
- `app/theory-ui` (+ `ear-play`, `pulse-play`) through `app/lazy.ts`. The key handler reads `theoryUi` without waiting:
  not loaded means no Theory card is open. `library-view` loads in `showLibrary`, which was already async.
- After Today draws, `requestIdleCallback` (or `setTimeout` where missing) fetches all of the above, so the first piece
  does not wait on the network on the web site. Without it `open` was 760 ms slower; with it a tap in the first
  ~100 ms after Today can wait behind Pixi's evaluation (worst case seen: nav +90 ms).
- `take.css` and `pulse.css` are imported last in `main.ts` so the stylesheet stays byte-identical (checked by `cmp`).

## Ratchet
`src/bundle.test.ts` builds in memory and fails if the entry is over 330 000 bytes or holds Pixi or any module above
(seen red at a 300 000 budget and with `game.ts` listed). Lower `BUDGET` as the entry shrinks; the warning limit is 330. Round two changed it, below.

## iPad
Chunks are imported by relative URL (`import("./highway-*.js")`); only preload hints use base `/`, as Pixi's own lazy
chunks already did on the iPad. `npx cap copy ios` puts every chunk in `ios/App/App/public/assets`. Not run on a device.

## Next hills, measured, not done (outside this lane)
- Theory decks at boot: `plan.theoryDue` builds every deck of every trainer and level for the Today plan (deckOf, ear
  `playCards`, `qaCards`: ~25 ms self time at 4x; ~50 ms in those modules all told). Memoise `deckOf`, or skip when the stats are empty.
- `@tonejs/midi` + `midi-file` + `musicxml` (~42 kB) are only for parsing pieces but `store.ts`/`song.ts` import them statically.
- Songs page: opening it fetches ~40 library files and `inspectMidi` (midi-tracks.ts:50) took ~1.2 s CPU at 4x in the
  profile of the next piece open, which it competes with (likely `library-view` `fill`; not traced to the line).
- Report, OSK, memorise, readthrough, guide, ladder stay eager: `ui.ts`/`today.ts` need them for the first paint.

# Round two: parsers, Theory decks, Songs thumbnails

| interleaved A/B, 2 rounds, 4x CPU, median of 7 | today | script | task | nav | open | JS at Today | boot JS |
|---|---|---|---|---|---|---|---|
| main (0c1616c) | 332-382 ms | 197-222 | 311-353 | 325-332 | 2003-2092 | 303 kB | 308 718 B |
| this branch | 276-290 ms | 149-152 | 261-273 | 277-278 | 1363-1412 | 252 kB | 258 430 B |

The machine was shared: absolute numbers drift between rounds (main's `today` was 454-476 earlier), so compare within a round.
Today -13 to -28%, script -23 to -33%, the first piece open -30% (the Songs page no longer parses 40 files beside it).
- `plan.theoryDue` returns at once when no Theory card is due (exact: a deck can only count due cards). With cards due it
  still builds every deck; memoise the deck ids if that shows up.
- `fromMidi` moved from `song.ts` to `midi-tracks.ts` (`density`/`COMFORT` the other way, for `ui.ts`); `store.toSong` and
  `app/library.ts` import `midi-tracks`/`musicxml` (with `@tonejs/midi`, `midi-file`) when a file is read. Every parse was
  already async through `toSong`; the idle prefetch after Today fetches both. Tests and `scripts/library` import the new home.
- Songs: thumbnails are parsed one file at a time and only for rows an IntersectionObserver sees (200 px margin); `meta`
  keeps them across visits, a redraw drops the queue. Checked: 0 before scrolling, 6 after, 10 at once on a revisit.
- `report` loads with the stage (`stageCode`; the start card only draws once the stage exists) and in the drawer's
  Credits and Summary; `ladder` + `ladder-data` in `showProgress`.
- Not moved: making `readthrough-ui` and `memorise-ui` lazy made Rolldown split the shared modules into 13 chunks
  (boot JS 261 307 vs 259 774 B without them) for no gain, so they stay. OSK mounts at boot (it watches every view and the
  Settings switch); `guide`, `memory` (`memTag`) and `readthrough` (`pickPiece`) draw Today, so they stay too.
- Ratchet: `bundle.test.ts` now sums the entry and every chunk it imports statically (Rolldown can split the entry, see
  above), budget 275 000, and names the parsers, `report` and `ladder` as lazy. Seen red with a static `musicxml` import.
- Checked: CSS byte-identical; every `./chunk.js` and `/assets/` reference in `dist` exists (51); a `--base ./` build served
  from `/sub/` boots and opens a library piece with all JS under `/sub/`. Wart, not new: `CORPUS` is `origin + /corpus/`,
  so under a subpath the remote catalogue 404s (bundled pieces still work); the default build uses base `/`.
