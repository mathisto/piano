# Prune: dead code, duplicated helpers, unused dependency

A ponytail audit of `src/` and `scripts/` (not `.cache`), then the safe removals applied. Behaviour is unchanged. The tree was already fairly clean: no commented-out code, no compat shims, no orphan module, no stale script, no unused file in `public/`. The yield is small and this note says so.

## Result

- 47 files, +98 / -131 lines (net -33, counting the new 17-line `src/util.ts`); one dependency, one `.css` block and three exports gone.
- Entry bundle (`index-*.js`, minified): 271.90 kB to 269.60 kB, gzip 98.64 to 97.87. The `src/bundle.test.ts` budget (275 000) holds; the `highway` chunk is the same size.
- `npx tsc --noEmit`, `npx vitest run` (723 passed, 1 skipped) and `npm run build` pass. `scripts/offline.mjs` passes against the built `dist`.
- E2E (`E2E_ONLY`, not the whole suite), all passing: 1, 2, 2b, 3, 4 (every Theory lane), 5, 6, 7, 7b, 8, 12, 13, 14, 15, 16, 17, 17b, 18, 20. Features 9a, 9b and 10 need the whole day's data (every store key) and fail the same way on the untouched base commit when run as a subset, so they were not used as a signal.

## Removed

| what | where | size |
|---|---|---|
| dependency `@vexflow-fonts/bravura` (the font ships from `src/assets/bravura.woff2`; nothing imports the package) | `package.json`, `package-lock.json` | 8 lines; about 1.5 MB less in a fresh `node_modules` |
| dead exports `GradeKey`, `startSongs`, `ROOTS` (no importer anywhere, tests included) | `palette.ts`, `starters.ts`, `audio.ts` | 4 lines (and the now-unused `fromSpec` import) |
| `.tthumb` rule and `.tthumb svg` (no element ever gets the class) | `style.css` | 11 lines, about 190 bytes |
| `for (const [lv, k] of Object.entries(rank))` with `k` unused | `scripts/library/build.mjs` | 0 lines |
| `export` on 48 consts and functions that no other file, test or script names | 25 files under `src/` and `scripts/library/` | 0 lines; smaller API surface (found by a script that counts importers; `tsc`, vitest and the build prove nothing broke) |

## Merged duplicates

New `src/util.ts` (`esc`, `mean`, `median`, `pct`, `plural`), imported instead of re-declared:

- `esc` was written five times (`ui.ts`, `habit-ui.ts`, `memory.ts`, `readthrough.ts`, `app/state.ts`). All now one function. `kern.ts` keeps its own chained-`replace` version: it builds XML and `kern.ts` also runs in the library scripts. `app/state.ts` had a variant that did not escape `"`; it is now the quote-escaping one, which renders identically in text and is safe in attributes.
- `median` was identical in `coach.ts`, `even.ts`, `paced.ts`; `mean` in `coach.ts`, `even.ts`, `ear-play.ts`, `pulse.ts`, `touch.ts`, and as `avg` in `report.ts`; `pct` in `readthrough.ts` and `report.ts`; `plural` in `pulse.ts` and `report.ts`.
- `isBlack` was declared in `drill.ts`, `run.ts` and `highway.ts` as well as `osk.ts` (which already exported it); they import it. `drill.ts` `whites()` used a fourth copy of the black-key list inline.
- `barQ` (a bar's length in quarters) was in `song.ts`, `layout.ts` and `metronome.ts`; `song.ts` exports it.
- `pc` and `MAJOR` in `theory.ts` were copies of the ones exported by `ear.ts` (the two already import each other); `theory.ts` imports them.

## Considered and kept

- `app/state.ts` `median`: the upper median (and 0 on empty), not the true median. A different function; merging it would change results.
- `technique.ts` `MAJOR`/`MINOR`: carry a trailing 12; `drill.ts` `MAJOR`: importing `ear.ts` there would close a drill-ear-theory import cycle. `quantize.ts`/`layout.ts` `near`: different default epsilons. `technique.ts`/`pipeline.ts` `clamp`: different signatures.
- `--L` in `style.css`: no `var(--L)` anywhere, but it is the left-hand half of the `--R`/`--L` hand colours that DESIGN.md names; a token, not dead code.
- Exports used only by tests, left alone because a test uses them: `scoreFlags` (`flags.ts`, no production caller at all), `fromKern`, `inkBounds`, `touchPiece`, the `notation-fixtures` helpers, the card builders in `theory.ts`/`pulse.ts`, `cacheFor`/`route`/`shellCache` in `sw.ts`, and about 60 more. Several are seams worth keeping (`sw.ts`); `scoreFlags` and `fromKern` are the ones to look at if the pipeline never grows a caller.
- Exports a script finds "unused" but that are not: `theoryOpen`, `theoryNote`, `currentTheory` (`app/theory-ui.ts`) are reached through the lazy module object (`theoryUi?.theoryOpen()`), and `currentTheory` is the `__piano.theory()` hook that e2e feature 4 uses.
- 56 exported types and interfaces named in no other file (`Finding`, `LBar`, `QOut`, ...). They document each module's shape; removing `export` saves no lines.
- Scripts: every file in `scripts/` is named by `package.json`, another script, a test or a `docs/changes` note; `pickup-check.mjs` and `fit.mjs` are one-offs but documented (`partial.md`, `pipeline.md`). Boilerplate repeated across the `scripts/library/*.mjs` one-offs (`ROOT`, `arg`, reading `catalog.json`) and the two-line `p95`/`ab` copies between `song.ts`/`repeats.ts` and `pipeline.ts` were left: merging would couple standalone tools for a handful of lines.
- `public/`: every `art/*.webp` is reached by a catalogue or starter id, every `library/*` file is in `manifest.json`, every `samples/*` file is a root of an instrument in `instruments.ts` (checked file by file). Nothing to delete.
- Dependencies: `@capacitor/ios` is imported by nothing but is required by `cap sync ios`; the other six are imported.
- CSS: every class, id, custom property and `@keyframes` name appears in some non-comment source (or is in the `css.test.ts` guards); no selector is built dynamically without a literal anywhere in the source.
