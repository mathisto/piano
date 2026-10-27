# Polish 5 (branch feature/polish5)

Four small items from the Paced and Hardening "not done" lists. Headless Chrome only (Playwright, 820x1180 and 1180x820, swiftshader WebGL). Nothing here was run on the iPad, with the silent switch, with VoiceOver or with the FP-10.

## 1. A beat marker in a paced run
The Perform beat dots (`#beats` in the dock) now show in a Sight Run with Pace: Steady beat. The Metronome button stays hidden (the click is always on), only the dots show. The run's bars are 4/4, so there are four dots, the first larger, the lit one following the beat from `beatAt`. The count-in lights 1 to 4 too (a paced-only extension in `Dock.dots`: Perform's count-in still shows no dots). No new component, CSS or animation: a dot is on or off, nothing transitions, so reduced motion needs nothing.
- Checked at both sizes: count-in `1000 0100 0010 0001`, then `1000 0100 0010` in the run; axe clean on the play screen; features 2b and 17b pass.
- Not done: the dots sit in the dock, a long way below the staff in portrait (820x1180) and close in landscape. A marker beside the staff would be a layout change; judged on the iPad first.

## 2. Songs tab stops
A page of the open library is 50 rows of four buttons, about 190 tab stops (counted: 192 with the 38 bundled pieces). Added a bypass: after the Composer and Level filters a button "Skip the 50 pieces listed" (`#libSkip`) that is out of sight until it takes focus, then sits at the right of the tools row, and moves focus to the group after the list (`#libEnd`, `tabindex=-1`, where Show more and Save for offline are). Tab order: search, composer, level, skip, rows. Hidden when no piece is listed. WCAG 2.4.1.
- Checked: three Tabs from the search box reach it, Enter lands on `#libEnd`, axe clean on Songs with it focused (both sizes), features 7, 7b, 11 pass.
- Not done: a per-row single stop (a roving toolbar, arrow keys between a row's four buttons) would take it from 190 to 50 stops without a skip, but it changes the row's keyboard model and every e2e click path. Proposed, not built. The starter and Your files lists (a handful of rows) have no skip.

## 3. The highway under prefers-reduced-motion
Read `src/highway.ts`: the Effects setting is already Off or Calm only (the Arcade tier is gone), so the old "cap to Calm" in `effects()` capped nothing. There is no shake and no particles in the file. What moved under Calm: (a) the glow at the key that swells to 1.9 times its size as it fades; (b) the amber ring round the waiting note and the ghost key tint, a sine at about 1.1 Hz that never stops. Now, with the OS asking for reduced motion: the glow stays its size and fades; the ring and ghost tint hold at a steady 0.85. The lane tint and the red wrong-key cross are fades and stay. The check reads the media query live (`.matches`), not once, so a change while the app is open applies at once.
- Measured with Chrome emulation (`reducedMotion: 'reduce'` against `'no-preference'`), Learn mode, the first starter piece: 1 second of the waiting canvas gives 8 distinct frames with no preference and 1 with reduce; after a key press the glow sprite's scale reads 1.21 to 1.75 (alpha 0.74 to 0.07) against a constant 0.92 (alpha 0.74 to 0.10). `effects()` removed (no other caller).
- Not measured: the staff cursor and the rest of the CSS side were covered by Hardening. Sheet view already draws no effects.

## 4. `pickup` and `tempo` in the bundled manifest
Findings: all 38 manifest ids are in the live catalogue (https://pianoforte.mattkelly.io/corpus/catalog.json, 2,241 pieces) with the same sha256, so the values apply to the same bytes. When the corpus has answered once, `merge` lets the catalogue's piece win, so the bundled pieces already get their `pickup` and `tempo` there; the gap was only the first run with no network (and a stored catalogue that no longer reads). `libSong` reads `p.pickup`, `p.tempo` and the flag `tempo-estimated` from the Piece; `builtin()` set none of them. `pickup` 0 means "the .ly states none" and is not the same as absent (the guess stays), so zeros are copied too.
- 23 pieces carry a `pickup` (0, 0.5 or 1), 15 have none (the catalogue states none; the guess stays), three carry a `tempo`: mutopia-37 56, mutopia-1540 100, mutopia-1778 90, all flagged as estimates (`tempoGuess`, which `builtin` turns into the `tempo-estimated` flag).
- Source of truth is `scripts/library-sources.json`, from which `scripts/fetch-library.mjs` writes the manifest; both now carry the fields (generator two lines, `LibraryEntry` three optional fields, `builtin` three lines). `public/library/manifest.json` was patched by script to what the generator would write; I did not run the generator (it refetches 38 files from the network). The sha and file checks in `src/library.test.ts` pass untouched; a new test in `src/catalog.test.ts` guards the three fields.
- The values are a snapshot of the catalogue today. If the pipeline re-derives a pickup or tempo, `library-sources.json` goes stale; nothing checks them against the catalogue.

## Checks
`npx tsc --noEmit` clean; `npx vitest run` 54 files, 720 passed (1 skipped, as before). `E2E_ONLY='^(2b|7|7b|11|17b) '` 5 of 5 passed. Axe by hand on Songs (also with the skip button focused) and the paced play screen at 820x1180 and 1180x820: no violations. The full `npm run e2e` was not run.

## DESIGN.md lines to add (not applied here)
- Metronome (line "`.metro` in the dock"): add "In a paced Sight Run the dock shows the beat dots with no Metronome button (the click is always on); the count-in lights the four dots in turn, the first beat's dot larger as in Perform."
- Songs, the open library: "After the Level filter a Skip button, `.btn.ghost` visually hidden until it takes focus, then in the tools row at the right: 'Skip the 50 pieces listed'. Activating it moves focus to the end of the list (the Show more row, a skip target with no focus ring). Hidden when no piece is listed."
- Effects (lines 329, 553, 624 "cap canvas effects to Calm"): replace with "Under `prefers-reduced-motion` the highway's glow does not swell (it fades at one size) and the waiting-note ring and ghost key tint hold steady instead of pulsing; Calm is the only tier, so there is nothing to cap."
- Known issues (line 673): add "The beat dots sit in the dock, far from the staff in portrait."
