# Sheets: Credits, Set up and Options under test; a sheet whose code does not arrive

## Bug fixed
perf3 moved `creditsDialog`, `setupDialog` and `tracksDialog` into the lazy `ui-sheets.ts`. When that chunk could not load (offline, no service worker), `openCredits`, `openSetup` and `openTracks` rejected unhandled (a `pageerror`) and nothing opened. Now `sheets(dialog)` in `src/app/state.ts` wraps the import: on failure the dialog opens with "Check the connection, then reload the page." and a Close button, and the caller returns. Three callers, one helper (`drawer.ts` twice, `library.ts`). The browser remembers a failed import until reload, so Try again would not help; the text says reload, like the play-screen failure.
Not changed: `openTracks` also imports `midi-tracks` in the same `Promise.all`; if that chunk is refused, Options still rejects unhandled. Same fix shape (catch, same message) if it is wanted; not chased because `midi-tracks` is also fetched on file import, which already shows its own error line. Not verified for the Songs file-import path.

## e2e feature 22 (fresh profile, about 1 s) and 22b (two contexts, about 3 s)
- 22: Settings > Credits has "Free, no subscription, no ads, no account.", all four Sounds blocks, every link `target=_blank rel=noopener`, no URL left as plain text, axe clean; Escape and the footer Close both return focus to the Credits button. Settings > Set up opens the four-row sheet, axe clean, Done returns focus to the Settings button (the drawer closes on the way in). A generated two-track MIDI (`@tonejs/midi`, written to the temp folder) imported through Add files: Options shows both tracks "2 of 2 in use", switching one off reads "1 of 2", axe clean, Cancel returns focus to the Options button.
- 22b slow: a `page.route` on `ui-views.ts` and `ui-sheets.ts` holds the requests behind a gate (not a fixed timer, so the check cannot race the chunk). Tapping Scales, Read and Progress shows the title (`.lib-head.wait`) and no body; 1.5 s later the gate opens and all three bodies draw; no console errors.
- 22b refused: the same routes `abort()`. Scales, Read, Progress each say "This page could not load"; Credits, Set up and Options each open with the plain-words message and close; Today and Songs still work; no `pageerror`. The refusals' own console lines (`ERR_FAILED`, "Failed to fetch dynamically imported module", the page catch) are dropped from the feature's error list, nothing else is.
- Checked that 22b fails on the old code (Credits never opens) and passes now.
- Dev server only: the routes match `/src/ui-views.ts`, so against `E2E_URL` pointing at a built preview (hashed chunk names) they would hold nothing.
- Lane: after feature 12 in the main profile's lane.

## Verified
`npx tsc --noEmit` clean; `npx vitest run` 57 files, 760 passed, 4 skipped (the bundle budget test included); `E2E_ONLY="^(22|11|12)"` 5 of 5 pass. The full suite was not run.
