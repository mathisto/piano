# Beat marker at the staff (branch feature/beatmark)

In a paced Sight Run the beat dots sat in the dock, far below the staff in portrait, where a reader's eyes never are. The beat now shows in a slim bar of its own on the top edge of the staff pane. Headless Chrome only (Playwright, swiftshader); nothing was run on the iPad, with the silent switch or with a real reader.

## Built
- `#beatBar.beat-bar` (in `ui.ts`, first child of `#play`, `hidden` unless the game is paced): four 4px segments across the full width, 6px apart, Line Strong; the one on the beat is Ink. A grid row of its own (`auto var(--rows)` via `:has(> #beatBar:not([hidden]))`, as the Memorise strip does), so it never covers notation; 13px tall at both sizes. The segments span the width so the beat is seen in peripheral vision wherever on the line the eye is.
- Driven by the same state as the dock dots: `Dock.dots()` (`beatAt` from the game clock, plus the paced count-in 1 to 4). It writes into the bar when the game is paced, into `#beats` in the dock otherwise. No new timer, no new state.
- The dock dots are dropped in a paced run: redundant, and the Metronome block (button and dots) is now simply hidden in every drill as it was before polish5. Perform and Learn with the metronome on are unchanged (the bar is paced-only; feature 17b passes).
- No animation: a segment is on or off, `transition` is none, so `prefers-reduced-motion` needs nothing (checked: same sequence and no errors with emulated reduce).
- Files: `src/dock.ts`, `src/ui.ts`, `src/metronome.css`, `src/css.test.ts` (the row-template test also exempts `#beatBar`), e2e 2b asserts one lit segment and no dock dots.

## Checked
- 820x1180 and 1180x820, looked at: ready card, count-in, run. Sampled by script: bar `1000 0100 0010 0001` through the count-in, then `1000 0100 0010 0001` in the run; `#beats` holds no dots. Bar sits between the header and the staff, the staff keeps its size less 13px. axe clean on the play screen at both sizes, also with reduced motion.
- `npx tsc --noEmit`, `npx vitest run` (55 files, 739 passed, 1 skipped); `E2E_ONLY='^(2b|17|17b|11) '` pass. Full `npm run e2e` not run.

## Not verified / open
- Whether a real reader notices a 4px segment in the periphery: a guess, judge on the iPad. If too quiet, thicken it (a token away) or light the lit segment Lamp (not done: Lamp is the now-marker of the cursor, One Lamp Rule).
- Perform with the metronome keeps its dock dots (they are far from the staff in portrait too); extending the bar there would put a new row into every Perform screen, not trivial, not done.
- The bar is paced-only, so a count-in in a self-paced Sight Run still shows nothing, as before.

## DESIGN.md lines (not applied here)
- Replace the line "In a paced Sight Run the dock shows the beat dots with no Metronome button ... In portrait they sit in the dock, far from the staff." with: "In a paced Sight Run the beat is shown in `.beat-bar`, a row of its own between the header and the staff (13px: four 4px segments across the full width, 6px gaps, Radius 2, Line Strong; the segment on the beat is Ink; nothing transitions). The count-in lights the four in turn. The dock shows no Metronome block in a drill. Never over the notation: it is a grid row (`auto var(--rows)`), like the Memorise strip."
- Known issues: delete "The beat dots sit in the dock, far from the staff in portrait." (polish5) for paced runs; Perform's dots are still in the dock.
