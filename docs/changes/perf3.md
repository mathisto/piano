# Load time, round three: pages, sheets and results load on use; the pedal coach reads chords like the Lead sheet

## 1. Boot JS 274 000 budget -> 241 200 (about 33 kB, 12%)
`node scripts/bootmods.mjs [n]` (new) lists boot modules by minified rendered size, with the same chunk walk as `src/bundle.test.ts`
(it reads about 700 B under the test's number: the test's build runs in test mode). Before: `ui.ts` was 62 kB of the 273 kB, by far
the biggest module, and most of it drew pages and sheets that are not on the first screen. `ui.ts` is now 19.5 kB and three new
modules load on use (functions moved verbatim; only imports and `export`s changed):

| module | holds | loaded by | when |
|---|---|---|---|
| `ui-views.ts` (23.5 kB chunk) | `readView`, `runForm`, `techniqueView`, `progressView`, `scalesView`, `theoryView` | `showRead`, `showScales`, `showTechnique`, `showProgress` (awaited `import()`), `theory-ui` (static, already lazy) | idle prefetch after Today (`main.ts`) |
| `ui-results.ts` (9 kB) | `results`, `drillResults`, `runResults`, `pacedResults` | the three finish paths (`results.ts`, `drill.ts`), awaited `import()` | with the stage (`stageCode()`), so it is there before any piece can finish |
| `ui-sheets.ts` (4.8 kB) | `creditsDialog`, `setupDialog`, `tracksDialog` (with the sounds credit text) | `openCredits`, `openSetup` (now async), `openTracks` | idle prefetch |

Stayed in `ui.ts` because boot code needs them: `head`, `meter`, `weekBlock`, `FREE`, `keyTouchSelect`, `CLEFS`, `HANDS`, `cardName`, `runTitle`, `RUN_START`, `CAL_NOTES`.
Not moved: `coach.ts` (11 kB; `game.ts` needs `marks`), `scales.ts` and `drill.ts` (the stores and Today need them), `guide.ts` (Today's first-week card), `capacitor/core` (15.5 kB, platform check at boot). Next biggest after this: `scales.ts` 17, `capacitor/core` 15.5, `drill.ts` 15, `game.ts` 13.8, `app/stage.ts` 12.

First use on a slow link: `showSection` now draws the page's title (`<div class="lib-head wait">`) into a section that has never been drawn, so a tap on Scales shows "Scales" at once and the body when `ui-views` arrives (checked with each chunk delayed 2.5 s: Scales, Read, Technique, Progress, Credits and Set up all appear, no console errors; Options on an imported two-track MIDI with `ui-sheets` delayed 2 s). Credits, Set up and Options open when their chunk is in, as they already did for their data. The e2e `nav` helper waits for a child that is not `.wait`.
If the `ui-sheets` chunk fails to load, the sheet says so (fixed in `sheets.md`).
Ratchet: `bundle.test.ts` BUDGET 241 200 (measured 240 6xx, about 580 B margin) and `ui-sheets|ui-views|ui-results` added to the modules that must not be in boot.

## 2. The pedal coach uses the Lead sheet's tuned chord match
`src/chords.ts` (new): `windows`, `SHAPES`, `TUNE`, `BASS_SHARE`, `NEAR`, `BIG`, `chordAt`, moved out of `lead.ts` and `pedal.ts`. `pedal.ts` lost `chordIn` and its own four-shape table;
`changes()` keys a window by `${root}:${k}` of `chordAt` (silence is skipped as before). `lead.ts` keeps `chordsOf` and re-exports `chordAt`, `SHAPES`, `TUNE`; `chordeval.run.test.ts` takes `windows` from `./chords`.
Cost in boot: +about 680 B (it was already boot code through `pedal.ts`; the match is bigger than the one it replaced). Fits with 33 kB to spare.
- Every pedal test and coach test passes with no fixture changed; Lead tests, `chordeval` tests unchanged.
- Caveat, reality: the 70.1% root figure is for Lead sheet windows against analysed pieces. The pedal coach has no ground truth (it would need recorded pedal data); what is verified is that the synthetic cases and e2e 20 still say what they said. The tuned match also has the seventh/major-seventh/diminished shapes and a bass bonus, so on real pieces it will call a change at slightly different bars than before (which way, and by how much, is not measured; no real pedal data).

## Verified
`npx tsc --noEmit` clean; `npx vitest run` 57 files, 760 passed, 4 skipped; `npm run build`. `E2E_ONLY` runs, all passing: 0, 0b, 1, 2, 2b, 3, 4 (all trainers in the first pass; keys and chords again after the last edit), 6, 8, 9a, 9b, 10, 11 (axe), 12, 13, 19, 20 (Pedal), 21 (Lead sheet). The full `npm run e2e` was not run. Not covered by any e2e feature, checked by hand with Playwright against `vite preview`: Credits, Options (tracks dialog), Set up from the drawer.
Not measured: `scripts/perf.mjs` (Today time); the boot JS is 33 kB smaller, but the numbers are not taken.

## Load bench after this change (lead, 2026-10-27)
`node scripts/perf.mjs 5` at 4x CPU, headless Chrome: Today 315 ms (309 to 325), script 161 ms, task 290 ms, Songs 237 ms, first piece to start card 1,418 ms, 235 kB of JS before Today. Against the perf.md branch figures (Today 456 to 466 ms, 302 kB) that is about a third sooner on a different day's machine load, so read it as a direction, not a measured A/B.
